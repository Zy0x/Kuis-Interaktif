// Supabase Edge Function: upload-drive
// Upload media langsung ke Google Drive Pro pengguna (Rule 9 & Rule 10)
// Kredensial service account disimpan aman di Supabase Secrets:
// - GDRIVE_CLIENT_EMAIL
// - GDRIVE_PRIVATE_KEY
// - GDRIVE_FOLDER_ID
// - GDRIVE_PROJECT_ID

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Helper: base64url encode
function base64url(input: string | Uint8Array): string {
  let binStr = "";
  if (typeof input === "string") {
    const bytes = new TextEncoder().encode(input);
    for (let i = 0; i < bytes.length; i++) {
      binStr += String.fromCharCode(bytes[i]);
    }
  } else {
    for (let i = 0; i < input.length; i++) {
      binStr += String.fromCharCode(input[i]);
    }
  }
  return btoa(binStr)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Convert PEM PKCS#8 private key string to ArrayBuffer for WebCrypto
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleanPem = pem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN [A-Z ]+-----/g, "")
    .replace(/-----END [A-Z ]+-----/g, "")
    .replace(/\s+/g, "");
  const raw = atob(cleanPem);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    buf[i] = raw.charCodeAt(i);
  }
  return buf.buffer;
}

// Generate Google OAuth2 Access Token using Refresh Token (Personal Google One Account)
async function getAccessTokenFromRefreshToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("refresh_token", refreshToken);
  params.append("grant_type", "refresh_token");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal autentikasi Google OAuth2 Refresh Token (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

// Generate Google OAuth2 Access Token using RS256 JWT assertion (Service Account / Shared Drive)
async function getGoogleDriveAccessToken(clientEmail: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(dataToSign)
  );

  const jwt = `${dataToSign}.${base64url(new Uint8Array(signature))}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Gagal autentikasi Google OAuth2 (${tokenRes.status}): ${errText}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

// Helper: Temukan atau buat folder kuis secara dinamis di Google Drive Pro (Subfolder per Kuis)
async function getOrCreateQuizFolder(
  accessToken: string,
  parentFolderId: string,
  folderName: string
): Promise<{ folderId: string; folderName: string }> {
  const safeName = folderName.replace(/['\\\/]/g, " ").trim().slice(0, 80);
  if (!safeName) return { folderId: parentFolderId, folderName: "Root" };

  try {
    const escapedName = safeName.replace(/'/g, "\\'");
    const q = `'${parentFolderId}' in parents and name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        return { folderId: searchData.files[0].id, folderName: searchData.files[0].name };
      }
    } else {
      console.warn("Pencarian folder kuis Drive notice:", await searchRes.text());
    }

    // Buat subfolder baru jika belum ada
    const createRes = await fetch(
      "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: safeName,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentFolderId],
        }),
      }
    );

    if (createRes.ok) {
      const folderData = await createRes.json();
      const newFolderId = folderData.id;

      // Set permission folder agar berkas publik dapat diakses
      try {
        await fetch(
          `https://www.googleapis.com/drive/v3/files/${newFolderId}/permissions?supportsAllDrives=true`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ role: "reader", type: "anyone" }),
          }
        );
      } catch (err) {
        console.warn("Peringatan izin folder publik:", err);
      }

      return { folderId: newFolderId, folderName: safeName };
    } else {
      console.warn("Gagal membuat folder kuis baru di Drive:", await createRes.text());
    }
  } catch (err) {
    console.warn("Kesalahan proses folder kuis Google Drive:", err);
  }

  return { folderId: parentFolderId, folderName: "Root" };
}

