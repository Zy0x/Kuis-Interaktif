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
  Tv
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
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizForDetail, setSelectedQuizForDetail] = useState<Quiz | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [quizToPlay, setQuizToPlay] = useState<Quiz | null>(null);

  // Main Tab Navigation State: 'collection' | 'live_sessions'
  const [activeMainTab, setActiveMainTab] = useState<'collection' | 'live_sessions'>('collection');

  // Active Sessions States
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [sessionFilter, setSessionFilter] = useState<'all' | 'active' | 'finished'>('all');
  const [selectedSessionForHost, setSelectedSessionForHost] = useState<QuizSession | null>(null);
  const [selectedSessionForRecap, setSelectedSessionForRecap] = useState<QuizSession | null>(null);
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
    if (options.saveAsDefault) {
      await handleSaveQuizSettings(quiz.id, {
        defaultGameMode: options.mode,
        durationPerQuestionSec: options.durationPerQuestionSec,
        shuffleQuestions: options.shuffleQuestions,
        shuffleOptions: options.shuffleOptions,
      });
    }

    // Register active session only when teacher completes config and starts!
    const newSession = await DataManager.createActiveSession(quiz, options, teacher);
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

  const handleCopyLink = async (quiz: Quiz) => {
    playClick();
    const url = `${window.location.origin}${window.location.pathname}?pin=${quiz.pinCode || '1001'}`;
    const success = await copyTextToClipboard(url);
    if (success) {
      setCopiedLink(quiz.id);
      setTimeout(() => setCopiedLink(null), 2000);
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

  const liveSessionsCount = useMemo(
    () => sessions.filter((s) => s.status === 'active' || s.status === 'paused').length,
    [sessions]
  );
  const finishedSessionsCount = useMemo(
    () => sessions.filter((s) => s.status === 'finished').length,
    [sessions]
  );
  const filteredSessions = useMemo(() => {
    if (sessionFilter === 'active') {
      return sessions.filter((s) => s.status === 'active' || s.status === 'paused');
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

  // If host view is open:
  if (selectedSessionForHost) {
    const matchingQuiz: Quiz = quizzes.find((q) => q.id === selectedSessionForHost.quizId) || {
      id: selectedSessionForHost.quizId,
      title: selectedSessionForHost.quizTitle,
      description: '',
      subject: selectedSessionForHost.subject,
      grade: selectedSessionForHost.grade,
      durationPerQuestionSec: 30,
      coverEmoji: selectedSessionForHost.quizCover || '⭐',
      themeColor: 'from-blue-500 to-indigo-600',
      badgeTitle: 'Bintang Kuis',
      visibility: 'public',
      questions: [],
    };

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
    const matchingQuiz: Quiz = quizzes.find((q) => q.id === selectedSessionForRecap.quizId) || {
      id: selectedSessionForRecap.quizId,
      title: selectedSessionForRecap.quizTitle,
      description: '',
      subject: selectedSessionForRecap.subject,
      grade: selectedSessionForRecap.grade,
      durationPerQuestionSec: 30,
      coverEmoji: selectedSessionForRecap.quizCover || '⭐',
      themeColor: 'from-blue-500 to-indigo-600',
      badgeTitle: 'Bintang Kuis',
      visibility: 'public',
      questions: [],
    };

    return (
      <QuizSessionRecapView
        session={selectedSessionForRecap}
        quiz={matchingQuiz}
        onBack={() => {
          setSelectedSessionForRecap(null);
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
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors flex-shrink-0"
              title="Kembali ke Beranda"
              aria-label="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="hidden xs:flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white font-bold text-base sm:text-xl shadow-xs flex-shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <div className="min-w-0">
              <h1 className="text-xs xs:text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight flex items-center gap-1.5 truncate">
                <span className="truncate">Dashboard Guru</span>
                {teacher.schoolName && (
                  <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex-shrink-0">
                    {teacher.schoolName}
                  </span>
                )}
              </h1>
              <p className="text-[10px] xs:text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[120px] xs:max-w-[200px] sm:max-w-none">
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
                className="p-2 sm:px-3 sm:py-2 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-bold text-xs sm:text-sm min-h-[40px] min-w-[40px] flex items-center justify-center transition-all btn-press flex-shrink-0"
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
              className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm min-h-[40px] min-w-[40px] flex items-center justify-center shadow-xs transition-all btn-press flex-shrink-0"
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
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-700 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors flex-shrink-0"
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
        <div className="w-full max-w-[2000px] mx-auto flex items-center gap-2 sm:gap-4 overflow-x-auto py-2.5">
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveMainTab('collection');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] whitespace-nowrap ${
              activeMainTab === 'collection'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Koleksi Kuis ({quizzes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveMainTab('live_sessions');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] whitespace-nowrap relative ${
              activeMainTab === 'live_sessions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {liveSessionsCount > 0 ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            ) : (
              <Radio className="w-4 h-4 text-slate-400" />
            )}
            <span>Kuis Aktif & Sesi Live</span>
            {liveSessionsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black tracking-wider animate-pulse">
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
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] whitespace-nowrap text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/80 ml-auto"
            >
              <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Database & Backup (AES-256)</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <main className="w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 pt-5 sm:pt-6 space-y-6 flex-1">
        
        {/* TAB 1: KOLEKSI KUIS */}
        {activeMainTab === 'collection' && (
          <div className="space-y-6">
            {/* Section Header & Subtitle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Koleksi Kuis Saya ({quizzes.length})</span>
                </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih kuis untuk melihat detail, memeriksa rekap nilai siswa, atau menyajikan di Smartboard.
            </p>
          </div>

          {isMasterTeacher && deletedCount > 0 && (
            <button
              type="button"
              onClick={handleRestoreDefaultQuizzes}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 min-h-[38px] self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
              <span>Pulihkan Kuis Default ({deletedCount})</span>
            </button>
          )}
        </div>

        {/* Search, Filters & Sorting Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          
          {/* Row 1: Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul kuis, mata pelajaran, atau PIN kelas 4-digit..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 min-h-[42px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Row 2: Filter Selectors & Sorting */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 pt-1">
            {/* Filter Mapel */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Mata Pelajaran:
              </label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none min-h-[38px]"
              >
                <option value="Semua">Semua Mapel</option>
                <option value="Matematika">Matematika</option>
                <option value="IPA">IPA</option>
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="Pendidikan Pancasila">Pancasila</option>
                <option value="Pengetahuan Umum">Umum</option>
              </select>
            </div>

            {/* Filter Kelas */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Tingkat Kelas:
              </label>
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value === 'Semua' ? 'Semua' : Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none min-h-[38px]"
              >
                <option value="Semua">Semua Kelas</option>
                <option value="1">Kelas 1 SD</option>
                <option value="2">Kelas 2 SD</option>
                <option value="3">Kelas 3 SD</option>
                <option value="4">Kelas 4 SD</option>
                <option value="5">Kelas 5 SD</option>
                <option value="6">Kelas 6 SD</option>
              </select>
            </div>

            {/* Filter Visibilitas */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Status Akses:
              </label>
              <select
                value={filterVisibility}
                onChange={(e) => setFilterVisibility(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none min-h-[38px]"
              >
                <option value="all">Semua Status</option>
                <option value="public">🌐 Publik</option>
                <option value="private">🔒 Privat</option>
              </select>
            </div>

            {/* Sorting */}
            <div className="col-span-2 sm:col-span-1 lg:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Urutkan Berdasarkan:
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none min-h-[38px]"
                >
                  <option value="newest">🕒 Terbaru Dibuat</option>
                  <option value="oldest">⏳ Terlama Dibuat</option>
                  <option value="title_asc">🔤 Judul (A - Z)</option>
                  <option value="title_desc">🔤 Judul (Z - A)</option>
                  <option value="questions_desc">📊 Soal Terbanyak</option>
                </select>

                {isFilterActive && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold whitespace-nowrap min-h-[38px] flex items-center gap-1 border border-rose-200 dark:border-rose-900/60"
                    title="Reset Filter"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Counter */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>
              Menampilkan <strong>{filteredQuizzes.length}</strong> dari <strong>{quizzes.length}</strong> kuis
            </span>
            {isFilterActive && (
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                Filter sedang diterapkan
              </span>
            )}
          </div>
        </div>

        {/* Quizzes List Cards Grid */}
        {filteredQuizzes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-4xl">🔍</div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
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
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs"
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
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Kuis Baru Sekarang</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-3.5">
                  {/* Row 1: PIN Box, Visibility & Three Dots */}
                  <div className="flex items-center justify-between gap-2">
                    
                    {/* PIN Badge with Quick Copy */}
                    <div className="flex items-center gap-1.5 bg-blue-50/90 dark:bg-blue-950/60 px-2.5 py-1 rounded-xl border border-blue-200/80 dark:border-blue-800/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PIN:</span>
                      <span className="font-mono font-black text-xs text-blue-700 dark:text-blue-300 tracking-wider">
                        {quiz.pinCode || '1001'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyPin(quiz.pinCode || '1001');
                        }}
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                        title="Salin PIN"
                      >
                        {copiedPin === (quiz.pinCode || '1001') ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        )}
                      </button>
                    </div>

                    {/* Visibility & Settings Button */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                          quiz.visibility === 'private'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {quiz.visibility === 'private' ? (
                          <>
                            <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>Privat</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Publik</span>
                          </>
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playClick();
                          setSelectedQuizForSettings(quiz);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
                        title="Pengaturan Kuis"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Emoji & Details */}
                  <div className="flex items-start gap-3 min-w-0">
                    <QuizCoverDisplay
                      cover={quiz.coverEmoji}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-750 flex items-center justify-center text-2xl flex-shrink-0 shadow-xs border border-slate-200/60 dark:border-slate-700/60 select-none overflow-hidden"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className="inline-flex items-center text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 whitespace-nowrap">
                          Kelas {quiz.grade}
                        </span>
                        <span className={`inline-flex items-center text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-lg border whitespace-nowrap truncate max-w-[140px] ${getSubjectBadge(quiz.subject)}`}>
                          {quiz.subject}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-2" title={quiz.title}>
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {quiz.description || 'Kuis interaktif tematik'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* Meta Info */}
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 font-medium whitespace-nowrap">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      {quiz.questions.length} Soal
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="inline-flex items-center gap-1 font-medium whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      {quiz.durationPerQuestionSec}s / soal
                    </span>
                  </div>

                  {/* Actions Grid */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playClick();
                        setQuizToPlay(quiz);
                      }}
                      className="w-full py-2.5 px-3.5 rounded-xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm flex items-center justify-center gap-2 min-h-[44px] btn-press transition-all tracking-wide"
                      title="Mainkan Kuis Bersama Siswa (Buka Pengaturan Sesi Bermain)"
                    >
                      <Play className="w-4 h-4 fill-white text-white" />
                      <span>Mainkan Sekarang</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(quiz);
                        }}
                        className="py-2.5 px-2 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 flex items-center justify-center gap-1.5 min-h-[44px] transition-colors btn-press whitespace-nowrap"
                        title="Salin Tautan Kuis"
                      >
                        {copiedLink === quiz.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <span>Bagi Tautan</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playClick();
                          setSelectedQuizForDetail(quiz);
                        }}
                        className="py-2.5 px-2 rounded-xl font-semibold text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-center gap-1.5 min-h-[44px] transition-colors btn-press whitespace-nowrap"
                        title="Lihat Detail Kuis & Rekap Nilai"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span>Detail & Nilai</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* TAB 2: KUIS AKTIF & SESI LIVE (WAYGROUND) */}
      {activeMainTab === 'live_sessions' && (
        <div className="space-y-6">
          {/* Section Header & Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
                <span>Kuis Aktif & Sesi Bermain Siswa ({sessions.length})</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pantau interaksi siswa secara langsung ala Quizizz Wayground, kendalikan sesi live, atau buka rekapan hasil kuis.
              </p>
            </div>

            {/* Sub-Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl self-start sm:self-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSessionFilter('all');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
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
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  sessionFilter === 'active'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Sedang Berjalan ({liveSessionsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSessionFilter('finished');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4 max-w-lg mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-3xl mx-auto shadow-sm">
                <Radio className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {sessionFilter === 'active'
                    ? 'Tidak Ada Kuis yang Sedang Berjalan'
                    : sessionFilter === 'finished'
                    ? 'Belum Ada Riwayat Kuis Selesai'
                    : 'Belum Ada Sesi Kuis Aktif'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {sessionFilter === 'all'
                    ? 'Mulai sesi kuis untuk memantau nilai dan jawaban murid secara langsung ala Quizizz Wayground.'
                    : 'Pilih salah satu kuis dari Koleksi Kuis dan tekan "Mainkan Sekarang" untuk memulai sesi baru.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setActiveMainTab('collection');
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs min-h-[44px]"
              >
                Buka Koleksi Kuis & Mulai
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSessions.map((s) => {
                const isLive = s.status === 'active' || s.status === 'paused';
                const partCount = s.participants.length;
                const finishedCount = s.participants.filter((p) => p.finished).length;

                return (
                  <div
                    key={s.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border transition-all flex flex-col justify-between gap-4 shadow-xs hover:shadow-md ${
                      isLive
                        ? 'border-rose-400/80 dark:border-rose-500/50 ring-1 ring-rose-400/30'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Top status & PIN */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                          s.status === 'active'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : s.status === 'paused'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {s.status === 'active' ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                            <span>LIVE WAYGROUND</span>
                          </>
                        ) : s.status === 'paused' ? (
                          <>
                            <Pause className="w-2.5 h-2.5" />
                            <span>DIJEDA</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>SELESAI</span>
                          </>
                        )}
                      </span>

                      {/* PIN Code with quick copy */}
                      <button
                        type="button"
                        onClick={() => handleCopyPin(s.pinCode)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors min-h-[36px]"
                        title="Klik untuk salin PIN"
                      >
                        <span className="text-slate-400 text-[10px]">PIN:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 tracking-wider">
                          {s.pinCode}
                        </span>
                        {copiedPin === s.pinCode ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${getSubjectBadge(s.subject)}`}>
                          {s.subject}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px]">
                          Kelas {s.grade}
                        </span>
                        <span className="text-slate-400 text-[10px]">•</span>
                        <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                          {s.totalQuestions} Soal
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                        {s.quizTitle}
                      </h3>

                      {/* Metric Bar */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-800/80 space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            {partCount} Siswa Tergabung
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {finishedCount} / {partCount} Selesai
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${partCount > 0 ? Math.min(100, (finishedCount / partCount) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      {isLive ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              playClick();
                              setSelectedSessionForHost(s);
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all btn-press min-h-[44px]"
                          >
                            <Tv className="w-4 h-4" />
                            <span>Buka Layar Pantau (Wayground)</span>
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                playClick();
                                setSelectedSessionForRecap(s);
                              }}
                              className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 min-h-[40px] transition-colors"
                            >
                              <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                              <span>Rekap Sesi</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEndSessionDirectly(s.id)}
                              className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 text-xs font-bold flex items-center justify-center gap-1.5 min-h-[40px] transition-colors"
                            >
                              <span>Akhiri Sesi</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              playClick();
                              setSelectedSessionForRecap(s);
                            }}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all btn-press min-h-[44px]"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Lihat Rekap Lengkap & Analisis</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              playClick();
                              setSessionToDelete(s);
                            }}
                            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors flex-shrink-0"
                            title="Hapus Sesi Kuis Ini"
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
    </div>
  );
};
