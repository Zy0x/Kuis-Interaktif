# Panduan Lengkap Integrasi Groq API (Inference LPU Super Cepat)

Dokumen ini menjelaskan cara mendapatkan API Key **Groq Cloud**, keunggulan arsitektur LPU (Language Processing Unit), serta cara memasukkan dan mengonfigurasikannya ke dalam aplikasi **Kuis Interaktif SD**.

---

## 1. Apa itu Groq & Mengapa Sangat Direkomendasikan?

**Groq** adalah penyedia layanan komputasi AI tercepat di dunia yang menggunakan prosesor khusus bernama **LPU™ (Language Processing Unit)**, bukan GPU biasa.

| Perbandingan | Penyedia Standar (GPU Tradisional) | Groq LPU™ Cloud Engine |
| :--- | :--- | :--- |
| **Kecepatan Inferensi** | 30 – 80 token/detik (menunggu 3–8 detik) | **300 – 800 token/detik (instan < 1 detik!)** |
| **Format Soal Kuis** | Sering terpotong jika timeout | **10 butir soal lengkap terbit dalam sekejap mata** |
| **Akses Developer** | Sering memerlukan kartu kredit | **100% GRATIS tanpa perlu memasukkan kartu kredit!** |
| **Model Unggulan** | Model tertutup | **Llama 3.3 70B Versatile** & **Llama 3.1 8B Instant** (Open-Source tercanggih dari Meta AI) |

> [!TIP]
> **Kombinasi Terbaik:** Jika Anda mengutamakan **kecepatan kilat** saat guru sedang membuat soal di depan kelas, gunakan **Groq LPU**. Jika Anda mengutamakan **integrasi ekosistem Google** dan penalaran panjang, gunakan **Google Gemini Pro**. Keduanya didukung penuh oleh aplikasi ini!

---

## 2. Cara Mendapatkan Groq API Key (100% Gratis & Tanpa Kartu Kredit)

1. **Kunjungi Console Groq:**
   Buka portal resmi: [https://console.groq.com/](https://console.groq.com/)
2. **Daftar / Login:**
   Masuk dengan akun **Google**, GitHub, atau email Anda (proses pendaftaran instan kurang dari 30 detik).
3. **Pilih Menu "API Keys":**
   Pada bilah menu sebelah kiri, klik menu **"API Keys"** (ikon kunci 🔑).
4. **Buat Kunci API Baru:**
   - Klik tombol **"Create API Key"**.
   - Beri nama kunci, misalnya: `Kuis-SD-Guru`.
   - Klik **"Submit"**.
5. **Salin Kunci API:**
   - Kunci API akan muncul dengan awalan karakter **`gsk_...`**.
   - Klik tombol **Copy**. Simpan kunci ini karena Groq hanya menampilkannya satu kali demi keamanan.

---

## 3. Cara Memasukkan Kunci Groq ke Aplikasi

### Cara 1: Langsung di Antarmuka Guru (Paling Cepat & Praktis)
1. Buka aplikasi **Kuis SD Seru**.
2. Masuk ke **Studio Kuis Guru** $\rightarrow$ tab **2. Bank Soal**.
3. Klik tombol **"✨ Asisten AI"**.
4. Buka bagian **"Pengaturan Kunci API"**.
5. Pilih Provider: **Groq Cloud (Super Cepat ⚡)**.
6. Tempelkan kunci API Anda (`gsk_...`).
7. Pilih model:
   - **`llama-3.3-70b-versatile` (Sangat Direkomendasikan):** Memiliki kecerdasan tinggi, tata bahasa Indonesia yang sangat rapi, dan penalaran materi SD yang akurat.
   - **`llama-3.1-8b-instant`:** Versi super kilat dengan latensi mendekati instan.
8. Klik **"Simpan Kunci"**.
9. Indikator akan berubah hijau: **🟢 Groq Cloud Aktif (Llama 3.3 70B ⚡)**!

---

### Cara 2: Melalui Supabase Secrets (Server-Side / Rule 9 & 10)
Untuk penyimpanan terpusat dan proteksi kunci di server backend:

#### A. Melalui Dashboard Supabase:
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) $\rightarrow$ pilih proyek Anda.
2. Masuk ke **Project Settings** $\rightarrow$ **Edge Functions** $\rightarrow$ **Secrets**.
3. Klik **Add new secret**:
   - **Name:** `GROQ_API_KEY`
   - **Value:** `gsk_...` (Kunci API Groq Anda)
4. Klik **Save**.

#### B. Melalui Supabase CLI:
```bash
npx supabase secrets set GROQ_API_KEY="gsk_...KUNCI_ANDA..."
```

---

## 4. Perbandingan Model AI: Groq vs Google Gemini

| Parameter | Google Gemini (1.5 Flash / Pro) | Groq (Llama 3.3 70B) |
| :--- | :--- | :--- |
| **Kecepatan Respons** | Sangat Cepat (1.5 – 2.5 detik) | **Super Kilat (0.5 – 1.0 detik)** |
| **Karakter Kunci** | Berawalan `AIzaSy...` | Berawalan `gsk_...` |
| **Basis Model** | Google DeepMind Gemini | Meta AI Llama 3.3 70B |
| **Dukungan Soal Gambar** | Sangat Kuat (Multimodal) | Sangat Kuat pada Teks & Logika |
| **Penyedia** | Google AI Studio | Groq Cloud |

---

## 5. Pertanyaan yang Sering Diajukan (FAQ)

**T: Apakah Groq API berbayar?**
**J:** Tidak. Groq menyediakan tier gratis (Free Developer Tier) dengan kuota hingga 30 request per menit dan 14.400 request per hari. Anda tidak perlu memasukkan kartu kredit sama sekali.

**T: Apa yang terjadi jika salah satu provider (Gemini atau Groq) mengalami gangguan?**
**J:** Berkat **Arsitektur Hybrid Multi-Provider**, jika Groq gagal, sistem otomatis mencoba Gemini (jika ada kuncinya). Jika keduanya tidak aktif, sistem otomatis beralih ke **Generator Kurikulum SD Internal**. Kuis Anda tidak akan pernah gagal dibuat!
