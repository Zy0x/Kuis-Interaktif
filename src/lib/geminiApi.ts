import type { QuestionType, QuizQuestion, Subject, EducationLevel } from '../types/quiz';
import { generateCurriculumSeedQuestions } from './aiQuestionParser';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export type AiProvider = 'gemini' | 'groq' | 'deepseek';

export type GeminiModel = 
  | 'gemini-3.8-flash'
  | 'gemini-3.6-flash'
  | 'gemini-3.1-flash-lite'
  | 'gemini-3.5-flash-lite'
  | 'gemini-flash-latest'
  | 'gemini-2.0-flash' 
  | 'gemini-2.0-flash-thinking-exp-01-21' 
  | 'gemini-1.5-pro' 
  | 'gemini-1.5-flash' 
  | 'gemini-1.5-flash-8b';

export type GroqModel = 
  | 'qwen/qwen3.8-27b'
  | 'openai/gpt-oss-20b'
  | 'openai/gpt-oss-120b'
  | 'llama-3.3-70b-versatile' 
  | 'llama-3.1-8b-instant' 
  | 'deepseek-r1-distill-llama-70b' 
  | 'gemma2-9b-it' 
  | 'mixtral-8x7b-32768';

export type DeepSeekModel = 
  | 'deepseek-chat' 
  | 'deepseek-reasoner';

const STORAGE_KEY_AI_PROVIDER = 'kuis_sd_ai_provider';
const STORAGE_KEY_GEMINI_API_KEY = 'kuis_sd_gemini_api_key';
const STORAGE_KEY_GEMINI_MODEL = 'kuis_sd_gemini_model';
const STORAGE_KEY_GROQ_API_KEY = 'kuis_sd_groq_api_key';
const STORAGE_KEY_GROQ_MODEL = 'kuis_sd_groq_model';
const STORAGE_KEY_DEEPSEEK_API_KEY = 'kuis_sd_deepseek_api_key';
const STORAGE_KEY_DEEPSEEK_MODEL = 'kuis_sd_deepseek_model';

export interface SupabaseAiStatus {
  checked: boolean;
  available: boolean;
  hasGemini: boolean;
  hasGroq: boolean;
  hasDeepSeek: boolean;
  geminiModels: string[];
  groqModels: string[];
  deepseekModels: string[];
  error?: string | null;
}

export interface GenerateAiQuestionsParams {
  subject: Subject;
  grade: number;
  topic: string;
  count: number;
  educationLevel?: EducationLevel;
  questionType: QuestionType | 'campuran';
  provider?: AiProvider;
  geminiModel?: GeminiModel;
  groqModel?: GroqModel;
  deepseekModel?: DeepSeekModel;
  model?: string; // generic fallback
  apiKey?: string;
  includeAiImages?: boolean; // Otomatis lampirkan ilustrasi AI untuk soal tebak gambar / bergambar
}

export interface HybridGenerateResult {
  questions: QuizQuestion[];
  source: 'gemini_api' | 'groq_api' | 'deepseek_api' | 'curriculum_seed';
  message: string;
}

/* =========================================================
   PROVIDER & KEY STORAGE HELPERS
========================================================= */

export function getStoredAiProvider(): AiProvider {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AI_PROVIDER) as AiProvider;
    if (saved === 'groq') return 'groq';
    if (saved === 'deepseek') return 'deepseek';
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
    const validModels: GeminiModel[] = [
      'gemini-2.0-flash',
      'gemini-2.0-flash-thinking-exp-01-21',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b'
    ];
    if (saved && validModels.includes(saved)) {
      return saved;
    }
    return 'gemini-2.0-flash';
  } catch {
    return 'gemini-2.0-flash';
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
    const validModels: GroqModel[] = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'deepseek-r1-distill-llama-70b',
      'gemma2-9b-it',
      'mixtral-8x7b-32768'
    ];
    if (saved && validModels.includes(saved)) {
      return saved;
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

export function getStoredDeepSeekApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_DEEPSEEK_API_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredDeepSeekApiKey(apiKey: string): void {
  try {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      localStorage.removeItem(STORAGE_KEY_DEEPSEEK_API_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY_DEEPSEEK_API_KEY, trimmed);
    }
  } catch {
    // noop
  }
}

