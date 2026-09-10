import type { QuestionType, QuizQuestion, Subject } from '../types/quiz';
import { generateCurriculumSeedQuestions } from './aiQuestionParser';

const STORAGE_KEY_GEMINI_API_KEY = 'kuis_sd_gemini_api_key';
const STORAGE_KEY_GEMINI_MODEL = 'kuis_sd_gemini_model';

export type GeminiModel = 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-2.0-flash';

export interface GenerateAiQuestionsParams {
  subject: Subject;
  grade: number;
  topic: string;
  count: number;
  questionType: QuestionType | 'campuran';
  model?: GeminiModel;
  apiKey?: string;
}

export interface HybridGenerateResult {
  questions: QuizQuestion[];
  source: 'gemini_api' | 'curriculum_seed';
  message: string;
}

/**
 * Mengambil API Key Gemini yang tersimpan di local browser guru
 */
export function getStoredGeminiApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_GEMINI_API_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Menyimpan API Key Gemini ke local storage guru
 */
export function saveStoredGeminiApiKey(apiKey: string): void {
  try {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      localStorage.removeItem(STORAGE_KEY_GEMINI_API_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY_GEMINI_API_KEY, trimmed);
    }
  } catch {
    // Abaikan kegagalan storage quota
  }
}

/**
 * Menghapus API Key Gemini
 */
export function removeStoredGeminiApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_GEMINI_API_KEY);
  } catch {
    // noop
  }
}

/**
 * Memeriksa apakah guru sudah mengatur API Key Gemini
 */
export function hasGeminiApiKey(): boolean {
  return Boolean(getStoredGeminiApiKey().length > 10);
}

/**
 * Mengambil model Gemini pilihan (default: gemini-1.5-flash)
 */
export function getStoredGeminiModel(): GeminiModel {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_GEMINI_MODEL) as GeminiModel;
    if (saved === 'gemini-1.5-pro' || saved === 'gemini-2.0-flash') {
      return saved;
    }
    return 'gemini-1.5-flash';
  } catch {
    return 'gemini-1.5-flash';
  }
}

/**
 * Menyimpan model Gemini pilihan
 */
export function saveStoredGeminiModel(model: GeminiModel): void {
  try {
    localStorage.setItem(STORAGE_KEY_GEMINI_MODEL, model);
  } catch {
    // noop
  }
}

/**
 * Membangun instruksi prompt khusus untuk Google Gemini API
 */
function buildGeminiSystemPrompt(params: GenerateAiQuestionsParams): string {
  const { subject, grade, topic, count, questionType } = params;

  let formatInstruction = '';
  if (questionType === 'campuran') {
    formatInstruction = `Variasikan tipe soal secara seimbang antara:
- 'multiple_choice' (Pilihan ganda dengan 4 opsi A, B, C, D)
- 'true_false' (Benar atau Salah dengan 2 opsi ["Benar", "Salah"])
- 'short_answer' (Isian singkat dengan acceptableAnswers berisi sinonim/kunci)
- 'matching_pairs' (Menjodohkan konsep dengan matchingPairs: [{left, right}])
- 'image_guess' (Tebak gambar misteri dengan imageCaption)`;
  } else if (questionType === 'matching_pairs') {
    formatInstruction = `Gunakan tipe 'matching_pairs'. Setiap soal wajib memiliki properti 'matchingPairs' berisi 3-4 pasang objek { "left": "...", "right": "..." } yang saling berpasangan secara tepat.`;
  } else if (questionType === 'short_answer') {
    formatInstruction = `Gunakan tipe 'short_answer'. 'options' berisi 1 kunci utama, dan 'acceptableAnswers' berisi 1-4 variasi ejaan atau sinonim yang dianggap benar.`;
  } else if (questionType === 'true_false') {
    formatInstruction = `Gunakan tipe 'true_false'. 'options' wajib tepat ["Benar", "Salah"], dan correctIndex bernilai 0 jika Benar atau 1 jika Salah.`;
  } else if (questionType === 'image_guess') {
    formatInstruction = `Gunakan tipe 'image_guess'. Sertakan 'imageCaption' berupa nama objek/konsep yang harus ditebak, serta 4 pilihan 'options'.`;
  } else {
    formatInstruction = `Gunakan tipe 'multiple_choice'. Sertakan 4 pilihan jawaban yang mendidik pada array 'options'.`;
  }

  return `Anda adalah Asisten Pakar Kurikulum Merdeka Sekolah Dasar (SD) Indonesia.
Tugas Anda adalah merancang soal kuis interaktif yang mendidik, seru, menggunakan bahasa Indonesia yang baik, komunikatif, dan sesuai dengan daya tangkap siswa SD.

SPESIFIKASI SOAL:
- Mata Pelajaran: ${subject}
- Tingkat: Kelas ${grade} SD
- Topik / Materi: ${topic}
- Jumlah Soal: ${count} butir soal
- Format: ${formatInstruction}

ATURAN WAJIB OUTPUT:
1. Kembalikan HANYA array JSON murni tanpa pembuka penjelasan dan tanpa penutup obrolan.
2. Format objek di dalam array JSON:
[
  {
    "text": "Pertanyaan soal yang ramah anak...",
    "type": "${questionType === 'campuran' ? 'multiple_choice / true_false / short_answer / matching_pairs / image_guess' : questionType}",
    "options": ["Opsi 1", "Opsi 2", "Opsi 3", "Opsi 4"],
    "correctIndex": 0,
    "explanation": "Penjelasan edukatif singkat...",
    "points": 10,
    "customDurationSec": 30,
    "acceptableAnswers": ["Kunci", "Sinonim"],
    "matchingPairs": [{"left": "Konsep A", "right": "Definisi A"}],
    "imageCaption": "Kata kunci gambar"
  }
]`;
}

