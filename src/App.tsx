import React, { useState } from 'react';
import type { Quiz, QuizAttemptAnswer } from './types/quiz';
import { SplashScreen } from './components/pwa/SplashScreen';
import { InstallPrompt } from './components/pwa/InstallPrompt';
import { ReorientationOverlay } from './components/pwa/ReorientationOverlay';
import { QuizHome } from './components/home/QuizHome';
import { QuizArena } from './components/arena/QuizArena';
import { QuizResult } from './components/result/QuizResult';
import { QuizCreator } from './components/creator/QuizCreator';
import { DataManager } from './lib/supabaseClient';
import { useSoundEffects } from './hooks/useSoundEffects';

type ScreenState = 'home' | 'arena' | 'result' | 'creator';

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('home');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [lastAnswers, setLastAnswers] = useState<QuizAttemptAnswer[]>([]);
  const [lastTimeSpent, setLastTimeSpent] = useState<number>(0);

  const {
    isMuted,
    toggleMute,
    playClick,
    playCorrect,
    playWrong,
    playCelebration,
  } = useSoundEffects();

  const handleSelectQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentScreen('arena');
  };

  const handleFinishQuiz = (answers: QuizAttemptAnswer[], timeSpent: number) => {
    setLastAnswers(answers);
    setLastTimeSpent(timeSpent);
    setCurrentScreen('result');
  };

  const handleReplay = () => {
    if (!activeQuiz) return;
    // Shuffle questions on replay
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
    setCurrentScreen('home');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-primary-500 selection:text-white">
      {/* 1. Animated Splash Screen */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* 2. PWA Utilities */}
      <InstallPrompt />
      <ReorientationOverlay />

      {/* 3. Screen Switcher */}
      {currentScreen === 'home' && (
        <QuizHome
          onSelectQuiz={handleSelectQuiz}
          onOpenCreator={() => setCurrentScreen('creator')}
          isMuted={isMuted}
          onToggleMute={toggleMute}
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