// Upload file to Google Drive and set permission to anyone reader
async function uploadToGoogleDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  fileBytes: Uint8Array,
  folderName: string = "Root"
) {
  const boundary = `-------KuisGdriveBoundary${Date.now()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const mediaPartHeader = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  const encoder = new TextEncoder();
  const part1 = encoder.encode(metadataPart);
  const part2Header = encoder.encode(mediaPartHeader);
  const part3 = encoder.encode(closeDelimiter);

  // Gabungkan ke satu Uint8Array
  const totalLength = part1.byteLength + part2Header.byteLength + fileBytes.byteLength + part3.byteLength;
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  combined.set(part1, offset);
  offset += part1.byteLength;
  combined.set(part2Header, offset);
  offset += part2Header.byteLength;
  combined.set(fileBytes, offset);
  offset += fileBytes.byteLength;
  combined.set(part3, offset);

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: combined,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Google Drive API upload gagal (${uploadRes.status}): ${errText}`);
  }

  const uploadedFile = await uploadRes.json();
  const fileId = uploadedFile.id;

  // Set file permission agar bisa dilihat publik (guru, siswa)
  try {
    const permRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "reader", type: "anyone" }),
      }
    );
    if (!permRes.ok) {
      console.warn("Peringatan izin file publik:", await permRes.text());
    }
  } catch (err) {
    console.warn("Gagal menyetel izin publik file:", err);
  }

  // Generate Direct Proxy URL via Supabase Edge Function & Google Drive links
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://colpcgesngntiztjeprg.supabase.co";
  const directUrl = `${supabaseUrl}/functions/v1/upload-drive?fileId=${fileId}`;
  const googleDirectUrl = `https://drive.google.com/uc?id=${fileId}&export=view`;
  const thumbnailUrl = `${supabaseUrl}/functions/v1/upload-drive?fileId=${fileId}&thumb=1`;
  const webViewLink = `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`;

  return {
    success: true,
    fileId,
    name: uploadedFile.name,
    mimeType: uploadedFile.mimeType,
    folderId,
    folderName,
    directUrl,
    googleDirectUrl,
    thumbnailUrl,
    webViewLink,
  };
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const refreshToken = Deno.env.get("GDRIVE_REFRESH_TOKEN");
    const clientId = Deno.env.get("GDRIVE_CLIENT_ID");
    const clientSecret = Deno.env.get("GDRIVE_CLIENT_SECRET");
    const clientEmail = Deno.env.get("GDRIVE_CLIENT_EMAIL");
    const privateKey = Deno.env.get("GDRIVE_PRIVATE_KEY");
    const defaultFolderId = Deno.env.get("GDRIVE_FOLDER_ID") || "1piF6GTYClcAP3duiwub3F1UB35Fb9IO-";

    let authMode: "refresh_token" | "service_account" | null = null;
    if (refreshToken && clientId && clientSecret) {
      authMode = "refresh_token";
    } else if (clientEmail && privateKey) {
      authMode = "service_account";
    }

    if (!authMode) {
      return new Response(
        JSON.stringify({
          error: "Konfigurasi Google Drive belum lengkap di Supabase Secrets. Harus menyertakan GDRIVE_REFRESH_TOKEN + GDRIVE_CLIENT_ID + GDRIVE_CLIENT_SECRET (untuk Akun Google One Pribadi) ATAU GDRIVE_CLIENT_EMAIL + GDRIVE_PRIVATE_KEY (untuk Google Workspace Shared Drive).",
          success: false,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Helper untuk mengambil access token sesuai mode
    const fetchAccessToken = async () => {
      if (authMode === "refresh_token") {
        return await getAccessTokenFromRefreshToken(clientId!, clientSecret!, refreshToken!);
      } else {
        return await getGoogleDriveAccessToken(clientEmail!, privateKey!);
      }
    };

    // Method GET: Image Delivery Proxy & Health Check
    if (req.method === "GET") {
      const reqUrl = new URL(req.url);
      const fileId = reqUrl.searchParams.get("fileId") || reqUrl.searchParams.get("id");

      // Layani berkas media langsung ke browser (Zero-CORS, High-Performance Streaming)
      if (fileId) {
        try {
          const accessToken = await fetchAccessToken();
          const driveRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (!driveRes.ok) {
            return new Response(`Media Google Drive tidak ditemukan (${driveRes.status})`, {
              status: driveRes.status,
              headers: { ...corsHeaders, "Content-Type": "text/plain" },
            });
          }

          const mediaType = driveRes.headers.get("content-type") || "image/png";
          const imageBytes = await driveRes.arrayBuffer();

          return new Response(imageBytes, {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": mediaType,
              "Cache-Control": "public, max-age=31536000, immutable",
              "Cross-Origin-Resource-Policy": "cross-origin",
            },
          });
        } catch (err: any) {
          return new Response(`Kesalahan streaming media: ${err?.message}`, {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "text/plain" },
          });
        }
      }

      // Health Check Response jika tanpa fileId
      return new Response(
        JSON.stringify({
          status: "ok",
          service: "google-drive-upload",
          authMode,
          clientEmail: clientEmail || "oauth-user",
          folderId: defaultFolderId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let fileBytes: Uint8Array | null = null;
    let fileName = `media_${Date.now()}`;
    let mimeType = "image/png";
    let targetFolderId = defaultFolderId;

    let quizPin = "";
    let quizTitle = "";
    let quizId = "";
    let requestedFolderName = "";

    // A. Penanganan Multipart Form Data
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      const folderOverride = formData.get("folderId");
      const nameOverride = formData.get("fileName") || formData.get("name");

      if (folderOverride && typeof folderOverride === "string") {
        targetFolderId = folderOverride;
      }

      const pinParam = formData.get("quizPin") || formData.get("pin");
      if (pinParam && typeof pinParam === "string") quizPin = pinParam.trim();

      const titleParam = formData.get("quizTitle") || formData.get("title");
      if (titleParam && typeof titleParam === "string") quizTitle = titleParam.trim();

      const idParam = formData.get("quizId") || formData.get("id");
      if (idParam && typeof idParam === "string") quizId = idParam.trim();

      const customFolder = formData.get("folderName");
      if (customFolder && typeof customFolder === "string") requestedFolderName = customFolder.trim();

      if (!file || !(file instanceof File)) {
        return new Response(
          JSON.stringify({ error: "Berkas 'file' tidak ditemukan dalam form data", success: false }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      fileName = (nameOverride as string) || file.name || fileName;
      mimeType = file.type || "application/octet-stream";
      const buffer = await file.arrayBuffer();
      fileBytes = new Uint8Array(buffer);
    } 
    // B. Penanganan Application JSON
    else if (contentType.includes("application/json")) {
      const body = await req.json();

      // Check Status Action
      if (body.action === "check_status") {
        const accessToken = await fetchAccessToken();
        const folderCheckRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${defaultFolderId}?fields=id,name,mimeType,capabilities,driveId&supportsAllDrives=true`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const folderData = await folderCheckRes.json();

        return new Response(
          JSON.stringify({
            success: folderCheckRes.ok,
            service: "google-drive-upload",
            authMode,
            folder: folderData,
            clientEmail: clientEmail || "oauth-user",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (body.folderId) {
        targetFolderId = body.folderId;
      }

      if (body.quizPin || body.pin) quizPin = String(body.quizPin || body.pin).trim();
      if (body.quizTitle || body.title) quizTitle = String(body.quizTitle || body.title).trim();
      if (body.quizId || body.id) quizId = String(body.quizId || body.id).trim();
      if (body.folderName) requestedFolderName = String(body.folderName).trim();

      // Base64 Upload
      if (body.base64) {
        let rawB64 = body.base64;
        if (rawB64.includes(";base64,")) {
          const parts = rawB64.split(";base64,");
          const mimeMatch = parts[0].match(/data:(.*)/);
          if (mimeMatch) mimeType = mimeMatch[1];
          rawB64 = parts[1];
        } else if (body.mimeType) {
          mimeType = body.mimeType;
        }

        if (body.fileName) fileName = body.fileName;
        const binStr = atob(rawB64);
        fileBytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          fileBytes[i] = binStr.charCodeAt(i);
        }
      } 
      // Image URL Download & Re-upload to Drive
      else if (body.imageUrl) {
        const imgRes = await fetch(body.imageUrl);
        if (!imgRes.ok) {
          throw new Error(`Gagal mengunduh gambar dari URL: ${body.imageUrl} (${imgRes.status})`);
        }
        mimeType = imgRes.headers.get("content-type") || "image/jpeg";
        fileName = body.fileName || `web_import_${Date.now()}`;
        const buffer = await imgRes.arrayBuffer();
        fileBytes = new Uint8Array(buffer);
      } else {
        return new Response(
          JSON.stringify({ error: "Permintaan harus menyertakan berkas (file), base64, atau imageUrl.", success: false }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Content-Type tidak didukung. Gunakan multipart/form-data atau application/json.", success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!fileBytes || fileBytes.length === 0) {
      return new Response(
        JSON.stringify({ error: "Data berkas kosong", success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Dapatkan Google OAuth2 Token
    const accessToken = await fetchAccessToken();

    // Resolusi Sub-Folder Kuis Otomatis (Rule: Terorganisir & Terstruktur Rapi per Kuis)
    let resolvedFolderName = requestedFolderName;
    if (!resolvedFolderName) {
      if (quizPin) {
        const cleanTitle = quizTitle ? quizTitle.replace(/[\\/:*?"<>|]/g, " ").trim().slice(0, 45) : "";
        resolvedFolderName = cleanTitle ? `[PIN ${quizPin}] ${cleanTitle}` : `[PIN ${quizPin}] Kuis`;
      } else if (quizTitle) {
        const cleanTitle = quizTitle.replace(/[\\/:*?"<>|]/g, " ").trim().slice(0, 45);
        resolvedFolderName = `[Draf] ${cleanTitle || "Kuis Baru"}`;
      }
    }

    let activeFolderId = targetFolderId;
    let finalFolderName = "Root";
    if (resolvedFolderName) {
      const folderResult = await getOrCreateQuizFolder(accessToken, targetFolderId, resolvedFolderName);
      activeFolderId = folderResult.folderId;
      finalFolderName = folderResult.folderName;
    }

    // Unggah berkas ke subfolder kuis terkait di Google Drive Pro
    const result = await uploadToGoogleDrive(accessToken, activeFolderId, fileName, mimeType, fileBytes, finalFolderName);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Kesalahan Edge Function upload-drive:", error);
    let userMsg = error?.message || "Terjadi kesalahan saat memproses unggahan ke Google Drive";
    
    // Deteksi batasan kuota Service Account pada folder personal Google Drive
    if (userMsg.includes("storageQuotaExceeded") || userMsg.includes("Service Accounts do not have storage quota")) {
      userMsg = "Google Drive Kuota Penuh / Pembatasan Service Account: Service account Google memiliki kuota 0 byte di folder pribadi. Agar kuota Google Pro Anda aktif: Buat 'Drive Bersama' (Shared Drive) di Google Drive Anda lalu masukkan email service account sebagai Pengelola Konten, ATAU gunakan OAuth2 Refresh Token akun Google One Pro Anda.";
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: userMsg,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
