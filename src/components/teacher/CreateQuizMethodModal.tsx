import React, { useState } from 'react';
import type { Quiz, Subject, QuestionType, TeacherProfile } from '../../types/quiz';
import { generateRandomPin } from '../../lib/supabaseClient';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../lib/navigationHistory';
import { 
  generateHybridQuizQuestions, 
  hasGeminiApiKey,
  hasGroqApiKey,
  type AiProvider
} from '../../lib/geminiApi';
import { parseRawQuestionsText } from '../../lib/aiQuestionParser';
import { 
  X, 
  Sparkles, 
  Pencil, 
  Zap, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  FileText
} from 'lucide-react';

interface CreateQuizMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherProfile;
  onSelectManual: () => void;
  onSelectGeneratedDraft: (draft: Quiz) => void;
  playClick: () => void;
}

const TOPIC_SUGGESTIONS = [
  'Organ Pernapasan Manusia',
  'Sistem Pencernaan & Nutrisi Makanan',
  'Pecahan & Bilangan Cacah',
  'Pengamalan Sila Pancasila',
  'Siklus Air & Wujud Benda',
  'Ciri Makhluk Hidup & Habitat'
];

const EMOJI_BY_SUBJECT: Record<Subject, string> = {
  'Matematika': '📐',
  'IPA': '🌱',
  'Bahasa Indonesia': '📚',
  'Pendidikan Pancasila': '🇮🇩',
  'Pengetahuan Umum': '💡'
};

