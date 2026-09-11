import type { QuestionType, QuizQuestion, Subject, EducationLevel, AiQuizMetadata } from '../types/quiz';
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

export type EngineHealthStatus = 'ready' | 'busy' | 'quota_exhausted' | 'error' | 'unconfigured';

export interface EngineHealthDetail {
  status: EngineHealthStatus;
  message: string;
  label: string;
  description: string;
  color: string;
  isCloud: boolean;
  isCustomKey: boolean;
}

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
  geminiError?: string | null;
  groqError?: string | null;
  deepseekError?: string | null;
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
  typeProportions?: {
    multiple_choice?: number;
    true_false?: number;
    short_answer?: number;
    matching_pairs?: number;
  };
  contextNotes?: string;
  cognitiveFocus?: 'auto' | 'balanced' | 'hots' | 'lots' | 'custom';
  cognitiveCustomLevels?: Array<'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6'>;
  cognitiveProportions?: Partial<Record<'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6', number>>;
  kurmerContext?: 'auto' | 'daily_life' | 'science_nature' | 'literacy_numeracy' | 'general';
  mcOptionCount?: number; // 3, 4, atau 5 opsi pilihan ganda
  trueFalseStyle?: 'benar_salah' | 'sesuai_tidak' | 'ya_tidak';
  matchingPairCount?: number; // 3, 4, atau 5 pasang menjodohkan
  allowLocalFallback?: boolean; // false untuk mencegah silent fallback ke lokal saat cloud limit
}

export type { AiQuizMetadata };

