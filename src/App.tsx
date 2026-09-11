import React, { useState, useEffect } from 'react';
import type { Quiz, QuizAttemptAnswer, TeacherProfile, ScreenState, GameMode } from './types/quiz';
import { SplashScreen } from './components/pwa/SplashScreen';
import { InstallPrompt } from './components/pwa/InstallPrompt';
import { ReorientationOverlay } from './components/pwa/ReorientationOverlay';
import { QuizHome } from './components/home/QuizHome';
import { QuizArena } from './components/arena/QuizArena';
import { QuizResult } from './components/result/QuizResult';
import { QuizCreator } from './components/creator/QuizCreator';
import { StudentLobby } from './components/lobby/StudentLobby';
import { UnifiedAuthModal, type AuthModalTab } from './components/auth/UnifiedAuthModal';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { WorksheetPrintView } from './components/print/WorksheetPrintView';
import { DataManager } from './lib/supabaseClient';
import { useSoundEffects } from './hooks/useSoundEffects';
import { useBackHandler } from './lib/navigationHistory';
import { useTheme } from './hooks/useTheme';
import { BackGestureIndicator } from './components/common/BackGestureIndicator';
import {
  saveNavigationState,
  restoreNavigationState,
  clearNavigationState,
  hasSeenSplash,
  markSplashSeen,
} from './lib/navigationState';

