import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Flame,
  Award,
  Calendar,
  Check,
  Filter,
} from 'lucide-react';
import type { Quiz, QuizSessionParticipant } from '../../types/quiz';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { formatIndonesianTime } from '../../lib/dateUtils';

interface StudentAnswerAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: QuizSessionParticipant | null;
  quiz: Quiz;
}

type FilterType = 'all' | 'wrong' | 'correct' | 'unanswered';

export const StudentAnswerAnalysisModal: React.FC<StudentAnswerAnalysisModalProps> = ({
  isOpen,
  onClose,
  participant,
  quiz,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset filter when opening new participant
  useEffect(() => {
    if (isOpen) {
      setFilter('all');
      setExpandedExplanations({});
    }
  }, [isOpen, participant?.id]);

  if (!isOpen || !participant) return null;

  const totalQuestions = quiz.questions?.length || participant.totalQuestions || 1;
  const avatarEmoji = AVATAR_MAP[participant.avatarId] || '🦁';

  // Extract clean answers list mapped by questionIndex
  const studentAnswersMap = useMemo(() => {
    const map = new Map<number, any>();
    if (participant.answers) {
      Object.values(participant.answers).forEach((ans: any) => {
        if (ans && ans.questionId !== 'quiz_completed' && typeof ans.questionIndex === 'number' && ans.questionIndex >= 0 && ans.questionIndex < totalQuestions) {
          map.set(ans.questionIndex, ans);
        }
      });
    }
    return map;
  }, [participant.answers, totalQuestions]);

  // Accurate stats
  const correctCount = Math.min(totalQuestions, participant.correctCount);
  const answeredCount = Math.min(totalQuestions, studentAnswersMap.size);
  const incorrectCount = Math.max(0, answeredCount - correctCount);
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const accuracyPercent = answeredCount > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Toggle explanation expansion for specific question
  const toggleExplanation = (idx: number) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Filtered question items
  const filteredQuestionList = useMemo(() => {
    return (quiz.questions || []).map((q, idx) => {
      const ans = studentAnswersMap.get(idx);
      const isAnswered = Boolean(ans);
      const isCorrect = ans ? Boolean(ans.isCorrect) : false;
      return {
        question: q,
        index: idx,
        answer: ans,
        isAnswered,
        isCorrect,
      };
    }).filter((item) => {
      if (filter === 'wrong') return item.isAnswered && !item.isCorrect;
      if (filter === 'correct') return item.isAnswered && item.isCorrect;
      if (filter === 'unanswered') return !item.isAnswered;
      return true;
    });
  }, [quiz.questions, studentAnswersMap, filter]);

  // Format student's selected answer text
  const getStudentAnswerText = (q: any, ans: any) => {
    if (!ans) return 'Belum Dijawab';
    if (ans.textAnswer) return ans.textAnswer;
    if (ans.selectedOption !== undefined && ans.selectedOption >= 0 && q.options && q.options[ans.selectedOption]) {
      return q.options[ans.selectedOption];
    }
    return 'Jawaban Terpilih';
  };

  // Format key correct answer text
  const getCorrectAnswerText = (q: any) => {
    if (q.type === 'matching_pairs' && Array.isArray(q.matchingPairs)) {
      return q.matchingPairs.map((p: any) => `${p.left} ➔ ${p.right}`).join(', ');
    }
    if (q.type === 'short_answer') {
      if (Array.isArray(q.acceptableAnswers) && q.acceptableAnswers.length > 0) {
        return q.acceptableAnswers.join(' / ');
      }
      return q.options?.[q.correctIndex] || 'Kunci Jawaban';
    }
    return q.options?.[q.correctIndex] || 'Kunci Jawaban';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 text-slate-900 dark:text-white">
        {/* ================= HEADER ================= */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0 shadow-inner">
                {avatarEmoji}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                    {participant.name}
                  </h2>
                  {participant.finished ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                      Selesai
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                      Sedang Mengerjakan
                    </span>
                  )}
                  {participant.streak >= 2 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-[11px] font-bold">
                      <Flame className="w-3 h-3 fill-rose-500 text-rose-500" />
                      {participant.streak}x Combo
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Lembar Analisis Jawaban • {quiz.title}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-1 -mt-1 cursor-pointer"
              title="Tutup lembar analisis"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alert Integritas (Tab Switch) */}
          {participant.tabSwitchCount && participant.tabSwitchCount > 0 ? (
            <div className="mt-3 p-2.5 sm:p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>
                <strong>Peringatan Integritas:</strong> Terdeteksi meninggalkan kuis / berpindah layar sebanyak <strong>{participant.tabSwitchCount} kali</strong>.
              </span>
            </div>
          ) : null}

          {/* Grid Statistik & Jam Input */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Skor Akhir</div>
              <div className="text-lg sm:text-xl font-black text-amber-500 flex items-center gap-1 mt-0.5">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                <span>{participant.score} pts</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Akurasi: <strong>{accuracyPercent}%</strong>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Soal</div>
              <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-emerald-600 dark:text-emerald-400">✓ {correctCount} Benar</span>
                <span>•</span>
                <span className="text-rose-600 dark:text-rose-400">✕ {incorrectCount} Salah</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {unansweredCount > 0 ? `${unansweredCount} belum dijawab` : 'Semua terjawab'}
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Waktu Mulai</div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1 truncate">
                <Calendar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="truncate">{formatIndonesianTime(participant.joinedAt, { withSeconds: true })}</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Durasi: {Math.round(participant.timeSpentSec)} detik
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Waktu Selesai / Submit</div>
              <div className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1 truncate">
                <Clock className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="truncate">
                  {participant.finished 
                    ? formatIndonesianTime(participant.completedAt || participant.lastActiveAt, { withSeconds: true })
                    : 'Masih Berjalan'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {participant.finished 
                  ? formatIndonesianTime(participant.completedAt || participant.lastActiveAt, { withDate: true }).split(',')[0]
                  : 'Aktif terpantau'}
              </div>
            </div>
          </div>

          {/* ================= QUICK FILTER TABS ================= */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1 flex-shrink-0">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 min-h-[36px] flex items-center gap-1.5 cursor-pointer ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
              }`}
            >
              <span>Semua Soal</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 font-black">{totalQuestions}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('wrong')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 min-h-[36px] flex items-center gap-1.5 cursor-pointer ${
                filter === 'wrong'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/60'
              }`}
            >
              <span>✕ Jawaban Salah (Remedial)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 font-black">{incorrectCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('correct')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 min-h-[36px] flex items-center gap-1.5 cursor-pointer ${
                filter === 'correct'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
              }`}
            >
              <span>✓ Jawaban Benar</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 font-black">{correctCount}</span>
            </button>

            {unansweredCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter('unanswered')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 min-h-[36px] flex items-center gap-1.5 cursor-pointer ${
                  filter === 'unanswered'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                }`}
              >
                <span>⚪ Belum Dijawab</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 font-black">{unansweredCount}</span>
              </button>
            )}
          </div>
        </div>

        {/* ================= BODY / QUESTION LIST ================= */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3.5 sm:space-y-4">
          {filteredQuestionList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <Check className="w-10 h-10 mx-auto text-emerald-500/80 mb-2" />
              <p className="font-bold text-sm">
                {filter === 'wrong'
                  ? 'Hebat! Tidak ada jawaban salah pada filter ini.'
                  : filter === 'unanswered'
                  ? 'Semua soal telah dijawab oleh siswa.'
                  : 'Tidak ada soal pada kategori ini.'}
              </p>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold underline hover:opacity-80 cursor-pointer"
              >
                Kembali ke Semua Soal
              </button>
            </div>
          ) : (
            filteredQuestionList.map((item) => {
              const { question: q, index: idx, answer: ans, isAnswered, isCorrect } = item;
              const isExpanded = Boolean(expandedExplanations[idx]);

              return (
                <div
                  key={q.id || idx}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                    !isAnswered
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                      : isCorrect
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-200/80 dark:border-emerald-800/50'
                      : 'bg-rose-50/40 dark:bg-rose-950/15 border-rose-200/80 dark:border-rose-800/50'
                  }`}
                >
                  {/* Top Bar: Question Number, Type, & Status */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 font-black text-xs flex items-center justify-center text-slate-700 dark:text-slate-300">
                        #{idx + 1}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {q.type === 'multiple_choice' ? 'Pilihan Ganda' :
                         q.type === 'true_false' ? 'Benar / Salah' :
                         q.type === 'short_answer' ? 'Isian Singkat' :
                         q.type === 'matching_pairs' ? 'Menjodohkan' : 'Tebak Gambar'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Jam Input Siswa & Durasi */}
                      {isAnswered && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium shadow-2xs">
                          <Clock className="w-3 h-3 text-blue-500" />
                          <span>Input: <strong>{formatIndonesianTime(ans?.answeredAt || participant.lastActiveAt, { withSeconds: true })}</strong></span>
                          {ans?.timeSpentSec ? (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span>{Math.round(ans.timeSpentSec)} dtk</span>
                            </>
                          ) : null}
                        </span>
                      )}

                      {/* Status Lencana */}
                      {!isAnswered ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Belum Dijawab</span>
                        </span>
                      ) : isCorrect ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Benar (+{ans?.pointsEarned ?? q.points ?? 10} pts)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Keliru</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pertanyaan Teks */}
                  <div className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {q.text}
                  </div>

                  {/* Gambar Soal jika ada */}
                  {q.imageUrl && (
                    <div className="w-32 h-20 sm:w-40 sm:h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                      <img src={q.imageUrl} alt={q.imageCaption || 'Soal'} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Perbandingan Jawaban Siswa vs Kunci Benar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                    <div className={`p-2.5 rounded-xl border ${
                      !isAnswered
                        ? 'bg-slate-100/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500'
                        : isCorrect
                        ? 'bg-emerald-100/50 dark:bg-emerald-950/30 border-emerald-300/70 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-100/50 dark:bg-rose-950/30 border-rose-300/70 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
                    }`}>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Jawaban Siswa:</div>
                      <div className="font-black text-xs sm:text-sm break-words">
                        {getStudentAnswerText(q, ans)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Kunci Jawaban Benar:</div>
                      <div className="font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 break-words">
                        {getCorrectAnswerText(q)}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Pembahasan Materi */}
                  {q.explanation && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleExplanation(idx)}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer min-h-[36px]"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{isExpanded ? 'Tutup Pembahasan' : 'Lihat Pembahasan Konsep'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed animate-fade-in">
                          <strong className="font-bold">Penjelasan:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-900/80 flex-shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Menampilkan <strong>{filteredQuestionList.length}</strong> dari <strong>{totalQuestions}</strong> butir soal
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 active:scale-95 transition-all min-h-[44px] cursor-pointer"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
