import React, { useState } from 'react';
import type { Subject, QuestionType, QuizQuestion } from '../../types/quiz';
import { 
  generateHybridQuizQuestions, 
  hasGeminiApiKey, 
  hasGroqApiKey, 
  type AiProvider 
} from '../../lib/geminiApi';
import { parseRawQuestionsText } from '../../lib/aiQuestionParser';
import { 
  Sparkles, 
  Zap, 
  FileText, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Lightbulb,
  Cpu
} from 'lucide-react';

interface AiGeneratorStepProps {
  onGenerated: (data: {
    questions: QuizQuestion[];
    topic: string;
    subject: Subject;
    grade: number;
    questionCount: number;
    coverEmoji: string;
    badgeTitle: string;
  }) => void;
  onBack: () => void;
  playClick: () => void;
  initialSubject?: Subject;
  initialGrade?: number;
}

const TOPIC_SUGGESTIONS = [
  'Organ Pernapasan Manusia',
  'Sistem Pencernaan & Nutrisi Makanan',
  'Pecahan & Bilangan Cacah',
  'Pengamalan Sila Pancasila',
  'Siklus Air & Wujud Benda',
  'Ciri Khusus Hewan & Habitat',
  'Fotosintesis & Rantai Makanan',
  'Pahlawan & Tokoh Sejarah Nasional'
];

const EMOJI_BY_SUBJECT: Record<Subject, string> = {
  'Matematika': '📐',
  'IPA': '🌱',
  'Bahasa Indonesia': '📚',
  'Pendidikan Pancasila': '🇮🇩',
  'Pengetahuan Umum': '💡'
};