export interface HybridGenerateResult {
  questions: QuizQuestion[];
  source: 'gemini_api' | 'groq_api' | 'deepseek_api' | 'curriculum_seed';
  message: string;
  metadata?: AiQuizMetadata;
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
      geminiError: data.geminiError || null,
      groqError: data.groqError || null,
      deepseekError: data.deepseekError || null,
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

/**
 * Mendeteksi kesehatan dan ketersediaan mesin pembuat soal secara cerdas & informatif
 * Mengetahui apakah mesin Siap, Sedang Sibuk, Batas Kuota Tercapai, atau Gangguan
 */
export function getEngineHealthDetail(
  provider: 'local' | 'deepseek' | 'groq' | 'gemini',
  status?: SupabaseAiStatus
): EngineHealthDetail {
  const aiStatus = status || cachedSupabaseAiStatus;

  const formatHealth = (
    st: EngineHealthStatus,
    msg: string,
    isCloud: boolean,
    isCustomKey: boolean
  ): EngineHealthDetail => {
    const meta = {
      ready: {
        label: 'Siap Digunakan',
        color: '#10b981',
        description: 'Layanan AI dalam kondisi prima dan siap memproses pembuatan kuis.',
      },
      busy: {
        label: 'Sedang Sibuk',
        color: '#f59e0b',
        description: 'Server sedang memproses antrean tinggi. Pembuatan kuis mungkin membutuhkan waktu lebih lama.',
      },
      quota_exhausted: {
        label: 'Limit Kuota Habis',
        color: '#f43f5e',
        description: 'Batas laju permintaan kuota API harian telah tercapai.',
      },
      error: {
        label: 'Gangguan Mesin',
        color: '#ef4444',
        description: 'Layanan AI mengalami kendala sambungan atau kegagalan respon server.',
      },
      unconfigured: {
        label: 'Belum Disetel',
        color: '#64748b',
        description: 'Kunci API pribadi atau kredensial server belum disetel.',
      },
    }[st];

    return {
      status: st,
      message: msg,
      label: meta.label,
      description: meta.description,
      color: meta.color,
      isCloud,
      isCustomKey,
    };
  };

  if (provider === 'local') {
    return formatHealth('ready', 'Siap Digunakan', false, false);
  }

  if (provider === 'deepseek') {
    const hasCustom = hasDeepSeekApiKey();
    const hasCloud = Boolean(aiStatus.hasDeepSeek);
    if (!hasCustom && !hasCloud) {
      return formatHealth('unconfigured', 'Kunci API belum disetel', false, false);
    }
    const err = (aiStatus.deepseekError || '').toLowerCase();
    if (err.includes('429') || err.includes('insufficient_quota') || err.includes('quota') || err.includes('balance') || err.includes('rate_limit')) {
      return formatHealth('quota_exhausted', 'Limit Kuota Tercapai', hasCloud, hasCustom);
    }
    if (err.includes('503') || err.includes('504') || err.includes('overload') || err.includes('busy')) {
      return formatHealth('busy', 'Sedang Sibuk', hasCloud, hasCustom);
    }
    if (aiStatus.deepseekError && !hasCustom) {
      return formatHealth('error', 'Gangguan Koneksi', hasCloud, hasCustom);
    }
    return formatHealth('ready', 'Siap Digunakan', hasCloud, hasCustom);
  }

  if (provider === 'groq') {
    const hasCustom = hasGroqApiKey();
    const hasCloud = Boolean(aiStatus.hasGroq);
    if (!hasCustom && !hasCloud) {
      return formatHealth('unconfigured', 'Kunci API belum disetel', false, false);
    }
    const err = (aiStatus.groqError || '').toLowerCase();
    if (err.includes('429') || err.includes('rate_limit') || err.includes('quota') || err.includes('tokens per minute')) {
      return formatHealth('quota_exhausted', 'Batas Kuota Tercapai', hasCloud, hasCustom);
    }
    if (err.includes('503') || err.includes('504') || err.includes('overload') || err.includes('busy')) {
      return formatHealth('busy', 'Sedang Sibuk', hasCloud, hasCustom);
    }
    if (aiStatus.groqError && !hasCustom) {
      return formatHealth('error', 'Gangguan Jaringan', hasCloud, hasCustom);
    }
    return formatHealth('ready', 'Siap Digunakan', hasCloud, hasCustom);
  }

  if (provider === 'gemini') {
    const hasCustom = hasGeminiApiKey();
    const hasCloud = Boolean(aiStatus.hasGemini);
    if (!hasCustom && !hasCloud) {
      return formatHealth('unconfigured', 'Kunci API belum disetel', false, false);
    }
    const err = (aiStatus.geminiError || '').toLowerCase();
    if (err.includes('429') || err.includes('resource_exhausted') || err.includes('quota')) {
      return formatHealth('quota_exhausted', 'Batas Kuota Tercapai', hasCloud, hasCustom);
    }
    if (err.includes('503') || err.includes('504') || err.includes('busy') || err.includes('overload')) {
      return formatHealth('busy', 'Sedang Sibuk', hasCloud, hasCustom);
    }
    if (aiStatus.geminiError && !hasCustom) {
      return formatHealth('error', 'Koneksi Bermasalah', hasCloud, hasCustom);
    }
    return formatHealth('ready', 'Siap Digunakan', hasCloud, hasCustom);
  }

  return formatHealth('ready', 'Siap Digunakan', false, false);
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
  metadata?: AiQuizMetadata;
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

  const normalized = normalizeQuestions(rawList, data.provider || 'supabase', params.includeAiImages, params.mcOptionCount);
  return {
    questions: normalized,
    provider: data.provider || 'gemini',
    model: data.model,
    metadata: {
      title: data?.title || data?.quizTitle,
      description: data?.description || data?.quizDescription,
      coverEmoji: data?.coverEmoji || data?.emoji,
      badgeTitle: data?.badgeTitle || data?.badge,
      durationPerQuestionSec: typeof data?.durationPerQuestionSec === 'number' ? data.durationPerQuestionSec : undefined,
      themeColor: typeof data?.themeColor === 'string' ? data.themeColor : undefined,
    },
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

  const level = params.educationLevel || (grade >= 10 ? 'SMA' : grade >= 7 ? 'SMP' : 'SD');
  const mcCount = params.mcOptionCount || (level === 'SMA' ? 5 : (level === 'SD' && grade <= 2 ? 3 : 4));
  const mcLetters = ['A', 'B', 'C', 'D', 'E'].slice(0, mcCount).join(', ');
  const matchingCount = params.matchingPairCount || (level === 'SD' ? 3 : 4);
  const tfLabel = params.trueFalseStyle === 'sesuai_tidak'
    ? '["Sesuai", "Tidak Sesuai"]'
    : params.trueFalseStyle === 'ya_tidak'
    ? '["Ya", "Tidak"]'
    : '["Benar", "Salah"]';

  let formatInstruction = '';
  if (params.typeProportions) {
    const p = params.typeProportions;
    const parts: string[] = [];
    if (p.multiple_choice && p.multiple_choice > 0) parts.push(`- ${p.multiple_choice} butir 'multiple_choice' (Pilihan ganda dengan ${mcCount} opsi: ${mcLetters})`);
    if (p.true_false && p.true_false > 0) parts.push(`- ${p.true_false} butir 'true_false' (Benar atau Salah dengan opsi ${tfLabel})`);
    if (p.short_answer && p.short_answer > 0) parts.push(`- ${p.short_answer} butir 'short_answer' (Isian singkat dengan acceptableAnswers)`);
    if (p.matching_pairs && p.matching_pairs > 0) parts.push(`- ${p.matching_pairs} butir 'matching_pairs' (Menjodohkan konsep dengan ${matchingCount} pasang matchingPairs)`);
    if (parts.length > 0) {
      formatInstruction = `Wajib ikuti proporsi jumlah tipe soal berikut secara tepat:\n${parts.join('\n')}`;
    }
  }
  
  if (!formatInstruction) {
    if (questionType === 'campuran') {
      formatInstruction = `Variasikan tipe soal secara seimbang antara:
- 'multiple_choice' (Pilihan ganda dengan ${mcCount} opsi: ${mcLetters})
- 'true_false' (Benar atau Salah dengan 2 opsi ${tfLabel})
- 'short_answer' (Isian singkat dengan acceptableAnswers berisi sinonim/kunci)
- 'matching_pairs' (Menjodohkan konsep dengan ${matchingCount} pasang matchingPairs: [{left, right}])
- 'image_guess' (Tebak gambar misteri dengan imageCaption)`;
    } else if (questionType === 'matching_pairs') {
    formatInstruction = `Gunakan tipe 'matching_pairs'. Setiap soal wajib memiliki properti 'matchingPairs' berisi tepat ${matchingCount} pasang objek { "left": "...", "right": "..." } yang saling berpasangan secara tepat.`;
  } else if (questionType === 'short_answer') {
    formatInstruction = `Gunakan tipe 'short_answer'. 'options' berisi 1 kunci utama, dan 'acceptableAnswers' berisi 1-4 variasi ejaan atau sinonim yang dianggap benar.`;
  } else if (questionType === 'true_false') {
    formatInstruction = `Gunakan tipe 'true_false'. 'options' wajib tepat ${tfLabel}, dan correctIndex bernilai 0 jika pilihan pertama benar atau 1 jika pilihan kedua benar.`;
  } else if (questionType === 'image_guess') {
    formatInstruction = `Gunakan tipe 'image_guess'. Sertakan 'imageCaption' berupa nama objek/konsep yang harus ditebak, serta ${mcCount} pilihan 'options' (${mcLetters}).`;
    } else {
      formatInstruction = `Gunakan tipe 'multiple_choice'. Sertakan tepat ${mcCount} pilihan jawaban yang mendidik pada array 'options' (${mcLetters}).`;
    }
  }
  const levelText = level === 'SMA'
    ? `Kelas ${grade} SMA / SMK`
    : level === 'SMP'
      ? `Kelas ${grade} SMP`
      : `Kelas ${grade} SD`;

  // 1. Karakteristik Fase Kurikulum Merdeka & Bahasa Peserta Didik
  const faseLabel = level === 'SMA'
    ? (grade === 10 ? 'Fase E • Kelas 10 SMA/SMK' : 'Fase F • Kelas 11-12 SMA/SMK')
    : level === 'SMP'
      ? 'Fase D • Kelas 7-9 SMP'
      : grade <= 2
        ? 'Fase A • Kelas 1-2 SD • Usia 6-8 Tahun'
        : grade <= 4
          ? 'Fase B • Kelas 3-4 SD • Usia 8-10 Tahun'
          : 'Fase C • Kelas 5-6 SD • Usia 10-12 Tahun';

  let phasePedagogyRules = '';
  if (level === 'SD') {
    if (grade <= 2) {
      phasePedagogyRules = `PANDUAN BAHASA & DAYA NALAR KHUSUS FASE A (KELAS 1-2 SD):
- Gunakan bahasa yang SANGAT KONKRET, kalimat pendek dan lugas (maksimal 1-2 klausa per kalimat).
- Hindari istilah ilmiah atau kosakata abstrak yang belum dikenal anak usia 6-8 tahun.
- Tokoh/stimulus berbasis keseharian anak: keluarga, teman bermain, hewan peliharaan, mainan, benda di kelas.
- Soal HOTS pada Fase A: mengelompokkan benda berdasarkan ciri yang teramati, menemukan perbedaan/persamaan, memprediksi kejadian langsung, atau memecahkan masalah hitung konkret sederhana.`;
    } else if (grade <= 4) {
      phasePedagogyRules = `PANDUAN BAHASA & DAYA NALAR KHUSUS FASE B (KELAS 3-4 SD):
- Awali dengan stimulus cerita mini kontekstual (2-3 kalimat lugas, ceria, dan bersahabat).
- Kosakata komunikatif edukatif sesuai perkembangan nalar anak usia 8-10 tahun.
- Soal HOTS pada Fase B: membandingkan dua kondisi/peristiwa, menelaah hubungan sebab-akibat sederhana, menafsirkan data sederhana (misal tabel buah, jadwal, atau benda sekitar), dan mengambil kesimpulan logis.`;
    } else {
      phasePedagogyRules = `PANDUAN BAHASA & DAYA NALAR KHUSUS FASE C (KELAS 5-6 SD):
- Bahasa bernalar analitis, terstruktur, komunikatif, dan memicu daya kritis anak usia 10-12 tahun.
- Soal HOTS pada Fase C: studi kasus kontekstual, keterkaitan sebab-akibat multi-faktor, evaluasi alternatif solusi terbaik, mendeteksi kesalahan argumen, dan pemecahan masalah (problem solving) terpadu.`;
    }
  } else if (level === 'SMP') {
    phasePedagogyRules = `PANDUAN BAHASA & DAYA NALAR FASE D (SMP):
- Bahasa komunikatif ramah remaja, merangsang daya nalar kritis, studi kasus lingkungan/sosial terpadu, dan literasi-numerasi terapan.`;
  } else {
    phasePedagogyRules = `PANDUAN BAHASA & DAYA NALAR FASE E/F (SMA/SMK):
- Bahasa akademis baku yang lugas, penalaran saintifik/sosial tingkat tinggi, analisis data, evaluasi komparatif, dan pemecahan masalah kompleks.`;
  }

  // 2. Fokus Kognitif (HOTS / MOTS / LOTS / Custom)
  const cognitiveFocus = params.cognitiveFocus || 'auto';
  let cognitiveInstruction = '';
  if (cognitiveFocus === 'hots') {
    cognitiveInstruction = `FOKUS KOGNITIF: 100% SOAL HOTS (Higher Order Thinking Skills - Level Kognitif C4 Menganalisis, C5 Mengevaluasi, C6 Mengkreasi/Merancang Solusi).
- WAJIB diawali stimulus nyata (skenario kasus mini, pengamatan fenomena, atau data konkret sederhana).
- DILARANG membuat soal hafalan kamus kering (seperti "Apa pengertian dari...", "Sebutkan 3 macam...").
- Siswa harus menalar, membandingkan informasi pada stimulus, dan mengambil kesimpulan untuk menemukan jawaban yang tepat.`;
  } else if (cognitiveFocus === 'lots') {
    cognitiveInstruction = `FOKUS KOGNITIF: PENGUATAN FONDASI & PEMAHAMAN KONSEP DASAR (Level Kognitif C1 Mengingat Fakta Esensial, C2 Memahami Konsep, C3 Aplikasi Langsung).
- Fokuskan pada kejelasan konsep inti materi agar siswa yang baru belajar atau sedang remedial memahaminya secara kokoh.
- Bahasa bersahabat, membimbing nalar anak secara bertahap tanpa jebakan yang membingungkan.`;
  } else if (cognitiveFocus === 'custom' && params.cognitiveCustomLevels && params.cognitiveCustomLevels.length > 0) {
    const levelNames: Record<string, string> = {
      c1: 'C1 (Mengingat)', c2: 'C2 (Memahami)', c3: 'C3 (Mengaplikasikan)',
      c4: 'C4 (Menganalisis)', c5: 'C5 (Mengevaluasi)', c6: 'C6 (Mengkreasi)',
    };
    const proportions = params.cognitiveProportions;
    const levelList = params.cognitiveCustomLevels.map(l => {
      const pct = proportions?.[l as keyof typeof proportions];
      return pct !== undefined ? `${levelNames[l]} ${pct}%` : levelNames[l];
    }).join(', ');
    const hasProportions = proportions && Object.keys(proportions).length > 0;
    cognitiveInstruction = `FOKUS KOGNITIF KUSTOM: Distribusikan soal sesuai level berikut — ${levelList}.
${hasProportions ? '- Persentase di atas adalah target distribusi, usahakan sedekat mungkin.' : '- Distribusikan soal secara merata di antara level yang dipilih.'}
- Setiap butir soal harus mencerminkan karakteristik level kognitif yang dituju secara akurat.`;
  } else if (cognitiveFocus === 'balanced') {
    cognitiveInstruction = `FOKUS KOGNITIF: KOMBINASI BERIMBANG STANDAR ASESMEN NASIONAL (40% MOTS C2-C3 Pemahaman/Aplikasi Konsep + 60% HOTS C4-C5 Penalaran Analitis & Studi Kasus).
- Padukan antara pengujian pemahaman konsep inti materi dengan soal bernalar berbasis stimulus yang menantang rasa ingin tahu siswa.`;
  } else {
    // 'auto'
    cognitiveInstruction = `FOKUS KOGNITIF: OTOMATIS sesuai fase & jenjang (${faseLabel}).
- Tentukan sendiri distribusi level kognitif Bloom (C1-C6) yang paling tepat untuk materi ini pada jenjang yang dimaksud.
- Prioritaskan soal yang membangun nalar (bukan sekadar hafalan), dengan proporsi HOTS minimal 40%.`;
  }

  // 3. Konteks Stimulus Kurikulum Merdeka
  const kurmerContext = params.kurmerContext || 'auto';
  let contextInstruction = '';
  if (kurmerContext === 'daily_life') {
    contextInstruction = `TEMA STIMULUS: Keseharian & Budaya Nusantara (Kurikulum Merdeka).
- Integrasikan latar nyata kehidupan anak Indonesia (rumah bersama keluarga, pertemanan di sekolah, pasar tradisional, permainan tradisional, atau kerja bakti warga) dengan karakter akrab (Siti, Edo, Dayu, Budi, Lani, Beni).`;
  } else if (kurmerContext === 'science_nature') {
    contextInstruction = `TEMA STIMULUS: Eksplorasi Sains, Alam Sekitar & Kepedulian Lingkungan.
- Awali butir soal dengan fenomena alam konkret (pengamatan tumbuhan di halaman sekolah, hewan peliharaan, perubahan cuaca, siklus air, daur ulang sampah, atau hemat energi).`;
  } else if (kurmerContext === 'literacy_numeracy') {
    contextInstruction = `TEMA STIMULUS: Penguatan Literasi Informasi & Numerasi Terapan (AKM).
- Hadirkan data konkret mini (daftar belanjaan di kantin, catatan berat barang, perbandingan waktu kegiatan, atau petunjuk langkah praktis) yang harus dicermati peserta didik.`;
  } else if (kurmerContext === 'general') {
    contextInstruction = `TEMA STIMULUS: Kontekstual & Relevan dengan Kehidupan Nyata.
- Tautkan materi pelajaran dengan situasi nyata yang masuk akal dan relevan bagi peserta didik.`;
  } else {
    // 'auto'
    contextInstruction = `TEMA STIMULUS: OTOMATIS — pilih sendiri konteks/latar cerita yang paling relevan, menarik, dan autentik untuk topik ini pada jenjang ${faseLabel}. Prioritaskan cerita berbasis kehidupan nyata peserta didik Indonesia.`;
  }

  const roleText = `Anda bertindak murni sebagai ENGINE GENERATOR DATA SOAL berstandar resmi Kurikulum Merdeka (Panduan Pembelajaran & Asesmen BSKAP Kemendikdasmen RI).
Anda BUKAN pemandu kuis interaktif, BUKAN asisten obrolan, dan BUKAN lawan bermain kuis.`;

  const imageInstruction = params.includeAiImages
    ? `\nFITUR ILUSTRASI GAMBAR EDUKASI (AKTIF):
WAJIB sertakan properti berikut pada setiap butir soal yang dihasilkan:
- 'imageCaption': Nama objek/konsep visual dalam 1-4 kata Bahasa Indonesia yang singkat dan spesifik.
  CONTOH BAIK: "Proses Evaporasi", "Organ Jantung Manusia", "Siklus Air", "Peta Benua Asia", "Pecahan 1 per 4"
  CONTOH BURUK: "gambar yang relevan", "ilustrasi soal ini", "konsep materi"
- 'imagePrompt': Deskripsi visual 1 kalimat dalam Bahasa Inggris yang SANGAT SPESIFIK dan teknis, cocok untuk mesin gambar AI.
  Format wajib: "[SUBJEK UTAMA SPESIFIK], [GAYA VISUAL], [DETAIL TEKNIS], educational diagram, white background"
  CONTOH BAIK:
  - "Water evaporation process diagram showing sun heating ocean surface with water vapor rising and arrows, educational textbook illustration, white background, labeled"
  - "Human heart anatomy cross-section diagram with labeled chambers, arteries and veins, medical textbook style, clean white background"
  - "Water cycle diagram showing evaporation condensation precipitation labeled with arrows, elementary school science textbook style"
  - "Fraction 1/4 visual with a circle divided into 4 equal parts with one part shaded blue, simple flat educational illustration"
  CONTOH BURUK (DILARANG):
  - "educational illustration of the concept" (terlalu generik)
  - "diagram showing the material" (tidak spesifik)
  - "image about this question" (tidak ada deskripsi visual)\n`
    : '';

  const contextBlock = params.contextNotes && params.contextNotes.trim()
    ? `\n- Catatan Khusus Pendidik: "${params.contextNotes.trim()}"`
    : '';

  return `${roleText}

SPESIFIKASI KURIKULUM MERDEKA & SASARAN BELAJAR:
- Mata Pelajaran: ${subject}
- Tingkat / Jenjang: ${levelText} (${faseLabel})
- Topik / Materi: "${topic}"${contextBlock}
- Target Jumlah: TEPAT ${count} butir soal lengkap
- ${cognitiveInstruction}
- ${contextInstruction}
- Profil Pelajar Pancasila: Integrasikan secara alami nilai-nilai karakter (Bernalar Kritis, Mandiri, Gotong Royong, Kreatif) ke dalam konteks soal.
- Format: ${formatInstruction}${imageInstruction}

${phasePedagogyRules}

STANDAR KUALITAS BUTIR SOAL (ANTI-AI SLOP & HIGH-PEDAGOGY):
1. Stimulus Nyata & Kontekstual: Setiap soal wajib memiliki konteks atau skenario pemantik (misal: "Di perpustakaan sekolah...", "Ibu membeli buah...", "Saat mengamati daun..."). DILARANG membuat pertanyaan hafalan kamus kering ("Apa pengertian...", "Sebutkan definisi...").
2. Pengecoh Masuk Akal (Plausible Distractors): Pilihan salah pada 'options' WAJIB berasal dari miskonsepsi umum peserta didik, BUKAN jawaban konyol yang terlalu mudah ditebak.
3. Kesetaraan Panjang Opsi: Panjang teks pilihan jawaban (A, B, C, D) harus proporsional dan seimbang. DILARANG membuat kunci jawaban selalu menjadi pilihan paling panjang!
4. Pembahasan Edukatif Berbobot (Explanation): Properti "explanation" WAJIB menjelaskan konsep mengapa jawaban benar dan mengapa opsi lain keliru dengan bahasa santun dan menumbuhkan rasa percaya diri anak (1-3 kalimat).

ATURAN WAJIB OUTPUT:
1. Kembalikan HANYA format JSON valid tanpa pembuka/penutup obrolan teks.
2. Format objek JSON utama yang wajib dikembalikan:
{
  "title": "Judul kuis yang kreatif, memikat rasa ingin tahu siswa, dan relevan dengan materi (contoh: 'Petualangan Sains: Menguak Siklus Air')",
  "description": "Deskripsi pedagogis 2-3 kalimat untuk siswa (menjelaskan tujuan belajar, stimulus kehidupan sehari-hari, dan pesan motivasi)",
  "coverEmoji": "1 karakter emoji yang paling pas dengan topik kuis (contoh: 💧 untuk siklus air, 🪐 untuk tata surya, 🍕 untuk pecahan)",
  "badgeTitle": "Gelar juara kuis yang membanggakan bertema topik ini (contoh: 'Ahli Hidrologi Cilik', 'Master Pecahan', 'Penjelajah Antariksa')",
  "durationPerQuestionSec": 30,
  "themeColor": "#0284c7",
  "questions": [
    {
      "text": "Pertanyaan soal yang diawali stimulus kontekstual yang jelas...",
      "type": "${questionType === 'campuran' ? 'multiple_choice / true_false / short_answer / matching_pairs / image_guess' : questionType}",
      "options": ["Opsi 1", "Opsi 2", "Opsi 3", "Opsi 4"],
      "correctIndex": 0,
      "explanation": "Penjelasan konsep mengapa kunci benar dan opsi lain keliru...",
      "points": 10,
      "customDurationSec": 30,
      "acceptableAnswers": ["Kunci", "Sinonim"],
      "matchingPairs": [{"left": "Konsep A", "right": "Definisi A"}],
      "imageCaption": "Siklus Air",
      "imagePrompt": "Water cycle diagram showing evaporation from ocean, condensation forming clouds, precipitation as rain, labeled with arrows, elementary school science textbook style, clean white background"
    }
  ]
}`;
}

/**
 * Buat URL ilustrasi edukatif via Pollinations AI (Flux model) — Gratis, tanpa API Key.
 * Prompt dioptimalkan khusus untuk ilustrasi edukasi anak Indonesia (diagram, visual sains, bukan art abstrak).
 */
export function generateAiIllustrationUrl(
  prompt: string,
  options?: { width?: number; height?: number; seed?: number }
): string {
  const width = options?.width || 600;
  const height = options?.height || 400;
  const seed = options?.seed ?? Math.floor(Math.random() * 999999);

  // Bersihkan emoji dan karakter non-alfanumerik
  const cleanPrompt = prompt
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, ' ')
    .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF,.()\-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200); // Batasi panjang prompt

