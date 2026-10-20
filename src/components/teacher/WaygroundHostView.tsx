import React, { useState, useEffect, useMemo } from 'react';
import type { Quiz, QuizSession, QuizSessionParticipant } from '../../types/quiz';
import { DataManager } from '../../lib/supabaseClient';
import { copyTextToClipboard } from '../../lib/aiQuestionParser';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { QuizizzReactionOverlay } from '../common/QuizizzReactionOverlay';
import { QuizizzReactionButtonRow } from '../common/QuizizzReactionButtonRow';
import { ZoomChatToast } from '../common/ZoomChatToast';
import { TeacherChatDrawer } from '../chat/TeacherChatDrawer';
import { QuizIllustration } from '../shared/QuizIllustration';
import { StudentAnswerAnalysisModal } from './StudentAnswerAnalysisModal';
import { formatIndonesianTime } from '../../lib/dateUtils';
import { 
  ArrowLeft, 
  ArrowRight,
  Play, 
  Pause, 
  Square, 
  Users, 
  Trophy, 
  BarChart3, 
  Copy, 
  Check, 
  CheckCircle2, 
  Flame,
  UserPlus,
  Share2,
  Tv,
  TrendingUp,
  FileSpreadsheet,
  VolumeX,
  Volume2,
  MessageSquare,
  Sparkles,
  Clock,
  ClipboardList,
  Download,
  Printer,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { formatStudentDisplayName, analyzeSessionDuplicates } from '../../lib/studentUtils';

interface WaygroundHostViewProps {
  session: QuizSession;
  quiz: Quiz;
  onBack: () => void;
  onEndSession: (session: QuizSession) => void;
  onViewRecap: (session: QuizSession) => void;
  playClick: () => void;
}

export const WaygroundHostView: React.FC<WaygroundHostViewProps> = ({
  session: initialSession,
  quiz,
  onBack,
  onEndSession,
  onViewRecap,
  playClick,
}) => {
  const [session, setSession] = useState<QuizSession>(initialSession);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'table' | 'matrix' | 'display'>('leaderboard');
  const [duplicateFilter, setDuplicateFilter] = useState<'all' | 'best' | 'latest'>('all');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | 'finished' | 'active'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [confirmEndModal, setConfirmEndModal] = useState(false);
  const [currentDisplayQuestionIdx, setCurrentDisplayQuestionIdx] = useState(0);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [selectedStudentForAnalysis, setSelectedStudentForAnalysis] = useState<QuizSessionParticipant | null>(null);
  const [confirmAdvanceModal, setConfirmAdvanceModal] = useState<{
    targetIndex: number;
    direction: 'next' | 'prev';
  } | null>(null);
  const [hostCountdownSec, setHostCountdownSec] = useState<number | null>(null);

  // Hitung status pesan obrolan kelas yang sudah dibaca guru
  const [lastReadChatCount, setLastReadChatCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const saved = sessionStorage.getItem(`kuis_host_chat_read_count_${session.id}`);
      return saved !== null ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  // Sinkronisasi otomatis pesan belum dibaca ketika laci obrolan dibuka atau pesan baru masuk
  useEffect(() => {
    const currentTotal = session.chatMessages?.length || 0;
    if (isChatDrawerOpen) {
      setLastReadChatCount(currentTotal);
      try {
        sessionStorage.setItem(`kuis_host_chat_read_count_${session.id}`, String(currentTotal));
      } catch {}
    } else if (lastReadChatCount > currentTotal) {
      setLastReadChatCount(currentTotal);
      try {
        sessionStorage.setItem(`kuis_host_chat_read_count_${session.id}`, String(currentTotal));
      } catch {}
    }
  }, [isChatDrawerOpen, session.chatMessages?.length, session.id, lastReadChatCount]);

  const totalChatMessages = session.chatMessages?.length || 0;
  const unreadChatCount = isChatDrawerOpen ? 0 : Math.max(0, totalChatMessages - lastReadChatCount);

  const handleOpenChatDrawer = () => {
    playClick();
    setIsChatDrawerOpen(true);
    const currentTotal = session.chatMessages?.length || 0;
    setLastReadChatCount(currentTotal);
    try {
      sessionStorage.setItem(`kuis_host_chat_read_count_${session.id}`, String(currentTotal));
    } catch {}
  };

  const handleCloseChatDrawer = () => {
    setIsChatDrawerOpen(false);
    const currentTotal = session.chatMessages?.length || 0;
    setLastReadChatCount(currentTotal);
    try {
      sessionStorage.setItem(`kuis_host_chat_read_count_${session.id}`, String(currentTotal));
    } catch {}
  };

  const isTeacherLed = session.settings?.executionMode === 'teacher_led';

  // Synchronize display question index with session
  useEffect(() => {
    if (typeof session.currentQuestionIndex === 'number') {
      setCurrentDisplayQuestionIdx(session.currentQuestionIndex);
    }
  }, [session.currentQuestionIndex]);

  // Realtime session polling and BroadcastChannel listener
  useEffect(() => {
    const refresh = async () => {
      const fresh = DataManager.getActiveSessionById(session.id);
      if (fresh) {
        setSession(fresh);
      }
      try {
        const cloudFresh = await DataManager.fetchActiveSessionById(session.id);
        if (cloudFresh) {
          setSession(cloudFresh);
        }
      } catch {}
    };

    const handleSessionUpdated = (e: any) => {
      if (e.detail?.sessionId === session.id) {
        refresh();
      }
    };

    window.addEventListener('session_updated', handleSessionUpdated);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('active_quiz_sessions_sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'SESSION_UPDATED' && event.data?.sessionId === session.id) {
          refresh();
        }
      };
    } catch {
      // BroadcastChannel fallback
    }

    // Langganan WebSocket Realtime Supabase untuk papan kendali guru
    const unsubRealtime = DataManager.subscribeToQuizSession(session.id, (fresh) => {
      setSession(fresh);
    });

    const interval = setInterval(refresh, 2000);

    return () => {
      window.removeEventListener('session_updated', handleSessionUpdated);
      if (bc) bc.close();
      clearInterval(interval);
      unsubRealtime();
    };
  }, [session.id]);

  // Heartbeat host berkala (setiap 25 detik) untuk menjaga status keaktifan sesi di Supabase
  useEffect(() => {
    if (session.status !== 'active' && session.status !== 'waiting' && session.status !== 'paused') return;

    const sendHeartbeat = () => {
      DataManager.updateSessionHeartbeat(session.id).catch(() => {});
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 25000);
    return () => clearInterval(heartbeatInterval);
  }, [session.id, session.status]);

  const handleStartQuiz = async () => {
    playClick();
    if (isTeacherLed) {
      setHostCountdownSec(3);
    }
    const updated = await DataManager.startActiveQuizSession(session.id);
    if (updated) {
      setSession(updated);
    }
  };

  const handleAdvanceQuestion = async (newIndex: number) => {
    playClick();
    setCurrentDisplayQuestionIdx(newIndex);
    const updated = await DataManager.advanceSessionQuestion(session.id, newIndex);
    if (updated) {
      setSession(updated);
    }
  };

  // Efek hitung mundur visual 3 detik di sisi Host Guru untuk sinkronisasi dengan siswa
  useEffect(() => {
    if (hostCountdownSec === null) return;
    if (hostCountdownSec <= 0) {
      const timer = setTimeout(() => setHostCountdownSec(null), 800);
      return () => clearTimeout(timer);
    }
    const interval = setTimeout(() => {
      setHostCountdownSec((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(interval);
  }, [hostCountdownSec]);

  const promptAdvanceQuestion = (targetIndex: number, direction: 'next' | 'prev') => {
    if (playClick) playClick();
    if (targetIndex === (session.currentQuestionIndex ?? 0)) return;
    setConfirmAdvanceModal({ targetIndex, direction });
  };

  const handleConfirmAdvance = async () => {
    if (!confirmAdvanceModal) return;
    const { targetIndex } = confirmAdvanceModal;
    setConfirmAdvanceModal(null);
    await handleAdvanceQuestion(targetIndex);
    setHostCountdownSec(3);
  };

  const handleToggleChatMute = async () => {
    playClick();
    const nextMute = !session.isChatMuted;
    const updated = await DataManager.toggleSessionChatMute(session.id, nextMute);
    if (updated) {
      setSession(updated);
    }
  };

  const handleCopyPin = async () => {
    playClick();
    const success = await copyTextToClipboard(session.pinCode);
    if (success) {
      setCopiedPin(true);
      showToast('PIN Ruang Kelas berhasil disalin!');
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    playClick();
    const url = `${window.location.origin}/?pin=${session.pinCode}`;
    const success = await copyTextToClipboard(url);
    if (success) {
      setCopiedLink(true);
      showToast('Tautan kuis untuk siswa berhasil disalin!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleTogglePause = async () => {
    playClick();
    const nextStatus = session.status === 'paused' ? 'active' : 'paused';
    const updated = await DataManager.updateSessionStatus(session.id, nextStatus);
    if (updated) {
      setSession(updated);
    }
  };

  const handleEndQuiz = async () => {
    playClick();
    const updated = await DataManager.updateSessionStatus(session.id, 'finished');
    setConfirmEndModal(false);
    if (updated) {
      setSession(updated);
      onEndSession(updated);
    }
  };

  const handleSimulateStudents = async () => {
    playClick();
    setIsSimulating(true);
    try {
      const updated = await DataManager.simulateAddStudentsToSession(session.id, 3);
      if (updated) {
        setSession(updated);
        showToast('3 Siswa simulasi berhasil dimasukkan ke sesi!');
      }
    } finally {
      setIsSimulating(false);
    }
  };

  // Total questions count
  const totalQuestions = quiz.questions?.length || session.totalQuestions || 1;

  // Sorted participants by score descending
  const sortedParticipants = useMemo(() => {
    const getPData = (p: any) => {
      const rawAns = p.answers ? Object.values(p.answers).filter((a: any) => a && a.questionId !== 'quiz_completed') : [];
      if (rawAns.length > 0) {
        const uniqueQMap = new Map<string, any>();
        rawAns.forEach((a: any) => {
          const key = a.questionId || String(a.questionIndex);
          uniqueQMap.set(key, a);
        });
        const correct = Array.from(uniqueQMap.values()).filter((a: any) => a.isCorrect).length;
        return {
          score: Math.min(100, Math.round((correct / totalQuestions) * 100)),
          correct: Math.min(totalQuestions, correct),
        };
      }
      return {
        score: Math.min(100, p.score),
        correct: Math.min(totalQuestions, p.correctCount || 0),
      };
    };
    return [...session.participants].sort((a, b) => {
      const aData = getPData(a);
      const bData = getPData(b);
      if (bData.score !== aData.score) return bData.score - aData.score;
      if (bData.correct !== aData.correct) return bData.correct - aData.correct;
      return a.timeSpentSec - b.timeSpentSec;
    });
  }, [session.participants, totalQuestions]);

  // Class accuracy metrics
  const classStats = useMemo(() => {
    const totalParts = session.participants.length;
    if (totalParts === 0) {
      return {
        accuracy: 0,
        avgScore: 0,
        finishedCount: 0,
        questionAccuracies: [] as { index: number; correctRate: number; totalAnswered: number }[],
      };
    }

    let totalScore = 0;
    let finishedCount = 0;
    const questionCorrectCounts: number[] = new Array(totalQuestions).fill(0);
    const questionAnsweredCounts: number[] = new Array(totalQuestions).fill(0);

    session.participants.forEach((p) => {
      const rawAns = p.answers ? Object.values(p.answers).filter((a: any) => a && a.questionId !== 'quiz_completed') : [];
      const uniqueQMap = new Map<string, any>();
      rawAns.forEach((a: any) => {
        const key = a.questionId || String(a.questionIndex);
        uniqueQMap.set(key, a);
      });
      const pAnsList = Array.from(uniqueQMap.values());
      const accurateScore = pAnsList.length > 0
        ? Math.min(100, Math.round((pAnsList.filter((a) => a.isCorrect).length / totalQuestions) * 100))
        : Math.min(100, p.score);
      totalScore += accurateScore;
      if (p.finished) finishedCount++;

      pAnsList.forEach((ans) => {
        const masterIdx = quiz.questions ? quiz.questions.findIndex((q) => q.id === ans.questionId) : -1;
        const resolvedIdx = masterIdx >= 0 ? masterIdx : (typeof ans.questionIndex === 'number' ? ans.questionIndex : -1);
        if (resolvedIdx >= 0 && resolvedIdx < totalQuestions) {
          questionAnsweredCounts[resolvedIdx]++;
          if (ans.isCorrect) {
            questionCorrectCounts[resolvedIdx]++;
          }
        }
      });
    });

    const questionAccuracies = questionCorrectCounts.map((correct, idx) => {
      const answered = questionAnsweredCounts[idx];
      return {
        index: idx,
        correctRate: answered > 0 ? Math.round((correct / answered) * 100) : 0,
        totalAnswered: answered,
      };
    });

    const totalAnswersOverall = questionAnsweredCounts.reduce((a, b) => a + b, 0);
    const totalCorrectOverall = questionCorrectCounts.reduce((a, b) => a + b, 0);
    const overallAccuracy = totalAnswersOverall > 0 ? Math.round((totalCorrectOverall / totalAnswersOverall) * 100) : 0;

    return {
      accuracy: overallAccuracy,
      avgScore: Math.round(totalScore / totalParts),
      finishedCount,
      questionAccuracies,
    };
  }, [session.participants, totalQuestions, quiz.questions]);

  // Data peserta teranotasi duplikasi & pengulangan pengerjaan kuis
  const participantsWithMeta = useMemo(() => {
    return analyzeSessionDuplicates(session.participants);
  }, [session.participants]);

  const participantMetaMap = useMemo(() => {
    const map = new Map<string, (typeof participantsWithMeta)[0]>();
    participantsWithMeta.forEach((p) => map.set(p.id, p));
    return map;
  }, [participantsWithMeta]);

  // Statistik duplikasi pengerjaan kuis dalam sesi aktif
  const duplicateStats = useMemo(() => {
    const uniqueKeys = new Set<string>();
    let repeatAttemptsCount = 0;
    participantsWithMeta.forEach((p) => {
      uniqueKeys.add(p.parsedRollNumber ? `r_${p.parsedRollNumber}_${p.parsedCleanName.toLowerCase()}` : `n_${p.parsedCleanName.toLowerCase()}`);
      if (p.isDuplicateAttempt && p.attemptNumber > 1) {
        repeatAttemptsCount++;
      }
    });
    return {
      totalEntries: participantsWithMeta.length,
      uniqueStudents: uniqueKeys.size,
      repeatAttemptsCount,
    };
  }, [participantsWithMeta]);

  // Peserta untuk Tabel Rekap Live terfilter berdasarkan duplikasi, status, dan pencarian nama/absen
  const filteredTableParticipants = useMemo(() => {
    const getPData = (p: any) => {
      const rawAns = p.answers ? Object.values(p.answers).filter((a: any) => a && a.questionId !== 'quiz_completed') : [];
      if (rawAns.length > 0) {
        const uniqueQMap = new Map<string, any>();
        rawAns.forEach((a: any) => uniqueQMap.set(a.questionId || String(a.questionIndex), a));
        const correct = Array.from(uniqueQMap.values()).filter((a: any) => a.isCorrect).length;
        return {
          score: Math.min(100, Math.round((correct / totalQuestions) * 100)),
          correct: Math.min(totalQuestions, correct),
        };
      }
      return {
        score: Math.min(100, p.score),
        correct: Math.min(totalQuestions, p.correctCount || 0),
      };
    };

    let list = [...participantsWithMeta].sort((a, b) => {
      const aData = getPData(a);
      const bData = getPData(b);
      if (bData.score !== aData.score) return bData.score - aData.score;
      if (bData.correct !== aData.correct) return bData.correct - aData.correct;
      return a.timeSpentSec - b.timeSpentSec;
    });

    // Filter duplikasi
    if (duplicateFilter === 'best') {
      list = list.filter((p) => p.isBestScoreAttempt);
    } else if (duplicateFilter === 'latest') {
      list = list.filter((p) => p.isLatestAttempt);
    }

    // Filter status
    if (tableStatusFilter === 'finished') {
      list = list.filter((p) => p.finished);
    } else if (tableStatusFilter === 'active') {
      list = list.filter((p) => !p.finished);
    }

    // Filter pencarian nama / nomor absen
    if (tableSearch.trim()) {
      const query = tableSearch.trim().toLowerCase();
      list = list.filter((p) => {
        const nameMatch = p.parsedCleanName.toLowerCase().includes(query) || p.name.toLowerCase().includes(query);
        const rollMatch = p.parsedRollNumber.toLowerCase().includes(query);
        return nameMatch || rollMatch;
      });
    }

    return list;
  }, [participantsWithMeta, totalQuestions, duplicateFilter, tableStatusFilter, tableSearch]);

  const handleExportLiveCSV = () => {
    if (!filteredTableParticipants || filteredTableParticipants.length === 0) {
      showToast('Belum ada data siswa untuk diunduh.');
      return;
    }

    const headers = [
      'Peringkat',
      'No. Absen',
      'Nama Siswa',
      'Percobaan Ke',
      'Total Percobaan Siswa',
      'Nilai Tertinggi Siswa',
      'Skor Akhir',
      'Benar',
      'Salah',
      'Kosong',
      'Total Soal',
      'Akurasi (%)',
      'Durasi (Detik)',
      'Status Pengerjaan',
      'Waktu Selesai',
    ];

    const rows = filteredTableParticipants.map((p, idx) => {
      const rawAns = p.answers ? Object.values(p.answers).filter((a: any) => a && a.questionId !== 'quiz_completed') : [];
      const uniqueQMap = new Map<string, any>();
      rawAns.forEach((a: any) => uniqueQMap.set(a.questionId || String(a.questionIndex), a));
      const pAnsList = Array.from(uniqueQMap.values());
      const displayCorrect = pAnsList.length > 0 ? Math.min(totalQuestions, pAnsList.filter((a: any) => a.isCorrect).length) : Math.min(totalQuestions, p.correctCount);
      const displayIncorrect = pAnsList.length > 0 ? pAnsList.filter((a: any) => !a.isCorrect).length : Math.min(totalQuestions - displayCorrect, p.incorrectCount);
      const answered = pAnsList.length > 0 ? pAnsList.length : (displayCorrect + displayIncorrect);
      const unanswered = Math.max(0, totalQuestions - answered);
      const displayScore = Math.min(100, pAnsList.length > 0 ? Math.round((displayCorrect / totalQuestions) * 100) : p.score);
      const accuracy = totalQuestions > 0 ? Math.round((displayCorrect / totalQuestions) * 100) : 0;

      return [
        idx + 1,
        `"${p.parsedRollNumber || '-'}"`,
        `"${(p.parsedCleanName || p.name).replace(/"/g, '""')}"`,
        p.attemptNumber,
        p.totalAttempts,
        p.isBestScoreAttempt ? 'Ya' : 'Tidak',
        displayScore,
        displayCorrect,
        displayIncorrect,
        unanswered,
        totalQuestions,
        `${accuracy}%`,
        Math.round(p.timeSpentSec),
        p.finished ? 'Selesai' : 'Sedang Mengerjakan',
        p.completedAt ? `"${formatIndonesianTime(p.completedAt, { withDate: true })}"` : (p.lastActiveAt ? `"${formatIndonesianTime(p.lastActiveAt, { withDate: true })}"` : '-'),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitizeTitle = (quiz.title || 'Kuis').replace(/[/\\?%*:|"<>]/g, '-').slice(0, 30);
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Live_${sanitizeTitle}_PIN_${session.pinCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Rekap nilai live berhasil diunduh (format CSV).');
  };

  const handlePrintTable = () => {
    window.print();
  };

  const currentDisplayQuestion = quiz.questions[currentDisplayQuestionIdx];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none animate-fade-in font-sans">
      
      {/* ─── TOP MASTER STUDIO HEADER ────────────────────────────────────────── */}
      <header className="w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800/90 px-3 sm:px-6 lg:px-8 py-3 sticky top-0 z-30 shadow-2xl no-print">
        <div className="w-full max-w-[1920px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-6">
          
          {/* Sisi Kiri: Tombol Kembali + Identitas Kuis Utama (Besar & Jelas) */}
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => {
                playClick();
                onBack();
              }}
              className="mt-0.5 sm:mt-0 p-2.5 rounded-2xl text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 border border-slate-750 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0 btn-press cursor-pointer"
              title="Kembali ke Dasbor Guru"
              aria-label="Kembali ke Dasbor Guru"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0 flex-1">
              {/* Breadcrumb & Sesi Status Ringkas */}
              <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold text-slate-400 mb-1">
                <span className="text-slate-500 uppercase tracking-wider">Ruang Kendali Host</span>
                <span className="text-slate-700">•</span>
                <span className="text-indigo-400">{quiz.subject || 'Pelajaran Umum'}</span>
                {quiz.grade && (
                  <>
                    <span className="text-slate-700">•</span>
                    <span className="text-slate-400">Kelas {quiz.grade}</span>
                  </>
                )}

                {/* Status Pill Sesi */}
                <span className="ml-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border uppercase">
                  {session.status === 'active' ? (
                    <span className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Sesi Live Aktif</span>
                    </span>
                  ) : session.status === 'paused' ? (
                    <span className="bg-amber-500/15 text-amber-300 border-amber-500/30 inline-flex items-center gap-1 px-2 py-0.5 rounded-full">
                      <Pause className="w-2.5 h-2.5 text-amber-400" />
                      <span>Dijeda</span>
                    </span>
                  ) : session.status === 'waiting' ? (
                    <span className="bg-blue-500/15 text-blue-300 border-blue-500/30 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      <span>Ruang Tunggu</span>
                    </span>
                  ) : (
                    <span className="bg-slate-800 text-slate-300 border-slate-700 inline-flex items-center gap-1 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Selesai</span>
                    </span>
                  )}
                </span>
              </div>

              {/* JUDUL KUIS BESAR, JELAS, DAN MENONJOL (Memecahkan Keluhan AI Slop) */}
              <h1 
                className="text-base sm:text-lg lg:text-xl font-black text-white tracking-tight leading-snug break-words"
                title={quiz.title}
              >
                {quiz.title}
              </h1>
            </div>
          </div>

          {/* Sisi Kanan: PIN Ruang Monospace + Toolbar Kontrol Host */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-wrap lg:flex-nowrap border-t border-slate-800/80 pt-2.5 lg:pt-0 lg:border-t-0">
            
            {/* PIN Badge Kartu Presisi Monospace */}
            <div className="flex items-center gap-2 bg-slate-950/80 border border-amber-500/40 px-3 py-1.5 rounded-2xl shadow-inner flex-shrink-0">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-black text-amber-400/90 tracking-widest leading-none">
                  PIN KELAS
                </span>
                <span className="font-mono font-black text-amber-300 tracking-wider text-base sm:text-lg tabular-nums leading-tight">
                  {session.pinCode}
                </span>
              </div>

              <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-850 active:bg-slate-750 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center btn-press cursor-pointer"
                  title="Salin PIN Ruang Kelas"
                  aria-label="Salin PIN"
                >
                  {copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1.5 px-2 rounded-xl bg-blue-600/25 hover:bg-blue-600/40 text-blue-200 text-xs font-bold transition-all min-h-[36px] flex items-center gap-1 border border-blue-500/35 btn-press cursor-pointer"
                  title="Salin Tautan Langsung Siswa"
                  aria-label="Salin Tautan Siswa"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-blue-400" />}
                  <span className="hidden sm:inline">{copiedLink ? 'Tersalin' : 'Tautan'}</span>
                </button>
              </div>
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Tombol Chat Kelas */}
              {session.status !== 'finished' && (
                <button
                  type="button"
                  onClick={handleOpenChatDrawer}
                  className={`relative p-2.5 sm:px-3 py-2 rounded-xl border text-xs font-bold min-h-[44px] flex items-center gap-1.5 transition-colors btn-press cursor-pointer ${
                    session.isChatMuted || session.settings?.isChatMuted
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                      : 'border-blue-500/40 bg-blue-600/20 hover:bg-blue-600/30 text-blue-200'
                  }`}
                  title="Buka Ruang Obrolan Kelas"
                  aria-label="Buka Chat Kelas"
                >
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="hidden xl:inline">Chat</span>
                  {unreadChatCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-black animate-scale-in">
                      {unreadChatCount > 99 ? '99+' : unreadChatCount}
                    </span>
                  )}
                </button>
              )}

              {/* Quick Chat Mute / Unmute Toggle */}
              {isTeacherLed && session.status !== 'finished' && (
                <button
                  type="button"
                  onClick={handleToggleChatMute}
                  className={`p-2.5 rounded-xl border text-xs font-bold min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors btn-press cursor-pointer ${
                    session.isChatMuted || session.settings?.isChatMuted
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
                      : 'bg-slate-850 border-slate-750 text-slate-300 hover:bg-slate-800'
                  }`}
                  title={session.isChatMuted || session.settings?.isChatMuted ? 'Buka Kunci Obrolan Siswa' : 'Bungkam Obrolan Siswa'}
                  aria-label="Toggle Kunci Obrolan"
                >
                  {session.isChatMuted || session.settings?.isChatMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
              )}

              {/* Simulation student button */}
              <button
                type="button"
                onClick={handleSimulateStudents}
                disabled={isSimulating || session.status === 'finished'}
                className="p-2.5 sm:px-3 py-2 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-500/35 text-indigo-200 text-xs font-bold min-h-[44px] flex items-center gap-1.5 transition-colors disabled:opacity-40 btn-press cursor-pointer"
                title="Masukkan 3 Siswa Simulasi untuk Uji Coba Papan Kendali"
                aria-label="Simulasi 3 Siswa"
              >
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span className="hidden md:inline">+3 Uji</span>
              </button>

              {/* Jeda / Lanjutkan Kuis */}
              {session.status !== 'finished' && (
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="p-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-200 text-xs font-bold min-h-[44px] flex items-center justify-center gap-1.5 transition-colors btn-press cursor-pointer"
                  title={session.status === 'paused' ? 'Lanjutkan Pengerjaan Siswa' : 'Jeda Pengerjaan Siswa'}
                >
                  {session.status === 'paused' ? (
                    <>
                      <Play className="w-4 h-4 text-emerald-400" />
                      <span className="hidden sm:inline text-emerald-300">Lanjut</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 text-amber-400" />
                      <span className="hidden sm:inline text-amber-300">Jeda</span>
                    </>
                  )}
                </button>
              )}

              {/* Tombol Utama: Akhiri Kuis atau Lihat Rekapan */}
              {session.status !== 'finished' ? (
                <button
                  type="button"
                  onClick={() => setConfirmEndModal(true)}
                  className="px-3.5 sm:px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black min-h-[44px] flex items-center gap-1.5 shadow-lg shadow-rose-950/50 transition-colors btn-press cursor-pointer"
                  title="Akhiri Sesi Kuis & Buka Rekap Nilai"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span className="whitespace-nowrap">Akhiri Kuis</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onViewRecap(session)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black min-h-[44px] flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-colors btn-press cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Buka Rekapan</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* ─── EXECUTIVE KPI STRIP (METRIC QUICK BAR) ────────────────────────── */}
      <section className="bg-slate-900/60 border-b border-slate-800/80 px-3 sm:px-6 lg:px-8 py-3 no-print">
        <div className="w-full max-w-[1920px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          
          {/* KPI 1: Siswa Terhubung */}
          <div className="bg-slate-850/80 rounded-2xl p-3 sm:p-3.5 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Siswa Terhubung</div>
              <div className="text-base sm:text-xl font-black text-white tabular-nums flex items-center gap-1.5">
                <span>{session.participants.length}</span>
                <span className="text-xs font-semibold text-slate-400">anak</span>
              </div>
            </div>
          </div>

          {/* KPI 2: Akurasi Kelas */}
          <div className="bg-slate-850/80 rounded-2xl p-3 sm:p-3.5 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Akurasi Jawaban</div>
              <div className="text-base sm:text-xl font-black text-emerald-300 tabular-nums">
                {classStats.accuracy}%
              </div>
            </div>
          </div>

          {/* KPI 3: Rata-rata Skor */}
          <div className="bg-slate-850/80 rounded-2xl p-3 sm:p-3.5 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold flex-shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata Skor</div>
              <div className="text-base sm:text-xl font-black text-amber-300 tabular-nums">
                {classStats.avgScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
              </div>
            </div>
          </div>

          {/* KPI 4: Selesai / Format */}
          <div className="bg-slate-850/80 rounded-2xl p-3 sm:p-3.5 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Selesai Mengerjakan</div>
              <div className="text-base sm:text-xl font-black text-purple-300 tabular-nums">
                {classStats.finishedCount} <span className="text-xs font-normal text-slate-400">/ {session.participants.length}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── TAB NAVIGATION BAR (SEGMENTED CONTROL) ───────────────────────── */}
      <nav className="bg-slate-900/40 px-3 sm:px-6 lg:px-8 border-b border-slate-800/80 sticky top-[73px] z-20 backdrop-blur-md no-print">
        <div className="w-full max-w-[1920px] mx-auto flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar scrollbar-none">
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('leaderboard');
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] whitespace-nowrap btn-press cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-4 h-4 flex-shrink-0" />
            <span>Leaderboard Live ({session.participants.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('table');
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] whitespace-nowrap btn-press cursor-pointer ${
              activeTab === 'table'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
            <span>Tabel Rekapitulasi ({session.participants.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('matrix');
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] whitespace-nowrap btn-press cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 flex-shrink-0" />
            <span>Matriks Akurasi Soal ({totalQuestions})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('display');
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] whitespace-nowrap btn-press cursor-pointer ${
              activeTab === 'display'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Tv className="w-4 h-4 flex-shrink-0" />
            <span>Layar Bersama / IFP</span>
          </button>
        </div>
      </nav>

      {/* ─── MAIN CONTENT BODY ────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
        
        {/* TAB 1: LEADERBOARD LIVE */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-5 animate-fade-in">
            
            {/* WAITING ROOM HERO CENTERPIECE (Sesi Belum Dimulai) */}
            {session.status === 'waiting' && (
              <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-750 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                  
                  {/* Info Header Ruang Tunggu */}
                  <div className="space-y-2 text-center xl:text-left flex-1 min-w-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>Ruang Tunggu Kelas Siap Menerima Siswa</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                      {quiz.title}
                    </h2>
                    
                    <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                      Minta siswa membuka aplikasi di smartphone / chromebook mereka, lalu masukkan PIN ruang kelas berikut untuk bergabung:
                    </p>
                  </div>

                  {/* CENTERPIECE: PIN RUANG KELAS RAKSASA (Sangat Jelas & Terbaca Dari Kejauhan) */}
                  <div className="bg-slate-950/90 border-2 border-amber-500/50 rounded-3xl px-6 py-4 shadow-xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <div>
                      <div className="text-[10px] font-black uppercase text-amber-400/90 tracking-widest">
                        PIN RUANG KELAS
                      </div>
                      <div className="font-mono text-3xl sm:text-5xl font-black text-amber-300 tracking-widest tabular-nums select-all">
                        {session.pinCode}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                      <button
                        type="button"
                        onClick={handleCopyPin}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 min-h-[44px] btn-press"
                      >
                        {copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                        <span>{copiedPin ? 'Tersalin' : 'Salin PIN'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-3.5 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-blue-500/40 min-h-[44px] btn-press"
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-blue-400" />}
                        <span>{copiedLink ? 'Link Tersalin' : 'Bagi Link'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Tombol Raksasa: Mulai Kuis */}
                  {isTeacherLed && (
                    <div className="w-full xl:w-auto flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={handleStartQuiz}
                        className="w-full xl:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-3 transition-all transform active:scale-98 min-h-[52px] btn-press"
                      >
                        <Play className="w-5 h-5 fill-white" />
                        <span>Mulai Kuis Bersama</span>
                      </button>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        Semua siswa akan serentak mulai soal #1
                      </span>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* CONTROLS: Navigasi Soal Saat Mode Dipandu Guru Aktif */}
            {isTeacherLed && session.status === 'active' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-black tracking-wide shadow-sm">
                    SOAL {(session.currentQuestionIndex ?? 0) + 1} DARI {totalQuestions}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    {session.settings?.teacherPacingSubMode === 'timed_next' ? '⏱️ Waktu Terjadwal + Lanjut Guru' : '🎯 Kendali Manual Penuh Guru'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {hostCountdownSec !== null ? (
                    <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black min-h-[44px] flex items-center gap-2 animate-pulse">
                      <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                      <span>Hitung Mundur Siswa: {hostCountdownSec > 0 ? `${hostCountdownSec}s...` : 'Mulai!'}</span>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => promptAdvanceQuestion(Math.max(0, (session.currentQuestionIndex ?? 0) - 1), 'prev')}
                        disabled={(session.currentQuestionIndex ?? 0) === 0}
                        className="px-4 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 active:bg-slate-750 text-slate-200 text-xs font-bold disabled:opacity-40 min-h-[44px] flex items-center gap-1.5 transition-colors border border-slate-750 btn-press cursor-pointer"
                        title="Kembali ke Soal Sebelumnya"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Sebelumnya</span>
                      </button>

                      {(session.currentQuestionIndex ?? 0) < totalQuestions - 1 ? (
                        <button
                          type="button"
                          onClick={() => promptAdvanceQuestion((session.currentQuestionIndex ?? 0) + 1, 'next')}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-black min-h-[44px] flex items-center gap-2 shadow-lg shadow-blue-950/50 transition-colors btn-press cursor-pointer"
                          title="Buka Soal Berikutnya Serentak"
                        >
                          <span>Buka Soal Berikutnya</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmEndModal(true)}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black min-h-[44px] flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-colors btn-press cursor-pointer"
                        >
                          <Square className="w-4 h-4 fill-current" />
                          <span>Selesaikan Kuis</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Bilah Reaksi Semangat Guru */}
            {session.status !== 'finished' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:px-6 sm:py-3.5 flex flex-col items-center justify-center gap-2 shadow-lg max-w-xl mx-auto w-full transition-all">
                <QuizizzReactionButtonRow
                  sessionId={session.id}
                  senderName={session.teacherName || 'Bapak/Ibu Guru'}
                  isTeacher={true}
                  playClick={playClick}
                  compact={true}
                  title={session.status === 'waiting' ? 'Kirim Reaksi Guru di Ruang Tunggu:' : 'Kirim Reaksi Semangat Guru ke Siswa:'}
                />
              </div>
            )}

            {/* Empty State Peserta Belum Bergabung */}
            {session.participants.length === 0 ? (
              <div className="bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-xl">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-3xl">
                  👥
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-white">
                    Belum Ada Siswa Bergabung
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Siswa yang memasukkan PIN <strong className="text-amber-300 font-mono">{session.pinCode}</strong> akan langsung muncul pada leaderboard ini secara real-time.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSimulateStudents}
                    disabled={isSimulating}
                    className="px-5 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-750 text-indigo-300 text-xs font-bold inline-flex items-center gap-2 transition-colors min-h-[44px] btn-press disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isSimulating ? 'Memuat Simulasi...' : 'Uji Coba Masukkan 3 Siswa Simulasi'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-2 uppercase tracking-wider">
                  <span>Peringkat & Nama Siswa</span>
                  <span>Progres & Skor</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {sortedParticipants.map((p, index) => {
                    const isTop3 = index < 3;
                    const rankColor = index === 0 
                      ? 'text-amber-300 border-amber-500/40 bg-amber-500/10' 
                      : index === 1 
                      ? 'text-slate-200 border-slate-400/40 bg-slate-500/10' 
                      : index === 2 
                      ? 'text-amber-600 border-amber-700/40 bg-amber-800/10' 
                      : 'text-slate-400 border-slate-800 bg-slate-900';

                    const avatarEmoji = AVATAR_MAP[p.avatarId] || '🦁';

                    // Hitung nilai dan jumlah benar yang akurat dari riwayat jawaban unik per soal
                    const rawAns = p.answers ? Object.values(p.answers).filter((a: any) => a && a.questionId !== 'quiz_completed') : [];
                    const uniqueQMap = new Map<string, any>();
                    rawAns.forEach((a: any) => {
                      const key = a.questionId || String(a.questionIndex);
                      uniqueQMap.set(key, a);
                    });
                    const pAnsList = Array.from(uniqueQMap.values());

                    const displayCorrectCount = pAnsList.length > 0
                      ? Math.min(totalQuestions, pAnsList.filter((a: any) => a.isCorrect).length)
                      : Math.min(totalQuestions, p.correctCount);
                    const displayIncorrectCount = pAnsList.length > 0
                      ? pAnsList.filter((a: any) => !a.isCorrect).length
                      : Math.min(totalQuestions - displayCorrectCount, p.incorrectCount);
                    const answeredCount = pAnsList.length > 0
                      ? pAnsList.length
                      : Math.min(totalQuestions, displayCorrectCount + displayIncorrectCount);
                    const displayUnansweredCount = Math.max(0, totalQuestions - answeredCount);
                    const displayScore = Math.min(100, pAnsList.length > 0
                      ? Math.round((displayCorrectCount / totalQuestions) * 100)
                      : p.score);

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedStudentForAnalysis(p)}
                        role="button"
                        tabIndex={0}
                        title="Klik untuk melihat lembar analisis jawaban siswa ini"
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-500/60 hover:bg-slate-850 hover:shadow-xl active:scale-[0.995] group ${
                          isTop3 ? 'shadow-md ' + rankColor : 'bg-slate-900/90 border-slate-800'
                        }`}
                      >
                        {/* Kiri: Peringkat, Avatar, Nama Siswa */}
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl font-black text-sm sm:text-base flex items-center justify-center flex-shrink-0 border tabular-nums ${rankColor}`}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </div>

                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-inner">
                            {avatarEmoji}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm sm:text-base text-white break-words group-hover:text-indigo-200 transition-colors">
                                {formatStudentDisplayName(p.name)}
                              </span>
                              {(() => {
                                const meta = participantMetaMap.get(p.id);
                                if (!meta || !meta.isDuplicateAttempt) return null;
                                return (
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                                      meta.attemptNumber > 1
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                        : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                    }`}
                                  >
                                    <span>#{meta.attemptNumber}</span>
                                    {meta.isBestScoreAttempt && meta.totalAttempts > 1 && (
                                      <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1 rounded">Terbaik</span>
                                    )}
                                  </span>
                                );
                              })()}
                              {p.streak >= 2 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black">
                                  <Flame className="w-3 h-3 text-rose-400 fill-rose-400" />
                                  {p.streak}
                                </span>
                              )}
                              {p.finished && (
                                <span 
                                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                                    displayUnansweredCount > 0
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  }`}
                                >
                                  {displayUnansweredCount > 0 ? `Selesai (${displayUnansweredCount} kosong)` : 'Selesai'}
                                </span>
                              )}
                              {p.tabSwitchCount && p.tabSwitchCount > 0 ? (
                                <span 
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold animate-pulse"
                                >
                                  <span>⚠️ {p.tabSwitchCount}x Tab</span>
                                </span>
                              ) : null}
                            </div>

                            <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap mt-0.5">
                              <span>Benar: <strong className="text-emerald-400">{displayCorrectCount}</strong></span>
                              <span>•</span>
                              <span>Salah: <strong className="text-rose-400">{displayIncorrectCount}</strong></span>
                              {displayUnansweredCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-300 font-medium">
                                    Kosong: <strong className="text-amber-400">{displayUnansweredCount}</strong>
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span className="tabular-nums">{Math.round(p.timeSpentSec)} dtk</span>
                              {(p.completedAt || p.lastActiveAt) && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className={p.finished ? "text-emerald-400 font-medium inline-flex items-center gap-1" : "text-slate-400 inline-flex items-center gap-1"}>
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>{p.finished ? `Selesai: ${formatIndonesianTime(p.completedAt || p.lastActiveAt, { withDate: true })}` : `Aktif: ${formatIndonesianTime(p.lastActiveAt, { withDate: true })}`}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Kanan: Progress Bar & Skor Angka */}
                        <div className="text-right flex items-center gap-3 sm:gap-4 flex-shrink-0">
                          <div className="hidden sm:block w-28 lg:w-44 text-left">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                              <span>Progres</span>
                              <span className="tabular-nums">
                                {p.finished 
                                  ? (displayUnansweredCount > 0 ? `${answeredCount} / ${totalQuestions}` : `${totalQuestions} / ${totalQuestions}`)
                                  : `${p.currentQuestionIndex} / ${totalQuestions}`}
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  p.finished
                                    ? (displayUnansweredCount > 0 ? 'bg-gradient-to-r from-blue-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500')
                                    : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                }`}
                                style={{
                                  width: `${Math.min(100, ((p.finished ? answeredCount : p.currentQuestionIndex) / totalQuestions) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <div className="text-base sm:text-xl font-black text-amber-300 leading-none tabular-nums">
                              {displayScore} <span className="text-xs font-normal text-slate-400">pts</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold">
                              {'⭐'.repeat(p.stars || 1)}
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-500/15 group-hover:bg-indigo-600 group-hover:text-white px-2 py-0.5 rounded-md border border-indigo-500/30 transition-all">
                              <ClipboardList className="w-3 h-3" />
                              <span className="hidden sm:inline">Analisis</span>
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TABEL REKAPITULASI LIVE */}
        {activeTab === 'table' && (
          <div className="space-y-4 animate-fade-in">
            {/* Print Header (Only visible on print / PDF) */}
            <div className="hidden print:block mb-4 border-b-2 border-slate-900 pb-3">
              <h1 className="text-xl font-black text-slate-900">Rekap Nilai Siswa: {quiz.title}</h1>
              <div className="text-xs text-slate-600 mt-1 flex items-center gap-4 flex-wrap">
                <span><strong>Kelas:</strong> {quiz.grade}</span>
                <span><strong>Mata Pelajaran:</strong> {quiz.subject}</span>
                <span><strong>PIN Kuis:</strong> {session.pinCode}</span>
                <span><strong>Total Soal:</strong> {totalQuestions} Butir</span>
                <span><strong>Dicetak pada:</strong> {formatIndonesianTime(new Date().toISOString(), { withDate: true })}</span>
              </div>
            </div>

            {/* Header & Metric Cards */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                  <span>Tabel Rekapitulasi Hasil Pengerjaan Siswa</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rekap data pengerjaan siswa terintegrasi dengan filter percobaan dan ekspor dokumen.
                </p>
              </div>

              {/* Action Buttons: Download CSV & Print */}
              <div className="flex items-center gap-2 flex-wrap no-print">
                <button
                  type="button"
                  onClick={handleExportLiveCSV}
                  disabled={session.participants.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold flex items-center gap-2 transition-colors min-h-[44px] shadow-md shadow-emerald-950/40 btn-press cursor-pointer"
                  title="Unduh rekapan hasil kuis sementara ke file CSV / Excel"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Rekap (CSV)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintTable}
                  disabled={session.participants.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-650 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors min-h-[44px] border border-slate-700 btn-press cursor-pointer"
                  title="Cetak atau simpan rekapan sebagai dokumen PDF"
                >
                  <Printer className="w-4 h-4 text-blue-400" />
                  <span>Cetak / PDF</span>
                </button>
              </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Entri Masuk</div>
                <div className="text-xl sm:text-2xl font-black text-white tabular-nums">{session.participants.length}</div>
                <div className="text-[10px] text-slate-500">Seluruh sesi pengerjaan</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Siswa Unik</div>
                <div className="text-xl sm:text-2xl font-black text-blue-300 tabular-nums">{duplicateStats.uniqueStudents}</div>
                <div className="text-[10px] text-slate-500">Terdaftar tanpa duplikasi</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Pengerjaan Ulang</div>
                <div className="text-xl sm:text-2xl font-black text-amber-300 tabular-nums">{duplicateStats.repeatAttemptsCount}</div>
                <div className="text-[10px] text-slate-500">
                  {duplicateStats.repeatAttemptsCount > 0 ? 'Siswa mengulang kuis' : 'Belum ada ulangan'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Selesai / Progres</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-300 tabular-nums">
                  {classStats.finishedCount} <span className="text-xs font-normal text-slate-400">/ {session.participants.length}</span>
                </div>
                <div className="text-[10px] text-slate-500">Rata-rata: {classStats.avgScore} pts</div>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 no-print">
              {/* Left: Filter Attempt Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Percobaan:</span>
                </span>
                <button
                  type="button"
                  onClick={() => { playClick(); setDuplicateFilter('all'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] btn-press cursor-pointer ${
                    duplicateFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  Semua ({session.participants.length})
                </button>
                <button
                  type="button"
                  onClick={() => { playClick(); setDuplicateFilter('best'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] btn-press cursor-pointer ${
                    duplicateFilter === 'best'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                  title="Hanya tampilkan percobaan dengan nilai tertinggi untuk setiap siswa"
                >
                  Nilai Tertinggi ({duplicateStats.uniqueStudents})
                </button>
                <button
                  type="button"
                  onClick={() => { playClick(); setDuplicateFilter('latest'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] btn-press cursor-pointer ${
                    duplicateFilter === 'latest'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                  title="Hanya tampilkan percobaan terkini/terakhir untuk setiap siswa"
                >
                  Percobaan Terakhir ({duplicateStats.uniqueStudents})
                </button>
              </div>

              {/* Right: Search & Status Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status selector */}
                <select
                  value={tableStatusFilter}
                  onChange={(e) => setTableStatusFilter(e.target.value as any)}
                  aria-label="Filter status pengerjaan siswa"
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 min-h-[40px] cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="finished">Hanya Selesai ({classStats.finishedCount})</option>
                  <option value="active">Sedang Mengerjakan ({Math.max(0, session.participants.length - classStats.finishedCount)})</option>
                </select>

                {/* Search Input */}
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Cari nama / no. absen..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 min-h-[40px]"
                  />
                  {tableSearch && (
                    <button
                      type="button"
                      onClick={() => setTableSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table Container */}
            {filteredTableParticipants.length === 0 ? (
              <div className="bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 p-8 text-center space-y-2">
                <div className="text-3xl">🔍</div>
                <h4 className="text-sm font-bold text-white">Tidak Ada Data Siswa yang Cocok</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {tableSearch ? `Tidak ditemukan siswa dengan kata kunci "${tableSearch}". Coba ubah pencarian atau reset filter.` : 'Belum ada data siswa pada filter ini.'}
                </p>
                {(tableSearch || duplicateFilter !== 'all' || tableStatusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setTableSearch('');
                      setDuplicateFilter('all');
                      setTableStatusFilter('all');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-blue-300 mt-2 min-h-[40px] btn-press cursor-pointer"
                  >
                    Reset Semua Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3.5 font-bold text-center w-12">#</th>
                        <th className="py-3 px-3.5 font-bold">No. Absen & Nama Siswa</th>
                        <th className="py-3 px-3.5 font-bold text-center">Percobaan</th>
                        <th className="py-3 px-3.5 font-bold text-center">Skor</th>
                        <th className="py-3 px-3.5 font-bold text-center">Akurasi</th>
                        <th className="py-3 px-3.5 font-bold text-center">Benar / Salah / Kosong</th>
                        <th className="py-3 px-3.5 font-bold text-center">Durasi & Selesai</th>
                        <th className="py-3 px-3.5 font-bold text-center">Status</th>
                        <th className="py-3 px-3.5 font-bold text-center no-print">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredTableParticipants.map((p, idx) => {
                        const avatarEmoji = AVATAR_MAP[p.avatarId] || '🦁';

                        const rawAns = p.answers ? Object.values(p.answers).filter((a: any) => a && a.questionId !== 'quiz_completed') : [];
                        const uniqueQMap = new Map<string, any>();
                        rawAns.forEach((a: any) => uniqueQMap.set(a.questionId || String(a.questionIndex), a));
                        const pAnsList = Array.from(uniqueQMap.values());

                        const displayCorrect = pAnsList.length > 0
                          ? Math.min(totalQuestions, pAnsList.filter((a: any) => a.isCorrect).length)
                          : Math.min(totalQuestions, p.correctCount);
                        const displayIncorrect = pAnsList.length > 0
                          ? pAnsList.filter((a: any) => !a.isCorrect).length
                          : Math.min(totalQuestions - displayCorrect, p.incorrectCount);
                        const answered = pAnsList.length > 0 ? pAnsList.length : (displayCorrect + displayIncorrect);
                        const unanswered = Math.max(0, totalQuestions - answered);
                        const displayScore = Math.min(100, pAnsList.length > 0
                          ? Math.round((displayCorrect / totalQuestions) * 100)
                          : p.score);
                        const accuracyRate = totalQuestions > 0 ? Math.round((displayCorrect / totalQuestions) * 100) : 0;

                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-slate-850/70 transition-colors"
                          >
                            {/* Peringkat */}
                            <td className="py-3 px-3.5 text-center font-bold text-slate-400 tabular-nums">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                            </td>

                            {/* No. Absen & Nama Siswa */}
                            <td className="py-3 px-3.5">
                              <div className="flex items-center gap-2.5 min-w-[180px] max-w-sm">
                                <span className="text-xl flex-shrink-0" role="img" aria-label="avatar">
                                  {avatarEmoji}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-white text-xs sm:text-sm break-words leading-snug">
                                    {p.parsedRollNumber ? (
                                      <span className="inline-flex items-center gap-1 mr-1.5 px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px] font-black">
                                        No.{p.parsedRollNumber}
                                      </span>
                                    ) : null}
                                    <span>{p.parsedCleanName || p.name}</span>
                                  </div>
                                  {p.tabSwitchCount && p.tabSwitchCount > 0 ? (
                                    <span className="text-[10px] text-rose-300 font-bold inline-flex items-center gap-0.5 mt-0.5">
                                      <span>⚠️ Pindah Tab: {p.tabSwitchCount}x</span>
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </td>

                            {/* Percobaan / Duplikasi */}
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <div className="inline-flex flex-col items-center gap-0.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                    p.attemptNumber > 1
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                      : 'bg-slate-800 text-slate-300 border-slate-700'
                                  }`}
                                >
                                  Ke-{p.attemptNumber} {p.totalAttempts > 1 ? `(${p.totalAttempts}x)` : ''}
                                </span>
                                {p.isBestScoreAttempt && p.totalAttempts > 1 && (
                                  <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                                    Terbaik
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Skor */}
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <span className="text-sm font-black text-amber-300 tabular-nums">{displayScore}</span>
                              <span className="text-[10px] text-slate-400 ml-0.5">pts</span>
                            </td>

                            {/* Akurasi */}
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <div className="inline-flex flex-col items-center gap-1">
                                <span
                                  className={`text-xs font-bold tabular-nums ${
                                    accuracyRate >= 80
                                      ? 'text-emerald-400'
                                      : accuracyRate >= 60
                                      ? 'text-amber-400'
                                      : 'text-rose-400'
                                  }`}
                                >
                                  {accuracyRate}%
                                </span>
                                <div className="w-14 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      accuracyRate >= 80
                                        ? 'bg-emerald-500'
                                        : accuracyRate >= 60
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${accuracyRate}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Benar / Salah / Kosong */}
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5 text-xs tabular-nums">
                                <span className="text-emerald-400 font-bold" title="Jawaban Benar">
                                  ✓ {displayCorrect}
                                </span>
                                <span className="text-slate-600">/</span>
                                <span className="text-rose-400 font-bold" title="Jawaban Salah">
                                  ✗ {displayIncorrect}
                                </span>
                                {unanswered > 0 && (
                                  <>
                                    <span className="text-slate-600">/</span>
                                    <span className="text-amber-400 font-bold" title="Soal Belum Dijawab / Kosong">
                                      ⊘ {unanswered}
                                    </span>
                                  </>
                                )}
                              </div>
                            </td>

                            {/* Durasi & Waktu Selesai */}
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <div className="text-[11px] font-medium text-slate-300 tabular-nums">
                                {Math.round(p.timeSpentSec)} dtk
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {p.completedAt
                                  ? formatIndonesianTime(p.completedAt)
                                  : p.lastActiveAt
                                  ? `Aktif ${formatIndonesianTime(p.lastActiveAt)}`
                                  : '-'}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              {p.finished ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>Selesai</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold inline-flex items-center gap-1 animate-pulse">
                                  <Clock className="w-3 h-3" />
                                  <span>Mengerjakan</span>
                                </span>
                              )}
                            </td>

                            {/* Aksi: Buka Lembar Jawaban */}
                            <td className="py-3 px-3.5 text-center whitespace-nowrap no-print">
                              <button
                                type="button"
                                onClick={() => setSelectedStudentForAnalysis(p)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-slate-750 hover:border-indigo-500 text-xs font-bold inline-flex items-center gap-1.5 transition-all min-h-[36px] btn-press cursor-pointer"
                                title="Lihat lembar analisis jawaban butir soal siswa"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Lembar</span>
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
          </div>
        )}

        {/* TAB 3: MATRIKS AKURASI SOAL */}
        {activeTab === 'matrix' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  <span>Tingkat Keberhasilan Siswa per Butir Soal</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pantau butir soal yang mudah dipahami atau memerlukan penjelasan ulang bagi kelas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {quiz.questions.map((q, idx) => {
                const stat = classStats.questionAccuracies[idx] || { correctRate: 0, totalAnswered: 0 };
                const isHard = stat.totalAnswered > 0 && stat.correctRate < 50;
                const isEasy = stat.totalAnswered > 0 && stat.correctRate >= 80;

                return (
                  <div
                    key={q.id || idx}
                    className="bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-3.5 shadow-xl hover:border-slate-750 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-slate-750">
                        Soal #{idx + 1}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border tabular-nums ${
                          isHard
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : isEasy
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        Akurasi: {stat.correctRate}%
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 font-medium line-clamp-2 leading-relaxed">
                      {q.text}
                    </p>

                    <div className="space-y-1.5 text-xs pt-1">
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            stat.correctRate >= 70
                              ? 'bg-emerald-500'
                              : stat.correctRate >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${stat.correctRate}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Dijawab {stat.totalAnswered} siswa</span>
                        {q.options && q.options[q.correctIndex] && (
                          <span className="text-emerald-400 font-bold truncate max-w-[180px]">
                            Kunci: {q.options[q.correctIndex]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: LAYAR BERSAMA / IFP PROYEKTOR */}
        {activeTab === 'display' && (
          <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
            <div className="flex items-center justify-between bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-xl">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-900/40">
                  Soal {currentDisplayQuestionIdx + 1} dari {quiz.questions.length}
                </span>
                <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Tampilan Presentasi Layar Smartboard</span>
              </div>
              <div className="flex items-center gap-2">
                {isTeacherLed && (
                  <span className="hidden md:inline-flex px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                    📡 Terhubung Serentak ke Siswa
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = Math.max(0, currentDisplayQuestionIdx - 1);
                    if (isTeacherLed) {
                      promptAdvanceQuestion(nextIdx, 'prev');
                    } else {
                      setCurrentDisplayQuestionIdx(nextIdx);
                    }
                  }}
                  disabled={currentDisplayQuestionIdx === 0 || hostCountdownSec !== null}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-xs font-bold disabled:opacity-40 min-h-[44px] transition-colors border border-slate-700 btn-press cursor-pointer"
                >
                  ◀ Sebelumnya
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = Math.min(quiz.questions.length - 1, currentDisplayQuestionIdx + 1);
                    if (isTeacherLed) {
                      promptAdvanceQuestion(nextIdx, 'next');
                    } else {
                      setCurrentDisplayQuestionIdx(nextIdx);
                    }
                  }}
                  disabled={currentDisplayQuestionIdx === quiz.questions.length - 1 || hostCountdownSec !== null}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold disabled:opacity-40 min-h-[44px] transition-colors shadow-md shadow-blue-900/40 btn-press cursor-pointer"
                >
                  Selanjutnya ▶
                </button>
              </div>
            </div>

            {currentDisplayQuestion && (
              <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 space-y-6 shadow-2xl">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white text-center leading-snug">
                  {currentDisplayQuestion.text}
                </h2>

                {currentDisplayQuestion.imageUrl && (
                  <div className="max-w-md mx-auto rounded-3xl overflow-hidden border border-slate-800 shadow-xl">
                    <QuizIllustration
                      imageUrl={currentDisplayQuestion.imageUrl}
                      imageCaption={currentDisplayQuestion.imageCaption}
                      imagePrompt={currentDisplayQuestion.imagePrompt}
                      alt={currentDisplayQuestion.imageCaption || "Gambar Soal"}
                      imgClassName="w-full max-h-72 object-contain bg-slate-950"
                      enableZoom={true}
                      playClick={playClick}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  {currentDisplayQuestion.options?.map((opt, oIdx) => {
                    const isCorrect = oIdx === currentDisplayQuestion.correctIndex;
                    return (
                      <div
                        key={oIdx}
                        className={`p-4 rounded-2xl border text-sm sm:text-base font-bold flex items-center gap-3 transition-colors ${
                          isCorrect
                            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                            : 'bg-slate-850/80 border-slate-750 text-slate-200'
                        }`}
                      >
                        <span className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-black shadow-inner flex-shrink-0">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {currentDisplayQuestion.explanation && (
                  <div className="bg-slate-850/70 p-5 rounded-2xl border border-slate-750 text-xs sm:text-sm text-slate-300">
                    <strong className="text-amber-300 block mb-1">Penjelasan Guru:</strong>
                    {currentDisplayQuestion.explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ─── MODALS ────────────────────────────────────────────────────────── */}

      {/* Modal Konfirmasi Pindah Soal (Mode Dipandu Guru) */}
      {confirmAdvanceModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full space-y-4 shadow-2xl animate-scale-up">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-inner ${
              confirmAdvanceModal.direction === 'next'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {confirmAdvanceModal.direction === 'next' ? (
                <ArrowRight className="w-6 h-6" />
              ) : (
                <ArrowLeft className="w-6 h-6" />
              )}
            </div>

            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold">
                <span>
                  {confirmAdvanceModal.direction === 'next' ? 'Lanjut ke' : 'Kembali ke'} Soal {confirmAdvanceModal.targetIndex + 1} dari {totalQuestions}
                </span>
              </div>
              
              <h3 className="text-lg font-black text-white">
                {confirmAdvanceModal.direction === 'next'
                  ? 'Buka Soal Berikutnya?'
                  : 'Kembali ke Soal Sebelumnya?'}
              </h3>
              
              <p className="text-xs text-slate-300 leading-relaxed">
                {confirmAdvanceModal.direction === 'next'
                  ? 'Siswa akan menerima hitung mundur 3 detik sebelum soal baru aktif agar memiliki waktu bersiap. Pastikan seluruh siswa sudah siap melanjutkan.'
                  : 'Tampilan di seluruh perangkat siswa akan disinkronkan kembali ke nomor soal ini dengan hitung mundur 3 detik.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (playClick) playClick();
                  setConfirmAdvanceModal(null);
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 font-bold text-xs min-h-[44px] transition-colors btn-press cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAdvance}
                className={`py-2.5 px-4 rounded-xl font-black text-xs text-white min-h-[44px] shadow-md transition-colors btn-press cursor-pointer ${
                  confirmAdvanceModal.direction === 'next'
                    ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-blue-900/40'
                    : 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 shadow-amber-900/40'
                }`}
              >
                {confirmAdvanceModal.direction === 'next' ? 'Ya, Buka Soal' : 'Ya, Kembali ke Soal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Akhiri Sesi */}
      {confirmEndModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full space-y-4 shadow-2xl animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl mx-auto border border-rose-500/30">
              <Square className="w-6 h-6 fill-current" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-white">Akhiri Sesi Kuis Ini?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Setelah diakhiri, siswa tidak dapat lagi mengirim jawaban baru dan ruang sesi akan dikunci. Seluruh rekapan nilai akan otomatis dirangkum ke dalam laporan lengkap.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmEndModal(false)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs min-h-[44px] btn-press cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleEndQuiz}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs min-h-[44px] shadow-lg shadow-rose-950/50 btn-press cursor-pointer"
              >
                Ya, Akhiri & Buat Rekap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Live Reactions Overlay */}
      {session.status !== 'finished' && (
        <div className="no-print">
          <QuizizzReactionOverlay sessionId={session.id} reactions={session.reactions} />
        </div>
      )}

      {/* Popup Notifikasi Obrolan Masuk */}
      <div className="no-print">
        <ZoomChatToast
          sessionId={session.id}
          chatMessages={session.chatMessages}
          position="top-right"
          onOpenChat={handleOpenChatDrawer}
          currentUserName={session.teacherName || 'Guru (Host)'}
        />
      </div>

      {/* Laci Obrolan Interaktif Guru */}
      <div className="no-print">
        <TeacherChatDrawer
          isOpen={isChatDrawerOpen}
          onClose={handleCloseChatDrawer}
          sessionId={session.id}
          teacherName={session.teacherName || 'Guru (Host)'}
          isChatMuted={Boolean(session.isChatMuted || session.settings?.isChatMuted)}
          onToggleChatMute={handleToggleChatMute}
          participantsCount={session.participants?.length || 0}
          playClick={playClick}
        />
      </div>

      {/* Modal Analisis Jawaban Siswa per Butir Soal */}
      {selectedStudentForAnalysis && (
        <div className="no-print">
          <StudentAnswerAnalysisModal
            isOpen={Boolean(selectedStudentForAnalysis)}
            onClose={() => setSelectedStudentForAnalysis(null)}
            participant={selectedStudentForAnalysis}
            quiz={quiz}
          />
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div 
          role="status" 
          aria-live="polite" 
          className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-750 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-scale-up text-xs sm:text-sm font-bold pointer-events-auto no-print"
        >
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
