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
  Loader2, 
  AlertCircle,
  Layers,
  FileCheck2
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
  'Ciri Makhluk Hidup & Habitat'
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
    <div className="w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 py-4 sm:py-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Kolom Kiri: Formulir Generator AI (8 kolom di layar besar) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card space-y-6">
          
          {/* Header Kartu */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 font-bold shadow-xs">
                <Zap className="w-5 h-5 fill-blue-500/20 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                  Generator Kilat Soal AI
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden xs:block">
                  Otomatis meracik butir soal sesuai materi, lalu masuk ke editor untuk ditinjau
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playClick();
                onBack();
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors flex-shrink-0 min-h-[40px] btn-press"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ganti Metode</span>
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                playClick();
                setSubMode('ai');
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all min-h-[42px] ${
                subMode === 'ai'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>Racik Otomatis AI</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                setSubMode('paste');
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all min-h-[42px] ${
                subMode === 'paste'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-purple-500" />
              <span>Tempel Teks / Dokumen</span>
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
                />

                {/* Suggestions Chips */}
                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                    Saran Topik:
                  </span>
                  {TOPIC_SUGGESTIONS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => {
                        playClick();
                        setGenTopic(topic);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                        genTopic === topic
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      + {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid 2-Kolom: Mata Pelajaran & Jenjang Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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

              {/* Grid 2-Kolom: Jumlah Soal & Format Tipe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                        className="w-full px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs text-center min-h-[44px] focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Format Tipe Soal <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={genType}
                    onChange={(e) => setGenType(e.target.value as QuestionType | 'campuran')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
                  >
                    <option value="campuran">Campuran (Bervariasi)</option>
                    <option value="multiple_choice">Pilihan Ganda Saja</option>
                    <option value="true_false">Benar / Salah Saja</option>
                    <option value="short_answer">Isian Singkat Saja</option>
                    <option value="matching_pairs">Menjodohkan Saja</option>
                  </select>
                </div>
              </div>

              {/* Grid 2-Kolom: Mesin Pembuat Soal & Gambar AI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mesin Pembuat Soal
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
                  >
                    <option value="local">🤖 Kurikulum SD Lokal (Cepat & Mandiri)</option>
                    <option value="gemini" disabled={!hasGemini}>
                      ✨ Google Gemini AI {hasGemini ? '(Aktif / PRO)' : '(API Key Belum Diisi)'}
                    </option>
                    <option value="groq" disabled={!hasGroq}>
                      ⚡ Groq Cloud LPU {hasGroq ? '(Aktif)' : '(API Key Belum Diisi)'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ilustrasi Gambar
                  </label>
                  <label className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 cursor-pointer min-h-[44px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={includeAiImages}
                      onChange={(e) => setIncludeAiImages(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      🎨 Sertakan Gambar Ilustrasi Edukasi AI (Gratis)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* Form Fields: Paste Mode */
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tempel Teks Soal / Dokumen Materi <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {rawText.length} karakter
                  </span>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Contoh format:\n1. Apa fungsi lambung pada manusia?\nA. Mengunyah makanan\nB. Mencerna protein dengan asam lambung\nC. Menyerap air\nD. Memompa darah\nKunci: B\n\nAtau tempel materi teks bebas untuk diracik...`}
                  rows={7}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:border-blue-500 focus:outline-none leading-relaxed"
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

          {/* Action Buttons Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                playClick();
                onBack();
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 min-h-[44px] flex items-center justify-center gap-2 transition-colors btn-press"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ganti Metode</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleGenerate}
              className="w-full sm:w-auto px-8 py-3 rounded-xl font-extrabold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 min-h-[44px] btn-press transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sedang Meracik Soal...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Buat Kuis Sekarang & Buka Editor</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Kolom Kanan: Spesifikasi Target & Struktur Format (4 kolom di layar besar) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card 1: Ringkasan Spesifikasi Target */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Spesifikasi Target Kuis</span>
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                {customCountInput || genCount} Butir
              </span>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 dark:text-slate-400">Mata Pelajaran:</span>
                <span className="font-bold text-slate-900 dark:text-white">{genSubject}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 dark:text-slate-400">Tingkat Kelas:</span>
                <span className="font-bold text-slate-900 dark:text-white">Kelas {genGrade} SD</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 dark:text-slate-400">Format Soal:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {genType === 'campuran' ? 'Campuran (Bervariasi)' : genType.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 dark:text-slate-400">Ilustrasi Gambar:</span>
                <span className={`font-bold ${includeAiImages ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {includeAiImages ? 'Aktif (AI Gratis)' : 'Teks Saja'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Struktur Format Butir Soal */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-card space-y-3">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Format Butir Soal</span>
            </h4>
            
            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span>#1 Butir Soal</span>
                <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">10 Poin</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 italic text-[11px]">
                Pertanyaan kontekstual sesuai tingkat kelas...
              </p>
              <div className="space-y-1 text-[11px] pt-1">
                <div className="p-1 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                  A. Opsi Pilihan 1
                </div>
                <div className="p-1 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-between">
                  <span>B. Kunci Jawaban Benar</span>
                  <span>✓</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                💡 Dilengkapi pembahasan edukatif untuk siswa.
              </p>
            </div>
            
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Seluruh butir soal dapat dikoreksi, diganti gambar, atau ditambah di <strong className="text-slate-700 dark:text-slate-300">Langkah 2 (Bank Soal)</strong> sebelum kuis diterbitkan.
            </p>
          </div>

          {/* Card 3: Panduan Alur Kerja Kuis */}
          <div className="bg-slate-50 dark:bg-slate-850 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Alur Kerja Studio:
            </span>
            <div className="space-y-1.5 font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Racik Soal AI (Langkah ini)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Tinjau & Edit Bank Soal</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">3</span>
                <span>Atur Informasi Kuis</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">4</span>
                <span>Pratinjau & Terbitkan</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
