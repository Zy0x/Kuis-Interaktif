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

type ScreenState = 
  | 'home' 
  | 'arena' 
  | 'result' 
  | 'creator' 
  | 'student-lobby' 
  | 'teacher-dashboard' 
  | 'worksheet-print';

export const App: React.FC = () => {
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

  const handleSaveCreatedQuiz = (newQuiz: Quiz) => {
    DataManager.saveCustomQuiz(newQuiz);
    playCelebration();
    if (teacher) {
      setCurrentScreen('teacher-dashboard');
    } else {
      setCurrentScreen('home');
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-primary-500 selection:text-white">
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
          playClick={playClick}
        />
      )}

      {currentScreen === 'creator' && (
        <QuizCreator
          onBack={handleGoHome}
          onSaveQuiz={handleSaveCreatedQuiz}
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
          playClick={playClick}
          playCelebration={playCelebration}
        />
      )}
    </div>
  );
};