  // Template prompt edukasi berkualitas tinggi — spesifik, terstruktur, tidak abstrak
  const educationalPrompt = [
    `educational textbook illustration of ${cleanPrompt || 'science concept'}`,
    'accurate scientific diagram, labeled, clean white background',
    'children educational book style, clear and informative',
    'flat design vector illustration, no abstract art, no decorative borders',
    'high resolution, school curriculum appropriate',
  ].join(', ');

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(educationalPrompt)}?model=flux&width=${width}&height=${height}&nologo=true&private=true&seed=${seed}`;
}

/**
 * Cari gambar relevan dari Wikipedia/Wikimedia Commons berdasarkan kata kunci.
 * Mengembalikan URL gambar atau null jika tidak ditemukan.
 * Menggunakan Wikipedia bahasa Indonesia sebagai prioritas, fallback ke bahasa Inggris.
 */
export async function fetchWikipediaImageUrl(
  keyword: string,
  thumbnailSize = 500
): Promise<string | null> {
  if (!keyword || keyword.trim().length < 3) return null;

  const cleanKeyword = keyword
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/gi, ' ')
    .trim()
    .slice(0, 100);

  const tryFetch = async (lang: 'id' | 'en'): Promise<string | null> => {
    try {
      const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&pithumbsize=${thumbnailSize}&titles=${encodeURIComponent(cleanKeyword)}&origin=*`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'KuisInteraktif/2.2 (educational quiz app; contact@kuis-seru.app)' },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const pages = data?.query?.pages;
      if (!pages) return null;
      const pageId = Object.keys(pages)[0];
      const thumb = pages[pageId]?.thumbnail?.source;
      return thumb || null;
    } catch {
      return null;
    }
  };

  // Coba Wikipedia Indonesia dulu, fallback ke English
  const idResult = await tryFetch('id');
  if (idResult) return idResult;
  return tryFetch('en');
}

