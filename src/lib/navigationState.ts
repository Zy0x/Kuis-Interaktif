import type { Quiz, QuizAttemptAnswer, ScreenState } from '../types/quiz';

export type TeacherTabState = 'collection' | 'live_sessions' | 'quizzes' | 'submissions' | 'generator';

export interface SavedNavigationState {
  screen: ScreenState;
  quizId?: string;
  pin?: string;
  teacherTab?: TeacherTabState;
  creatorMode?: 'ai' | 'manual';
  hostSessionId?: string;
  recapSessionId?: string;
  detailQuizId?: string;
  studentWaiting?: boolean;
  lastAnswers?: QuizAttemptAnswer[];
  lastTimeSpent?: number;
  timestamp: number;
}

const NAV_SESSION_KEY = 'kuis_app_nav_session_v1';
const SPLASH_SHOWN_KEY = 'kuis_splash_shown_session';

/**
 * Menyimpan status navigasi layar aktif ke URL dan sessionStorage
 */
export function saveNavigationState(state: {
  screen: ScreenState;
  quiz?: Quiz | null;
  quizId?: string;
  pin?: string;
  teacherTab?: TeacherTabState;
  creatorMode?: 'ai' | 'manual';
  hostSessionId?: string | null;
  recapSessionId?: string | null;
  detailQuizId?: string | null;
  studentWaiting?: boolean;
  lastAnswers?: QuizAttemptAnswer[];
  lastTimeSpent?: number;
  replace?: boolean;
}) {
  if (typeof window === 'undefined') return;

  const quizId = state.quizId || state.quiz?.id;
  let pin = state.pin || state.quiz?.pinCode;
  if (!pin && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlPin = params.get('pin');
    if (urlPin) {
      pin = urlPin;
    } else {
      try {
        const raw = sessionStorage.getItem(NAV_SESSION_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.pin) pin = s.pin;
        }
      } catch {}
    }
  }

  // Pertahankan tab aktif guru jika tidak secara eksplisit diubah
  let resolvedTab = state.teacherTab;
  if (!resolvedTab && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab') as TeacherTabState | null;
    if (urlTab && ['collection', 'live_sessions', 'quizzes', 'submissions', 'generator'].includes(urlTab)) {
      resolvedTab = urlTab;
    } else {
      try {
        const raw = sessionStorage.getItem(NAV_SESSION_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.teacherTab && ['collection', 'live_sessions', 'quizzes', 'submissions', 'generator'].includes(s.teacherTab)) {
            resolvedTab = s.teacherTab;
          }
        }
      } catch {}
    }
  }

  // Pertahankan creatorMode jika sedang di layar creator
  let resolvedCreatorMode = state.creatorMode;
  if (!resolvedCreatorMode && state.screen === 'creator' && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode') as 'ai' | 'manual' | null;
    if (urlMode === 'ai' || urlMode === 'manual') {
      resolvedCreatorMode = urlMode;
    } else {
      try {
        const raw = sessionStorage.getItem(NAV_SESSION_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.creatorMode === 'ai' || s.creatorMode === 'manual') {
            resolvedCreatorMode = s.creatorMode;
          }
        }
      } catch {}
    }
  }

  // Pertahankan hostSessionId jika tidak secara eksplisit diubah
  let resolvedHostSessionId = state.hostSessionId;
  if (resolvedHostSessionId === undefined && state.screen === 'teacher-dashboard' && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlHost = params.get('hostSession');
    if (urlHost) {
      resolvedHostSessionId = urlHost;
    } else {
      try {
        const raw = sessionStorage.getItem(NAV_SESSION_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.hostSessionId) resolvedHostSessionId = s.hostSessionId;
        }
      } catch {}
    }
  }

  // Pertahankan recapSessionId jika tidak secara eksplisit diubah
  let resolvedRecapSessionId = state.recapSessionId;
  if (resolvedRecapSessionId === undefined && state.screen === 'teacher-dashboard' && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlRecap = params.get('recapSession');
    if (urlRecap) {
      resolvedRecapSessionId = urlRecap;
    } else {
      try {
        const raw = sessionStorage.getItem(NAV_SESSION_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.recapSessionId) resolvedRecapSessionId = s.recapSessionId;
        }
      } catch {}
    }
  }

  // Pertahankan detailQuizId jika tidak secara eksplisit diubah
  let resolvedDetailQuizId = state.detailQuizId;
  if (resolvedDetailQuizId === undefined && state.screen === 'teacher-dashboard' && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlDetail = params.get('detailQuiz');
    if (urlDetail) {
      resolvedDetailQuizId = urlDetail;
    } else {
      try {
        const raw = sessionStorage.getItem(NAV_SESSION_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.detailQuizId) resolvedDetailQuizId = s.detailQuizId;
        }
      } catch {}
    }
  }

  const payload: SavedNavigationState = {
    screen: state.screen,
    quizId,
    pin,
    teacherTab: resolvedTab || undefined,
    creatorMode: resolvedCreatorMode || undefined,
    hostSessionId: resolvedHostSessionId || undefined,
    recapSessionId: resolvedRecapSessionId || undefined,
    detailQuizId: resolvedDetailQuizId || undefined,
    studentWaiting: state.studentWaiting,
    lastAnswers: state.lastAnswers,
    lastTimeSpent: state.lastTimeSpent,
    timestamp: Date.now(),
  };

  try {
    sessionStorage.setItem(NAV_SESSION_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Gagal menyimpan sesi navigasi ke sessionStorage:', err);
  }

  // Sinkronkan ke URL Search Params tanpa reload halaman
  try {
    const url = new URL(window.location.href);
    
    if (state.screen === 'home') {
      url.searchParams.delete('screen');
      url.searchParams.delete('quiz');
      url.searchParams.delete('tab');
      url.searchParams.delete('mode');
      url.searchParams.delete('hostSession');
      url.searchParams.delete('recapSession');
      url.searchParams.delete('detailQuiz');
      if (!pin) url.searchParams.delete('pin');
    } else {
      url.searchParams.set('screen', state.screen);
      if (quizId) url.searchParams.set('quiz', quizId);
      else url.searchParams.delete('quiz');

      if (pin) url.searchParams.set('pin', pin);
      
      if (state.screen === 'teacher-dashboard') {
        if (resolvedTab && resolvedTab !== 'collection' && resolvedTab !== 'quizzes') {
          url.searchParams.set('tab', resolvedTab);
        } else {
          url.searchParams.delete('tab');
        }

        if (resolvedHostSessionId) {
          url.searchParams.set('hostSession', resolvedHostSessionId);
        } else {
          url.searchParams.delete('hostSession');
        }

        if (resolvedRecapSessionId) {
          url.searchParams.set('recapSession', resolvedRecapSessionId);
        } else {
          url.searchParams.delete('recapSession');
        }

        if (resolvedDetailQuizId) {
          url.searchParams.set('detailQuiz', resolvedDetailQuizId);
        } else {
          url.searchParams.delete('detailQuiz');
        }
      } else {
        url.searchParams.delete('tab');
        url.searchParams.delete('hostSession');
        url.searchParams.delete('recapSession');
        url.searchParams.delete('detailQuiz');
      }

      if (state.screen === 'creator' && resolvedCreatorMode) {
        url.searchParams.set('mode', resolvedCreatorMode);
      } else {
        url.searchParams.delete('mode');
      }
    }

    const newUrl = url.pathname + (url.search ? url.search : '') + url.hash;
    if (state.replace !== false) {
      window.history.replaceState({ screen: state.screen, quizId }, '', newUrl);
    } else {
      window.history.pushState({ screen: state.screen, quizId }, '', newUrl);
    }
  } catch {
    // Ignore history API errors
  }
}

