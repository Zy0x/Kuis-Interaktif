// Supabase Edge Function: delete-drive-folder
// Hapus folder Google Drive Pro kuis beserta seluruh isinya (Rule 9 & Rule 10)
// Dipanggil saat guru menghapus kuis — memastikan tidak ada sampah media tertinggal.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Auth Helpers (sama dengan upload-drive) ────────────────────────────────────

function base64url(input: string | Uint8Array): string {
  let binStr = "";
  if (typeof input === "string") {
    const bytes = new TextEncoder().encode(input);
    for (let i = 0; i < bytes.length; i++) binStr += String.fromCharCode(bytes[i]);
  } else {
    for (let i = 0; i < input.length; i++) binStr += String.fromCharCode(input[i]);
  }
  return btoa(binStr).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleanPem = pem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN [A-Z ]+-----/g, "")
    .replace(/-----END [A-Z ]+-----/g, "")
    .replace(/\s+/g, "");
  const raw = atob(cleanPem);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

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
  if (!res.ok) throw new Error(`OAuth2 refresh token error (${res.status}): ${await res.text()}`);
  return (await res.json()).access_token;
}

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
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(dataToSign));
  const jwt = `${dataToSign}.${base64url(new Uint8Array(signature))}`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  if (!tokenRes.ok) throw new Error(`Service Account auth error (${tokenRes.status}): ${await tokenRes.text()}`);
  return (await tokenRes.json()).access_token;
}

// ── Supabase Helper: Ambil drive_folder_id ─────────────────────────────────────

async function getStoredDriveFolderId(quizId: string): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceKey || !quizId) return null;
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/quizzes?id=eq.${encodeURIComponent(quizId)}&select=drive_folder_id&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          Accept: "application/json",
        },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0]?.drive_folder_id || null;
  } catch {
    return null;
  }
}

/** Hapus folder Google Drive beserta seluruh isinya */
async function deleteDriveFolder(accessToken: string, folderId: string): Promise<{ deleted: boolean; message: string }> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}?supportsAllDrives=true`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (res.status === 204 || res.status === 200) {
      return { deleted: true, message: `Folder ${folderId} berhasil dihapus dari Google Drive.` };
    }

    if (res.status === 404) {
      return { deleted: true, message: `Folder ${folderId} sudah tidak ada di Google Drive (404 — dianggap bersih).` };
    }

    const errText = await res.text();
    return { deleted: false, message: `Gagal menghapus folder Drive (${res.status}): ${errText}` };
  } catch (err: any) {
    return { deleted: false, message: `Kesalahan hapus folder Drive: ${err?.message}` };
  }
}

// ── Main Handler ───────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method tidak didukung. Gunakan POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const quizId: string = body.quizId || "";
    const directFolderId: string = body.folderId || "";

    // Resolusi folder ID: dari Supabase (via quizId) atau langsung (via folderId)
    let folderId = directFolderId;
    if (quizId && !folderId) {
      const stored = await getStoredDriveFolderId(quizId);
      if (stored) folderId = stored;
    }

    if (!folderId) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Tidak ada folder Google Drive yang terkait dengan kuis ini — tidak perlu penghapusan.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Autentikasi Google Drive
    const refreshToken = Deno.env.get("GDRIVE_REFRESH_TOKEN");
    const clientId = Deno.env.get("GDRIVE_CLIENT_ID");
    const clientSecret = Deno.env.get("GDRIVE_CLIENT_SECRET");
    const clientEmail = Deno.env.get("GDRIVE_CLIENT_EMAIL");
    const privateKey = Deno.env.get("GDRIVE_PRIVATE_KEY");

    let accessToken: string;
    if (refreshToken && clientId && clientSecret) {
      accessToken = await getAccessTokenFromRefreshToken(clientId, clientSecret, refreshToken);
    } else if (clientEmail && privateKey) {
      accessToken = await getGoogleDriveAccessToken(clientEmail, privateKey);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Konfigurasi Google Drive belum lengkap di Supabase Secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hapus folder dari Google Drive
    const { deleted, message } = await deleteDriveFolder(accessToken, folderId);

    return new Response(
      JSON.stringify({ success: deleted, folderId, message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("delete-drive-folder error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Terjadi kesalahan internal." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