export function hasDeepSeekApiKey(): boolean {
  return Boolean(getStoredDeepSeekApiKey().length > 10);
}

export function getStoredDeepSeekModel(): DeepSeekModel {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DEEPSEEK_MODEL) as DeepSeekModel;
    if (saved === 'deepseek-reasoner') return 'deepseek-reasoner';
    return 'deepseek-chat';
  } catch {
    return 'deepseek-chat';
  }
}

export function saveStoredDeepSeekModel(model: DeepSeekModel): void {
  try {
    localStorage.setItem(STORAGE_KEY_DEEPSEEK_MODEL, model);
  } catch {
    // noop
  }
}

export function hasAnyAiApiKey(): boolean {
  return hasGeminiApiKey() || hasGroqApiKey() || hasDeepSeekApiKey();
}

/* =========================================================
   SUPABASE EDGE FUNCTION AI STATUS & HELPERS (RULE 9 & 10)
========================================================= */

let cachedSupabaseAiStatus: SupabaseAiStatus = {
  checked: false,
  available: false,
  hasGemini: false,
  hasGroq: false,
  hasDeepSeek: false,
  groqModels: [],
  geminiModels: [],
  deepseekModels: [],
  error: null,
};

export function getSupabaseAiStatusSync(): SupabaseAiStatus {
  return cachedSupabaseAiStatus;
}

export async function checkSupabaseAiStatus(forceRefresh = false): Promise<SupabaseAiStatus> {
  if (cachedSupabaseAiStatus.checked && !forceRefresh) {
    return cachedSupabaseAiStatus;
  }

  if (!isSupabaseConfigured || !supabase) {
    cachedSupabaseAiStatus = {
      checked: true,
      available: false,
      hasGemini: false,
      hasGroq: false,
      hasDeepSeek: false,
      groqModels: [],
      geminiModels: [],
      deepseekModels: [],
      error: 'Supabase client belum dikonfigurasi.',
    };
    return cachedSupabaseAiStatus;
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-quiz-ai', {
      body: { action: 'check_status' },
    });

    if (error || !data) {
      cachedSupabaseAiStatus = {
        checked: true,
        available: false,
        hasGemini: false,
        hasGroq: false,
        hasDeepSeek: false,
        groqModels: [],
        geminiModels: [],
        deepseekModels: [],
        error: error?.message || 'Gagal memeriksa status Edge Function Supabase.',
      };
      return cachedSupabaseAiStatus;
    }

    cachedSupabaseAiStatus = {
      checked: true,
      available: Boolean(data.hasGemini || data.hasGroq || data.hasDeepSeek),
      hasGemini: Boolean(data.hasGemini),
      hasGroq: Boolean(data.hasGroq),
      hasDeepSeek: Boolean(data.hasDeepSeek),
      groqModels: Array.isArray(data.groqModels) ? data.groqModels : [],
      geminiModels: Array.isArray(data.geminiModels) ? data.geminiModels : [],
      deepseekModels: Array.isArray(data.deepseekModels) ? data.deepseekModels : [],
      error: null,
    };
    return cachedSupabaseAiStatus;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    cachedSupabaseAiStatus = {
      checked: true,
      available: false,
      hasGemini: false,
      hasGroq: false,
      hasDeepSeek: false,
      groqModels: [],
      geminiModels: [],
      deepseekModels: [],
      error: msg,
    };
    return cachedSupabaseAiStatus;
  }
}

export function isGeminiAvailable(): boolean {
  return hasGeminiApiKey() || Boolean(cachedSupabaseAiStatus.hasGemini);
}

export function isGroqAvailable(): boolean {
  return hasGroqApiKey() || Boolean(cachedSupabaseAiStatus.hasGroq);
}

export function isDeepSeekAvailable(): boolean {
  return hasDeepSeekApiKey() || Boolean(cachedSupabaseAiStatus.hasDeepSeek);
}

export function isAnyAiAvailable(): boolean {
  return isGeminiAvailable() || isGroqAvailable() || isDeepSeekAvailable();
}

/**
 * Panggil Supabase Edge Function server-side (generate-quiz-ai)
 * Menggunakan kredensial dari Supabase Secrets (Rule 9 & 10)
 */
