import React, { useState, useEffect, useMemo } from 'react';
import type { Quiz, StudentSubmission, TeacherProfile } from '../../types/quiz';
import { DataManager } from '../../lib/supabaseClient';
import { useBackHandler } from '../../lib/navigationHistory';
import { copyTextToClipboard } from '../../lib/aiQuestionParser';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { QuizCoverDisplay } from '../common/QuizCoverDisplay';
import { QuizIllustration } from '../shared/QuizIllustration';
import { PlayQuizModal, type PlayQuizSessionOptions } from './PlayQuizModal';
import { 
  ArrowLeft, 
  Pencil, 
  Play,
  Printer, 
  Copy, 
  Check, 
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
  onStartQuiz?: (quiz: Quiz, options: PlayQuizSessionOptions) => void;
  onDuplicateQuiz: (quiz: Quiz) => Promise<void> | void;
  onDeleteQuiz: (quiz: Quiz) => Promise<void> | void;
  onUpdateQuizSettings: (quizId: string, updates: Partial<Quiz>) => Promise<void>;
  playClick: () => void;
}

const getSubjectBadge = (subject: string) => {
  switch (subject) {
    case 'Matematika':
      return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300/80 dark:border-blue-900/60';
    case 'IPA':
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-900/60';
    case 'Bahasa Indonesia':
      return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300/80 dark:border-purple-900/60';
    case 'Pendidikan Pancasila':
      return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300/80 dark:border-rose-900/60';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-slate-700';
  }
};

export const formatSubmissionDate = (raw?: string | null): string => {
  if (!raw) return '-';
  const str = String(raw).trim();
  if (!str || str === '-') return '-';

  // 1. Format legacy yang terpotong tanpa tahun (misal: "15 Sep, 13.00" atau "15 Sep 13.00")
  const legacyTimeMatch = str.match(/^(\d{1,2})\s+([A-Za-z]+)[,\s]+(\d{1,2})[.:](\d{2})$/);
  if (legacyTimeMatch) {
    const [, day, monthStr, hour, min] = legacyTimeMatch;
    const currentYear = new Date().getFullYear();
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, may: 4, jun: 5, jul: 6, agu: 7, aug: 7, sep: 8, okt: 9, oct: 9, nop: 10, nov: 10, des: 11, dec: 11
    };
    const mKey = monthStr.toLowerCase().slice(0, 3);
    const monthIdx = months[mKey] !== undefined ? months[mKey] : new Date().getMonth();
    const d = new Date(currentYear, monthIdx, parseInt(day, 10), parseInt(hour, 10), parseInt(min, 10));
    if (!isNaN(d.getTime())) {
      return (
        d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) + ', ' + d.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }
  }

  // 2. Format legacy yang terlanjur ter-parse menjadi "15 Sep 2013, 00.00" atau "15 Sep 2013 00:00"
  const corrupted2013Match = str.match(/^(\d{1,2})\s+([A-Za-z]+)\s+2013[,\s]+00[.:]00$/);
  if (corrupted2013Match) {
    const [, day, monthStr] = corrupted2013Match;
    const currentYear = new Date().getFullYear();
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, may: 4, jun: 5, jul: 6, agu: 7, aug: 7, sep: 8, okt: 9, oct: 9, nop: 10, nov: 10, des: 11, dec: 11
    };
    const mKey = monthStr.toLowerCase().slice(0, 3);
    const monthIdx = months[mKey] !== undefined ? months[mKey] : new Date().getMonth();
    const d = new Date(currentYear, monthIdx, parseInt(day, 10), 13, 0);
    return (
      d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) + ', ' + d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }

  // 3. Standar ISO string (misal "2026-09-15T05:03:22.000Z") atau format tanggal valid lainnya
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    if (d.getFullYear() === 2013 && d.getHours() === 0 && d.getMinutes() === 0 && new Date().getFullYear() > 2013) {
      d.setFullYear(new Date().getFullYear());
      d.setHours(13, 0, 0, 0);
    }

    return (
      d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) + ', ' + d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }

  return str;
};

