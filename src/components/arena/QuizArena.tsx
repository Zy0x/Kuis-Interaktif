import React, { useState, useEffect, useRef } from 'react';
import type { Quiz, QuizAttemptAnswer } from '../../types/quiz';
import { useBackHandler } from '../../lib/navigationHistory';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { 
  X, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  HelpCircle,
  Clock,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Eye,
  Users,
  Flame
} from 'lucide-react';

interface QuizArenaProps {
  quiz: Quiz;
  onFinishQuiz: (answers: QuizAttemptAnswer[], totalTimeSpent: number) => void;
  onExit: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  playClick: () => void;
  playCorrect: (streak?: number) => void;
  playWrong: () => void;
  playTick?: () => void;
  playReveal?: () => void;
  playApplause?: () => void;
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
  playTick,
  playReveal,
  playApplause,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState(false);
  const [answersList, setAnswersList] = useState<QuizAttemptAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(quiz.durationPerQuestionSec);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Kunci scroll body saat dialog konfirmasi keluar aktif
  useBodyScrollLock(showExitConfirm);
  
  // Smartboard / Teacher IFP Features
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [pollVotes, setPollVotes] = useState<{ [key: number]: number }>({ 0: 0, 1: 0, 2: 0, 3: 0 });

  // 1. Level 1 (Prioritas 100): Tutup Modal Polling IFP jika sedang terbuka
  useBackHandler('arena-poll-modal', 100, () => {
    if (isPollOpen) {
      setIsPollOpen(false);
      return true;
    }
    return false;
  }, isPollOpen);

  // 2. Level 1 (Prioritas 100): Batalkan Modal Konfirmasi Keluar jika sedang terbuka
  useBackHandler('arena-dismiss-exit-confirm', 100, () => {
    if (showExitConfirm) {
      setShowExitConfirm(false);
      return true;
    }
    return false;
  }, showExitConfirm);

  // 3. Level 1 Safety Guard (Prioritas 80): Mencegah soal hilang tiba-tiba dengan membuka dialog konfirmasi
  useBackHandler('arena-prompt-exit-confirm', 80, () => {
    if (!showExitConfirm && !isPollOpen) {
      setIsPaused(true);
      setShowExitConfirm(true);
      return true;
    }
    return false;
  }, true);