/**
 * Resolusi gambar hybrid: coba Wikipedia terlebih dahulu (gambar edukasi nyata),
 * fallback ke Pollinations AI jika Wikipedia tidak menemukan gambar.
 * Mengembalikan URL terbaik yang ditemukan.
 */
export async function resolveEducationalImageUrl(
  imagePrompt: string,
  imageCaption: string,
  fallbackSeed?: number
): Promise<string> {
  // Gunakan imageCaption (lebih singkat & spesifik) untuk Wikipedia search
  const wikiKeyword = imageCaption || imagePrompt.split(',')[0];
  const wikiUrl = await fetchWikipediaImageUrl(wikiKeyword);
  if (wikiUrl) return wikiUrl;

  // Fallback: Pollinations Flux dengan imagePrompt yang spesifik
  return generateAiIllustrationUrl(imagePrompt || imageCaption, { seed: fallbackSeed });
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

function normalizeQuestions(rawList: any[], providerPrefix: string, autoGenerateImages = false, mcOptionCount = 4): QuizQuestion[] {
  return rawList.map((item, idx) => {
    const qType: QuestionType = (
      ['multiple_choice', 'true_false', 'short_answer', 'image_guess', 'matching_pairs'].includes(item.type)
        ? item.type
        : 'multiple_choice'
    ) as QuestionType;

    const fallbackOptions = Array.from({ length: mcOptionCount }, (_, i) => `Opsi ${String.fromCharCode(65 + i)}`);
    let options: string[] = Array.isArray(item.options) && item.options.length > 0 
      ? item.options.map(String)
      : fallbackOptions;


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
    const rawImagePrompt = item.imagePrompt ? String(item.imagePrompt) : undefined;
    let imageUrl = item.imageUrl ? String(item.imageUrl) : undefined;

    // Otomatis pasang ilustrasi gambar jika diminta atau bertipe tebak gambar (prioritaskan imagePrompt bahasa Inggris jika tersedia)
    if (!imageUrl && (autoGenerateImages || qType === 'image_guess') && (rawImagePrompt || rawCaption || item.text)) {
      const promptToUse = rawImagePrompt || rawCaption || String(item.text).slice(0, 80);
      imageUrl = generateAiIllustrationUrl(promptToUse);
    }

    return {
      id: `q_${providerPrefix}_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      text: String(item.text || `Pertanyaan #${idx + 1}`),
      type: qType,
      imageUrl,
      imageCaption: rawCaption,
      imagePrompt: rawImagePrompt,
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

export const DEFAULT_EMOJI_BY_SUBJECT: Record<Subject, string> = {
  // SD & Umum
  'Matematika': '📐',
  'IPA': '🔬',
  'IPAS': '🌍',
  'IPS': '🗺️',
  'Bahasa Indonesia': '📚',
  'Pendidikan Pancasila': '🇮🇩',
  'Pengetahuan Umum': '💡',
  'Bahasa Inggris': '🇬🇧',
  'PJOK': '⚽',
  'Seni Musik': '🎵',
  'Seni Rupa': '🎨',
  'Seni Tari': '💃',
  'Seni Teater': '🎭',
  'Pendidikan Agama Islam': '🕌',
  'Pendidikan Agama Kristen': '✝️',
  'Pendidikan Agama Katolik': '⛪',
  'Pendidikan Agama Hindu': '🕉️',
  'Pendidikan Agama Buddha': '☸️',
  'Pendidikan Agama Konghucu': '⛩️',
  'Bahasa Daerah': '🗣️',
  'Informatika': '💻',
  // SMP
  'IPA Terpadu': '🔬',
  'IPS Terpadu': '🌍',
  'Prakarya': '✂️',
  // SMA
  'Fisika': '⚛️',
  'Kimia': '🧪',
  'Biologi': '🧬',
  'Ekonomi': '📈',
  'Sosiologi': '👥',
  'Geografi': '🗺️',
  'Sejarah': '🏛️',
  'Matematika Tingkat Lanjut': '♾️',
  'Antropologi': '🏺',
};

export interface GenerateCreativeQuizMetadataParams {
  subject: Subject;
  grade: number;
  topic: string;
  educationLevel?: EducationLevel;
  cognitiveFocus?: 'auto' | 'balanced' | 'hots' | 'lots' | 'custom';
  questionCount?: number;
  existingMetadata?: Partial<AiQuizMetadata>;
}

/**
 * Meracik identitas dasar kuis yang inspiratif, kaya pedagogi, dan kontekstual
 * mencakup Judul, Deskripsi, Emoji Sampul, Gelar Lencana, Estimasi Waktu, dan Warna Tema.
 */
export function generateCreativeQuizMetadata(
  params: GenerateCreativeQuizMetadataParams
): Required<AiQuizMetadata> {
  const { subject, grade } = params;
  const rawTopic = (params.topic || '').trim();
  const cleanTopic = rawTopic
    .replace(/^(materi|bab|topik|konsep|tema|modul)\s*[:\-–—]?\s*/i, '')
    .trim() || `Konsep ${subject} Kelas ${grade}`;

  const level = params.educationLevel || (grade >= 10 ? 'SMA' : grade >= 7 ? 'SMP' : 'SD');
  const levelText = level === 'SMA' ? `Kelas ${grade} SMA / SMK` : level === 'SMP' ? `Kelas ${grade} SMP` : `Kelas ${grade} SD`;
  const topicLower = cleanTopic.toLowerCase();

  // 1. Emoji Selection (Smart keyword lookup)
  let emoji = params.existingMetadata?.coverEmoji?.trim();
  if (!emoji || emoji.length > 4) {
    if (/air|hujan|laut|sungai|danau|evaporasi|kondensasi|presipitasi|banjir|hidrologi/.test(topicLower)) emoji = '💧';
    else if (/tumbuhan|tanaman|daun|akar|fotosintesis|bunga|pohon|hutan|klorofil|flora/.test(topicLower)) emoji = '🌿';
    else if (/hewan|satwa|binatang|fauna|habitat|metamorfosis|kupu|burung|ikan|kucing/.test(topicLower)) emoji = '🐾';
    else if (/jantung|darah|pembuluh/.test(topicLower)) emoji = '🫀';
    else if (/paru|pernapasan|napas|oksigen/.test(topicLower)) emoji = '🫁';
    else if (/tulang|rangka|otot|sendi/.test(topicLower)) emoji = '🦴';
    else if (/otak|saraf|indra|mata|telinga|hidung/.test(topicLower)) emoji = '🧠';
    else if (/organ|tubuh|pencernaan|makanan|gizi|nutrisi/.test(topicLower)) emoji = '🍎';
    else if (/planet|tata surya|bumi|bulan|matahari|bintang|galaksi|angkasa|orbit|gerhana|astronomi/.test(topicLower)) emoji = '🪐';
    else if (/listrik|magnet|energi|gaya|gerak|cahaya|bunyi|kalor|termodinamika/.test(topicLower)) emoji = '⚡';
    else if (/pecahan|pembilang|penyebut|desimal|persen|senilai/.test(topicLower)) emoji = '🍕';
    else if (/bangun datar|bangun ruang|kubus|balok|sudut|luas|keliling|lingkaran|segitiga|geometri/.test(topicLower)) emoji = '📐';
    else if (/perkalian|pembagian|penjumlahan|pengurangan|fpb|kpk|aljabar|aritmetika|hitung/.test(topicLower)) emoji = '🔢';
    else if (/pancasila|garuda|norma|uud|hukum|bhinneka|hak|kewajiban|toleransi|musyawarah/.test(topicLower)) emoji = '🇮🇩';
    else if (/pahlawan|kemerdekaan|sejarah|proklamasi|perjuangan|kerajaan|penjajahan|bpupki|sumpah pemuda/.test(topicLower)) emoji = '🏛️';
    else if (/peta|pulau|provinsi|negara|asean|benua|samudra|kenampakan alam|geografis/.test(topicLower)) emoji = '🗺️';
    else if (/paragraf|puisi|pantun|cerita|dongeng|teks|kosakata|huruf|kata|membaca|fabel|sastra/.test(topicLower)) emoji = '📚';
    else if (/english|greeting|family|vocabulary|dialogue|recount|narrative/.test(topicLower)) emoji = '🇬🇧';
    else if (/olahraga|kebugaran|senam|bola|lari|atletik|renang|basket|sepak bola/.test(topicLower)) emoji = '⚽';
    else if (/komputer|internet|algoritma|koding|digital|data|teknologi|ai|perangkat/.test(topicLower)) emoji = '💻';
    else if (/musik|lagu|nada|alat musik|irama/.test(topicLower)) emoji = '🎵';
    else if (/seni|lukis|rupa|warna|patung|kriya|gambar/.test(topicLower)) emoji = '🎨';
    else if (/tari|koreografi|gerak tari/.test(topicLower)) emoji = '💃';
    else {
      emoji = DEFAULT_EMOJI_BY_SUBJECT[subject] || '🌟';
    }
  }

  // 2. Badge Title Selection (Accomplishment Title)
  let badgeTitle = params.existingMetadata?.badgeTitle?.trim();
  if (!badgeTitle) {
    if (/air|hujan|laut|sungai|hidrologi/.test(topicLower)) badgeTitle = 'Ahli Hidrologi Cilik';
    else if (/planet|tata surya|bumi|angkasa|astronomi/.test(topicLower)) badgeTitle = 'Penjelajah Antariksa';
    else if (/jantung|paru|organ|tubuh|pencernaan|anatomi/.test(topicLower)) badgeTitle = 'Dokter Cilik Berbakat';
    else if (/hewan|fauna|satwa|ekosistem/.test(topicLower)) badgeTitle = 'Ranger Sahabat Satwa';
    else if (/tumbuhan|tanaman|flora|fotosintesis/.test(topicLower)) badgeTitle = 'Botanist Pelindung Bumi';
    else if (/pecahan|desimal|persen/.test(topicLower)) badgeTitle = 'Master Pecahan Cepat';
    else if (/bangun datar|bangun ruang|geometri/.test(topicLower)) badgeTitle = 'Arsitek Geometri Unggul';
    else if (/aljabar|fpb|kpk|aritmetika|matematika/.test(topicLower)) badgeTitle = 'Ksatria Logika Angka';
    else if (/pancasila|norma|karakter/.test(topicLower)) badgeTitle = 'Duta Karakter Pancasila';
    else if (/pahlawan|kemerdekaan|sejarah/.test(topicLower)) badgeTitle = 'Pewaris Semangat Pahlawan';
    else if (/peta|pulau|asean|geografi/.test(topicLower)) badgeTitle = 'Penjelajah Wawasan Nusantara';
    else if (/puisi|pantun|cerita|literasi|bahasa indonesia/.test(topicLower)) badgeTitle = 'Duta Literasi Hebat';
    else if (/english|bahasa inggris/.test(topicLower)) badgeTitle = 'Star English Speaker';
    else if (/olahraga|kebugaran|pjok/.test(topicLower)) badgeTitle = 'Juara Kebugaran Sejati';
    else if (/komputer|koding|informatika/.test(topicLower)) badgeTitle = 'Inovator Digital Masa Depan';
    else if (/seni|musik|rupa|kriya/.test(topicLower)) badgeTitle = 'Maestro Kreatif Nusantara';
    else {
      badgeTitle = level === 'SMA' ? 'Intelektual Cendekia' : level === 'SMP' ? 'Bintang Mandiri Berprestasi' : 'Bintang Pintar Juara';
    }
  }

  // 3. Creative Title
  let title = params.existingMetadata?.title?.trim();
  if (!title) {
    if (level === 'SD') {
      if (grade <= 2) {
        title = `Ayo Belajar ${cleanTopic}`;
      } else if (grade <= 4) {
        if (subject === 'Matematika') title = `Tantangan Logika: ${cleanTopic}`;
        else if (subject === 'IPA' || subject === 'IPAS') title = `Petualangan Sains: ${cleanTopic}`;
        else if (subject === 'Bahasa Indonesia') title = `Jelajah Kata: ${cleanTopic}`;
        else if (subject === 'Pendidikan Pancasila') title = `Karakter Cilik: ${cleanTopic}`;
        else title = `Petualangan Seru: ${cleanTopic}`;
      } else {
        if (subject === 'Matematika') title = `Masteri Nalar: ${cleanTopic}`;
        else if (subject === 'IPA' || subject === 'IPAS') title = `Eksplorasi Sains: ${cleanTopic}`;
        else if (subject === 'Bahasa Indonesia') title = `Literasi Hebat: ${cleanTopic}`;
        else if (subject === 'IPS') title = `Jelajah Nusantara: ${cleanTopic}`;
        else title = `Tantangan Cerdas: ${cleanTopic}`;
      }
    } else if (level === 'SMP') {
      if (subject === 'Matematika') title = `Masteri Aljabar & Nalar: ${cleanTopic}`;
      else if (subject === 'IPA Terpadu') title = `Investigasi Sains Terpadu: ${cleanTopic}`;
      else if (subject === 'IPS Terpadu') title = `Dinamika Sosial & Geografi: ${cleanTopic}`;
      else if (subject === 'Informatika') title = `Computational Thinking: ${cleanTopic}`;
      else title = `Masteri Konsep: ${cleanTopic}`;
    } else {
      // SMA
      if (subject === 'Fisika' || subject === 'Kimia' || subject === 'Biologi') title = `Kajian Sains Analitis: ${cleanTopic}`;
      else if (subject.includes('Matematika')) title = `Penalaran Matematis Lanjut: ${cleanTopic}`;
      else if (subject === 'Ekonomi' || subject === 'Sosiologi') title = `Analisis Sosio-Ekonomi: ${cleanTopic}`;
      else title = `Kajian Komprehensif: ${cleanTopic}`;
    }
  }

  // 4. Pedagogical Description
  let description = params.existingMetadata?.description?.trim();
  if (!description) {
    description = `Uji dan perdalam pemahaman konsep ${cleanTopic} untuk mata pelajaran ${subject} ${levelText} berbasis Kurikulum Merdeka. Dilengkapi stimulus kontekstual nyata untuk mengasah nalar kritis dan pemecahan masalah secara mandiri.`;
  }

  // 5. Estimated Duration per Question
  let duration = params.existingMetadata?.durationPerQuestionSec;
  if (!duration || duration < 15 || duration > 120) {
    if (level === 'SD') {
      duration = grade <= 2 ? 30 : 35;
      if (subject === 'Matematika' || params.cognitiveFocus === 'hots') duration = 40;
    } else if (level === 'SMP') {
      duration = 40;
      if (subject === 'Matematika' || subject === 'IPA Terpadu') duration = 45;
    } else {
      duration = 45;
      if (subject === 'Fisika' || subject === 'Kimia' || subject.includes('Matematika')) duration = 60;
    }
  }

  // 6. Theme Color
  let themeColor = params.existingMetadata?.themeColor;
  if (!themeColor || !/^#[0-9a-fA-F]{6}$/.test(themeColor)) {
    if (subject.includes('Matematika')) themeColor = '#4f46e5';
    else if (subject === 'IPA' || subject === 'Biologi') themeColor = '#059669';
    else if (subject === 'Fisika' || /air|hujan|laut/.test(topicLower)) themeColor = '#0284c7';
    else if (subject === 'Kimia' || subject === 'IPA Terpadu') themeColor = '#0d9488';
    else if (subject === 'Pendidikan Pancasila') themeColor = '#dc2626';
    else if (subject.includes('IPS') || subject === 'Geografi') themeColor = '#ea580c';
    else if (subject === 'Sejarah') themeColor = '#b45309';
    else if (subject === 'Informatika') themeColor = '#6366f1';
    else if (subject.includes('Seni')) themeColor = '#db2777';
    else if (subject === 'PJOK') themeColor = '#16a34a';
    else themeColor = '#2563eb';
  }

  return {
    title,
    description,
    coverEmoji: emoji,
    badgeTitle,
    durationPerQuestionSec: duration,
    themeColor,
    defaultGameMode: 'standard',
  };
}

/**
 * Menghasilkan metadata identitas kuis menggunakan AI (DeepSeek / Groq / Gemini) secara dinamis,
 * dengan fallback cerdas ke mesin metadata kurikulum lokal jika offline atau kuota habis.
 */
export async function generateAiQuizMetadata(params: {
  subject: Subject;
  grade: number;
  topic: string;
  educationLevel?: EducationLevel;
  contextNotes?: string;
  existingQuestionsCount?: number;
  provider?: AiProvider;
  existingMetadata?: Partial<AiQuizMetadata>;
}): Promise<Required<AiQuizMetadata>> {
  const { subject, grade } = params;
  const level = params.educationLevel || (grade >= 10 ? 'SMA' : grade >= 7 ? 'SMP' : 'SD');
  const levelText = level === 'SMA' ? `Kelas ${grade} SMA / SMK` : level === 'SMP' ? `Kelas ${grade} SMP` : `Kelas ${grade} SD`;
  const topic = params.topic.trim() || `Konsep Inti ${subject} ${levelText}`;

  const prompt = `Anda adalah Pakar Asesmen Kurikulum Merdeka Kemendikbudristek RI. Buatlah identitas kuis interaktif yang sangat menarik dan edukatif untuk mata pelajaran ${subject} ${levelText} dengan topik/materi: "${topic}".

Kembalikan HANYA JSON objek valid dengan format:
{
  "title": "Judul kuis yang memikat rasa ingin tahu siswa dan edukatif (contoh: 'Petualangan Sains: Menguak Siklus Air')",
  "description": "Deskripsi pedagogis 2-3 kalimat untuk siswa (menjelaskan tujuan belajar, materi esensial, dan stimulus nyata)",
  "coverEmoji": "1 karakter emoji yang paling pas dan merepresentasikan topik materi",
  "badgeTitle": "Gelar juara kuis yang membanggakan dan relevan (contoh: 'Ahli Hidrologi Cilik', 'Master Pecahan')",
  "durationPerQuestionSec": 30,
  "themeColor": "#0284c7"
}`;

  // 1. Coba via DeepSeek jika key tersedia
  if (hasDeepSeekApiKey()) {
    try {
      const apiKey = getStoredDeepSeekApiKey();
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 400,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        const content = d?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return generateCreativeQuizMetadata({
            subject,
            grade,
            topic,
            educationLevel: level,
            existingMetadata: parsed,
          });
        }
      }
    } catch {
      // fallback
    }
  }

  // 2. Coba via Groq jika key tersedia
  if (hasGroqApiKey()) {
    try {
      const apiKey = getStoredGroqApiKey();
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 400,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        const content = d?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return generateCreativeQuizMetadata({
            subject,
            grade,
            topic,
            educationLevel: level,
            existingMetadata: parsed,
          });
        }
      }
    } catch {
      // fallback
    }
  }

  // 3. Coba via Gemini jika key tersedia
  if (hasGeminiApiKey()) {
    try {
      const apiKey = getStoredGeminiApiKey();
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500, responseMimeType: 'application/json' },
        }),
      });
      if (res.ok) {
        const d = await res.json();
        const rawText = d?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(cleanJsonResponse(rawText));
          return generateCreativeQuizMetadata({
            subject,
            grade,
            topic,
            educationLevel: level,
            existingMetadata: parsed,
          });
        }
      }
    } catch {
      // fallback
    }
  }

  // 4. Fallback instan ke mesin metadata kurikulum lokal
  return generateCreativeQuizMetadata({
    subject,
    grade,
    topic,
    educationLevel: level,
    existingMetadata: params.existingMetadata,
  });
}