export const AiGeneratorStep: React.FC<AiGeneratorStepProps> = ({
  onGenerated,
  onBack,
  playClick,
  initialSubject = 'IPA',
  initialGrade = 4,
}) => {
  const [subMode, setSubMode] = useState<'ai' | 'paste'>('ai');
  const [genTopic, setGenTopic] = useState('');
  const [genSubject, setGenSubject] = useState<Subject>(initialSubject);
  const [genGrade, setGenGrade] = useState<number>(initialGrade);
  const [genCount, setGenCount] = useState<number>(5);
  const [customCountInput, setCustomCountInput] = useState<string>('5');
  const [genType, setGenType] = useState<QuestionType | 'campuran'>('campuran');
  const [includeAiImages, setIncludeAiImages] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<AiProvider | 'local'>('local');
  const [rawText, setRawText] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasGemini = hasGeminiApiKey();
  const hasGroq = hasGroqApiKey();

  const handleGenerate = async () => {
    playClick();
    setErrorMessage(null);

    const targetTopic = genTopic.trim();
    if (subMode === 'ai' && !targetTopic) {
      setErrorMessage('Mohon tulis topik atau materi pelajaran terlebih dahulu.');
      return;
    }

    if (subMode === 'paste' && !rawText.trim()) {
      setErrorMessage('Mohon tempel teks bacaan atau dokumen materi kuis.');
      return;
    }

    const parsedCount = parseInt(customCountInput) || genCount || 5;
    if (parsedCount < 1 || parsedCount > 50) {
      setErrorMessage('Jumlah soal harus antara 1 sampai 50 butir.');
      return;
    }

    setIsLoading(true);

    try {
      let finalQuestions: QuizQuestion[] = [];

      if (subMode === 'paste') {
        const parsedItems = parseRawQuestionsText(rawText);
        finalQuestions = parsedItems.filter((item) => item.valid).map((item) => item.question);
        if (finalQuestions.length === 0) {
          throw new Error('Format teks tidak dapat dipahami. Pastikan format pertanyaan dan kunci jawaban jelas.');
        }
      } else {
        const providerToUse: AiProvider = selectedProvider === 'local' ? 'gemini' : selectedProvider;
        const result = await generateHybridQuizQuestions({
          topic: targetTopic,
          subject: genSubject,
          grade: genGrade,
          count: parsedCount,
          questionType: genType,
          provider: selectedProvider === 'local' ? undefined : providerToUse,
          includeAiImages,
        });
        finalQuestions = result.questions;
      }

      if (!finalQuestions || finalQuestions.length === 0) {
        throw new Error('Tidak ada butir soal yang berhasil diracik. Silakan coba lagi dengan topik yang lebih spesifik.');
      }

      onGenerated({
        questions: finalQuestions,
        topic: targetTopic || 'Materi Kuis',
        subject: genSubject,
        grade: genGrade,
        questionCount: finalQuestions.length,
        coverEmoji: EMOJI_BY_SUBJECT[genSubject] || '🍎',
        badgeTitle: 'Bintang Pintar',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat meracik soal kuis.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl 2xl:max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 animate-fade-in space-y-6">
      
      {/* Banner / Header Title */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider text-amber-300">
              <Zap className="w-3.5 h-3.5 fill-amber-300" />
              <span>Tahap 1: Generator Kilat Soal AI</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              Racik Soal Kurikulum Merdeka Secara Otomatis
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              Cukup ketik topik materi atau tempel bahan ajar. AI akan menyusun soal, opsi, kunci jawaban, dan pembahasan. Soal langsung tersaji di Bank Soal untuk Anda koreksi atau tambah sebelum dirilis.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                playClick();
                onBack();
              }}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-bold backdrop-blur-sm transition-all flex items-center gap-2 min-h-[44px] min-w-[44px] justify-center btn-press"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ganti Metode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Kolom Kiri: Formulir Generator (8 kolom di desktop) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card space-y-6">
          
          {/* Submode Switcher Tabs */}
          <div className="flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                playClick();
                setSubMode('ai');
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                subMode === 'ai'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>✨ Racik Otomatis AI</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                setSubMode('paste');
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                subMode === 'paste'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-purple-500" />
              <span>📄 Tempel Teks / Dokumen</span>
            </button>
          </div>

          {/* Form Fields: AI Mode */}
          {subMode === 'ai' ? (
            <div className="space-y-5">
              
              {/* Topik Materi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Topik atau Materi Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="Contoh: Organ Pernapasan Manusia, Bilangan Pecahan, Pengamalan Pancasila..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[46px]"
                />

                {/* Suggestions Chips */}
                <div className="mt-2.5 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Saran Topik Kurikulum Merdeka:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {TOPIC_SUGGESTIONS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => {
                          playClick();
                          setGenTopic(topic);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all min-h-[36px] flex items-center ${
                          genTopic === topic
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        + {topic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid: Mata Pelajaran & Jenjang Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={genSubject}
                    onChange={(e) => setGenSubject(e.target.value as Subject)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
                  >
                    <option value="IPA">IPA (Sains)</option>
                    <option value="Matematika">Matematika</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                    <option value="Pengetahuan Umum">Pengetahuan Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tingkat Kelas SD <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          playClick();
                          setGenGrade(g);
                        }}
                        className={`py-2 rounded-xl font-bold text-xs sm:text-sm min-h-[44px] transition-all ${
                          genGrade === g
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid: Jumlah Soal & Format Tipe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Jumlah Soal <span className="text-slate-400 font-normal">(Maks. 50 butir)</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[5, 10, 15].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          playClick();
                          setGenCount(cnt);
                          setCustomCountInput(String(cnt));
                        }}
                        className={`flex-1 py-2 rounded-xl font-bold text-xs min-h-[44px] transition-all ${
                          genCount === cnt && customCountInput === String(cnt)
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={customCountInput}
                        onChange={(e) => {
                          setCustomCountInput(e.target.value);
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) setGenCount(val);
                        }}
                        placeholder="Kustom"
                        className="w-full text-center py-2 px-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs min-h-[44px] focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Format Tipe Soal
                  </label>
                  <select
                    value={genType}
                    onChange={(e) => setGenType(e.target.value as QuestionType | 'campuran')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
                  >
                    <option value="campuran">Campuran (Bervariasi)</option>
                    <option value="multiple_choice">Pilihan Ganda Saja (4 Opsi)</option>
                    <option value="true_false">Benar / Salah</option>
                    <option value="short_answer">Isian Singkat</option>
                    <option value="matching_pairs">Pasangan Kartu (Cocok Gambar/Teks)</option>
                  </select>
                </div>
              </div>

              {/* Mesin AI Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mesin Pembuat Soal AI
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setSelectedProvider('local');
                    }}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all min-h-[64px] ${
                      selectedProvider === 'local'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-400'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Kurikulum SD Lokal</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">Offline</span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Cepat, stabil, tanpa kuota</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setSelectedProvider('gemini');
                    }}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all min-h-[64px] ${
                      selectedProvider === 'gemini'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-400'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Google Gemini AI</span>
                      {hasGemini ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">Aktif</span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">Default</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Model 2.0 Flash / Pro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setSelectedProvider('groq');
                    }}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all min-h-[64px] ${
                      selectedProvider === 'groq'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-400'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Groq Cloud LPU™</span>
                      {hasGroq ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">Aktif</span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">LPU</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Super Kilat (&lt;1 detik)</span>
                  </button>
                </div>
              </div>

              {/* Sakelar Ilustrasi Gambar AI */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>🎨 Sertakan Ilustrasi Gambar AI Otomatis</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      100% Gratis
                    </span>
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Menggunakan mesin visual edukatif untuk butir soal sains & tebak gambar anak SD.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={includeAiImages}
                    onChange={(e) => setIncludeAiImages(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

            </div>
          ) : (
            /* Form Fields: Paste Mode */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tempel Materi / Teks Dokumen Soal
                </label>
                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Contoh format:\n1. Apa fungsi utama dari paru-paru pada manusia?\nA. Mencerna makanan\nB. Tempat pertukaran oksigen dan karbon dioksida\nC. Memompa darah\nD. Menyaring racun\nKunci: B\nPembahasan: Paru-paru merupakan organ pernapasan utama...`}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mata Pelajaran
                  </label>
                  <select
                    value={genSubject}
                    onChange={(e) => setGenSubject(e.target.value as Subject)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
                  >
                    <option value="IPA">IPA (Sains)</option>
                    <option value="Matematika">Matematika</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                    <option value="Pengetahuan Umum">Pengetahuan Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tingkat Kelas SD
                  </label>
                  <select
                    value={genGrade}
                    onChange={(e) => setGenGrade(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
                  >
                    {[1, 2, 3, 4, 5, 6].map((g) => (
                      <option key={g} value={g}>Kelas {g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGenerate}
              className="w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 min-h-[48px] btn-press transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sedang Meracik Soal Kurikulum Merdeka...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                  <span>⚡ Racik Soal Sekarang & Buka Bank Soal</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>

        </div>

        {/* Kolom Kanan: Panduan, Tips & Live Status (4 kolom di desktop) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card 1: Tips Kurikulum Merdeka */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Lightbulb className="w-5 h-5" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Tips Kurikulum Merdeka SD
              </h3>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Gunakan bahasa kontekstual, komunikatif, dan akrab dengan kehidupan sehari-hari siswa.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Padukan soal pemahaman dasar (LOTS) dengan analisis penalaran bergambar (HOTS).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Setelah diracik, seluruh butir soal dapat Anda edit atau tambah di Langkah 2 (Bank Soal).</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Kecepatan Mesin AI */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-850 dark:to-blue-950/20 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Cpu className="w-5 h-5" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Keunggulan Komputasi AI
              </h3>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">⚡ Groq Cloud LPU™:</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Kecepatan inferensi super instan (&lt;1 detik) untuk 5–10 butir soal.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">🧠 Google Gemini 2.0:</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Dukungan penalaran mendalam (*Flash Thinking*) dan langganan Gemini PRO.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">🎨 Ilustrasi Edukasi Gratis:</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Gambar ilustrasi bergaya 3D vektor tanpa batasan kuota.</span>
              </div>
            </div>
          </div>

          {/* Card 3: Rencana Kuis */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
              Rencana Target Kuis:
            </h4>
            <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Mata Pelajaran:</span>
                <span className="font-bold text-slate-900 dark:text-white">{genSubject}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Tingkat Kelas:</span>
                <span className="font-bold text-slate-900 dark:text-white">Kelas {genGrade} SD</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Target Soal:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{customCountInput || genCount} Butir</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Alur Setelah Ini:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Langkah 2: Bank Soal</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
