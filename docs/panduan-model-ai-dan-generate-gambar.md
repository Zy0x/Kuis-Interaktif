# Panduan Model AI & Pembuat Gambar Edukasi AI (Gratis)

Dokumen ini menjelaskan ragam model kecerdasan buatan (AI) yang didukung oleh aplikasi **Kuis Interaktif SD**, status ketersediaan model generasi terbaru, serta integrasi **Pembuat Gambar Edukasi AI (100% Gratis)** tanpa memerlukan kunci API tambahan.

---

## 1. Daftar Model Google Gemini yang Didukung

Google Gemini adalah mesin kecerdasan buatan multimodal dari Google DeepMind yang sangat cakap dalam pedagogi, kurikulum sekolah, dan bahasa Indonesia kontekstual.

| Nama Model di Sistem | Nama Resmi & Versi | Karakteristik Utama | Rekomendasi Penggunaan |
| :--- | :--- | :--- | :--- |
| `gemini-2.0-flash` | **Gemini 2.0 Flash** *(Terbaru)* | Generasi terbaru, kecepatan sangat tinggi, pemahaman instruksi luar biasa. | **Rekomendasi Utama** untuk segala mata pelajaran SD. |
| `gemini-2.0-flash-thinking-exp-01-21` | **Gemini 2.0 Flash Thinking** | Memiliki kemampuan penalaran bertahap (*chain-of-thought*) sebelum menjawab. | Sangat cocok untuk soal HOTS, logika matematika, dan studi kasus sains. |
| `gemini-1.5-pro` | **Gemini 1.5 Pro** *(Khusus PRO)* | Jendela konteks raksasa (hingga 2 juta token), penalaran mendalam. | Ideal bagi pemilik langganan Google One AI Premium / Gemini PRO. |
| `gemini-1.5-flash` | **Gemini 1.5 Flash** | Sangat cepat, hemat kuota, stabil, dan andal. | Penggunaan harian dengan koneksi internet hemat data. |
| `gemini-1.5-flash-8b` | **Gemini 1.5 Flash-8B** | Model super ringan berbobot 8 miliar parameter. | Permintaan soal cepat dalam jumlah kecil. |

> [!NOTE]
> **Klarifikasi Seputar Versi "Gemini 3.8":**
> Saat ini keluarga model resmi Google adalah **Gemini 1.5** dan generasi terbaru **Gemini 2.0** (seperti *Gemini 2.0 Flash* dan *Gemini 2.0 Flash Thinking*). Versi bernomor `3.x` (seperti Claude 3.5 Sonnet atau rumor penamaan di masa depan) belum dirilis oleh Google sebagai Gemini 3.8. Aplikasi Kuis Interaktif telah dilengkapi arsitektur fleksibel yang siap langsung menggunakan model Gemini generasi berikutnya begitu Google merilis endpoint resminya.

---

## 2. Pemanfaatan Langganan Gemini PRO

