import React, { useState, useEffect, useRef } from 'react';
import type { 
  Quiz, 
  QuizAttemptAnswer, 
  QuizQuestion, 
  GameMode,
  AnswerVisibilityMode, 
  ExplanationVisibilityMode,
  QuizSessionSettings,
  QuizSession
} from '../../types/quiz';
import { InterQuestionWaitingLounge } from './InterQuestionWaitingLounge';
import { useBackHandler } from '../../lib/navigationHistory';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { ThemeToggle } from '../common/ThemeToggle';
import { useQuizBgm } from '../../hooks/useQuizBgm';
import { DataManager } from '../../lib/supabaseClient';
import { useDrawerSwipeDown } from '../../hooks/useDrawerSwipeDown';
import { DrawerHandle } from '../common/DrawerHandle';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Music,
  Check,
  CheckCircle, 
  XCircle, 
  ArrowRight,
  ArrowLeft, 
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
  Moon,
  RotateCcw,
  Send,
  Lightbulb,
  Puzzle,
  Star,
  Edit3,
  ShieldAlert
} from 'lucide-react';
import { QuizIllustration } from '../shared/QuizIllustration';

export interface QuizArenaProps {
  quiz: Quiz;
  initialMode?: GameMode;
  sessionSettings?: QuizSessionSettings;
  activeSessionId?: string;
  isTeacher?: boolean;
  onFinishQuiz: (answers: QuizAttemptAnswer[], totalTimeSpent: number) => void;
  onExit: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  playClick?: () => void;
  playCorrect?: (streak?: number) => void;
  playWrong?: () => void;
  playTick?: () => void;
  playReveal?: () => void;
  playApplause?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  isPreview?: boolean;
  initialQuestionIndex?: number;
  onEditQuestion?: (question: QuizQuestion) => void;
}

