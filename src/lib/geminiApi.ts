import type { QuestionType, QuizQuestion, Subject } from '../types/quiz';
import { generateCurriculumSeedQuestions } from './aiQuestionParser';

export type AiProvider = 'gemini' | 'groq';
export type GeminiModel = 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-2.0-flash';
export type GroqModel = 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant';

const STORAGE_KEY_AI_PROVIDER = 'kuis_sd_ai_provider';
const STORAGE_KEY_GEMINI_API_KEY = 'kuis_sd_gemini_api_key';
const STORAGE_KEY_GEMINI_MODEL = 'kuis_sd_gemini_model';
const STORAGE_KEY_GROQ_API_KEY = 'kuis_sd_groq_api_key';
const STORAGE_KEY_GROQ_MODEL = 'kuis_sd_groq_model';

export interface GenerateAiQuestionsParams {
  subject: Subject;
  grade: number;
  topic: string;
  count: number;
  questionType: QuestionType | 'campuran';
  provider?: AiProvider;
  geminiModel?: GeminiModel;
  groqModel?: GroqModel;
  model?: string; // generic fallback
  apiKey?: string;
}

export interface HybridGenerateResult {
  questions: QuizQuestion[];
  source: 'gemini_api' | 'groq_api' | 'curriculum_seed';
  message: string;
}

/* =========================================================
   PROVIDER & KEY STORAGE HELPERS
========================================================= */

export function getStoredAiProvider(): AiProvider {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AI_PROVIDER) as AiProvider;
    if (saved === 'groq') return 'groq';
    return 'gemini';
  } catch {
    return 'gemini';
  }
}

export function saveStoredAiProvider(provider: AiProvider): void {
  try {
    localStorage.setItem(STORAGE_KEY_AI_PROVIDER, provider);
  } catch {
    // noop
  }
}

export function getStoredGeminiApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_GEMINI_API_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredGeminiApiKey(apiKey: string): void {
  try {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      localStorage.removeItem(STORAGE_KEY_GEMINI_API_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY_GEMINI_API_KEY, trimmed);
    }
  } catch {
    // noop
  }
}

export function hasGeminiApiKey(): boolean {
  return Boolean(getStoredGeminiApiKey().length > 10);
}

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

export function saveStoredGeminiModel(model: GeminiModel): void {
  try {
    localStorage.setItem(STORAGE_KEY_GEMINI_MODEL, model);
  } catch {
    // noop
  }
}

export function getStoredGroqApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_GROQ_API_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredGroqApiKey(apiKey: string): void {
  try {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      localStorage.removeItem(STORAGE_KEY_GROQ_API_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY_GROQ_API_KEY, trimmed);
    }
  } catch {
    // noop
  }
}

export function hasGroqApiKey(): boolean {
  return Boolean(getStoredGroqApiKey().length > 10);
}

export function getStoredGroqModel(): GroqModel {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_GROQ_MODEL) as GroqModel;
    if (saved === 'llama-3.1-8b-instant') {
      return 'llama-3.1-8b-instant';
    }
    return 'llama-3.3-70b-versatile';
  } catch {
    return 'llama-3.3-70b-versatile';
  }
}

export function saveStoredGroqModel(model: GroqModel): void {
  try {
    localStorage.setItem(STORAGE_KEY_GROQ_MODEL, model);
  } catch {
    // noop
  }
}

export function hasAnyAiApiKey(): boolean {
  return hasGeminiApiKey() || hasGroqApiKey();
}

/* =========================================================
   PROMPT & CLEANING HELPERS
========================================================= */

function buildInstructionText(params: GenerateAiQuestionsParams): string {
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
1. Kembalikan HANYA format JSON valid tanpa pembuka/penutup obrolan teks.
2. Setiap butir soal harus memiliki struktur:
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
}`;
}

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

function normalizeQuestions(rawList: any[], providerPrefix: string): QuizQuestion[] {
  return rawList.map((item, idx) => {
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
      id: `q_${providerPrefix}_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
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
}

/* =========================================================
   CALL GOOGLE GEMINI API
========================================================= */

export async function callGeminiApi(params: GenerateAiQuestionsParams): Promise<QuizQuestion[]> {
  const apiKey = params.apiKey || getStoredGeminiApiKey();
  if (!apiKey) {
    throw new Error('Kunci API Gemini belum diatur. Silakan masukkan API Key Gemini Anda.');
  }

  const model = params.geminiModel || (params.model as GeminiModel) || getStoredGeminiModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const promptText = buildInstructionText(params) + `\nKembalikan array JSON murni: [ { ... }, { ... } ]`;

  const requestBody = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2500,
      responseMimeType: 'application/json',
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
        throw new Error('Batas kuota Gemini terlampaui. Mengalihkan ke cadangan...');
      } else {
        throw new Error(`Kendala Gemini (${response.status}): ${errorMsg || 'Coba sesaat lagi.'}`);
      }
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Tidak ada respon teks dari Gemini AI.');

    const cleanedJson = cleanJsonResponse(rawText);
    const parsed = JSON.parse(cleanedJson);
    const list = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.data || []);

    if (!Array.isArray(list) || list.length === 0) {
      throw new Error('Format balasan Gemini tidak memuat daftar soal.');
    }

    return normalizeQuestions(list, 'gemini');
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

