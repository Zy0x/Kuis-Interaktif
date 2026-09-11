import React, { useState, useEffect, useMemo } from 'react';
import type { Quiz, StudentSubmission, TeacherProfile } from '../../types/quiz';
import { DataManager, generateRandomPin } from '../../lib/supabaseClient';
import { useBackHandler } from '../../lib/navigationHistory';
import { copyTextToClipboard } from '../../lib/aiQuestionParser';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { 
  ArrowLeft, 
  Pencil, 
  Tv, 
  Printer, 
  Copy, 
  Check, 
  RotateCcw, 
  Globe, 
  Lock, 
  Trash2, 
  Users, 
  Award, 
  Clock, 
  HelpCircle, 
  Download, 
  BarChart3, 
  CheckCircle2, 
  Calendar, 
  BookOpen, 
  CopyPlus,
  Share2
} from 'lucide-react';

interface QuizDetailProps {
  quiz: Quiz;
  teacher: TeacherProfile;
  onBack: () => void;
  onEditQuiz: (quiz: Quiz) => void;
  onLaunchSmartboard: (quiz: Quiz) => void;
  onPrintWorksheet: (quiz: Quiz) => void;
  onDuplicateQuiz: (quiz: Quiz) => Promise<void> | void;
  onDeleteQuiz: (quiz: Quiz) => Promise<void> | void;
  onUpdateQuizSettings: (quizId: string, updates: Partial<Quiz>) => Promise<void>;
  playClick: () => void;
}

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