export const CreateQuizMethodModal: React.FC<CreateQuizMethodModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onSelectManual,
  onSelectGeneratedDraft,
  playClick,
}) => {
  useBodyScrollLock(isOpen);
  useBackHandler(
    'create-quiz-method-modal',
    80,
    () => {
      if (isOpen) {
        if (viewMode === 'generator') {
          setViewMode('choice');
          return true;
        }
        onClose();
        return true;
      }
      return false;
    },
    isOpen
  );

  const [viewMode, setViewMode] = useState<'choice' | 'generator'>('choice');
  const [subMode, setSubMode] = useState<'ai' | 'paste'>('ai');

  // Generator form states
  const [genTopic, setGenTopic] = useState('');
  const [genSubject, setGenSubject] = useState<Subject>('IPA');
  const [genGrade, setGenGrade] = useState<number>(4);
  const [genCount, setGenCount] = useState<number>(5);
  const [customCountInput, setCustomCountInput] = useState<string>('5');
  const [genType, setGenType] = useState<QuestionType | 'campuran'>('campuran');
  const [includeAiImages, setIncludeAiImages] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<AiProvider | 'local'>('local');

  // Paste text state
  const [rawText, setRawText] = useState('');

  // Loading & error
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOpenGenerator = () => {
    playClick();
    setErrorMessage(null);
    setViewMode('generator');
  };

  const handleGenerateAiQuiz = async () => {
    playClick();
    setErrorMessage(null);

    const targetTopic = genTopic.trim() || 'Materi Pembelajaran Kurikulum Merdeka';
    const parsedCount = Math.max(1, Math.min(50, Number(customCountInput) || genCount));

    setIsLoading(true);
    try {
      let finalQuestions = [];

      if (subMode === 'paste') {
        if (!rawText.trim()) {
          setErrorMessage('Silakan tempelkan format teks soal terlebih dahulu.');
          setIsLoading(false);
          return;
        }
        const parsed = parseRawQuestionsText(rawText);
        const valid = parsed.filter((p) => p.valid).map((p) => p.question);
        if (valid.length === 0) {
          setErrorMessage('Format teks belum dapat dikenali. Pastikan memuat nomor dan kunci jawaban.');
          setIsLoading(false);
          return;
        }
        finalQuestions = valid;
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
        throw new Error('Tidak ada soal yang berhasil diracik.');
      }

      const generatedDraft: Quiz = {
        id: 'custom_ai_' + Date.now(),
        title: `Kuis ${genSubject}: ${targetTopic.length > 35 ? targetTopic.slice(0, 35) + '...' : targetTopic}`,
        description: `Latihan kuis interaktif mata pelajaran ${genSubject} Kelas ${genGrade} SD materi ${targetTopic}. Dibuat dengan bantuan Asisten AI.`,
        subject: genSubject,
        grade: genGrade,
        durationPerQuestionSec: 30,
        coverEmoji: EMOJI_BY_SUBJECT[genSubject] || '🍎',
        themeColor: '#2563eb',
        badgeTitle: 'Bintang Pintar',
        questions: finalQuestions,
        pinCode: generateRandomPin(),
        creatorId: teacher.id,
        creatorName: teacher.fullName,
        visibility: 'public',
        isPublished: true,
        createdAt: new Date().toISOString(),
      };

      onClose();
      onSelectGeneratedDraft(generatedDraft);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat meracik kuis.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl 2xl:max-w-2xl max-h-[92vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            {viewMode === 'generator' && (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setViewMode('choice');
                }}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors mr-1"
                title="Kembali ke Pilihan Metode"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              {viewMode === 'choice' ? <Sparkles className="w-4 h-4" /> : <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />}
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {viewMode === 'choice' ? 'Pilih Metode Pembuatan Kuis' : 'Generator Kilat Soal AI'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                {viewMode === 'choice' 
                  ? 'Gunakan asisten pintar atau rancang kuis secara manual' 
                  : 'Otomatis meracik soal, lalu masuk ke editor untuk ditinjau'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors min-h-[40px] min-w-[40px]"
            aria-label="Tutup Jendela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* VIEW 1: PILIHAN METODE (CHOICE) */}
          {viewMode === 'choice' && (
            <div className="space-y-4 animate-fade-in py-2">
              {/* Option A: Generator Kilat AI */}
              <button
                type="button"
                onClick={handleOpenGenerator}
                className="w-full text-left p-5 rounded-3xl border-2 border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all shadow-xs hover:shadow-md flex items-start gap-4 group btn-press"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Zap className="w-6 h-6 text-amber-300 fill-amber-300" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      ⚡ Generator Kilat AI
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white">
                      Rekomendasi
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Cukup tulis topik materi. Soal kuis langsung diracik otomatis oleh AI dan siap Anda tinjau, koreksi, atau tambah di editor kuis.
                  </p>

                  <div className="flex items-center gap-2 mt-3 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                    <span>Mulai dengan Asisten AI</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>

              {/* Option B: Buat Manual */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onClose();
                  onSelectManual();
                }}
                className="w-full text-left p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-xs hover:shadow-md flex items-start gap-4 group btn-press"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-950/60 dark:group-hover:text-blue-300 flex items-center justify-center shadow-xs flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Pencil className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      ✏️ Buat Kuis Manual
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Dari Nol
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Tulis pertanyaan, opsi jawaban, skor, dan kunci secara mandiri langkah demi langkah melalui formulir kuis interaktif.
                  </p>

                  <div className="flex items-center gap-2 mt-3 text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    <span>Buka Editor Kosong</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* VIEW 2: FORM GENERATOR KILAT */}
          {viewMode === 'generator' && (
            <div className="space-y-4 animate-fade-in">
              {/* Error Notice */}
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-semibold rounded-2xl flex items-center gap-2">
                  <span>⚠️</span>
                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}

              {/* Sub-mode Toggle (Racik AI vs Tempel Teks) */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setSubMode('ai');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all min-h-[38px] flex items-center justify-center gap-1.5 ${
                    subMode === 'ai'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Racik Otomatis AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setSubMode('paste');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all min-h-[38px] flex items-center justify-center gap-1.5 ${
                    subMode === 'paste'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Tempel Teks / Dokumen</span>
                </button>
              </div>

              {subMode === 'ai' ? (
                <>
                  {/* Topik Materi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Topik atau Materi Pelajaran <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={genTopic}
                      onChange={(e) => setGenTopic(e.target.value)}
                      placeholder="Contoh: Organ Pernapasan Manusia, Bilangan Pecahan, Sila Pancasila..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:outline-none focus:border-blue-500 min-h-[44px]"
                    />
                  </div>

                  {/* Saran Topik */}
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
                            setGenTopic(st);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 border border-slate-200/80 dark:border-slate-700 min-h-[32px] transition-colors"
                        >
                          + {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mapel & Kelas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mata Pelajaran:
                      </label>
                      <select
                        value={genSubject}
                        onChange={(e) => setGenSubject(e.target.value as Subject)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm min-h-[42px]"
                      >
                        <option value="IPA">IPA (Sains)</option>
                        <option value="Matematika">Matematika</option>
                        <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                        <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                        <option value="Pengetahuan Umum">Pengetahuan Umum</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tingkat Kelas SD:
                      </label>
                      <div className="grid grid-cols-6 gap-1">
                        {[1, 2, 3, 4, 5, 6].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              playClick();
                              setGenGrade(g);
                            }}
                            className={`py-2 rounded-xl font-bold text-xs transition-all min-h-[40px] ${
                              genGrade === g
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Jumlah Soal & Format */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Jumlah Soal:</span>
                        <span className="text-[11px] font-normal text-slate-500">Maks. 50 butir</span>
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
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] border ${
                              genCount === cnt && customCountInput === String(cnt)
                                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {cnt}
                          </button>
                        ))}
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={customCountInput}
                          onChange={(e) => {
                            setCustomCountInput(e.target.value);
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) setGenCount(Math.max(1, Math.min(50, val)));
                          }}
                          placeholder="Kustom"
                          className="w-20 px-2 py-2 text-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs min-h-[40px]"
                          title="Jumlah butir kustom (1 - 50)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Format Tipe Soal:
                      </label>
                      <select
                        value={genType}
                        onChange={(e) => setGenType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm min-h-[42px]"
                      >
                        <option value="campuran">Campuran (Bervariasi)</option>
                        <option value="multiple_choice">Pilihan Ganda (A, B, C, D)</option>
                        <option value="true_false">Benar atau Salah</option>
                        <option value="short_answer">Isian Singkat</option>
                        <option value="matching_pairs">Menjodohkan Kartu</option>
                        <option value="image_guess">Tebak Gambar</option>
                      </select>
                    </div>
                  </div>

                  {/* Pilihan Mesin AI */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Mesin Pembuat Soal:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setSelectedProvider('local');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedProvider === 'local'
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-100 ring-1 ring-blue-400/30 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center gap-1">
                          <span>📦 Kurikulum Internal</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Lokal & Offline 100%
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setSelectedProvider('gemini');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedProvider === 'gemini'
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-100 ring-1 ring-blue-400/30 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center gap-1">
                          <span>✨ Google Gemini</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {hasGeminiApiKey() ? 'API Key Siap' : 'Auto Fallback'}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setSelectedProvider('groq');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedProvider === 'groq'
                            ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-100 ring-1 ring-amber-400/30 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center gap-1">
                          <span>⚡ Groq Cloud</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {hasGroqApiKey() ? 'Super Kilat < 1s' : 'Auto Fallback'}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Sakelar Gambar AI Edukasi */}
                  <div className="p-3 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 text-sm shadow-xs">
                        🎨
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                          <span>Sertakan Ilustrasi Gambar AI</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold">Gratis 100%</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Melampirkan gambar edukasi ramah anak pada setiap butir soal
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
                        aria-label="Sertakan Gambar AI"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </>
              ) : (
                /* Sub-mode Tempel Teks */
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Tempelkan teks soal dari dokumen Word, Excel, CSV, atau hasil obrolan ChatGPT/Gemini di bawah ini. Format otomatis dideteksi:
                  </p>
                  <textarea
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`Contoh:\n1. Organ pernapasan utama pada manusia adalah...\nA. Jantung\n*B. Paru-paru\nC. Lambung\nD. Ginjal\nKunci: B\nPembahasan: Paru-paru menukar oksigen dan karbon dioksida.`}
                    className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              playClick();
              if (viewMode === 'generator') {
                setViewMode('choice');
              } else {
                onClose();
              }
            }}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold min-h-[42px] transition-colors"
          >
            {viewMode === 'generator' ? 'Kembali' : 'Batal'}
          </button>

          {viewMode === 'generator' && (
            <button
              type="button"
              onClick={handleGenerateAiQuiz}
              disabled={isLoading}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-sm min-h-[42px] flex items-center justify-center gap-2 transition-all btn-press ${
                isLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sedang Meracik Soal AI...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Buat Kuis Sekarang & Buka Editor</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