export async function callSupabaseAiEdgeFunction(params: GenerateAiQuestionsParams): Promise<{
  questions: QuizQuestion[];
  provider: 'gemini' | 'groq' | 'deepseek';
  model?: string;
}> {
  if (!supabase) {
    throw new Error('Supabase client tidak tersedia.');
  }

  const defaultProvider: AiProvider = cachedSupabaseAiStatus.hasDeepSeek 
    ? 'deepseek' 
    : (cachedSupabaseAiStatus.hasGroq ? 'groq' : 'gemini');

  const defaultModel = params.provider === 'deepseek'
    ? params.deepseekModel
    : (params.provider === 'groq' ? params.groqModel : params.geminiModel);

  const payload = {
    subject: params.subject,
    grade: params.grade,
    topic: params.topic,
    count: params.count,
    questionType: params.questionType,
    provider: params.provider || defaultProvider,
    model: params.model || defaultModel,
  };

  const { data, error } = await supabase.functions.invoke('generate-quiz-ai', {
    body: payload,
  });

  if (error) {
    throw new Error(`Supabase AI Function error: ${error.message}`);
  }

  if (!data?.success && data?.error) {
    throw new Error(data.error);
  }

  const rawList = Array.isArray(data?.questions) ? data.questions : [];
  if (rawList.length === 0) {
    throw new Error('Supabase AI tidak mengembalikan daftar butir soal yang valid.');
  }

  const normalized = normalizeQuestions(rawList, data.provider || 'supabase', params.includeAiImages);
  return {
    questions: normalized,
    provider: data.provider || 'gemini',
    model: data.model,
  };
}

export interface AiTopicRecommendation {
  topic: string;
  context: string;
}

/**
 * Brainstorming rekomendasi topik cerdas dan dinamis menggunakan AI (DeepSeek / Groq / Gemini)
 * dengan fallback mulus ke bank kurikulum lokal jika offline (Rule 9 & Rule 10).
 */
export async function generateAiTopicIdeas(params: {
  subject: Subject;
  grade: number;
  educationLevel?: EducationLevel;
  provider?: AiProvider;
}): Promise<AiTopicRecommendation[]> {
  const { subject, grade } = params;
  const level = params.educationLevel || (grade >= 10 ? 'SMA' : grade >= 7 ? 'SMP' : 'SD');
  const levelText = level === 'SMA' ? `Kelas ${grade} SMA / SMK` : level === 'SMP' ? `Kelas ${grade} SMP` : `Kelas ${grade} SD`;

  // 1. Coba via Supabase Cloud Edge Function (Server-Side Secrets)
  if (supabase) {
    try {
      const status = await checkSupabaseAiStatus();
      if (status.hasDeepSeek || status.hasGroq || status.hasGemini) {
        const preferredProvider = params.provider || (
          status.hasDeepSeek ? 'deepseek' : (status.hasGroq ? 'groq' : 'gemini')
        );
        const { data, error } = await supabase.functions.invoke('generate-quiz-ai', {
          body: {
            action: 'generate_topics',
            subject,
            grade,
            educationLevel: level,
            provider: preferredProvider,
          },
        });
        if (!error && data?.success && Array.isArray(data?.recommendations) && data.recommendations.length > 0) {
          return data.recommendations.map((r: any) => ({
            topic: String(r.topic || '').trim(),
            context: String(r.context || '').trim(),
          })).filter((r: AiTopicRecommendation) => r.topic.length > 0);
        }
      }
    } catch (edgeErr) {
      console.warn('generateAiTopicIdeas via Edge Function warning:', edgeErr);
    }
  }

  const topicPrompt = `Anda adalah Pakar Kurikulum Merdeka Kemendikbudristek RI untuk ${levelText}. Rekomendasikan 4 topik materi kuis untuk mata pelajaran ${subject} ${levelText} beserta fokus materinya (1 kalimat padat). Kembalikan JSON: { "recommendations": [{ "topic": "...", "context": "..." }] }`;

  // 2. Coba via DeepSeek API lokal jika key tersedia di browser
  if (hasDeepSeekApiKey()) {
    try {
      const apiKey = getStoredDeepSeekApiKey();
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: topicPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 800,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const list = Array.isArray(parsed) ? parsed : (parsed.recommendations || parsed.topics || []);
          if (Array.isArray(list) && list.length > 0) {
            return list.map((r: any) => ({
              topic: String(r.topic || '').trim(),
              context: String(r.context || '').trim(),
            })).filter((r: AiTopicRecommendation) => r.topic.length > 0);
          }
        }
      }
    } catch (deepseekErr) {
      console.warn('generateAiTopicIdeas DeepSeek lokal error:', deepseekErr);
    }
  }

  // 3. Coba via Groq API lokal jika key tersedia di browser
  if (hasGroqApiKey()) {
    try {
      const apiKey = getStoredGroqApiKey();
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: topicPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 800,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const list = Array.isArray(parsed) ? parsed : (parsed.recommendations || parsed.topics || []);
          if (Array.isArray(list) && list.length > 0) {
            return list.map((r: any) => ({
              topic: String(r.topic || '').trim(),
              context: String(r.context || '').trim(),
            })).filter((r: AiTopicRecommendation) => r.topic.length > 0);
          }
        }
      }
    } catch (groqErr) {
      console.warn('generateAiTopicIdeas Groq lokal error:', groqErr);
    }
  }

  // 4. Coba via Gemini API lokal jika key tersedia di browser
  if (hasGeminiApiKey()) {
    try {
      const apiKey = getStoredGeminiApiKey();
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: topicPrompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 800,
            responseMimeType: 'application/json',
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(cleanJsonResponse(rawText));
          const list = Array.isArray(parsed) ? parsed : (parsed.recommendations || parsed.topics || []);
          if (Array.isArray(list) && list.length > 0) {
            return list.map((r: any) => ({
              topic: String(r.topic || '').trim(),
              context: String(r.context || '').trim(),
            })).filter((r: AiTopicRecommendation) => r.topic.length > 0);
          }
        }
      }
    } catch (geminiErr) {
      console.warn('generateAiTopicIdeas Gemini lokal error:', geminiErr);
    }
  }

  // 5. Jika tidak ada AI / offline, kembalikan array kosong agar pemanggil dapat menggunakan preset lokal yang diacak
  return [];
}