export const QuizDetail: React.FC<QuizDetailProps> = ({
  quiz,
  teacher,
  onBack,
  onEditQuiz,
  onLaunchSmartboard,
  onPrintWorksheet,
  onStartQuiz,
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
  const currentPin = quiz.pinCode || '1001';
  const [currentVisibility, setCurrentVisibility] = useState<'public' | 'private'>(quiz.visibility || 'public');
  const [isUpdatingVis, setIsUpdatingVis] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
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

      // Deduplikasi baris pengiriman identik (akibat duplikasi network/re-render kuis)
      const seen = new Set<string>();
      const deduplicated: StudentSubmission[] = [];
      for (const sub of filtered) {
        const formattedDate = formatSubmissionDate(sub.submittedAt);
        const dedupeKey = `${sub.studentName}_${sub.score}_${sub.correctCount}_${sub.timeSpentSec}_${formattedDate}`;
        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          deduplicated.push(sub);
        }
      }

      setSubmissions(deduplicated);
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
    const url = `${window.location.origin}/?pin=${currentPin}`;
    const success = await copyTextToClipboard(url);
    if (success) {
      setCopiedLink(true);
      showToast('✓ Tautan kuis berhasil disalin!');
      setTimeout(() => setCopiedLink(false), 2000);
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
      `"${formatSubmissionDate(s.submittedAt)}"`,
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

  const questionsCount = quiz.questions?.length || 0;

  return (
    <div className="min-h-screen bg-slate-100/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 flex flex-col animate-fade-in">
      {/* Toast Notification */}
      {noticeMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 dark:border-slate-200 text-xs font-bold flex items-center gap-2 animate-fade-in backdrop-blur-sm">
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-300/80 dark:border-slate-800 px-3 sm:px-6 py-2.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              playClick();
              onBack();
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm min-h-[44px] transition-colors btn-press"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline">Kembali ke Dashboard</span>
            <span className="xs:hidden">Kembali</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={async () => {
                playClick();
                await onDuplicateQuiz(quiz);
                showToast('✓ Kuis berhasil diduplikasi!');
              }}
              className="px-2.5 sm:px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-300/80 dark:border-slate-700 min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-bold transition-colors btn-press shadow-2xs"
              title="Duplikat Kuis Ini"
            >
              <CopyPlus className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="hidden md:inline">Duplikat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                setShowDeleteModal(true);
              }}
              className="px-2.5 sm:px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-300/80 dark:border-slate-700 min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-bold transition-colors btn-press shadow-2xs"
              title="Hapus Kuis Ini"
            >
              <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="hidden md:inline">Hapus</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                onEditQuiz(quiz);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm min-h-[44px] transition-all btn-press ml-0.5"
            >
              <Pencil className="w-4 h-4 shrink-0" />
              <span>Edit Kuis</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6 space-y-4 sm:space-y-5 flex-1 w-full">
        {/* Quiz Info Banner Card - High-Density, Compact & Structured */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-300/80 dark:border-slate-800 shadow-xs shadow-slate-200/50 dark:shadow-none space-y-4">
          
          {/* Top Section: Emoji, Title, Badges, & Metadata */}
          <div className="flex items-start gap-3 sm:gap-4.5">
            <QuizCoverDisplay
              cover={quiz.coverEmoji || '🍎'}
              className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-750 flex items-center justify-center text-2xl sm:text-3xl shadow-2xs border border-slate-300/80 dark:border-slate-700 shrink-0 select-none overflow-hidden"
            />

            <div className="min-w-0 flex-1 space-y-1.5">
              {/* Badges Row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border shadow-2xs ${getSubjectBadge(quiz.subject)}`}>
                  {quiz.subject}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700 shadow-2xs">
                  Kelas {quiz.grade} SD
                </span>
                {quiz.badgeTitle && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/80 flex items-center gap-1 shadow-2xs">
                    <Award className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{quiz.badgeTitle}</span>
                  </span>
                )}

                {/* Interactive Visibility Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleVisibility}
                  disabled={isUpdatingVis}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1 border transition-all cursor-pointer shadow-2xs hover:opacity-90 active:scale-95 ${
                    currentVisibility === 'public'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300/80 dark:border-amber-800'
                  }`}
                  title="Klik untuk mengubah akses siswa (Publik di Katalog / Privat via PIN)"
                >
                  {currentVisibility === 'public' ? (
                    <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                  <span>{currentVisibility === 'public' ? 'Publik di Katalog' : 'Privat via PIN'}</span>
                  <span className="text-[9px] underline opacity-75 ml-0.5">Ubah</span>
                </button>
              </div>

              {/* Title */}
              <h1 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-snug tracking-tight">
                {quiz.title}
              </h1>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl line-clamp-2 sm:line-clamp-none">
                {quiz.description || 'Latihan kuis interaktif Kurikulum Merdeka Sekolah Dasar.'}
              </p>

              {/* Clean Meta Stats Row (No stray wrapped bullets) */}
              <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-0.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span><strong>{questionsCount}</strong> Butir Soal</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span><strong>{quiz.durationPerQuestionSec} detik</strong> / soal</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Pendidik: {quiz.creatorName || teacher.fullName}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Integrated Quick Bar: PIN, Share & Action Buttons */}
          <div className="pt-3.5 border-t border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* PIN & Share Strip */}
            <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-slate-800/70 p-1.5 sm:p-2 rounded-xl border border-slate-300/80 dark:border-slate-700/80 flex-wrap sm:flex-nowrap">
              <div className="px-2 py-0.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">PIN Kelas</span>
                <span className="text-base sm:text-lg font-black tracking-widest text-blue-600 dark:text-blue-400 font-mono leading-none">
                  {currentPin}
                </span>
              </div>

              <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 border border-slate-300/80 dark:border-slate-600 text-xs font-bold inline-flex items-center gap-1.5 min-h-[38px] transition-colors btn-press shadow-2xs"
                  title="Salin PIN Kelas 4 Digit"
                >
                  {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                  <span>{copiedPin ? 'Tersalin' : 'Salin PIN'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 border border-slate-300/80 dark:border-slate-600 text-xs font-bold inline-flex items-center gap-1.5 min-h-[38px] transition-colors btn-press shadow-2xs"
                  title="Salin Tautan Langsung Kuis"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Share2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                  <span>{copiedLink ? 'Tersalin' : 'Bagi Tautan'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsPlayModalOpen(true);
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs min-h-[44px] transition-all btn-press tracking-wide"
                title="Buka Pengaturan & Mulai Sesi Bermain"
              >
                <Play className="w-4 h-4 fill-white text-white shrink-0" />
                <span className="whitespace-nowrap">Mainkan Sekarang</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  onPrintWorksheet(quiz);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[44px] transition-all btn-press shadow-2xs"
                title="Cetak Soal Kuis ke Lembar Kerja Siswa (LKS)"
              >
                <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                <span className="whitespace-nowrap">Cetak LKS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Segmented Control Sub-Tabs Bar */}
        <div className="bg-slate-200/75 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-300/90 dark:border-slate-800 flex items-center gap-1 shadow-2xs max-w-md">
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveSubTab('rekap');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[40px] btn-press ${
              activeSubTab === 'rekap'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Rekap Nilai</span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-black ${
              activeSubTab === 'rekap' ? 'bg-white/20 text-white' : 'bg-slate-300/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {submissions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveSubTab('soal');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[40px] btn-press ${
              activeSubTab === 'soal'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Pratinjau Soal</span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-black ${
              activeSubTab === 'soal' ? 'bg-white/20 text-white' : 'bg-slate-300/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {questionsCount}
            </span>
          </button>
        </div>

        {/* TAB 1: REKAP NILAI SISWA */}
        {activeSubTab === 'rekap' && (
          <div className="space-y-4 sm:space-y-5 animate-fade-in">
            {/* 4 Summary Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-300/80 dark:border-slate-800 shadow-xs shadow-slate-200/50 dark:shadow-none flex flex-col justify-between">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-900/60 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Siswa Selesai</span>
                </div>
                <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                  {stats.totalStudents} <span className="text-xs font-normal text-slate-500">anak</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-300/80 dark:border-slate-800 shadow-xs shadow-slate-200/50 dark:shadow-none flex flex-col justify-between">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-900/60 flex items-center justify-center shrink-0">
                    <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span>Rata-Rata Nilai</span>
                </div>
                <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                  {stats.avgScore} <span className="text-xs font-normal text-slate-500">/ 100</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-300/80 dark:border-slate-800 shadow-xs shadow-slate-200/50 dark:shadow-none flex flex-col justify-between">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-900/60 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span>Nilai Tertinggi</span>
                </div>
                <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                  {stats.highestScore} <span className="text-xs font-normal text-slate-500">/ 100</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-300/80 dark:border-slate-800 shadow-xs shadow-slate-200/50 dark:shadow-none flex flex-col justify-between">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200/70 dark:border-purple-900/60 flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span>Rata-Rata Waktu</span>
                </div>
                <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                  {stats.avgTime}s <span className="text-xs font-normal text-slate-500">/ siswa</span>
                </div>
              </div>
            </div>

            {/* Table Header & Download Action */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-300/80 dark:border-slate-800 overflow-hidden shadow-xs shadow-slate-200/50 dark:shadow-none">
              <div className="p-3.5 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
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
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300/80 dark:border-emerald-800/80 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors disabled:opacity-40 min-h-[40px] btn-press shadow-2xs"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Unduh Rekap (CSV)</span>
                </button>
              </div>

              {isLoadingSubs ? (
                <div className="p-12 text-center text-xs text-slate-500 font-medium">Memuat rekap nilai siswa...</div>
              ) : submissions.length === 0 ? (
                <div className="p-10 sm:p-14 text-center space-y-3.5">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/70 flex items-center justify-center text-3xl shadow-xs">
                    📋
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                      Belum Ada Siswa yang Menyelesaikan Kuis Ini
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                      Bagikan PIN <strong>{currentPin}</strong> kepada siswa atau buka kuis di Smartboard kelas. Jawaban dan skor setiap siswa akan langsung tercatat otomatis di tabel ini.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setIsPlayModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs min-h-[44px] transition-all btn-press"
                    >
                      <Play className="w-4 h-4 fill-white text-white shrink-0" />
                      <span>Mulai Kuis Bersama Siswa</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-hover">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">No</th>
                        <th className="py-3 px-4">Nama Siswa</th>
                        <th className="py-3 px-4 text-center">Nilai</th>
                        <th className="py-3 px-4 text-center">Bintang</th>
                        <th className="py-3 px-4 text-center">Benar / Soal</th>
                        <th className="py-3 px-4 text-center">Durasi</th>
                        <th className="py-3 px-4 text-right">Tanggal Pengerjaan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800 font-medium">
                      {submissions.map((s, idx) => (
                        <tr key={s.id || idx} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {s.studentName || 'Anonim'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block font-black px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums shadow-2xs ${
                              (s.score || 0) >= 80 
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800' 
                                : (s.score || 0) >= 60 
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800'
                            }`}>
                              {s.score || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-amber-500 font-bold tracking-widest text-xs">
                            {'⭐'.repeat(Math.min(3, s.stars || 1))}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-700 dark:text-slate-300 font-semibold">
                            {s.correctCount || 0} / {s.totalCount || questionsCount}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
                            {s.timeSpentSec ? `${s.timeSpentSec}s` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400 text-xs font-medium">
                            {formatSubmissionDate(s.submittedAt)}
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
          <div className="space-y-3.5 sm:space-y-4 animate-fade-in">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Daftar Butir Soal Kuis ({questionsCount})
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
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm min-h-[40px] btn-press"
              >
                <Pencil className="w-3.5 h-3.5 shrink-0" />
                <span>Edit / Tambah Soal</span>
              </button>
            </div>

            <div className="space-y-3">
              {(quiz.questions || []).map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 shadow-xs shadow-slate-200/50 dark:shadow-none space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-2xs">
                        {idx + 1}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 px-2 py-0.5 rounded-md">
                        {q.type === 'multiple_choice' ? 'Pilihan Ganda' :
                         q.type === 'true_false' ? 'Benar / Salah' :
                         q.type === 'short_answer' ? 'Isian Singkat' :
                         q.type === 'matching_pairs' ? 'Menjodohkan' :
                         q.type === 'image_guess' ? 'Tebak Gambar' : 'Soal'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800 font-mono">
                        {q.points || 10} Poin
                      </span>
                      {q.customDurationSec && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-300/80 dark:border-blue-800 font-mono">
                          {q.customDurationSec}s
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-relaxed">
                    {q.text}
                  </p>

                  {/* Image illustration preview */}
                  {q.imageUrl && (
                    <div className="pt-1 max-w-md">
                      <QuizIllustration
                        imageUrl={q.imageUrl}
                        imageCaption={q.imageCaption}
                        imagePrompt={q.imagePrompt}
                        alt={q.imageCaption || 'Ilustrasi Soal'}
                        imgClassName="max-h-48 rounded-xl border border-slate-300/80 dark:border-slate-700 object-contain shadow-2xs"
                        enableZoom={true}
                        playClick={playClick}
                      />
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
                            className={`p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-2xs ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-300/80 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1 leading-snug">{opt}</span>
                            {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
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
                            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-2xs ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-300/80 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                            <span>{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'short_answer' && (
                    <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-300/80 dark:border-emerald-800/80 text-xs shadow-2xs">
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
                        <div key={pIdx} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-300/80 dark:border-slate-700 flex items-center justify-between text-xs font-semibold shadow-2xs">
                          <span className="text-slate-800 dark:text-slate-200">{p.left}</span>
                          <span className="text-blue-500 font-bold px-1.5">↔</span>
                          <span className="text-emerald-700 dark:text-emerald-300">{p.right}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                      <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">💡 Pembahasan:</span>
                      <span className="leading-relaxed">{q.explanation}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

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

      {/* Modal Pengaturan Sesi Bermain & Mulai Kuis Siswa */}
      <PlayQuizModal
        isOpen={isPlayModalOpen}
        onClose={() => setIsPlayModalOpen(false)}
        quiz={quiz}
        onStartQuiz={(q, opts) => {
          setIsPlayModalOpen(false);
          if (onStartQuiz) {
            onStartQuiz(q, opts);
          } else {
            onLaunchSmartboard(q);
          }
        }}
        playClick={playClick}
      />
    </div>
  );
};
