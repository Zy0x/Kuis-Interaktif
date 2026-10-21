import React, { useState, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BarChart3,
  Lightbulb,
  ArrowUpDown
} from 'lucide-react';
import type { Quiz, QuizSessionParticipant } from '../../types/quiz';
import { formatMathExpression, getOptionLetter } from '../../lib/mobileUtils';
import { triggerHaptic } from '../../lib/mobileUtils';

interface ClassReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
  participants: QuizSessionParticipant[];
}

export const ClassReviewModal: React.FC<ClassReviewModalProps> = ({
  isOpen,
  onClose,
  quiz,
  participants,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sortByDifficulty, setSortByDifficulty] = useState(true);

  const questions = quiz.questions || [];
  const totalStudents = participants.length;

  // Analisis statistik jawaban per butir soal
  const questionAnalytics = useMemo(() => {
    return questions.map((q, originalIdx) => {
      const qId = q.id;
      let correctAnswers = 0;
      let totalAnswered = 0;
      const optionCounts: number[] = new Array((q.options?.length || 4)).fill(0);

      participants.forEach((p) => {
        const ans = p.answers ? ((p.answers as any)[qId] || Object.values(p.answers).find((a: any) => a?.questionId === qId || a?.questionIndex === originalIdx)) : null;
        if (ans) {
          totalAnswered++;
          if (ans.isCorrect) correctAnswers++;
          if (typeof ans.selectedOption === 'number' && ans.selectedOption >= 0 && ans.selectedOption < optionCounts.length) {
            optionCounts[ans.selectedOption]++;
          }
        }
      });

      const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
      const wrongCount = totalAnswered - correctAnswers;

      return {
        question: q,
        originalIndex: originalIdx,
        accuracy,
        correctAnswers,
        wrongCount,
        totalAnswered,
        optionCounts,
      };
    });
  }, [questions, participants]);

  // Urutkan soal (Tersulit dulu atau Sesuai Nomor Asli)
  const sortedList = useMemo(() => {
    const list = [...questionAnalytics];
    if (sortByDifficulty) {
      return list.sort((a, b) => a.accuracy - b.accuracy);
    }
    return list.sort((a, b) => a.originalIndex - b.originalIndex);
  }, [questionAnalytics, sortByDifficulty]);

  if (!isOpen || sortedList.length === 0) return null;

  const currentItem = sortedList[currentIdx] || sortedList[0];
  const q = currentItem.question;

  const handlePrev = () => {
    triggerHaptic('light');
    setCurrentIdx((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    triggerHaptic('light');
    setCurrentIdx((prev) => Math.min(sortedList.length - 1, prev + 1));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-300/90 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Modal — Aman untuk Proyektor / Smartboard */}
        <div className="p-3.5 sm:p-4.5 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-850/70 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-600/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] sm:text-xs font-bold">
                  🎓 Bahas Bersama di Kelas
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">•</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate hidden sm:inline">
                  {totalStudents} Siswa Berpartisipasi (Nama Siswa Dirahasiakan)
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                {quiz.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Sort Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSortByDifficulty(!sortByDifficulty);
                setCurrentIdx(0);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[40px] btn-press shadow-2xs"
              title="Ganti Urutan Soal"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {sortByDifficulty ? 'Urut: Tersulit Dulu' : 'Urut: Nomor 1-N'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Question Selector Dots / Bar */}
        <div className="px-4 py-2 border-b border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
          {sortedList.map((item, idx) => {
            const isCurrent = idx === currentIdx;
            const isHard = item.accuracy < 60;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setCurrentIdx(idx);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 min-h-[34px] flex-shrink-0 btn-press border ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : isHard
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800/80 hover:bg-rose-100 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-2xs'
                }`}
                title={`Soal #${item.originalIndex + 1} (Akurasi: ${item.accuracy}%)`}
              >
                <span>#{item.originalIndex + 1}</span>
                <span className="text-[10px] opacity-80">({item.accuracy}%)</span>
              </button>
            );
          })}
        </div>

        {/* Content Body: Question + Statistics */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Question Text & Stats Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-300/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold text-xs border border-blue-200 dark:border-blue-900/60">
                Butir Soal #{currentItem.originalIndex + 1} dari {questions.length}
              </span>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black border shadow-2xs ${
                  currentItem.accuracy >= 70
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                }`}>
                  Tingkat Keberhasilan: {currentItem.accuracy}%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  ({currentItem.correctAnswers} Benar, {currentItem.wrongCount} Salah)
                </span>
              </div>
            </div>

            <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
              {formatMathExpression(q.text)}
            </h3>

            {q.imageUrl && (
              <div className="max-w-md mx-auto rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={q.imageUrl} alt="Ilustrasi Soal" className="w-full max-h-48 object-contain bg-white dark:bg-slate-900" />
              </div>
            )}
          </div>

          {/* Option Distribution Bars */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Distribusi Pilihan Siswa di Kelas:
            </h4>

            {q.options && q.options.map((optText, optIdx) => {
              const isCorrectOpt = optIdx === q.correctIndex;
              const countForThisOpt = currentItem.optionCounts[optIdx] || 0;
              const percentage = currentItem.totalAnswered > 0 
                ? Math.round((countForThisOpt / currentItem.totalAnswered) * 100) 
                : 0;

              return (
                <div
                  key={optIdx}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all relative overflow-hidden shadow-2xs ${
                    isCorrectOpt
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-400 dark:border-emerald-600/80'
                      : 'bg-white dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700/80'
                  }`}
                >
                  {/* Progress bar fill in background */}
                  <div
                    className={`absolute inset-y-0 left-0 opacity-15 pointer-events-none transition-all duration-500 ${
                      isCorrectOpt ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />

                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isCorrectOpt
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300/70 dark:border-slate-600'
                      }`}>
                        {getOptionLetter(optIdx)}
                      </span>
                      <span className={`text-xs sm:text-sm font-bold break-words ${
                        isCorrectOpt ? 'text-emerald-950 dark:text-emerald-200 font-extrabold' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {formatMathExpression(optText)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 text-right">
                      {isCorrectOpt && (
                        <span className="hidden xs:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mr-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Kunci Benar
                        </span>
                      )}
                      <span className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300">
                        {percentage}%
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        ({countForThisOpt} siswa)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explanation Box */}
          {q.explanation && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-300/80 dark:border-blue-900/60 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300">
                <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Pembahasan Konsep Pedagogis:</span>
              </div>
              <p className="text-xs sm:text-sm text-blue-950 dark:text-blue-200 leading-relaxed font-medium">
                {formatMathExpression(q.explanation)}
              </p>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-100/70 dark:bg-slate-900/70 flex-shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="px-4 py-2.5 rounded-xl border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 min-h-[44px] transition-colors btn-press shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Soal Sebelumnya</span>
          </button>

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {currentIdx + 1} dari {sortedList.length}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIdx === sortedList.length - 1}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 min-h-[44px] transition-colors shadow-xs btn-press"
          >
            <span>Soal Berikutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