export interface AiCapaianPembelajaranResult {
  cp: string;
  goals?: string[];
  source?: 'edge_function' | 'deepseek_local' | 'groq_local' | 'gemini_local' | 'fallback';
}

/**
 * Merumuskan Capaian Pembelajaran (CP) dan Sasaran Kompetensi Spesifik Per Jenjang Kelas
 * menggunakan AI (DeepSeek / Groq / Gemini) secara kontekstual berbasis Kurikulum Merdeka.
 */
export async function generateAiCapaianPembelajaran(params: {
  subject: Subject;
  grade: number;
  educationLevel?: EducationLevel;
  provider?: AiProvider;
}): Promise<AiCapaianPembelajaranResult | null> {
  const { subject, grade } = params;
  const level = params.educationLevel || (grade >= 10 ? 'SMA' : grade >= 7 ? 'SMP' : 'SD');
  const levelText = level === 'SMA' ? `Kelas ${grade} SMA / SMK` : level === 'SMP' ? `Kelas ${grade} SMP` : `Kelas ${grade} SD`;

  // 1. Coba via Supabase Cloud Edge Function (Server-Side Secrets)
  if (supabase) {
    try {
      const status = await checkSupabaseAiStatus();
      if (status.hasDeepSeek || status.hasGroq || status.hasGemini) {
        const preferredProvider = params.provider || (
          status.hasDeepSeek ? 'deepseek' : (status.hasGroq ? 'groq' : 'gemini')
        );
        const { data, error } = await supabase.functions.invoke('generate-quiz-ai', {
          body: {
            action: 'generate_cp',
            subject,
            grade,
            educationLevel: level,
            provider: preferredProvider,
          },
        });
        if (!error && data?.success && typeof data?.cp === 'string' && data.cp.trim()) {
          return {
            cp: data.cp.trim(),
            goals: Array.isArray(data.goals) ? data.goals.map(String) : [],
            source: 'edge_function',
          };
        }
      }
    } catch (edgeErr) {
      console.warn('generateAiCapaianPembelajaran via Edge Function warning:', edgeErr);
    }
  }

  const cpPrompt = `Anda adalah Pakar Kurikulum Merdeka Kemendikbudristek RI untuk ${levelText}.
Tuliskan rumusan Capaian Pembelajaran (CP) yang SPESIFIK untuk ${levelText} (bukan fase umum, melainkan capaian kompetensi khusus ${levelText}) pada mata pelajaran: ${subject}.
Kembalikan JSON murni: { "cp": "Pernyataan CP komprehensif 2-3 kalimat padat untuk ${levelText}...", "goals": ["Tujuan 1", "Tujuan 2"] }`;

  // 2. Coba via DeepSeek API lokal jika key tersedia di browser
  if (hasDeepSeekApiKey()) {
    try {
      const apiKey = getStoredDeepSeekApiKey();
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: cpPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 800,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed?.cp && typeof parsed.cp === 'string' && parsed.cp.trim()) {
            return {
              cp: parsed.cp.trim(),
              goals: Array.isArray(parsed.goals) ? parsed.goals.map(String) : [],
              source: 'deepseek_local',
            };
          }
        }
      }
    } catch (deepseekErr) {
      console.warn('generateAiCapaianPembelajaran DeepSeek lokal error:', deepseekErr);
    }
  }

  // 3. Coba via Groq API lokal jika key tersedia di browser
  if (hasGroqApiKey()) {
    try {
      const apiKey = getStoredGroqApiKey();
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: cpPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 800,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed?.cp && typeof parsed.cp === 'string' && parsed.cp.trim()) {
            return {
              cp: parsed.cp.trim(),
              goals: Array.isArray(parsed.goals) ? parsed.goals.map(String) : [],
              source: 'groq_local',
            };
          }
        }
      }
    } catch (groqErr) {
      console.warn('generateAiCapaianPembelajaran Groq lokal error:', groqErr);
    }
  }

  // 4. Coba via Gemini API lokal jika key tersedia di browser
  if (hasGeminiApiKey()) {
    try {
      const apiKey = getStoredGeminiApiKey();
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: cpPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
            responseMimeType: 'application/json',
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(cleanJsonResponse(rawText));
          if (parsed?.cp && typeof parsed.cp === 'string' && parsed.cp.trim()) {
            return {
              cp: parsed.cp.trim(),
              goals: Array.isArray(parsed.goals) ? parsed.goals.map(String) : [],
              source: 'gemini_local',
            };
          }
        }
      }
    } catch (geminiErr) {
      console.warn('generateAiCapaianPembelajaran Gemini lokal error:', geminiErr);
    }
  }

  return null;
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

  const level = params.educationLevel || (grade >= 10 ? 'SMA' : grade >= 7 ? 'SMP' : 'SD');
  const levelText = level === 'SMA'
    ? `Kelas ${grade} SMA / SMK (Fase ${grade === 10 ? 'E' : 'F'})`
    : level === 'SMP'
      ? `Kelas ${grade} SMP (Fase D)`
      : `Kelas ${grade} SD (Fase ${grade <= 2 ? 'A' : grade <= 4 ? 'B' : 'C'})`;

  const roleText = level === 'SMA'
    ? `Anda adalah Asisten Pakar Kurikulum Merdeka SMA / SMK Indonesia.
Tugas Anda adalah merancang butir soal kuis interaktif berorientasi penalaran analitis kritis tingkat tinggi (HOTS), pengujian konsep mendalam, studi kasus saintifik/sosial kontekstual, dan bahasa Indonesia akademis yang lugas sesuai daya nalar siswa SMA/SMK.`
    : level === 'SMP'
      ? `Anda adalah Asisten Pakar Kurikulum Merdeka Sekolah Menengah Pertama (SMP) Indonesia.
Tugas Anda adalah merancang butir soal kuis interaktif yang komunikatif ramah remaja, merangsang daya nalar terapan, studi kasus kontekstual, dan literasi-numerasi terpadu sesuai fase kognitif siswa SMP.`
      : `Anda adalah Asisten Pakar Kurikulum Merdeka Sekolah Dasar (SD) Indonesia.
Tugas Anda adalah merancang butir soal kuis interaktif yang mendidik, seru, menggunakan bahasa Indonesia yang baik, komunikatif, dan sesuai dengan daya tangkap siswa SD.`;

  return `${roleText}

SPESIFIKASI SOAL:
- Mata Pelajaran: ${subject}
- Tingkat: ${levelText}
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

/**
 * Buat URL ilustrasi edukatif berbasis AI (100% Gratis, tanpa API Key atau kuota).
 * Menggunakan Pollinations AI Engine dengan parameter kurikulum ramah anak.
 */
export function generateAiIllustrationUrl(prompt: string, options?: { width?: number; height?: number; seed?: number }): string {
  const width = options?.width || 600;
  const height = options?.height || 400;
  const seed = options?.seed ?? Math.floor(Math.random() * 1000000);

  // Bersihkan teks prompt dan tambahkan penegasan gaya ilustrasi edukasi SD
  const cleanPrompt = prompt
    .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF,-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const educationalPrompt = `educational illustration for elementary school children, clean colorful 3d vector style, vibrant clear subject: ${cleanPrompt || 'science nature learning'}`;

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(educationalPrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
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

function normalizeQuestions(rawList: any[], providerPrefix: string, autoGenerateImages = false): QuizQuestion[] {
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

    const rawCaption = item.imageCaption ? String(item.imageCaption) : undefined;
    let imageUrl = item.imageUrl ? String(item.imageUrl) : undefined;

    // Otomatis pasang ilustrasi gambar jika diminta atau bertipe tebak gambar
    if (!imageUrl && (autoGenerateImages || qType === 'image_guess') && (rawCaption || item.text)) {
      imageUrl = generateAiIllustrationUrl(rawCaption || String(item.text).slice(0, 80));
    }

    return {
      id: `q_${providerPrefix}_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      text: String(item.text || `Pertanyaan #${idx + 1}`),
      type: qType,
      imageUrl,
      imageCaption: rawCaption,
      options,
      correctIndex,
      explanation: String(item.explanation || 'Pembahasan materi terkait konsep kurikulum.'),
      points,
      customDurationSec,
      acceptableAnswers: Array.isArray(item.acceptableAnswers) ? item.acceptableAnswers.map(String) : undefined,
      matchingPairs: Array.isArray(item.matchingPairs) ? item.matchingPairs : undefined,
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

    return normalizeQuestions(list, 'gemini', params.includeAiImages);
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

    return normalizeQuestions(list, 'groq', params.includeAiImages);
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
   CALL DEEPSEEK API (DeepSeek-V3 & DeepSeek-R1)
