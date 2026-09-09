# Arsitektur Basis Data: Kuis SD Seru
**Versi:** 2.1.2  
**Platform:** PostgreSQL (Supabase Mandiri)

---

## 1. Daftar Entitas Utama

1. **`profiles_player`**: Menyimpan identitas ramah anak (nama panggilan unik, ID avatar kartun, skor agregat, lencana yang dikumpulkan). Bebas dari data pribadi sensitif (COPPA-compliant).
2. **`quizzes`**: Induk data kuis (judul, mata pelajaran, target jenjang kelas 1–6 SD, durasi per soal, tema warna, status rilis).
3. **`quiz_questions`**: Bank soal interaktif (teks soal, jenis soal, URL gambar/ilustrasi, opsi jawaban JSONB, indeks kunci jawaban, dan pembahasan edukatif).
4. **`quiz_attempts`**: Rekam jejak setiap sesi kuis yang diselesaikan oleh siswa (skor angka 0–100, bintang 1–3, jumlah benar/salah, total waktu pengerjaan).
5. **`audit_logs`**: Catatan riwayat aktivitas penting sistem (pembuatan kuis, pembaruan konten, tindakan administratif).
6. **`system_backups`**: Log arsip pencadangan berkas terenkripsi AES-256.

---

## 2. Langkah Menghubungkan Frontend ke Supabase Anda

1. Buat proyek baru di [Supabase Dashboard](https://supabase.com/).
2. Buka menu **SQL Editor**, salin seluruh isi berkas `docs/setup.sql`, lalu klik **Run**.
3. Buka menu **Project Settings -> API**, salin `Project URL` dan `anon public key`.
4. Buat berkas `.env` di direktori proyek `kuis-sd-seru`:
   ```env
   VITE_SUPABASE_URL=https://proyek-anda.supabase.co
   VITE_SUPABASE_ANON_KEY=kunci-anon-publik-anda
   ```
5. Jalankan `npm run dev`. Aplikasi akan otomatis terhubung secara langsung ke basis data Supabase Anda!
