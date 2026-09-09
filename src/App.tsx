import React, { useState, useEffect } from 'react';
import type { Quiz, QuizAttemptAnswer, TeacherProfile } from './types/quiz';
import { SplashScreen } from './components/pwa/SplashScreen';
import { InstallPrompt } from './components/pwa/InstallPrompt';
import { ReorientationOverlay } from './components/pwa/ReorientationOverlay';
import { QuizHome } from './components/home/QuizHome';
import { QuizArena } from './components/arena/QuizArena';
import { QuizResult } from './components/result/QuizResult';
import { QuizCreator } from './components/creator/QuizCreator';
import { StudentLobby } from './components/lobby/StudentLobby';
import { TeacherAuthModal } from './components/auth/TeacherAuthModal';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { WorksheetPrintView } from './components/print/WorksheetPrintView';
import { DataManager } from './lib/supabaseClient';
import { useSoundEffects } from './hooks/useSoundEffects';
import { useBackHandler } from './lib/navigationHistory';
import { useTheme } from './hooks/useTheme';
import { BackGestureIndicator } from './components/common/BackGestureIndicator';

type ScreenState = 
  | 'home' 
  | 'arena' 
  | 'result' 
  | 'creator' 
  | 'student-lobby' 
  | 'teacher-dashboard' 
  | 'worksheet-print';

export const App: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('home');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [lastAnswers, setLastAnswers] = useState<QuizAttemptAnswer[]>([]);
  const [lastTimeSpent, setLastTimeSpent] = useState<number>(0);

  // Teacher State
  const [teacher, setTeacher] = useState<TeacherProfile | null>(() => DataManager.getTeacherProfile());
  const [isTeacherAuthOpen, setIsTeacherAuthOpen] = useState(false);

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

  // Detect URL parameter (?pin=XXXX or ?quiz=XXXX) for Student direct link access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pin = params.get('pin');
    const quizId = params.get('quiz');

    if (pin) {
      DataManager.getQuizByPin(pin).then((q) => {
        if (q) {
          setActiveQuiz(q);
          setCurrentScreen('student-lobby');
        }
      });
    } else if (quizId) {
      DataManager.getQuizById(quizId).then((q) => {
        if (q) {
          setActiveQuiz(q);
          setCurrentScreen('student-lobby');
        }
      });
    }
  }, []);

  const handleSelectQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentScreen('arena');
  };

  const handleEnterPinLobby = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentScreen('student-lobby');
  };

  const handleFinishQuiz = (answers: QuizAttemptAnswer[], timeSpent: number) => {
    setLastAnswers(answers);
    setLastTimeSpent(timeSpent);
    setCurrentScreen('result');
  };

  const handleReplay = () => {
    if (!activeQuiz) return;
    const shuffledQuiz: Quiz = {
      ...activeQuiz,
      questions: [...activeQuiz.questions].sort(() => Math.random() - 0.5),
    };
    setActiveQuiz(shuffledQuiz);
    setCurrentScreen('arena');
  };

  const handleGoHome = () => {
    setActiveQuiz(null);
    setCurrentScreen('home');
  };

  // RBAC Guard: Cegah peran Siswa atau Tamu mengakses rute pembuat kuis atau dashboard guru
  useEffect(() => {
    if (!teacher && (currentScreen === 'creator' || currentScreen === 'teacher-dashboard')) {
      console.warn('RBAC Guard: Akses rute khusus guru dialihkan ke beranda.');
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
      setCurrentScreen('teacher-dashboard');
    } catch (err) {
      console.error('Gagal menyimpan kuis:', err);
    }
  };

  const handleTeacherPortalClick = () => {
    if (teacher) {
      setCurrentScreen('teacher-dashboard');
    } else {
      setIsTeacherAuthOpen(true);
    }
  };

  const handleTeacherLoginSuccess = (teacherProfile: TeacherProfile) => {
    setTeacher(teacherProfile);
    playCelebration();
    setCurrentScreen('teacher-dashboard');
  };

  const handleTeacherLogout = async () => {
    await DataManager.signOutTeacher();
    setTeacher(null);
    setCurrentScreen('home');
  };

  const handleLaunchSmartboard = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentScreen('arena');
  };

  const handlePrintWorksheet = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentScreen('worksheet-print');
  };

  // 1. Level 1 (Prioritas 100): Modal Login Guru
  useBackHandler('app-teacher-auth-modal', 100, () => {
    if (isTeacherAuthOpen) {
      setIsTeacherAuthOpen(false);
      return true;
    }
    return false;
  }, isTeacherAuthOpen);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-primary-500 selection:text-white">
      {/* Visual Feedback on Back Gesture */}
      <BackGestureIndicator />

      {/* 1. Animated Splash Screen */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* 2. PWA Utilities */}
      <InstallPrompt />
      <ReorientationOverlay />

      {/* 3. Teacher Auth Modal */}
      <TeacherAuthModal
        isOpen={isTeacherAuthOpen}
        onClose={() => setIsTeacherAuthOpen(false)}
        onLoginSuccess={handleTeacherLoginSuccess}
        playClick={playClick}
      />

      {/* 4. Main Screen Views */}
      {currentScreen === 'home' && (
        <QuizHome
          onSelectQuiz={handleSelectQuiz}
          onOpenTeacherPortal={handleTeacherPortalClick}
          onEnterPin={handleEnterPinLobby}
          teacher={teacher}
          onTeacherLogout={handleTeacherLogout}
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
          onStartQuiz={() => setCurrentScreen('arena')}
          onBackToHome={handleGoHome}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          playClick={playClick}
        />
      )}

      {currentScreen === 'creator' && teacher && (
        <QuizCreator
          onBack={handleGoHome}
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
          onOpenCreator={() => setCurrentScreen('creator')}
          onLaunchSmartboard={handleLaunchSmartboard}
          onPrintWorksheet={handlePrintWorksheet}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          playClick={playClick}
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
