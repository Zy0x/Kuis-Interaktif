import React, { useState, useMemo } from 'react';
import type { Quiz, QuizSession, QuizSessionParticipant } from '../../types/quiz';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Trophy, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Search, 
  AlertTriangle,
  Award,
  TrendingUp,
  Users,
  Eye,
  X
} from 'lucide-react';

interface QuizSessionRecapViewProps {
  session: QuizSession;
  quiz: Quiz;
  onBack: () => void;
  playClick: () => void;
}

export const QuizSessionRecapView: React.FC<QuizSessionRecapViewProps> = ({
  session,
  quiz,
  onBack,
  playClick,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'questions'>('overview');
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<QuizSessionParticipant | null>(null);

  const totalQuestions = quiz.questions?.length || session.totalQuestions || 1;
  const participants = session.participants || [];

  // Ranked participants
  const rankedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      return a.timeSpentSec - b.timeSpentSec;
    });
  }, [participants]);

  // Filtered by search
  const filteredParticipants = useMemo(() => {
    if (!searchStudent.trim()) return rankedParticipants;
    const q = searchStudent.toLowerCase();
    return rankedParticipants.filter((p) => p.name.toLowerCase().includes(q));
  }, [rankedParticipants, searchStudent]);

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

      Object.values(p.answers || {}).forEach((ans) => {
        if (ans.questionIndex >= 0 && ans.questionIndex < totalQuestions) {
          questionAnsweredCounts[ans.questionIndex]++;
          if (ans.isCorrect) {
            questionCorrectCounts[ans.questionIndex]++;
          }
          if (ans.selectedOption !== undefined && ans.selectedOption >= 0 && ans.selectedOption < 4) {
            questionOptionDist[ans.questionIndex][ans.selectedOption]++;
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
      alert('Belum ada data nilai siswa untuk diunduh.');
      return;
    }

    const headers = [
      'Peringkat',
      'Nama Siswa',
      'Skor Akhir',
      'Bintang',
      'Jawaban Benar',
      'Jawaban Salah',
      'Waktu Pengerjaan (Detik)',
      'Status Ketuntasan (KKM 70)',
      ...quiz.questions.map((_, i) => `Soal ${i + 1}`)
    ];

    const rows = rankedParticipants.map((p, idx) => {
      const qAnswers = quiz.questions.map((_, qIdx) => {
        const ans = Object.values(p.answers || {}).find((a) => a.questionIndex === qIdx);
        if (!ans) return '-';
        return ans.isCorrect ? 'BENAR' : 'SALAH';
      });

      return [
        idx + 1,
        `"${p.name.replace(/"/g, '""')}"`,
        p.score,
        p.stars,
        p.correctCount,
        p.incorrectCount,
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
    a.download = `Rekap_Nilai_${quiz.title.replace(/[^a-zA-Z0-9]/g, '_')}_PIN_${session.pinCode}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    playClick();
    window.print();
  };

  const formattedDate = session.startedAt 
    ? new Date(session.startedAt).toLocaleDateString('id-ID', {
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
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-8 py-3 sticky top-0 z-30 shadow-xs print:hidden">
        <div className="w-full max-w-[2000px] mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                playClick();
                onBack();
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
              title="Kembali ke Dashboard"
              aria-label="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] sm:text-xs font-bold">
                  ✓ Rekapan Sesi Kuis
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">|</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate hidden sm:inline">
                  PIN: <strong className="font-mono text-slate-800 dark:text-slate-200">{session.pinCode}</strong>
                </span>
              </div>
              <h1 className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white truncate">
                {quiz.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold min-h-[40px] flex items-center gap-1.5 shadow-xs transition-colors"
              title="Unduh file Excel / CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Unduh Rekap (CSV)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold min-h-[40px] min-w-[40px] flex items-center justify-center gap-1.5 transition-colors"
              title="Cetak Laporan / Simpan PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak Rapor</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-[2000px] mx-auto px-3 sm:px-8 py-5 sm:py-6 flex-1 space-y-6">
        
        {/* Header Metadata Info Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900/60">
                {quiz.subject}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                Kelas {quiz.grade}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 dark:text-slate-400">
                {totalQuestions} Butir Soal
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 dark:text-slate-400">
                {formattedDate}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Laporan Analisis Hasil Kuis Siswa
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Disajikan untuk {session.teacherName || 'Bapak/Ibu Guru'} • Ruang PIN: <strong className="font-mono text-slate-800 dark:text-slate-200">{session.pinCode}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 self-start md:self-auto flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Peserta</div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {participants.length} <span className="text-xs font-normal text-slate-500">Siswa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-tabs Selector (Hidden on Print) */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 print:hidden overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('overview');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[40px] whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Ringkasan Metrik Kelas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('students');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[40px] whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Tabel Nilai Siswa ({participants.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('questions');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[40px] whitespace-nowrap ${
              activeTab === 'questions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Analisis Butir Soal ({totalQuestions})</span>
          </button>
        </div>

        {/* TAB 1: RINGKASAN METRIK KELAS */}
        {(activeTab === 'overview' || window.matchMedia?.('print').matches) && (
          <div className="space-y-6">
            
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Rata-rata Akurasi</span>
                  <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {analytics.avgAccuracy}%
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {analytics.avgAccuracy >= 75 ? 'Pemahaman Sangat Baik' : analytics.avgAccuracy >= 60 ? 'Cukup Baik' : 'Perlu Pendalaman'}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Rata-rata Skor</span>
                  <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                    <Trophy className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                  {analytics.avgScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Nilai rata-rata kelas
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Ketuntasan (KKM 70)</span>
                  <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                  {analytics.passRate}%
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Siswa mencapai batas tuntas
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Rata Waktu Selesai</span>
                  <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                    <Clock className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
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

              {/* Search Box */}
              <div className="relative max-w-xs w-full print:hidden">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  placeholder="Cari nama siswa..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none min-h-[38px]"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3">Skor</th>
                    <th className="py-2.5 px-3">Akurasi</th>
                    <th className="py-2.5 px-3">Benar / Salah</th>
                    <th className="py-2.5 px-3">Waktu</th>
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
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="text-xl">{AVATAR_MAP[p.avatarId] || '🦁'}</span>
                          <span>{p.name}</span>
                        </td>
                        <td className="py-3 px-3 font-black text-sm text-amber-600 dark:text-amber-400">
                          {p.score}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                          {Math.round((p.correctCount / totalQuestions) * 100)}%
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{p.correctCount}</span> / <span className="text-rose-600 dark:text-rose-400">{p.incorrectCount}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                          {p.timeSpentSec} dtk
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
                        <td className="py-3 px-3 print:hidden">
                          <button
                            type="button"
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Lihat Lembar Jawaban"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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

      {/* Student Individual Detail Modal */}
      {selectedStudentForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-scale-up overflow-hidden">
            
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="text-3xl">
                  {AVATAR_MAP[selectedStudentForModal.avatarId] || '🦁'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Lembar Jawaban: {selectedStudentForModal.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Skor: <strong className="text-amber-600 dark:text-amber-400">{selectedStudentForModal.score}</strong> • Benar: {selectedStudentForModal.correctCount}/{totalQuestions}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {quiz.questions.map((q, idx) => {
                const ans = Object.values(selectedStudentForModal.answers || {}).find((a) => a.questionIndex === idx);
                const isCorrect = ans?.isCorrect || false;
                const chosenOpt = ans?.selectedOption !== undefined ? q.options[ans.selectedOption] : ans?.textAnswer || 'Tidak dijawab';

                return (
                  <div
                    key={q.id || idx}
                    className={`p-3.5 rounded-2xl border space-y-2 text-xs ${
                      isCorrect
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-500 dark:text-slate-400">Soal #{idx + 1}</span>
                      <span className={isCorrect ? 'text-emerald-600 dark:text-emerald-400 flex items-center gap-1' : 'text-rose-600 dark:text-rose-400 flex items-center gap-1'}>
                        {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {isCorrect ? 'Jawaban Benar' : 'Jawaban Keliru'}
                      </span>
                    </div>

                    <p className="font-semibold text-slate-900 dark:text-white">
                      {q.text}
                    </p>

                    <div className="space-y-1 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-800">
                      <div>
                        Jawaban Siswa: <strong className={isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>{chosenOpt}</strong>
                      </div>
                      {!isCorrect && (
                        <div>
                          Kunci Benar: <strong className="text-emerald-600 dark:text-emerald-400">{q.options[q.correctIndex]}</strong>
                        </div>
                      )}
                      {ans?.timeSpentSec !== undefined && (
                        <div className="text-slate-400">
                          Waktu berpikir: {ans.timeSpentSec} detik
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentForModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold min-h-[40px]"
              >
                Tutup Lembar Jawaban
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
