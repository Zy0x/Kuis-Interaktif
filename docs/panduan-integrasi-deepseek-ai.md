# Panduan Lengkap Integrasi DeepSeek AI (DeepSeek-V3 & DeepSeek-R1)

Dokumen ini menjelaskan cara mendapatkan API Key **DeepSeek**, keunggulan arsitektur model penalaran DeepSeek-R1 dan model serba bisa DeepSeek-V3, serta cara memasukkan dan mengonfigurasikannya ke dalam aplikasi **Kuis Interaktif SD**.

---

## 1. Apa itu DeepSeek & Mengapa Sangat Unggul?

**DeepSeek** adalah penyedia teknologi model kecerdasan buatan kelas dunia yang dikenal dengan inovasi arsitektur Mixture-of-Experts (MoE) dan model penalaran berbasis penguatan (*reinforcement learning*).

| Parameter | DeepSeek-V3 (`deepseek-chat`) | DeepSeek-R1 (`deepseek-reasoner`) |
| :--- | :--- | :--- |
| **Keahlian Utama** | Generasi soal kreatif, bahasa Indonesia kaya konteks, format terstruktur JSON instan | Penalaran logika mendalam, pemecahan soal Matematika & IPA tingkat tinggi (HOTS) |
| **Karakter Model** | Respons cepat, hemat kuota token, cocok untuk pembuatan butir soal massal | Model berpikir (*chain-of-thought*) sebelum menjawab, cocok untuk soal analisis |
| **Harga / Token** | Sangat terjangkau (salah satu LLM paling hemat biaya di dunia) | Kinerja setara OpenAI o1 dengan biaya pecahan yang sangat kecil |
| **Akses Developer** | Tersedia langsung melalui platform resmi DeepSeek API | Mendukung mode berpikir dengan token pertimbangan internal |

> [!TIP]
> **Kombinasi Rekomendasi:**
> - Gunakan **`deepseek-chat`** untuk topik umum, Bahasa Indonesia, Pendidikan Pancasila, dan pembuatan kuis cepat.
> - Gunakan **`deepseek-reasoner`** saat membuat soal Matematika, IPA, atau soal berpikir kritis (HOTS) yang membutuhkan penalaran matematika bertingkat.

---

## 2. Cara Mendapatkan DeepSeek API Key

1. **Kunjungi Platform Resmi DeepSeek:**
   Buka portal developer: [https://platform.deepseek.com/](https://platform.deepseek.com/)
2. **Daftar / Masuk:**
   Daftar menggunakan alamat email atau akun Google Anda.
3. **Buka Menu "API Keys":**
   Pada bilah navigasi sebelah kiri, klik menu **"API Keys"** (atau akses langsung di [https://platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)).
4. **Buat Kunci API Baru:**
   - Klik tombol **"Create API Key"**.
   - Masukkan nama pengenal, misalnya: `Kuis-SD-Guru`.
   - Klik konfirmasi.
5. **Salin Kunci API:**
   - Kunci API memiliki format awalan **`sk-...`**.
   - Salin dan simpan di tempat yang aman karena kunci hanya ditampilkan sekali saat dibuat.

---

## 3. Cara Mengonfigurasi Kunci DeepSeek ke Aplikasi

### Cara 1: Langsung di Antarmuka Aplikasi (Client BYOK - Cepat & Praktis)
1. Buka aplikasi **Kuis SD Seru**.
2. Masuk ke **Studio Kuis Guru** -> **Tahap 4 (Kecerdasan Buatan AI)** atau buka tab **Bank Soal -> ✨ Asisten AI**.
3. Di kartu **DeepSeek AI (🐋)**, klik tombol **"Kunci API Pribadi 🔑"** atau **"Pasang Kunci API"**.
4. Pilih tab **DeepSeek AI (🐋)**.
5. Tempelkan kunci API Anda (`sk-...`).
6. Pilih model yang diinginkan:
   - **`deepseek-chat`**: Cepat, cerdas, dan langsung format JSON.
   - **`deepseek-reasoner`**: Penalaran mendalam untuk soal HOTS.
7. Klik **"Simpan Kunci DeepSeek"**.
8. Indikator berubah menjadi **🐋 DeepSeek Cloud Aktif**!

---

## 4. Keunggulan Arsitektur Multi-Engine Hybrid di Kuis SD

1. **Fleksibilitas Tinggi:** Pengguna bebas memilih penyedia AI favorit atau berganti secara instan (Gemini, Groq, DeepSeek).
2. **Keamanan Tanpa Kompromi:** Kunci API client-side hanya tersimpan di perangkat lokal pengguna (`localStorage`), sedangkan server-side menggunakan enkripsi Supabase Secrets.
3. **Anti-Gagal (Cascade Resilience):** Jika satu penyedia mengalami gangguan jaringan atau kuota batas, sistem secara cerdas beralih ke mesin pendukung lainnya hingga generator kurikulum internal SD.
