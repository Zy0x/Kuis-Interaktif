import React, { useState, useEffect, useRef } from 'react';
import type { Quiz, QuizAttemptAnswer } from '../../types/quiz';
import { 
  X, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  HelpCircle
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
  const timerPercent = (timeLeft / quiz.durationPerQuestionSec) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between select-none">
      
      {/* Top Header - Mobile-S (320px) Safe */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          {/* Exit Button */}
          <button
            onClick={() => {
              playClick();
              setShowExitConfirm(true);
            }}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
            aria-label="Keluar Kuis"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title & Question Counter */}
          <div className="text-center flex-1 min-w-0 px-1">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 sm:px-2.5 py-0.5 rounded-full inline-block">
              Soal {currentIndex + 1} dari {quiz.questions.length}
            </span>
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-700 truncate mt-0.5 max-w-[140px] xs:max-w-[200px] sm:max-w-md mx-auto">
              {quiz.title}
            </h2>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              playClick();
              onToggleMute();
            }}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
            aria-label="Toggle Suara"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-emerald-600" />}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 mt-1.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Arena Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-3 sm:p-6 flex flex-col justify-center space-y-3 sm:space-y-4">
        
        {/* Timer Bar */}
        <div className="flex items-center justify-between gap-2 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg">⏱️</span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-600">Sisa Waktu:</span>
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-[120px] xs:max-w-[150px]">
            <div className="w-full bg-slate-100 h-2 sm:h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  timeLeft <= 5 ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
                }`}
                style={{ width: `${timerPercent}%` }}
              />
            </div>
            <span
              className={`text-xs font-black w-6 text-right ${
                timeLeft <= 5 ? 'text-rose-600 font-extrabold' : 'text-slate-700'
              }`}
            >
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl p-4 sm:p-7 border-2 border-slate-200/80 shadow-playful space-y-3 sm:space-y-4 animate-pop-in">
          
          {/* Question Text */}
          <h3 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
            {question.text}
          </h3>

          {/* Image Illustration Box if available */}
          {question.imageUrl ? (
            <div className="rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-50 text-center max-h-52 flex items-center justify-center p-2">
              <img
                src={question.imageUrl}
                alt="Ilustrasi Soal"
                className="max-h-48 w-auto rounded-xl object-contain mx-auto"
              />
            </div>
          ) : question.imageCaption ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200/80 rounded-2xl p-3.5 sm:p-6 text-center shadow-inner">
              <div className="text-3xl sm:text-5xl select-none tracking-widest mb-1.5 animate-bounce-soft">
                {question.imageCaption}
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-amber-800/80">
                Perhatikan gambar ilustrasi di atas dengan teliti
              </span>
            </div>
          ) : null}

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-2 sm:gap-2.5 pt-1">
            {question.options.map((optText, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOpt = question.correctIndex === idx;

              let btnClass = 'bg-white border-2 border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/40';

              if (isAnswerConfirmed) {
                if (isCorrectOpt) {
                  btnClass = 'bg-emerald-500 text-white border-2 border-emerald-600 shadow-md font-black';
                } else if (isSelected && !isCorrectOpt) {
                  btnClass = 'bg-rose-500 text-white border-2 border-rose-600 shadow-md font-black animate-wiggle';
                } else {
                  btnClass = 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60';
                }
              }

              const letters = ['A', 'B', 'C', 'D'];

              return (
                <button
                  key={idx}
                  disabled={isAnswerConfirmed}
                  onClick={() => handleAnswerSelect(idx)}
                  className={`w-full p-3 sm:p-4 rounded-2xl text-left flex items-center justify-between transition-all min-h-[48px] sm:min-h-[52px] btn-playful ${btnClass}`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm flex-shrink-0 ${
                        isAnswerConfirmed && (isCorrectOpt || isSelected)
                          ? 'bg-white/30 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {question.type === 'true_false' ? (idx === 0 ? '✓' : '✗') : letters[idx]}
                    </span>
                    <span className="text-xs sm:text-base font-bold truncate sm:whitespace-normal">{optText}</span>
                  </div>

                  {isAnswerConfirmed && isCorrectOpt && (
                    <CheckCircle className="w-5 h-5 text-white flex-shrink-0 ml-1.5" />
                  )}
                  {isAnswerConfirmed && isSelected && !isCorrectOpt && (
                    <XCircle className="w-5 h-5 text-white flex-shrink-0 ml-1.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {isAnswerConfirmed && (
            <div className="bg-blue-50 border border-blue-200 p-3 sm:p-4 rounded-2xl space-y-1 animate-pop-in">
              <div className="flex items-center gap-1.5 text-blue-900 font-extrabold text-xs">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>Pembahasan Singkat:</span>
              </div>
              <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                {question.explanation}
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Bottom Floating Control Bar */}
      <footer className="bg-white border-t border-slate-200 p-3 sm:p-4 sticky bottom-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-500 hidden sm:block">
            {isAnswerConfirmed ? 'Ketuk lanjut untuk soal berikutnya' : 'Pilih salah satu jawaban di atas'}
          </div>

          <button
            disabled={!isAnswerConfirmed}
            onClick={handleNext}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all min-h-[48px] btn-playful ${
              isAnswerConfirmed
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-playful'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>{isLastQuestion ? 'Lihat Hasil Kuis' : 'Soal Berikutnya'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-pop-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border-4 border-amber-200 text-center space-y-3 sm:space-y-4">
            <div className="text-4xl sm:text-5xl select-none">⚠️</div>
            <h4 className="text-base sm:text-lg font-black text-slate-900">Yakin Mau Keluar?</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Kuis yang sedang berlangsung akan berhenti dan nilaimu belum tersimpan ke papan peringkat.
            </p>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 min-h-[44px]"
              >
                Lanjut Main
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white bg-rose-600 hover:bg-rose-500 shadow-md min-h-[44px]"
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
