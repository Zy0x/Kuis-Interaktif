import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Flame,
  Award,
  Check,
  Share2,
} from 'lucide-react';
import type { Quiz, QuizQuestion, QuizSessionParticipant } from '../../types/quiz';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { formatIndonesianTime } from '../../lib/dateUtils';
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
    if (!participant) return { seconds: 0, text: '< 1 mnt' };
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
    if (seconds <= 0) return { seconds: 0, text: '< 1 mnt' };
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins === 0) return { seconds, text: `${secs} dtk` };
    if (secs === 0) return { seconds, text: `${mins} mnt` };
    return { seconds, text: `${mins}m ${secs}s` };
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
      let ans = studentAnswersMap.get(q.id);
      if (!ans && participant?.answers && (participant.answers as any)[q.id]) {
        ans = (participant.answers as any)[q.id];
      }
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
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 text-slate-900 dark:text-white">
        
        {/* ================= COMPACT HEADER & SUMMARY STRIP ================= */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex-shrink-0">
          
          {/* Baris 1: Identitas Ringkas Siswa & Tombol Tutup */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-center text-xl flex-shrink-0">
                {avatarEmoji}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                    {participant.name}
                  </h2>
                  {participant.streak >= 2 && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                      <Flame className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                      {participant.streak}x
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {quiz.title}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer flex-shrink-0"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Baris 2: Ringkasan Nilai & Pengerjaan (Compact 4-Pill Grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            {/* Skor & Akurasi */}
            <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Skor</div>
                <div className="text-sm sm:text-base font-black text-amber-500 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>{participant.score} pts</span>
                </div>
              </div>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {accuracyPercent}%
              </span>
            </div>

            {/* Hasil Pengerjaan */}
            <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Hasil</div>
              <div className="text-xs font-bold mt-0.5 flex items-center gap-1.5 text-slate-900 dark:text-white">
                <span className="text-emerald-600 dark:text-emerald-400">{correctCount} Benar</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className={incorrectCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}>
                  {incorrectCount} Salah
                </span>
              </div>
            </div>

            {/* Jam Mulai */}
            <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Mulai</div>
              <div className="text-xs font-bold mt-0.5 text-slate-800 dark:text-slate-200 truncate">
                {formatIndonesianTime(participant.joinedAt)}
              </div>
            </div>

            {/* Durasi */}
            <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Durasi</div>
              <div className="text-xs font-bold mt-0.5 text-emerald-600 dark:text-emerald-400 truncate">
                {participant.finished ? durationInfo.text : 'Mengerjakan'}
              </div>
            </div>
          </div>

          {/* Baris 3: Filter Cepat Segmen (Ramping & Hemat Ruang) */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setFilter('all');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex-shrink-0 min-h-[34px] flex items-center gap-1.5 cursor-pointer ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              <span>Semua</span>
              <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-black/15 font-black">{totalQuestions}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setFilter('wrong');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex-shrink-0 min-h-[34px] flex items-center gap-1.5 cursor-pointer ${
                filter === 'wrong'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : incorrectCount > 0
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              <span>Perlu Evaluasi</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
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
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex-shrink-0 min-h-[34px] flex items-center gap-1.5 cursor-pointer ${
                filter === 'correct'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              <span>Benar</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
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
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex-shrink-0 min-h-[34px] flex items-center gap-1.5 cursor-pointer ${
                  filter === 'unanswered'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                <span>Dilewati</span>
                <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-black/15 font-black">{unansweredCount}</span>
              </button>
            )}
          </div>
        </div>

        {/* ================= BODY: BUTIRAN SOAL & JAWABAN SISWA (FOKUS UTAMA) ================= */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-3 scrollbar-thin">
          {filteredQuestionList.length === 0 ? (
            <div className="py-10 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <Check className="w-8 h-8 mx-auto text-emerald-500/80 mb-1" />
              <p className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {filter === 'wrong'
                  ? 'Tidak ada butir soal yang keliru pada hasil pengerjaan ini.'
                  : filter === 'unanswered'
                  ? 'Semua soal telah dijawab oleh siswa.'
                  : 'Tidak ada soal pada kategori ini.'}
              </p>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
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
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                    !isAnswered
                      ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'
                      : isCorrect
                      ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/40'
                      : 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-200/60 dark:border-amber-900/40'
                  }`}
                >
                  {/* Baris Meta Soal: Nomor, Tipe, Durasi Jawab, Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 font-black text-xs flex items-center justify-center text-slate-700 dark:text-slate-300">
                        {idx + 1}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {q.type === 'multiple_choice' ? 'Pilihan Ganda' :
                         q.type === 'true_false' ? 'Benar/Salah' :
                         q.type === 'short_answer' ? 'Isian Singkat' :
                         q.type === 'matching_pairs' ? 'Menjodohkan' : 'Soal'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isAnswered && ans?.timeSpentSec ? (
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{Math.round(ans.timeSpentSec)} dtk</span>
                        </span>
                      ) : null}

                      {!isAnswered ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-200/70 dark:bg-slate-800 text-slate-500">
                          Dilewati
                        </span>
                      ) : isCorrect ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Benar (+{ans?.pointsEarned ?? q.points ?? 10})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          <HelpCircle className="w-3 h-3" />
                          <span>Perlu Evaluasi</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pertanyaan Teks - Terbaca Jelas & Terang */}
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {formatMathExpression(q.text)}
                  </div>

                  {/* Gambar Soal (Jika Ada) */}
                  {q.imageUrl && (
                    <div className="w-32 h-20 sm:w-40 sm:h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                      <img src={q.imageUrl} alt={q.imageCaption || 'Soal'} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Jawaban Siswa & Kunci Jawaban (Ringkas, Padat, dan Sangat Jelas) */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    {!isAnswered ? (
                      <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 text-xs">
                        <span className="text-slate-400 font-semibold mr-1.5">Kunci Jawaban:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{getCorrectAnswerText(q)}</span>
                      </div>
                    ) : isCorrect ? (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 text-xs flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold mr-1.5">Jawaban Siswa:</span>
                          <span className="font-bold text-emerald-950 dark:text-emerald-200">{getStudentAnswerText(q, ans)}</span>
                        </div>
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20">
                          <span className="text-amber-700 dark:text-amber-400 font-semibold mr-1.5">Jawaban Siswa:</span>
                          <span className="font-bold text-amber-950 dark:text-amber-200">{getStudentAnswerText(q, ans)}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20">
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold mr-1.5">Kunci Benar:</span>
                          <span className="font-bold text-emerald-950 dark:text-emerald-200">{getCorrectAnswerText(q)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pembahasan Materi Guru */}
                  {q.explanation && (
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => toggleExplanation(idx)}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer py-0.5"
                      >
                        <span>{isExpanded ? 'Tutup Pembahasan' : 'Lihat Pembahasan'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-1.5 p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/30 text-xs text-slate-800 dark:text-slate-200 leading-relaxed animate-fade-in">
                          <strong className="text-indigo-700 dark:text-indigo-300">Pembahasan: </strong>
                          {formatMathExpression(q.explanation)}
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
        <div className="p-3 sm:p-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-50/80 dark:bg-slate-900 flex-shrink-0">
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
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 min-h-[42px] transition-colors btn-press cursor-pointer flex-1 sm:flex-none justify-center"
              title="Cetak Kartu Apresiasi Siswa"
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>Kartu Apresiasi</span>
            </button>

            <button
              type="button"
              onClick={handleShareWA}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 min-h-[42px] transition-colors btn-press cursor-pointer flex-1 sm:flex-none justify-center"
              title="Kirim Nilai ke WhatsApp Wali Murid"
            >
              <Share2 className="w-4 h-4 text-emerald-500" />
              <span>Kirim ke WA</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-slate-750 hover:bg-slate-800 dark:hover:bg-slate-650 min-h-[42px] transition-all cursor-pointer flex-1 sm:flex-none justify-center"
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
