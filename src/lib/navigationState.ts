import type { Quiz, QuizAttemptAnswer, ScreenState } from '../types/quiz';

export interface SavedNavigationState {
  screen: ScreenState;
  quizId?: string;
  pin?: string;
  teacherTab?: 'quizzes' | 'submissions' | 'generator';
  creatorMode?: 'ai' | 'manual';
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
  teacherTab?: 'quizzes' | 'submissions' | 'generator';
  creatorMode?: 'ai' | 'manual';
  lastAnswers?: QuizAttemptAnswer[];
  lastTimeSpent?: number;
  replace?: boolean;
}) {
  if (typeof window === 'undefined') return;

  const quizId = state.quizId || state.quiz?.id;
  const pin = state.quiz?.pinCode;

  // Pertahankan tab aktif guru jika tidak secara eksplisit diubah
  let resolvedTab = state.teacherTab;
  if (!resolvedTab && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab') as ('quizzes' | 'submissions' | 'generator') | null;
    if (urlTab && ['quizzes', 'submissions', 'generator'].includes(urlTab)) {
      resolvedTab = urlTab;
    } else {
      try {
        const raw = sessionStorage.getItem(NAV_SESSION_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.teacherTab && ['quizzes', 'submissions', 'generator'].includes(s.teacherTab)) {
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

  const payload: SavedNavigationState = {
    screen: state.screen,
    quizId,
    pin,
    teacherTab: resolvedTab || undefined,
    creatorMode: resolvedCreatorMode || undefined,
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
      if (!pin) url.searchParams.delete('pin');
    } else {
      url.searchParams.set('screen', state.screen);
      if (quizId) url.searchParams.set('quiz', quizId);
      else url.searchParams.delete('quiz');

      if (pin) url.searchParams.set('pin', pin);
      
      if (state.screen === 'teacher-dashboard' && resolvedTab && resolvedTab !== 'quizzes') {
        url.searchParams.set('tab', resolvedTab);
      } else {
        url.searchParams.delete('tab');
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
  teacherTab?: 'quizzes' | 'submissions' | 'generator';
  creatorMode?: 'ai' | 'manual';
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
    const tabParam = params.get('tab') as 'quizzes' | 'submissions' | 'generator' | null;
    const modeParam = params.get('mode') as 'ai' | 'manual' | null;

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
        teacherTab: tabParam || sessionData?.teacherTab || 'quizzes',
        creatorMode: (modeParam === 'ai' || modeParam === 'manual') ? modeParam : sessionData?.creatorMode,
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
