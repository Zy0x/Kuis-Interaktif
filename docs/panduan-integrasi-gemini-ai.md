# Panduan Lengkap Integrasi Google Gemini AI (Arsitektur Hybrid)

Dokumen ini menjelaskan secara menyeluruh cara mendapatkan API Key Google Gemini, memahami perbedaan langganan **Gemini PRO / Advanced**, serta cara memasukkan dan mengonfigurasikannya ke dalam aplikasi **Kuis Interaktif SD** menggunakan pendekatan **Hybrid AI**.

---

## 1. Memahami Langganan Gemini PRO vs Developer API

Banyak pengguna yang berlangganan **Google One AI Premium (Gemini Advanced / Gemini PRO)** di web (`gemini.google.com`) bertanya: *“Apakah langganan PRO saya otomatis memberikan API Key untuk aplikasi?”*

Berikut adalah penjelasannya:

| Fitur | Langganan Gemini PRO / Advanced (Web Consumer) | Google AI Studio Developer API |
| :--- | :--- | :--- |
| **Akses** | Melalui antarmuka obrolan `gemini.google.com` atau aplikasi Android/iOS. | Melalui portal pengembang `aistudio.google.com`. |
| **Tujuan** | Untuk chat pribadi, analisis dokumen, dan interaksi langsung oleh manusia. | Untuk menghubungkan aplikasi pihak ketiga (seperti Kuis SD Seru) agar dapat membuat soal secara terprogram. |
| **API Key** | **Tidak ada** (layanan web tidak memberikan string API key). | **Disediakan langsung** berupa string kunci API (`AIzaSy...`). |
| **Biaya API** | Tercakup dalam langganan Google One bulanan Anda. | **Tersedia TIER GRATIS (Free of Charge)** dengan kuota melimpah: hingga 15 RPM (Request Per Menit) dan 1.500 RPD (Request Per Hari) untuk Gemini 1.5 Flash & Pro! |

> [!TIP]
> **Kabar Baik:** Karena Anda sudah memiliki akun Google dan berlangganan PRO, Anda berhak mengakses **Google AI Studio** dan dapat membuat API Key secara **GRATIS** tanpa biaya tambahan untuk penggunaan standar kuis sekolah. Jika ingin batas kuota tak terbatas (Pay-as-you-go), akun Google Cloud Anda dapat diaktifkan dan biasanya mendapatkan kredit gratis $300 dari Google.

---

## 2. Langkah-demi-Langkah Mendapatkan Gemini API Key

Ikuti 5 langkah mudah berikut untuk mendapatkan API Key:

1. **Buka Google AI Studio:**
   Kunjungi portal resmi Google di: [https://aistudio.google.com/](https://aistudio.google.com/)
2. **Login Akun Google:**
   Masuk menggunakan akun Google yang Anda gunakan (akun yang berlangganan PRO).
3. **Pilih Menu "Get API key":**
   Pada panel navigasi sebelah kiri atas, klik tombol bertuliskan **"Get API key"** (ikon kunci).
4. **Buat Kunci API Baru:**
   - Klik tombol biru **"Create API key"**.
   - Pilih opsi **"Create API key in new project"** (atau pilih project Google Cloud yang sudah ada jika Anda memilikinya).
   - Tunggu beberapa detik hingga sistem Google men-generate kunci API Anda.
5. **Salin Kunci API:**
   - Kunci API akan muncul dengan awalan karakter `AIzaSy...`.
   - Klik tombol **Copy** (Salin). Simpan kunci ini dengan aman.

> [!CAUTION]
> Jangan pernah membagikan API Key Anda ke media sosial atau repositori publik GitHub.

---

## 3. Dua Cara Memasukkan API Key ke Aplikasi (Hybrid Approach)

Aplikasi **Kuis Interaktif SD** mendukung 2 metode pemasukan API Key yang sangat fleksibel:

### Cara 1: Langsung di Antarmuka Guru (Client-Side BYOK – Paling Cepat & Praktis)
Metode ini sangat cocok jika guru/admin ingin langsung mencoba tanpa menyentuh server Supabase:

1. Buka aplikasi **Kuis SD Seru**.
2. Masuk ke **Studio Kuis Guru** (Langkah 2: Bank Soal).
3. Klik tombol **"✨ Asisten AI"**.
4. Buka bagian **"Pengaturan Kunci Gemini API (Opsional)"**.
5. Tempelkan kunci API Anda (`AIzaSy...`) ke kotak input.
6. Klik **"Simpan Kunci"**.
7. Status akan berubah menjadi hijau: **🟢 Gemini AI Aktif (Gemini 1.5 Flash / Pro)**.

*Keamanan:* Kunci ini disimpan secara lokal di browser guru (`localStorage`) dan **tidak pernah dikirim ke browser siswa**.

---

### Cara 2: Melalui Supabase Edge Functions (Server-Side – Standar Produksi Tertinggi / Rule 9 & 10)
Metode ini adalah standar keamanan tertinggi karena API Key disimpan di server cloud Supabase, sehingga frontend sama sekali tidak memegang API Key:

#### A. Melalui Dashboard Supabase (Web Browser):
1. Buka [Supabase Dashboard](https://supabase.com/dashboard).
2. Pilih proyek Anda (`colpcgesngntiztjeprg`).
3. Pada menu navigasi sebelah kiri, buka **Project Settings** (ikon gerigi) $\rightarrow$ **Edge Functions**.
4. Buka tab **Secrets** $\rightarrow$ klik **Add new secret**.
5. Masukkan:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `AIzaSy...` (kunci API Anda)
6. Klik **Save**.

#### B. Melalui Terminal / Supabase CLI:
Jalankan perintah berikut di komputer Anda:
```bash
npx supabase secrets set GEMINI_API_KEY="AIzaSy...KUNCI_ANDA..."
```

#### C. Deploy Edge Function:
Deploy fungsi yang telah kami sediakan di folder `supabase/functions/generate-quiz-ai`:
```bash
npx supabase functions deploy generate-quiz-ai
```

---

## 4. Cara Kerja Sistem AI Hybrid (Tiga Lapis Keandalan)

Aplikasi dirancang dengan sistem cerdas 3 lapis agar guru dan siswa **tidak akan pernah mengalami aplikasi macet atau error**:

```
[Guru Memilih Topik & Klik "Buat Langsung"]
                     │
                     ▼
       Apakah ada Gemini API Key?
             │              │
        [YA] │              │ [TIDAK]
             ▼              ▼
   Panggil Gemini API   Gunakan Generator Kurikulum
   (Gemini 1.5 Flash)   Lokal SD (Offline & Instan)
             │                      │
             ▼                      │
     Apakah Berhasil?               │
        │          │ [GAGAL/LIMIT]  │
   [YA] │          └───────────────►│
        ▼                           ▼
Soal AI Siap Digunakan    Soal Kurikulum SD Siap
```

1. **Lapis 1 (Google Gemini 1.5 API):** Jika API Key tersedia, AI akan membuat soal kustom baru dengan variasi tak terbatas dan analisis konteks mendalam.
2. **Lapis 2 (Auto Fallback ke Generator Kurikulum SD):** Jika API key salah, kuota gratis Google habis (error 429), atau laptop guru sedang offline tanpa internet, sistem **secara otomatis beralih dalam 0.1 detik** ke bank soal Kurikulum Merdeka lokal tanpa memunculkan pesan error teknis yang membingungkan.
3. **Lapis 3 (Salin Prompt Standar):** Guru tetap dapat menyalin template prompt JSON berstandar tinggi ke ChatGPT, Claude, atau Gemini Web secara gratis kapan saja.

---

## 5. Rekomendasi Model Gemini

Di dalam aplikasi, Anda dapat memilih antara:
- **`gemini-1.5-flash` (Sangat Direkomendasikan / Default):**
  Kecepatan super tinggi (1–2 detik), sangat hemat token, dan memiliki pemahaman Bahasa Indonesia yang sangat baik untuk materi tingkat SD.
- **`gemini-1.5-pro` (Untuk Materi Penalaran Tingkat Tinggi / HOTS):**
  Cocok untuk soal analisis sains yang rumit, menjodohkan konsep abstrak, dan penalaran matematika cerita bertingkat.
- **`gemini-2.0-flash` (Generasi Terbaru):**
  Model multimodal generasi terbaru dari Google dengan latensi minimal.

---

## 6. Pertanyaan yang Sering Diajukan (FAQ)

**T: Berapa biaya pemakaian Gemini API?**
**J:** Untuk kebutuhan sekolah (ratusan soal per hari), pemakaian berada dalam batas **Free Tier (GRATIS)** dari Google AI Studio. Anda tidak akan dikenakan biaya sama sekali.

**T: Apakah murid bisa melihat kunci API saya?**
**J:** **Sama sekali tidak.** Murid hanya mengakses antarmuka bermain (`QuizArena`), di mana tidak ada modul panggil AI ataupun kunci API.

**T: Apa yang harus dilakukan jika muncul notifikasi kuota terlampaui (429)?**
**J:** Anda tidak perlu panik. Aplikasi akan secara otomatis mengalihkan pembuatan soal ke Generator Kurikulum internal, sehingga proses belajar mengajar tetap berlangsung lancar.
