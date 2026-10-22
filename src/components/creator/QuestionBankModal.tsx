import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Quiz, QuizQuestion, Subject, QuestionType } from '../../types/quiz';
import { DataManager } from '../../lib/supabaseClient';
import { useDrawerSwipeDown } from '../../hooks/useDrawerSwipeDown';
import { DrawerHandle } from '../common/DrawerHandle';
import { useBackHandler } from '../../lib/navigationHistory';
import { triggerHaptic } from '../../lib/mobileUtils';
import {
  X,
  Search,
  BookOpen,
  Plus,
  Check,
  CheckCircle2,
  CheckSquare,
  Square
} from 'lucide-react';

interface QuestionBankItem {
  question: QuizQuestion;
  sourceQuizTitle: string;
  sourceSubject: Subject;
  sourceGrade: number;
  sourceQuizId: string;
}

export interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestions: (questions: QuizQuestion[]) => void;
  currentQuestions: QuizQuestion[];
  currentQuizId?: string;
  currentSubject?: Subject;
  playClick?: () => void;
}

const SUBJECT_FILTERS: (Subject | 'Semua')[] = [
  'Semua',
  'Matematika',
  'IPAS',
  'IPA',
  'Bahasa Indonesia',
  'Pendidikan Pancasila',
  'PJOK',
  'Bahasa Inggris',
  'Pengetahuan Umum',
  'Pendidikan Agama Islam',
];

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Pilihan Ganda',
  true_false: 'Benar / Salah',
  image_guess: 'Tebak Gambar',
  short_answer: 'Isian Singkat',
  matching_pairs: 'Menjodohkan',
};

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  onClose,
  onAddQuestions,
  currentQuestions,
  currentQuizId,
  currentSubject,
  playClick = () => {},
}) => {
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>(() => DataManager.getAllQuizzes());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'Semua'>(currentSubject || 'Semua');
  const [selectedType, setSelectedType] = useState<QuestionType | 'Semua'>('Semua');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [addedIdsInSession, setAddedIdsInSession] = useState<Set<string>>(new Set());
  const [addedSuccessToast, setAddedSuccessToast] = useState<string | null>(null);

  // Sync quizzes from cloud on open
  useEffect(() => {
    if (isOpen) {
      DataManager.fetchQuizzesFromCloud()
        .then((quizzes) => {
          if (Array.isArray(quizzes) && quizzes.length > 0) {
            setAllQuizzes(quizzes);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Set default subject when modal opens
  useEffect(() => {
    if (isOpen && currentSubject) {
      setSelectedSubject(currentSubject);
    }
  }, [isOpen, currentSubject]);

  // Android back button support
  useBackHandler('question-bank-modal', 90, () => {
    if (isOpen) {
      onClose();
      return true;
    }
    return false;
  }, isOpen);

  const { handleRef, drawerStyle, backdropStyle } = useDrawerSwipeDown({
    onClose,
    enabled: isOpen,
  });

  // Extract all questions across quizzes excluding the current quiz itself
  const allBankQuestions = useMemo<QuestionBankItem[]>(() => {
    const list: QuestionBankItem[] = [];
    for (const q of allQuizzes) {
      if (currentQuizId && q.id === currentQuizId) continue;
      if (!Array.isArray(q.questions) || q.questions.length === 0) continue;

      for (const question of q.questions) {
        list.push({
          question,
          sourceQuizTitle: q.title,
          sourceSubject: q.subject,
          sourceGrade: q.grade,
          sourceQuizId: q.id,
        });
      }
    }
    return list;
  }, [allQuizzes, currentQuizId]);

  // Map of existing questions in current quiz by text (case-insensitive) to detect duplicates
  const existingQuestionTexts = useMemo(() => {
    return new Set(currentQuestions.map((q) => q.text.trim().toLowerCase()));
  }, [currentQuestions]);

  // Filter bank questions
  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allBankQuestions.filter((item) => {
      // Subject filter
      if (selectedSubject !== 'Semua' && item.sourceSubject !== selectedSubject) {
        return false;
      }
      // Question Type filter
      if (selectedType !== 'Semua' && item.question.type !== selectedType) {
        return false;
      }
      // Search query filter
      if (query) {
        const matchText = item.question.text.toLowerCase().includes(query);
        const matchTitle = item.sourceQuizTitle.toLowerCase().includes(query);
        const matchOptions = Array.isArray(item.question.options) &&
          item.question.options.some((opt) => opt.toLowerCase().includes(query));
        const matchExplanation = item.question.explanation
          ? item.question.explanation.toLowerCase().includes(query)
          : false;

        if (!matchText && !matchTitle && !matchOptions && !matchExplanation) {
          return false;
        }
      }
      return true;
    });
  }, [allBankQuestions, selectedSubject, selectedType, searchQuery]);

  // Handle single question add
  const handleAddSingleQuestion = (question: QuizQuestion) => {
    playClick();
    triggerHaptic('success');
    
    // Create fresh copy with unique id
    const cloned: QuizQuestion = {
      ...question,
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    };

    onAddQuestions([cloned]);
    setAddedIdsInSession((prev) => new Set(prev).add(question.id));

    setAddedSuccessToast(`Soal berhasil ditambahkan ke kuis!`);
    setTimeout(() => setAddedSuccessToast(null), 2500);
  };

  // Toggle multi-select question
  const handleToggleSelect = (qId: string) => {
    playClick();
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  // Handle batch add selected questions
  const handleAddSelectedQuestions = () => {
    if (selectedQuestionIds.size === 0) return;
    playClick();
    triggerHaptic('success');

    const selectedList = filteredQuestions
      .filter((item) => selectedQuestionIds.has(item.question.id))
      .map((item, idx) => ({
        ...item.question,
        id: 'q_' + (Date.now() + idx) + '_' + Math.random().toString(36).substring(2, 6),
      }));

    onAddQuestions(selectedList);

    setAddedIdsInSession((prev) => {
      const next = new Set(prev);
      selectedQuestionIds.forEach((id) => next.add(id));
      return next;
    });

    const count = selectedList.length;
    setSelectedQuestionIds(new Set());
    setAddedSuccessToast(`${count} soal berhasil ditambahkan ke kuis!`);
    setTimeout(() => setAddedSuccessToast(null), 2500);
  };

  // Select all currently visible filtered questions
  const handleSelectAllVisible = () => {
    playClick();
    const visibleIds = filteredQuestions.map((item) => item.question.id);
    const allSelected = visibleIds.every((id) => selectedQuestionIds.has(id));

    if (allSelected) {
      setSelectedQuestionIds(new Set());
    } else {
      setSelectedQuestionIds(new Set(visibleIds));
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-wrapper select-none overscroll-contain animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="question-bank-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
        style={backdropStyle}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal / Bottom Sheet */}
      <div
        style={drawerStyle}
        className="relative bg-white dark:bg-slate-900 w-full sm:max-w-2xl md:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 z-10 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-spring-up"
      >
        {/* Mobile Swipe Handle */}
        <div ref={handleRef} className="sm:hidden pt-2.5 pb-1 flex justify-center flex-shrink-0 touch-none">
          <DrawerHandle />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="question-bank-title" className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                Ambil dari Bank Soal
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Pilih dan salin butir soal dari kuis lain langsung ke kuis ini
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0 btn-press min-h-[44px] min-w-[44px]"
            aria-label="Tutup Bank Soal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Filters */}
        <div className="p-3 sm:p-4 bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-200/80 dark:border-slate-800 space-y-2.5 flex-shrink-0">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata kunci materi, pertanyaan, atau judul kuis..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 min-h-[44px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Hapus Pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Subject Filter Pills (Horizontally Scrollable) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            {SUBJECT_FILTERS.map((sub) => {
              const isActive = selectedSubject === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedSubject(sub);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[38px] flex items-center gap-1.5 btn-press border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{sub}</span>
                </button>
              );
            })}
          </div>

          {/* Type Filter & Batch Action Header */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>Tipe:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none min-h-[36px]"
              >
                <option value="Semua">Semua Tipe Soal</option>
                <option value="multiple_choice">Pilihan Ganda</option>
                <option value="true_false">Benar / Salah</option>
                <option value="image_guess">Tebak Gambar</option>
                <option value="short_answer">Isian Singkat</option>
                <option value="matching_pairs">Menjodohkan</option>
              </select>
              <span className="text-[11px] text-slate-400">({filteredQuestions.length} soal)</span>
            </div>

            {filteredQuestions.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 min-h-[36px] px-2 py-1"
              >
                {filteredQuestions.every((item) => selectedQuestionIds.has(item.question.id)) ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Batal Pilih Semua</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Pilih Semua</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Toast Notifikasi Sukses Tambah */}
        {addedSuccessToast && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-center gap-2 animate-fade-in flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{addedSuccessToast}</span>
          </div>
        )}

        {/* Scrollable Questions List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
              <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
                Tidak ada butir soal yang sesuai filter pencarian
              </p>
              <p className="text-[11px] text-slate-400">
                Coba ubah kata kunci pencarian atau pilih mata pelajaran "Semua".
              </p>
            </div>
          ) : (
            filteredQuestions.map((item) => {
              const q = item.question;
              const isChecked = selectedQuestionIds.has(q.id);
              const isAlreadyInDraft = existingQuestionTexts.has(q.text.trim().toLowerCase());
              const isAddedInSession = addedIdsInSession.has(q.id);

              return (
                <div
                  key={`${item.sourceQuizId}_${q.id}`}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isChecked
                      ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-500/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Meta Bar */}
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800/80 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                        {item.sourceSubject}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Kelas {item.sourceGrade}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {QUESTION_TYPE_LABELS[q.type] || q.type}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[180px] sm:max-w-xs">
                        Dari: {item.sourceQuizTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isAlreadyInDraft && (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-900/60">
                          Sudah di Kuis
                        </span>
                      )}
                      {isAddedInSession && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-900/60 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Baru Ditambah
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="flex items-start gap-2.5">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(q.id)}
                      className="p-1 -ml-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
                      aria-label={isChecked ? 'Batal Pilih Soal' : 'Pilih Soal'}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                        {q.text}
                      </p>

                      {/* Options Preview for Multiple Choice / True False */}
                      {Array.isArray(q.options) && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = q.correctIndex === oIdx;
                            return (
                              <div
                                key={oIdx}
                                className={`text-[11px] px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                                  isCorrect
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 font-bold'
                                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800'
                                }`}
                              >
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className="truncate">{opt}</span>
                                {isCorrect && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 ml-auto shrink-0" />}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Matching pairs preview */}
                      {q.type === 'matching_pairs' && Array.isArray(q.matchingPairs) && q.matchingPairs.length > 0 && (
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                          <span className="font-bold text-slate-500 block">Pasangan Menjodohkan:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {q.matchingPairs.map((pair, pIdx) => (
                              <span key={pIdx} className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                                {pair.left} ➔ {pair.right}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Explanation Snippet */}
                      {q.explanation && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-850 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                          💡 <strong>Pembahasan:</strong> {q.explanation}
                        </p>
                      )}
                    </div>

                    {/* Quick Single Add Button */}
                    <button
                      type="button"
                      onClick={() => handleAddSingleQuestion(q)}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-xs min-h-[44px] flex items-center gap-1 shrink-0 btn-press"
                      title="Salin dan tambahkan butir soal ini ke kuis"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span className="hidden sm:inline">Ambil</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Multi-Select Action Bar (Sticky Footer) */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-slate-600 dark:text-slate-400 font-bold min-w-0">
            {selectedQuestionIds.size > 0 ? (
              <span className="text-indigo-600 dark:text-indigo-400">
                {selectedQuestionIds.size} soal dipilih
              </span>
            ) : (
              <span>Pilih satu per satu atau centang beberapa soal sekaligus</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 min-h-[44px] btn-press transition-colors"
            >
              Tutup
            </button>

            {selectedQuestionIds.size > 0 && (
              <button
                type="button"
                onClick={handleAddSelectedQuestions}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md min-h-[44px] flex items-center gap-1.5 btn-press transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Tambahkan {selectedQuestionIds.size} Soal Terpilih</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
