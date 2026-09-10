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

### ⚡ Deploy Edge Functions (WAJIB — Jalankan Tanpa Diminta)

**Setiap kali ada perubahan pada file `supabase/functions/**`**, agen WAJIB langsung men-deploy ulang
edge function yang berubah setelah commit. Gunakan perintah berikut:

```powershell
# Baca token dari .env (jangan hardcode di sini)
$env:SUPABASE_ACCESS_TOKEN=(Get-Content .env | Select-String "SUPABASE_ACCESS_TOKEN" | ForEach-Object { $_ -replace "SUPABASE_ACCESS_TOKEN=","" })

# Deploy edge function (ganti <nama-function> sesuai folder)
supabase functions deploy <nama-function> --project-ref colpcgesngntiztjeprg
```

**Contoh deploy `generate-quiz-ai`:**
```powershell
$env:SUPABASE_ACCESS_TOKEN=(Get-Content .env | Select-String "SUPABASE_ACCESS_TOKEN" | ForEach-Object { $_ -replace "SUPABASE_ACCESS_TOKEN=","" })
supabase functions deploy generate-quiz-ai --project-ref colpcgesngntiztjeprg
```

> ⚠️ Peringatan "Docker is not running" dan "new version available" **BUKAN ERROR** — deploy tetap berhasil.
> Konfirmasi sukses: `Deployed Functions on project colpcgesngntiztjeprg: <nama-function>`
> Token dan Project Ref tersimpan di `.env` (tidak pernah di-commit ke Git).

**Informasi proyek:**
| Item | Sumber |
|------|--------|
| **Project Ref** | `colpcgesngntiztjeprg` |
| **Supabase URL** | lihat `.env` → `VITE_SUPABASE_URL` |
| **Access Token** | lihat `.env` → `SUPABASE_ACCESS_TOKEN` |
| **Edge Function aktif** | `generate-quiz-ai` |

**Nama Secret yang BENAR di Supabase → Settings → Edge Functions → Secrets:**
| Nama Secret (HURUF BESAR PERSIS) | Provider AI |
|----------------------------------|-------------|
| `GEMINI_API_KEY` | Google Gemini |
| `GROQ_API_KEY` | Groq Cloud |
| `DEEPSEEK_API_KEY` | DeepSeek AI |

> ⚠️ Jika nama secret salah (misal `DEEPSEEK_KEY` bukan `DEEPSEEK_API_KEY`), provider akan tampil
> badge **"Belum"** di UI meskipun key sudah diisi. Nama harus persis seperti tabel di atas.

---

## 🔒 2. STANDAR BAKU ANTI-AI SLOP & ZERO BACKEND EXPOSURE (WAJIB UTAMA)

> **PRINSIP DASAR:**
> Aplikasi ini dirancang khusus untuk lingkungan pendidikan sekolah dasar (guru dan siswa). Seluruh antarmuka wajib mengutamakan kesederhanaan, keterbacaan, kehangatan edukatif, dan estetika modern tanpa beban teknis.

### A. Larangan Mutlak Istilah Teknis Backend pada Antarmuka (UI/UX)
1. **DILARANG KERAS** mengekspos istilah backend/database teknis pada tampilan pengguna mana pun (`Beranda`, `Dasbor Guru`, `Studio Kuis`, `Lobi Siswa`, `Arena Kuis`, `Rekap Nilai`, modal pengaturan, dsb).
2. **Kamus Istilah yang Dilarang Tampil di UI:**
   - ❌ `Cloud Supabase`, `Supabase`, `Setup SQL Diperlukan`, `Lokal`
   - ❌ `SQL Editor`, `Query`, `schema public`, `RLS Policy`, `PostgreSQL`
   - ❌ `REST API`, `Endpoint`, `Database Health`, `Foreign Key`, `Table Migration`
3. **Penggantian dengan Bahasa Ramah Pengguna:**
   - Gantilah status koneksi dengan badge institusi edukatif (misal: `{teacher.schoolName || 'Pendidik'}`).
   - Sinkronisasi data ke cloud/Supabase **wajib berjalan otomatis di latar belakang** (*silent background sync*) tanpa banner peringatan database atau dialog teknis yang membingungkan pendidik.
   - Keterangan rekap nilai harus ramah pengguna: *"Data rekap hasil pengerjaan kuis siswa tersimpan rapi secara otomatis"* (bukan *"tersimpan otomatis ke database Supabase"*).

