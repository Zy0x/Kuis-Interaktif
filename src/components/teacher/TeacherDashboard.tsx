import React, { useState, useEffect } from 'react';
import type { Quiz, TeacherProfile, StudentSubmission } from '../../types/quiz';
import { MASTER_TEACHER_EMAIL } from '../../types/quiz';
import { DataManager } from '../../lib/supabaseClient';
import { useBackHandler } from '../../lib/navigationHistory';
import { ThemeToggle } from '../common/ThemeToggle';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { QuizSettingsModal } from '../common/QuizSettingsModal';
import { saveNavigationState } from '../../lib/navigationState';
import { 
  GraduationCap, 
  Plus, 
  Tv, 
  Copy, 
  Check, 
  Download, 
  Zap, 
  BookOpen, 
  Users, 
  LogOut, 
  ArrowLeft,
  Share2,
  Lock,
  Globe,
  RotateCcw,
  MoreVertical,
  Pencil,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface TeacherDashboardProps {
  teacher: TeacherProfile;
  onLogout: () => void;
  onGoHome: () => void;
  onOpenCreator: (quizToEdit?: Quiz) => void;
  onLaunchSmartboard: (quiz: Quiz) => void;
  onPrintWorksheet: (quiz: Quiz) => void;
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
  playClick,
  isDark = false,
  onToggleTheme = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<'quizzes' | 'submissions' | 'generator'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as 'quizzes' | 'submissions' | 'generator' | null;
      if (tabParam && ['quizzes', 'submissions', 'generator'].includes(tabParam)) {
        return tabParam;
      }
    } catch {}
    return 'quizzes';
  });

  const handleTabChange = (tab: 'quizzes' | 'submissions' | 'generator') => {
    playClick();
    setActiveTab(tab);
    saveNavigationState({
      screen: 'teacher-dashboard',
      teacherTab: tab,
      replace: true,
    });
  };
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Generator state
  const [genGrade, setGenGrade] = useState<number>(3);
  const [genCount, setGenCount] = useState<number>(5);
  const [genLoading, setGenLoading] = useState(false);

  // Delete confirmation state (In-App Modal)
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const isMasterTeacher = teacher.email.trim().toLowerCase() === MASTER_TEACHER_EMAIL.toLowerCase();
  const [deletedCount, setDeletedCount] = useState<number>(() => DataManager.getDeletedQuizIds().length);
  const [selectedQuizForSettings, setSelectedQuizForSettings] = useState<Quiz | null>(null);

  // Cloud Supabase Health & Live Sync State
  const [dbHealth, setDbHealth] = useState<{
    connected: boolean;
    configured: boolean;
    tablesReady: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // 1. Level 2 (Prioritas 50): Jika berada di tab Submissions / Generator, mundur ke Tab Kuis
  useBackHandler('teacher-tab-back', 50, () => {
    if (activeTab !== 'quizzes') {
      setActiveTab('quizzes');
      return true;
    }
    return false;
  }, activeTab !== 'quizzes');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // 1. Load instant local cached data first
    const all = DataManager.getAllQuizzes({ teacherEmail: teacher.email, teacherId: teacher.id });
    setQuizzes(all);
    setDeletedCount(DataManager.getDeletedQuizIds().length);
    const subs = await DataManager.getTeacherSubmissions();
    setSubmissions(subs);

    // 2. Query Supabase health and fetch live cloud data
    setIsSyncingCloud(true);
    try {
      const health = await DataManager.checkSupabaseHealth();
      setDbHealth(health);

      if (health.tablesReady) {
        const cloudQuizzes = await DataManager.fetchQuizzesFromCloud({ teacherEmail: teacher.email, teacherId: teacher.id });
        setQuizzes(cloudQuizzes);
        const cloudSubs = await DataManager.getTeacherSubmissions();
        setSubmissions(cloudSubs);
      }
    } catch (e) {
      console.warn('TeacherDashboard cloud sync notice:', e);
    } finally {
      setIsSyncingCloud(false);
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
    setSelectedQuizForSettings(updated);
  };

  const handleDuplicateQuiz = async (quiz: Quiz) => {
    const dup = await DataManager.duplicateQuiz(quiz.id);
    if (dup) {
      await loadData();
    }
  };

  const handleViewSubmissionsFromQuiz = (_quiz: Quiz) => {
    handleTabChange('submissions');
  };

  const handleCopyPin = (pin: string) => {
    playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pin);
      setCopiedPin(pin);
      setTimeout(() => setCopiedPin(null), 2000);
    }
  };

  const handleCopyLink = (quiz: Quiz) => {
    playClick();
    const url = `${window.location.origin}${window.location.pathname}?pin=${quiz.pinCode || '1001'}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(quiz.id);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const handlePromptDeleteQuiz = (quiz: Quiz) => {
    playClick();
    setQuizToDelete(quiz);
  };

  const handleConfirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    setIsDeletingQuiz(true);
    try {
      await DataManager.deleteCustomQuiz(quizToDelete.id);
      await loadData();
      setQuizToDelete(null);
    } finally {
      setIsDeletingQuiz(false);
    }
  };

  const handleRunGenerator = async () => {
    playClick();
    setGenLoading(true);
    try {
      const generated = DataManager.generateQuickMathQuiz(genGrade, genCount);
      generated.creatorName = teacher.fullName;
      generated.creatorId = teacher.id;
      generated.visibility = 'public';
      await DataManager.saveCustomQuiz(generated);
      await loadData();
      setActiveTab('quizzes');
    } finally {
      setGenLoading(false);
    }
  };

  const handleExportCSV = () => {
    playClick();
    if (submissions.length === 0) {
      setExportNotice('Belum ada data pengerjaan siswa untuk diekspor.');
      setTimeout(() => setExportNotice(null), 3500);
      return;
    }

    const headers = ['Nama Siswa', 'Kuis', 'Nilai', 'Bintang', 'Benar', 'Total Soal', 'Waktu (detik)', 'Waktu Selesai'];
    const rows = submissions.map((s) => [
      `"${s.studentName}"`,
      `"${s.quizTitle}"`,
      s.score,
      s.stars,
      s.correctCount,
      s.totalCount,
      s.timeSpentSec,
      `"${s.submittedAt}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Nilai_KuisSD_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 flex flex-col">
      {/* Top Navbar */}
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-3 sm:px-8 lg:px-12 pt-[max(env(safe-area-inset-top),0.5rem)] pb-2 xs:pb-2.5 sm:pb-3 sticky top-0 z-30 shadow-sm transition-colors">
        <div className="w-full max-w-[2000px] mx-auto flex items-center justify-between gap-1.5 xs:gap-2 sm:gap-3">
          
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => {
                playClick();
                onGoHome();
              }}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors flex-shrink-0"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="hidden xs:flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white font-bold text-base sm:text-xl shadow-sm flex-shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <div className="min-w-0">
              <h1 className="text-xs xs:text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight flex items-center gap-1 truncate">
                <span className="truncate">Dashboard Guru</span>
                <span className="hidden sm:inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex-shrink-0">
                  Pro
                </span>
                {dbHealth && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                      dbHealth.tablesReady
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : dbHealth.connected
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                    title={dbHealth.message}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      dbHealth.tablesReady ? 'bg-emerald-500 animate-pulse' : dbHealth.connected ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    <span className="hidden md:inline">
                      {dbHealth.tablesReady ? 'Cloud Supabase' : dbHealth.connected ? 'Setup SQL Diperlukan' : 'Lokal'}
                    </span>
                  </span>
                )}
              </h1>
              <p className="text-[10px] xs:text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[100px] xs:max-w-[180px] sm:max-w-none">
                {teacher.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Dark / Light Mode Toggle */}
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

            <button
              onClick={() => {
                playClick();
                onOpenCreator();
              }}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm min-h-[40px] min-w-[40px] flex items-center justify-center shadow-sm transition-colors btn-press flex-shrink-0"
              title="Buat Kuis Baru"
              aria-label="Buat Kuis Baru"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline ml-1">Buat Kuis Baru</span>
            </button>

            <button
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

      {/* Main Container */}
      <main className="w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 pt-5 sm:pt-6 space-y-6 flex-1">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-hover">
          <button
            onClick={() => handleTabChange('quizzes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] whitespace-nowrap flex-shrink-0 ${
              activeTab === 'quizzes'
                ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bank Kuis & PIN Kelas ({quizzes.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('submissions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] whitespace-nowrap flex-shrink-0 ${
              activeTab === 'submissions'
                ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Rekap Nilai Siswa ({submissions.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('generator')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] whitespace-nowrap ${
              activeTab === 'generator'
                ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Generator Kilat Soal</span>
          </button>
        </div>

        {/* Database Status Alert Banner */}
        {dbHealth && dbHealth.connected && !dbHealth.tablesReady && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-amber-950 dark:text-amber-100">Koneksi Supabase Aktif — Menunggu Eksekusi Tabel</h3>
                <p className="mt-0.5 text-amber-800 dark:text-amber-300 leading-relaxed">
                  Proyek Supabase Anda telah terhubung sempurna via REST API, namun tabel-tabel database belum dibuat di schema <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded font-mono text-[11px]">public</code>. Silakan buka <strong>Supabase SQL Editor</strong> dan jalankan skrip <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded font-mono text-[11px]">docs/setup.sql</code> untuk mengaktifkan seluruh tabel, RLS, dan kuis secara otomatis.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                playClick();
                loadData();
              }}
              disabled={isSyncingCloud}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-sm flex-shrink-0 transition-all btn-press disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span>{isSyncingCloud ? 'Memeriksa...' : 'Cek Status Tabel'}</span>
            </button>
          </div>
        )}

        {/* TAB 1: BANK KUIS & PIN KELAS */}
        {activeTab === 'quizzes' && (
          <section className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Koleksi Kuis Aktif</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bagikan 4 digit PIN kepada siswa atau buka di Smartboard / TV Interaktif ruang kelas.
                </p>
              </div>

              {isMasterTeacher && deletedCount > 0 && (
                <button
                  onClick={handleRestoreDefaultQuizzes}
                  className="self-start sm:self-center py-2 px-3 rounded-xl font-bold text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 flex items-center gap-1.5 min-h-[40px] transition-colors btn-press"
                  title="Pulihkan kuis bawaan yang pernah dihapus saat pengujian"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Pulihkan Kuis Bawaan ({deletedCount})</span>
                </button>
              )}
            </div>

            {quizzes.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-4 max-w-lg mx-auto my-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-3xl">
                  📚
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Koleksi Kuis Anda Masih Kosong
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Mulai buat kuis interaktif buatan Anda sendiri atau gunakan Generator Kilat Soal untuk membuat kuis otomatis.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      playClick();
                      onOpenCreator();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 min-h-[44px] flex items-center justify-center gap-2 shadow-sm transition-all btn-press"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Kuis Baru</span>
                  </button>
                  {isMasterTeacher && deletedCount > 0 ? (
                    <button
                      onClick={handleRestoreDefaultQuizzes}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 min-h-[44px] flex items-center justify-center gap-2 transition-colors btn-press"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Pulihkan Kuis Bawaan ({deletedCount})</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        playClick();
                        setActiveTab('generator');
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 min-h-[44px] flex items-center justify-center gap-2 transition-colors btn-press"
                    >
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Generator Kilat</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4 sm:gap-5">
                {quizzes.map((quiz) => {
                  return (
                    <div
                      key={quiz.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-500/50 transition-all space-y-4"
                    >
                      <div>
                        {/* Top Row: PIN, Visibility Badge & Mapel */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-850 px-3 py-1 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300">PIN:</span>
                            <span className="font-mono font-black text-sm text-blue-900 dark:text-blue-100 tracking-wider">
                              {quiz.pinCode || '1001'}
                            </span>
                            <button
                              onClick={() => handleCopyPin(quiz.pinCode || '1001')}
                              className="p-1 hover:text-blue-600 dark:hover:text-blue-300 rounded transition-colors"
                              title="Salin PIN"
                            >
                              {copiedPin === (quiz.pinCode || '1001') ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Status Visibility Pill Badge */}
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border select-none ${
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

                            {/* Three-Dots Menu Button */}
                            <button
                              type="button"
                              onClick={() => {
                                playClick();
                                setSelectedQuizForSettings(quiz);
                              }}
                              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                              title="Pengaturan & Konfigurasi Kuis"
                              aria-label={`Pengaturan kuis ${quiz.title}`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      {/* Title & Emoji with Subject & Grade badges */}
                      <div className="flex items-start gap-2.5">
                        <span className="text-2xl p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 select-none flex-shrink-0">
                          {quiz.coverEmoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                              Kelas {quiz.grade}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                              {quiz.subject}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-2">
                            {quiz.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {quiz.description || 'Kuis interaktif tematik'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                      <span>{quiz.questions.length} Soal</span>
                      <span>•</span>
                      <span>{quiz.durationPerQuestionSec}s / soal</span>
                      <span>•</span>
                      <span>PIN: {quiz.pinCode || '1001'}</span>
                    </div>

                    {/* Action Buttons (Tombol in Card: 1. Mode IFP, 2. Bagi Tautan, 3. Edit) */}
                    <div className="space-y-2 pt-1">
                      {/* 1. Mode IFP */}
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          onLaunchSmartboard(quiz);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-2 min-h-[44px] btn-press transition-all"
                        title="Mode IFP"
                      >
                        <Tv className="w-4 h-4" />
                        <span>Mode IFP</span>
                      </button>

                      {/* Baris Tombol Sekunder: 2. Bagi Tautan & 3. Edit */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* 2. Bagi Tautan */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(quiz)}
                          className="py-2.5 px-2.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 flex items-center justify-center gap-1.5 min-h-[44px] transition-colors btn-press"
                          title="Bagi Tautan"
                        >
                          {copiedLink === quiz.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Bagi Tautan</span>
                            </>
                          )}
                        </button>

                        {/* 3. Edit */}
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            onOpenCreator(quiz);
                          }}
                          className="py-2.5 px-2.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 flex items-center justify-center gap-1.5 min-h-[44px] transition-colors btn-press"
                          title="Edit Kuis"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </section>
        )}

        {/* TAB 2: REKAP NILAI SISWA */}
        {activeTab === 'submissions' && (
          <section className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Rekap Nilai Siswa Real-Time</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data hasil pengerjaan kuis siswa tersimpan otomatis ke database.
                </p>
              </div>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 min-h-[44px] transition-colors btn-press self-start sm:self-auto"
              >
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Unduh Rekap (CSV/Excel)</span>
              </button>
            </div>

            {exportNotice && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fade-in">
                <span>⚠️</span>
                <span>{exportNotice}</span>
              </div>
            )}

            {submissions.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-800">
                <div className="text-4xl mb-2">📋</div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">Belum Ada Hasil Kuis Siswa</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Bagikan PIN kuis kepada siswa di kelas. Saat siswa menyelesaikan kuis, nilainya akan otomatis muncul di sini.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-card">
                <div className="overflow-x-auto scrollbar-hover">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="p-3.5">Nama Siswa</th>
                        <th className="p-3.5">Judul Kuis</th>
                        <th className="p-3.5 text-center">Nilai</th>
                        <th className="p-3.5 text-center">Bintang</th>
                        <th className="p-3.5 text-center">Akurasi</th>
                        <th className="p-3.5 text-center">Durasi</th>
                        <th className="p-3.5">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {sub.studentName}
                          </td>
                          <td className="p-3.5 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                            {sub.quizTitle}
                          </td>
                          <td className="p-3.5 text-center font-black text-blue-600 dark:text-blue-400 text-base">
                            {sub.score}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className="text-amber-500 font-bold">
                              {'⭐'.repeat(sub.stars)}
                            </span>
                          </td>
                          <td className="p-3.5 text-center text-slate-600 dark:text-slate-300 font-medium">
                            {sub.correctCount} / {sub.totalCount}
                          </td>
                          <td className="p-3.5 text-center text-slate-500 dark:text-slate-400 font-medium">
                            {sub.timeSpentSec}s
                          </td>
                          <td className="p-3.5 text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">
                            {sub.submittedAt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB 3: GENERATOR KILAT SOAL */}
        {activeTab === 'generator' && (
          <section className="max-w-3xl 2xl:max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-2xl">
                ⚡
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Generator Kilat Soal Matematika
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Buat satu set latihan berhitung lengkap dengan opsi jawaban dan pembahasan langkah otomatis hanya dalam 1 detik.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Pilih Tingkat Kelas:
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        playClick();
                        setGenGrade(g);
                      }}
                      className={`py-3 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] ${
                        genGrade === g
                          ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                          : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      Kelas {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Jumlah Soal:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[5, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => {
                        playClick();
                        setGenCount(cnt);
                      }}
                      className={`py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all min-h-[44px] ${
                        genCount === cnt
                          ? 'bg-slate-900 dark:bg-blue-600 text-white'
                          : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      {cnt} Soal
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Spesifikasi Soal Kelas {genGrade}:
                </span>
                <p className="text-blue-800 dark:text-blue-300">
                  {genGrade <= 2
                    ? 'Penjumlahan dan pengurangan angka ramah anak dengan batas puluhan.'
                    : genGrade <= 4
                    ? 'Perkalian dan pembagian konsep dasar bilangan cacah.'
                    : 'Operasi campuran, persentase, dan perpangkatan kuadrat.'}
                </p>
              </div>

              <button
                type="button"
                disabled={genLoading}
                onClick={handleRunGenerator}
                className="w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 min-h-[50px] btn-press transition-all disabled:opacity-50"
              >
                <Zap className="w-5 h-5 text-amber-300" />
                <span>{genLoading ? 'Membuat Kuis...' : 'Generate & Simpan ke Bank Soal'}</span>
              </button>
            </div>
          </section>
        )}

      </main>

      {/* Interactive Bottom Sheet for Quiz Settings & Reconfiguration */}
      <QuizSettingsModal
        isOpen={Boolean(selectedQuizForSettings)}
        quiz={selectedQuizForSettings}
        onClose={() => {
          playClick();
          setSelectedQuizForSettings(null);
        }}
        onDuplicate={handleDuplicateQuiz}
        onViewSubmissions={handleViewSubmissionsFromQuiz}
        onPrintWorksheet={onPrintWorksheet}
        onSaveSettings={handleSaveQuizSettings}
        onRequestDelete={(q) => {
          setSelectedQuizForSettings(null);
          handlePromptDeleteQuiz(q);
        }}
        canDelete={Boolean(
          selectedQuizForSettings && (
            isMasterTeacher ||
            selectedQuizForSettings.creatorId === teacher.id ||
            selectedQuizForSettings.id.startsWith('custom_')
          )
        )}
        playClick={playClick}
      />

      {/* In-App Custom Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(quizToDelete)}
        quizTitle={quizToDelete?.title}
        isLoading={isDeletingQuiz}
        onConfirm={handleConfirmDeleteQuiz}
        onCancel={() => {
          playClick();
          setQuizToDelete(null);
        }}
      />
    </div>
  );
};