========================================================= */

export async function callDeepSeekApi(params: GenerateAiQuestionsParams): Promise<QuizQuestion[]> {
  const apiKey = params.apiKey || getStoredDeepSeekApiKey();
  if (!apiKey) {
    throw new Error('Kunci API DeepSeek belum diatur. Silakan masukkan API Key DeepSeek Anda.');
  }

  const model = params.deepseekModel || (params.model as DeepSeekModel) || getStoredDeepSeekModel();
  const endpoint = 'https://api.deepseek.com/chat/completions';

  const systemInstruction = buildInstructionText(params) + `
Kembalikan objek JSON dengan format:
{
  "questions": [ { ... }, { ... } ]
}`;

  const isReasoner = model === 'deepseek-reasoner';

  const requestBody: Record<string, any> = {
    model,
    messages: [
      {
        role: isReasoner ? 'user' : 'system',
        content: systemInstruction,
      },
      {
        role: 'user',
        content: `Tolong buatkan ${params.count} butir soal ${params.subject} Kelas ${params.grade} SD tentang materi "${params.topic}" dalam format JSON yang telah ditentukan. Pastikan bahasa ramah anak SD.`,
      },
    ],
    max_tokens: 3500,
  };

  // deepseek-chat supports response_format and temperature; deepseek-reasoner restricts them in some versions
  if (!isReasoner) {
    requestBody.response_format = { type: 'json_object' };
    requestBody.temperature = 0.6;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

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
        throw new Error('API Key DeepSeek tidak valid. Periksa kembali kunci API Anda di platform.deepseek.com.');
      } else if (response.status === 429) {
        throw new Error('Batas kuota DeepSeek terlampaui. Mengalihkan ke cadangan...');
      } else {
        throw new Error(`Kendala DeepSeek (${response.status}): ${errorMsg || 'Coba sesaat lagi.'}`);
      }
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Tidak ada respon teks dari DeepSeek AI.');
    }

    const cleaned = cleanJsonResponse(rawContent);
    let parsed: any = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        parsed = JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
      } else {
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
        }
      }
    }

    const list = Array.isArray(parsed) ? parsed : (parsed?.questions || parsed?.data || []);

    if (!Array.isArray(list) || list.length === 0) {
      throw new Error('Format balasan DeepSeek tidak memuat daftar soal yang valid.');
    }

    return normalizeQuestions(list, 'deepseek', params.includeAiImages);
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Permintaan ke DeepSeek AI melampaui batas waktu (25 detik).');
      }
      throw err;
    }
    throw new Error('Terjadi kendala saat menghubungi DeepSeek AI.');
  }
}