Bagi Anda yang telah berlangganan **Google One AI Premium / Gemini PRO**:
1. Akun Google Anda telah memiliki hak istimewa untuk membuat API Key di portal pengembang resmi Google: [Google AI Studio](https://aistudio.google.com/).
2. Anda berhak menggunakan model kasta tertinggi **`gemini-1.5-pro`** serta model eksperimen pemikir cerdas **`gemini-2.0-flash-thinking-exp-01-21`** secara optimal.
3. Kunci API yang diperoleh dari Google AI Studio bersifat *Bring Your Own Key* (BYOK), tersimpan secara privat di peramban Anda, dan tidak dipungut biaya tambahan dalam batas kuota gratis pengembang (*Free Tier: 15 Requests Per Minute*).

---

## 3. Daftar Model Groq Cloud LPU yang Didukung

Groq menggunakan prosesor perangkat keras khusus bernama **LPU (Language Processing Unit)** yang mampu mengeksekusi inferensi model berukuran 70 miliar parameter dalam waktu **kurang dari 1 detik** (kecepatan mencapai 300–500 token/detik).

| Nama Model di Sistem | Basis Arsitektur | Keunggulan & Kecepatan | Rekomendasi Penggunaan |
| :--- | :--- | :--- | :--- |
| `llama-3.3-70b-versatile` | Meta Llama 3.3 (70B) | Kualitas setara GPT-4, sangat akurat, tata bahasa Indonesia rapi. | **Rekomendasi Utama Groq** untuk pembuatan soal standar dan HOTS. |
| `llama-3.1-8b-instant` | Meta Llama 3.1 (8B) | Super kilat (10 butir soal selesai dalam ~0,4 detik). | Cocok untuk uji coba cepat atau koneksi seluler lambat. |
| `deepseek-r1-distill-llama-70b` | DeepSeek R1 Distill (70B) | Penalaran matematika dan deduksi sains mutakhir. | Sangat ideal untuk soal hitungan Matematika dan penalaran IPA. |
| `gemma2-9b-it` | Google Gemma 2 (9B) | Kompak, efisien, dirancang khusus oleh tim Google. | Alternatif hemat kuota token. |
| `mixtral-8x7b-32768` | Mistral MoE (8x7B) | Arsitektur Mixture of Experts dengan konteks 32k token. | Pembuatan paket soal panjang bertema literasi dan cerita. |

> [!TIP]
> **Apakah Groq Gratis?**
> Ya! Seluruh model di atas (termasuk *Llama 3.3 70B* dan *DeepSeek R1*) dapat digunakan secara **100% Gratis** di Groq Cloud Free Tier tanpa perlu memasukkan kartu kredit. Kunci API dapat diambil langsung di [console.groq.com](https://console.groq.com/).

---

## 4. Fitur Pembuat Gambar Edukasi AI (100% Gratis Tanpa API Key)

Banyak guru ingin membuat kuis bertipe **Tebak Gambar (`image_guess`)** atau soal bergambar, namun sering kesulitan mencari ilustrasi yang ramah anak, bersih, dan bebas hak cipta.

Aplikasi kini menyediakan **Generator Gambar Edukasi AI Bawaan** yang:
- **100% Gratis Selamanya**: Tidak membutuhkan biaya langganan, tidak memotong kuota Gemini/Groq, dan tidak memerlukan pendaftaran API Key terpisah.
- **Ditenagai oleh Pollinations AI / Flux Engine**: Mesin difusi visual modern yang menghasilkan gambar vektor 3D edukatif, jernih, berwarna cerah, dan ramah anak usia sekolah dasar.
- **Sistem Prompt Edukatif Otomatis**: Sistem secara cerdas menambahkan instruksi artistik edukasi SD (*clean colorful 3d vector style, child-friendly*) sehingga gambar yang dihasilkan selalu pantas dan aman untuk siswa.

---

### Cara Menggunakan Pembuat Gambar AI

Ada 2 (dua) cara mudah untuk menggunakan fitur ini:

#### Cara A: Otomatis dari Asisten Soal AI (Saat Generate Soal)
1. Buka formulir pembuatan kuis, masuk ke **Langkah 2 (Bank Soal)**.
2. Klik tombol **"✨ Asisten AI"**.
3. Centang sakelar **"🎨 Sertakan Ilustrasi Gambar AI (Gratis 100%)"**.
4. Klik **"Buat Langsung Sekarang"** (atau via Gemini/Groq).
5. Seluruh butir soal yang dibuat otomatis dilengkapi gambar ilustrasi yang relevan dengan topik soal!

#### Cara B: Manual per Butir Soal (Di Editor Soal)
1. Pada editor butir soal di Langkah 2, gulir ke bagian **"Sisipkan Gambar / Ilustrasi"**.
2. Masukkan kata kunci gambar di kolom deskripsi (misal: *Paru-Paru Manusia*, *Siklus Air*, *Burung Garuda*), atau biarkan teks soal menjadi acuan.
3. Klik tombol **"🎨 Buat Gambar AI"**.
4. Dalam hitungan detik, gambar ilustrasi AI akan langsung terpasang dan menampilkan pratinjau thumbnail visual.
5. Anda dapat mengganti gambar, mengunggah foto lokal dari perangkat, atau menghapusnya sewaktu-waktu dengan menekan tombol silang (❌).

---

## 5. Ringkasan Fitur AI Aplikasi Kuis Interaktif

| Fitur | Penyedia / Mesin | Memerlukan Kunci API? | Biaya |
| :--- | :--- | :--- | :--- |
| **Pembuat Soal Gemini** | Google Gemini (2.0 Flash / 1.5 Pro) | Ya (Kunci Google AI Studio pengguna) | Gratis (Free Tier 15 RPM) |
| **Pembuat Soal Groq LPU** | Groq (Llama 3.3 / DeepSeek R1) | Ya (Kunci console.groq.com pengguna) | Gratis (Free Tier tanpa CC) |
| **Generator Kurikulum Lokal** | Mesin Offline Internal Kurikulum Merdeka | **Tidak** | Gratis 100% & Offline |
| **Pembuat Gambar Edukasi** | Pollinations AI / Flux Engine | **Tidak** | Gratis 100% Selamanya |