### B. Pemberantasan AI Slop & Bahasa Bertele-tele
1. **Minim Kata, Maksimal Makna (*Human-Friendly & Concise*):**
   - Hindari teks penjelas berlebih (*over-explaining*) pada tombol atau elemen yang fungsinya sudah jelas.
   - Tombol dan menu harus ringkas seperti tombol pengaturan standar (misal: *Mode IFP*, *Bagi Tautan*, *Edit*, *Duplikat*, *Lihat Rekap*, *Cetak LKS*).
2. **Eliminasi Redundansi Informasi:**
   - Dilarang mengulang informasi yang sama dalam satu kartu atau tampilan (misalnya: jika PIN kuis sudah ada di bagian header kartu, tidak boleh diulang lagi di baris meta bawah).
3. **Anti-Warping Badges & Kontainer Stabil:**
   - Seluruh badge, lencana, atau pill wajib menggunakan `whitespace-nowrap` dan `flex-shrink-0` dengan batasan lebar yang aman (`truncate max-w-[...]`).
   - Hindari penumpukan terlalu banyak elemen dalam satu baris flex kecil yang memicu pelipatan teks vertikal (*warping*) seperti teks *Kelas 2* yang terbelah.

---

## 📐 3. PROTOKOL AUDIT RESPONSIVITAS MULTI-VIEWPORT (WAJIB DIJALANKAN)

Setiap perubahan tampilan atau tata letak antarmuka **WAJIB** melalui uji audit visual dan fungsional pada spektrum perangkat berikut menggunakan Playwright/peramban:

### A. Matriks Resolusi Layar Wajib Uji
| Viewport | Resolusi Standar | Fokus Pemeriksaan |
| :--- | :--- | :--- |
| **Mobile-S** | 320 × 568 px | Tidak ada teks keluar kartu, tombol min 44×44 px, tidak ada scrollbar horizontal. |
| **Mobile-M** | 375 × 667 / 375 × 812 px | Proporsi modal/bottom sheet alami, padding nyaman, navigasi mudah dijangkau satu tangan. |
| **Mobile-L / Android Non-Reguler** | 412 × 915 / 430 × 932 px | Skalabilitas layout pada rasio layar panjang/lipat tanpa distorsi. |
| **Tablet Potret** | 768 × 1024 px | Grid bertransisi rapi (2 kolom), kontainer tidak menyisakan ruang gantung janggal. |
| **Tablet Lanskap / Laptop** | 1024 × 768 / 1280 × 800 px | Grid 3 kolom seimbang, bilah navigasi dan konten simetris. |
| **Desktop HD** | 1440 × 900 px | Grid 4 kolom, tata letak formulir dan pratinjau nyaman dibaca. |
| **Desktop Full HD / Wide** | 1920 × 1080 px | Grid 5 kolom, lebar tabs dan kartu konten selaras secara visual (*harmonized max-width*). |
| **Ultrawide & IFP Smartboard 4K** | 2560 × 1080 s.d. 3840 × 2160 px | Zero dead-space di kiri-kanan, teks pertanyaan besar dan terbaca dari kejauhan. |

### B. Matriks Perangkat Emulasi Kustom Nyata (Custom Emulated Device List)
Daftar perangkat ini tersimpan di `docs/devices-emulation.json` dan dapat diuji melalui perintah `npm run audit:responsive`:
| No | Perangkat | Mode | Viewport (L × T) | DPR | Karakteristik Layar & Fokus Uji |
| :---: | :--- | :---: | :---: | :---: | :--- |
| 1 | **Infinix Note 50s** | Potret | 392 × 778 px | 2.75 | Smartphone Android standar modern, target sentuh $\ge 44\text{ px}$. |
| 2 | **Redmi Note 7** | Potret | 431 × 846 px | 2.51 | Rasio layar panjang Android menengah, padding kartu proporsional. |
| 3 | **Infinix Note 11s** | Potret | 415 × 866 px | 2.60 | Layar tinggi, uji kestabilan modal dan posisi tombol navigasi bawah. |
| 4 | **Desktop - Half Screen** | Jendela 1/2 | 723 × 704 px | 1.00 | Tampilan multitasking Windows/Mac belah layar, transisi breakpoint tablet. |
| 5 | **Desktop - Quarter** | Jendela 1/4 | 723 × 296 px | 1.00 | Viewport sangat pendek (*low-height*), uji sticky header tidak menutupi konten. |
| 6 | **Infinix Note 50s** | Lanskap | 850 × 296 px | 2.75 | Lanskap smartphone tinggi rendah, guliran konten lancar tanpa dead-space. |
| 7 | **Infinix Note 11s** | Lanskap | 946 × 335 px | 2.60 | Mode horizontal Android lebar, uji baris tombol flex dan formulir 2 kolom. |
| 8 | **Redmi Note 7** | Lanskap | 901 × 347 px | 2.51 | Lanskap Android resolusi khas, kestabilan grid soal dan pratinjau kuis. |