/* =========================================================
   MESIN HYBRID MULTI-PROVIDER
========================================================= */

export async function generateHybridQuizQuestions(
  params: GenerateAiQuestionsParams
): Promise<HybridGenerateResult> {
  const provider = params.provider || getStoredAiProvider();

  // 1. Coba via Supabase Cloud Edge Function jika provider tersedia di Supabase Secrets (Rule 9 & Rule 10)
  let cloudStatus: SupabaseAiStatus | null = null;
  try {
    cloudStatus = await checkSupabaseAiStatus();
  } catch (statusErr) {
    console.warn('Cek status Supabase AI notice:', statusErr);
  }

  const isCloudDeepSeek = Boolean(cloudStatus?.hasDeepSeek);
  const isCloudGroq = Boolean(cloudStatus?.hasGroq);
  const isCloudGemini = Boolean(cloudStatus?.hasGemini);

  if (provider === 'deepseek' && isCloudDeepSeek) {
    try {
      const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'deepseek' });
      return {
        questions: result.questions,
        source: 'deepseek_api',
        message: `🐋 Berhasil meracik ${result.questions.length} butir soal materi "${params.topic}" via DeepSeek Cloud (${result.model || 'V3/R1'})!`,
      };
    } catch (cloudDeepSeekErr: unknown) {
      console.warn('Panggilan DeepSeek via Supabase Edge Function gagal, mencoba cadangan:', cloudDeepSeekErr);
    }
  } else if (provider === 'groq' && isCloudGroq) {
    try {
      const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'groq' });
      return {
        questions: result.questions,
        source: 'groq_api',
        message: `⚡ Berhasil meracik ${result.questions.length} butir soal materi "${params.topic}" via Groq Cloud (${result.model || 'LPU Engine'})!`,
      };
    } catch (cloudGroqErr: unknown) {
      console.warn('Panggilan Groq via Supabase Edge Function gagal, mencoba cadangan:', cloudGroqErr);
    }
  } else if (provider === 'gemini' && isCloudGemini) {
    try {
      const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'gemini' });
      return {
        questions: result.questions,
        source: 'gemini_api',
        message: `✨ Berhasil meracik ${result.questions.length} butir soal materi "${params.topic}" via Google Gemini AI (${result.model || 'PRO'})!`,
      };
    } catch (cloudGeminiErr: unknown) {
      console.warn('Panggilan Gemini via Supabase Edge Function gagal, mencoba cadangan:', cloudGeminiErr);
    }
  }

  // 2. Coba provider utama dengan API Key lokal jika tersedia di browser
  if (provider === 'deepseek' && hasDeepSeekApiKey()) {
    try {
      const questions = await callDeepSeekApi(params);
      return {
        questions,
        source: 'deepseek_api',
        message: `🐋 Berhasil membuat ${questions.length} butir soal materi "${params.topic}" via DeepSeek AI Lokal (${params.deepseekModel || getStoredDeepSeekModel()})!`,
      };
    } catch (deepseekErr: unknown) {
      console.warn('Panggilan DeepSeek lokal gagal, mencoba cadangan:', deepseekErr);
    }
  } else if (provider === 'groq' && hasGroqApiKey()) {
    try {
      const questions = await callGroqApi(params);
      return {
        questions,
        source: 'groq_api',
        message: `⚡ Berhasil membuat ${questions.length} butir soal materi "${params.topic}" via Groq Cloud Lokal (${params.groqModel || getStoredGroqModel()})!`,
      };
    } catch (groqErr: unknown) {
      console.warn('Panggilan Groq lokal gagal, mencoba cadangan:', groqErr);
    }
  } else if (provider === 'gemini' && hasGeminiApiKey()) {
    try {
      const questions = await callGeminiApi(params);
      return {
        questions,
        source: 'gemini_api',
        message: `✨ Berhasil membuat ${questions.length} butir soal materi "${params.topic}" via Google Gemini AI Lokal!`,
      };
    } catch (geminiErr: unknown) {
      console.warn('Panggilan Gemini lokal gagal, mencoba cadangan:', geminiErr);
    }
  }

  // 3. Coba provider alternatif via Cloud atau Kunci Lokal jika provider utama belum siap/gagal
  if (provider === 'deepseek') {
    if (isCloudGroq) {
      try {
        const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'groq' });
        return {
          questions: result.questions,
          source: 'groq_api',
          message: `Beralih ke Groq Cloud: ${result.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
        };
      } catch {
        // lanjut
      }
    }
    if (isCloudGemini) {
      try {
        const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'gemini' });
        return {
          questions: result.questions,
          source: 'gemini_api',
          message: `Beralih ke Google Gemini Cloud: ${result.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
        };
      } catch {
        // lanjut
      }
    }
    if (hasGroqApiKey()) {
      try {
        const questions = await callGroqApi(params);
        return {
          questions,
          source: 'groq_api',
          message: `Beralih ke Groq: ${questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
        };
      } catch {
        // lanjut
      }
    }
    if (hasGeminiApiKey()) {
      try {
        const questions = await callGeminiApi(params);
        return {
          questions,
          source: 'gemini_api',
          message: `Beralih ke Google Gemini: ${questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
        };
      } catch {
        // lanjut
      }
    }
  } else if (provider === 'groq') {
    if (isCloudDeepSeek) {
      try {
        const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'deepseek' });
        return {
          questions: result.questions,
          source: 'deepseek_api',
          message: `Beralih ke DeepSeek Cloud: ${result.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
        };
      } catch {
        // lanjut
      }
    }
    if (isCloudGemini) {
      try {
        const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'gemini' });
        return {
          questions: result.questions,
          source: 'gemini_api',
          message: `Beralih ke Google Gemini Cloud: ${result.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
        };
      } catch {
        // lanjut
      }
    }
    if (hasDeepSeekApiKey()) {
      try {
        const questions = await callDeepSeekApi(params);
        return {
          questions,
          source: 'deepseek_api',
          message: `Beralih ke DeepSeek: ${questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
        };
      } catch {
        // lanjut
      }
    }
    if (hasGeminiApiKey()) {
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
    }
  } else if (provider === 'gemini') {
    if (isCloudDeepSeek) {
      try {
        const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'deepseek' });
        return {
          questions: result.questions,
          source: 'deepseek_api',
          message: `Beralih ke DeepSeek Cloud: ${result.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
        };
      } catch {
        // lanjut
      }
    }
    if (isCloudGroq) {
      try {
        const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'groq' });
        return {
          questions: result.questions,
          source: 'groq_api',
          message: `Beralih ke Groq Cloud: ${result.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
        };
      } catch {
        // lanjut
      }
    }
    if (hasDeepSeekApiKey()) {
      try {
        const questions = await callDeepSeekApi(params);
        return {
          questions,
          source: 'deepseek_api',
          message: `Beralih ke DeepSeek: ${questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
        };
      } catch {
        // lanjut
      }
    }
    if (hasGroqApiKey()) {
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
  }

  // 4. Fallback mulus ke Generator Kurikulum SD lokal (Offline & 100% Reliable)
  const localQuestions = generateCurriculumSeedQuestions(
    params.topic,
    params.subject,
    params.grade,
    params.count,
    params.questionType
  );

  if (params.includeAiImages) {
    localQuestions.forEach((q) => {
      if (!q.imageUrl) {
        q.imageUrl = generateAiIllustrationUrl(q.imageCaption || q.text.slice(0, 80));
      }
    });
  }

  return {
    questions: localQuestions,
    source: 'curriculum_seed',
    message: `Berhasil membuat ${localQuestions.length} butir soal materi "${params.topic}" via Generator Kurikulum SD!`,
  };
}