/**
 * Memulihkan status navigasi layar dari URL / sessionStorage saat halaman dimuat ulang (F5)
 */
export function restoreNavigationState(): {
  screen: ScreenState;
  quizId?: string;
  pin?: string;
  teacherTab?: TeacherTabState;
  creatorMode?: 'ai' | 'manual';
  hostSessionId?: string;
  recapSessionId?: string;
  detailQuizId?: string;
  studentWaiting?: boolean;
  lastAnswers?: QuizAttemptAnswer[];
  lastTimeSpent?: number;
  isRestored: boolean;
} {
  if (typeof window === 'undefined') {
    return { screen: 'home', isRestored: false };
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const screenParam = params.get('screen') as ScreenState | null;
    const quizParam = params.get('quiz');
    const pinParam = params.get('pin');
    const tabParam = params.get('tab') as TeacherTabState | null;
    const modeParam = params.get('mode') as 'ai' | 'manual' | null;
    const hostParam = params.get('hostSession');
    const recapParam = params.get('recapSession');
    const detailParam = params.get('detailQuiz');

    let sessionData: SavedNavigationState | null = null;
    try {
      const raw = sessionStorage.getItem(NAV_SESSION_KEY);
      if (raw) {
        sessionData = JSON.parse(raw);
      }
    } catch {
      // ignore
    }

    const targetScreen = screenParam || sessionData?.screen;

    if (targetScreen && targetScreen !== 'home') {
      return {
        screen: targetScreen,
        quizId: quizParam || sessionData?.quizId,
        pin: pinParam || sessionData?.pin,
        teacherTab: tabParam || sessionData?.teacherTab || 'collection',
        creatorMode: (modeParam === 'ai' || modeParam === 'manual') ? modeParam : sessionData?.creatorMode,
        hostSessionId: hostParam || sessionData?.hostSessionId,
        recapSessionId: recapParam || sessionData?.recapSessionId,
        detailQuizId: detailParam || sessionData?.detailQuizId,
        studentWaiting: sessionData?.studentWaiting,
        lastAnswers: sessionData?.lastAnswers || [],
        lastTimeSpent: sessionData?.lastTimeSpent || 0,
        isRestored: true,
      };
    }

    if (pinParam) {
      return {
        screen: 'student-lobby',
        pin: pinParam,
        isRestored: true,
      };
    }

    if (quizParam) {
      return {
        screen: 'student-lobby',
        quizId: quizParam,
        isRestored: true,
      };
    }
  } catch (err) {
    console.warn('Gagal memulihkan navigasi:', err);
  }

  return { screen: 'home', isRestored: false };
}

/**
 * Menghapus status navigasi (kembali ke beranda bersih)
 */
export function clearNavigationState() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(NAV_SESSION_KEY);
    const url = new URL(window.location.href);
    url.searchParams.delete('screen');
    url.searchParams.delete('quiz');
    url.searchParams.delete('pin');
    url.searchParams.delete('tab');
    url.searchParams.delete('mode');
    url.searchParams.delete('hostSession');
    url.searchParams.delete('recapSession');
    url.searchParams.delete('detailQuiz');
    window.history.replaceState({ screen: 'home' }, '', url.pathname + (url.hash || ''));
  } catch {
    // ignore
  }
}

/**
 * Cek penanda splash screen sesi agar tidak memblokir pengguna saat reload
 */
export function hasSeenSplash(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(SPLASH_SHOWN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markSplashSeen() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SPLASH_SHOWN_KEY, 'true');
  } catch {
    // ignore
  }
}
