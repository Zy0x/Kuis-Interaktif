import React, { useState, useEffect } from 'react';
import type { QuizQuestion, QuestionType, Subject } from '../../types/quiz';
import { 
  generateAiPrompt, 
  parseRawQuestionsText, 
  type ParsedQuestionItem 
} from '../../lib/aiQuestionParser';
import { 
  Sparkles, 
  Copy, 
  Check, 
  X, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  BookOpen,
  ArrowRight,
  Star,
  Clock,
  Key,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  Zap
} from 'lucide-react';
import {
  getStoredAiProvider,
  saveStoredAiProvider,
  getStoredGeminiApiKey,
  saveStoredGeminiApiKey,
  hasGeminiApiKey,
  getStoredGeminiModel,
  saveStoredGeminiModel,
  getStoredGroqApiKey,
  saveStoredGroqApiKey,
  hasGroqApiKey,
  getStoredGroqModel,
  saveStoredGroqModel,
  generateHybridQuizQuestions,
  checkSupabaseAiStatus,
  getSupabaseAiStatusSync,
  type AiProvider,
  type GeminiModel,
  type GroqModel,
  type SupabaseAiStatus
} from '../../lib/geminiApi';

interface AiQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (questions: QuizQuestion[]) => void;
  currentSubject: Subject;
  currentGrade: number;
  playClick: () => void;
}

const TOPIC_SUGGESTIONS = [
  'Organ Pernapasan Manusia & Hewan',
  'Sistem Pencernaan & Nutrisi Makanan',
  'Pecahan Senilai & Perkalian Dasar',
  'Lambang & Pengamalan Sila Pancasila',
  'Siklus Air & Perubahan Wujud Benda',
  'Ciri-Ciri Makhluk Hidup & Habitatnya'
];

