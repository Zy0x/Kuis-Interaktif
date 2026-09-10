# Panduan Integrasi Supabase Edge Functions & Secrets untuk Fitur AI

Dokumen ini menjelaskan arsitektur keamanan, manajemen rahasia (*secrets*), deployment fungsi serverless (*Edge Functions*), serta alur kerja generator AI kuis interaktif sesuai dengan **Standar Keamanan Sistem & Backend Supabase (Rule 9 & 10)**.

---

## 1. Prinsip Keamanan Tingkat Tinggi (*Zero-Leak Security*)

Sesuai dengan ketentuan baku pengembangan:
- **Dilarang keras mengekspos Kunci API (API Key)** rahasia di kode sumber frontend maupun di `localStorage` peramban.
- Seluruh rahasia wajib disimpan pada vault terenkripsi **Supabase Secrets**.
- Frontend hanya memanggil endpoint Edge Functions menggunakan public anonymous key (`anon key`) yang dilindungi konfigurasi CORS.
- Runtime serverless Deno di Supabase Edge Functions mengakses kunci secara aman via `Deno.env.get("GEMINI_API_KEY")` dan `Deno.env.get("GROQ_API_KEY")`.

---

## 2. Struktur Supabase Edge Function

Fungsi berada pada direktori:
```
supabase/
└── functions/
    └── generate-quiz-ai/
        └── index.ts
```

### Kemampuan Edge Function:
1. **Pengecekan Status (`action: "check_status"`):**
   - Mendeteksi ketersediaan kunci API di Supabase Secrets tanpa pernah membocorkan string kuncinya ke client.
   - Memberikan sinyal aktif kepada antarmuka pengguna agar tombol mesin AI otomatis terbuka (*unlocked*).
2. **Peracikan Soal Multi-Model AI:**
   - **Groq Cloud (LPU Inference):** Prioritas model `qwen/qwen3.8-27b`, `openai/gpt-oss-20b`, dan `openai/gpt-oss-120b`.
   - **Google Gemini AI:** Prioritas model generasi terbaru `gemini-3.8-flash`, `gemini-3.6-flash`, dan `gemini-3.1-flash-lite`.
3. **Multi-Model Cascade Failover:**
   - Apabila salah satu model mengalami lonjakan trafik (misal HTTP 503), runtime secara otomatis mencoba model cadangan server-side berikutnya hingga soal berhasil diracik secara utuh.
4. **Validasi Format JSON Berstandar Kurikulum SD:**
   - Memastikan format butir soal kompatibel dengan berbagai tipe: Pilihan Ganda, Benar/Salah, Isian Singkat, Menjodohkan (*matching pairs*), dan Tebak Gambar.

---

## 3. Cara Mengatur Kunci API di Supabase Secrets

### Metode A: Melalui Supabase CLI (Rekomendasi)
Jalankan perintah berikut di terminal:
```bash
# Menyetel kunci API Google Gemini
npx supabase secrets set GEMINI_API_KEY="AIzaSy..." --project-ref <PROJECT_ID>

# Menyetel kunci API Groq Cloud
npx supabase secrets set GROQ_API_KEY="gsk_..." --project-ref <PROJECT_ID>
```

### Metode B: Melalui Supabase Dashboard
1. Buka dashboard proyek Supabase Anda di `https://supabase.com/dashboard/project/<PROJECT_ID>/settings/functions`.
2. Masuk ke tab **Edge Functions Secrets**.
3. Tambahkan secret baru:
   - Name: `GEMINI_API_KEY`, Value: Kunci dari Google AI Studio.
   - Name: `GROQ_API_KEY`, Value: Kunci dari Groq Cloud Console.
4. Klik **Save**.

---

## 4. Cara Melakukan Deployment Edge Function

Jika terdapat pembaruan logika pada `supabase/functions/generate-quiz-ai/index.ts`, lakukan deployment dengan perintah:
```bash
# Set access token Supabase
$env:SUPABASE_ACCESS_TOKEN="<ACCESS_TOKEN>"

# Deploy fungsi generate-quiz-ai
npx supabase functions deploy generate-quiz-ai --project-ref <PROJECT_ID> --no-verify-jwt
```

---

## 5. Integrasi Frontend (`src/lib/geminiApi.ts`)

Frontend memanggil fungsi melalui Supabase JS Client:
```typescript
import { supabase } from './supabaseClient';

const { data, error } = await supabase.functions.invoke('generate-quiz-ai', {
  body: {
    subject: 'IPA',
    grade: 4,
    topic: 'Metamorfosis Kupu-kupu',
    count: 5,
    questionType: 'campuran',
    provider: 'groq' // atau 'gemini'
  }
});
```

Hasil balasan dinormalisasi secara otomatis ke tipe data `QuizQuestion` dan langsung disalurkan ke Langkah 2 (*Bank Soal*) pada Studio Kuis untuk ditinjau oleh guru.