export const QuizDetail: React.FC<QuizDetailProps> = ({
  quiz,
  onBack,
  onEditQuiz,
  onLaunchSmartboard,
  onPrintWorksheet,
  onDuplicateQuiz,
  onDeleteQuiz,
  onUpdateQuizSettings,
  playClick,
}) => {
  // Navigation back handler
  useBackHandler('quiz-detail-view', 60, () => {
    onBack();
    return true;
  }, true);

  const [activeSubTab, setActiveSubTab] = useState<'rekap' | 'soal'>('rekap');
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(true);
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentPin, setCurrentPin] = useState(quiz.pinCode || '1001');
  const [currentVisibility, setCurrentVisibility] = useState<'public' | 'private'>(quiz.visibility || 'public');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);
  const [isUpdatingVis, setIsUpdatingVis] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 3000);
  };

  useEffect(() => {
    loadQuizSubmissions();
  }, [quiz.id]);

  const loadQuizSubmissions = async () => {
    setIsLoadingSubs(true);
    try {
      const allSubs = await DataManager.getTeacherSubmissions();
      // Filter submissions specific to this quiz (by ID or Title)
      const filtered = allSubs.filter(
        (s) => s.quizId === quiz.id || s.quizTitle === quiz.title
      );
      setSubmissions(filtered);
    } catch (err) {
      console.error('Gagal memuat rekap nilai kuis:', err);
    } finally {
      setIsLoadingSubs(false);
    }
  };

  // Metrics calculation
  const stats = useMemo(() => {
    if (submissions.length === 0) {
      return { totalStudents: 0, avgScore: 0, highestScore: 0, avgTime: 0, passRate: 0 };
    }
    const totalStudents = submissions.length;
    const totalScore = submissions.reduce((acc, curr) => acc + (curr.score || 0), 0);
    const avgScore = Math.round(totalScore / totalStudents);
    const highestScore = Math.max(...submissions.map((s) => s.score || 0));
    const totalTime = submissions.reduce((acc, curr) => acc + (curr.timeSpentSec || 0), 0);
    const avgTime = Math.round(totalTime / totalStudents);
    const passedCount = submissions.filter((s) => (s.score || 0) >= 70).length;
    const passRate = Math.round((passedCount / totalStudents) * 100);

    return { totalStudents, avgScore, highestScore, avgTime, passRate };
  }, [submissions]);

  const handleCopyPin = async () => {
    playClick();
    const success = await copyTextToClipboard(currentPin);
    if (success) {
      setCopiedPin(true);
      showToast('✓ 4 Digit PIN berhasil disalin!');
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    playClick();
    const url = `${window.location.origin}${window.location.pathname}?pin=${currentPin}`;
    const success = await copyTextToClipboard(url);
    if (success) {
      setCopiedLink(true);
      showToast('✓ Tautan kuis berhasil disalin!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleRandomizePin = async () => {
    playClick();
    setIsUpdatingPin(true);
    const newPin = generateRandomPin();
    setCurrentPin(newPin);
    try {
      await onUpdateQuizSettings(quiz.id, { pinCode: newPin });
      showToast(`✓ PIN baru dibuat: ${newPin}`);
    } catch {
      showToast('Gagal mengubah PIN.');
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const handleToggleVisibility = async () => {
    playClick();
    setIsUpdatingVis(true);
    const nextVis = currentVisibility === 'public' ? 'private' : 'public';
    setCurrentVisibility(nextVis);
    try {
      await onUpdateQuizSettings(quiz.id, { visibility: nextVis });
      showToast(nextVis === 'public' ? '✓ Visibilitas: Publik (Tampil di Katalog)' : '✓ Visibilitas: Privat (Khusus PIN)');
    } catch {
      showToast('Gagal mengubah status visibilitas.');
    } finally {
      setIsUpdatingVis(false);
    }
  };

  const handleExportCSV = () => {
    playClick();
    if (submissions.length === 0) {
      showToast('Belum ada data nilai siswa untuk diunduh.');
      return;
    }

    const headers = ['No', 'Nama Siswa', 'Kuis', 'Mata Pelajaran', 'Kelas', 'Nilai', 'Bintang', 'Benar', 'Total Soal', 'Waktu (Detik)', 'Tanggal Pengerjaan'];
    const rows = submissions.map((s, idx) => [
      idx + 1,
      `"${(s.studentName || 'Anonim').replace(/"/g, '""')}"`,
      `"${quiz.title.replace(/"/g, '""')}"`,
      quiz.subject,
      `Kelas ${quiz.grade}`,
      s.score,
      s.stars,
      s.correctCount,
      s.totalCount,
      s.timeSpentSec,
      `"${s.submittedAt}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const sanitizedTitle = quiz.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    link.setAttribute('download', `Rekap_Nilai_${sanitizedTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ File rekap nilai (CSV) berhasil diunduh!');
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteQuiz(quiz);
      onBack();
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 flex flex-col animate-fade-in">
      {/* Toast Notification */}
      {noticeMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-fade-in">
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              playClick();
              onBack();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm min-h-[42px] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playClick();
                onEditQuiz(quiz);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm min-h-[42px] transition-all btn-press"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Kuis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6 flex-1 w-full">
        {/* Quiz Info Banner Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Left: Emoji, Title, Badges */}
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-750 flex items-center justify-center text-3xl sm:text-4xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex-shrink-0 select-none">
                {quiz.coverEmoji || '🍎'}
              </div>
              <div className="min-w-0 space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${getSubjectBadge(quiz.subject)}`}>
                    {quiz.subject}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Kelas {quiz.grade} SD
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    {quiz.badgeTitle || 'Bintang Pintar'}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                  {quiz.title}
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                  {quiz.description || 'Latihan kuis interaktif Kurikulum Merdeka Sekolah Dasar.'}
                </p>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 pt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                    <strong>{quiz.questions.length}</strong> Butir Soal
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <strong>{quiz.durationPerQuestionSec} detik</strong> / soal
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    Dibuat {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Baru saja'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Settings (PIN, Visibility) */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[240px] flex-shrink-0 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              
              {/* PIN Box */}
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PIN Kelas:</span>
                  <div className="text-lg font-black tracking-widest text-blue-600 dark:text-blue-400 font-mono">
                    {currentPin}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCopyPin}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 border border-slate-200 dark:border-slate-700 min-h-[38px] min-w-[38px] flex items-center justify-center transition-colors"
                    title="Salin PIN"
                  >
                    {copiedPin ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleRandomizePin}
                    disabled={isUpdatingPin}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 border border-slate-200 dark:border-slate-700 min-h-[38px] min-w-[38px] flex items-center justify-center transition-colors disabled:opacity-50"
                    title="Buat PIN Baru Secara Acak"
                  >
                    <RotateCcw className={`w-4 h-4 ${isUpdatingPin ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Visibility Button */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Akses Siswa:</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                    currentVisibility === 'public' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {currentVisibility === 'public' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    {currentVisibility === 'public' ? 'Publik di Katalog' : 'Privat via PIN'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleVisibility}
                  disabled={isUpdatingVis}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                >
                  Ubah
                </button>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onLaunchSmartboard(quiz);
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm min-h-[42px] transition-all btn-press"
              >
                <Tv className="w-4 h-4" />
                <span>Buka Mode IFP / Smartboard</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  onPrintWorksheet(quiz);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2 min-h-[42px] transition-all btn-press"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Kerja (LKS)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2 min-h-[42px] transition-all btn-press"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-blue-500" />}
                <span>{copiedLink ? 'Tautan Tersalin' : 'Bagi Tautan'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  playClick();
                  await onDuplicateQuiz(quiz);
                  showToast('✓ Kuis berhasil diduplikasi!');
                }}
                className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 min-h-[42px] min-w-[42px] flex items-center justify-center transition-colors"
                title="Duplikat Kuis Ini"
              >
                <CopyPlus className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShowDeleteModal(true);
                }}
                className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 min-h-[42px] min-w-[42px] flex items-center justify-center transition-colors"
                title="Hapus Kuis Ini"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Selector: Rekap Nilai vs Daftar Soal */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveSubTab('rekap');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] ${
              activeSubTab === 'rekap'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Rekap Nilai Siswa ({submissions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveSubTab('soal');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] ${
              activeSubTab === 'soal'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Pratinjau Soal ({quiz.questions.length})</span>
          </button>
        </div>

        {/* TAB 1: REKAP NILAI SISWA */}
        {activeSubTab === 'rekap' && (
          <div className="space-y-6 animate-fade-in">
            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>Siswa Selesai</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {stats.totalStudents} <span className="text-xs font-normal text-slate-500">anak</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Rata-Rata Nilai</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {stats.avgScore} <span className="text-xs font-normal text-slate-500">/ 100</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Nilai Tertinggi</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {stats.highestScore} <span className="text-xs font-normal text-slate-500">/ 100</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span>Rata-Rata Waktu</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {stats.avgTime}s <span className="text-xs font-normal text-slate-500">/ kuis</span>
                </div>
              </div>
            </div>

            {/* Table Header & Download Action */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Tabel Hasil Pengerjaan Siswa
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nilai otomatis diperbarui secara real-time saat siswa menyelesaikan kuis.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={submissions.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/80 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors disabled:opacity-40 min-h-[40px]"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Rekap (CSV / Excel)</span>
                </button>
              </div>

              {isLoadingSubs ? (
                <div className="p-12 text-center text-xs text-slate-500">Memuat rekap nilai siswa...</div>
              ) : submissions.length === 0 ? (
                <div className="p-12 text-center space-y-2.5">
                  <div className="text-4xl">📋</div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                    Belum Ada Siswa yang Menyelesaikan Kuis Ini
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Bagikan PIN <strong>{currentPin}</strong> atau buka kuis di Smartboard kelas. Jawaban dan skor setiap siswa akan langsung tercatat di sini secara otomatis.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-hover">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase">
                        <th className="py-3 px-4">No</th>
                        <th className="py-3 px-4">Nama Siswa</th>
                        <th className="py-3 px-4 text-center">Nilai</th>
                        <th className="py-3 px-4 text-center">Bintang</th>
                        <th className="py-3 px-4 text-center">Benar / Soal</th>
                        <th className="py-3 px-4 text-center">Durasi</th>
                        <th className="py-3 px-4 text-right">Tanggal Pengerjaan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {submissions.map((s, idx) => (
                        <tr key={s.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {s.studentName || 'Anonim'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block font-black px-2.5 py-1 rounded-lg text-xs ${
                              (s.score || 0) >= 80 
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
                                : (s.score || 0) >= 60 
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                            }`}>
                              {s.score || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-amber-500 font-bold">
                            {'⭐'.repeat(Math.min(3, s.stars || 1))}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-300">
                            {s.correctCount || 0} / {s.totalCount || quiz.questions.length}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
                            {s.timeSpentSec ? `${s.timeSpentSec}s` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400 text-xs">
                            {s.submittedAt ? new Date(s.submittedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRATINJAU BUTIR SOAL */}
        {activeSubTab === 'soal' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Daftar Butir Soal Kuis ({quiz.questions.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tinjau seluruh pertanyaan, kunci jawaban, dan pembahasan materi.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  onEditQuiz(quiz);
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm min-h-[40px]"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit / Tambah Soal di Creator</span>
              </button>
            </div>

            <div className="space-y-3">
              {quiz.questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {q.type === 'multiple_choice' ? 'Pilihan Ganda' :
                         q.type === 'true_false' ? 'Benar / Salah' :
                         q.type === 'short_answer' ? 'Isian Singkat' :
                         q.type === 'matching_pairs' ? 'Menjodohkan' :
                         q.type === 'image_guess' ? 'Tebak Gambar' : 'Soal'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span>{q.points || 10} Poin</span>
                      {q.customDurationSec && (
                        <span>• {q.customDurationSec}s</span>
                      )}
                    </div>
                  </div>

                  <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-relaxed">
                    {q.text}
                  </p>

                  {/* Image illustration preview */}
                  {q.imageUrl && (
                    <div className="pt-1">
                      <img
                        src={q.imageUrl}
                        alt={q.imageCaption || 'Ilustrasi Soal'}
                        className="max-h-48 rounded-xl border border-slate-200 dark:border-slate-700 object-cover"
                        loading="lazy"
                      />
                      {q.imageCaption && (
                        <p className="text-[11px] text-slate-500 italic mt-1">{q.imageCaption}</p>
                      )}
                    </div>
                  )}

                  {/* Options List */}
                  {q.type === 'multiple_choice' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = optIdx === q.correctIndex;
                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'true_false' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(q.options && q.options.length >= 2 ? q.options : ['Benar', 'Salah']).map((val, bIdx) => {
                        const isCorrect = bIdx === q.correctIndex;
                        return (
                          <div
                            key={`${val}-${bIdx}`}
                            className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                            <span>{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'short_answer' && (
                    <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">Kunci Jawaban: </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {q.options[0]}
                        {q.acceptableAnswers && q.acceptableAnswers.length > 1 && (
                          <span className="text-slate-500 dark:text-slate-400 font-normal"> (Variasi: {q.acceptableAnswers.join(', ')})</span>
                        )}
                      </span>
                    </div>
                  )}

                  {q.type === 'matching_pairs' && q.matchingPairs && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.matchingPairs.map((p, pIdx) => (
                        <div key={pIdx} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-800 dark:text-slate-200">{p.left}</span>
                          <span className="text-blue-500 font-bold px-1.5">↔</span>
                          <span className="text-emerald-700 dark:text-emerald-300">{p.right}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                      <span className="font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">💡 Pembahasan:</span>
                      <span className="leading-relaxed">{q.explanation}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Hapus Kuis */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        title="Hapus Kuis Ini?"
        quizTitle={quiz.title}
        description={`Apakah Anda yakin ingin menghapus kuis "${quiz.title}"? Data kuis dan riwayat nilai siswa terkait akan dihapus secara permanen.`}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