export const AiQuestionModal: React.FC<AiQuestionModalProps> = ({
  isOpen,
  onClose,
  onImportQuestions,
  currentSubject,
  currentGrade,
  playClick,
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'import'>('generate');

  // Generator State
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState<Subject>(currentSubject);
  const [grade, setGrade] = useState<number>(currentGrade);
  const [count, setCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState<QuestionType | 'campuran'>('campuran');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Import State
  const [rawText, setRawText] = useState('');
  const [parsedResults, setParsedResults] = useState<ParsedQuestionItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Multi-Provider AI BYOK State
  const [activeProvider, setActiveProvider] = useState<AiProvider>(() => getStoredAiProvider());
  const [geminiKeyInput, setGeminiKeyInput] = useState<string>(() => getStoredGeminiApiKey());
  const [geminiModel, setGeminiModel] = useState<GeminiModel>(() => getStoredGeminiModel());
  const [groqKeyInput, setGroqKeyInput] = useState<string>(() => getStoredGroqApiKey());
  const [groqModel, setGroqModel] = useState<GroqModel>(() => getStoredGroqModel());
  const [showKeySettings, setShowKeySettings] = useState<boolean>(false);
  const [supabaseAi, setSupabaseAi] = useState<SupabaseAiStatus>(() => getSupabaseAiStatusSync());
  const [showKeyText, setShowKeyText] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [hasConfiguredKey, setHasConfiguredKey] = useState<boolean>(() => {
    const prov = getStoredAiProvider();
    const status = getSupabaseAiStatusSync();
    return prov === 'groq' 
      ? (hasGroqApiKey() || status.hasGroq) 
      : (hasGeminiApiKey() || status.hasGemini);
  });
  const [includeAiImages, setIncludeAiImages] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSubject(currentSubject);
      setGrade(currentGrade);
      setCopiedPrompt(false);
      setNotification(null);
      setIncludeAiImages(false);
      const prov = getStoredAiProvider();
      setActiveProvider(prov);
      setGeminiKeyInput(getStoredGeminiApiKey());
      setGeminiModel(getStoredGeminiModel());
      setGroqKeyInput(getStoredGroqApiKey());
      setGroqModel(getStoredGroqModel());

      // Cek status Cloud Secrets dari Supabase
      checkSupabaseAiStatus().then((status) => {
        setSupabaseAi(status);
        const configured = prov === 'groq' 
          ? (hasGroqApiKey() || status.hasGroq) 
          : (hasGeminiApiKey() || status.hasGemini);
        setHasConfiguredKey(configured);
      });
    }
  }, [isOpen, currentSubject, currentGrade]);

  const handleSaveApiSettings = () => {
    playClick();
    saveStoredAiProvider(activeProvider);
    saveStoredGeminiApiKey(geminiKeyInput.trim());
    saveStoredGeminiModel(geminiModel);
    saveStoredGroqApiKey(groqKeyInput.trim());
    saveStoredGroqModel(groqModel);
    const keyOk = activeProvider === 'groq' 
      ? Boolean(groqKeyInput.trim().length > 5) 
      : Boolean(geminiKeyInput.trim().length > 10);
    setHasConfiguredKey(keyOk);
    setShowKeySettings(false);
    showToast(keyOk 
      ? `✓ Kunci API ${activeProvider === 'groq' ? 'Groq' : 'Gemini'} berhasil disimpan!` 
      : 'Kunci API dihapus. Menggunakan generator kurikulum internal.'
    );
  };

  const handleRemoveApiKey = () => {
    playClick();
    if (activeProvider === 'groq') {
      saveStoredGroqApiKey('');
      setGroqKeyInput('');
    } else {
      saveStoredGeminiApiKey('');
      setGeminiKeyInput('');
    }
    setHasConfiguredKey(false);
    setShowKeySettings(false);
    showToast(`Kunci API ${activeProvider === 'groq' ? 'Groq' : 'Gemini'} telah dihapus. Menggunakan generator kurikulum internal.`);
  };

  // Real-time parser saat teks di tab impor berubah
  useEffect(() => {
    if (activeTab === 'import') {
      if (!rawText.trim()) {
        setParsedResults([]);
        return;
      }
      const results = parseRawQuestionsText(rawText);
      setParsedResults(results);
    }
  }, [rawText, activeTab]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCopyPrompt = () => {
    playClick();
    const promptText = generateAiPrompt({
      subject,
      grade,
      topic: topic.trim() || 'Materi Pembelajaran Kurikulum Merdeka',
      count,
      questionType,
    });

    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    showToast('Prompt berhasil disalin! Silakan tempel di ChatGPT, Gemini, atau Claude.');
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const handleDirectGenerate = async () => {
    playClick();
    setIsGeneratingAi(true);

    try {
      const result = await generateHybridQuizQuestions({
        subject,
        grade,
        topic: topic.trim() || 'Pernapasan dan Tubuh Manusia',
        count,
        questionType,
        provider: activeProvider,
        geminiModel,
        groqModel,
        apiKey: (activeProvider === 'groq' ? groqKeyInput.trim() : geminiKeyInput.trim()) || undefined,
        includeAiImages,
      });

      setRawText(JSON.stringify(result.questions, null, 2));
      setActiveTab('import');
      setParsedResults(
        result.questions.map((q) => ({
          id: q.id,
          valid: true,
          question: q,
        }))
      );
      showToast(result.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghasilkan soal.';
      showToast(msg);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleLoadSample = () => {
    playClick();
    const sample = `1. Organ yang berfungsi menyaring udara pernapasan pada manusia adalah...
A. Jantung
*B. Hidung
C. Lambung
D. Kerongkongan
Kunci: B
Pembahasan: Rongga hidung memiliki rambut-rambut halus dan selaput lendir untuk menyaring debu dan kotoran.

2. Ikan bernapas di dalam air menggunakan alat pernapasan khusus yang disebut insang.
[Benar / Salah]
Kunci: Benar
Pembahasan: Insang menyaring oksigen yang terlarut di dalam air.`;

    setRawText(sample);
  };

  const handleConfirmImport = () => {
    playClick();
    const validQuestions = parsedResults.filter((r) => r.valid).map((r) => r.question);
    if (validQuestions.length === 0) {
      showToast('Tidak ada soal valid untuk dimasukkan.');
      return;
    }

    onImportQuestions(validQuestions);
    onClose();
  };

  const validCount = parsedResults.filter((r) => r.valid).length;
  const invalidCount = parsedResults.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl 2xl:max-w-4xl max-h-[92vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Asisten Soal AI & Impor Cepat
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Buat draf soal otomatis atau impor dari ChatGPT, Gemini, dan dokumen luar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Tutup Jendela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notifikasi Internal */}
        {notification && (
          <div className="bg-emerald-50 dark:bg-emerald-950/80 border-b border-emerald-200 dark:border-emerald-800/60 px-5 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-fade-in flex-shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-5 pt-3 pb-2 flex gap-2 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('generate');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all min-h-[42px] ${
              activeTab === 'generate'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>1. Generator Topik AI</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('import');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all min-h-[42px] ${
              activeTab === 'import'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Tempel & Impor Teks</span>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* ================= TAB 1: GENERATOR TOPIK ================= */}
          {activeTab === 'generate' && (
            <div className="space-y-4 animate-fade-in">
              {/* Input Topik */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Topik atau Materi yang Ingin Dibuat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Organ Pernapasan Manusia, Pecahan Senilai, Sila Pancasila..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:outline-none focus:border-blue-500 min-h-[44px]"
                />
              </div>

              {/* Saran Topik Populer */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Saran Topik Kurikulum Merdeka:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {TOPIC_SUGGESTIONS.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        playClick();
                        setTopic(st);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors border border-slate-200/80 dark:border-slate-700 min-h-[32px]"
                    >
                      + {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Baris Konfigurasi: Mapel, Kelas, Jumlah, Jenis */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mata Pelajaran:
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as Subject)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm min-h-[42px]"
                  >
                    <option value="Matematika">Matematika</option>
                    <option value="IPA">IPA (Sains)</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                    <option value="Pengetahuan Umum">Pengetahuan Umum</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                    <option value="PJOK">PJOK (Olahraga & Kesehatan)</option>
                    <option value="Seni Rupa">Seni Rupa</option>
                    <option value="Seni Musik">Seni Musik</option>
                    <option value="Seni Tari">Seni Tari</option>
                    <option value="Seni Teater">Seni Teater</option>
                    <option value="Pendidikan Agama Islam">Pendidikan Agama Islam (PAI)</option>
                    <option value="Pendidikan Agama Kristen">Pendidikan Agama Kristen</option>
                    <option value="Pendidikan Agama Katolik">Pendidikan Agama Katolik</option>
                    <option value="Pendidikan Agama Hindu">Pendidikan Agama Hindu</option>
                    <option value="Pendidikan Agama Buddha">Pendidikan Agama Buddha</option>
                    <option value="Pendidikan Agama Konghucu">Pendidikan Agama Konghucu</option>
                    <option value="Bahasa Daerah">Bahasa Daerah / Mulok</option>
                    <option value="Informatika">Informatika / Literasi Digital</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tingkat Kelas:
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm min-h-[42px]"
                  >
                    {[1, 2, 3, 4, 5, 6].map((g) => (
                      <option key={g} value={g}>Kelas {g} SD</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Soal:
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {[3, 5, 10].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          playClick();
                          setCount(cnt);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all min-h-[34px] ${
                          count === cnt
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Format Jenis Soal:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
                  {[
                    { id: 'campuran', label: 'Campuran' },
                    { id: 'multiple_choice', label: 'Pilihan Ganda' },
                    { id: 'true_false', label: 'Benar / Salah' },
                    { id: 'short_answer', label: 'Isian Singkat' },
                    { id: 'matching_pairs', label: 'Menjodohkan' },
                    { id: 'image_guess', label: 'Tebak Gambar' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        playClick();
                        setQuestionType(t.id as any);
                      }}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all min-h-[38px] flex items-center justify-center text-center ${
                        questionType === t.id
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner Status Engine AI Hybrid & Konfigurasi BYOK (Gemini & Groq) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {hasConfiguredKey ? (
                      activeProvider === 'groq' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                          Groq Cloud Aktif ({groqModel})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Gemini AI Aktif ({geminiModel})
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        Generator Kurikulum SD (Gratis & Offline)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setShowKeySettings(!showKeySettings);
                    }}
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 transition-all min-h-[36px]"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>{showKeySettings ? 'Tutup Pengaturan' : (hasConfiguredKey ? 'Ganti Kunci API' : 'Pasang Kunci API (Gemini / Groq)')}</span>
                  </button>
                </div>

                {/* Form Drawer Pengaturan Multi-Provider AI (Gemini / Groq) */}
                {showKeySettings && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in">
                    {/* Pemilih Provider AI */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                        Pilih Penyedia AI (Provider):
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            setActiveProvider('gemini');
                            setHasConfiguredKey(Boolean(geminiKeyInput.trim().length > 10));
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            activeProvider === 'gemini'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          <span>Google Gemini AI</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            setActiveProvider('groq');
                            setHasConfiguredKey(Boolean(groqKeyInput.trim().length > 5));
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            activeProvider === 'groq'
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>Groq LPU (Super Cepat ⚡)</span>
                        </button>
                      </div>
                    </div>

                    {/* Input untuk Provider Terpilih */}
                    {activeProvider === 'gemini' ? (
                      <div className="space-y-3">
                        {supabaseAi.hasGemini && (
                          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                            <span><strong>Terhubung via Supabase Secrets:</strong> Kunci API Gemini telah aktif di server cloud. Pengisian form di bawah ini opsional (hanya bila ingin menimpa dengan kunci pribadi).</span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Key className="w-3.5 h-3.5 text-amber-500" /> Kunci API Google Gemini (Opsional jika sudah ada di Secrets):
                            </label>
                            <a
                              href="https://aistudio.google.com/"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              Dapatkan di Google AI Studio <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          <div className="relative">
                            <input
                              type={showKeyText ? 'text' : 'password'}
                              value={geminiKeyInput}
                              onChange={(e) => setGeminiKeyInput(e.target.value)}
                              placeholder={supabaseAi.hasGemini ? "Sudah terisi via Supabase Secrets (atau tempel AIzaSy... baru)" : "Tempelkan AIzaSy..."}
                              className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500 min-h-[42px]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowKeyText(!showKeyText)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                              Model Gemini:
                            </label>
                            <select
                              value={geminiModel}
                              onChange={(e) => setGeminiModel(e.target.value as GeminiModel)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none min-h-[38px]"
                            >
                              <option value="gemini-3.8-flash">Gemini 3.8 Flash (Generasi Terbaru, Cepat & Cerdas)</option>
                              <option value="gemini-3.6-flash">Gemini 3.6 Flash (Sangat Responsif)</option>
                              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Stabil & Cepat)</option>
                              <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite</option>
                              <option value="gemini-flash-latest">Gemini Flash Latest</option>
                              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Model Penalaran PRO)</option>
                            </select>
                          </div>

                          <div className="flex items-end gap-2">
                            <button
                              type="button"
                              onClick={handleSaveApiSettings}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[38px] transition-all"
                            >
                              <Check className="w-3.5 h-3.5" /> Simpan Kunci
                            </button>
                            {hasGeminiApiKey() && (
                              <button
                                type="button"
                                onClick={handleRemoveApiKey}
                                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 min-h-[38px] transition-all"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          💡 <strong>Langganan Gemini PRO?</strong> Akun Google Anda berhak mendapatkan API Key di <strong>aistudio.google.com</strong> secara gratis (kuota 15 req/menit). Anda juga bisa menikmati model penalaran tertinggi <em>Gemini 1.5 Pro</em> dan <em>Gemini 2.0 Flash Thinking</em>. Panduan lengkap di <code className="text-[10px] bg-slate-200 dark:bg-slate-750 px-1 py-0.5 rounded">docs/panduan-integrasi-gemini-ai.md</code>.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {supabaseAi.hasGroq && (
                          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                            <span><strong>Terhubung via Supabase Secrets:</strong> Kunci API Groq telah aktif di server cloud. Pengisian form di bawah ini opsional (hanya bila ingin menimpa dengan kunci pribadi).</span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Kunci API Groq Cloud (Opsional jika sudah ada di Secrets):
                            </label>
                            <a
                              href="https://console.groq.com/"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                            >
                              Dapatkan di console.groq.com (Gratis) <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          <div className="relative">
                            <input
                              type={showKeyText ? 'text' : 'password'}
                              value={groqKeyInput}
                              onChange={(e) => setGroqKeyInput(e.target.value)}
                              placeholder={supabaseAi.hasGroq ? "Sudah terisi via Supabase Secrets (atau tempel gsk_... baru)" : "Tempelkan gsk_..."}
                              className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500 min-h-[42px]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowKeyText(!showKeyText)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                              Model AI (Groq LPU):
                            </label>
                            <select
                              value={groqModel}
                              onChange={(e) => setGroqModel(e.target.value as GroqModel)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none min-h-[38px]"
                            >
                              <option value="qwen/qwen3.8-27b">Qwen 3.8 27B (Bahasa Indonesia Sangat Bagus - Default)</option>
                              <option value="openai/gpt-oss-20b">GPT-OSS 20B (Super Cepat & Ringkas)</option>
                              <option value="openai/gpt-oss-120b">GPT-OSS 120B (Model Terbesar & Cerdas)</option>
                              <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Versatile)</option>
                              <option value="llama-3.1-8b-instant">Llama 3.1 8B (Super Kilat)</option>
                              <option value="deepseek-r1-distill-llama-70b">DeepSeek R1 70B (Penalaran MTK)</option>
                              <option value="gemma2-9b-it">Google Gemma 2 9B</option>
                              <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                            </select>
                          </div>

                          <div className="flex items-end gap-2">
                            <button
                              type="button"
                              onClick={handleSaveApiSettings}
                              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[38px] transition-all"
                            >
                              <Check className="w-3.5 h-3.5" /> Simpan Kunci Groq
                            </button>
                            {hasGroqApiKey() && (
                              <button
                                type="button"
                                onClick={handleRemoveApiKey}
                                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 min-h-[38px] transition-all"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          ⚡ <strong>Groq LPU:</strong> Komputasi inferensi tercepat di dunia. Kini mendukung <em>Llama 3.3 70B</em> dan <em>DeepSeek R1</em> dengan penalaran mendalam. Panduan lengkap di <code className="text-[10px] bg-slate-200 dark:bg-slate-750 px-1 py-0.5 rounded">docs/panduan-integrasi-groq-ai.md</code>.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Opsi Ilustrasi Gambar AI Otomatis (Pollinations AI) */}
              <div className="p-3 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
                    🎨
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                      <span>Sertakan Ilustrasi Gambar AI</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold">Gratis 100%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Otomatis melampirkan gambar edukatif ramah anak di setiap soal
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={includeAiImages}
                    onChange={(e) => {
                      playClick();
                      setIncludeAiImages(e.target.checked);
                    }}
                    className="sr-only peer"
                    aria-label="Sertakan Gambar AI Edukasi Otomatis"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 min-h-[44px] transition-all btn-press text-xs sm:text-sm"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 dark:text-emerald-400">Prompt Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Salin Prompt untuk ChatGPT/Gemini</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDirectGenerate}
                  disabled={isGeneratingAi}
                  className={`flex-1 ${
                    isGeneratingAi
                      ? 'bg-blue-400 cursor-not-allowed'
                      : activeProvider === 'groq' && hasConfiguredKey
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 btn-press'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 btn-press'
                  } text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 min-h-[44px] shadow-sm text-xs sm:text-sm transition-all`}
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Meracik Soal AI...</span>
                    </>
                  ) : (
                    <>
                      {activeProvider === 'groq' && hasConfiguredKey ? (
                        <>
                          <Zap className="w-4 h-4 fill-white" />
                          <span>Buat Langsung via Groq AI ⚡</span>
                        </>
                      ) : hasConfiguredKey ? (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Buat Langsung via Gemini AI</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Buat Langsung Sekarang</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 2: TEMPEL & IMPOR ================= */}
          {activeTab === 'import' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tempelkan Teks Soal / Hasil Keluaran AI di Bawah Ini:
                </label>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Muat Contoh Teks
                </button>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Tempelkan hasil teks dari ChatGPT, Gemini, Word, atau dokumen berformat nomor di sini... (Mendukung format JSON maupun teks bernomor umum)"
                rows={6}
                className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* ================= LIVE PREVIEW SECTION ================= */}
          {parsedResults.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Tinjauan Butir Soal Terdeteksi ({parsedResults.length})
                  </h3>
                  <span className="text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                    {validCount} Siap Diimpor
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-md">
                      {invalidCount} Perlu Perbaikan
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {parsedResults.map((item, idx) => {
                  const { question, valid, errorReason } = item;
                  const typeLabel = 
                    question.type === 'short_answer'
                      ? 'Isian Singkat'
                      : question.type === 'matching_pairs'
                      ? 'Menjodohkan'
                      : question.type === 'image_guess'
                      ? 'Tebak Gambar'
                      : question.type === 'true_false'
                      ? 'Benar / Salah'
                      : 'Pilihan Ganda';

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        valid
                          ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                          : 'border-rose-200 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200/50 dark:border-slate-750">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-5 h-5 rounded-md bg-slate-900 dark:bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase bg-slate-200/70 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                            {typeLabel}
                          </span>
                          <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500" /> {question.points || 10} Poin
                          </span>
                          {question.customDurationSec && (
                            <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Clock className="w-3 h-3 text-blue-500" /> {question.customDurationSec}d
                            </span>
                          )}
                          {question.imageCaption && (
                            <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
                              {question.imageCaption}
                            </span>
                          )}
                        </div>

                        {valid ? (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 flex-shrink-0">
                            <Check className="w-3.5 h-3.5" /> Valid
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1 flex-shrink-0">
                            <AlertCircle className="w-3.5 h-3.5" /> {errorReason || 'Format belum lengkap'}
                          </span>
                        )}
                      </div>

                      <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                        {question.text}
                      </p>

                      {/* Tampilan Isian Singkat */}
                      {question.type === 'short_answer' && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 mt-2">
                          <div className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5 flex-wrap">
                            <span>Kunci Jawaban:</span>
                            <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 font-mono text-xs">
                              {question.acceptableAnswers?.[0] || question.options[0]}
                            </span>
                          </div>
                          {question.acceptableAnswers && question.acceptableAnswers.length > 1 && (
                            <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">
                              Variasi diterima: {question.acceptableAnswers.slice(1).join(', ')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tampilan Menjodohkan */}
                      {question.type === 'matching_pairs' && (
                        <div className="space-y-1.5 mt-2">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Pasangan Kartu:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {(question.matchingPairs || []).map((pair, pIdx) => (
                              <div key={pIdx} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <span className="font-bold text-blue-600 dark:text-blue-400">{pair.left}</span>
                                <span className="text-slate-400 font-bold">↔</span>
                                <span className="text-slate-700 dark:text-slate-300">{pair.right}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tampilan Opsi Pilihan Ganda, Benar/Salah, atau Tebak Gambar */}
                      {(question.type === 'multiple_choice' || question.type === 'true_false' || question.type === 'image_guess') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2">
                          {question.options.map((opt, optIdx) => {
                            const isKey = question.correctIndex === optIdx;
                            return (
                              <div
                                key={optIdx}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                                  isKey
                                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                <span className="w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex-shrink-0">
                                  {question.type === 'true_false' ? (optIdx === 0 ? '✓' : '✗') : String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="truncate">{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {question.explanation && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 flex items-start gap-1">
                          <HelpCircle className="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                          <span>{question.explanation}</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-50/50 dark:bg-slate-850/50">
          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={validCount === 0}
            onClick={handleConfirmImport}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm flex items-center gap-2 min-h-[44px] transition-all btn-press text-xs sm:text-sm"
          >
            <span>Masukkan {validCount > 0 ? `${validCount} Soal` : 'Soal'} ke Bank Soal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
