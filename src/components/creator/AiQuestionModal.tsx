import React, { useState, useEffect } from 'react';
import type { QuizQuestion, Subject } from '../../types/quiz';
import { 
  generateAiPrompt, 
  parseRawQuestionsText, 
  generateCurriculumSeedQuestions, 
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
  ArrowRight
} from 'lucide-react';

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
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'true_false' | 'campuran'>('multiple_choice');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Import State
  const [rawText, setRawText] = useState('');
  const [parsedResults, setParsedResults] = useState<ParsedQuestionItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSubject(currentSubject);
      setGrade(currentGrade);
      setCopiedPrompt(false);
      setNotification(null);
    }
  }, [isOpen, currentSubject, currentGrade]);

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

  const handleDirectGenerate = () => {
    playClick();
    const questions = generateCurriculumSeedQuestions(
      topic.trim() || 'Pernapasan dan Tubuh Manusia',
      subject,
      grade,
      count
    );

    setParsedResults(
      questions.map((q) => ({
        id: q.id,
        valid: true,
        question: q,
      }))
    );
    showToast(`Berhasil membuat ${questions.length} butir soal materi "${topic || 'Kurikulum SD'}"!`);
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
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {[
                    { id: 'multiple_choice', label: 'Pilihan Ganda' },
                    { id: 'true_false', label: 'Benar / Salah' },
                    { id: 'campuran', label: 'Campuran' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        playClick();
                        setQuestionType(t.id as any);
                      }}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all min-h-[36px] flex items-center justify-center ${
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

              {/* Action Buttons: Salin Prompt vs Buat Langsung */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 min-h-[44px] transition-colors border border-slate-200/80 dark:border-slate-700 btn-press text-xs sm:text-sm"
                  title="Salin template prompt standar untuk ditempel ke ChatGPT/Gemini"
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
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 min-h-[44px] shadow-sm btn-press text-xs sm:text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Buat Langsung Sekarang</span>
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
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-900 dark:bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                            {question.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Benar / Salah'}
                          </span>
                        </div>

                        {valid ? (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Valid
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {errorReason || 'Format belum lengkap'}
                          </span>
                        )}
                      </div>

                      <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                        {question.text}
                      </p>

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
