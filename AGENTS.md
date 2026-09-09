# PANDUAN KERJA AI AGENT (AGENTS.md)
# Proyek: Kuis Interaktif SD Seru

Dokumen ini berfungsi sebagai instruksi operasional wajib (**Standard Operating Procedures**) bagi seluruh AI Agent (Antigravity, Claude, Copilot, Lovable, dan model coding lainnya) yang bekerja pada repositori ini.

---

## ⚡ 1. MANDATORY: DEPLOY OTOMATIS KE SUPABASE

> **ATURAN MUTLAK:**
> **DILARANG** meminta pengguna menyalin-tempel (*copy-paste*) skrip SQL ke Supabase SQL Editor secara manual jika AI dapat menjalankannya langsung.
> Seluruh kredensial Supabase Management API sudah lengkap di file `.env`.
> **Setiap kali** terjadi penambahan/modifikasi tabel, kolom, indeks, RLS policy, fungsi, trigger, atau seed data:
> 1. Perbarui file `docs/setup.sql`.
> 2. Jalankan perintah otomatisasi berikut di terminal:
>    ```bash
>    npm run db:deploy
>    ```
> 3. Verifikasi hasil eksekusi hingga muncul konfirmasi `🎉 Deployment database Supabase selesai 100% dan terverifikasi aktif!`.

### Mekanisme Skrip Deploy (`scripts/deploy-supabase.js`):
- Membaca `SUPABASE_ACCESS_TOKEN` dan `SUPABASE_PROJECT_ID` (atau `VITE_SUPABASE_URL`) dari `.env`.
- Mengirimkan isi `docs/setup.sql` langsung ke endpoint Supabase Management API:
  `POST https://api.supabase.com/v1/projects/${projectId}/database/query`
- Memverifikasi keberadaan dan jumlah baris seluruh tabel utama (`quizzes`, `quiz_questions`, `profiles_player`, `profiles_teacher`, `quiz_attempts`).

---

## 🔒 2. STANDAR KEAMANAN & BACKEND EKSKLUSIF (RULE 9 & 10)

1. **Backend Eksklusif Supabase:**
   - Seluruh penyimpanan data, autentikasi, dan riwayat siswa/guru wajib menggunakan Supabase mandiri milik pengguna.
   - Dilarang menggunakan Lovable Cloud atau penyimpanan pihak ketiga tanpa izin eksplisit.
2. **Proteksi Kredensial & Secrets:**
   - File `.env` **HARUS SELALU DIABAIKAN OLEH GIT** (`.gitignore`).
   - Jangan pernah menyematkan (*hardcode*) Service Role Key, Access Token, password, atau rahasia ke dalam kode frontend (`src/`).
   - Frontend hanya diizinkan membaca `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
   - Operasi yang membutuhkan hak akses penuh hanya dijalankan melalui server-side / Management API (`scripts/`).

---

## 📱 3. PRESISI TAMPILAN & MOBILE-FIRST (RULE 1)

1. **Mobile-First & Touch-First:**
   - Seluruh target sentuh tombol/interaksi minimal **44 × 44 px** (disarankan **48 × 48 px**).
   - Seluruh layout wajib stabil pada rentang Mobile-S (320px), layar lipat/non-reguler (1080×2460), tablet, hingga layar 4K.
   - **Nol Luapan Horizontal:** Tidak boleh ada horizontal scrollbar yang tidak disengaja (`scrollWidth === clientWidth`).
2. **Keterbacaan & Estetika Bersih (Rule 2):**
   - Hindari redundansi, teks penjelas berlebih (*AI slop*), atau kontainer berlapis tak perlu.
   - Utamakan antarmuka yang bersih, cepat dipahami, dan kontras warna yang nyaman di mata pada mode terang (*light*) maupun gelap (*dark*).

---

## 🔄 4. VERSI APLIKASI & CHANGELOG (RULE 15)

1. Setiap fitur baru atau perbaikan wajib menaikkan nomor versi pada:
   - `package.json` (format berurutan: `2.2.33` -> `2.2.34` -> `2.2.35`, dst).
2. Catat pembaruan di `CHANGELOG.md`:
   - Gunakan format judul standar: `## [x.x.x] - YYYY-MM-DD`.
   - Jelaskan fitur fungsional secara profesional.
   - **Dilarang** mengekspos rahasia backend, token, atau data sensitif di CHANGELOG.

---

## 🚀 5. COMMIT & PUSH KE GITHUB (RULE 16)

Setelah seluruh perubahan selesai dan diverifikasi:
1. Pastikan build berhasil tanpa kesalahan:
   ```bash
   npm run build
   ```
2. Lakukan git commit dengan pesan yang informatif sesuai induk perubahan:
   ```bash
   git add .
   git commit -m "feat/fix(...): deskripsi perubahan ringkas (vX.X.X)"
   git push origin main
   ```

---

## 🛠️ 6. DAFTAR PERINTAH PENTING

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan local dev server Vite. |
| `npm run build` | Menjalankan type-check (`tsc -b`) dan bundler Vite. |
| `npm run db:deploy` | **Deploy otomatis skema `docs/setup.sql` langsung ke Supabase Cloud.** |
| `npm run preview` | Menjalankan preview hasil build produksi. |
