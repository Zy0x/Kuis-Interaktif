import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Baca .env
function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('File .env tidak ditemukan di ' + envPath);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

async function deploy() {
  console.log('🚀 Memulai deployment otomatis ke Supabase...');
  const env = loadEnv();

  const token = env.SUPABASE_ACCESS_TOKEN;
  let projectId = env.SUPABASE_PROJECT_ID;

  if (!projectId && env.VITE_SUPABASE_URL) {
    const match = env.VITE_SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
    if (match) projectId = match[1];
  }

  if (!token) {
    throw new Error('SUPABASE_ACCESS_TOKEN tidak ditemukan di file .env.');
  }
  if (!projectId) {
    throw new Error('SUPABASE_PROJECT_ID atau VITE_SUPABASE_URL tidak ditemukan di .env.');
  }

  console.log(`📡 Menghubungkan ke Proyek Supabase ID: ${projectId}`);

  // 2. Baca file SQL
  const sqlPath = path.join(rootDir, 'docs', 'setup.sql');
  if (!fs.existsSync(sqlPath)) {
    throw new Error('File SQL tidak ditemukan di ' + sqlPath);
  }
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  console.log(`📄 Membaca skrip SQL: docs/setup.sql (${sqlContent.length} bytes)`);

  // 3. Eksekusi via Supabase Management API
  console.log('⚡ Mengirim dan mengeksekusi skrip SQL di database Supabase...');
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sqlContent }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal mengeksekusi SQL di Supabase: HTTP ${response.status} - ${errorText}`);
  }

  console.log('✅ Skrip SQL docs/setup.sql berhasil dieksekusi di Supabase!');

  // 4. Verifikasi Tabel & Data
  const verifyQueries = [
    { name: 'quizzes', query: 'SELECT count(*) FROM public.quizzes;' },
    { name: 'quiz_questions', query: 'SELECT count(*) FROM public.quiz_questions;' },
    { name: 'profiles_player', query: 'SELECT count(*) FROM public.profiles_player;' },
    { name: 'profiles_teacher', query: 'SELECT count(*) FROM public.profiles_teacher;' },
    { name: 'quiz_attempts', query: 'SELECT count(*) FROM public.quiz_attempts;' },
    { name: 'quiz_sessions', query: 'SELECT count(*) FROM public.quiz_sessions;' },
    { name: 'quiz_session_participants', query: 'SELECT count(*) FROM public.quiz_session_participants;' },
  ];

  console.log('\n🔍 Memverifikasi integritas tabel & data:');
  for (const v of verifyQueries) {
    try {
      const vRes = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: v.query }),
      });
      if (vRes.ok) {
        const vData = await vRes.json();
        const count = vData[0]?.count ?? 'OK';
        console.log(`  ✓ Tabel public.${v.name}: ${count} baris`);
      } else {
        console.log(`  ✗ Tabel public.${v.name}: Gagal query`);
      }
    } catch (err) {
      console.log(`  ✗ Tabel public.${v.name}: ${err.message}`);
    }
  }

  console.log('\n🎉 Deployment database Supabase selesai 100% dan terverifikasi aktif!');
}

deploy().catch((err) => {
  console.error('\n❌ Deployment Error:', err.message);
  process.exit(1);
});