/* =========================================================
   CALL GOOGLE GEMINI API
========================================================= */

export async function callGeminiApi(params: GenerateAiQuestionsParams): Promise<{
  questions: QuizQuestion[];
  metadata?: AiQuizMetadata;
}> {
  const apiKey = params.apiKey || getStoredGeminiApiKey();
  if (!apiKey) {
    throw new Error('Kunci API Gemini belum diatur. Silakan masukkan API Key Gemini Anda.');
  }

  const model = params.geminiModel || (params.model as GeminiModel) || getStoredGeminiModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const promptText = buildInstructionText(params) + `\nKembalikan objek JSON murni dengan format { "title": "...", "description": "...", "coverEmoji": "...", "badgeTitle": "...", "durationPerQuestionSec": 30, "themeColor": "#0284c7", "questions": [ { ... } ] }`;

  const requestBody = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 3500,
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

    const questions = normalizeQuestions(list, 'gemini', params.includeAiImages, params.mcOptionCount);
    const metadata: AiQuizMetadata | undefined = (!Array.isArray(parsed) && parsed && typeof parsed === 'object')
      ? {
          title: parsed.title || parsed.quizTitle || parsed.judul,
          description: parsed.description || parsed.quizDescription || parsed.deskripsi,
          coverEmoji: parsed.coverEmoji || parsed.emoji,
          badgeTitle: parsed.badgeTitle || parsed.badge || parsed.gelar,
          durationPerQuestionSec: typeof parsed.durationPerQuestionSec === 'number' ? parsed.durationPerQuestionSec : undefined,
          themeColor: typeof parsed.themeColor === 'string' ? parsed.themeColor : undefined,
        }
      : undefined;

    return { questions, metadata };
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

export async function callGroqApi(params: GenerateAiQuestionsParams): Promise<{
  questions: QuizQuestion[];
  metadata?: AiQuizMetadata;
}> {
  const apiKey = params.apiKey || getStoredGroqApiKey();
  if (!apiKey) {
    throw new Error('Kunci API Groq belum diatur. Silakan masukkan API Key Groq Anda.');
  }

  const model = params.groqModel || (params.model as GroqModel) || getStoredGroqModel();
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  const systemInstruction = buildInstructionText(params) + `
Kembalikan objek JSON dengan format:
{
  "title": "Judul kuis yang memikat dan edukatif",
  "description": "Deskripsi pedagogis 2-3 kalimat untuk siswa",
  "coverEmoji": "1 karakter emoji topik materi",
  "badgeTitle": "Gelar juara kuis",
  "durationPerQuestionSec": 30,
  "themeColor": "#0284c7",
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
        content: `Tolong buatkan ${params.count} butir soal ${params.subject} Kelas ${params.grade} tentang materi "${params.topic}" dalam format JSON yang telah ditentukan. Lengkapi juga dengan judul kuis, deskripsi motivatif, emoji sampul, dan gelar lencana prestasi.`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.6,
    max_tokens: 3500,
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

    const questions = normalizeQuestions(list, 'groq', params.includeAiImages, params.mcOptionCount);
    const metadata: AiQuizMetadata | undefined = (!Array.isArray(parsed) && parsed && typeof parsed === 'object')
      ? {
          title: parsed.title || parsed.quizTitle || parsed.judul,
          description: parsed.description || parsed.quizDescription || parsed.deskripsi,
          coverEmoji: parsed.coverEmoji || parsed.emoji,
          badgeTitle: parsed.badgeTitle || parsed.badge || parsed.gelar,
          durationPerQuestionSec: typeof parsed.durationPerQuestionSec === 'number' ? parsed.durationPerQuestionSec : undefined,
          themeColor: typeof parsed.themeColor === 'string' ? parsed.themeColor : undefined,
        }
      : undefined;

    return { questions, metadata };
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

export async function callDeepSeekApi(params: GenerateAiQuestionsParams): Promise<{
  questions: QuizQuestion[];
  metadata?: AiQuizMetadata;
}> {
  const apiKey = params.apiKey || getStoredDeepSeekApiKey();
  if (!apiKey) {
    throw new Error('Kunci API DeepSeek belum diatur. Silakan masukkan API Key DeepSeek Anda.');
  }

  const model = params.deepseekModel || (params.model as DeepSeekModel) || getStoredDeepSeekModel();
  const endpoint = 'https://api.deepseek.com/chat/completions';

  const systemInstruction = buildInstructionText(params) + `
Kembalikan objek JSON dengan format:
{
  "title": "Judul kuis yang memikat dan edukatif",
  "description": "Deskripsi pedagogis 2-3 kalimat untuk siswa",
  "coverEmoji": "1 karakter emoji topik materi",
  "badgeTitle": "Gelar juara kuis",
  "durationPerQuestionSec": 30,
  "themeColor": "#0284c7",
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
        content: `Tolong buatkan ${params.count} butir soal ${params.subject} Kelas ${params.grade} tentang materi "${params.topic}" dalam format JSON yang telah ditentukan. Lengkapi juga dengan judul kuis, deskripsi motivatif, emoji sampul, dan gelar lencana prestasi.`,
      },
    ],
    max_tokens: 3800,
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

    const questions = normalizeQuestions(list, 'deepseek', params.includeAiImages, params.mcOptionCount);
    const metadata: AiQuizMetadata | undefined = (!Array.isArray(parsed) && parsed && typeof parsed === 'object')
      ? {
          title: parsed.title || parsed.quizTitle || parsed.judul,
          description: parsed.description || parsed.quizDescription || parsed.deskripsi,
          coverEmoji: parsed.coverEmoji || parsed.emoji,
          badgeTitle: parsed.badgeTitle || parsed.badge || parsed.gelar,
          durationPerQuestionSec: typeof parsed.durationPerQuestionSec === 'number' ? parsed.durationPerQuestionSec : undefined,
          themeColor: typeof parsed.themeColor === 'string' ? parsed.themeColor : undefined,
        }
      : undefined;

    return { questions, metadata };
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

  // Helper pembangun output terpadu ber-metadata lengkap
  const buildResult = (
    questions: QuizQuestion[],
    source: 'gemini_api' | 'groq_api' | 'deepseek_api' | 'curriculum_seed',
    message: string,
    rawMeta?: AiQuizMetadata
  ): HybridGenerateResult => {
    const metadata = generateCreativeQuizMetadata({
      subject: params.subject,
      grade: params.grade,
      topic: params.topic,
      educationLevel: params.educationLevel,
      cognitiveFocus: params.cognitiveFocus,
      questionCount: questions.length,
      existingMetadata: rawMeta,
    });

    return {
      questions,
      source,
      message,
      metadata,
    };
  };

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

  const recordEngineError = (prov: 'deepseek' | 'groq' | 'gemini', err: unknown) => {
    const str = (err instanceof Error ? err.message : String(err)).toLowerCase();
    if (str.includes('429') || str.includes('quota') || str.includes('rate_limit') || str.includes('insufficient_quota') || str.includes('resource_exhausted')) {
      if (prov === 'deepseek') cachedSupabaseAiStatus.deepseekError = '429 Quota exhausted';
      if (prov === 'groq') cachedSupabaseAiStatus.groqError = '429 Quota exhausted';
      if (prov === 'gemini') cachedSupabaseAiStatus.geminiError = '429 Quota exhausted';
    } else if (str.includes('503') || str.includes('504') || str.includes('overload') || str.includes('busy')) {
      if (prov === 'deepseek') cachedSupabaseAiStatus.deepseekError = '503 Busy';
      if (prov === 'groq') cachedSupabaseAiStatus.groqError = '503 Busy';
      if (prov === 'gemini') cachedSupabaseAiStatus.geminiError = '503 Busy';
    }
  };

  if (provider === 'deepseek' && isCloudDeepSeek) {
    try {
      const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'deepseek' });
      return buildResult(
        result.questions,
        'deepseek_api',
        `🐋 Berhasil meracik ${result.questions.length} butir soal materi "${params.topic}" via DeepSeek Cloud (${result.model || 'V3/R1'})!`,
        result.metadata
      );
    } catch (cloudDeepSeekErr: unknown) {
      recordEngineError('deepseek', cloudDeepSeekErr);
      console.warn('Panggilan DeepSeek via Supabase Edge Function gagal, mencoba cadangan:', cloudDeepSeekErr);
    }
  } else if (provider === 'groq' && isCloudGroq) {
    try {
      const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'groq' });
      return buildResult(
        result.questions,
        'groq_api',
        `⚡ Berhasil meracik ${result.questions.length} butir soal materi "${params.topic}" via Groq Cloud (${result.model || 'LPU Engine'})!`,
        result.metadata
      );
    } catch (cloudGroqErr: unknown) {
      recordEngineError('groq', cloudGroqErr);
      console.warn('Panggilan Groq via Supabase Edge Function gagal, mencoba cadangan:', cloudGroqErr);
    }
  } else if (provider === 'gemini' && isCloudGemini) {
    try {
      const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'gemini' });
      return buildResult(
        result.questions,
        'gemini_api',
        `✨ Berhasil meracik ${result.questions.length} butir soal materi "${params.topic}" via Google Gemini AI (${result.model || 'PRO'})!`,
        result.metadata
      );
    } catch (cloudGeminiErr: unknown) {
      recordEngineError('gemini', cloudGeminiErr);
      console.warn('Panggilan Gemini via Supabase Edge Function gagal, mencoba cadangan:', cloudGeminiErr);
    }
  }

  // 2. Coba provider utama dengan API Key lokal jika tersedia di browser
  if (provider === 'deepseek' && hasDeepSeekApiKey()) {
    try {
      const res = await callDeepSeekApi(params);
      return buildResult(
        res.questions,
        'deepseek_api',
        `🐋 Berhasil membuat ${res.questions.length} butir soal materi "${params.topic}" via DeepSeek AI Lokal (${params.deepseekModel || getStoredDeepSeekModel()})!`,
        res.metadata
      );
    } catch (deepseekErr: unknown) {
      recordEngineError('deepseek', deepseekErr);
      console.warn('Panggilan DeepSeek lokal gagal, mencoba cadangan:', deepseekErr);
    }
  } else if (provider === 'groq' && hasGroqApiKey()) {
    try {
      const res = await callGroqApi(params);
      return buildResult(
        res.questions,
        'groq_api',
        `⚡ Berhasil membuat ${res.questions.length} butir soal materi "${params.topic}" via Groq Cloud Lokal (${params.groqModel || getStoredGroqModel()})!`,
        res.metadata
      );
    } catch (groqErr: unknown) {
      recordEngineError('groq', groqErr);
      console.warn('Panggilan Groq lokal gagal, mencoba cadangan:', groqErr);
    }
  } else if (provider === 'gemini' && hasGeminiApiKey()) {
    try {
      const res = await callGeminiApi(params);
      return buildResult(
        res.questions,
        'gemini_api',
        `✨ Berhasil membuat ${res.questions.length} butir soal materi "${params.topic}" via Google Gemini AI Lokal!`,
        res.metadata
      );
    } catch (geminiErr: unknown) {
      recordEngineError('gemini', geminiErr);
      console.warn('Panggilan Gemini lokal gagal, mencoba cadangan:', geminiErr);
    }
  }

  // 3. Coba provider alternatif via Cloud atau Kunci Lokal jika provider utama belum siap/gagal
  if (provider === 'deepseek') {
    if (isCloudGroq) {
      try {
        const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'groq' });
        return buildResult(
          result.questions,
          'groq_api',
          `Beralih ke Groq Cloud: ${result.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
          result.metadata
        );
      } catch {
        // lanjut
      }
    }
    if (isCloudGemini) {
      try {
        const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'gemini' });
        return buildResult(
          result.questions,
          'gemini_api',
          `Beralih ke Google Gemini Cloud: ${result.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
          result.metadata
        );
      } catch {
        // lanjut
      }
    }
    if (hasGroqApiKey()) {
      try {
        const res = await callGroqApi(params);
        return buildResult(
          res.questions,
          'groq_api',
          `Beralih ke Groq: ${res.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
          res.metadata
        );
      } catch {
        // lanjut
      }
    }
    if (hasGeminiApiKey()) {
      try {
        const res = await callGeminiApi(params);
        return buildResult(
          res.questions,
          'gemini_api',
          `Beralih ke Google Gemini: ${res.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
          res.metadata
        );
      } catch {
        // lanjut
      }
    }
  } else if (provider === 'groq') {
    if (isCloudDeepSeek) {
      try {
        const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'deepseek' });
        return buildResult(
          result.questions,
          'deepseek_api',
          `Beralih ke DeepSeek Cloud: ${result.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
          result.metadata
        );
      } catch {
        // lanjut
      }
    }
    if (isCloudGemini) {
      try {
        const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'gemini' });
        return buildResult(
          result.questions,
          'gemini_api',
          `Beralih ke Google Gemini Cloud: ${result.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
          result.metadata
        );
      } catch {
        // lanjut
      }
    }
    if (hasDeepSeekApiKey()) {
      try {
        const res = await callDeepSeekApi(params);
        return buildResult(
          res.questions,
          'deepseek_api',
          `Beralih ke DeepSeek: ${res.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
          res.metadata
        );
      } catch {
        // lanjut
      }
    }
    if (hasGeminiApiKey()) {
      try {
        const res = await callGeminiApi(params);
        return buildResult(
          res.questions,
          'gemini_api',
          `Beralih ke Google Gemini: ${res.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
          res.metadata
        );
      } catch {
        // lanjut
      }
    }
  } else if (provider === 'gemini') {
    if (isCloudDeepSeek) {
      try {
        const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'deepseek' });
        return buildResult(
          result.questions,
          'deepseek_api',
          `Beralih ke DeepSeek Cloud: ${result.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
          result.metadata
        );
      } catch {
        // lanjut
      }
    }
    if (isCloudGroq) {
      try {
        const result = await callSupabaseAiEdgeFunction({ ...params, provider: 'groq' });
        return buildResult(
          result.questions,
          'groq_api',
          `Beralih ke Groq Cloud: ${result.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
          result.metadata
        );
      } catch {
        // lanjut
      }
    }
    if (hasDeepSeekApiKey()) {
      try {
        const res = await callDeepSeekApi(params);
        return buildResult(
          res.questions,
          'deepseek_api',
          `Beralih ke DeepSeek: ${res.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
          res.metadata
        );
      } catch {
        // lanjut
      }
    }
    if (hasGroqApiKey()) {
      try {
        const res = await callGroqApi(params);
        return buildResult(
          res.questions,
          'groq_api',
          `Beralih ke Groq Cloud: ${res.questions.length} butir soal materi "${params.topic}" berhasil dibuat.`,
          res.metadata
        );
      } catch {
        // lanjut ke fallback lokal
      }
    }
  }

  // 4. Fallback ke Generator Kurikulum lokal jika diizinkan (Offline & 100% Reliable)
  if (params.allowLocalFallback === false) {
    throw new Error('Seluruh kuota AI Cloud harian sedang limit. Sistem mengalihkan ke mode Prompt / Berkas (Direkomendasikan) agar hasil kuis tidak monoton.');
  }

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

  const isFallback = Boolean(params.provider);
  return buildResult(
    localQuestions,
    'curriculum_seed',
    isFallback
      ? `⚠️ Mesin ${provider.toUpperCase()} sedang sibuk atau mencapai limit. Otomatis dialihkan ke Generator Lokal (${localQuestions.length} butir soal siap)!`
      : `Berhasil membuat ${localQuestions.length} butir soal materi "${params.topic}" via Generator Lokal!`
  );
}