/**
 * Membersihkan respons teks dari AI (menghapus tag markdown \`\`\`json dsb)
 */
function cleanJsonResponse(rawResponse: string): string {
  let cleaned = rawResponse.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\s*```$/i, '');
  }
  return cleaned.trim();
}

/**
 * Memanggil langsung Google Gemini API menggunakan API Key
 */
export async function callGeminiApi(params: GenerateAiQuestionsParams): Promise<QuizQuestion[]> {
  const apiKey = params.apiKey || getStoredGeminiApiKey();
  if (!apiKey) {
    throw new Error('Kunci API Gemini belum diatur. Silakan masukkan API Key Anda.');
  }

  const model = params.model || getStoredGeminiModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const systemPrompt = buildGeminiSystemPrompt(params);

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: systemPrompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2500,
      responseMimeType: 'application/json',
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 detik batas waktu

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const errorMsg = errorJson?.error?.message || '';
      
      if (response.status === 400 && errorMsg.includes('API_KEY_INVALID')) {
        throw new Error('API Key Gemini tidak valid. Periksa kembali kunci API Anda di Google AI Studio.');
      } else if (response.status === 429) {
        throw new Error('Batas kuota harian/menit Gemini terlampaui. Mengalihkan ke generator internal...');
      } else {
        throw new Error(`Koneksi AI terganggu (${response.status}): ${errorMsg || 'Silakan coba sesaat lagi.'}`);
      }
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Tidak ada keluaran teks yang diterima dari Gemini AI.');
    }

    const cleanedJson = cleanJsonResponse(rawText);
    const parsed = JSON.parse(cleanedJson);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Format balasan Gemini tidak berupa daftar butir soal.');
    }

    // Normalisasi dan validasi butir soal
    const normalizedQuestions: QuizQuestion[] = parsed.map((item, idx) => {
      const qType: QuestionType = (
        ['multiple_choice', 'true_false', 'short_answer', 'image_guess', 'matching_pairs'].includes(item.type)
          ? item.type
          : 'multiple_choice'
      ) as QuestionType;

      let options: string[] = Array.isArray(item.options) && item.options.length > 0 
        ? item.options.map(String)
        : ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'];

      let correctIndex = typeof item.correctIndex === 'number' ? item.correctIndex : 0;
      if (correctIndex < 0 || correctIndex >= options.length) {
        correctIndex = 0;
      }

      if (qType === 'true_false') {
        options = ['Benar', 'Salah'];
        if (correctIndex !== 0 && correctIndex !== 1) correctIndex = 0;
      }

      const points = typeof item.points === 'number' && item.points > 0 ? item.points : 10;
      const customDurationSec = typeof item.customDurationSec === 'number' && item.customDurationSec >= 10 
        ? item.customDurationSec 
        : undefined;

      return {
        id: `q_gemini_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        text: String(item.text || `Pertanyaan #${idx + 1}`),
        type: qType,
        options,
        correctIndex,
        explanation: String(item.explanation || 'Pembahasan materi terkait konsep kurikulum.'),
        points,
        customDurationSec,
        acceptableAnswers: Array.isArray(item.acceptableAnswers) ? item.acceptableAnswers.map(String) : undefined,
        matchingPairs: Array.isArray(item.matchingPairs) ? item.matchingPairs : undefined,
        imageCaption: item.imageCaption ? String(item.imageCaption) : undefined,
      };
    });

    return normalizedQuestions;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Permintaan ke Gemini AI melampaui batas waktu (25 detik).');
      }
      throw err;
    }
    throw new Error('Terjadi kendala saat menghubungi Gemini AI.');
  }
}

/**
 * Mesin Generator Hybrid:
 * 1. Jika API Key Gemini tersedia: memanggil Gemini API secara langsung.
 * 2. Jika API Key tidak ada atau terjadi kendala jaringan: otomatis beralih ke generator kurikulum lokal.
 */
export async function generateHybridQuizQuestions(
  params: GenerateAiQuestionsParams
): Promise<HybridGenerateResult> {
  const hasKey = Boolean(params.apiKey || getStoredGeminiApiKey());

  if (hasKey) {
    try {
      const apiQuestions = await callGeminiApi(params);
      return {
        questions: apiQuestions,
        source: 'gemini_api',
        message: `Berhasil membuat ${apiQuestions.length} butir soal materi "${params.topic}" via Google Gemini AI!`,
      };
    } catch (apiError: unknown) {
      const errorMsg = apiError instanceof Error ? apiError.message : 'Kendala koneksi';
      console.warn('Panggilan Gemini API gagal, beralih ke generator lokal:', errorMsg);

      // Fallback mulus ke generator kurikulum lokal
      const fallbackQuestions = generateCurriculumSeedQuestions(
        params.topic,
        params.subject,
        params.grade,
        params.count,
        params.questionType
      );

      return {
        questions: fallbackQuestions,
        source: 'curriculum_seed',
        message: `Koneksi API (${errorMsg}). Beralih otomatis ke Generator Kurikulum SD (${fallbackQuestions.length} soal berhasil dibuat).`,
      };
    }
  }

  // Jika belum mengatur API Key: gunakan generator lokal secara langsung
  const localQuestions = generateCurriculumSeedQuestions(
    params.topic,
    params.subject,
    params.grade,
    params.count,
    params.questionType
  );

  return {
    questions: localQuestions,
    source: 'curriculum_seed',
    message: `Berhasil membuat ${localQuestions.length} butir soal materi "${params.topic}" via Generator Kurikulum SD!`,
  };
}