/* =========================================================
   CALL GROQ API (LPU Inference Engine - Super Cepat)
========================================================= */

export async function callGroqApi(params: GenerateAiQuestionsParams): Promise<QuizQuestion[]> {
  const apiKey = params.apiKey || getStoredGroqApiKey();
  if (!apiKey) {
    throw new Error('Kunci API Groq belum diatur. Silakan masukkan API Key Groq Anda.');
  }

  const model = params.groqModel || (params.model as GroqModel) || getStoredGroqModel();
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  const systemInstruction = buildInstructionText(params) + `
Kembalikan objek JSON dengan format:
{
  "questions": [ { ... }, { ... } ]
}`;

  const requestBody = {
    model,
    messages: [
      {
        role: 'system',
        content: systemInstruction,
      },
      {
        role: 'user',
        content: `Tolong buatkan ${params.count} butir soal ${params.subject} Kelas ${params.grade} SD tentang materi "${params.topic}" dalam format JSON yang telah ditentukan.`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.6,
    max_tokens: 3000,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // Groq super cepat (15s timeout)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const errorMsg = errorJson?.error?.message || '';

      if (response.status === 401) {
        throw new Error('API Key Groq tidak valid. Periksa kembali kunci API Anda di console.groq.com.');
      } else if (response.status === 429) {
        throw new Error('Batas kuota Groq terlampaui. Mengalihkan ke cadangan...');
      } else {
        throw new Error(`Kendala Groq (${response.status}): ${errorMsg || 'Coba sesaat lagi.'}`);
      }
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Tidak ada respon teks dari Groq AI.');
    }

    const cleaned = cleanJsonResponse(rawContent);
    const parsed = JSON.parse(cleaned);
    const list = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.data || []);

    if (!Array.isArray(list) || list.length === 0) {
      throw new Error('Format balasan Groq tidak memuat daftar soal yang valid.');
    }

    return normalizeQuestions(list, 'groq');
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Permintaan ke Groq AI melampaui batas waktu (15 detik).');
      }
      throw err;
    }
    throw new Error('Terjadi kendala saat menghubungi Groq AI.');
  }
}

/* =========================================================
   MESIN HYBRID MULTI-PROVIDER
========================================================= */

export async function generateHybridQuizQuestions(
  params: GenerateAiQuestionsParams
): Promise<HybridGenerateResult> {
  const provider = params.provider || getStoredAiProvider();

  // 1. Coba provider utama yang dipilih
  if (provider === 'groq' && hasGroqApiKey()) {
    try {
      const questions = await callGroqApi(params);
      return {
        questions,
        source: 'groq_api',
        message: `⚡ Berhasil membuat ${questions.length} butir soal materi "${params.topic}" via Groq Cloud (${params.groqModel || getStoredGroqModel()})!`,
      };
    } catch (groqErr: unknown) {
      console.warn('Panggilan Groq gagal, mencoba cadangan:', groqErr);
    }
  } else if (provider === 'gemini' && hasGeminiApiKey()) {
    try {
      const questions = await callGeminiApi(params);
      return {
        questions,
        source: 'gemini_api',
        message: `✨ Berhasil membuat ${questions.length} butir soal materi "${params.topic}" via Google Gemini AI!`,
      };
    } catch (geminiErr: unknown) {
      console.warn('Panggilan Gemini gagal, mencoba cadangan:', geminiErr);
    }
  }

  // 2. Coba provider alternatif jika provider utama gagal/belum ada key
  if (provider === 'groq' && hasGeminiApiKey()) {
    try {
      const questions = await callGeminiApi(params);
      return {
        questions,
        source: 'gemini_api',
        message: `Beralih ke Google Gemini: ${questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
      };
    } catch {
      // lanjut ke fallback lokal
    }
  } else if (provider === 'gemini' && hasGroqApiKey()) {
    try {
      const questions = await callGroqApi(params);
      return {
        questions,
        source: 'groq_api',
        message: `Beralih ke Groq Cloud: ${questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
      };
    } catch {
      // lanjut ke fallback lokal
    }
  }

  // 3. Fallback mulus ke Generator Kurikulum SD lokal (Offline & 100% Reliable)
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