export const QuizArena: React.FC<QuizArenaProps> = ({
  quiz,
  initialMode,
  sessionSettings,
  activeSessionId,
  isTeacher = false,
  onFinishQuiz,
  onExit,
  isMuted = false,
  onToggleMute = () => {},
  playClick = () => {},
  playCorrect = () => {},
  playWrong = () => {},
  playTick = () => {},
  playReveal = () => {},
  playApplause = () => {},
  isDark = false,
  onToggleTheme = () => {},
  isPreview = false,
  initialQuestionIndex = 0,
  onEditQuestion,
}) => {
  const STORAGE_KEY = `kuis_arena_progress_${quiz.id}`;

  const defaultSettingsFallback: QuizSessionSettings = {
    mode: quiz.defaultGameMode || 'standard',
    durationPerQuestionSec: quiz.durationPerQuestionSec || 30,
    shuffleQuestions: quiz.shuffleQuestions ?? true,
    shuffleOptions: quiz.shuffleOptions ?? true,
    presentationTarget: 'student-lobby',
    showAnswersMode: 'immediate',
    showExplanationMode: 'immediate',
    showLeaderboardToStudents: true,
    maxAttempts: 0,
    tabSwitchDetection: false,
  };

  const [liveSession, setLiveSession] = useState<QuizSession | null>(() => {
    if (activeSessionId) return DataManager.getActiveSessionById(activeSessionId);
    if (quiz.pinCode) return DataManager.getActiveSessionByPin(quiz.pinCode);
    return DataManager.getActiveSessionByQuizId(quiz.id);
  });

  // Read active session settings with real-time reactive sync
  const [currentSettings, setCurrentSettings] = useState<QuizSessionSettings>(() => {
    const initialSession = activeSessionId
      ? DataManager.getActiveSessionById(activeSessionId)
      : (quiz.pinCode ? DataManager.getActiveSessionByPin(quiz.pinCode) : DataManager.getActiveSessionByQuizId(quiz.id));
    return {
      ...defaultSettingsFallback,
      ...(quiz.defaultSettings || {}),
      ...(sessionSettings || {}),
      ...(initialSession?.settings || {}),
    };
  });
  const [showWaitingLounge, setShowWaitingLounge] = useState(false);

  useEffect(() => {
    if (sessionSettings) {
      setCurrentSettings((prev) => ({
        ...prev,
        ...sessionSettings,
      }));
    }
  }, [sessionSettings]);

  useEffect(() => {
    if (liveSession?.settings) {
      setCurrentSettings((prev) => ({
        ...prev,
        ...liveSession.settings,
      }));
    }
  }, [liveSession?.settings]);

  const activeSettings = currentSettings;
  const showAnswersMode: AnswerVisibilityMode = activeSettings.showAnswersMode || 'immediate';
  const showExplanationMode: ExplanationVisibilityMode = activeSettings.showExplanationMode || 'immediate';
  const showLeaderboardToStudents = activeSettings.showLeaderboardToStudents ?? true;
  const isTabSwitchDetectionEnabled = Boolean(activeSettings.tabSwitchDetection);
  const defaultDurationSec = activeSettings.durationPerQuestionSec || quiz.durationPerQuestionSec || 30;
  const getQuestionDuration = (q: QuizQuestion | undefined): number => {
    if (!q) return defaultDurationSec;
    if (!activeSettings.overrideCustomQuestionDurations && typeof q.customDurationSec === 'number' && q.customDurationSec > 0) {
      return q.customDurationSec;
    }
    return defaultDurationSec;
  };

  // Keamanan Ketat: Tombol reveal jawaban HANYA boleh diakses Guru pada pratinjau studio atau presentasi Smartboard IFP.
  // SISWA TIDAK PERNAH DIBERIKAN TOMBOL INI PADA MODE APAPUN!
  const canTeacherReveal = Boolean(
    (isTeacher || isPreview) && (isPreview || activeSettings.presentationTarget === 'smartboard')
  );

  // Tab switch / anti-cheat violation tracking
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState<boolean>(false);

  const gameMode: GameMode = initialMode || activeSettings.mode || quiz.defaultGameMode || 'standard';
  const [hearts, setHearts] = useState<number>(3);
  const [isGameOver, setIsGameOver] = useState(false);

  // Anti-cheat tab switch listener
  useEffect(() => {
    if (isPreview || !isTabSwitchDetectionEnabled || isGameOver) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((c) => {
          const nextCount = c + 1;
          const targetSessionId = activeSessionId || liveSession?.id;
          if (targetSessionId) {
            const profile = DataManager.getPlayerProfile();
            DataManager.addOrUpdateSessionParticipant(targetSessionId, {
              name: profile.nickname || 'Siswa',
              avatarId: profile.avatarId || 'lion',
              tabSwitchCount: nextCount,
            }).catch(() => {});
          }
          return nextCount;
        });
        setShowTabSwitchWarning(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPreview, isTabSwitchDetectionEnabled, isGameOver, activeSessionId, liveSession?.id]);

  // Active Questions (support shuffleQuestions & shuffleOptions - disabled in preview mode)
  const [activeQuestions] = useState<QuizQuestion[]>(() => {
    const shouldShuffleQuestions = !isPreview && (activeSettings.shuffleQuestions ?? quiz.shuffleQuestions);
    const shouldShuffleOptions = !isPreview && (activeSettings.shuffleOptions ?? quiz.shuffleOptions);

    let list = quiz.questions;
    if (shouldShuffleQuestions) {
      const arr = [...list];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      list = arr;
    }

    if (shouldShuffleOptions) {
      list = list.map((q) => {
        if (q.type === 'multiple_choice' && q.options && q.options.length > 1) {
          const paired = q.options.map((opt, i) => ({ opt, isCorrect: i === q.correctIndex }));
          for (let i = paired.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [paired[i], paired[j]] = [paired[j], paired[i]];
          }
          const newOptions = paired.map((p) => p.opt);
          const newCorrectIndex = paired.findIndex((p) => p.isCorrect);
          return {
            ...q,
            options: newOptions,
            correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : q.correctIndex,
          };
        }
        return q;
      });
    }

    return list;
  });

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (typeof initialQuestionIndex === 'number' && initialQuestionIndex >= 0 && initialQuestionIndex < quiz.questions.length) {
      return initialQuestionIndex;
    }
    if (!isPreview) {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.currentIndex === 'number' && parsed.currentIndex < quiz.questions.length) {
            return parsed.currentIndex;
          }
        }
      } catch {}
    }
    return 0;
  });

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState(false);
  const [answersList, setAnswersList] = useState<QuizAttemptAnswer[]>(() => {
    if (!isPreview) {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.answersList)) return parsed.answersList;
        }
      } catch {}
    }
    return [];
  });
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const targetIdx = typeof initialQuestionIndex === 'number' && initialQuestionIndex >= 0 && initialQuestionIndex < quiz.questions.length
      ? initialQuestionIndex
      : 0;
    if (!isPreview) {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.timeLeft === 'number' && parsed.timeLeft > 0) return parsed.timeLeft;
        }
      } catch {}
    }
    return getQuestionDuration(activeQuestions[targetIdx]);
  });
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(() => {
    if (!isPreview) {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.totalTimeSpent === 'number') return parsed.totalTimeSpent;
        }
      } catch {}
    }
    return 0;
  });
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);

  const { 
    handleRef: mobileToolsHandleRef, 
    drawerStyle: mobileToolsDrawerStyle, 
    backdropStyle: mobileToolsBackdropStyle 
  } = useDrawerSwipeDown({
    onClose: () => {
      if (playClick) playClick();
      setIsMobileToolsOpen(false);
    },
    enabled: isMobileToolsOpen,
  });

  // Question Types States
  // 1. Short Answer state
  const [shortAnswerInput, setShortAnswerInput] = useState('');
  const [showFirstLetterHint, setShowFirstLetterHint] = useState(false);

  // 2. Mystery Image Reveal state (3x3 grid)
  const [revealedTiles, setRevealedTiles] = useState<Set<number>>(new Set());
  const [mysteryImgError, setMysteryImgError] = useState(false);

  useEffect(() => {
    setMysteryImgError(false);
  }, [currentIndex]);

  // 3. Matching Pairs state
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const matchedPairsRef = useRef<Set<number>>(matchedPairs);
  useEffect(() => {
    matchedPairsRef.current = matchedPairs;
  }, [matchedPairs]);
  const [wrongPairAttempt, setWrongPairAttempt] = useState<{ left: number; right: number } | null>(null);
  const [shuffledRightItems, setShuffledRightItems] = useState<{ originalIndex: number; text: string; isDistractor?: boolean }[]>([]);

  // Kunci scroll body saat dialog konfirmasi keluar, peringatan ganti tab, atau menu alat mobile aktif
  useBodyScrollLock(showExitConfirm || isMobileToolsOpen || isGameOver || showTabSwitchWarning);
  
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

  // Simpan progres kuis saat ini ke sessionStorage agar aman dari reload tidak disengaja (hanya jika bukan mode pratinjau)
  useEffect(() => {
    if (isPreview) return;
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
  }, [currentIndex, answersList, timeLeft, totalTimeSpent, streak, STORAGE_KEY, isPreview]);

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
    if (isPaused || showExitConfirm || isGameOver) {
      pauseBgm();
    } else if (!isAnswerConfirmed) {
      resumeBgm();
    }
  }, [isPaused, showExitConfirm, isGameOver, isAnswerConfirmed, pauseBgm, resumeBgm]);

  // 3. Accelerate tempo during last 5 seconds countdown (only in timed modes)
  useEffect(() => {
    if (gameMode !== 'untimed' && timeLeft <= 5 && timeLeft > 0 && !isAnswerConfirmed && !isPaused && !isGameOver) {
      setUrgent(true);
    } else {
      setUrgent(false);
    }
  }, [timeLeft, isAnswerConfirmed, isPaused, isGameOver, gameMode, setUrgent]);

  // Back Handlers
  useBackHandler('arena-mobile-tools', 100, () => {
    if (isMobileToolsOpen) {
      setIsMobileToolsOpen(false);
      return true;
    }
    return false;
  }, isMobileToolsOpen);

  useBackHandler('arena-poll-modal', 100, () => {
    if (isPollOpen) {
      setIsPollOpen(false);
      return true;
    }
    return false;
  }, isPollOpen);

  useBackHandler('arena-dismiss-exit-confirm', 100, () => {
    if (showExitConfirm) {
      setShowExitConfirm(false);
      return true;
    }
    return false;
  }, showExitConfirm);

  useBackHandler('arena-prompt-exit-confirm', 80, () => {
    if (!showExitConfirm && !isPollOpen && !isMobileToolsOpen && !isGameOver) {
      if (isPreview) {
        onExit();
        return true;
      }
      setIsPaused(true);
      setShowExitConfirm(true);
      return true;
    }
    return false;
  }, true);

  const question = activeQuestions[currentIndex] || activeQuestions[0];
  const isLastQuestion = currentIndex === activeQuestions.length - 1;
  const timerRef = useRef<number | null>(null);

  // Initialize right column shuffle for matching pairs (termasuk kartu pengecoh opsional)
  useEffect(() => {
    if (question?.type === 'matching_pairs' && question.matchingPairs && question.matchingPairs.length > 0) {
      const rights: { originalIndex: number; text: string; isDistractor?: boolean }[] = question.matchingPairs.map((p, idx) => ({
        originalIndex: idx,
        text: p.right,
        isDistractor: false,
      }));

      // Sisipkan kartu pengecoh sisi kanan jika ada
      if (question.distractors && question.distractors.length > 0) {
        question.distractors.forEach((d, dIdx) => {
          if (d && d.trim()) {
            rights.push({
              originalIndex: -100 - dIdx,
              text: d.trim(),
              isDistractor: true,
            });
          }
        });
      }

      for (let i = rights.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rights[i], rights[j]] = [rights[j], rights[i]];
      }
      setShuffledRightItems(rights);
    }
  }, [currentIndex, question]);

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
    if (isAnswerConfirmed || isPaused || isGameOver) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTotalTimeSpent((t) => t + 1);

      if (gameMode === 'untimed' || (activeSettings.executionMode === 'teacher_led' && activeSettings.teacherPacingSubMode === 'manual')) {
        return; // Untimed mode or teacher-led manual pacing does not count down
      }

      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAnswerSelect(-1, undefined, false);
          return 0;
        }
        if (prev <= 6 && prev > 1 && playTick) {
          playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswerConfirmed, isPaused, isGameOver, gameMode, defaultDurationSec, playTick, activeSettings.executionMode, activeSettings.teacherPacingSubMode]);

  const normalizeAnswer = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
      .replace(/\s+/g, ' ');
  };

  const getFirstLetterHint = (q: QuizQuestion) => {
    const primary = q.acceptableAnswers?.[0] || q.options?.[q.correctIndex] || q.options?.[0] || '';
    if (!primary.trim()) return '';
    const clean = primary.trim();
    const firstChar = clean[0].toUpperCase();
    const rest = clean.slice(1).replace(/[a-zA-Z0-9]/g, '_ ');
    return `${firstChar} ${rest}`.trim();
  };

  const handleAnswerSelect = (
    optionIndex: number,
    textAns?: string,
    explicitIsCorrect?: boolean,
    customPoints?: number,
    customMatchedCount?: number,
    customTotalPairs?: number
  ) => {
    if (isAnswerConfirmed) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(optionIndex);
    setIsAnswerConfirmed(true);
    setDucked(true);

    // If image_guess, reveal all 9 tiles
    setRevealedTiles(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]));

    let isCorrect = false;
    let earnedPoints: number | undefined = undefined;
    let finalMatchedCount: number | undefined = undefined;
    let finalTotalPairs: number | undefined = undefined;

    if (question.type === 'matching_pairs') {
      const totalPairs = question.matchingPairs?.length || 0;
      finalTotalPairs = customTotalPairs !== undefined ? customTotalPairs : totalPairs;
      finalMatchedCount = customMatchedCount !== undefined ? customMatchedCount : matchedPairsRef.current.size;
      const qPoints = question.points || 10;

      if (finalTotalPairs > 0 && finalMatchedCount >= finalTotalPairs) {
        isCorrect = true;
        earnedPoints = qPoints;
      } else if (finalTotalPairs > 0 && finalMatchedCount > 0) {
        // Sebagian Benar: berikan skor proporsional adil
        isCorrect = false;
        earnedPoints = Math.round((finalMatchedCount / finalTotalPairs) * qPoints);
      } else {
        isCorrect = false;
        earnedPoints = 0;
      }
    } else if (explicitIsCorrect !== undefined) {
      isCorrect = explicitIsCorrect;
      earnedPoints = isCorrect ? (customPoints !== undefined ? customPoints : (question.points || 10)) : 0;
    } else if (question.type === 'short_answer') {
      const clean = normalizeAnswer(textAns || shortAnswerInput);
      const acceptable = (question.acceptableAnswers || []).map(normalizeAnswer);
      const optMatch = question.options[question.correctIndex] ? normalizeAnswer(question.options[question.correctIndex]) : '';
      isCorrect = (Boolean(optMatch) && clean === optMatch) || acceptable.includes(clean);
      earnedPoints = isCorrect ? (question.points || 10) : 0;
    } else {
      isCorrect = optionIndex === question.correctIndex;
      earnedPoints = isCorrect ? (question.points || 10) : 0;
    }

    if (showAnswersMode === 'exam_strict') {
      // Pada mode ujian ketat, jangan bocorkan status benar/salah via audio atau combo
      playClick();
    } else {
      if (isCorrect) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        playCorrect(nextStreak);
        if (nextStreak >= 3 && playApplause) {
          playApplause();
        }
      } else if (question.type === 'matching_pairs' && (earnedPoints || 0) > 0) {
        // Apresiasi pencapaian sebagian pasangan yang benar
        playCorrect();
      } else {
        setStreak(0);
        playWrong();
        if (gameMode === 'survival_3hearts') {
          setHearts((h) => {
            const next = Math.max(0, h - 1);
            if (next === 0) {
              setIsGameOver(true);
            }
            return next;
          });
        }
      }
    }

    const currentDuration = getQuestionDuration(question);
    const timeSpent = gameMode === 'untimed' ? 5 : (currentDuration - timeLeft);
    const recordedAnswer: QuizAttemptAnswer = {
      questionId: question.id,
      selectedIndex: optionIndex,
      textAnswer: textAns || (question.type === 'short_answer' ? shortAnswerInput.trim() : undefined),
      isCorrect,
      timeSpentSec: Math.max(1, timeSpent),
      earnedPoints,
      matchedCount: finalMatchedCount,
      totalPairs: finalTotalPairs,
    };

    setAnswersList((prev) => {
      const updated = [...prev, recordedAnswer];
      if (activeSessionId) {
        try {
          const profile = DataManager.getPlayerProfile();
          const correctCount = updated.filter((a) => a.isCorrect).length;
          const incorrectCount = updated.length - correctCount;
          const score = Math.round((correctCount / activeQuestions.length) * 100);
          const stars = score >= 85 ? 3 : score >= 60 ? 2 : score > 0 ? 1 : 0;
          const answersMap: Record<string, any> = {};
          updated.forEach((ans, idx) => {
            answersMap[ans.questionId || `q_${idx}`] = {
              questionId: ans.questionId || `q_${idx}`,
              questionIndex: idx,
              selectedOption: ans.selectedIndex ?? -1,
              textAnswer: ans.textAnswer,
              isCorrect: ans.isCorrect,
              timeSpentSec: ans.timeSpentSec,
              pointsEarned: ans.earnedPoints,
            };
          });

          DataManager.addOrUpdateSessionParticipant(activeSessionId, {
            name: profile.nickname || 'Siswa',
            avatarId: profile.avatarId || 'lion',
            currentQuestionIndex: currentIndex + 1,
            totalQuestions: activeQuestions.length,
            score,
            stars,
            correctCount,
            incorrectCount,
            streak: isCorrect ? streak + 1 : 0,
            finished: isLastQuestion,
            timeSpentSec: totalTimeSpent + Math.max(1, timeSpent),
            answers: answersMap,
            tabSwitchCount,
          });
        } catch (err) {
          console.warn('Session participant sync error:', err);
        }
      }

      return updated;
    });

    if (activeSettings.executionMode === 'teacher_led' && !isTeacher && !isLastQuestion) {
      setTimeout(() => {
        setShowWaitingLounge(true);
      }, 700);
    }
  };

  const handleTeacherReveal = () => {
    // Keamanan tingkat tinggi: tolak eksekusi jika bukan guru terverifikasi
    if (!canTeacherReveal || isAnswerConfirmed) return;
    if (playReveal) playReveal();
    if (question.type === 'short_answer') {
      const primaryAns = question.acceptableAnswers?.[0] || question.options[question.correctIndex] || 'Jawaban Tepat';
      setShortAnswerInput(primaryAns);
      handleAnswerSelect(0, primaryAns, true);
    } else if (question.type === 'matching_pairs') {
      const totalPairs = question.matchingPairs?.length || 0;
      if (question.matchingPairs) {
        setMatchedPairs(new Set(question.matchingPairs.map((_, i) => i)));
      }
      handleAnswerSelect(0, 'Semua Pasangan Cocok', true, question.points || 10, totalPairs, totalPairs);
    } else {
      handleAnswerSelect(question.correctIndex);
    }
  };

  const handleRetryQuiz = () => {
    playClick();
    setIsGameOver(false);
    setHearts(3);
    setCurrentIndex(0);
    setAnswersList([]);
    const firstDuration = getQuestionDuration(activeQuestions[0]);
    setTimeLeft(firstDuration);
    setTotalTimeSpent(0);
    setStreak(0);
    setSelectedOption(null);
    setIsAnswerConfirmed(false);
    setShortAnswerInput('');
    setShowFirstLetterHint(false);
    setRevealedTiles(new Set());
    setSelectedLeft(null);
    setMatchedPairs(new Set());
    setWrongPairAttempt(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const handleNext = () => {
    playClick();

    // In teacher-led mode, advance the session in real time so all students advance together!
    const targetSessionId = activeSessionId || liveSession?.id;
    if (isTeacher && activeSettings.executionMode === 'teacher_led' && targetSessionId) {
      if (isLastQuestion) {
        DataManager.updateSessionStatus(targetSessionId, 'finished');
      } else {
        DataManager.advanceSessionQuestion(targetSessionId, currentIndex + 1);
      }
    }

    if (isLastQuestion) {
      stopBgm();
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
      if (activeSessionId) {
        try {
          const profile = DataManager.getPlayerProfile();
          const correctCount = answersList.filter((a) => a.isCorrect).length;
          const incorrectCount = answersList.length - correctCount;
          const score = Math.round((correctCount / activeQuestions.length) * 100);
          const stars = score >= 85 ? 3 : score >= 60 ? 2 : score > 0 ? 1 : 0;
          DataManager.addOrUpdateSessionParticipant(activeSessionId, {
            name: profile.nickname || 'Siswa',
            avatarId: profile.avatarId || 'lion',
            currentQuestionIndex: activeQuestions.length,
            totalQuestions: activeQuestions.length,
            score,
            stars,
            correctCount,
            incorrectCount,
            finished: true,
            timeSpentSec: totalTimeSpent,
            tabSwitchCount,
          });
        } catch (err) {
          console.warn('Session participant finish sync error:', err);
        }
      }
      onFinishQuiz(answersList, totalTimeSpent);
    } else {
      setDucked(false);
      const nextIdx = currentIndex + 1;
      const nextQuestion = activeQuestions[nextIdx];
      const nextDuration = getQuestionDuration(nextQuestion);
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setIsAnswerConfirmed(false);
      setTimeLeft(nextDuration);
      setIsPaused(false);
      setPollVotes({ 0: 0, 1: 0, 2: 0, 3: 0 });
      setShortAnswerInput('');
      setShowFirstLetterHint(false);
      setRevealedTiles(new Set());
      setSelectedLeft(null);
      setMatchedPairs(new Set());
      setWrongPairAttempt(null);
    }
  };

  const handlePrev = () => {
    if (currentIndex <= 0) return;
    if (playClick) playClick();
    setDucked(false);
    const prevIdx = currentIndex - 1;
    const prevQuestion = activeQuestions[prevIdx];
    const prevDuration = getQuestionDuration(prevQuestion);
    setCurrentIndex(prevIdx);
    setSelectedOption(null);
    setIsAnswerConfirmed(false);
    setTimeLeft(prevDuration);
    setIsPaused(false);
    setPollVotes({ 0: 0, 1: 0, 2: 0, 3: 0 });
    setShortAnswerInput('');
    setShowFirstLetterHint(false);
    setRevealedTiles(new Set());
    setSelectedLeft(null);
    setMatchedPairs(new Set());
    setWrongPairAttempt(null);
  };

  const handleJumpToQuestion = (targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= activeQuestions.length || targetIdx === currentIndex) return;
    if (playClick) playClick();
    setDucked(false);
    const targetQuestion = activeQuestions[targetIdx];
    const targetDuration = getQuestionDuration(targetQuestion);
    setCurrentIndex(targetIdx);
    setSelectedOption(null);
    setIsAnswerConfirmed(false);
    setTimeLeft(targetDuration);
    setIsPaused(false);
    setPollVotes({ 0: 0, 1: 0, 2: 0, 3: 0 });
    setShortAnswerInput('');
    setShowFirstLetterHint(false);
    setRevealedTiles(new Set());
    setSelectedLeft(null);
    setMatchedPairs(new Set());
    setWrongPairAttempt(null);
  };

  // Real-time listener for settings and question changes dispatched by teacher
  useEffect(() => {
    const applySessionUpdate = (sess: QuizSession) => {
      if (
        (activeSessionId && sess.id === activeSessionId) ||
        (quiz.pinCode && sess.pinCode === quiz.pinCode) ||
        sess.quizId === quiz.id
      ) {
        setLiveSession(sess);
        if (sess.settings) {
          setCurrentSettings((prev) => ({
            ...prev,
            ...sess.settings,
          }));
        }

        // In teacher-led mode, advance student device in real time when teacher advances question
        if (sess.settings?.executionMode === 'teacher_led' && !isTeacher) {
          if (
            typeof sess.currentQuestionIndex === 'number' &&
            sess.currentQuestionIndex > currentIndex
          ) {
            setShowWaitingLounge(false);
            handleJumpToQuestion(sess.currentQuestionIndex);
          }
          if (sess.status === 'finished') {
            setShowWaitingLounge(false);
            handleNext();
          }
        }
      }
    };

    const handleBroadcastMsg = (event: MessageEvent) => {
      const data = event.data;
      if (data?.type === 'SESSION_UPDATED' && data.session) {
        applySessionUpdate(data.session);
      }
    };

    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('kuis_realtime_session_sync');
        bc.addEventListener('message', handleBroadcastMsg);
      }
    } catch (e) {
      console.warn('BroadcastChannel error in QuizArena:', e);
    }

    const handleCustomSync = (e: Event) => {
      const customEvt = e as CustomEvent;
      const sess: QuizSession = customEvt.detail?.session;
      if (sess) {
        applySessionUpdate(sess);
      }
    };
    window.addEventListener('kuis_session_updated', handleCustomSync);

    // Langganan WebSocket Realtime Supabase untuk sinkronisasi instan multi-device
    const targetSessionId = activeSessionId || liveSession?.id;
    let unsubRealtime = () => {};
    if (targetSessionId) {
      unsubRealtime = DataManager.subscribeToQuizSession(targetSessionId, (freshSess) => {
        applySessionUpdate(freshSess);
      });
    }

    // Polling fallback lokal + cloud Supabase setiap 2 detik
    const interval = setInterval(async () => {
      const targetId = activeSessionId || liveSession?.id;
      const freshLocal = targetId
        ? DataManager.getActiveSessionById(targetId)
        : quiz.pinCode
        ? DataManager.getActiveSessionByPin(quiz.pinCode)
        : DataManager.getActiveSessionByQuizId(quiz.id);

      if (freshLocal) {
        applySessionUpdate(freshLocal);
      }

      // KRUSIAL UNTUK MULTI-DEVICE: Query ke Supabase Cloud agar perubahan soal guru langsung masuk ke smartphone siswa
      if (targetId) {
        try {
          const freshCloud = await DataManager.fetchActiveSessionById(targetId);
          if (freshCloud) {
            applySessionUpdate(freshCloud);
          }
        } catch {}
      }
    }, 2000);

    return () => {
      if (bc) {
        bc.removeEventListener('message', handleBroadcastMsg);
        bc.close();
      }
      window.removeEventListener('kuis_session_updated', handleCustomSync);
      clearInterval(interval);
      unsubRealtime();
    };
  }, [activeSessionId, quiz.id, quiz.pinCode, currentIndex, isTeacher, liveSession?.id]);

  const handleVoteAdd = (e: React.MouseEvent, optIndex: number) => {
    e.stopPropagation();
    playClick();
    setPollVotes((prev) => ({
      ...prev,
      [optIndex]: (prev[optIndex] || 0) + 1,
    }));
  };

  const handleTileClick = (tileIdx: number) => {
    if (isAnswerConfirmed) return;
    playClick();
    setRevealedTiles((prev) => {
      const next = new Set(prev);
      next.add(tileIdx);
      return next;
    });
  };

  const handleRevealRandomTile = () => {
    if (isAnswerConfirmed) return;
    playClick();
    const unrevealed = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => !revealedTiles.has(i));
    if (unrevealed.length > 0) {
      const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      setRevealedTiles((prev) => new Set(prev).add(pick));
    }
  };

  const handleLeftPairClick = (idx: number) => {
    if (isAnswerConfirmed || matchedPairs.has(idx)) return;
    playClick();
    setSelectedLeft(idx === selectedLeft ? null : idx);
  };

  const handleRightPairClick = (item: { originalIndex: number; text: string; isDistractor?: boolean }) => {
    if (isAnswerConfirmed || matchedPairs.has(item.originalIndex) || selectedLeft === null) return;
    playClick();

    if (!item.isDistractor && item.originalIndex === selectedLeft) {
      // Cocok benar
      const nextMatched = new Set(matchedPairs);
      nextMatched.add(selectedLeft);
      setMatchedPairs(nextMatched);
      setSelectedLeft(null);
      playCorrect();

      const totalPairs = question.matchingPairs?.length || 0;
      if (nextMatched.size === totalPairs) {
        setTimeout(() => {
          handleAnswerSelect(0, 'Semua Pasangan Cocok', true, question.points || 10, totalPairs, totalPairs);
        }, 400);
      }
    } else {
      // Salah pasang (termasuk kartu pengecoh)
      playWrong();
      setWrongPairAttempt({ left: selectedLeft, right: item.originalIndex });
      setTimeout(() => {
        setWrongPairAttempt(null);
        setSelectedLeft(null);
      }, 600);
    }
  };

  const progressPercent = ((currentIndex + 1) / activeQuestions.length) * 100;

  return (
    <div className="fixed inset-0 z-30 w-full h-full h-[100dvh] overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between select-none">
      
      {/* Top Arena Header - Pinned at top with safe-area support */}
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-2 sm:px-6 pt-[max(env(safe-area-inset-top),0.625rem)] pb-2 sm:pb-2.5 flex-shrink-0 z-20 shadow-xs">
        <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl 4k:max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
          
          {/* Left: Exit Button & Question Info */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink">
            <button
              onClick={() => {
                if (playClick) playClick();
                if (isPreview) {
                  onExit();
                } else {
                  setShowExitConfirm(true);
                }
              }}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors flex-shrink-0"
              aria-label={isPreview ? "Tutup Pratinjau Kuis" : "Keluar Kuis"}
              title={isPreview ? "Tutup Pratinjau Kuis" : "Keluar Kuis"}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 flex-wrap">
                {canTeacherReveal || activeSettings.executionMode === 'teacher_led' ? (
                  <select
                    value={currentIndex}
                    onChange={(e) => handleJumpToQuestion(Number(e.target.value))}
                    className="text-[11px] sm:text-xs font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-900/80 px-2 py-0.5 rounded-md cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                    title="Lompat ke Nomor Soal Tertentu (Khusus Guru)"
                    aria-label="Pilih Nomor Soal"
                  >
                    {activeQuestions.map((_, qIdx) => (
                      <option key={qIdx} value={qIdx} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                        Soal {qIdx + 1}/{activeQuestions.length}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-[11px] sm:text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md inline-block whitespace-nowrap self-start">
                    Soal {currentIndex + 1}/{activeQuestions.length}
                  </span>
                )}
                {isPreview && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-600 text-white shadow-xs">
                    Pratinjau
                  </span>
                )}
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {question.points || 10} Poin
                </span>
                {isTeacher && activeSettings.executionMode === 'teacher_led' && (
                  <span className="text-[10px] sm:text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/80 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-500" />
                    <span>
                      {liveSession?.participants?.filter(p => p.answers && p.answers[question.id])?.length || 0} / {liveSession?.participants?.length || 0} Menjawab
                    </span>
                  </span>
                )}
              </div>
              <h2 className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[85px] xs:max-w-[130px] sm:max-w-[200px] md:max-w-[280px] hidden xs:block">
                {quiz.title}
              </h2>
            </div>
          </div>

          {/* Center: Timer, Game Mode & Streak Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {gameMode === 'survival_3hearts' && (
              <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs shadow-xs" title={`${hearts} Kesempatan Tersisa`}>
                {[1, 2, 3].map((hIdx) => (
                  <span
                    key={hIdx}
                    className={`transition-all duration-300 text-xs sm:text-sm ${
                      hIdx <= hearts ? 'scale-100' : 'opacity-25 grayscale scale-75'
                    }`}
                  >
                    {hIdx <= hearts ? '❤️' : '🖤'}
                  </span>
                ))}
              </div>
            )}

            <span className={`inline-flex items-center gap-1 text-xs sm:text-sm font-bold px-2.5 py-1 rounded-xl transition-colors ${
              isPaused 
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse'
                : gameMode === 'untimed' || (activeSettings.executionMode === 'teacher_led' && activeSettings.teacherPacingSubMode === 'manual')
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : timeLeft <= 5 
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold animate-pulse' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}>
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {isPaused 
                  ? 'Jeda' 
                  : gameMode === 'untimed'
                  ? `Santai (${Math.floor(totalTimeSpent / 60)}:${(totalTimeSpent % 60).toString().padStart(2, '0')})`
                  : activeSettings.executionMode === 'teacher_led' && activeSettings.teacherPacingSubMode === 'manual'
                  ? '🕹️ Dipandu Guru'
                  : `${timeLeft}s`}
              </span>
            </span>

            {streak >= 2 && showLeaderboardToStudents && showAnswersMode !== 'exam_strict' && (
              <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2 sm:px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm animate-bounce">
                <Flame className="w-3.5 h-3.5 fill-white flex-shrink-0" />
                <span className="hidden xs:inline">{streak}x Kombo!</span>
                <span className="xs:hidden">{streak}x</span>
              </span>
            )}
          </div>

          {/* Right: Edit Button (in preview), Pause & Desktop Full Toolbar / Mobile Tools Trigger */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {isPreview && onEditQuestion && (
              <button
                type="button"
                onClick={() => {
                  if (playClick) playClick();
                  onEditQuestion(question);
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all btn-press min-h-[44px]"
                title="Edit Butir Soal Ini di Studio"
              >
                <Edit3 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Edit Soal</span>
              </button>
            )}

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
        <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl 4k:max-w-7xl mx-auto bg-slate-100 dark:bg-slate-800 h-1 sm:h-1.5 mt-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Quiz Arena Card - Locked to Viewport with Auto-centering & Smooth Top-to-Bottom Overflow */}
      <main className="flex-1 min-h-0 w-full overflow-y-auto px-3 py-2 sm:px-6 sm:py-4 flex flex-col items-center overscroll-contain">
        <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl 4k:max-w-7xl bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 md:p-8 2xl:p-10 3xl:p-12 border border-slate-200/90 dark:border-slate-800 shadow-card flex flex-col gap-3.5 sm:gap-5 xl:gap-6 my-auto animate-fade-in relative">
          
          {/* Paused Overlay Banner */}
          {isPaused && (
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white text-center text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 animate-bounce flex-shrink-0">
              <Pause className="w-4 h-4" />
              <span>Waktu Dijeda: Guru Sedang Memberikan Penjelasan ke Kelas</span>
            </div>
          )}

          {/* Question Text */}
          <h3 className="text-sm xs:text-base sm:text-lg md:text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl font-extrabold text-slate-900 dark:text-white leading-snug break-words">
            {question.text}
          </h3>

          {/* Illustration Container (Special Mystery Grid for image_guess) */}
          {question.type === 'image_guess' ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 max-h-56 sm:max-h-64 flex flex-col items-center justify-center p-2 flex-shrink-0 select-none">
              <div className="relative max-h-48 sm:max-h-56 w-auto aspect-video max-w-full rounded-xl overflow-hidden flex items-center justify-center bg-slate-200 dark:bg-slate-800">
                {question.imageUrl && !mysteryImgError ? (
                  <img
                    src={question.imageUrl}
                    alt="Gambar Misteri"
                    className="max-h-48 sm:max-h-56 w-auto object-contain mx-auto"
                    onError={() => setMysteryImgError(true)}
                  />
                ) : (
                  <div className="text-5xl sm:text-6xl p-4">
                    {question.imageCaption || '❓'}
                  </div>
                )}

                {/* 3x3 Mystery Tiles Overlay */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((tileIdx) => {
                    const isRevealed = revealedTiles.has(tileIdx);
                    return (
                      <button
                        type="button"
                        key={tileIdx}
                        disabled={isAnswerConfirmed || isRevealed}
                        onClick={() => handleTileClick(tileIdx)}
                        className={`w-full h-full rounded-lg sm:rounded-xl font-black text-xs sm:text-sm flex flex-col items-center justify-center transition-all duration-300 ${
                          isRevealed
                            ? 'opacity-0 pointer-events-none scale-90'
                            : 'bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-sm border border-white/40 cursor-pointer active:scale-95'
                        }`}
                        title={isRevealed ? 'Kotak Terbuka' : `Ketuk untuk membuka kotak #${tileIdx + 1}`}
                      >
                        {!isRevealed && (
                          <>
                            <Puzzle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/90 mb-0.5" />
                            <span>{tileIdx + 1}</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mystery Grid Helper Buttons */}
              <div className="mt-2 flex items-center justify-between w-full max-w-sm px-1 text-xs">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {isAnswerConfirmed
                    ? '🎉 Seluruh kotak terbuka!'
                    : `Kotak tertutup: ${9 - revealedTiles.size}/9`}
                </span>
                {!isAnswerConfirmed && (
                  <button
                    type="button"
                    onClick={handleRevealRandomTile}
                    className="px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors min-h-[44px] min-w-[44px] active:scale-95"
                  >
                    <Puzzle className="w-4 h-4" />
                    <span>Buka 1 Kotak Acak</span>
                  </button>
                )}
              </div>
            </div>
          ) : question.imageUrl ? (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-center max-h-36 sm:max-h-52 xl:max-h-64 flex items-center justify-center p-2 flex-shrink-0">
              <QuizIllustration
                imageUrl={question.imageUrl}
                imageCaption={question.imageCaption}
                imagePrompt={question.imagePrompt}
                alt="Ilustrasi Soal"
                imgClassName="max-h-32 sm:max-h-48 xl:max-h-60 w-auto rounded-xl object-contain mx-auto"
                enableWikipedia={true}
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

          {/* Type: Short Answer Input */}
          {question.type === 'short_answer' && (
            <div className="w-full bg-slate-50 dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                Tulis Jawaban Singkatmu:
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  disabled={isAnswerConfirmed}
                  value={shortAnswerInput}
                  onChange={(e) => setShortAnswerInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && shortAnswerInput.trim() && !isAnswerConfirmed) {
                      handleAnswerSelect(0, shortAnswerInput);
                    }
                  }}
                  placeholder="Ketik jawaban di sini..."
                  className={`flex-1 px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm sm:text-base focus:outline-none min-h-[50px] transition-all ${
                    isAnswerConfirmed
                      ? selectedOption === 0 && answersList[currentIndex]?.isCorrect
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100'
                        : 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100'
                      : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                />

                {!isAnswerConfirmed ? (
                  <button
                    type="button"
                    disabled={!shortAnswerInput.trim()}
                    onClick={() => handleAnswerSelect(0, shortAnswerInput)}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 min-h-[50px] shadow-sm btn-press transition-colors flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim</span>
                  </button>
                ) : null}
              </div>

              {/* First-Letter Hint Pill (Hanya untuk latihan bebas casual mandiri - disembunyikan total pada sesi aktif guru & mode ujian) */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                {!isAnswerConfirmed && showAnswersMode === 'immediate' && !activeSessionId && (
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setShowFirstLetterHint(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800 min-h-[36px] transition-colors"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Bantuan Huruf Pertama</span>
                  </button>
                )}

                {showFirstLetterHint && showAnswersMode === 'immediate' && !activeSessionId && (
                  <div className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs sm:text-sm border border-blue-200 dark:border-blue-800">
                    Petunjuk: {getFirstLetterHint(question)}
                  </div>
                )}
              </div>

              {/* Status Feedback After Answer Confirmed */}
              {isAnswerConfirmed && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs sm:text-sm font-bold ${
                  showAnswersMode === 'exam_strict'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-800'
                    : answersList[currentIndex]?.isCorrect
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                }`}>
                  {showAnswersMode === 'exam_strict' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span>Jawaban berhasil disimpan: <strong>{shortAnswerInput}</strong></span>
                    </>
                  ) : answersList[currentIndex]?.isCorrect ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span>Luar biasa! Jawabanmu tepat: <strong>{shortAnswerInput}</strong></span>
                    </>
                  ) : showAnswersMode === 'status_only' ? (
                    <>
                      <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                      <span>Jawaban belum tepat. (Kunci jawaban dirahasiakan guru)</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                      <span>Kunci Jawaban: <strong>{question.acceptableAnswers?.[0] || question.options[question.correctIndex] || 'Jawaban Tepat'}</strong></span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Type: Matching Pairs Card */}
          {question.type === 'matching_pairs' && (
            <div className="w-full space-y-3">
              {/* Instructions banner */}
              <div className="text-center p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900 text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2 flex-wrap">
                <span>
                  {matchedPairs.size === (question.matchingPairs?.length || 0)
                    ? '🎉 Semua Pasangan Berhasil Dijodohkan Sempurna!'
                    : selectedLeft === null
                    ? '👉 Ketuk satu kartu di Kolom A, lalu pilih pasangannya di Kolom B.'
                    : '🎯 Sekarang ketuk kartu pasangannya di Kolom B!'}
                </span>
                {question.distractors && question.distractors.length > 0 && matchedPairs.size < (question.matchingPairs?.length || 0) && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
                    Ada Kartu Pengecoh
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                {/* Column A: Left Items */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 block px-1">
                    Kolom A (Soal)
                  </span>
                  {(question.matchingPairs || []).map((pair, idx) => {
                    const isMatched = matchedPairs.has(idx);
                    const isSelected = selectedLeft === idx;
                    const isWrong = wrongPairAttempt?.left === idx;

                    return (
                      <button
                        type="button"
                        key={idx}
                        disabled={isAnswerConfirmed || isMatched}
                        onClick={() => handleLeftPairClick(idx)}
                        className={`w-full p-3 rounded-2xl text-left font-bold text-xs sm:text-sm flex items-center justify-between min-h-[50px] border transition-all ${
                          isMatched
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-xs'
                            : isWrong
                            ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 text-rose-700 dark:text-rose-300 animate-shake'
                            : isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-300 dark:ring-blue-800'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                        }`}
                      >
                        <span className="truncate pr-1">{pair.left}</span>
                        {isMatched && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Column B: Right Items (Shuffled) */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 block px-1">
                    Kolom B (Pasangan)
                  </span>
                  {shuffledRightItems.map((item, idx) => {
                    const isMatched = !item.isDistractor && matchedPairs.has(item.originalIndex);
                    const isWrong = wrongPairAttempt?.right === item.originalIndex;

                    return (
                      <button
                        type="button"
                        key={idx}
                        disabled={isAnswerConfirmed || isMatched || selectedLeft === null}
                        onClick={() => handleRightPairClick(item)}
                        className={`w-full p-3 rounded-2xl text-left font-bold text-xs sm:text-sm flex items-center justify-between min-h-[50px] border transition-all ${
                          isMatched
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-xs'
                            : isWrong
                            ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 text-rose-700 dark:text-rose-300 animate-shake'
                            : selectedLeft !== null
                            ? 'bg-blue-50/50 dark:bg-blue-950/30 border-dashed border-blue-300 dark:border-blue-700 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 text-slate-800 dark:text-slate-200'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 opacity-80'
                        }`}
                      >
                        <span className="truncate pr-1">{item.text}</span>
                        {isMatched && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Answer Options for Multiple Choice, True/False, and Image Guess: 2 Columns on Tablet/Desktop/Smartboard, 1 Column on Mobile */}
          {(question.type === 'multiple_choice' || question.type === 'true_false' || question.type === 'image_guess') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 xl:gap-4">
            {question.options.map((optText, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOpt = question.correctIndex === idx;

              let btnStyle = 'bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-blue-300 dark:hover:border-blue-500/60 hover:bg-slate-50 dark:hover:bg-slate-750';

              if (isAnswerConfirmed) {
                if (showAnswersMode === 'immediate') {
                  if (isCorrectOpt) {
                    btnStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 dark:border-emerald-400 text-emerald-900 dark:text-emerald-100 font-bold';
                  } else if (isSelected && !isCorrectOpt) {
                    btnStyle = 'bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-500 text-rose-900 dark:text-rose-100 font-bold';
                  } else {
                    btnStyle = 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-60';
                  }
                } else if (showAnswersMode === 'status_only') {
                  // Hanya beri warna status pada tombol yang dipilih siswa. KUNCI BENAR TIDAK DIBOCORKAN jika siswa salah!
                  if (isSelected) {
                    if (isCorrectOpt) {
                      btnStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 dark:border-emerald-400 text-emerald-900 dark:text-emerald-100 font-bold';
                    } else {
                      btnStyle = 'bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-500 text-rose-900 dark:text-rose-100 font-bold';
                    }
                  } else {
                    btnStyle = 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-60';
                  }
                } else {
                  // exam_strict: konfirmasi netral tersimpan, tidak membocorkan benar/salah maupun kunci
                  if (isSelected) {
                    btnStyle = 'bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-500 dark:border-blue-400 text-blue-900 dark:text-blue-100 font-bold shadow-xs';
                  } else {
                    btnStyle = 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-60';
                  }
                }
              }

              const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

              return (
                <button
                  key={idx}
                  disabled={isAnswerConfirmed}
                  onClick={() => handleAnswerSelect(idx)}
                  className={`w-full p-3 sm:p-4 xl:p-5 3xl:p-6 rounded-2xl text-left flex items-center justify-between transition-all min-h-[48px] sm:min-h-[56px] xl:min-h-[64px] 2xl:min-h-[72px] 3xl:min-h-[80px] btn-press ${btnStyle}`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <span
                      className={`w-8 h-8 sm:w-9 sm:h-9 xl:w-11 xl:h-11 3xl:w-14 3xl:h-14 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm xl:text-base 3xl:text-xl flex-shrink-0 ${
                        isAnswerConfirmed
                          ? showAnswersMode === 'immediate'
                            ? isCorrectOpt
                              ? 'bg-emerald-600 text-white'
                              : isSelected
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            : showAnswersMode === 'status_only'
                            ? isSelected
                              ? isCorrectOpt
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            : isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {question.type === 'true_false' ? (idx === 0 ? '✓' : '✗') : (letters[idx] || String.fromCharCode(65 + idx))}
                    </span>
                    <span className="text-xs sm:text-sm md:text-base xl:text-lg 3xl:text-xl font-bold break-words leading-snug">{optText}</span>
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

                    {/* Feedback Icons / Badges */}
                    {isAnswerConfirmed && showAnswersMode === 'immediate' && isCorrectOpt && (
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 ml-1.5" />
                    )}
                    {isAnswerConfirmed && showAnswersMode === 'immediate' && isSelected && !isCorrectOpt && (
                      <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 dark:text-rose-400 ml-1.5" />
                    )}

                    {isAnswerConfirmed && showAnswersMode === 'status_only' && isSelected && (
                      isCorrectOpt ? (
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 ml-1.5" />
                      ) : (
                        <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 dark:text-rose-400 ml-1.5" />
                      )
                    )}

                    {isAnswerConfirmed && showAnswersMode === 'exam_strict' && isSelected && (
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900 ml-1.5 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersimpan</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          )}

          {/* Explanation Callout */}
          {isAnswerConfirmed && showExplanationMode === 'immediate' && question.explanation && (
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

          {isAnswerConfirmed && showExplanationMode === 'end_only' && (
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-850 text-center flex-shrink-0 animate-fade-in border border-slate-200/80 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                🔒 Pembahasan butir soal ini akan ditampilkan pada rekapan akhir pengerjaan.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Bottom Footer Control */}
      <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 pb-[max(env(safe-area-inset-bottom),0.625rem)] flex-shrink-0 z-20 shadow-sm">
        <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl 4k:max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Tombol Soal Sebelumnya (Prev) - Khusus Mode Dipandu Guru atau Guru Terverifikasi */}
            {(canTeacherReveal || activeSettings.executionMode === 'teacher_led') && currentIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 min-h-[46px] sm:min-h-[50px] transition-colors btn-press"
                title="Kembali ke Soal Sebelumnya"
                aria-label="Soal Sebelumnya"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>
            )}

            {/* Tombol Hold Timer / Jeda Waktu Guru */}
            {(canTeacherReveal || activeSettings.executionMode === 'teacher_led') && (
              <button
                type="button"
                onClick={() => {
                  if (playClick) playClick();
                  setIsPaused(!isPaused);
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold min-h-[46px] sm:min-h-[50px] transition-colors btn-press ${
                  isPaused
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800'
                }`}
                title={isPaused ? 'Lanjutkan Waktu Kuis' : 'Jeda Waktu untuk Memberikan Arahan Guru'}
                aria-label={isPaused ? 'Lanjutkan Waktu' : 'Jeda Waktu'}
              >
                {isPaused ? <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" /> : <Pause className="w-4 h-4 sm:w-5 sm:h-5" />}
                <span className="hidden sm:inline">{isPaused ? 'Lanjut' : 'Jeda Waktu'}</span>
              </button>
            )}

            {/* Teacher Reveal Button (HANYA untuk Guru pada Smartboard atau Pratinjau Studio - 100% Bebas Kebocoran Siswa) */}
            {canTeacherReveal && !isAnswerConfirmed ? (
              <button
                type="button"
                onClick={handleTeacherReveal}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 min-h-[46px] sm:min-h-[50px] transition-colors btn-press"
                title="Buka Kunci Jawaban untuk Pembahasan Bersama (Khusus Guru / Smartboard)"
              >
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Buka Kunci</span>
                <span className="sm:hidden">Kunci</span>
              </button>
            ) : !isAnswerConfirmed && !(canTeacherReveal || activeSettings.executionMode === 'teacher_led') ? (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold border border-slate-200/80 dark:border-slate-700">
                {showAnswersMode === 'exam_strict' ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span>Mode Ujian Terproteksi</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>Pilih satu jawaban terbaik</span>
                  </>
                )}
              </div>
            ) : isAnswerConfirmed ? (
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Tekan lanjut untuk soal berikutnya
              </span>
            ) : null}
          </div>

          {activeSettings.executionMode === 'teacher_led' && !isTeacher ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping flex-shrink-0" />
              <span>Dipandu Guru di Depan Kelas</span>
            </div>
          ) : (
            <button
              disabled={!isAnswerConfirmed && !(canTeacherReveal || activeSettings.executionMode === 'teacher_led')}
              onClick={handleNext}
              className={`flex-1 sm:flex-initial sm:min-w-[200px] xl:min-w-[240px] px-6 py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm xl:text-base flex items-center justify-center gap-2 transition-all min-h-[46px] sm:min-h-[50px] btn-press ${
                isAnswerConfirmed || canTeacherReveal || activeSettings.executionMode === 'teacher_led'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>{isLastQuestion ? 'Selesai & Rekap Nilai' : 'Soal Berikutnya'}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
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
            style={mobileToolsBackdropStyle}
            onClick={() => setIsMobileToolsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative z-10 w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 pt-2 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-modal-card-in"
            onClick={(e) => e.stopPropagation()}
            style={mobileToolsDrawerStyle}
          >
            {/* Mobile Drag Handle - Swipe Down to Close */}
            <DrawerHandle ref={mobileToolsHandleRef} className="sm:hidden -mt-1 mb-1" />

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
              {/* Tombol Edit Soal (Khusus Mode Pratinjau Guru) */}
              {isPreview && onEditQuestion && (
                <button
                  onClick={() => {
                    if (playClick) playClick();
                    setIsMobileToolsOpen(false);
                    onEditQuestion(question);
                  }}
                  className="w-full p-3 rounded-2xl flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm min-h-[50px] transition-colors shadow-xs btn-press"
                >
                  <Edit3 className="w-4 h-4 shrink-0" />
                  <span>Edit Butir Soal Ini di Studio</span>
                </button>
              )}

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

      {/* Game Over Modal (Survival 3 Hearts Mode) */}
      {isGameOver && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 modal-wrapper overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm animate-backdrop-fade touch-none" />
          <div 
            className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-pop border border-rose-200 dark:border-rose-900 text-center space-y-4 animate-modal-card-in overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/80 text-rose-500 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-3xl mx-auto shadow-sm">
              💔
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">Kesempatan Habis!</h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                Kamu telah menggunakan 3 kesempatan di Mode Tantangan 3 Hati. Ayo evaluasi dan coba lagi!
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleRetryQuiz}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm min-h-[46px] btn-press transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ulangi Kuis Dari Awal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopBgm();
                  try {
                    sessionStorage.removeItem(STORAGE_KEY);
                  } catch {}
                  onFinishQuiz(answersList, totalTimeSpent);
                }}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[44px] transition-colors"
              >
                Lihat Rekap Nilai Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anti-Cheating Tab Switch Warning Modal */}
      {showTabSwitchWarning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-amber-400 dark:border-amber-600 shadow-2xl space-y-4 text-center animate-scale-up">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl font-black shadow-inner">
              ⚠️
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Peringatan Anti-Mencontek!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Anda terdeteksi berpindah tab atau meninggalkan jendela kuis saat ujian aktif.
              </p>
              <div className="mt-2.5 py-1.5 px-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300">
                Peringatan ke-{tabSwitchCount} tercatat oleh guru
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (playClick) playClick();
                setShowTabSwitchWarning(false);
              }}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm transition-colors shadow-md btn-press min-h-[44px]"
            >
              Saya Mengerti & Kembali
            </button>
          </div>
        </div>
      )}

      {/* Lounge Jeda Antar-Soal (Siswa di Mode Dipandu Guru) */}
      {(showWaitingLounge || isAnswerConfirmed) && activeSettings.executionMode === 'teacher_led' && !isTeacher && !isLastQuestion && (
        <InterQuestionWaitingLounge
          session={
            liveSession || {
              id: activeSessionId || 'sess_temp',
              quizId: quiz.id,
              quizTitle: quiz.title,
              subject: quiz.subject,
              grade: quiz.grade,
              pinCode: quiz.pinCode || '1001',
              status: 'active',
              createdAt: new Date().toISOString(),
              settings: activeSettings,
              participants: [],
              totalQuestions: activeQuestions.length,
            }
          }
          questionIndex={currentIndex}
          totalQuestions={activeQuestions.length}
          studentName={DataManager.getPlayerProfile().nickname || 'Siswa Pintar'}
          avatarId={DataManager.getPlayerProfile().avatarId || 'lion'}
          earnedStars={answersList.filter((a) => a.isCorrect).length}
          earnedScore={Math.round((answersList.filter((a) => a.isCorrect).length / activeQuestions.length) * 100)}
          onAdvanceToQuestion={(nextIdx) => {
            setShowWaitingLounge(false);
            handleJumpToQuestion(nextIdx);
          }}
          onQuizFinished={() => {
            setShowWaitingLounge(false);
            handleNext();
          }}
          playClick={playClick}
          playCorrect={playCorrect}
        />
      )}

    </div>
  );
};
