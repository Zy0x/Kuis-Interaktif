import React, { useState, useEffect, useRef } from 'react';
import type { Quiz, QuizAttemptAnswer } from '../../types/quiz';
import { useBackHandler } from '../../lib/navigationHistory';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { ThemeToggle } from '../common/ThemeToggle';
import { useQuizBgm } from '../../hooks/useQuizBgm';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Music,
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
  Flame,
  MoreVertical,
  Sun,
  Moon
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
  isDark?: boolean;
  onToggleTheme?: () => void;
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
  isDark = false,
  onToggleTheme = () => {},
}) => {
  const STORAGE_KEY = `kuis_arena_progress_${quiz.id}`;

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.currentIndex === 'number' && parsed.currentIndex < quiz.questions.length) {
          return parsed.currentIndex;
        }
      }
    } catch {}
    return 0;
  });

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState(false);
  const [answersList, setAnswersList] = useState<QuizAttemptAnswer[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.answersList)) return parsed.answersList;
      }
    } catch {}
    return [];
  });
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.timeLeft === 'number' && parsed.timeLeft > 0) return parsed.timeLeft;
      }
    } catch {}
    return quiz.durationPerQuestionSec;
  });
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.totalTimeSpent === 'number') return parsed.totalTimeSpent;
      }
    } catch {}
    return 0;
  });
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);

  // Kunci scroll body saat dialog konfirmasi keluar atau menu alat mobile aktif
  useBodyScrollLock(showExitConfirm || isMobileToolsOpen);
  
  // Smartboard / Teacher IFP Features
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streak, setStreak] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.streak === 'number') return parsed.streak;
      }
    } catch {}
    return 0;
  });
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [pollVotes, setPollVotes] = useState<{ [key: number]: number }>({ 0: 0, 1: 0, 2: 0, 3: 0 });

  // Simpan progres kuis saat ini ke sessionStorage agar aman dari reload tidak disengaja
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentIndex,
          answersList,
          timeLeft,
          totalTimeSpent,
          streak,
        })
      );
    } catch {}
  }, [currentIndex, answersList, timeLeft, totalTimeSpent, streak, STORAGE_KEY]);

  // Procedural BGM (In-Game Backsound)
  const {
    isBgmMuted,
    toggleBgmMute,
    startBgm,
    stopBgm,
    pauseBgm,
    resumeBgm,
    setDucked,
    setUrgent,
  } = useQuizBgm();

  // 1. Auto-start BGM on entry, auto-stop on unmount, and reset scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
    startBgm();
    return () => {
      stopBgm();
    };
  }, [startBgm, stopBgm]);

  // 2. Pause BGM when quiz is paused or exit dialog is open
  useEffect(() => {
    if (isPaused || showExitConfirm) {
      pauseBgm();
    } else if (!isAnswerConfirmed) {
      resumeBgm();
    }
  }, [isPaused, showExitConfirm, isAnswerConfirmed, pauseBgm, resumeBgm]);

  // 3. Accelerate tempo during last 5 seconds countdown
  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0 && !isAnswerConfirmed && !isPaused) {
      setUrgent(true);
    } else {
      setUrgent(false);
    }
  }, [timeLeft, isAnswerConfirmed, isPaused, setUrgent]);

  // 1. Level 1 (Prioritas 100): Tutup Modal Menu Alat Mobile jika sedang terbuka
  useBackHandler('arena-mobile-tools', 100, () => {
    if (isMobileToolsOpen) {
      setIsMobileToolsOpen(false);
      return true;
    }
    return false;
  }, isMobileToolsOpen);

  // 2. Level 1 (Prioritas 100): Tutup Modal Polling IFP jika sedang terbuka
  useBackHandler('arena-poll-modal', 100, () => {
    if (isPollOpen) {
      setIsPollOpen(false);
      return true;
    }
    return false;
  }, isPollOpen);

  // 3. Level 1 (Prioritas 100): Batalkan Modal Konfirmasi Keluar jika sedang terbuka
  useBackHandler('arena-dismiss-exit-confirm', 100, () => {
    if (showExitConfirm) {
      setShowExitConfirm(false);
      return true;
    }
    return false;
  }, showExitConfirm);

  // 4. Level 1 Safety Guard (Prioritas 80): Mencegah soal hilang tiba-tiba dengan membuka dialog konfirmasi
  useBackHandler('arena-prompt-exit-confirm', 80, () => {
    if (!showExitConfirm && !isPollOpen && !isMobileToolsOpen) {
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
    setDucked(true);

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
      stopBgm();
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
      onFinishQuiz(answersList, totalTimeSpent);
    } else {
      setDucked(false);
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
    <div className="fixed inset-0 z-30 w-full h-full h-[100dvh] overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between select-none">
      
      {/* Top Arena Header - Pinned at top with safe-area support */}
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-2 sm:px-6 pt-[max(env(safe-area-inset-top),0.625rem)] pb-2 sm:pb-2.5 flex-shrink-0 z-20 shadow-xs">
        <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
          
          {/* Left: Exit Button & Question Info */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink">
            <button
              onClick={() => {
                playClick();
                setShowExitConfirm(true);
              }}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Keluar Kuis"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="min-w-0 flex flex-col justify-center">
              <span className="text-[11px] sm:text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md inline-block whitespace-nowrap self-start">
                Soal {currentIndex + 1}/{quiz.questions.length}
              </span>
              <h2 className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[85px] xs:max-w-[130px] sm:max-w-[200px] md:max-w-[280px] hidden xs:block">
                {quiz.title}
              </h2>
            </div>
          </div>

          {/* Center: Timer & Streak Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <span className={`inline-flex items-center gap-1 text-xs sm:text-sm font-bold px-2.5 py-1 rounded-xl transition-colors ${
              isPaused 
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse'
                : timeLeft <= 5 
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold animate-pulse' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}>
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{isPaused ? 'Jeda' : `${timeLeft}s`}</span>
            </span>

            {streak >= 2 && (
              <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2 sm:px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm animate-bounce">
                <Flame className="w-3.5 h-3.5 fill-white flex-shrink-0" />
                <span className="hidden xs:inline">{streak}x Kombo!</span>
                <span className="xs:hidden">{streak}x</span>
              </span>
            )}
          </div>

          {/* Right: Pause & Desktop Full Toolbar / Mobile Tools Trigger */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Play/Pause Button (Always available for immediate teacher/student control) */}
            <button
              onClick={() => {
                playClick();
                setIsPaused(!isPaused);
              }}
              className={`p-2 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
                isPaused 
                  ? 'bg-amber-500 text-white shadow-sm' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={isPaused ? 'Lanjutkan Waktu' : 'Jeda Waktu untuk Menjelaskan'}
              aria-label={isPaused ? 'Lanjutkan Waktu' : 'Jeda Waktu'}
            >
              {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4" />}
            </button>

            {/* Mobile Tools Drawer Trigger (<sm) */}
            <button
              onClick={() => {
                playClick();
                setIsMobileToolsOpen(true);
              }}
              className="p-2 sm:hidden text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              title="Menu Pengaturan & Alat Kuis"
              aria-label="Menu Pengaturan & Alat Kuis"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Desktop / Tablet / Smartboard Full Toolbar (>=sm) */}
            <div className="hidden sm:flex items-center gap-1 sm:gap-1.5">
              {/* Theme Toggle Button */}
              <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

              {/* Voting Poll Toggle */}
              <button
                onClick={() => {
                  playClick();
                  setIsPollOpen(!isPollOpen);
                }}
                className={`p-2 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
                  isPollOpen 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Mode Polling / Voting Kelas"
                aria-label="Mode Polling / Voting Kelas"
              >
                <Users className="w-4 h-4" />
              </button>

              {/* SFX Audio Toggle */}
              <button
                onClick={() => {
                  playClick();
                  onToggleMute();
                }}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                aria-label={isMuted ? 'Nyalakan Efek Suara (SFX)' : 'Matikan Efek Suara (SFX)'}
                title={isMuted ? 'Nyalakan Efek Suara (SFX)' : 'Matikan Efek Suara (SFX)'}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-slate-700 dark:text-slate-300" />}
              </button>

              {/* In-Game Procedural BGM Music Toggle */}
              <button
                onClick={() => {
                  playClick();
                  toggleBgmMute();
                }}
                className={`p-2 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-all ${
                  isBgmMuted
                    ? 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 shadow-xs'
                }`}
                title={isBgmMuted ? 'Nyalakan Musik Latar (BGM)' : 'Matikan Musik Latar (BGM)'}
                aria-label={isBgmMuted ? 'Nyalakan Musik Latar' : 'Matikan Musik Latar'}
              >
                <div className="relative flex items-center justify-center">
                  <Music className="w-4 h-4" />
                  {isBgmMuted && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </div>
              </button>

              {/* Fullscreen Smartboard IFP Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh Smartboard (F11)'}
                aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh Smartboard'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Track */}
        <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto bg-slate-100 dark:bg-slate-800 h-1 sm:h-1.5 mt-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Quiz Arena Card - Locked to Viewport with Auto-centering & Smooth Top-to-Bottom Overflow */}
      <main className="flex-1 min-h-0 w-full overflow-y-auto px-3 py-2 sm:px-6 sm:py-4 flex flex-col items-center overscroll-contain">
        <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 md:p-8 2xl:p-10 border border-slate-200/90 dark:border-slate-800 shadow-card flex flex-col gap-3.5 sm:gap-5 xl:gap-6 my-auto animate-fade-in relative">
          
          {/* Paused Overlay Banner */}
          {isPaused && (
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white text-center text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 animate-bounce flex-shrink-0">
              <Pause className="w-4 h-4" />
              <span>Waktu Dijeda: Guru Sedang Memberikan Penjelasan ke Kelas</span>
            </div>
          )}

          {/* Question Text */}
          <h3 className="text-sm xs:text-base sm:text-lg md:text-xl xl:text-2xl 2xl:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug break-words">
            {question.text}
          </h3>

          {/* Illustration Container */}
          {question.imageUrl ? (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-center max-h-36 sm:max-h-52 xl:max-h-64 flex items-center justify-center p-2 flex-shrink-0">
              <img
                src={question.imageUrl}
                alt="Ilustrasi Soal"
                className="max-h-32 sm:max-h-48 xl:max-h-60 w-auto rounded-xl object-contain mx-auto"
              />
            </div>
          ) : question.imageCaption ? (
            <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-2xl py-2 px-4 sm:py-3 sm:px-6 text-center flex-shrink-0">
              <div className="text-3xl sm:text-4xl xl:text-5xl select-none">
                {question.imageCaption}
              </div>
              <span className="text-[11px] sm:text-xs xl:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Perhatikan petunjuk ilustrasi di atas
              </span>
            </div>
          ) : null}

          {/* Answer Options: 2 Columns on Tablet/Desktop/Smartboard, 1 Column on Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 xl:gap-4">
            {question.options.map((optText, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOpt = question.correctIndex === idx;

              let btnStyle = 'bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-blue-300 dark:hover:border-blue-500/60 hover:bg-slate-50 dark:hover:bg-slate-750';

              if (isAnswerConfirmed) {
                if (isCorrectOpt) {
                  btnStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 dark:border-emerald-400 text-emerald-900 dark:text-emerald-100 font-bold';
                } else if (isSelected && !isCorrectOpt) {
                  btnStyle = 'bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-500 text-rose-900 dark:text-rose-100 font-bold';
                } else {
                  btnStyle = 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-60';
                }
              }

              const letters = ['A', 'B', 'C', 'D'];

              return (
                <button
                  key={idx}
                  disabled={isAnswerConfirmed}
                  onClick={() => handleAnswerSelect(idx)}
                  className={`w-full p-3 sm:p-4 xl:p-5 rounded-2xl text-left flex items-center justify-between transition-all min-h-[48px] sm:min-h-[56px] xl:min-h-[64px] 2xl:min-h-[72px] btn-press ${btnStyle}`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <span
                      className={`w-8 h-8 sm:w-9 sm:h-9 xl:w-11 xl:h-11 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm xl:text-base flex-shrink-0 ${
                        isAnswerConfirmed && isCorrectOpt
                          ? 'bg-emerald-600 text-white'
                          : isAnswerConfirmed && isSelected
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {question.type === 'true_false' ? (idx === 0 ? '✓' : '✗') : letters[idx]}
                    </span>
                    <span className="text-xs sm:text-sm md:text-base xl:text-lg font-bold break-words leading-snug">{optText}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Class Voting Pill if Poll Mode is Active */}
                    {isPollOpen && !isAnswerConfirmed && (
                      <span
                        onClick={(e) => handleVoteAdd(e, idx)}
                        className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-300 font-bold text-xs sm:text-sm flex items-center gap-1 cursor-pointer transition-colors"
                        title="Tambah Suara Siswa"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{pollVotes[idx] || 0}</span>
                        <span className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400">+1</span>
                      </span>
                    )}

                    {isAnswerConfirmed && isCorrectOpt && (
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 ml-1.5" />
                    )}
                    {isAnswerConfirmed && isSelected && !isCorrectOpt && (
                      <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 dark:text-rose-400 ml-1.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation Callout */}
          {isAnswerConfirmed && (
            <div className="bg-blue-50/90 dark:bg-slate-800/90 border-l-4 border-blue-600 dark:border-blue-400 p-3 sm:p-4 xl:p-5 rounded-r-2xl space-y-1 sm:space-y-1.5 animate-fade-in flex-shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 text-blue-900 dark:text-blue-200 font-bold text-xs sm:text-sm xl:text-base">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>Penjelasan Konsep Guru:</span>
              </div>
              <p className="text-xs sm:text-sm xl:text-base text-blue-800/95 dark:text-blue-300 leading-relaxed">
                {question.explanation}
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Bottom Footer Control */}
      <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 pb-[max(env(safe-area-inset-bottom),0.625rem)] flex-shrink-0 z-20 shadow-sm">
        <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto flex items-center justify-between gap-3">
          
          {/* Teacher Reveal Button (Smartboard superpower) */}
          {!isAnswerConfirmed ? (
            <button
              onClick={handleTeacherReveal}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[46px] sm:min-h-[50px] transition-colors"
              title="Buka Kunci Jawaban untuk Pembahasan Bersama"
            >
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Buka Kunci Jawaban</span>
              <span className="sm:hidden">Kunci</span>
            </button>
          ) : (
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Tekan lanjut untuk soal berikutnya
            </span>
          )}

          <button
            disabled={!isAnswerConfirmed}
            onClick={handleNext}
            className={`flex-1 sm:flex-initial sm:min-w-[200px] xl:min-w-[240px] px-6 py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm xl:text-base flex items-center justify-center gap-2 transition-all min-h-[46px] sm:min-h-[50px] btn-press ${
              isAnswerConfirmed
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>{isLastQuestion ? 'Selesai & Rekap Nilai' : 'Soal Berikutnya'}</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </footer>

      {/* Mobile Tools Sheet Modal */}
      {isMobileToolsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-wrapper overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-backdrop-fade touch-none"
            onClick={() => setIsMobileToolsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative z-10 w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-modal-card-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Alat & Pengaturan Kuis</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Sesuaikan tampilan & audio kuis</p>
              </div>
              <button
                onClick={() => {
                  playClick();
                  setIsMobileToolsOpen(false);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Tutup Menu Alat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {/* Toggle Tema */}
              <button
                onClick={() => {
                  if (playClick) playClick();
                  onToggleTheme();
                }}
                className="w-full p-3 rounded-2xl flex items-center justify-between bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 min-h-[50px] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-amber-300">
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Tema Tampilan</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{isDark ? 'Mode Gelap (Malam)' : 'Mode Terang (Siang)'}</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200">
                  {isDark ? 'Gelap' : 'Terang'}
                </span>
              </button>

              {/* Toggle SFX */}
              <button
                onClick={() => {
                  playClick();
                  onToggleMute();
                }}
                className="w-full p-3 rounded-2xl flex items-center justify-between bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 min-h-[50px] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isMuted ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-500' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'}`}>
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Efek Suara (SFX)</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{isMuted ? 'Suara efek dimatikan' : 'Suara efek jawaban aktif'}</span>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${isMuted ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 border-rose-200 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border-emerald-200 dark:border-emerald-800'}`}>
                  {isMuted ? 'Senyap' : 'Aktif'}
                </span>
              </button>

              {/* Toggle BGM */}
              <button
                onClick={() => {
                  playClick();
                  toggleBgmMute();
                }}
                className="w-full p-3 rounded-2xl flex items-center justify-between bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 min-h-[50px] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isBgmMuted ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'}`}>
                    <Music className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Musik Latar (BGM)</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{isBgmMuted ? 'Musik latar hening' : 'Musik prosedural kuis'}</span>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${isBgmMuted ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700' : 'bg-blue-50 dark:bg-blue-950 text-blue-600 border-blue-200 dark:border-blue-800'}`}>
                  {isBgmMuted ? 'Hening' : 'Putar'}
                </span>
              </button>

              {/* Toggle Fullscreen */}
              <button
                onClick={() => {
                  toggleFullscreen();
                  setIsMobileToolsOpen(false);
                }}
                className="w-full p-3 rounded-2xl flex items-center justify-between bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 min-h-[50px] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600">
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Layar Penuh (Fullscreen)</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{isFullscreen ? 'Keluar mode fullscreen' : 'Maksimalkan tampilan layar'}</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200">
                  {isFullscreen ? 'Layar Penuh' : 'Standar'}
                </span>
              </button>

              {/* Toggle Polling */}
              <button
                onClick={() => {
                  playClick();
                  setIsPollOpen(!isPollOpen);
                  setIsMobileToolsOpen(false);
                }}
                className="w-full p-3 rounded-2xl flex items-center justify-between bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 min-h-[50px] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isPollOpen ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Mode Polling / Voting Kelas</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Catat jumlah angkat tangan siswa</span>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${isPollOpen ? 'bg-purple-50 dark:bg-purple-950 text-purple-600 border-purple-200 dark:border-purple-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                  {isPollOpen ? 'Aktif' : 'Nonaktif'}
                </span>
              </button>
            </div>

            <button
              onClick={() => {
                playClick();
                setIsMobileToolsOpen(false);
              }}
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[44px] transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 modal-wrapper overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-backdrop-fade touch-none"
            onClick={() => setShowExitConfirm(false)}
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
            aria-hidden="true"
          />

          <div 
            className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-pop border border-slate-200 dark:border-slate-800 text-center space-y-3 animate-modal-card-in overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Keluar dari Kuis?</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Kuis yang sedang berlangsung akan dihentikan dan progres saat ini tidak akan disimpan.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[44px] transition-colors"
              >
                Lanjutkan Kuis
              </button>
              <button
                onClick={() => {
                  stopBgm();
                  try {
                    sessionStorage.removeItem(STORAGE_KEY);
                  } catch {}
                  onExit();
                }}
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
