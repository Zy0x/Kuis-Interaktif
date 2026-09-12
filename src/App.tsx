import React, { useState, useEffect } from 'react';
import type { Quiz, QuizAttemptAnswer, TeacherProfile, ScreenState, GameMode, QuizSessionSettings, QuizSession } from './types/quiz';
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
import type { PlayQuizSessionOptions } from './components/teacher/PlayQuizModal';
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
  const [activeSession, setActiveSession] = useState<QuizSession | null>(null);
  const [activeSessionSettings, setActiveSessionSettings] = useState<QuizSessionSettings | undefined>(undefined);
  const [isJoinedViaStudentLobby, setIsJoinedViaStudentLobby] = useState(false);
  const [lastAnswers, setLastAnswers] = useState<QuizAttemptAnswer[]>(() => initialNav.lastAnswers || []);
  const [lastTimeSpent, setLastTimeSpent] = useState<number>(() => initialNav.lastTimeSpent || 0);

  // Unified Auth State
  const [teacher, setTeacher] = useState<TeacherProfile | null>(initialTeacher);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [creatorInitialMode, setCreatorInitialMode] = useState<'ai' | 'manual'>(() => {
    if (initialNav.creatorMode) return initialNav.creatorMode;
    return 'manual';
  });
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

  // Helper untuk menyelesaikan konfigurasi sesi atau fallback kuis
  const resolveSettings = (session?: QuizSession | null, q?: Quiz | null): QuizSessionSettings => {
    const base = session?.settings || q?.defaultSettings;
    return {
      executionMode: base?.executionMode || 'self_paced',
      teacherPacingSubMode: base?.teacherPacingSubMode || 'manual',
      isChatMuted: base?.isChatMuted ?? false,
      mode: base?.mode || q?.defaultGameMode || 'standard',
      durationPerQuestionSec: base?.durationPerQuestionSec || q?.durationPerQuestionSec || 30,
      shuffleQuestions: base?.shuffleQuestions ?? q?.shuffleQuestions ?? true,
      shuffleOptions: base?.shuffleOptions ?? q?.shuffleOptions ?? true,
      presentationTarget: base?.presentationTarget || 'student-lobby',
      showAnswersMode: base?.showAnswersMode || 'immediate',
      showExplanationMode: base?.showExplanationMode || 'immediate',
      showLeaderboardToStudents: base?.showLeaderboardToStudents ?? true,
      maxAttempts: base?.maxAttempts ?? 0,
      tabSwitchDetection: base?.tabSwitchDetection ?? false,
      overrideCustomQuestionDurations: base?.overrideCustomQuestionDurations,
      participantMode: base?.participantMode,
      pacingType: base?.pacingType,
      deadlineAt: base?.deadlineAt,
      requireStudentInfo: base?.requireStudentInfo,
      selectedQuestionIds: base?.selectedQuestionIds,
    };
  };

  // Memulihkan data kuis saat reload (F5) berdasarkan quizId atau pin
  useEffect(() => {
    const pinToMatch = (initialNav.pin || '').trim().toUpperCase();
    if (initialNav.quizId) {
      DataManager.getQuizById(initialNav.quizId).then((q) => {
        if (q) {
          const session = (pinToMatch ? DataManager.getActiveSessionByPin(pinToMatch) : null) || 
            DataManager.getActiveSessionByQuizId(q.id) || 
            (q.pinCode ? DataManager.getActiveSessionByPin(q.pinCode) : null);
          const settings = resolveSettings(session, q);
          setActiveQuiz(q);
          if (session) setActiveSession(session);
          setActiveSessionSettings(settings);
          setActiveGameMode(settings.mode);
        } else if (['arena', 'student-lobby', 'result', 'worksheet-print'].includes(currentScreen)) {
          console.warn('Kuis tidak ditemukan untuk sesi ini, kembali ke beranda.');
          setCurrentScreen('home');
          clearNavigationState();
        }
      });
    } else if (pinToMatch) {
      const session = DataManager.getActiveSessionByPin(pinToMatch);
      if (session) {
        setActiveSession(session);
        setActiveSessionSettings(session.settings);
        setActiveGameMode(session.settings.mode);
      }
      DataManager.getQuizByPin(pinToMatch).then((q) => {
        if (q) {
          const settings = resolveSettings(session, q);
          setActiveSessionSettings(settings);
          setActiveGameMode(settings.mode);
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
  }, [initialNav.quizId, initialNav.pin, currentScreen]);

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

  // Real-time Session Synchronization (BroadcastChannel, CustomEvent, and Cross-Window Storage)
  useEffect(() => {
    const handleRealtimeSync = (session: QuizSession) => {
      if (!session) return;
      // Periksa apakah sesi ini cocok dengan kuis aktif atau sesi aktif saat ini
      const matchesActiveQuiz = activeQuiz && (activeQuiz.id === session.quizId || (activeQuiz.pinCode && activeQuiz.pinCode === session.pinCode));
      const matchesActiveSession = activeSession && activeSession.id === session.id;

      if (matchesActiveQuiz || matchesActiveSession) {
        setActiveSession(session);
        const resolved = resolveSettings(session, activeQuiz);
        setActiveSessionSettings(resolved);
        setActiveGameMode(resolved.mode);
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('kuis_realtime_session_sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'SESSION_UPDATED' && event.data.session) {
            handleRealtimeSync(event.data.session);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel error in App:', e);
    }

    const handleCustom = (e: Event) => {
      const evt = e as CustomEvent;
      if (evt.detail?.session) {
        handleRealtimeSync(evt.detail.session);
      }
    };
    window.addEventListener('kuis_session_updated', handleCustom);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kuis_sd_quiz_sessions_v1' && e.newValue) {
        try {
          const sessions: QuizSession[] = JSON.parse(e.newValue);
          const currentPin = activeQuiz?.pinCode || activeSession?.pinCode;
          const currentQuizId = activeQuiz?.id || activeSession?.quizId;
          const matching = sessions.find(
            (s) => (currentPin && s.pinCode === currentPin) || (currentQuizId && s.quizId === currentQuizId)
          );
          if (matching) {
            handleRealtimeSync(matching);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('kuis_session_updated', handleCustom);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeQuiz, activeSession]);

  const handleSelectQuiz = (quiz: Quiz, mode?: GameMode) => {
    setActiveQuiz(quiz);
    setActiveGameMode(mode || quiz.defaultGameMode || 'standard');
    setCurrentScreen('arena');
    saveNavigationState({ screen: 'arena', quiz, replace: false });
  };

  const handleEnterPinLobby = (quiz: Quiz, session?: QuizSession | null) => {
    const pin = quiz.pinCode || '';
    const resolvedSession = session || DataManager.getActiveSessionByPin(pin) || DataManager.getActiveSessionByQuizId(quiz.id);
    const settings = resolveSettings(resolvedSession, quiz);

    setActiveSession(resolvedSession || null);
    setActiveSessionSettings(settings);
    setActiveGameMode(settings.mode);
    setActiveQuiz(quiz);
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

  const handleStartQuizWithSettings = (quiz: Quiz, options: PlayQuizSessionOptions) => {
    const settings: QuizSessionSettings = {
      mode: options.mode,
      durationPerQuestionSec: options.durationPerQuestionSec,
      shuffleQuestions: options.shuffleQuestions,
      shuffleOptions: options.shuffleOptions,
      presentationTarget: options.presentationTarget,
      showAnswersMode: options.showAnswersMode,
      showExplanationMode: options.showExplanationMode,
      showLeaderboardToStudents: options.showLeaderboardToStudents,
      maxAttempts: options.maxAttempts,
      tabSwitchDetection: options.tabSwitchDetection,
      executionMode: options.executionMode,
      participantMode: options.participantMode,
      pacingType: options.pacingType,
      deadlineAt: options.deadlineAt,
      requireStudentInfo: options.requireStudentInfo,
      selectedQuestionIds: options.selectedQuestionIds,
    };

    const sessionQuiz: Quiz = {
      ...quiz,
      defaultGameMode: options.mode,
      durationPerQuestionSec: options.durationPerQuestionSec,
      shuffleQuestions: options.shuffleQuestions,
      shuffleOptions: options.shuffleOptions,
      defaultSettings: settings,
    };
    setActiveQuiz(sessionQuiz);
    setActiveGameMode(options.mode);
    setActiveSessionSettings(settings);
    const resolvedSession = DataManager.getActiveSessionByPin(quiz.pinCode || '') || DataManager.getActiveSessionByQuizId(quiz.id);
    setActiveSession(resolvedSession || null);

    if (options.presentationTarget === 'student-lobby') {
      setCurrentScreen('student-lobby');
      saveNavigationState({ screen: 'student-lobby', quiz: sessionQuiz, replace: false });
    } else {
      setCurrentScreen('arena');
      saveNavigationState({ screen: 'arena', quiz: sessionQuiz, replace: false });
    }
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
          onTeacherUpdate={(updated) => setTeacher(updated)}
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
          sessionSettings={activeSessionSettings || (activeQuiz.defaultSettings as QuizSessionSettings)}
          activeSession={activeSession}
          onStartQuiz={async () => {
            if (activeSession) {
              const profile = DataManager.getPlayerProfile();
              try {
                await DataManager.addOrUpdateSessionParticipant(activeSession.id, {
                  name: profile.nickname || 'Siswa Pintar',
                  avatarId: profile.avatarId || 'lion',
                });
              } catch (err) {
                console.warn('Gagal mendaftarkan peserta ke sesi kuis:', err);
              }
            }
            setIsJoinedViaStudentLobby(true);
            setCurrentScreen('arena');
            saveNavigationState({ screen: 'arena', quiz: activeQuiz, replace: false });
          }}
          onBackToHome={() => {
            if (teacher) {
              setCurrentScreen('teacher-dashboard');
              saveNavigationState({ screen: 'teacher-dashboard', replace: false });
            } else {
              handleGoHome();
            }
          }}
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
            setCurrentScreen('teacher-dashboard');
            saveNavigationState({ screen: 'teacher-dashboard', replace: false });
          }}
          onSaveQuiz={handleSaveCreatedQuiz}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          playClick={playClick}
          playCorrect={playCorrect}
          playWrong={playWrong}
          playTick={playTick}
          playReveal={playReveal}
          playApplause={playApplause}
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
            setCurrentScreen('creator');
            saveNavigationState({ screen: 'creator', quiz: quizToEdit, creatorMode: mode || (quizToEdit ? 'manual' : 'manual'), replace: false });
          }}
          onLaunchSmartboard={handleLaunchSmartboard}
          onPrintWorksheet={handlePrintWorksheet}
          onStartQuiz={handleStartQuizWithSettings}
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
          initialMode={activeGameMode}
          sessionSettings={activeSessionSettings || (activeQuiz.defaultSettings as QuizSessionSettings)}
          activeSessionId={activeSession?.id}
          isTeacher={Boolean(teacher) && activeSessionSettings?.presentationTarget === 'smartboard' && !initialNav.pin && !isJoinedViaStudentLobby}
          onFinishQuiz={handleFinishQuiz}
          onExit={() => {
            setIsJoinedViaStudentLobby(false);
            if (teacher) {
              setCurrentScreen('teacher-dashboard');
              saveNavigationState({ screen: 'teacher-dashboard', replace: false });
            } else {
              handleGoHome();
            }
          }}
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
