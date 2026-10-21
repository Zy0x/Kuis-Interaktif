import React, { useState, useEffect, useMemo } from 'react';
import type { Quiz, TeacherProfile, Subject, QuizSession } from '../../types/quiz';
import { MASTER_TEACHER_EMAIL } from '../../types/quiz';
import { DataManager } from '../../lib/supabaseClient';
import { useBackHandler } from '../../lib/navigationHistory';
import { copyTextToClipboard } from '../../lib/aiQuestionParser';
import { ThemeToggle } from '../common/ThemeToggle';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { QuizSettingsModal } from '../common/QuizSettingsModal';
import { QuizCoverDisplay } from '../common/QuizCoverDisplay';
import { QuizDetail } from './QuizDetail';
import { CreateQuizMethodModal } from './CreateQuizMethodModal';
import { PlayQuizModal, type PlayQuizSessionOptions } from './PlayQuizModal';
import { WaygroundHostView } from './WaygroundHostView';
import { QuizSessionRecapView } from './QuizSessionRecapView';
import { AdminDatabaseBackupModal } from './AdminDatabaseBackupModal';
import { ExtendDeadlineModal } from './ExtendDeadlineModal';
import { ReactivateSessionModal } from './ReactivateSessionModal';
import { getAccurateDeadlineCountdown, useDeadlineTicker } from '../../lib/deadlineUtils';
import { formatIndonesianTime } from '../../lib/dateUtils';
import { saveNavigationState, type TeacherTabState } from '../../lib/navigationState';
import { 
  GraduationCap, 
  Plus, 
  Play, 
  Copy, 
  Check, 
  LogOut, 
  ArrowLeft, 
  Share2, 
  Lock, 
  Database, 
  Globe, 
  RotateCcw, 
  MoreVertical, 
  HelpCircle, 
  Clock, 
  Search, 
  X, 
  BookOpen, 
  BarChart3,
  Radio,
  Trash2,
  Users,
  CheckCircle2,
  Pause,
  FileSpreadsheet,
  Tv,
  ClipboardList,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

const getSubjectBadge = (subject: string) => {
  switch (subject) {
    case 'Matematika':
      return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60';
    case 'IPA':
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
    case 'Bahasa Indonesia':
      return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60';
    case 'Pendidikan Pancasila':
      return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
};

interface TeacherDashboardProps {
  teacher: TeacherProfile;
  initialHostSessionId?: string;
  initialRecapSessionId?: string;
  initialDetailQuizId?: string;
  initialTab?: TeacherTabState;
  onLogout: () => void;
  onGoHome: () => void;
  onOpenCreator: (quizToEdit?: Quiz, mode?: 'ai' | 'manual') => void;
  onLaunchSmartboard: (quiz: Quiz) => void;
  onPrintWorksheet: (quiz: Quiz) => void;
  onStartQuiz?: (quiz: Quiz, options: PlayQuizSessionOptions) => void;
  playClick: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  teacher,
  initialHostSessionId,
  initialRecapSessionId,
  initialDetailQuizId,
  initialTab,
  onLogout,
  onGoHome,
  onOpenCreator,
  onLaunchSmartboard,
  onPrintWorksheet,
  onStartQuiz: _onStartQuiz,
  playClick,
  isDark = false,
  onToggleTheme = () => {},
}) => {
  // 1. Data lokal instan agar saat reload halaman tidak terjadi flicker atau quiz kosong
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    return DataManager.getAllQuizzes({ teacherEmail: teacher.email, teacherId: teacher.id });
  });

  const [selectedQuizForDetail, setSelectedQuizForDetail] = useState<Quiz | null>(() => {
    if (typeof window === 'undefined') return null;
    const targetId = initialDetailQuizId || new URLSearchParams(window.location.search).get('detailQuiz') || sessionStorage.getItem('kuis_teacher_active_detail_quiz_id');
    if (targetId) {
      const all = DataManager.getAllQuizzes({ teacherEmail: teacher.email, teacherId: teacher.id });
      return all.find((q) => q.id === targetId) || null;
    }
    return null;
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [quizToPlay, setQuizToPlay] = useState<Quiz | null>(null);

  // Main Tab Navigation State: 'collection' | 'live_sessions' (persisten di URL & sessionStorage)
  const [activeMainTab, setActiveMainTab] = useState<'collection' | 'live_sessions'>(() => {
    if (initialTab === 'live_sessions') return 'live_sessions';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'live_sessions') return 'live_sessions';
      const saved = sessionStorage.getItem('kuis_teacher_active_main_tab');
      if (saved === 'live_sessions') return 'live_sessions';
    }
    return 'collection';
  });

  // Active Sessions States (persisten di URL & sessionStorage saat Guru di Ruang Tunggu Host atau Rekap)
  const [sessions, setSessions] = useState<QuizSession[]>(() => {
    return DataManager.getActiveSessions({ teacherEmail: teacher.email });
  });
  const [sessionFilter, setSessionFilter] = useState<'all' | 'active' | 'finished'>('all');

  const [selectedSessionForHost, setSelectedSessionForHost] = useState<QuizSession | null>(() => {
    if (typeof window === 'undefined') return null;
    const targetHostId = initialHostSessionId || new URLSearchParams(window.location.search).get('hostSession') || sessionStorage.getItem('kuis_teacher_active_host_session_id');
    if (targetHostId) {
      const s = DataManager.getActiveSessionById(targetHostId);
      if (s && s.status !== 'finished') {
        return s;
      }
    }
    return null;
  });

  const [selectedSessionForRecap, setSelectedSessionForRecap] = useState<QuizSession | null>(() => {
    if (typeof window === 'undefined') return null;
    const targetRecapId = initialRecapSessionId || new URLSearchParams(window.location.search).get('recapSession') || sessionStorage.getItem('kuis_teacher_active_recap_session_id');
    if (targetRecapId) {
      const s = DataManager.getActiveSessionById(targetRecapId);
      if (s) {
        return s;
      }
    }
    return null;
  });

  const [sessionToDelete, setSessionToDelete] = useState<QuizSession | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<Subject | 'Semua'>('Semua');
  const [filterGrade, setFilterGrade] = useState<number | 'Semua'>('Semua');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'private'>('all');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'questions_desc'>('newest');

  // Copy & Action States
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);
  const [selectedQuizForSettings, setSelectedQuizForSettings] = useState<Quiz | null>(null);
  const [deletedCount, setDeletedCount] = useState<number>(() => DataManager.getDeletedQuizIds().length);
  const isMasterTeacher = teacher.email.trim().toLowerCase() === MASTER_TEACHER_EMAIL.toLowerCase();
  const [isAdminBackupModalOpen, setIsAdminBackupModalOpen] = useState(false);

  // Mode Mandiri / PR States & Deadline Ticker
  const nowMs = useDeadlineTicker(1000);
  const [sessionToExtendDeadline, setSessionToExtendDeadline] = useState<QuizSession | null>(null);
  const [sessionToReactivate, setSessionToReactivate] = useState<QuizSession | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeSessionBannerIdx, setActiveSessionBannerIdx] = useState(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4000);
  };

  // Sinkronisasi status host session ke URL dan sessionStorage agar tahan refresh halaman
  useEffect(() => {
    if (selectedSessionForHost) {
      try {
        sessionStorage.setItem('kuis_teacher_active_host_session_id', selectedSessionForHost.id);
      } catch {}
      saveNavigationState({ screen: 'teacher-dashboard', hostSessionId: selectedSessionForHost.id });
    } else {
      try {
        sessionStorage.removeItem('kuis_teacher_active_host_session_id');
      } catch {}
      saveNavigationState({ screen: 'teacher-dashboard', hostSessionId: null });
    }
  }, [selectedSessionForHost?.id]);

  // Sinkronisasi status recap session ke URL dan sessionStorage agar tahan refresh halaman
  useEffect(() => {
    if (selectedSessionForRecap) {
      try {
        sessionStorage.setItem('kuis_teacher_active_recap_session_id', selectedSessionForRecap.id);
      } catch {}
      saveNavigationState({ screen: 'teacher-dashboard', recapSessionId: selectedSessionForRecap.id });
    } else {
      try {
        sessionStorage.removeItem('kuis_teacher_active_recap_session_id');
      } catch {}
      saveNavigationState({ screen: 'teacher-dashboard', recapSessionId: null });
    }
  }, [selectedSessionForRecap?.id]);

  // Sinkronisasi detail kuis ke URL dan sessionStorage
  useEffect(() => {
    if (selectedQuizForDetail) {
      try {
        sessionStorage.setItem('kuis_teacher_active_detail_quiz_id', selectedQuizForDetail.id);
      } catch {}
      saveNavigationState({ screen: 'teacher-dashboard', detailQuizId: selectedQuizForDetail.id });
    } else {
      try {
        sessionStorage.removeItem('kuis_teacher_active_detail_quiz_id');
      } catch {}
      saveNavigationState({ screen: 'teacher-dashboard', detailQuizId: null });
    }
  }, [selectedQuizForDetail?.id]);

  // Sinkronisasi tab aktif ke sessionStorage & URL
  useEffect(() => {
    try {
      sessionStorage.setItem('kuis_teacher_active_main_tab', activeMainTab);
    } catch {}
    saveNavigationState({ screen: 'teacher-dashboard', teacherTab: activeMainTab });
  }, [activeMainTab]);

  // Navigation back handler
  useBackHandler('teacher-dashboard-main', 30, () => {
    if (selectedSessionForHost) {
      setSelectedSessionForHost(null);
      return true;
    }
    if (selectedSessionForRecap) {
      setSelectedSessionForRecap(null);
      return true;
    }
    if (selectedQuizForDetail) {
      setSelectedQuizForDetail(null);
      return true;
    }
    onGoHome();
    return true;
  }, true);

  useEffect(() => {
    loadData();

    const handleTestOpen = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail) {
        setQuizToPlay(customEvt.detail);
      }
    };
    window.addEventListener('test_open_play_modal', handleTestOpen);
    (window as any).__setQuizToPlay = setQuizToPlay;

    const handleProfileUpdated = () => {
      loadData();
    };
    window.addEventListener('kuis_teacher_profile_updated', handleProfileUpdated);

    return () => {
      window.removeEventListener('test_open_play_modal', handleTestOpen);
      window.removeEventListener('kuis_teacher_profile_updated', handleProfileUpdated);
    };
  }, []);
  // Sinyal detak keaktifan (heartbeat) berkala untuk seluruh sesi aktif milik guru yang sedang dibuka
  useEffect(() => {
    if (!teacher?.email) return;

    const sendTeacherHostHeartbeats = () => {
      const active = sessions.filter(
        (s) => s.status === 'active' || s.status === 'waiting' || s.status === 'paused'
      );
      active.forEach((s) => {
        DataManager.updateSessionHeartbeat(s.id).catch(() => {});
      });
    };

    sendTeacherHostHeartbeats();
    const interval = setInterval(sendTeacherHostHeartbeats, 25000);
    return () => clearInterval(interval);
  }, [teacher?.email, sessions]);


  const loadData = async () => {
    // 1. Instant local cached data
    const all = DataManager.getAllQuizzes({ teacherEmail: teacher.email, teacherId: teacher.id });
    setQuizzes(all);
    setDeletedCount(DataManager.getDeletedQuizIds().length);

    const mySessions = DataManager.getActiveSessions({ teacherEmail: teacher.email });
    setSessions(mySessions);

    // 2. Query Supabase health and fetch live cloud data
    try {
      const health = await DataManager.checkSupabaseHealth();
      if (health.tablesReady) {
        const cloudQuizzes = await DataManager.fetchQuizzesFromCloud({ teacherEmail: teacher.email, teacherId: teacher.id });
        setQuizzes(cloudQuizzes);

        const cloudSessions = await DataManager.syncActiveSessionsFromSupabase(teacher.email);
        if (cloudSessions && cloudSessions.length > 0) {
          setSessions(cloudSessions);
        }
      }

      // 3. Pulihkan status host / rekap jika belum berhasil termuat dari memori lokal instan
      const targetHostId = initialHostSessionId || (typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('hostSession') || sessionStorage.getItem('kuis_teacher_active_host_session_id')) : null);
      if (targetHostId && !selectedSessionForHost) {
        const local = DataManager.getActiveSessionById(targetHostId);
        if (local && local.status !== 'finished') {
          setSelectedSessionForHost(local);
        } else {
          try {
            const cloudSession = await DataManager.fetchActiveSessionById(targetHostId);
            if (cloudSession && cloudSession.status !== 'finished') {
              setSelectedSessionForHost(cloudSession);
            }
          } catch {}
        }
      }

      const targetRecapId = initialRecapSessionId || (typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('recapSession') || sessionStorage.getItem('kuis_teacher_active_recap_session_id')) : null);
      if (targetRecapId && !selectedSessionForRecap) {
        const local = DataManager.getActiveSessionById(targetRecapId);
        if (local) {
          setSelectedSessionForRecap(local);
        } else {
          try {
            const cloudRecap = await DataManager.fetchActiveSessionById(targetRecapId);
            if (cloudRecap) {
              setSelectedSessionForRecap(cloudRecap);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.warn('TeacherDashboard cloud sync notice:', e);
    }
  };

  const handleRestoreDefaultQuizzes = async () => {
    playClick();
    DataManager.restoreDefaultQuizzes();
    await loadData();
  };

  const handleSaveQuizSettings = async (quizId: string, updates: Partial<Quiz>) => {
    const updated = await DataManager.updateQuizSettings(quizId, updates);
    await loadData();
    if (selectedQuizForDetail && selectedQuizForDetail.id === quizId) {
      setSelectedQuizForDetail(updated);
    }
    setSelectedQuizForSettings(updated);
  };

  const handleStartQuizFromModal = async (quiz: Quiz, options: PlayQuizSessionOptions) => {
    setQuizToPlay(null);
    setSelectedQuizForDetail(null);
    const isUntimed = options.mode === 'untimed';
    const finalDuration = isUntimed ? 0 : options.durationPerQuestionSec;
    if (options.saveAsDefault) {
      await handleSaveQuizSettings(quiz.id, {
        defaultGameMode: options.mode,
        durationPerQuestionSec: finalDuration,
        shuffleQuestions: options.shuffleQuestions,
        shuffleOptions: options.shuffleOptions,
      });
    }

    // Register active session only when teacher completes config and starts!
    const newSession = await DataManager.createActiveSession(
      quiz,
      { ...options, durationPerQuestionSec: finalDuration },
      teacher
    );
    await loadData();

    // Open Wayground Host View directly
    setSelectedSessionForHost(newSession);
  };

  const handleDuplicateQuiz = async (quiz: Quiz) => {
    const dup = await DataManager.duplicateQuiz(quiz.id);
    if (dup) {
      await loadData();
    }
  };

  const handleCopyPin = async (pin: string) => {
    playClick();
    const success = await copyTextToClipboard(pin);
    if (success) {
      setCopiedPin(pin);
      setTimeout(() => setCopiedPin(null), 2000);
    }
  };

  const handleCopyLink = async (quiz: Quiz, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playClick();
    const url = `${window.location.origin}/?pin=${quiz.pinCode || '1001'}`;
    const shareText = `Ayo ikuti kuis "${quiz.title}"! Masukkan PIN: ${quiz.pinCode || '1001'}`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const shareData = {
          title: quiz.title,
          text: shareText,
          url: url,
        };
        if (typeof navigator.canShare === 'function') {
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
          } else {
            await navigator.share({ title: quiz.title, url });
          }
        } else {
          await navigator.share(shareData);
        }
        setCopiedLink(quiz.id);
        setTimeout(() => setCopiedLink(null), 2000);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    const success = await copyTextToClipboard(url);
    if (success) {
      setCopiedLink(quiz.id);
      showToast('Tautan kuis disalin ke clipboard!');
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const handleShareSession = async (session: QuizSession, trackingKey: string) => {
    playClick();
    const studentUrl = `${window.location.origin}/?pin=${session.pinCode}`;
    const deadlineCountdown = session.settings?.deadlineAt 
      ? getAccurateDeadlineCountdown(session.settings.deadlineAt) 
      : null;
    const deadlineStr = deadlineCountdown?.formattedDate 
      ? `\n⏰ Batas Pengumpulan: ${deadlineCountdown.formattedDate}` 
      : '';
    const shareMessage = `Halo anak-anak dan Ayah/Bunda! 📚\nBerikut tugas kuis interaktif kita:\n\n*${session.quizTitle}*\n📖 Mata Pelajaran: ${session.subject} (Kelas ${session.grade})\n${deadlineStr}\n🔑 PIN Ruang: *${session.pinCode}*\n🔗 Tautan Masuk: ${studentUrl}\n\nKerjakan dengan teliti dan raih bintang terbaik! 🌟`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const shareData = {
          title: session.quizTitle,
          text: shareMessage,
          url: studentUrl,
        };
        if (typeof navigator.canShare === 'function') {
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
          } else if (navigator.canShare({ title: session.quizTitle, text: shareMessage })) {
            await navigator.share({ title: session.quizTitle, text: shareMessage });
          } else {
            await navigator.share({ url: studentUrl });
          }
        } else {
          await navigator.share(shareData);
        }
        setCopiedLink(trackingKey);
        setTimeout(() => setCopiedLink(null), 2500);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    const success = await copyTextToClipboard(shareMessage);
    if (success) {
      setCopiedLink(trackingKey);
      showToast('Pesan & tautan sesi kuis disalin ke clipboard!');
      setTimeout(() => setCopiedLink(null), 2500);
    }
  };

  const handleShareWhatsAppForSession = async (session: QuizSession) => {
    playClick();
    const studentUrl = `${window.location.origin}/?pin=${session.pinCode}`;
    const deadlineCountdown = session.settings?.deadlineAt 
      ? getAccurateDeadlineCountdown(session.settings.deadlineAt) 
      : null;
    const deadlineStr = deadlineCountdown?.formattedDate 
      ? `⏰ Batas Pengumpulan: ${deadlineCountdown.formattedDate}\n` 
      : '';
    const message = `Halo anak-anak dan Ayah/Bunda! 📚\nBerikut tugas kuis interaktif kita:\n\n*${session.quizTitle}*\n📖 Mata Pelajaran: ${session.subject} (Kelas ${session.grade})\n${deadlineStr}🔑 PIN Ruang Kelas: *${session.pinCode}*\n🔗 Tautan Masuk Langsung: ${studentUrl}\n\nKerjakan dengan teliti dan raih bintang terbaik! 🌟`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const shareData = {
          title: session.quizTitle,
          text: message,
          url: studentUrl,
        };
        if (typeof navigator.canShare === 'function') {
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
          } else if (navigator.canShare({ title: session.quizTitle, text: message })) {
            await navigator.share({ title: session.quizTitle, text: message });
          } else {
            await navigator.share({ url: studentUrl });
          }
        } else {
          await navigator.share(shareData);
        }
        setCopiedLink(`wa_${session.id}`);
        setTimeout(() => setCopiedLink(null), 2500);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    const success = await copyTextToClipboard(message);
    if (success) {
      setCopiedLink(`wa_${session.id}`);
      showToast('Pesan tugas & tautan kuis disalin ke clipboard!');
      setTimeout(() => setCopiedLink(null), 2500);
    }
  };

  const handleConfirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    setIsDeletingQuiz(true);
    try {
      await DataManager.deleteCustomQuiz(quizToDelete.id);
      await loadData();
      if (selectedQuizForDetail && selectedQuizForDetail.id === quizToDelete.id) {
        setSelectedQuizForDetail(null);
      }
      setQuizToDelete(null);
    } finally {
      setIsDeletingQuiz(false);
    }
  };

  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeletingSession(true);
    try {
      await DataManager.deleteActiveSession(sessionToDelete.id);
      await loadData();
      setSessionToDelete(null);
    } finally {
      setIsDeletingSession(false);
    }
  };

  const handleEndSessionDirectly = async (sessionId: string) => {
    playClick();
    const updated = await DataManager.updateSessionStatus(sessionId, 'finished');
    await loadData();
    if (updated) {
      setSelectedSessionForRecap(updated);
    }
  };

  const handleExtendSessionDeadline = async (sessionId: string, newDeadlineIso: string) => {
    const updated = await DataManager.updateSessionDeadline(sessionId, newDeadlineIso);
    if (updated) {
      setSessions((prev) => prev.map((item) => (item.id === sessionId ? updated : item)));
    }
    await loadData();
  };

  const handleReactivateSession = async (sessionId: string, newDeadlineIso: string | null) => {
    const updated = await DataManager.reactivateQuizSession(sessionId, newDeadlineIso);
    if (updated) {
      setSessions((prev) => prev.map((item) => (item.id === sessionId ? updated : item)));
      showToast(`🎉 Sesi kuis "${updated.quizTitle}" (PIN ${updated.pinCode}) berhasil diaktifkan kembali!`);
    }
    await loadData();
  };

  const liveSessionsCount = useMemo(
    () => sessions.filter((s) => s.status === 'active' || s.status === 'paused' || s.status === 'waiting').length,
    [sessions]
  );
  const finishedSessionsCount = useMemo(
    () => sessions.filter((s) => s.status === 'finished').length,
    [sessions]
  );
  const activeHostSessions = useMemo(() => {
    const list = sessions.filter((s) => s.status === 'active' || s.status === 'paused' || s.status === 'waiting');
    // Prioritaskan teacher_led (live yang dipandu guru) di urutan awal, baru kemudian self_paced (PR)
    return list.sort((a, b) => {
      const isLiveA = a.settings?.executionMode === 'teacher_led' ? 1 : 0;
      const isLiveB = b.settings?.executionMode === 'teacher_led' ? 1 : 0;
      if (isLiveA !== isLiveB) return isLiveB - isLiveA;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [sessions]);

  // Pastikan indeks banner tidak melebihi jumlah sesi aktif
  useEffect(() => {
    if (activeSessionBannerIdx >= activeHostSessions.length && activeHostSessions.length > 0) {
      setActiveSessionBannerIdx(0);
    }
  }, [activeHostSessions.length, activeSessionBannerIdx]);
  const filteredSessions = useMemo(() => {
    if (sessionFilter === 'active') {
      return sessions.filter((s) => s.status === 'active' || s.status === 'paused' || s.status === 'waiting');
    }
    if (sessionFilter === 'finished') {
      return sessions.filter((s) => s.status === 'finished');
    }
    return sessions;
  }, [sessions, sessionFilter]);

  // Filtered & Sorted Quizzes Calculation
  const filteredQuizzes = useMemo(() => {
    return quizzes
      .filter((q) => {
        // Search query (matches title or pin)
        if (searchQuery.trim()) {
          const query = searchQuery.trim().toLowerCase();
          const matchTitle = q.title.toLowerCase().includes(query);
          const matchPin = (q.pinCode || '').includes(query);
          const matchSubject = q.subject.toLowerCase().includes(query);
          if (!matchTitle && !matchPin && !matchSubject) return false;
        }

        // Subject filter
        if (filterSubject !== 'Semua' && q.subject !== filterSubject) {
          return false;
        }

        // Grade filter
        if (filterGrade !== 'Semua' && q.grade !== filterGrade) {
          return false;
        }

        // Visibility filter
        if (filterVisibility !== 'all') {
          const qVis = q.visibility || 'public';
          if (filterVisibility !== qVis) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'title_asc') {
          return a.title.localeCompare(b.title, 'id');
        }
        if (sortOption === 'title_desc') {
          return b.title.localeCompare(a.title, 'id');
        }
        if (sortOption === 'questions_desc') {
          return (b.questions?.length || 0) - (a.questions?.length || 0);
        }
        if (sortOption === 'oldest') {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        }
        // Default 'newest'
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [quizzes, searchQuery, filterSubject, filterGrade, filterVisibility, sortOption]);

  const isFilterActive = searchQuery.trim() !== '' || filterSubject !== 'Semua' || filterGrade !== 'Semua' || filterVisibility !== 'all';

  const handleResetFilters = () => {
    playClick();
    setSearchQuery('');
    setFilterSubject('Semua');
    setFilterGrade('Semua');
    setFilterVisibility('all');
    setSortOption('newest');
  };

  // If a quiz is selected for details, render the full-page QuizDetail view
  if (selectedQuizForDetail) {
    return (
      <QuizDetail
        quiz={selectedQuizForDetail}
        teacher={teacher}
        onBack={() => setSelectedQuizForDetail(null)}
        onEditQuiz={(q) => {
          setSelectedQuizForDetail(null);
          onOpenCreator(q);
        }}
        onLaunchSmartboard={onLaunchSmartboard}
        onPrintWorksheet={onPrintWorksheet}
        onStartQuiz={handleStartQuizFromModal}
        onDuplicateQuiz={handleDuplicateQuiz}
        onDeleteQuiz={async (q) => {
          await DataManager.deleteCustomQuiz(q.id);
          await loadData();
          setSelectedQuizForDetail(null);
        }}
        onUpdateQuizSettings={handleSaveQuizSettings}
        playClick={playClick}
      />
    );
  }

  // Helper untuk mendapatkan kuis lengkap beserta butir soal secara tangguh saat refresh
  const resolveQuizForSession = (quizId: string, fallbackTitle?: string, fallbackSubject?: Subject, fallbackGrade?: number, fallbackCover?: string): Quiz => {
    const foundInState = quizzes.find((q) => q.id === quizId);
    if (foundInState && foundInState.questions && foundInState.questions.length > 0) {
      return foundInState;
    }
    const all = DataManager.getAllQuizzes();
    const foundInAll = all.find((q) => q.id === quizId);
    if (foundInAll && foundInAll.questions && foundInAll.questions.length > 0) {
      return foundInAll;
    }
    return foundInState || foundInAll || {
      id: quizId,
      title: fallbackTitle || 'Kuis Interaktif',
      description: '',
      subject: fallbackSubject || 'Pengetahuan Umum',
      grade: fallbackGrade || 1,
      durationPerQuestionSec: 30,
      coverEmoji: fallbackCover || '⭐',
      themeColor: 'from-blue-500 to-indigo-600',
      badgeTitle: 'Bintang Kuis',
      visibility: 'public',
      questions: [],
    };
  };

  // If host view is open:
  if (selectedSessionForHost) {
    const matchingQuiz: Quiz = resolveQuizForSession(
      selectedSessionForHost.quizId,
      selectedSessionForHost.quizTitle,
      selectedSessionForHost.subject,
      selectedSessionForHost.grade,
      selectedSessionForHost.quizCover
    );

    return (
      <WaygroundHostView
        session={selectedSessionForHost}
        quiz={matchingQuiz}
        onBack={() => {
          setSelectedSessionForHost(null);
          loadData();
        }}
        onEndSession={(updatedSession) => {
          loadData();
          setSelectedSessionForHost(null);
          setSelectedSessionForRecap(updatedSession);
        }}
        onViewRecap={(s) => {
          setSelectedSessionForHost(null);
          setSelectedSessionForRecap(s);
        }}
        playClick={playClick}
      />
    );
  }

  // If recap view is open:
  if (selectedSessionForRecap) {
    const matchingQuiz: Quiz = resolveQuizForSession(
      selectedSessionForRecap.quizId,
      selectedSessionForRecap.quizTitle,
      selectedSessionForRecap.subject,
      selectedSessionForRecap.grade,
      selectedSessionForRecap.quizCover
    );

    return (
      <QuizSessionRecapView
        session={selectedSessionForRecap}
        quiz={matchingQuiz}
        onBack={() => {
          setSelectedSessionForRecap(null);
          loadData();
        }}
        onSessionUpdated={(updated) => {
          setSelectedSessionForRecap(updated);
          setSessions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
          loadData();
        }}
        playClick={playClick}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 flex flex-col animate-fade-in">
      {/* Top Navbar */}
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-3 sm:px-8 lg:px-12 pt-[max(env(safe-area-inset-top),0.5rem)] pb-2 xs:pb-2.5 sm:pb-3 sticky top-0 z-30 shadow-xs transition-colors">
        <div className="w-full max-w-[2000px] mx-auto flex items-center justify-between gap-1.5 xs:gap-2 sm:gap-3">
          
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                playClick();
                onGoHome();
              }}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors flex-shrink-0"
              title="Kembali ke Beranda"
              aria-label="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white font-bold text-base sm:text-xl shadow-xs flex-shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight flex items-center gap-1.5 truncate">
                <span className="truncate">Dashboard Guru</span>
                {teacher.schoolName && (
                  <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex-shrink-0">
                    {teacher.schoolName}
                  </span>
                )}
              </h1>
              <p className="text-[10px] xs:text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
                {teacher.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Dark / Light Mode Toggle */}
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

            {isMasterTeacher && (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsAdminBackupModalOpen(true);
                }}
                className="hidden sm:flex p-2 sm:px-3 sm:py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-bold text-xs sm:text-sm min-h-[44px] min-w-[44px] items-center justify-center transition-all btn-press flex-shrink-0"
                title="Admin Database & Backup Terenkripsi (Rule 13)"
                aria-label="Admin Database & Backup Terenkripsi"
              >
                <Database className="w-4 h-4 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden md:inline ml-1.5">Backup DB</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                playClick();
                setIsCreateModalOpen(true);
              }}
              className="p-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm min-h-[44px] min-w-[44px] flex items-center justify-center shadow-xs transition-all btn-press flex-shrink-0"
              title="Buat Kuis Baru"
              aria-label="Buat Kuis Baru"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline ml-1.5">Buat Kuis Baru</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                onLogout();
              }}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors flex-shrink-0"
              title="Keluar Akun Guru"
              aria-label="Keluar Akun Guru"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Tab Navigation: Koleksi Kuis vs Kuis Aktif */}
      <nav className="w-full bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-3 sm:px-8 lg:px-12 transition-colors">
        <div className="w-full max-w-[2000px] mx-auto flex items-center gap-2 sm:gap-4 overflow-x-auto py-2.5 no-scrollbar">
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveMainTab('collection');
            }}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all min-h-[44px] whitespace-nowrap flex-shrink-0 ${
              activeMainTab === 'collection'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            <span>Koleksi Kuis ({quizzes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveMainTab('live_sessions');
            }}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all min-h-[44px] whitespace-nowrap relative flex-shrink-0 ${
              activeMainTab === 'live_sessions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {liveSessionsCount > 0 ? (
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            ) : (
              <Radio className="w-4 h-4 text-slate-400 flex-shrink-0" />
            )}
            <span>Kuis Aktif & Sesi Live</span>
            {liveSessionsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black tracking-wider animate-pulse flex-shrink-0">
                {liveSessionsCount} LIVE
              </span>
            )}
          </button>

          {isMasterTeacher && (
            <button
              type="button"
              onClick={() => {
                playClick();
                setIsAdminBackupModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all min-h-[44px] whitespace-nowrap text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/80 sm:ml-auto flex-shrink-0"
              title="Admin Database & Backup Terenkripsi"
            >
              <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <span>Database & Backup</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <main className="w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 pt-5 sm:pt-6 space-y-6 flex-1">
        
        {/* BANNER SESI AKTIF: Desain ringkas, anti-redundan, hemat ruang, dan informatif */}
        {activeMainTab !== 'live_sessions' && activeHostSessions.length > 0 && (() => {
          const currentBannerSession = activeHostSessions[activeSessionBannerIdx] || activeHostSessions[0];
          const isSelfPaced = currentBannerSession.settings?.executionMode === 'self_paced';
          const deadlineCountdown = isSelfPaced ? getAccurateDeadlineCountdown(currentBannerSession.settings?.deadlineAt, nowMs) : null;

          return (
            <div className={`rounded-2xl p-3.5 sm:p-4 text-white shadow-lg flex flex-col gap-2.5 sm:gap-3 animate-fade-in relative overflow-hidden ${
              isSelfPaced
                ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30'
                : 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-400/30'
            }`}>
              {/* Subtle ambient accent glow */}
              <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none" />

              {/* Baris Atas: Status Badge, Peserta, PIN Interaktif, dan Tombol Bagikan */}
              <div className="flex items-center justify-between gap-2 z-10 flex-wrap">
                {/* Kiri: Tipe Sesi & Jumlah Peserta */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isSelfPaced ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 flex-shrink-0">
                      <ClipboardList className="w-3 h-3 text-indigo-300" />
                      <span>Tugas Mandiri</span>
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border flex-shrink-0 ${
                      currentBannerSession.status === 'waiting'
                        ? 'bg-amber-500/20 border-amber-400/30 text-amber-200'
                        : 'bg-rose-500/20 border-rose-400/30 text-rose-200'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{currentBannerSession.status === 'waiting' ? 'Ruang Tunggu' : 'Sesi Live'}</span>
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-medium text-slate-200 border border-white/10 flex-shrink-0">
                    <Users className="w-3 h-3 text-slate-300" />
                    <span>{currentBannerSession.participants.length} Siswa</span>
                  </span>
                </div>

                {/* Kanan: PIN Copy & Bagikan */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyPin(currentBannerSession.pinCode)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-black/40 hover:bg-black/60 border border-white/20 text-white transition-colors cursor-pointer min-h-[32px] btn-press"
                    title="Klik untuk salin PIN"
                  >
                    <span className="text-[10px] text-white/60 font-sans">PIN</span>
                    <span className="tracking-wider">{currentBannerSession.pinCode}</span>
                    {copiedPin === currentBannerSession.pinCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareSession(currentBannerSession, `banner_${currentBannerSession.id}`)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-colors cursor-pointer min-h-[32px] btn-press"
                    title="Bagikan tautan sesi kuis"
                  >
                    {copiedLink === `banner_${currentBannerSession.id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="text-emerald-300 font-bold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-white/90 flex-shrink-0" />
                        <span className="hidden xs:inline">Bagikan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Judul Kuis & Info Status/Tenggat */}
              <div className="space-y-1 z-10 min-w-0">
                <h3 
                  className="font-bold text-sm sm:text-base text-white leading-snug line-clamp-1 sm:line-clamp-2"
                  title={currentBannerSession.quizTitle}
                >
                  {currentBannerSession.quizTitle}
                </h3>

                {isSelfPaced && deadlineCountdown ? (
                  <div className="flex items-center gap-2 text-xs flex-wrap text-slate-300">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-300 flex-shrink-0" />
                      <span>Tenggat: <strong className="text-white font-medium">{deadlineCountdown.formattedDate}</strong></span>
                    </div>
                    <span className="text-white/40 hidden sm:inline">•</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      deadlineCountdown.isExpired
                        ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40 animate-pulse'
                        : deadlineCountdown.isUrgent
                        ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                        : 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/30'
                    }`}>
                      {deadlineCountdown.isExpired ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-rose-300 flex-shrink-0" />
                          <span>Tenggat Berakhir ({deadlineCountdown.countdownText})</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-300 flex-shrink-0" />
                          <span>{deadlineCountdown.countdownText}</span>
                        </>
                      )}
                    </span>
                  </div>
                ) : !isSelfPaced ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    {currentBannerSession.status === 'waiting' ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                        <span>Siswa bersiap di ruang tunggu lobi</span>
                      </>
                    ) : (
                      <>
                        <Tv className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                        <span>Kuis interaktif sedang berjalan live</span>
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Baris Tombol Aksi (1 Baris Rapi & Seimbang) */}
              <div className="pt-2 border-t border-white/10 flex items-center gap-2 z-10">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedSessionForHost(currentBannerSession);
                  }}
                  className="flex-1 py-2.5 px-3.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 btn-press min-h-[44px]"
                >
                  {isSelfPaced ? (
                    <>
                      <Users className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span>Pantau Progres</span>
                    </>
                  ) : (
                    <>
                      <Tv className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span>
                        {currentBannerSession.status === 'waiting'
                          ? 'Masuk Ruang Tunggu'
                          : 'Layar Pantau Live'}
                      </span>
                    </>
                  )}
                </button>

                {isSelfPaced && (
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setSessionToExtendDeadline(currentBannerSession);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition-all min-h-[44px] flex items-center justify-center gap-1.5 btn-press whitespace-nowrap flex-shrink-0"
                    title="Perpanjang batas waktu pengumpulan tugas"
                  >
                    <Calendar className="w-3.5 h-3.5 text-indigo-300 flex-shrink-0" />
                    <span>Perpanjang</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleEndSessionDirectly(currentBannerSession.id)}
                  className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-600/30 border border-rose-400/30 text-rose-200 hover:text-white text-xs font-semibold transition-all min-h-[44px] flex items-center justify-center gap-1 btn-press whitespace-nowrap flex-shrink-0"
                  title="Akhiri sesi ini"
                >
                  <span>Akhiri</span>
                </button>
              </div>

              {/* Multi-Session Switcher jika lebih dari 1 sesi aktif */}
              {activeHostSessions.length > 1 && (
                <div className="w-full pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-xs text-slate-300 z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">Sesi:</span>
                    <div className="flex items-center gap-1 bg-black/30 rounded-lg p-0.5 border border-white/10">
                      <button
                        type="button"
                        disabled={activeSessionBannerIdx === 0}
                        onClick={() => {
                          playClick();
                          setActiveSessionBannerIdx((prev) => Math.max(0, prev - 1));
                        }}
                        className="p-1 rounded hover:bg-white/15 disabled:opacity-25 transition-all min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer"
                        aria-label="Sesi Sebelumnya"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-1.5 font-mono text-[11px] font-bold text-white">
                        {activeSessionBannerIdx + 1} / {activeHostSessions.length}
                      </span>
                      <button
                        type="button"
                        disabled={activeSessionBannerIdx === activeHostSessions.length - 1}
                        onClick={() => {
                          playClick();
                          setActiveSessionBannerIdx((prev) => Math.min(activeHostSessions.length - 1, prev + 1));
                        }}
                        className="p-1 rounded hover:bg-white/15 disabled:opacity-25 transition-all min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer"
                        aria-label="Sesi Berikutnya"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setActiveMainTab('live_sessions');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white py-1 px-1.5 rounded hover:bg-white/10 transition-colors"
                  >
                    Lihat Semua ({activeHostSessions.length})
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 1: KOLEKSI KUIS */}
        {activeMainTab === 'collection' && (
          <div className="space-y-4">
            {/* Section Header: Ringkas & Bersih */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Koleksi Kuis
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {quizzes.length}
                </span>
              </div>

              {isMasterTeacher && deletedCount > 0 && (
                <button
                  type="button"
                  onClick={handleRestoreDefaultQuizzes}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 min-h-[40px] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                  <span>Pulihkan Kuis Default ({deletedCount})</span>
                </button>
              )}
            </div>

            {/* Search, Filters & Sorting Bar - Compact Toolbar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              {/* Baris 1: Input Pencarian & Tombol Reset */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari judul kuis, mata pelajaran, atau PIN kelas..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 min-h-[40px]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
                      aria-label="Hapus kata kunci"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isFilterActive && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold whitespace-nowrap min-h-[40px] flex items-center gap-1 border border-rose-200 dark:border-rose-900/60 cursor-pointer flex-shrink-0 btn-press"
                    title="Reset Semua Filter"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset Filter</span>
                  </button>
                )}
              </div>

              {/* Baris 2: Filter Selectors */}
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar text-xs">
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none min-h-[38px] flex-shrink-0 cursor-pointer"
                >
                  <option value="Semua">Semua Mapel</option>
                  <option value="Matematika">Matematika</option>
                  <option value="IPA">IPA</option>
                  <option value="Bahasa Indonesia">B. Indonesia</option>
                  <option value="Pendidikan Pancasila">Pancasila</option>
                  <option value="Pengetahuan Umum">Umum</option>
                </select>

                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value === 'Semua' ? 'Semua' : Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none min-h-[38px] flex-shrink-0 cursor-pointer"
                >
                  <option value="Semua">Semua Kelas</option>
                  <option value="1">Kelas 1</option>
                  <option value="2">Kelas 2</option>
                  <option value="3">Kelas 3</option>
                  <option value="4">Kelas 4</option>
                  <option value="5">Kelas 5</option>
                  <option value="6">Kelas 6</option>
                </select>

                <select
                  value={filterVisibility}
                  onChange={(e) => setFilterVisibility(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none min-h-[38px] flex-shrink-0 cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="public">🌐 Publik</option>
                  <option value="private">🔒 Privat</option>
                </select>

                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none min-h-[38px] flex-shrink-0 cursor-pointer sm:ml-auto"
                >
                  <option value="newest">🕒 Terbaru</option>
                  <option value="oldest">⏳ Terlama</option>
                  <option value="title_asc">🔤 Judul (A - Z)</option>
                  <option value="title_desc">🔤 Judul (Z - A)</option>
                  <option value="questions_desc">📊 Soal Terbanyak</option>
                </select>
              </div>

              {/* Baris 3: Status Hasil Pencarian */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>
                  Menampilkan <strong>{filteredQuizzes.length}</strong> dari <strong>{quizzes.length}</strong> kuis
                </span>
                {isFilterActive && (
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    Filter diterapkan
                  </span>
                )}
              </div>
            </div>

            {/* Quizzes List Cards Grid */}
            {filteredQuizzes.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-3xl">🔍</div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                  Tidak Ada Kuis yang Sesuai
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {isFilterActive
                    ? 'Coba ubah kata kunci pencarian atau reset filter untuk menampilkan kuis lainnya.'
                    : 'Belum ada kuis yang dibuat. Klik tombol Buat Kuis Baru untuk meracik kuis pertama Anda!'}
                </p>
                {isFilterActive ? (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs min-h-[44px] btn-press cursor-pointer"
                  >
                    Reset Filter Pencarian
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setIsCreateModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm min-h-[44px] btn-press cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Kuis Baru Sekarang</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4">
                {filteredQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    onClick={() => {
                      playClick();
                      setSelectedQuizForDetail(quiz);
                    }}
                    className="group bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600/80 transition-all flex flex-col justify-between gap-3 cursor-pointer"
                  >
                    <div className="space-y-2.5">
                      {/* Baris Atas: Cover + Lencana Mapel/Kelas + PIN & Menu Opsi */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <QuizCoverDisplay
                            cover={quiz.coverEmoji}
                            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl flex-shrink-0 shadow-2xs border border-slate-200/60 dark:border-slate-700/60 select-none overflow-hidden group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                Kelas {quiz.grade}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border whitespace-nowrap truncate max-w-[120px] ${getSubjectBadge(quiz.subject)}`}>
                                {quiz.subject}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* PIN Quick Copy Chip */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyPin(quiz.pinCode || '1001');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold bg-blue-50/80 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 transition-colors cursor-pointer min-h-[36px]"
                            title="Klik untuk salin PIN"
                          >
                            <span className="text-[10px] text-slate-400 font-sans">PIN</span>
                            <span>{quiz.pinCode || '1001'}</span>
                            {copiedPin === (quiz.pinCode || '1001') ? (
                              <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <Copy className="w-3 h-3 text-blue-500/70 flex-shrink-0" />
                            )}
                          </button>

                          {/* More Options Menu */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playClick();
                              setSelectedQuizForSettings(quiz);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg min-h-[44px] min-w-[36px] flex items-center justify-center transition-colors cursor-pointer"
                            title="Opsi Lainnya (Edit, Duplikat, Cetak LKS, Hapus)"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Judul & Deskripsi Kuis */}
                      <div>
                        <h3 
                          className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                          title={quiz.title}
                        >
                          {quiz.title}
                        </h3>
                        {quiz.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-normal">
                            {quiz.description}
                          </p>
                        )}
                      </div>

                      {/* Meta Info Ringkas: Soal, Durasi & Akses */}
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 dark:text-slate-400 pt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />
                          <span>{quiz.questions.length} Soal</span>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          <span>{quiz.durationPerQuestionSec}s/soal</span>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          {quiz.visibility === 'private' ? (
                            <>
                              <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                              <span>Privat</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                              <span>Publik</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Baris Tombol Aksi Esensial (1 Baris Terpadu & Hemat Ruang) */}
                    <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      {/* Tombol Utama: Mainkan Kuis */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playClick();
                          setQuizToPlay(quiz);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-xs flex items-center justify-center gap-1.5 min-h-[44px] btn-press transition-colors cursor-pointer"
                        title="Mainkan Kuis Bersama Siswa"
                      >
                        <Play className="w-4 h-4 fill-white text-white flex-shrink-0" />
                        <span>Mainkan</span>
                      </button>

                      {/* Tombol Sekunder: Detail & Rekap Nilai */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playClick();
                          setSelectedQuizForDetail(quiz);
                        }}
                        className="px-3.5 py-2 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 flex items-center justify-center gap-1.5 min-h-[44px] transition-colors btn-press whitespace-nowrap cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
                        title="Lihat Soal & Rekap Nilai Siswa"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span>Detail</span>
                      </button>

                      {/* Tombol Cepat: Bagikan Tautan Kuis */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(quiz, e)}
                        className="p-2.5 rounded-xl text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-200/60 dark:border-slate-700/60 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors btn-press cursor-pointer flex-shrink-0"
                        title="Bagi Tautan Kuis ke WhatsApp / Salin"
                        aria-label="Bagikan Tautan Kuis"
                      >
                        {copiedLink === quiz.id ? (
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <Share2 className="w-4 h-4 flex-shrink-0" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      {/* TAB 2: KUIS AKTIF & SESI LIVE (WAYGROUND) */}
      {activeMainTab === 'live_sessions' && (
        <div className="space-y-4">
          {/* Section Header: Ringkas & Bersih */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-rose-500 animate-pulse flex-shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Kuis Aktif & Sesi Live
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                {sessions.length}
              </span>
            </div>

            {/* Sub-Filter Pills (Compact Filter Row) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl self-start sm:self-auto text-xs font-bold overflow-x-auto max-w-full no-scrollbar border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSessionFilter('all');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all min-h-[36px] whitespace-nowrap flex items-center justify-center flex-shrink-0 cursor-pointer ${
                  sessionFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua ({sessions.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSessionFilter('active');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all min-h-[36px] whitespace-nowrap flex items-center gap-1.5 justify-center flex-shrink-0 cursor-pointer ${
                  sessionFilter === 'active'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                <span>Berjalan ({liveSessionsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSessionFilter('finished');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all min-h-[36px] whitespace-nowrap flex items-center gap-1.5 justify-center flex-shrink-0 cursor-pointer ${
                  sessionFilter === 'finished'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>✓ Selesai ({finishedSessionsCount})</span>
              </button>
            </div>
          </div>

          {/* Sessions Grid */}
          {filteredSessions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 text-center border border-slate-200 dark:border-slate-800 space-y-3 max-w-lg mx-auto shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl mx-auto shadow-2xs">
                <Radio className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {sessionFilter === 'active'
                    ? 'Tidak Ada Sesi yang Sedang Berjalan'
                    : sessionFilter === 'finished'
                    ? 'Belum Ada Riwayat Sesi Selesai'
                    : 'Belum Ada Sesi Kuis'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {sessionFilter === 'all'
                    ? 'Mulai sesi kuis baru dari Koleksi Kuis untuk berinteraksi bersama murid.'
                    : 'Pilih salah satu kuis dari Koleksi Kuis dan tekan "Mainkan" untuk memulai.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setActiveMainTab('collection');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs min-h-[44px] cursor-pointer"
              >
                Buka Koleksi Kuis
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
              {filteredSessions.map((s) => {
                const isLive = s.status === 'active' || s.status === 'paused' || s.status === 'waiting';
                const isSelfPaced = s.settings?.executionMode === 'self_paced';
                const partCount = s.participants.length;
                const finishedCount = s.participants.filter((p) => p.finished).length;

                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      playClick();
                      if (isLive) {
                        setSelectedSessionForHost(s);
                      } else {
                        setSelectedSessionForRecap(s);
                      }
                    }}
                    className={`group bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 shadow-2xs hover:shadow-md cursor-pointer ${
                      isSelfPaced && s.status === 'active'
                        ? 'border-indigo-400/70 dark:border-indigo-500/50 hover:border-indigo-500'
                        : s.status === 'active'
                        ? 'border-rose-400/70 dark:border-rose-500/50 hover:border-rose-500 ring-1 ring-rose-500/20'
                        : s.status === 'waiting'
                        ? 'border-amber-400/70 dark:border-amber-500/50 hover:border-amber-500'
                        : 'border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600/80'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Baris 1: Status Sesi + Mapel + PIN + Bagikan */}
                      <div className="flex items-center justify-between gap-2">
                        {/* Kiri: Status & Info Mapel */}
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              isSelfPaced
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                : s.status === 'active'
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                : s.status === 'waiting'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                : s.status === 'paused'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {isSelfPaced ? (
                              <>
                                <ClipboardList className="w-2.5 h-2.5 text-indigo-500" />
                                <span>Tugas PR</span>
                              </>
                            ) : s.status === 'active' ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                <span>LIVE</span>
                              </>
                            ) : s.status === 'waiting' ? (
                              <>
                                <Clock className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
                                <span>Menunggu</span>
                              </>
                            ) : s.status === 'paused' ? (
                              <>
                                <Pause className="w-2.5 h-2.5" />
                                <span>Dijeda</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Selesai</span>
                              </>
                            )}
                          </span>

                          <span className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] border whitespace-nowrap ${getSubjectBadge(s.subject)}`}>
                            {s.subject}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] whitespace-nowrap">
                            Kls {s.grade}
                          </span>
                        </div>

                        {/* Kanan: Chip PIN Interaktif & Tombol Bagikan */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyPin(s.pinCode);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer min-h-[32px]"
                            title="Klik untuk salin PIN"
                          >
                            <span className="text-[10px] text-slate-400 font-sans">PIN</span>
                            <span>{s.pinCode}</span>
                            {copiedPin === s.pinCode ? (
                              <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            )}
                          </button>

                          {isLive && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareWhatsAppForSession(s);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-750 min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors cursor-pointer btn-press"
                              title="Bagikan Tautan Sesi Kuis"
                              aria-label="Bagikan Tautan Sesi"
                            >
                              {copiedLink === `wa_${s.id}` || copiedLink === s.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Share2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Judul Sesi Kuis */}
                      <div>
                        <h3 
                          className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                          title={s.quizTitle}
                        >
                          {s.quizTitle}
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{s.totalQuestions} Soal</span>
                          {s.createdAt && (
                            <>
                              <span>•</span>
                              <span>{formatIndonesianTime(s.createdAt)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Kotak Deadline Batas Waktu PR (Jika Self-Paced) - Ringkas 1 Baris */}
                      {isSelfPaced && (() => {
                        const deadlineCountdown = getAccurateDeadlineCountdown(s.settings?.deadlineAt, nowMs);
                        return (
                          <div className={`px-2.5 py-1.5 rounded-xl border text-[11px] flex items-center justify-between gap-1.5 ${
                            deadlineCountdown.isExpired
                              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/40 text-rose-700 dark:text-rose-300'
                              : deadlineCountdown.isUrgent
                              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/40 text-amber-700 dark:text-amber-300'
                              : 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200/70 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                          }`}>
                            <div className="flex items-center gap-1.5 truncate">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="font-semibold truncate">
                                {deadlineCountdown.isExpired ? 'Tenggat Berakhir' : `Sisa: ${deadlineCountdown.countdownText}`}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex-shrink-0">
                              {deadlineCountdown.formattedDate}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Bar Progres Siswa (Ramping & Bersih) */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            <span>{partCount} Siswa</span>
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {finishedCount}/{partCount} Selesai
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              finishedCount === partCount && partCount > 0
                                ? 'bg-emerald-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${partCount > 0 ? Math.min(100, (finishedCount / partCount) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Baris Tombol Aksi Esensial (1 Baris Terpadu & Bebas Redundansi) */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      {isLive ? (
                        <div className="flex items-center gap-1.5">
                          {/* Tombol Utama: Pantau Live / Ruang Tunggu */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playClick();
                              setSelectedSessionForHost(s);
                            }}
                            className={`flex-1 py-2 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors btn-press min-h-[44px] cursor-pointer ${
                              isSelfPaced
                                ? 'bg-indigo-600 hover:bg-indigo-700'
                                : s.status === 'waiting'
                                ? 'bg-amber-500 hover:bg-amber-600'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {isSelfPaced ? (
                              <>
                                <Users className="w-4 h-4 flex-shrink-0" />
                                <span>Pantau Progres</span>
                              </>
                            ) : s.status === 'waiting' ? (
                              <>
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span>Ruang Tunggu</span>
                              </>
                            ) : (
                              <>
                                <Tv className="w-4 h-4 flex-shrink-0" />
                                <span>Layar Pantau</span>
                              </>
                            )}
                          </button>

                          {/* Tombol Sekunder: Rekap Nilai */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playClick();
                              setSelectedSessionForRecap(s);
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1 min-h-[44px] transition-colors cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
                            title="Lihat Rekapitulasi Nilai Siswa"
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <span>Rekap</span>
                          </button>

                          {/* Aksi Tambahan: Perpanjang (PR) atau Akhiri Sesi (Live) */}
                          {isSelfPaced ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                playClick();
                                setSessionToExtendDeadline(s);
                              }}
                              className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer"
                              title="Perpanjang Batas Waktu PR"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEndSessionDirectly(s.id);
                              }}
                              className="px-2.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 text-xs font-bold flex items-center justify-center min-h-[44px] transition-colors cursor-pointer whitespace-nowrap"
                              title="Selesaikan & Akhiri Sesi Kuis"
                            >
                              <span>Akhiri</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        /* Sesi Selesai */
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playClick();
                              setSelectedSessionForRecap(s);
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors min-h-[44px] cursor-pointer"
                          >
                            <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
                            <span>Lihat Rekap Nilai</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playClick();
                              setSessionToReactivate(s);
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1 min-h-[44px] transition-colors cursor-pointer"
                            title="Buka Kembali Sesi Ini"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <span className="hidden sm:inline">Aktifkan</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playClick();
                              setSessionToDelete(s);
                            }}
                            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                            title="Hapus Arsip Sesi Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </main>

      {/* Modal Pemilihan Metode Buat Kuis Baru */}
      <CreateQuizMethodModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSelectAi={() => {
          setIsCreateModalOpen(false);
          onOpenCreator(undefined, 'ai');
        }}
        onSelectManual={() => {
          setIsCreateModalOpen(false);
          onOpenCreator(undefined, 'manual');
        }}
        playClick={playClick}
      />

      {/* Modal Pengaturan Kuis Cepat (Titik Tiga) */}
      <QuizSettingsModal
        isOpen={Boolean(selectedQuizForSettings)}
        onClose={() => setSelectedQuizForSettings(null)}
        quiz={selectedQuizForSettings}
        onDuplicate={handleDuplicateQuiz}
        onViewSubmissions={(q) => {
          setSelectedQuizForSettings(null);
          setSelectedQuizForDetail(q);
        }}
        onPrintWorksheet={onPrintWorksheet}
        onSaveSettings={handleSaveQuizSettings}
        onRequestDelete={(q) => {
          setSelectedQuizForSettings(null);
          setQuizToDelete(q);
        }}
        canDelete={true}
        playClick={playClick}
      />

      {/* Modal Pengaturan Sesi Bermain & Mulai Kuis Siswa */}
      <PlayQuizModal
        isOpen={Boolean(quizToPlay)}
        onClose={() => setQuizToPlay(null)}
        quiz={quizToPlay}
        onStartQuiz={handleStartQuizFromModal}
        playClick={playClick}
      />

      {/* Modal Konfirmasi Hapus Kuis */}
      <ConfirmDeleteModal
        isOpen={Boolean(quizToDelete)}
        title="Hapus Kuis Ini?"
        quizTitle={quizToDelete?.title}
        description={`Apakah Anda yakin ingin menghapus kuis "${quizToDelete?.title}"? Seluruh butir soal dan data nilai siswa terkait akan dihapus secara permanen.`}
        isLoading={isDeletingQuiz}
        onConfirm={handleConfirmDeleteQuiz}
        onCancel={() => setQuizToDelete(null)}
      />

      {/* Modal Konfirmasi Hapus Sesi Kuis */}
      <ConfirmDeleteModal
        isOpen={Boolean(sessionToDelete)}
        title="Hapus Riwayat Sesi Kuis Ini?"
        quizTitle={sessionToDelete?.quizTitle}
        description={`Apakah Anda yakin ingin menghapus arsip sesi kuis "${sessionToDelete?.quizTitle}" (PIN: ${sessionToDelete?.pinCode})? Seluruh rekapan dan riwayat pengerjaan murid dalam sesi ini akan dihapus.`}
        isLoading={isDeletingSession}
        onConfirm={handleConfirmDeleteSession}
        onCancel={() => setSessionToDelete(null)}
      />

      {/* Modal Admin Database & Backup Terenkripsi (Rule 13) */}
      <AdminDatabaseBackupModal
        isOpen={isAdminBackupModalOpen}
        onClose={() => setIsAdminBackupModalOpen(false)}
        teacherEmail={teacher.email}
        teacherName={teacher.fullName}
        playClick={playClick}
      />

      {/* Modal Perpanjang Batas Waktu Mode Mandiri / PR */}
      <ExtendDeadlineModal
        isOpen={Boolean(sessionToExtendDeadline)}
        session={sessionToExtendDeadline}
        onClose={() => setSessionToExtendDeadline(null)}
        onExtend={handleExtendSessionDeadline}
        playClick={playClick}
      />

      {/* Modal Aktifkan Kembali Sesi Kuis Selesai */}
      <ReactivateSessionModal
        isOpen={Boolean(sessionToReactivate)}
        session={sessionToReactivate}
        onClose={() => setSessionToReactivate(null)}
        onReactivate={handleReactivateSession}
        playClick={playClick}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900/95 dark:bg-emerald-950/95 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl shadow-xl border border-emerald-500/30 flex items-center gap-3 backdrop-blur-md">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
