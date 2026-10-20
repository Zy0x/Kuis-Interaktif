import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  CheckCircle2,
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
  Share2,
  Sparkles,
  Lightbulb,
  BookOpen,
} from 'lucide-react';
import type { Quiz, QuizQuestion, QuizSessionParticipant } from '../../types/quiz';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { formatIndonesianTime, formatIndonesianDate } from '../../lib/dateUtils';
import { formatMathExpression, getOptionLetter, triggerHaptic } from '../../lib/mobileUtils';
import { StudentAppreciationCardModal } from './StudentAppreciationCardModal';
import { generateStudentWhatsAppUrl } from '../../lib/shareUtils';

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
  const [isCardOpen, setIsCardOpen] = useState(false);
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

  const totalQuestions = quiz?.questions?.length || participant?.totalQuestions || 1;
  const avatarEmoji = participant ? (AVATAR_MAP[participant.avatarId] || '🦁') : '🦁';

  // Hitung durasi pengerjaan yang akurat dan toleran terhadap kondisi timer 0
  const durationInfo = useMemo(() => {
    if (!participant) return { seconds: 0, text: 'Kurang dari 1 mnt' };
    let seconds = participant.timeSpentSec || 0;
    if ((!seconds || seconds <= 0) && participant.joinedAt) {
      const endTimestamp = participant.completedAt || participant.lastActiveAt;
      if (endTimestamp) {
        const diffMs = new Date(endTimestamp).getTime() - new Date(participant.joinedAt).getTime();
        if (diffMs > 0) {
          seconds = Math.round(diffMs / 1000);
        }
      }
    }
    if (seconds <= 0) return { seconds: 0, text: 'Kurang dari 1 mnt' };
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins === 0) return { seconds, text: `${secs} dtk` };
    if (secs === 0) return { seconds, text: `${mins} mnt` };
    return { seconds, text: `${mins} mnt ${secs} dtk` };
  }, [participant]);

  const handleShareWA = () => {
    if (!participant) return;
    triggerHaptic('light');
    const url = generateStudentWhatsAppUrl({
      studentName: participant.name,
      quizTitle: quiz.title,
      score: participant.score,
      correctCount: participant.correctCount,
      totalQuestions: totalQuestions,
      timeSpentSec: durationInfo.seconds || participant.timeSpentSec,
    });
    window.open(url, '_blank');
  };

  // Extract clean answers list mapped by questionId (kebal terhadap pengacakan urutan soal)
  const studentAnswersMap = useMemo(() => {
    const map = new Map<string, any>();
    if (participant?.answers) {
      Object.values(participant.answers).forEach((ans: any) => {
        if (ans && ans.questionId && ans.questionId !== 'quiz_completed') {
          map.set(ans.questionId, ans);
        }
      });
    }
    return map;
  }, [participant?.answers]);

  // Reliable questions list: use quiz.questions if available, or fallback placeholders
  const questionsToDisplay: QuizQuestion[] = useMemo(() => {
    if (quiz?.questions && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
      return quiz.questions;
    }
    return Array.from({ length: totalQuestions }).map((_, idx) => ({
      id: `q_${idx}`,
      text: `Butir Soal #${idx + 1}`,
      type: 'multiple_choice' as const,
      imageUrl: undefined,
      imageCaption: undefined,
      options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
      correctIndex: 0,
      explanation: '',
      points: 10,
    }));
  }, [quiz?.questions, totalQuestions]);

  // Evaluated questions list (unfiltered)
  const evaluatedQuestionList = useMemo(() => {
    return questionsToDisplay.map((q, idx) => {
      // 1. Prioritas utama: Cocokkan via questionId unik
      let ans = studentAnswersMap.get(q.id);
      // 2. Fallback jika participant.answers berformat objek Record dengan key q.id
      if (!ans && participant?.answers && (participant.answers as any)[q.id]) {
        ans = (participant.answers as any)[q.id];
      }
      // 3. Fallback HANYA JIKA ada rekaman tanpa questionId (data warisan murni berbasis indeks)
      if (!ans && participant?.answers) {
        ans = Object.values(participant.answers).find((a: any) => 
          a && a.questionId !== 'quiz_completed' && (!a.questionId || a.questionId === `q_${idx}`) && a.questionIndex === idx
        );
      }
      const isAnswered = Boolean(ans);
      const isCorrect = ans ? Boolean(ans.isCorrect) : false;
      return {
        question: q,
        index: idx,
        answer: ans,
        isAnswered,
        isCorrect,
      };
    });
  }, [questionsToDisplay, studentAnswersMap, participant?.answers]);

  // Filtered question items according to active tab
  const filteredQuestionList = useMemo(() => {
    return evaluatedQuestionList.filter((item) => {
      if (filter === 'wrong') return item.isAnswered && !item.isCorrect;
      if (filter === 'correct') return item.isAnswered && item.isCorrect;
      if (filter === 'unanswered') return !item.isAnswered;
      return true;
    });
  }, [evaluatedQuestionList, filter]);

  // Accurate counts derived directly from evaluatedQuestionList
  const correctCount = useMemo(() => evaluatedQuestionList.filter(item => item.isAnswered && item.isCorrect).length, [evaluatedQuestionList]);
  const incorrectCount = useMemo(() => evaluatedQuestionList.filter(item => item.isAnswered && !item.isCorrect).length, [evaluatedQuestionList]);
  const unansweredCount = useMemo(() => evaluatedQuestionList.filter(item => !item.isAnswered).length, [evaluatedQuestionList]);
  const accuracyPercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Safe early exit AFTER all hooks have executed unconditionally
  if (!isOpen || !participant) return null;

  // Toggle explanation expansion for specific question
  const toggleExplanation = (idx: number) => {
    triggerHaptic('light');
    setExpandedExplanations((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Format student's selected answer text
  const getStudentAnswerText = (q: any, ans: any): string => {
    if (!ans) return 'Belum Dijawab';
    if (typeof ans.textAnswer === 'string' && ans.textAnswer.trim() !== '') return formatMathExpression(ans.textAnswer);
    if (typeof ans.textAnswer === 'number' || typeof ans.textAnswer === 'boolean') return String(ans.textAnswer);
    if (ans.selectedOption !== undefined && ans.selectedOption >= 0 && Array.isArray(q?.options) && q.options[ans.selectedOption]) {
      return `${getOptionLetter(ans.selectedOption)}. ${formatMathExpression(String(q.options[ans.selectedOption]))}`;
    }
    if (typeof ans.selectedOption === 'number' && ans.selectedOption >= 0) {
      return `${getOptionLetter(ans.selectedOption)}. Pilihan Opsi #${ans.selectedOption + 1}`;
    }
    return 'Jawaban Terpilih';
  };

  // Format key correct answer text
  const getCorrectAnswerText = (q: any): string => {
    if (!q) return 'Kunci Jawaban';
    if (q.type === 'matching_pairs' && Array.isArray(q.matchingPairs)) {
      return q.matchingPairs.map((p: any) => `${p.left} ➔ ${p.right}`).join(', ');
    }
    if (q.type === 'short_answer') {
      if (Array.isArray(q.acceptableAnswers) && q.acceptableAnswers.length > 0) {
        return q.acceptableAnswers.map((a: string) => formatMathExpression(a)).join(' / ');
      }
      return formatMathExpression(String(q.options?.[q.correctIndex] || 'Kunci Jawaban'));
    }
    if (Array.isArray(q.options) && q.correctIndex !== undefined && q.options[q.correctIndex] !== undefined) {
      return `${getOptionLetter(q.correctIndex)}. ${formatMathExpression(String(q.options[q.correctIndex]))}`;
    }
    return 'Kunci Jawaban';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 text-slate-900 dark:text-white">
        
        {/* ================= HEADER ================= */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
              
              {/* Avatar Squircle with Soft Glow */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-950/80 dark:to-slate-800 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0 shadow-sm shadow-indigo-500/10">
                {avatarEmoji}
              </div>

              <div className="min-w-0 flex-1">
                {/* Nama Lengkap Siswa - Wrap Alami, Bebas Potongan Teks Kaku */}
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-snug break-words">
                  {participant.name}
                </h2>

                {/* Lencana Status & Performa */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mt-1">
                  {participant.finished ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Selesai Dikerjakan</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                      <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>Sedang Mengerjakan</span>
                    </span>
                  )}

                  {participant.streak >= 2 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-[11px] font-bold">
                      <Flame className="w-3 h-3 fill-rose-500 text-rose-500" />
                      <span>{participant.streak}x Combo</span>
                    </span>
                  )}

                  {accuracyPercent === 100 && participant.finished && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Skor Sempurna</span>
                    </span>
                  )}
                </div>

                {/* Subtitle Deskriptif Edukatif */}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span className="truncate">Lembar Evaluasi Siswa • {quiz.title}</span>
                </p>
              </div>
            </div>

            {/* Tombol Tutup Touch-Friendly */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-1 -mt-1 cursor-pointer flex-shrink-0"
              title="Tutup lembar evaluasi"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Banner Apresiasi & Keamanan Psikologis */}
          {participant.finished && accuracyPercent === 100 ? (
            <div className="mt-3.5 p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/25 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="leading-relaxed">
                <strong>Hebat Sekali!</strong> Seluruh butir soal berhasil dijawab dengan sangat tepat dan percaya diri.
              </span>
            </div>
          ) : participant.finished && incorrectCount > 0 ? (
            <div className="mt-3.5 p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/25 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="leading-relaxed">
                <strong>Refleksi Belajar:</strong> Terdapat <strong>{incorrectCount} butir soal</strong> yang perlu dipelajari kembali untuk memperkuat pemahaman konsep.
              </span>
            </div>
          ) : null}

          {/* Catatan Fokus Layar (Tab Switch) - Bahasa Santun & Bersahabat */}
          {participant.tabSwitchCount && participant.tabSwitchCount > 0 ? (
            <div className="mt-2.5 p-2.5 sm:p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-750 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>
                <strong>Catatan Fokus:</strong> Terdeteksi beralih dari aplikasi/layar kuis sebanyak <strong>{participant.tabSwitchCount} kali</strong>.
              </span>
            </div>
          ) : null}

          {/* Grid Statistik & Jam Input (Bento Card Compact & Bersih) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mt-3.5">
            {/* Kartu 1: Capaian Nilai */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750/80 shadow-2xs flex flex-col justify-between">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Capaian Nilai
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-500 flex items-center gap-1.5 my-1">
                <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span className="tabular-nums">{participant.score}</span>
                <span className="text-xs font-bold text-slate-400">pts</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Akurasi: <span className="font-bold text-slate-900 dark:text-white">{accuracyPercent}%</span>
              </div>
            </div>

            {/* Kartu 2: Ketuntasan Soal */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750/80 shadow-2xs flex flex-col justify-between">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Ketuntasan Soal
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5 my-1">
                <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">{correctCount} Tepat</span>
                {incorrectCount > 0 && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-amber-600 dark:text-amber-400 tabular-nums">{incorrectCount} Review</span>
                  </>
                )}
              </div>
              <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                {unansweredCount > 0 
                  ? `${unansweredCount} soal dilewati` 
                  : `${totalQuestions} dari ${totalQuestions} terjawab`}
              </div>
            </div>

            {/* Kartu 3: Waktu Mulai */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750/80 shadow-2xs flex flex-col justify-between">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Waktu Mulai
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 my-1 truncate">
                <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="truncate">{formatIndonesianTime(participant.joinedAt, { withSeconds: true })}</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {formatIndonesianDate(participant.joinedAt, { withDay: true, withYear: true })}
              </div>
            </div>

            {/* Kartu 4: Waktu Selesai & Durasi */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750/80 shadow-2xs flex flex-col justify-between">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Selesai & Durasi
              </div>
              <div className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 my-1 truncate">
                <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="truncate">
                  {participant.finished 
                    ? formatIndonesianTime(participant.completedAt || participant.lastActiveAt, { withSeconds: true })
                    : 'Masih Berjalan'}
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                Durasi: <strong className="text-slate-900 dark:text-white">{durationInfo.text}</strong>
              </div>
            </div>
          </div>

          {/* ================= QUICK FILTER TABS ================= */}
          <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1 flex-shrink-0">
                <Filter className="w-3 h-3" /> Filter:
              </span>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setFilter('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 min-h-[38px] flex items-center gap-1.5 cursor-pointer ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                }`}
              >
                <span>Semua Soal</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/15 font-black">{totalQuestions}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setFilter('wrong');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 min-h-[38px] flex items-center gap-1.5 cursor-pointer ${
                  filter === 'wrong'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : incorrectCount > 0
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                }`}
              >
                <span>Perlu Ditinjau</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                  filter === 'wrong' ? 'bg-black/20 text-white' : 'bg-black/10'
                }`}>
                  {incorrectCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setFilter('correct');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 min-h-[38px] flex items-center gap-1.5 cursor-pointer ${
                  filter === 'correct'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                }`}
              >
                <span>Jawaban Tepat</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                  filter === 'correct' ? 'bg-black/20 text-white' : 'bg-black/10'
                }`}>
                  {correctCount}
                </span>
              </button>

              {unansweredCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setFilter('unanswered');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 min-h-[38px] flex items-center gap-1.5 cursor-pointer ${
                    filter === 'unanswered'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                  }`}
                >
                  <span>Dilewati</span>
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/15 font-black">{unansweredCount}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================= BODY / QUESTION LIST ================= */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 space-y-3 sm:space-y-3.5 scrollbar-thin">
          {filteredQuestionList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <Check className="w-10 h-10 mx-auto text-emerald-500/80 mb-2" />
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                {filter === 'wrong'
                  ? 'Luar biasa! Seluruh soal dijawab dengan tepat tanpa ada butir evaluasi.'
                  : filter === 'unanswered'
                  ? 'Hebat! Semua butir soal telah berhasil dijawab oleh siswa.'
                  : 'Tidak ada butir soal pada kategori ini.'}
              </p>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold underline hover:opacity-80 cursor-pointer min-h-[36px] inline-flex items-center"
              >
                Tampilkan Semua Soal
              </button>
            </div>
          ) : (
            filteredQuestionList.map((item) => {
              const { question: q, index: idx, answer: ans, isAnswered, isCorrect } = item;
              const isExpanded = Boolean(expandedExplanations[idx]);

              return (
                <div
                  key={q.id || idx}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-2.5 ${
                    !isAnswered
                      ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-750'
                      : isCorrect
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/15 border-emerald-200/80 dark:border-emerald-800/40'
                      : 'bg-amber-50/30 dark:bg-amber-950/15 border-amber-200/80 dark:border-amber-800/40'
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

                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      {/* Jam Input Siswa & Durasi */}
                      {isAnswered && (
                        <span 
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium shadow-2xs"
                          title={`Waktu Input: ${formatIndonesianTime(ans?.answeredAt || participant.lastActiveAt, { withDate: true, withSeconds: true, withYear: true })}`}
                        >
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

                      {/* Status Lencana Ramah & Konstruktif */}
                      {!isAnswered ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Dilewati</span>
                        </span>
                      ) : isCorrect ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Tepat (+{ans?.pointsEarned ?? q.points ?? 10} pts)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Perlu Dipelajari</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pertanyaan Teks */}
                  <div className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {formatMathExpression(q.text)}
                  </div>

                  {/* Gambar Soal jika ada */}
                  {q.imageUrl && (
                    <div className="w-32 h-20 sm:w-40 sm:h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                      <img src={q.imageUrl} alt={q.imageCaption || 'Soal'} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Perbandingan Jawaban Siswa vs Kunci Benar (Format Bersih, Rapi, & Tidak Redundan) */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    {!isAnswered ? (
                      /* Kondisi Soal Dilewati */
                      <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                          Kunci Jawaban Soal:
                        </div>
                        <div className="font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 break-words">
                          {getCorrectAnswerText(q)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Soal ini tidak dijawab atau dilewati siswa saat sesi kuis.
                        </div>
                      </div>
                    ) : isCorrect ? (
                      /* Kondisi Jawaban Tepat: Tampilan Bersih Terpadu (Tanpa Pengulangan Kotak Ganda Identik) */
                      <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/25 border border-emerald-500/25 flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                            Jawaban Siswa (Tepat):
                          </div>
                          <div className="font-bold text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 mt-0.5 break-words">
                            {getStudentAnswerText(q, ans)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Kondisi Jawaban Perlu Evaluasi: Perbandingan Komparatif Bersahabat */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/25">
                          <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 mb-0.5 flex items-center gap-1">
                            <span>Pilihan Siswa:</span>
                          </div>
                          <div className="font-bold text-xs sm:text-sm text-amber-950 dark:text-amber-200 break-words">
                            {getStudentAnswerText(q, ans)}
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/25 border border-emerald-500/25">
                          <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 mb-0.5 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
                            <span>Kunci Jawaban yang Tepat:</span>
                          </div>
                          <div className="font-bold text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 break-words">
                            {getCorrectAnswerText(q)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Toggle Pembahasan Materi Pembelajaran */}
                  {q.explanation && (
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => toggleExplanation(idx)}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{isExpanded ? 'Tutup Pembahasan' : 'Lihat Pembahasan Konsep'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-1.5 p-3 sm:p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed animate-fade-in">
                          <div className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 mb-1">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Pembahasan Guru:</span>
                          </div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {formatMathExpression(q.explanation)}
                          </p>
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
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-50/80 dark:bg-slate-900/80 flex-shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            Menampilkan <strong>{filteredQuestionList.length}</strong> dari <strong>{totalQuestions}</strong> butir soal
          </span>
          
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsCardOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 min-h-[44px] transition-colors btn-press cursor-pointer flex-1 sm:flex-none justify-center"
              title="Lihat & Cetak Kartu Apresiasi Siswa"
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>Kartu Apresiasi</span>
            </button>

            <button
              type="button"
              onClick={handleShareWA}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 min-h-[44px] transition-colors btn-press cursor-pointer flex-1 sm:flex-none justify-center"
              title="Kirim Nilai ke WhatsApp Wali Murid"
            >
              <Share2 className="w-4 h-4 text-emerald-500" />
              <span>Kirim ke WA</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-slate-750 hover:bg-slate-800 dark:hover:bg-slate-650 min-h-[44px] transition-all cursor-pointer flex-1 sm:flex-none justify-center"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Modal Kartu Apresiasi Prestasi Siswa */}
      <StudentAppreciationCardModal
        isOpen={isCardOpen}
        onClose={() => setIsCardOpen(false)}
        participant={participant}
        quiz={quiz}
      />
    </div>
  );
};
