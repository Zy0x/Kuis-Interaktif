import http from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
  }
  return env;
}

let isHandled = false;

async function processAuthorizationCode(code, { clientId, clientSecret, redirectUri, projectId, token, anonKey }) {
  if (isHandled) return;
  isHandled = true;

  console.log('\n=============================================================');
  console.log('🔄 Memproses Authorization Code Google...');
  console.log('=============================================================');

  try {
    // 1. Tukar kode dengan access_token dan refresh_token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.refresh_token) {
      console.error('❌ Respon Token Gagal:', tokenData);
      throw new Error(tokenData.error_description || tokenData.error || 'Refresh token tidak ditemukan.');
    }

    const refreshToken = tokenData.refresh_token;
    console.log('🎉 REFRESH TOKEN BERHASIL DIPEROLEH!');

    // 2. Kirim secrets ke Supabase
    console.log('⚡ Mengunggah secrets ke Supabase Management API...');
    const supabaseSecretsRes = await fetch(`https://api.supabase.com/v1/projects/${projectId}/secrets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        { name: 'GDRIVE_CLIENT_ID', value: clientId },
        { name: 'GDRIVE_CLIENT_SECRET', value: clientSecret },
        { name: 'GDRIVE_REFRESH_TOKEN', value: refreshToken },
      ]),
    });

    if (!supabaseSecretsRes.ok) {
      console.warn('⚠️ Peringatan respons Supabase Secrets:', await supabaseSecretsRes.text());
    } else {
      console.log('✅ Secrets GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, dan GDRIVE_REFRESH_TOKEN berhasil tersimpan di Supabase!');
    }

    // 3. Pengujian live upload
    console.log('\n🧪 Menguji coba upload file riil ke Google Drive Pro via Edge Function...');
    const testPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEeQHzc1f/ygAAAABJRU5ErkJggg==';
    
    // Beri jeda 2 detik agar secret tersinkronisasi di Supabase Edge Function
    await new Promise(r => setTimeout(r, 2500));

    const uploadTestRes = await fetch(`https://${projectId}.supabase.co/functions/v1/upload-drive`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64: testPng,
        fileName: `test_oauth_verification_${Date.now()}.png`,
        mimeType: 'image/png',
      }),
    });

    const uploadResult = await uploadTestRes.json();
    console.log('📊 Hasil Pengujian Upload Edge Function:', uploadResult);

    if (uploadResult.success) {
      console.log('\n🌟 SUKSES 100%! Kuota Google Drive Pro Anda kini aktif digunakan!');
      console.log('🔗 URL Gambar CDN:', uploadResult.directUrl);
    } else {
      console.log('⚠️ Upload response:', uploadResult);
    }

    return true;
  } catch (err) {
    console.error('❌ Gagal memproses kode otorisasi:', err);
    return false;
  }
}

async function main() {
  console.log('\n=============================================================');
  console.log('🚀 GOOGLE DRIVE PRO OAUTH2 SETUP (AKUN PRIBADI @gmail.com)');
  console.log('=============================================================\n');

  const env = loadEnv();
  const token = process.env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN || '';
  const projectId = process.env.SUPABASE_PROJECT_ID || env.SUPABASE_PROJECT_ID || '';
  const anonKey = env.VITE_SUPABASE_ANON_KEY || '';

  const clientId = process.argv[2] || process.env.GDRIVE_CLIENT_ID || '';
  const clientSecret = process.argv[3] || process.env.GDRIVE_CLIENT_SECRET || '';

  const PORT = 8085;
  const redirectUri = `http://localhost:${PORT}`;

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive',
    access_type: 'offline',
    prompt: 'consent',
  }).toString();

  console.log('🌐 Server lokal aktif di:', redirectUri);
  console.log('\n🔗 TAUTAN OTORISASI GOOGLE:');
  console.log(authUrl);
  console.log('-------------------------------------------------------------\n');

  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    if (parsedUrl.pathname === '/' || parsedUrl.pathname === '') {
      const code = parsedUrl.query.code;
      const error = parsedUrl.query.error;

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h2>❌ Akses ditolak: ${error}</h2><p>Silakan ulangi kembali.</p>`);
        console.error('❌ Akses ditolak oleh pengguna:', error);
        return;
      }

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <div style="font-family: system-ui, sans-serif; text-align: center; padding: 40px;">
            <h1 style="color: #16a34a;">🎉 Otentikasi Google Drive Pro Berhasil!</h1>
            <p style="font-size: 16px; color: #334155;">
              Akun Google pribadi Anda telah terhubung ke sistem Kuis Interaktif.<br/>
              Token permanen sedang disimpan aman ke Supabase Secrets.
            </p>
            <div style="background: #f1f5f9; padding: 15px; border-radius: 12px; display: inline-block; margin-top: 10px;">
              <strong>Anda dapat menutup tab ini sekarang.</strong>
            </div>
          </div>
        `);

        await processAuthorizationCode(code, { clientId, clientSecret, redirectUri, projectId, token, anonKey });
        setTimeout(() => {
          server.close();
          process.exit(0);
        }, 1000);
      }
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`⏳ Menunggu otorisasi masuk dari browser...`);
  });

  // Watch for manual code file _oauth_code.txt if created
  const codeWatcher = setInterval(async () => {
    const codeFile = path.join(rootDir, '_oauth_code.txt');
    if (fs.existsSync(codeFile)) {
      const raw = fs.readFileSync(codeFile, 'utf8').trim();
      if (raw) {
        fs.unlinkSync(codeFile);
        clearInterval(codeWatcher);
        let extractedCode = raw;
        if (raw.includes('code=')) {
          const match = raw.match(/code=([^&]+)/);
          if (match) extractedCode = decodeURIComponent(match[1]);
        }
        await processAuthorizationCode(extractedCode, { clientId, clientSecret, redirectUri, projectId, token, anonKey });
        server.close();
        process.exit(0);
      }
    }
  }, 1000);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
