import React, { useState, useMemo } from 'react';
import type { Quiz, QuizSession, QuizSessionParticipant } from '../../types/quiz';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { StudentAnswerAnalysisModal } from './StudentAnswerAnalysisModal';
import { formatIndonesianTime } from '../../lib/dateUtils';
import { 
  ArrowLeft, 
  Download, 
  Printer,
  FileSpreadsheet, 
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
import { analyzeSessionDuplicates } from '../../lib/studentUtils';
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
  const [attemptFilter, setAttemptFilter] = useState<'all' | 'best' | 'latest'>('all');
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

  // Anotasi data duplikasi & percobaan berulang per siswa
  const participantsWithMeta = useMemo(() => {
    return analyzeSessionDuplicates(rankedParticipants);
  }, [rankedParticipants]);

  const uniqueStudentCount = useMemo(() => {
    const names = new Set(participantsWithMeta.map((p) => p.parsedCleanName.toLowerCase()));
    return names.size;
  }, [participantsWithMeta]);

  const duplicateAttemptCount = useMemo(() => {
    return participantsWithMeta.filter((p) => p.attemptNumber > 1).length;
  }, [participantsWithMeta]);

  const bestCount = useMemo(() => participantsWithMeta.filter((p) => p.isBestScoreAttempt).length, [participantsWithMeta]);
  const latestCount = useMemo(() => participantsWithMeta.filter((p) => p.isLatestAttempt).length, [participantsWithMeta]);

  // Peserta terfilter berdasarkan percobaan, status ketuntasan, dan pencarian nama/absen
  const filteredParticipants = useMemo(() => {
    let list = [...participantsWithMeta];

    if (attemptFilter === 'best') {
      list = list.filter((p) => p.isBestScoreAttempt);
    } else if (attemptFilter === 'latest') {
      list = list.filter((p) => p.isLatestAttempt);
    }

    if (statusFilter === 'passed') {
      list = list.filter((p) => p.score >= 70);
    } else if (statusFilter === 'remedial') {
      list = list.filter((p) => p.score < 70);
    }

    if (searchStudent.trim()) {
      const q = searchStudent.toLowerCase();
      list = list.filter((p) => 
        p.name.toLowerCase().includes(q) ||
        p.parsedCleanName.toLowerCase().includes(q) ||
        p.parsedRollNumber.toLowerCase().includes(q)
      );
    }

    return list;
  }, [participantsWithMeta, attemptFilter, statusFilter, searchStudent]);

  const passedCount = useMemo(() => {
    let list = participantsWithMeta;
    if (attemptFilter === 'best') list = list.filter((p) => p.isBestScoreAttempt);
    else if (attemptFilter === 'latest') list = list.filter((p) => p.isLatestAttempt);
    return list.filter((p) => p.score >= 70).length;
  }, [participantsWithMeta, attemptFilter]);

  const remedialCount = useMemo(() => {
    let list = participantsWithMeta;
    if (attemptFilter === 'best') list = list.filter((p) => p.isBestScoreAttempt);
    else if (attemptFilter === 'latest') list = list.filter((p) => p.isLatestAttempt);
    return list.filter((p) => p.score < 70).length;
  }, [participantsWithMeta, attemptFilter]);

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
    <div className="min-h-screen bg-slate-100/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans select-none animate-fade-in print:bg-white print:text-black">
      
      {/* Top Bar (Hidden on Print) */}
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-300/80 dark:border-slate-800 px-3 sm:px-8 py-2.5 sticky top-0 z-30 shadow-xs shadow-slate-200/50 dark:shadow-none print:hidden">
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
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 border border-slate-300/70 dark:border-slate-700">
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
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 border border-slate-300/90 dark:border-slate-700 text-xs font-bold min-h-[44px] items-center gap-1.5 transition-colors btn-press cursor-pointer shadow-2xs"
              title="Unduh seluruh rekap nilai siswa (CSV/Excel)"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Unduh CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300/90 dark:border-slate-700 text-xs font-bold min-h-[44px] items-center gap-1.5 transition-colors btn-press cursor-pointer shadow-2xs"
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-300/80 dark:border-slate-800 shadow-xs shadow-slate-200/70 dark:shadow-none space-y-4">
          
          {/* Baris Atas: Tags Meta Pelajaran & Status Sesi */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold border border-blue-300/80 dark:border-blue-900/60">
                {quiz.subject}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-300/70 dark:border-slate-700">
                Kelas {quiz.grade}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-300/70 dark:border-slate-700">
                {totalQuestions} Butir Soal
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-300/80 dark:border-indigo-800/60 font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>{participants.length} Siswa</span>
              </span>
            </div>

            {/* Status Sesi */}
            {currentSession.status === 'finished' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Sesi Selesai</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold shadow-2xs">
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
                <strong className="font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold border border-slate-300/70 dark:border-slate-700">
                  PIN {currentSession.pinCode}
                </strong>
              </div>
            </div>
          </div>

          {/* Hub Aksi Sesi (Action Hub) - Jelas, Terstruktur & Berlabel Nyata */}
          <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5">
            {/* Tombol Utama: Aktifkan Kembali Kuis (Jika sesi telah selesai) */}
            {currentSession.status === 'finished' ? (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsReactivateModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black min-h-[44px] flex items-center justify-center gap-2 shadow-xs shadow-emerald-950/20 btn-press transition-all cursor-pointer border border-emerald-500"
                title="Buka kembali akses kuis agar siswa dapat melanjutkan atau mengerjakan ulang"
              >
                <RotateCcw className="w-4 h-4 text-white flex-shrink-0" />
                <span>Aktifkan Kembali Kuis</span>
              </button>
            ) : (
              <span className="px-3.5 py-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 text-xs font-bold flex items-center gap-2 min-h-[44px] shadow-2xs">
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
                className="px-3.5 py-2.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300/80 dark:border-purple-800 text-xs font-bold min-h-[44px] flex items-center justify-center gap-1.5 transition-colors btn-press cursor-pointer shadow-2xs"
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
                className="px-3.5 py-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300/80 dark:border-blue-800 text-xs font-bold min-h-[44px] flex items-center justify-center gap-1.5 transition-colors btn-press cursor-pointer shadow-2xs"
                title="Hitung ulang skor seluruh siswa jika ada pembaruan kunci jawaban"
              >
                <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>Hitung Ulang</span>
              </button>

              {/* Tombol Ekspor & Cetak Khusus Tampilan Ponsel */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="sm:hidden px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300/90 dark:border-slate-700 text-xs font-bold min-h-[44px] flex items-center justify-center gap-1.5 transition-colors btn-press shadow-2xs"
                title="Unduh seluruh rekap nilai siswa (CSV)"
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>Unduh CSV</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="sm:hidden px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300/90 dark:border-slate-700 text-xs font-bold min-h-[44px] flex items-center justify-center gap-1.5 transition-colors btn-press shadow-2xs"
                title="Cetak rapor atau simpan PDF"
              >
                <Printer className="w-4 h-4 flex-shrink-0" />
                <span>Cetak Rapor</span>
              </button>
            </div>

          </div>
        </div>

        {/* Sub-tabs Selector (Segmented Control Bar Modern) */}
        <div className="bg-slate-200/75 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-300/90 dark:border-slate-800 flex items-center gap-1.5 shadow-2xs print:hidden overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('overview');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] whitespace-nowrap btn-press cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/80'
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
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] whitespace-nowrap btn-press cursor-pointer ${
              activeTab === 'students'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/80'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Tabel Nilai Siswa</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black border ${
              activeTab === 'students'
                ? 'bg-white/20 text-white border-white/20'
                : 'bg-slate-300/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
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
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] whitespace-nowrap btn-press cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/80'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Analisis Butir Soal</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black border ${
              activeTab === 'questions'
                ? 'bg-white/20 text-white border-white/20'
                : 'bg-slate-300/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-300/80 dark:border-slate-800 shadow-xs shadow-slate-200/60 dark:shadow-none space-y-1.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rata-rata Akurasi</span>
                  <span className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 flex-shrink-0">
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

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-300/80 dark:border-slate-800 shadow-xs shadow-slate-200/60 dark:shadow-none space-y-1.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rata-rata Skor</span>
                  <span className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80 flex-shrink-0">
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

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-300/80 dark:border-slate-800 shadow-xs shadow-slate-200/60 dark:shadow-none space-y-1.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ketuntasan (KKM 70)</span>
                  <span className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 flex-shrink-0">
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

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-300/80 dark:border-slate-800 shadow-xs shadow-slate-200/60 dark:shadow-none space-y-1.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rata Waktu Selesai</span>
                  <span className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/80 flex-shrink-0">
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
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-300/80 dark:border-slate-800 shadow-xs shadow-slate-200/60 dark:shadow-none space-y-4">
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
                      ? 'border-2 border-amber-400 bg-amber-50/70 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200' 
                      : pIdx === 1 
                      ? 'border-2 border-slate-300 bg-slate-50/90 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200' 
                      : 'border-2 border-amber-600/70 bg-amber-100/50 dark:bg-amber-950/10 text-amber-900 dark:text-amber-300';

                    return (
                      <div
                        key={p.id}
                        className={`p-4 rounded-2xl border ${medalColor} flex flex-col items-center text-center space-y-2 relative shadow-xs`}
                      >
                        <span className="text-xs font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 shadow-xs border border-slate-200 dark:border-slate-700">
                          {medal}
                        </span>
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-3xl border border-slate-200 dark:border-slate-700">
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-300/80 dark:border-slate-800 shadow-xs shadow-slate-200/60 dark:shadow-none space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Soal Paling Menantang
                  </span>
                  {analytics.hardestQuestionIdx >= 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-300 dark:border-rose-900/60 shadow-2xs">
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
                    <div className="bg-slate-100/80 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300">
                      💡 <strong>Saran:</strong> Tinjau kembali konsep ini bersama siswa di sesi kelas berikutnya.
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Data belum tersedia.</p>
                )}
              </div>

              {/* Soal Paling Mudah */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-300/80 dark:border-slate-800 shadow-xs shadow-slate-200/60 dark:shadow-none space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Soal Paling Dikuasai
                  </span>
                  {analytics.easiestQuestionIdx >= 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-300 dark:border-emerald-900/60 shadow-2xs">
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
                    <div className="bg-slate-100/80 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300">
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

        {/* TAB 2: TABEL NILAI SISWA RESPONSIP & LENGKAP */}
        {(activeTab === 'students' || window.matchMedia?.('print').matches) && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-300/80 dark:border-slate-800 shadow-xs shadow-slate-200/60 dark:shadow-none overflow-hidden space-y-4 p-4 sm:p-6">
            
            {/* Header Judul Tabel & Ringkasan Metrik Jumlah */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span>Tabel Rekapitulasi Nilai Siswa</span>
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {filteredParticipants.length} siswa ditampilkan
                  </span>
                  <span>•</span>
                  <span>{uniqueStudentCount} siswa unik</span>
                  {duplicateAttemptCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {duplicateAttemptCount} pengerjaan ulang
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 hidden lg:block">
                💡 Klik baris siswa mana saja untuk membuka lembar koreksi jawaban
              </div>
            </div>

            {/* Filter Toolbar (Percobaan, Status Ketuntasan & Pencarian Nama/Absen) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800 print:hidden">
              
              {/* Filter Percobaan: Semua / Terbaik / Terakhir */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setAttemptFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] whitespace-nowrap btn-press cursor-pointer border ${
                    attemptFilter === 'all'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Semua ({participantsWithMeta.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setAttemptFilter('best');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] whitespace-nowrap btn-press cursor-pointer border ${
                    attemptFilter === 'best'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Tampilkan hanya skor terbaik dari tiap siswa unik"
                >
                  Terbaik ({bestCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setAttemptFilter('latest');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] whitespace-nowrap btn-press cursor-pointer border ${
                    attemptFilter === 'latest'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Tampilkan hanya pengerjaan terakhir dari tiap siswa unik"
                >
                  Terakhir ({latestCount})
                </button>
              </div>

              {/* Status Pills & Search Input */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Status Filter */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setStatusFilter('all');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] whitespace-nowrap btn-press cursor-pointer border ${
                      statusFilter === 'all'
                        ? 'bg-slate-800 text-white dark:bg-slate-700 border-slate-800 dark:border-slate-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300/80 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Semua Status
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setStatusFilter('passed');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] whitespace-nowrap btn-press flex items-center gap-1 cursor-pointer border ${
                      statusFilter === 'passed'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Tuntas</span>
                    <span className="text-[10px] opacity-80">({passedCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setStatusFilter('remedial');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] whitespace-nowrap btn-press flex items-center gap-1 cursor-pointer border ${
                      statusFilter === 'remedial'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/80 hover:bg-rose-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>Remedial</span>
                    <span className="text-[10px] opacity-80">({remedialCount})</span>
                  </button>
                </div>

                {/* Search Box */}
                <div className="relative min-w-[160px] sm:w-52 flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="Cari nama / no. absen..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none min-h-[38px] text-slate-900 dark:text-white shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Tabel Data Rekapitulasi Nilai Siswa Responsif & Detail */}
            {filteredParticipants.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium bg-slate-50 dark:bg-slate-850/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                Tidak ada data siswa yang cocok dengan filter pencarian saat ini.
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin rounded-2xl border border-slate-300/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <table className="w-full text-left text-xs border-separate border-spacing-0 min-w-[760px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-black tracking-wider">
                      <th className="py-3 px-3 text-center w-12 border-b-2 border-slate-300 dark:border-slate-700 shadow-2xs">#</th>
                      <th className="py-3 px-3.5 border-b-2 border-slate-300 dark:border-slate-700 shadow-2xs">No. Absen & Nama Siswa</th>
                      <th className="py-3 px-3 text-center border-b-2 border-slate-300 dark:border-slate-700 shadow-2xs">Percobaan</th>
                      <th className="py-3 px-3 text-center border-b-2 border-slate-300 dark:border-slate-700 shadow-2xs">Nilai (0-100)</th>
                      <th className="py-3 px-3 text-center border-b-2 border-slate-300 dark:border-slate-700 shadow-2xs">Akurasi</th>
                      <th className="py-3 px-3 text-center border-b-2 border-slate-300 dark:border-slate-700 shadow-2xs">Benar / Salah / Kosong</th>
                      <th className="py-3 px-3 text-center border-b-2 border-slate-300 dark:border-slate-700 shadow-2xs">Durasi & Waktu</th>
                      <th className="py-3 px-3 text-center border-b-2 border-slate-300 dark:border-slate-700 shadow-2xs">Status</th>
                      <th className="py-3 px-3 text-center border-b-2 border-slate-300 dark:border-slate-700 shadow-2xs print:hidden">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/90 dark:divide-slate-800/80">
                    {filteredParticipants.map((p, idx) => {
                      const isPassed = p.score >= 70;
                      const unanswered = Math.max(0, totalQuestions - (p.correctCount + p.incorrectCount));
                      return (
                        <tr
                          key={p.id}
                          onClick={() => {
                            triggerHaptic('light');
                            setSelectedStudentForModal(p);
                          }}
                          className="hover:bg-blue-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors border-b border-slate-200 dark:border-slate-800"
                        >
                          {/* Rank */}
                          <td className="py-3 px-3 text-center font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                          </td>

                          {/* No. Absen & Nama Siswa */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-2.5 min-w-[190px] max-w-sm">
                              <span className="text-xl flex-shrink-0" role="img" aria-label="avatar">
                                {AVATAR_MAP[p.avatarId] || '🦁'}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm break-words leading-snug">
                                  {p.parsedRollNumber ? (
                                    <span className="inline-flex items-center gap-1 mr-1.5 px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-black border border-indigo-200 dark:border-indigo-800/60 flex-shrink-0">
                                      No.{p.parsedRollNumber}
                                    </span>
                                  ) : null}
                                  <span>{p.parsedCleanName || p.name}</span>
                                </div>
                                {p.tabSwitchCount && p.tabSwitchCount > 0 ? (
                                  <span className="text-[10px] text-rose-500 font-bold inline-flex items-center gap-0.5 mt-0.5">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Pindah Tab: {p.tabSwitchCount}x</span>
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          {/* Percobaan / Duplikasi */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  p.attemptNumber > 1
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                    : p.totalAttempts > 1
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-slate-700'
                                }`}
                                title={p.totalAttempts > 1 ? `Percobaan ke-${p.attemptNumber} dari total ${p.totalAttempts} pengerjaan` : 'Percobaan tunggal'}
                              >
                                Ke-{p.attemptNumber}
                              </span>
                              {p.isBestScoreAttempt && p.totalAttempts > 1 && (
                                <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full shadow-2xs">
                                  Terbaik
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Nilai / Skor (0-100) */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center gap-1">
                              <span
                                className={`text-sm font-black tabular-nums ${
                                  isPassed
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {p.score}
                              </span>
                              <div className="w-12 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-300/40 dark:border-slate-700">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    isPassed ? 'bg-emerald-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${p.score}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Akurasi */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                              {Math.round((p.correctCount / totalQuestions) * 100)}%
                            </span>
                          </td>

                          {/* Benar / Salah / Kosong */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5 text-xs tabular-nums">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold" title="Jawaban Benar">
                                ✓ {p.correctCount}
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">/</span>
                              <span className="text-rose-600 dark:text-rose-400 font-bold" title="Jawaban Salah">
                                ✗ {p.incorrectCount}
                              </span>
                              {unanswered > 0 && (
                                <>
                                  <span className="text-slate-300 dark:text-slate-700">/</span>
                                  <span className="text-amber-500 dark:text-amber-400 font-bold" title="Belum Dijawab / Kosong">
                                    ⊘ {unanswered}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Durasi & Waktu Selesai */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                              {p.timeSpentSec} dtk
                            </div>
                            {(p.completedAt || p.lastActiveAt) && (
                              <div className="text-[10px] text-slate-400 tabular-nums mt-0.5" title="Waktu selesai pengerjaan">
                                {formatIndonesianTime(p.completedAt || p.lastActiveAt, { withDate: true, withDay: false })}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                isPassed
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              }`}
                            >
                              {isPassed ? 'TUNTAS' : 'REMEDIAL'}
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="py-2.5 px-3 print:hidden whitespace-nowrap">
                            <div 
                              className="flex items-center justify-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic('light');
                                  setSelectedStudentForModal(p);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300/90 dark:border-blue-800 text-[11px] font-bold flex items-center gap-1 transition-colors btn-press min-h-[36px] cursor-pointer shadow-2xs"
                                title="Lihat lembar koreksi jawaban siswa"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Lembar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic('light');
                                  const url = generateStudentWhatsAppUrl({
                                    studentName: p.parsedCleanName || p.name,
                                    quizTitle: quiz.title,
                                    score: p.score,
                                    correctCount: p.correctCount,
                                    totalQuestions,
                                    timeSpentSec: p.timeSpentSec,
                                  });
                                  window.open(url, '_blank');
                                }}
                                className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/90 dark:border-emerald-800 transition-colors btn-press min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer shadow-2xs"
                                title={`Kirim nilai ${p.parsedCleanName || p.name} ke WhatsApp Wali Murid`}
                              >
                                <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-300 dark:border-slate-700/80 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-black text-xs shadow-2xs">
                          Nomor {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Tipe: {q.type === 'multiple_choice' ? 'Pilihan Ganda' : q.type === 'true_false' ? 'Benar / Salah' : 'Interaktif'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="text-slate-500 dark:text-slate-400">Dijawab: {stat.totalAnswered} siswa</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className={`px-2.5 py-0.5 rounded-full border shadow-2xs ${
                          stat.correctRate >= 70
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : stat.correctRate >= 50
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
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
                            className={`p-3 rounded-2xl border transition-colors space-y-1.5 shadow-2xs ${
                              isCorrect
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-400 dark:border-emerald-700'
                                : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-300/80 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-bold">
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className={isCorrect ? 'text-emerald-900 dark:text-emerald-200 font-bold' : 'text-slate-800 dark:text-slate-200'}>
                                  {opt}
                                </span>
                                {isCorrect && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
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

                    <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
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