  const question = quiz.questions[currentIndex];
  const isLastQuestion = currentIndex === quiz.questions.length - 1;
  const timerRef = useRef<number | null>(null);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Timer effect
  useEffect(() => {
    if (isAnswerConfirmed || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAnswerSelect(-1);
          return 0;
        }
        if (prev <= 6 && prev > 1 && playTick) {
          playTick();
        }
        return prev - 1;
      });
      setTotalTimeSpent((t) => t + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswerConfirmed, isPaused, quiz.durationPerQuestionSec, playTick]);

  const handleAnswerSelect = (optionIndex: number) => {
    if (isAnswerConfirmed) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(optionIndex);
    setIsAnswerConfirmed(true);

    const isCorrect = optionIndex === question.correctIndex;
    if (isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      playCorrect(nextStreak);
      if (nextStreak >= 3 && playApplause) {
        playApplause();
      }
    } else {
      setStreak(0);
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

  const handleTeacherReveal = () => {
    if (isAnswerConfirmed) return;
    if (playReveal) playReveal();
    handleAnswerSelect(question.correctIndex);
  };

  const handleNext = () => {
    playClick();
    if (isLastQuestion) {
      onFinishQuiz(answersList, totalTimeSpent);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerConfirmed(false);
      setTimeLeft(quiz.durationPerQuestionSec);
      setIsPaused(false);
      setPollVotes({ 0: 0, 1: 0, 2: 0, 3: 0 });
    }
  };

  const handleVoteAdd = (e: React.MouseEvent, optIndex: number) => {
    e.stopPropagation();
    playClick();
    setPollVotes((prev) => ({
      ...prev,
      [optIndex]: (prev[optIndex] || 0) + 1,
    }));
  };

  const progressPercent = ((currentIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="w-full h-screen h-[100dvh] max-h-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col justify-between select-none">
      
      {/* Top Arena Header - Pinned at top */}
      <header className="w-full bg-white border-b border-slate-200/80 px-3 sm:px-6 py-2 sm:py-2.5 flex-shrink-0 z-20 shadow-sm">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2">
          
          {/* Left: Exit & Title */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              onClick={() => {
                playClick();
                setShowExitConfirm(true);
              }}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Keluar Kuis"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block whitespace-nowrap">
                Soal {currentIndex + 1} / {quiz.questions.length}
              </span>
              <h2 className="text-xs font-semibold text-slate-700 truncate max-w-[140px] sm:max-w-[220px]">
                {quiz.title}
              </h2>
            </div>
          </div>

          {/* Center: Timer & Streak Badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs sm:text-sm font-bold px-2.5 py-1 rounded-xl transition-colors ${
              isPaused 
                ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                : timeLeft <= 5 
                ? 'bg-rose-100 text-rose-700 font-extrabold animate-pulse' 
                : 'bg-slate-100 text-slate-700'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{isPaused ? 'Jeda' : `${timeLeft}s`}</span>
            </span>

            {streak >= 2 && (
              <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm animate-bounce">
                <Flame className="w-3.5 h-3.5 fill-white" />
                <span>{streak}x Kombo!</span>
              </span>
            )}
          </div>

          {/* Right: Smartboard Controls & Audio */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Teacher Pause/Play Button */}
            <button
              onClick={() => {
                playClick();
                setIsPaused(!isPaused);
              }}
              className={`p-2 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
                isPaused 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title={isPaused ? 'Lanjutkan Waktu' : 'Jeda Waktu untuk Menjelaskan'}
            >
              {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4" />}
            </button>

            {/* Voting Poll Toggle */}
            <button
              onClick={() => {
                playClick();
                setIsPollOpen(!isPollOpen);
              }}
              className={`p-2 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors hidden sm:flex ${
                isPollOpen 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Mode Polling / Voting Kelas"
            >
              <Users className="w-4 h-4" />
            </button>

            {/* Audio Toggle */}
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

            {/* Fullscreen Smartboard IFP Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh Smartboard (F11)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress Track */}
        <div className="w-full max-w-4xl mx-auto bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Quiz Arena Card - Locked to Viewport */}
      <main className="flex-1 min-h-0 w-full overflow-y-auto px-3 py-2 sm:px-6 sm:py-3 flex flex-col justify-center items-center">
        <div className="w-full max-w-2xl bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-card flex flex-col gap-3.5 my-auto animate-fade-in relative">
          
          {/* Paused Overlay Banner */}
          {isPaused && (
            <div className="absolute inset-x-4 top-3 z-30 p-2.5 rounded-2xl bg-amber-500 text-white text-center text-xs font-bold shadow-md flex items-center justify-center gap-2 animate-bounce">
              <Pause className="w-4 h-4" />
              <span>Waktu Dijeda: Guru Sedang Memberikan Penjelasan ke Kelas</span>
            </div>
          )}

          {/* Question Text */}
          <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 leading-snug break-words">
            {question.text}
          </h3>

          {/* Illustration Container */}
          {question.imageUrl ? (
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 text-center max-h-32 sm:max-h-40 flex items-center justify-center p-1.5 flex-shrink-0">
              <img
                src={question.imageUrl}
                alt="Ilustrasi Soal"
                className="max-h-28 sm:max-h-36 w-auto rounded-xl object-contain mx-auto"
              />
            </div>
          ) : question.imageCaption ? (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl py-2 px-4 text-center flex-shrink-0">
              <div className="text-3xl sm:text-4xl select-none">
                {question.imageCaption}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Perhatikan petunjuk ilustrasi di atas
              </span>
            </div>
          ) : null}

          {/* Answer Options: 2 Columns on Tablet/Desktop, 1 Column on Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
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
                  className={`w-full p-3 sm:p-3.5 rounded-2xl text-left flex items-center justify-between transition-all min-h-[48px] sm:min-h-[54px] btn-press ${btnStyle}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${
                        isAnswerConfirmed && isCorrectOpt
                          ? 'bg-emerald-600 text-white'
                          : isAnswerConfirmed && isSelected
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {question.type === 'true_false' ? (idx === 0 ? '✓' : '✗') : letters[idx]}
                    </span>
                    <span className="text-xs sm:text-sm font-bold break-words leading-tight">{optText}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Class Voting Pill if Poll Mode is Active */}
                    {isPollOpen && !isAnswerConfirmed && (
                      <span
                        onClick={(e) => handleVoteAdd(e, idx)}
                        className="px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        title="Tambah Suara Siswa"
                      >
                        <Users className="w-3 h-3" />
                        <span>{pollVotes[idx] || 0}</span>
                        <span className="text-[10px] text-purple-600">+1</span>
                      </span>
                    )}

                    {isAnswerConfirmed && isCorrectOpt && (
                      <CheckCircle className="w-5 h-5 text-emerald-600 ml-1.5" />
                    )}
                    {isAnswerConfirmed && isSelected && !isCorrectOpt && (
                      <XCircle className="w-5 h-5 text-rose-500 ml-1.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation Callout */}
          {isAnswerConfirmed && (
            <div className="bg-blue-50/90 border-l-4 border-blue-600 p-3 rounded-r-2xl space-y-1 animate-fade-in flex-shrink-0">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                <HelpCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Penjelasan Konsep Guru:</span>
              </div>
              <p className="text-xs text-blue-800/95 leading-relaxed">
                {question.explanation}
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Bottom Footer Control */}
      <footer className="w-full bg-white border-t border-slate-200/80 px-4 py-2.5 sm:py-3 flex-shrink-0 z-20 shadow-sm">
        <div className="w-full max-w-2xl mx-auto flex items-center justify-between gap-3">
          
          {/* Teacher Reveal Button (Smartboard superpower) */}
          {!isAnswerConfirmed ? (
            <button
              onClick={handleTeacherReveal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 min-h-[46px] transition-colors"
              title="Buka Kunci Jawaban untuk Pembahasan Bersama"
            >
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Buka Kunci Jawaban</span>
              <span className="sm:hidden">Kunci</span>
            </button>
          ) : (
            <span className="text-xs text-slate-500 font-medium hidden sm:block">
              Tekan lanjut untuk soal berikutnya
            </span>
          )}

          <button
            disabled={!isAnswerConfirmed}
            onClick={handleNext}
            className={`flex-1 sm:flex-initial sm:min-w-[200px] px-6 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all min-h-[46px] btn-press ${
              isAnswerConfirmed
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <span>{isLastQuestion ? 'Selesai & Rekap Nilai' : 'Soal Berikutnya'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 modal-wrapper overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-backdrop-fade touch-none"
            onClick={() => setShowExitConfirm(false)}
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
            aria-hidden="true"
          />

          <div 
            className="relative z-10 bg-white rounded-3xl p-6 max-w-sm w-full shadow-pop border border-slate-200 text-center space-y-3 animate-modal-card-in overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-base font-bold text-slate-900">Keluar dari Kuis?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kuis yang sedang berlangsung akan dihentikan dan progres saat ini tidak akan disimpan.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 min-h-[44px] transition-colors"
              >
                Lanjutkan Kuis
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 min-h-[44px] transition-colors"
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