> **Snippet Impor Chrome DevTools Console:**
> Jalankan perintah berikut di Console DevTools peramban untuk mengaktifkan profil perangkat di atas secara permanen:
> `InspectorFrontendHost.setPreference('custom-emulated-device-list', JSON.stringify(require('./docs/devices-emulation.json')));`

### C. Checklist Verifikasi Responsivitas Sebelum Rilis
- [ ] **Nol Luapan Horizontal:** `document.documentElement.scrollWidth === document.documentElement.clientWidth` bernilai `true` pada seluruh 8 profil perangkat kustom.
- [ ] **Target Sentuh Ergonomis:** Seluruh elemen interaktif memiliki dimensi area sentuh $\ge 44 \times 44\text{ px}$.
- [ ] **Harmonisasi Lebar Kontainer:** Elemen tab navigasi langkah dan kartu formulir memiliki batas lebar (*max-width*) yang seimbang dan tidak renggang ekstrem.
- [ ] **Dukungan Dua Tema (Dark & Light):** Kontras teks terhadap latar belakang memenuhi standar WCAG pada mode gelap maupun terang.
- [ ] **Bebas Error Konsol:** Tidak ada unhandled runtime exception di console browser.

---

## 🔒 4. STANDAR KEAMANAN & BACKEND EKSKLUSIF (RULE 9 & 10)

1. **Backend Eksklusif Supabase:**
   - Seluruh penyimpanan data, autentikasi, dan riwayat siswa/guru wajib menggunakan Supabase mandiri milik pengguna.
   - Dilarang menggunakan Lovable Cloud atau penyimpanan pihak ketiga tanpa izin eksplisit.
2. **Proteksi Kredensial & Secrets:**
   - File `.env` **HARUS SELALU DIABAIKAN OLEH GIT** (`.gitignore`).
   - Jangan pernah menyematkan (*hardcode*) Service Role Key, Access Token, password, atau rahasia ke dalam kode frontend (`src/`).
   - Frontend hanya diizinkan membaca `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
   - Operasi yang membutuhkan hak akses penuh hanya dijalankan melalui server-side / Management API (`scripts/`).

---

## 📱 5. PRESISI TAMPILAN & MOBILE-FIRST (RULE 1)

1. **Mobile-First & Touch-First:**
   - Seluruh target sentuh tombol/interaksi minimal **44 × 44 px** (disarankan **48 × 48 px**).
   - Seluruh layout wajib stabil pada rentang Mobile-S (320px), layar lipat/non-reguler (1080×2460), tablet, hingga layar 4K.
   - **Nol Luapan Horizontal:** Tidak boleh ada horizontal scrollbar yang tidak disengaja (`scrollWidth === clientWidth`).
2. **Keterbacaan & Estetika Bersih (Rule 2):**
   - Hindari redundansi, teks penjelas berlebih (*AI slop*), atau kontainer berlapis tak perlu.
   - Utamakan antarmuka yang bersih, cepat dipahami, dan kontras warna yang nyaman di mata pada mode terang (*light*) maupun gelap (*dark*).

---

## 🔄 6. VERSI APLIKASI & CHANGELOG (RULE 15)

1. Setiap fitur baru atau perbaikan wajib menaikkan nomor versi pada:
   - `package.json` (format berurutan: `2.2.35` -> `2.2.36` -> `2.2.37`, dst).
2. Catat pembaruan di `CHANGELOG.md`:
   - Gunakan format judul standar: `## [x.x.x] - YYYY-MM-DD`.
   - Jelaskan fitur fungsional secara profesional.
   - **Dilarang** mengekspos rahasia backend, token, atau data sensitif di CHANGELOG.

---

## 🚀 7. COMMIT & PUSH KE GITHUB (RULE 16)

Setelah seluruh perubahan selesai dan diverifikasi:
1. Pastikan build berhasil tanpa kesalahan:
   ```bash
   npm run build
   ```
2. Lakukan git commit dengan pesan yang informatif sesuai induk perubahan:
   ```bash
   git add -A
   git commit -m "feat/fix(...): deskripsi perubahan ringkas (vX.X.X)"
   git push origin main
   ```

---

## 🛠️ 8. DAFTAR PERINTAH PENTING

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan local dev server Vite. |
| `npm run build` | Menjalankan type-check (`tsc -b`) dan bundler Vite. |
| `npm run db:deploy` | **Deploy otomatis skema `docs/setup.sql` langsung ke Supabase Cloud.** |
| `npm run preview` | Menjalankan preview hasil build produksi. |
