import React, { useState, useMemo } from 'react';
import type { Quiz, QuizSession, QuizSessionParticipant } from '../../types/quiz';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { StudentAnswerAnalysisModal } from './StudentAnswerAnalysisModal';
import { formatIndonesianTime } from '../../lib/dateUtils';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Trophy, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  Search, 
  AlertTriangle,
  Award,
  TrendingUp,
  Users,
  Eye,
  RotateCcw,
  Calculator,
  Share2
} from 'lucide-react';
import { ReactivateSessionModal } from './ReactivateSessionModal';
import { RecalculateScoresModal } from './RecalculateScoresModal';
import { ClassReviewModal } from './ClassReviewModal';
import { generateStudentWhatsAppUrl } from '../../lib/shareUtils';
import { triggerHaptic } from '../../lib/mobileUtils';
import { DataManager } from '../../lib/supabaseClient';

interface QuizSessionRecapViewProps {
  session: QuizSession;
  quiz: Quiz;
  onBack: () => void;
  onSessionUpdated?: (updated: QuizSession) => void;
  playClick: () => void;
}

export const QuizSessionRecapView: React.FC<QuizSessionRecapViewProps> = ({
  session,
  quiz,
  onBack,
  onSessionUpdated,
  playClick,
}) => {
  const [currentSession, setCurrentSession] = useState<QuizSession>(session);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const [isRecalculateModalOpen, setIsRecalculateModalOpen] = useState(false);
  const [isClassReviewOpen, setIsClassReviewOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'remedial'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'questions'>('overview');
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<QuizSessionParticipant | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    setCurrentSession(session);
  }, [session]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  const handleReactivateSession = async (sessionId: string, newDeadlineIso: string | null) => {
    const updated = await DataManager.reactivateQuizSession(sessionId, newDeadlineIso);
    if (updated) {
      setCurrentSession(updated);
      if (onSessionUpdated) {
        onSessionUpdated(updated);
      }
      showToast(`🎉 Sesi kuis PIN ${updated.pinCode} berhasil diaktifkan kembali! Siswa dapat mengerjakan kembali.`);
    }
  };

  const handleRecalculateScores = async () => {
    const res = await DataManager.recalculateSessionScores(currentSession.id);
    if (res.session) {
      setCurrentSession({ ...res.session });
      if (onSessionUpdated) {
        onSessionUpdated(res.session);
      }
      showToast(`🎉 Nilai ${res.updatedCount} siswa berhasil dihitung ulang dan disinkronkan!`);
    }
  };

  const totalQuestions = quiz.questions?.length || currentSession.totalQuestions || 1;
  const participants = currentSession.participants || [];

  // Ranked participants
  const rankedParticipants = useMemo(() => {
    return [...participants].map((p) => {
      const rawAns = p.answers ? Object.values(p.answers).filter((a: any) => a && a.questionId !== 'quiz_completed') : [];
      const uniqueQMap = new Map<string, any>();
      rawAns.forEach((a: any) => {
        const key = a.questionId || String(a.questionIndex);
        uniqueQMap.set(key, a);
      });
      const pAnsList = Array.from(uniqueQMap.values());
      const safeCorrect = pAnsList.length > 0 
        ? Math.min(totalQuestions, pAnsList.filter((a: any) => a.isCorrect).length)
        : Math.min(totalQuestions, p.correctCount);
      const safeIncorrect = pAnsList.length > 0
        ? pAnsList.filter((a: any) => !a.isCorrect).length
        : Math.min(totalQuestions - safeCorrect, p.incorrectCount);
      const answeredCount = pAnsList.length > 0
        ? pAnsList.length
        : Math.min(totalQuestions, safeCorrect + safeIncorrect);
      const safeUnanswered = Math.max(0, totalQuestions - answeredCount);
      const safeScore = Math.min(100, pAnsList.length > 0
        ? Math.round((safeCorrect / totalQuestions) * 100)
        : p.score);
      return {
        ...p,
        score: safeScore,
        correctCount: safeCorrect,
        incorrectCount: safeIncorrect,
        unansweredCount: safeUnanswered,
      };
    }).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      return a.timeSpentSec - b.timeSpentSec;
    });
  }, [participants, totalQuestions]);

  // Filtered by search and status
  const filteredParticipants = useMemo(() => {
    let list = rankedParticipants;
    if (statusFilter === 'passed') {
      list = list.filter((p) => p.score >= 70);
    } else if (statusFilter === 'remedial') {
      list = list.filter((p) => p.score < 70);
    }
    if (!searchStudent.trim()) return list;
    const q = searchStudent.toLowerCase();
    return list.filter((p) => p.name.toLowerCase().includes(q));
  }, [rankedParticipants, searchStudent, statusFilter]);

  const passedCount = useMemo(() => rankedParticipants.filter((p) => p.score >= 70).length, [rankedParticipants]);
  const remedialCount = useMemo(() => rankedParticipants.filter((p) => p.score < 70).length, [rankedParticipants]);

  // Deep Analytics calculation
  const analytics = useMemo(() => {
    const totalParts = participants.length;
    if (totalParts === 0) {
      return {
        avgScore: 0,
        avgAccuracy: 0,
        avgTimePerStudent: 0,
        passRate: 0, // score >= 70
        questionStats: [] as {
          index: number;
          correctRate: number;
          optionCounts: number[];
          totalAnswered: number;
        }[],
        hardestQuestionIdx: -1,
        easiestQuestionIdx: -1,
        needsHelpStudents: [] as QuizSessionParticipant[],
      };
    }

    let totalScore = 0;
    let totalTime = 0;
    let passCount = 0;

    const questionCorrectCounts = new Array(totalQuestions).fill(0);
    const questionAnsweredCounts = new Array(totalQuestions).fill(0);
    const questionOptionDist: number[][] = Array.from({ length: totalQuestions }, () => [0, 0, 0, 0]);

    participants.forEach((p) => {
      totalScore += p.score;
      totalTime += p.timeSpentSec;
      if (p.score >= 70) passCount++;

      Object.values(p.answers || {}).forEach((ans: any) => {
        if (ans && ans.questionId !== 'quiz_completed') {
          const masterIdx = quiz.questions ? quiz.questions.findIndex((q) => q.id === ans.questionId) : -1;
          const resolvedIdx = masterIdx >= 0 ? masterIdx : (typeof ans.questionIndex === 'number' ? ans.questionIndex : -1);
          if (resolvedIdx >= 0 && resolvedIdx < totalQuestions) {
            questionAnsweredCounts[resolvedIdx]++;
            if (ans.isCorrect) {
              questionCorrectCounts[resolvedIdx]++;
            }
            if (ans.selectedOption !== undefined && ans.selectedOption >= 0 && ans.selectedOption < 4) {
              questionOptionDist[resolvedIdx][ans.selectedOption]++;
            }
          }
        }
      });
    });

    const questionStats = quiz.questions.map((_, idx) => {
      const answered = questionAnsweredCounts[idx];
      const correct = questionCorrectCounts[idx];
      return {
        index: idx,
        correctRate: answered > 0 ? Math.round((correct / answered) * 100) : 0,
        optionCounts: questionOptionDist[idx],
        totalAnswered: answered,
      };
    });

    // Hardest & easiest
    let minRate = 101;
    let maxRate = -1;
    let hardestIdx = -1;
    let easiestIdx = -1;

    questionStats.forEach((stat) => {
      if (stat.totalAnswered > 0) {
        if (stat.correctRate < minRate) {
          minRate = stat.correctRate;
          hardestIdx = stat.index;
        }
        if (stat.correctRate > maxRate) {
          maxRate = stat.correctRate;
          easiestIdx = stat.index;
        }
      }
    });

    const needsHelpStudents = rankedParticipants.filter((p) => p.score < 60);

    const totalAnswersOverall = questionAnsweredCounts.reduce((a, b) => a + b, 0);
    const totalCorrectOverall = questionCorrectCounts.reduce((a, b) => a + b, 0);
    const overallAccuracy = totalAnswersOverall > 0 ? Math.round((totalCorrectOverall / totalAnswersOverall) * 100) : 0;

    return {
      avgScore: Math.round(totalScore / totalParts),
      avgAccuracy: overallAccuracy,
      avgTimePerStudent: Math.round(totalTime / totalParts),
      passRate: Math.round((passCount / totalParts) * 100),
      questionStats,
      hardestQuestionIdx: hardestIdx,
      easiestQuestionIdx: easiestIdx,
      needsHelpStudents,
    };
  }, [participants, quiz.questions, rankedParticipants, totalQuestions]);

  // Export CSV Handler
  const handleExportCSV = () => {
    playClick();
    if (participants.length === 0) {
      showToast('⚠️ Belum ada data nilai siswa untuk diunduh.');
      return;
    }

    const headers = [
      'Peringkat',
      'Nama Siswa',
      'Skor Akhir',
      'Bintang',
      'Jawaban Benar',
      'Jawaban Salah',
      'Tidak Dijawab',
      'Waktu Pengerjaan (Detik)',
      'Status Ketuntasan (KKM 70)',
      ...quiz.questions.map((_, i) => `Soal ${i + 1}`)
    ];

    const rows = rankedParticipants.map((p: any, idx) => {
      const qAnswers = quiz.questions.map((q, qIdx) => {
        const ans = (p.answers && p.answers[q.id])
          || Object.values(p.answers || {}).find((a: any) => a && a.questionId === q.id)
          || Object.values(p.answers || {}).find((a: any) => a && a.questionIndex === qIdx) as any;
        if (!ans) return 'KOSONG';
        return ans.isCorrect ? 'BENAR' : 'SALAH';
      });

      return [
        idx + 1,
        `"${p.name.replace(/"/g, '""')}"`,
        p.score,
        p.stars,
        p.correctCount,
        p.incorrectCount,
        p.unansweredCount ?? 0,
        p.timeSpentSec,
        p.score >= 70 ? 'TUNTAS' : 'BELUM TUNTAS',
        ...qAnswers
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rekap_Nilai_${quiz.title.replace(/[^a-zA-Z0-9]/g, '_')}_PIN_${currentSession.pinCode}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('✅ Berhasil mengunduh rekap nilai siswa (CSV)!');
  };

  const handlePrint = () => {
    playClick();
    window.print();
  };

  const formattedDate = currentSession.startedAt 
    ? new Date(currentSession.startedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('id-ID');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans select-none animate-fade-in print:bg-white print:text-black">
      
      {/* Top Bar (Hidden on Print) */}
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-8 py-2.5 sticky top-0 z-30 shadow-2xs print:hidden">
        <div className="w-full max-w-[2000px] mx-auto flex items-center justify-between gap-3">
          
          {/* Kiri: Tombol Kembali & Konteks Halaman */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                playClick();
                onBack();
              }}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0 btn-press cursor-pointer"
              title="Kembali ke Dasbor Guru"
              aria-label="Kembali ke Dasbor Guru"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Rekap Hasil Kuis
                </span>
                <span>•</span>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                  PIN {currentSession.pinCode}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate" title={quiz.title}>
                {quiz.title}
              </h1>
            </div>
          </div>

          {/* Kanan: Alat Cepat Ekspor & Cetak (Tampil di Tablet/Desktop) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold min-h-[44px] items-center gap-1.5 transition-colors btn-press cursor-pointer"
              title="Unduh seluruh rekap nilai siswa (CSV/Excel)"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Unduh CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold min-h-[44px] items-center gap-1.5 transition-colors btn-press cursor-pointer"
              title="Cetak rapor atau simpan dalam format PDF"
            >
              <Printer className="w-4 h-4 flex-shrink-0" />
              <span>Cetak Rapor</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-[2000px] mx-auto px-3 sm:px-8 py-5 sm:py-6 flex-1 space-y-5 sm:space-y-6">
        
        {/* Header Metadata Info Card & Action Hub */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          
          {/* Baris Atas: Tags Meta Pelajaran & Status Sesi */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900/60">
                {quiz.subject}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                Kelas {quiz.grade}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                {totalQuestions} Butir Soal
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>{participants.length} Siswa</span>
              </span>
            </div>

            {/* Status Sesi */}
            {currentSession.status === 'finished' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Sesi Selesai</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sesi Aktif</span>
              </span>
            )}
          </div>

          {/* Baris Tengah: Judul Kuis Utama & Meta Waktu Sesi */}
          <div className="space-y-1">
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              {quiz.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{formattedDate}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <span>Ruang Kelas:</span>
                <strong className="font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                  PIN {currentSession.pinCode}
                </strong>
              </div>
            </div>
          </div>

          {/* Hub Aksi Sesi (Action Hub) - Jelas, Terstruktur & Berlabel Nyata */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5">
            {/* Tombol Utama: Aktifkan Kembali Kuis (Jika sesi telah selesai) */}
            {currentSession.status === 'finished' ? (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsReactivateModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black min-h-[44px] flex items-center justify-center gap-2 shadow-xs shadow-emerald-950/20 btn-press transition-all cursor-pointer"
                title="Buka kembali akses kuis agar siswa dapat melanjutkan atau mengerjakan ulang"
              >
                <RotateCcw className="w-4 h-4 text-white flex-shrink-0" />
                <span>Aktifkan Kembali Kuis</span>
              </button>
            ) : (
              <span className="px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2 min-h-[44px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Siswa dapat mengakses sesi kuis ini</span>
              </span>
            )}

            {/* Tombol Aksi Sekunder Berlabel Jelas */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  playClick();
                  setIsClassReviewOpen(true);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold min-h-[44px] flex items-center justify-center gap-1.5 transition-colors btn-press cursor-pointer"
                title="Tampilkan pembahasan soal di proyektor tanpa identitas nilai siswa"
              >
                <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span>Bahas di Kelas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  playClick();
                  setIsRecalculateModalOpen(true);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold min-h-[44px] flex items-center justify-center gap-1.5 transition-colors btn-press cursor-pointer"
                title="Hitung ulang skor seluruh siswa jika ada pembaruan kunci jawaban"
              >
                <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>Hitung Ulang</span>
              </button>

              {/* Tombol Ekspor & Cetak Khusus Tampilan Ponsel */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="sm:hidden px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold min-h-[44px] flex items-center justify-center gap-1.5 transition-colors btn-press"
                title="Unduh seluruh rekap nilai siswa (CSV)"
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>Unduh CSV</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="sm:hidden px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold min-h-[44px] flex items-center justify-center gap-1.5 transition-colors btn-press"
                title="Cetak rapor atau simpan PDF"
              >
                <Printer className="w-4 h-4 flex-shrink-0" />
                <span>Cetak Rapor</span>
              </button>
            </div>

          </div>
        </div>

        {/* Sub-tabs Selector (Hidden on Print) */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 print:hidden overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('overview');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] whitespace-nowrap btn-press cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Ringkasan Metrik</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('students');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] whitespace-nowrap btn-press cursor-pointer ${
              activeTab === 'students'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Tabel Nilai Siswa</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'students' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {participants.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('questions');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] whitespace-nowrap btn-press cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Analisis Butir Soal</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'questions' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {totalQuestions}
            </span>
          </button>
        </div>

        {/* TAB 1: RINGKASAN METRIK KELAS */}
        {(activeTab === 'overview' || window.matchMedia?.('print').matches) && (
          <div className="space-y-6">
            
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rata-rata Akurasi</span>
                  <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {analytics.avgAccuracy}%
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {analytics.avgAccuracy >= 75 ? 'Pemahaman Sangat Baik' : analytics.avgAccuracy >= 60 ? 'Cukup Baik' : 'Perlu Pendalaman'}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rata-rata Skor</span>
                  <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex-shrink-0">
                    <Trophy className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                  {analytics.avgScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Nilai rata-rata kelas
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ketuntasan (KKM 70)</span>
                  <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                  {analytics.passRate}%
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {passedCount} dari {participants.length} siswa tuntas
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rata Waktu Selesai</span>
                  <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 tabular-nums">
                  {analytics.avgTimePerStudent} <span className="text-sm font-normal text-slate-400">dtk</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Per anak untuk {totalQuestions} soal
                </div>
              </div>
            </div>

            {/* Podium Juara 3 Besar */}
            {rankedParticipants.length >= 1 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>Podium 3 Siswa Berprestasi Tertinggi</span>
                  </h3>
                  <span className="text-xs text-slate-400">Akurasi & Kecepatan Terbaik</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {rankedParticipants.slice(0, 3).map((p, pIdx) => {
                    const medal = pIdx === 0 ? '🥇 Juara 1' : pIdx === 1 ? '🥈 Juara 2' : '🥉 Juara 3';
                    const medalColor = pIdx === 0 
                      ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200' 
                      : pIdx === 1 
                      ? 'border-slate-300 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200' 
                      : 'border-amber-700 bg-amber-100/30 dark:bg-amber-950/10 text-amber-900 dark:text-amber-300';

                    return (
                      <div
                        key={p.id}
                        className={`p-4 rounded-2xl border ${medalColor} flex flex-col items-center text-center space-y-2 relative shadow-xs`}
                      >
                        <span className="text-xs font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 shadow-xs">
                          {medal}
                        </span>
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-3xl">
                          {AVATAR_MAP[p.avatarId] || '🦁'}
                        </div>
                        <div>
                          <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                            {p.name}
                          </div>
                          <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                            Skor: {p.score} • {p.correctCount}/{totalQuestions} Benar
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Waktu: {p.timeSpentSec} detik
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Insights: Hardest & Easiest Question & Students needing attention */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Soal Paling Sulit */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Soal Paling Menantang
                  </span>
                  {analytics.hardestQuestionIdx >= 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-900/60">
                      Akurasi: {analytics.questionStats[analytics.hardestQuestionIdx]?.correctRate}%
                    </span>
                  )}
                </div>

                {analytics.hardestQuestionIdx >= 0 ? (
                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Soal #{analytics.hardestQuestionIdx + 1}: {quiz.questions[analytics.hardestQuestionIdx]?.text}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Kunci Jawaban: <strong className="text-emerald-600 dark:text-emerald-400">{quiz.questions[analytics.hardestQuestionIdx]?.options[quiz.questions[analytics.hardestQuestionIdx]?.correctIndex]}</strong>
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl text-[11px] text-slate-600 dark:text-slate-300">
                      💡 <strong>Saran:</strong> Tinjau kembali konsep ini bersama siswa di sesi kelas berikutnya.
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Data belum tersedia.</p>
                )}
              </div>

              {/* Soal Paling Mudah */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Soal Paling Dikuasai
                  </span>
                  {analytics.easiestQuestionIdx >= 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-900/60">
                      Akurasi: {analytics.questionStats[analytics.easiestQuestionIdx]?.correctRate}%
                    </span>
                  )}
                </div>

                {analytics.easiestQuestionIdx >= 0 ? (
                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Soal #{analytics.easiestQuestionIdx + 1}: {quiz.questions[analytics.easiestQuestionIdx]?.text}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Kunci Jawaban: <strong className="text-emerald-600 dark:text-emerald-400">{quiz.questions[analytics.easiestQuestionIdx]?.options[quiz.questions[analytics.easiestQuestionIdx]?.correctIndex]}</strong>
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl text-[11px] text-slate-600 dark:text-slate-300">
                      🌟 <strong>Apresiasi:</strong> Sebagian besar siswa telah menguasai materi ini dengan baik.
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Data belum tersedia.</p>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: TABEL NILAI SISWA */}
        {(activeTab === 'students' || window.matchMedia?.('print').matches) && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-3 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Daftar Nilai Lengkap Siswa ({filteredParticipants.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Klik pada baris siswa untuk melihat lembar koreksi jawaban individual.
                </p>
              </div>

              {/* Search Box & Status Filter Pills */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto print:hidden">
                {/* Status Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setStatusFilter('all');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] whitespace-nowrap btn-press ${
                      statusFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Semua ({rankedParticipants.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setStatusFilter('passed');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] whitespace-nowrap btn-press flex items-center gap-1.5 ${
                      statusFilter === 'passed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Tuntas (≥70)</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 font-black">{passedCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setStatusFilter('remedial');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] whitespace-nowrap btn-press flex items-center gap-1.5 ${
                      statusFilter === 'remedial'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Remedial (&lt;70)</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 font-black">{remedialCount}</span>
                  </button>
                </div>

                <div className="relative min-w-[180px] sm:w-56">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="Cari siswa..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none min-h-[40px]"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Card View (sm:hidden) */}
            <div className="block sm:hidden space-y-2.5 print:hidden">
              {filteredParticipants.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  Tidak ada data siswa yang cocok dengan filter.
                </div>
              ) : (
                filteredParticipants.map((p, pIdx) => {
                  const isPassed = p.score >= 70;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedStudentForModal(p);
                      }}
                      className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-800 space-y-2.5 active:scale-[0.99] transition-transform cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 text-center font-black text-xs text-slate-400">
                            #{pIdx + 1}
                          </span>
                          <span className="text-xl flex-shrink-0">{AVATAR_MAP[p.avatarId] || '🦁'}</span>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate block">
                              {p.name}
                            </span>
                            {p.tabSwitchCount && p.tabSwitchCount > 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-500 font-bold">
                                <AlertTriangle className="w-3 h-3" />
                                {p.tabSwitchCount}x Pindah Tab
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-base font-black text-amber-600 dark:text-amber-400 leading-none">
                            {p.score}
                          </div>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase mt-0.5 ${
                              isPassed
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {isPassed ? 'TUNTAS' : 'REMEDIAL'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                          <div className="text-[10px] text-slate-400">Akurasi</div>
                          <div className="font-bold text-slate-700 dark:text-slate-200">
                            {Math.round((p.correctCount / totalQuestions) * 100)}%
                          </div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                          <div className="text-[10px] text-slate-400">Benar / Salah</div>
                          <div className="font-bold">
                            <span className="text-emerald-600 dark:text-emerald-400">{p.correctCount}</span>
                            <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                            <span className="text-rose-600 dark:text-rose-400">{p.incorrectCount}</span>
                          </div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                          <div className="text-[10px] text-slate-400">Durasi</div>
                          <div className="font-bold text-slate-700 dark:text-slate-200">
                            {p.timeSpentSec} dtk
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                            const url = generateStudentWhatsAppUrl({
                              studentName: p.name,
                              quizTitle: quiz.title,
                              score: p.score,
                              correctCount: p.correctCount,
                              totalQuestions: totalQuestions,
                              timeSpentSec: p.timeSpentSec,
                            });
                            window.open(url, '_blank');
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px] transition-colors btn-press flex-shrink-0"
                          title="Kirim ke WhatsApp Wali Murid"
                        >
                          <Share2 className="w-4 h-4 text-emerald-500" />
                          <span className="hidden xs:inline">WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                            setSelectedStudentForModal(p);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px] transition-colors btn-press"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lembar Jawaban</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3">Skor</th>
                    <th className="py-2.5 px-3">Akurasi</th>
                    <th className="py-2.5 px-3">Benar / Salah</th>
                    <th className="py-2.5 px-3">Durasi & Waktu</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 print:hidden">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredParticipants.map((p, pIdx) => {
                    const isPassed = p.score >= 70;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedStudentForModal(p)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                          #{pIdx + 1}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                          <span className="text-xl">{AVATAR_MAP[p.avatarId] || '🦁'}</span>
                          <span>{p.name}</span>
                          {p.tabSwitchCount && p.tabSwitchCount > 0 ? (
                            <span 
                              className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-900/60 flex items-center gap-1"
                              title={`Terdeteksi berpindah tab/aplikasi ${p.tabSwitchCount} kali selama kuis`}
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              <span>{p.tabSwitchCount}x Pindah Tab</span>
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 px-3 font-black text-sm text-amber-600 dark:text-amber-400">
                          {p.score}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                          {Math.round((p.correctCount / totalQuestions) * 100)}%
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{p.correctCount}</span> / <span className="text-rose-600 dark:text-rose-400 font-bold">{p.incorrectCount}</span>
                          {((p as any).unansweredCount ?? 0) > 0 && (
                            <span className="text-amber-500 dark:text-amber-400 font-semibold ml-1.5 text-[10px]" title={`${(p as any).unansweredCount} butir soal tidak dijawab / dilewati`}>
                              ({(p as any).unansweredCount} kosong)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                          <div className="font-semibold text-slate-700 dark:text-slate-300">{p.timeSpentSec} dtk</div>
                          {(p.completedAt || p.lastActiveAt) && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5" title="Waktu pengisian / selesai">
                              <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span>{formatIndonesianTime(p.completedAt || p.lastActiveAt, { withDate: true })}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isPassed
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {isPassed ? 'TUNTAS' : 'REMEDIAL'}
                          </span>
                        </td>
                        <td className="py-2 px-2 print:hidden">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic('light');
                                const url = generateStudentWhatsAppUrl({
                                  studentName: p.name,
                                  quizTitle: quiz.title,
                                  score: p.score,
                                  correctCount: p.correctCount,
                                  totalQuestions: totalQuestions,
                                  timeSpentSec: p.timeSpentSec,
                                });
                                window.open(url, '_blank');
                              }}
                              className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors btn-press"
                              title={`Kirim Nilai ${p.name} ke WhatsApp Wali Murid`}
                            >
                              <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </button>

                            <button
                              type="button"
                              className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-press"
                              title="Lihat Lembar Jawaban"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ANALISIS BUTIR SOAL */}
        {(activeTab === 'questions' || window.matchMedia?.('print').matches) && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Analisis Butir Soal & Distribusi Opsi Jawaban
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mendeteksi opsi mana yang paling sering dipilih dan opsi pengecoh yang mengecoh pemikiran siswa.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {quiz.questions.map((q, idx) => {
                const stat = analytics.questionStats[idx] || { correctRate: 0, optionCounts: [0,0,0,0], totalAnswered: 0 };
                return (
                  <div
                    key={q.id || idx}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-black text-xs">
                          Nomor {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Tipe: {q.type === 'multiple_choice' ? 'Pilihan Ganda' : q.type === 'true_false' ? 'Benar / Salah' : 'Interaktif'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="text-slate-500 dark:text-slate-400">Dijawab: {stat.totalAnswered} siswa</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className={`px-2.5 py-0.5 rounded-full border ${
                          stat.correctRate >= 70
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : stat.correctRate >= 50
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        }`}>
                          Tingkat Ketercapaian: {stat.correctRate}%
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {q.text}
                    </h4>

                    {/* Options Distribution Bars */}
                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = oIdx === q.correctIndex;
                        const count = stat.optionCounts[oIdx] || 0;
                        const pct = stat.totalAnswered > 0 ? Math.round((count / stat.totalAnswered) * 100) : 0;

                        return (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-2xl border transition-colors space-y-1.5 ${
                              isCorrect
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-bold">
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className={isCorrect ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'}>
                                  {opt}
                                </span>
                                {isCorrect && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                                    Kunci Jawaban ✓
                                  </span>
                                )}
                              </div>
                              <span className={isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}>
                                {count} siswa ({pct}%)
                              </span>
                            </div>

                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${isCorrect ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                      <strong className="text-amber-600 dark:text-amber-400 block mb-0.5">Penjelasan / Pembahasan Soal:</strong>
                      {q.explanation}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* Modal Analisis Jawaban Siswa per Butir Soal */}
      {selectedStudentForModal && (
        <StudentAnswerAnalysisModal
          isOpen={Boolean(selectedStudentForModal)}
          onClose={() => setSelectedStudentForModal(null)}
          participant={selectedStudentForModal}
          quiz={quiz}
        />
      )}

      {/* Modal Hitung Ulang Skor Sesi Kuis */}
      <RecalculateScoresModal
        isOpen={isRecalculateModalOpen}
        onClose={() => setIsRecalculateModalOpen(false)}
        onConfirm={handleRecalculateScores}
        quizTitle={quiz.title}
        pinCode={currentSession.pinCode}
        participantCount={participants.length}
      />

      {/* Modal Bahas Bersama di Kelas (Smartboard / Proyektor) */}
      <ClassReviewModal
        isOpen={isClassReviewOpen}
        onClose={() => setIsClassReviewOpen(false)}
        quiz={quiz}
        participants={participants}
      />

      {/* Modal Aktifkan Kembali Sesi Kuis */}
      <ReactivateSessionModal
        isOpen={isReactivateModalOpen}
        session={currentSession}
        onClose={() => setIsReactivateModalOpen(false)}
        onReactivate={handleReactivateSession}
        playClick={playClick}
      />

      {/* Toast Notifikasi Keterangan Aksi */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md border border-slate-700/80 animate-fade-in flex items-center gap-2 max-w-[90vw] text-center"
        >
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