export const App: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  // 1. Pulihkan status navigasi dan sesi layar dari URL / sessionStorage
  const [initialNav] = useState(() => restoreNavigationState());
  const initialTeacher = DataManager.getTeacherProfile();

  const isTeacherRoute = initialNav.screen === 'creator' || initialNav.screen === 'teacher-dashboard';
  const isValidRestoredScreen = initialNav.isRestored && (!isTeacherRoute || Boolean(initialTeacher));

  const [currentScreen, setCurrentScreen] = useState<ScreenState>(() => {
    if (isValidRestoredScreen) {
      return initialNav.screen;
    }
    return 'home';
  });

  const [showSplash, setShowSplash] = useState<boolean>(() => {
    // Jika pengguna sedang memuat ulang layar aktif (misal teacher-dashboard atau arena), lewati splash
    if (isValidRestoredScreen && initialNav.screen !== 'home') {
      return false;
    }
    // Jika splash screen sudah pernah tampil di sesi tab browser ini, jangan ulangi
    if (hasSeenSplash()) {
      return false;
    }
    return true;
  });

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeGameMode, setActiveGameMode] = useState<GameMode>('standard');
  const [lastAnswers, setLastAnswers] = useState<QuizAttemptAnswer[]>(() => initialNav.lastAnswers || []);
  const [lastTimeSpent, setLastTimeSpent] = useState<number>(() => initialNav.lastTimeSpent || 0);

  // Unified Auth State
  const [teacher, setTeacher] = useState<TeacherProfile | null>(initialTeacher);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [creatorInitialMode, setCreatorInitialMode] = useState<'ai' | 'manual'>(() => {
    if (initialNav.creatorMode) return initialNav.creatorMode;
    return 'manual';
  });
  const [reopenMethodModal, setReopenMethodModal] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<AuthModalTab>('student');

  const {
    isMuted,
    toggleMute,
    playClick,
    playCorrect,
    playWrong,
    playTick,
    playReveal,
    playApplause,
    playCelebration,
  } = useSoundEffects();

  // Memulihkan data kuis saat reload (F5) berdasarkan quizId atau pin
  useEffect(() => {
    if (initialNav.quizId) {
      DataManager.getQuizById(initialNav.quizId).then((q) => {
        if (q) {
          setActiveQuiz(q);
        } else if (['arena', 'student-lobby', 'result', 'worksheet-print'].includes(currentScreen)) {
          console.warn('Kuis tidak ditemukan untuk sesi ini, kembali ke beranda.');
          setCurrentScreen('home');
          clearNavigationState();
        }
      });
    } else if (initialNav.pin) {
      DataManager.getQuizByPin(initialNav.pin).then((q) => {
        if (q) {
          setActiveQuiz(q);
          if (currentScreen === 'home') {
            setCurrentScreen('student-lobby');
          }
        } else if (currentScreen === 'student-lobby') {
          setCurrentScreen('home');
          clearNavigationState();
        }
      });
    }
  }, []);

  // Simpan otomatis status navigasi setiap terjadi perpindahan layar atau kuis aktif
  useEffect(() => {
    saveNavigationState({
      screen: currentScreen,
      quiz: activeQuiz,
      creatorMode: currentScreen === 'creator' ? creatorInitialMode : undefined,
      lastAnswers,
      lastTimeSpent,
    });
  }, [currentScreen, activeQuiz?.id, creatorInitialMode, lastAnswers, lastTimeSpent]);

  // Selalu reset posisi scroll ke 0 dan atur scrollRestoration manual saat pergantian layar
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, [currentScreen]);

  // Sinkronisasi navigasi browser (Tombol Back / Forward)
  useEffect(() => {
    const handlePopState = () => {
      const restored = restoreNavigationState();
      const isTeacherScreen = restored.screen === 'creator' || restored.screen === 'teacher-dashboard';
      if (!isTeacherScreen || teacher) {
        setCurrentScreen(restored.screen);
        if (restored.quizId && (!activeQuiz || activeQuiz.id !== restored.quizId)) {
          DataManager.getQuizById(restored.quizId).then((q) => {
            if (q) setActiveQuiz(q);
          });
        }
      } else {
        setCurrentScreen('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [teacher, activeQuiz]);

  const handleSelectQuiz = (quiz: Quiz, mode?: GameMode) => {
    setActiveQuiz(quiz);
    setActiveGameMode(mode || quiz.defaultGameMode || 'standard');
    setCurrentScreen('arena');
    saveNavigationState({ screen: 'arena', quiz, replace: false });
  };

  const handleEnterPinLobby = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setActiveGameMode(quiz.defaultGameMode || 'standard');
    setCurrentScreen('student-lobby');
    saveNavigationState({ screen: 'student-lobby', quiz, replace: false });
  };

  const handleFinishQuiz = (answers: QuizAttemptAnswer[], timeSpent: number) => {
    setLastAnswers(answers);
    setLastTimeSpent(timeSpent);
    setCurrentScreen('result');
    saveNavigationState({
      screen: 'result',
      quiz: activeQuiz,
      lastAnswers: answers,
      lastTimeSpent: timeSpent,
      replace: false,
    });
  };

  const handleReplay = () => {
    if (!activeQuiz) return;
    const shuffledQuiz: Quiz = {
      ...activeQuiz,
      questions: [...activeQuiz.questions].sort(() => Math.random() - 0.5),
    };
    setActiveQuiz(shuffledQuiz);
    setCurrentScreen('arena');
    saveNavigationState({ screen: 'arena', quiz: shuffledQuiz, replace: false });
  };

  const handleGoHome = () => {
    setActiveQuiz(null);
    clearNavigationState();
    setCurrentScreen('home');
  };

  // RBAC Guard: Cegah peran Siswa atau Tamu mengakses rute pembuat kuis atau dashboard guru
  useEffect(() => {
    if (!teacher && (currentScreen === 'creator' || currentScreen === 'teacher-dashboard')) {
      console.warn('RBAC Guard: Akses rute khusus guru dialihkan ke beranda.');
      clearNavigationState();
      setCurrentScreen('home');
    }
  }, [teacher, currentScreen]);

  const handleSaveCreatedQuiz = async (newQuiz: Quiz) => {
    if (!teacher) {
      console.error('Akses Ditolak (RBAC): Hanya peran Guru yang berhak menyimpan atau memodifikasi kuis.');
      setCurrentScreen('home');
      return;
    }
    try {
      await DataManager.saveCustomQuiz(newQuiz);
      playCelebration();
      setEditingQuiz(null);
      setCurrentScreen('teacher-dashboard');
    } catch (err) {
      console.error('Gagal menyimpan kuis:', err);
    }
  };

  const handleOpenAuthModal = (tab: AuthModalTab = 'student') => {
    setAuthInitialTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleTeacherPortalClick = () => {
    if (teacher) {
      setCurrentScreen('teacher-dashboard');
    } else {
      handleOpenAuthModal('teacher');
    }
  };

  const handleTeacherLoginSuccess = (teacherProfile: TeacherProfile) => {
    setTeacher(teacherProfile);
    playCelebration();
    setCurrentScreen('teacher-dashboard');
    saveNavigationState({ screen: 'teacher-dashboard', replace: false });
  };

  const handleStudentLoginSuccess = () => {
    playCelebration();
    // Modal will close and student session is persisted
  };

  const handleTeacherLogout = async () => {
    await DataManager.signOutTeacher();
    setTeacher(null);
    clearNavigationState();
    setCurrentScreen('home');
  };

  const handleLaunchSmartboard = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentScreen('arena');
    saveNavigationState({ screen: 'arena', quiz, replace: false });
  };

  const handlePrintWorksheet = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentScreen('worksheet-print');
    saveNavigationState({ screen: 'worksheet-print', quiz, replace: false });
  };

  const handleFinishSplash = () => {
    setShowSplash(false);
    markSplashSeen();
  };

  // 1. Level 1 (Prioritas 100): Modal Login Terpadu
  useBackHandler('app-unified-auth-modal', 100, () => {
    if (isAuthModalOpen) {
      setIsAuthModalOpen(false);
      return true;
    }
    return false;
  }, isAuthModalOpen);

  // 2. Level 3 (Prioritas 20): Transisi Layar Utama
  useBackHandler('screen-worksheet-print', 20, () => {
    if (teacher) {
      setCurrentScreen('teacher-dashboard');
    } else {
      setCurrentScreen('home');
    }
    return true;
  }, currentScreen === 'worksheet-print');

  useBackHandler('screen-result', 20, () => {
    handleGoHome();
    return true;
  }, currentScreen === 'result');

  useBackHandler('screen-student-lobby', 20, () => {
    handleGoHome();
    return true;
  }, currentScreen === 'student-lobby');

  useBackHandler('screen-creator', 20, () => {
    if (teacher) {
      setCurrentScreen('teacher-dashboard');
    } else {
      setCurrentScreen('home');
    }
    return true;
  }, currentScreen === 'creator');

  useBackHandler('screen-teacher-dashboard', 20, () => {
    handleGoHome();
    return true;
  }, currentScreen === 'teacher-dashboard');

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-primary-500 selection:text-white">
      {/* Visual Feedback on Back Gesture */}
      <BackGestureIndicator />

      {/* 1. Animated Splash Screen */}
      {showSplash && <SplashScreen onFinish={handleFinishSplash} />}

      {/* 2. PWA Utilities */}
      {currentScreen === 'home' && <InstallPrompt />}
      <ReorientationOverlay />

      {/* 3. Unified Auth Modal (Guru & Siswa) */}
      <UnifiedAuthModal
        isOpen={isAuthModalOpen}
        initialTab={authInitialTab}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginTeacher={handleTeacherLoginSuccess}
        onLoginStudent={handleStudentLoginSuccess}
        playClick={playClick}
      />

      {/* Loading state jika layar bergantung pada kuis yang sedang dipulihkan */}
      {['arena', 'student-lobby', 'result', 'worksheet-print'].includes(currentScreen) && !activeQuiz && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-slate-600 dark:text-slate-300 animate-fade-in">
          <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="font-bold text-sm">Menyiapkan data kuis...</p>
        </div>
      )}

      {/* 4. Main Screen Views */}
      {currentScreen === 'home' && (
        <QuizHome
          onSelectQuiz={handleSelectQuiz}
          onOpenTeacherPortal={handleTeacherPortalClick}
          onOpenAuthModal={handleOpenAuthModal}
          onEnterPin={handleEnterPinLobby}
          teacher={teacher}
          onTeacherLogout={handleTeacherLogout}
          onPrintWorksheet={handlePrintWorksheet}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          playClick={playClick}
        />
      )}

      {currentScreen === 'student-lobby' && activeQuiz && (
        <StudentLobby
          quiz={activeQuiz}
          onStartQuiz={(mode) => {
            if (mode) setActiveGameMode(mode);
            setCurrentScreen('arena');
            saveNavigationState({ screen: 'arena', quiz: activeQuiz, replace: false });
          }}
          onBackToHome={handleGoHome}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          playClick={playClick}
        />
      )}

      {currentScreen === 'creator' && teacher && (
        <QuizCreator
          editingQuiz={editingQuiz}
          initialMode={creatorInitialMode}
          onBack={() => {
            setEditingQuiz(null);
            setReopenMethodModal(false);
            setCurrentScreen('teacher-dashboard');
            saveNavigationState({ screen: 'teacher-dashboard', replace: false });
          }}
          onBackToMethodSelection={() => {
            setEditingQuiz(null);
            setReopenMethodModal(true);
            setCurrentScreen('teacher-dashboard');
            saveNavigationState({ screen: 'teacher-dashboard', replace: false });
          }}
          onSaveQuiz={handleSaveCreatedQuiz}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          playClick={playClick}
        />
      )}

      {currentScreen === 'teacher-dashboard' && teacher && (
        <TeacherDashboard
          teacher={teacher}
          onLogout={handleTeacherLogout}
          onGoHome={handleGoHome}
          onOpenCreator={(quizToEdit?: Quiz, mode?: 'ai' | 'manual') => {
            setEditingQuiz(quizToEdit || null);
            setCreatorInitialMode(mode || (quizToEdit ? 'manual' : 'manual'));
            setReopenMethodModal(false);
            setCurrentScreen('creator');
            saveNavigationState({ screen: 'creator', quiz: quizToEdit, creatorMode: mode || (quizToEdit ? 'manual' : 'manual'), replace: false });
          }}
          onLaunchSmartboard={handleLaunchSmartboard}
          onPrintWorksheet={handlePrintWorksheet}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          playClick={playClick}
          initialOpenMethodModal={reopenMethodModal}
        />
      )}

      {currentScreen === 'worksheet-print' && activeQuiz && (
        <WorksheetPrintView
          quiz={activeQuiz}
          onBack={() => {
            if (teacher) {
              setCurrentScreen('teacher-dashboard');
            } else {
              setCurrentScreen('home');
            }
          }}
          playClick={playClick}
        />
      )}

      {currentScreen === 'arena' && activeQuiz && (
        <QuizArena
          quiz={activeQuiz}
          initialMode={activeGameMode}
          onFinishQuiz={handleFinishQuiz}
          onExit={handleGoHome}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          playClick={playClick}
          playCorrect={playCorrect}
          playWrong={playWrong}
          playTick={playTick}
          playReveal={playReveal}
          playApplause={playApplause}
        />
      )}

      {currentScreen === 'result' && activeQuiz && (
        <QuizResult
          quiz={activeQuiz}
          answers={lastAnswers}
          totalTimeSpent={lastTimeSpent}
          onReplay={handleReplay}
          onGoHome={handleGoHome}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          playClick={playClick}
          playCelebration={playCelebration}
        />
      )}
    </div>
  );
};
