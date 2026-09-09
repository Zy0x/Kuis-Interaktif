import React, { useState, useEffect, useRef } from 'react';
import type { Quiz, QuizAttemptAnswer } from '../../types/quiz';
import { 
  X, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  HelpCircle,
  Clock
} from 'lucide-react';

interface QuizArenaProps {
  quiz: Quiz;
  onFinishQuiz: (answers: QuizAttemptAnswer[], totalTimeSpent: number) => void;
  onExit: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  playClick: () => void;
  playCorrect: () => void;
  playWrong: () => void;
}

export const QuizArena: React.FC<QuizArenaProps> = ({
  quiz,
  onFinishQuiz,
  onExit,
  isMuted,
  onToggleMute,
  playClick,
  playCorrect,
  playWrong,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState(false);
  const [answersList, setAnswersList] = useState<QuizAttemptAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(quiz.durationPerQuestionSec);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const question = quiz.questions[currentIndex];
  const isLastQuestion = currentIndex === quiz.questions.length - 1;
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isAnswerConfirmed) return;

    setTimeLeft(quiz.durationPerQuestionSec);

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAnswerSelect(-1);
          return 0;
        }
        return prev - 1;
      });
      setTotalTimeSpent((t) => t + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswerConfirmed, quiz.durationPerQuestionSec]);

  const handleAnswerSelect = (optionIndex: number) => {
    if (isAnswerConfirmed) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(optionIndex);
    setIsAnswerConfirmed(true);

    const isCorrect = optionIndex === question.correctIndex;
    if (isCorrect) {
      playCorrect();
    } else {
      playWrong();
    }

    const timeSpent = quiz.durationPerQuestionSec - timeLeft;
    const recordedAnswer: QuizAttemptAnswer = {
      questionId: question.id,
      selectedIndex: optionIndex,
      isCorrect,
      timeSpentSec: Math.max(1, timeSpent),
    };

    setAnswersList((prev) => [...prev, recordedAnswer]);
  };

  const handleNext = () => {
    playClick();
    if (isLastQuestion) {
      onFinishQuiz(answersList, totalTimeSpent);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerConfirmed(false);
    }
  };

  const progressPercent = ((currentIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between select-none">
      
      {/* Top Arena Header */}
      <header className="w-full bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3 sticky top-0 z-20 shadow-sm">
        <div className="w-full max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => {
              playClick();
              setShowExitConfirm(true);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label="Keluar Kuis"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center flex-1 min-w-0 px-2">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md inline-block">
              Soal {currentIndex + 1} dari {quiz.questions.length}
            </span>
            <h2 className="text-xs sm:text-sm font-bold text-slate-700 truncate mt-0.5">
              {quiz.title}
            </h2>
          </div>

          <button
            onClick={() => {
              playClick();
              onToggleMute();
            }}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label="Pengaturan Suara"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-slate-700" />}
          </button>
        </div>

        {/* Subtle, Clean Progress Track */}
        <div className="w-full max-w-3xl mx-auto bg-slate-100 h-1 mt-2.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Quiz Arena Card - Focused Reading Experience */}
      <main className="w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-4 flex-1 flex flex-col justify-center">
        
        {/* Timer Pill */}
        <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Sisa Waktu:</span>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
            timeLeft <= 5 ? 'bg-rose-100 text-rose-700 font-extrabold animate-pulse' : 'bg-slate-100 text-slate-700'
          }`}>
            {timeLeft} detik
          </span>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-card space-y-4 animate-fade-in">
          
          <h3 className="text-base sm:text-xl font-bold text-slate-900 leading-snug break-words">
            {question.text}
          </h3>

          {/* Illustration Container */}
          {question.imageUrl ? (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 text-center max-h-60 flex items-center justify-center p-2">
              <img
                src={question.imageUrl}
                alt="Ilustrasi Soal"
                className="max-h-56 w-auto rounded-lg object-contain mx-auto"
              />
            </div>
          ) : question.imageCaption ? (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-center">
              <div className="text-3xl sm:text-4xl select-none mb-1">
                {question.imageCaption}
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Perhatikan petunjuk ilustrasi di atas
              </span>
            </div>
          ) : null}

          {/* Answer Options */}
          <div className="grid grid-cols-1 gap-2.5 pt-1">
            {question.options.map((optText, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOpt = question.correctIndex === idx;

              let btnStyle = 'bg-white border border-slate-200 text-slate-800 hover:border-blue-300 hover:bg-slate-50';

              if (isAnswerConfirmed) {
                if (isCorrectOpt) {
                  btnStyle = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-900 font-bold';
                } else if (isSelected && !isCorrectOpt) {
                  btnStyle = 'bg-rose-50 border-2 border-rose-400 text-rose-900 font-bold';
                } else {
                  btnStyle = 'bg-slate-50 border border-slate-200 text-slate-400 opacity-60';
                }
              }

              const letters = ['A', 'B', 'C', 'D'];

              return (
                <button
                  key={idx}
                  disabled={isAnswerConfirmed}
                  onClick={() => handleAnswerSelect(idx)}
                  className={`w-full p-3.5 sm:p-4 rounded-xl text-left flex items-center justify-between transition-all min-h-[50px] btn-press ${btnStyle}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${
                        isAnswerConfirmed && isCorrectOpt
                          ? 'bg-emerald-600 text-white'
                          : isAnswerConfirmed && isSelected
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {question.type === 'true_false' ? (idx === 0 ? '✓' : '✗') : letters[idx]}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold break-words">{optText}</span>
                  </div>

                  {isAnswerConfirmed && isCorrectOpt && (
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 ml-2" />
                  )}
                  {isAnswerConfirmed && isSelected && !isCorrectOpt && (
                    <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Callout */}
          {isAnswerConfirmed && (
            <div className="bg-blue-50/70 border-l-4 border-blue-600 p-4 rounded-r-xl space-y-1 animate-fade-in">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                <HelpCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Penjelasan Konsep:</span>
              </div>
              <p className="text-xs sm:text-sm text-blue-800/90 leading-relaxed">
                {question.explanation}
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Bottom Footer Control */}
      <footer className="w-full bg-white border-t border-slate-200/80 p-3.5 sm:p-4 sticky bottom-0 z-20">
        <div className="w-full max-w-2xl mx-auto flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400 font-medium hidden sm:block">
            {isAnswerConfirmed ? 'Tekan lanjut untuk soal berikutnya' : 'Pilih jawaban yang menurutmu benar'}
          </span>

          <button
            disabled={!isAnswerConfirmed}
            onClick={handleNext}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all min-h-[46px] btn-press ${
              isAnswerConfirmed
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <span>{isLastQuestion ? 'Selesai & Lihat Hasil' : 'Soal Berikutnya'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-pop border border-slate-200 text-center space-y-3">
            <h4 className="text-base font-bold text-slate-900">Keluar dari Kuis?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kuis yang sedang berlangsung akan dihentikan dan progres saat ini tidak akan disimpan.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 min-h-[42px]"
              >
                Lanjutkan Kuis
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 min-h-[42px]"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
