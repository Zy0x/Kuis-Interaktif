import React, { useState, useEffect, useMemo } from 'react';
import type { Quiz, QuizSession } from '../../types/quiz';
import { DataManager } from '../../lib/supabaseClient';
import { copyTextToClipboard } from '../../lib/aiQuestionParser';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { QuizizzReactionOverlay } from '../common/QuizizzReactionOverlay';
import { QuizizzReactionButtonRow } from '../common/QuizizzReactionButtonRow';
import { ZoomChatToast } from '../common/ZoomChatToast';
import { TeacherChatDrawer } from '../chat/TeacherChatDrawer';
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
  Clock
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'matrix' | 'display'>('leaderboard');
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [confirmEndModal, setConfirmEndModal] = useState(false);
  const [currentDisplayQuestionIdx, setCurrentDisplayQuestionIdx] = useState(0);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [confirmAdvanceModal, setConfirmAdvanceModal] = useState<{
    targetIndex: number;
    direction: 'next' | 'prev';
  } | null>(null);
  const [hostCountdownSec, setHostCountdownSec] = useState<number | null>(null);

  // Hitung status pesan obrolan kelas yang sudah dibaca guru (Rule 1, Rule 2 & User Request)
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
      // Jika histori pesan berkurang / di-reset
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
    // Aktifkan indikator hitung mundur 3 detik di bar kontrol guru
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
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    playClick();
    const url = `${window.location.origin}${window.location.pathname}?pin=${session.pinCode}`;
    const success = await copyTextToClipboard(url);
    if (success) {
      setCopiedLink(true);
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
      }
    } finally {
      setIsSimulating(false);
    }
  };

  // Total questions count
  const totalQuestions = quiz.questions?.length || session.totalQuestions || 1;

  // Sorted participants by score descending
  const sortedParticipants = useMemo(() => {
    const getPScore = (p: any) => {
      const pAnsList = p.answers ? Object.values(p.answers).filter((a: any) => a && typeof a.questionIndex === 'number') : [];
      if (pAnsList.length > 0) {
        const correct = pAnsList.filter((a: any) => a.isCorrect).length;
        return Math.round((correct / totalQuestions) * 100);
      }
      return p.score;
    };
    return [...session.participants].sort((a, b) => {
      const aScore = getPScore(a);
      const bScore = getPScore(b);
      if (bScore !== aScore) return bScore - aScore;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
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
      const pAnsList = p.answers ? Object.values(p.answers).filter((a) => a && typeof a.questionIndex === 'number') : [];
      const accurateScore = pAnsList.length > 0
        ? Math.round((pAnsList.filter((a) => a.isCorrect).length / totalQuestions) * 100)
        : p.score;
      totalScore += accurateScore;
      if (p.finished) finishedCount++;

      Object.values(p.answers || {}).forEach((ans) => {
        if (ans.questionIndex >= 0 && ans.questionIndex < totalQuestions) {
          questionAnsweredCounts[ans.questionIndex]++;
          if (ans.isCorrect) {
            questionCorrectCounts[ans.questionIndex]++;
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
  }, [session.participants, totalQuestions]);

  const currentDisplayQuestion = quiz.questions[currentDisplayQuestionIdx];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none animate-fade-in font-sans">
      {/* Top Wayground Host Bar */}
      <header className="w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 sticky top-0 z-30 shadow-xl">
        <div className="w-full max-w-[2000px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 md:gap-4">
          
          {/* Baris 1 di Mobile / Bagian Kiri di Desktop */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0 w-full md:w-auto">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 md:flex-initial">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onBack();
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                title="Kembali ke Dashboard"
                aria-label="Kembali ke Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] sm:text-xs font-black tracking-wider uppercase flex-shrink-0">
                    {session.status === 'active' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <span>SESI LIVE AKTIF</span>
                      </>
                    ) : session.status === 'paused' ? (
                      <>
                        <Pause className="w-2.5 h-2.5 text-amber-400" />
                        <span className="text-amber-300">DIJEDA</span>
                      </>
                    ) : session.status === 'waiting' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-amber-300">RUANG TUNGGU</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                        <span className="text-emerald-300">SELESAI</span>
                      </>
                    )}
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">|</span>
                  <span className="text-xs text-slate-300 font-semibold truncate hidden sm:inline max-w-[220px]">
                    {quiz.title}
                  </span>

                  {/* Session Settings Badges (Desktop) */}
                  {session.settings?.mode === 'untimed' && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold hidden md:inline-flex items-center gap-1">
                      <span>🧘</span>
                      <span>Santai (Bebas Waktu)</span>
                    </span>
                  )}
                  {session.settings?.showAnswersMode === 'exam_strict' && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 text-[10px] font-bold hidden md:inline-flex items-center gap-1">
                      <span>🔒</span>
                      <span>Kunci Dirahasiakan</span>
                    </span>
                  )}
                  {session.settings?.tabSwitchDetection && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500/50 text-rose-300 text-[10px] font-bold hidden md:inline-flex items-center gap-1">
                      <span>👁️</span>
                      <span>Anti-Mencontek</span>
                    </span>
                  )}
                </div>
                <h1 className="text-xs sm:text-base font-black text-white truncate max-w-[190px] sm:max-w-md">
                  Ruang Kendali Host
                </h1>
              </div>
            </div>

            {/* Tombol Darurat/Aksi Utama di Mobile (Pojok Kanan Baris 1) */}
            <div className="flex items-center gap-1.5 flex-shrink-0 md:hidden">
              {/* Pause / Resume Button (Mobile) */}
              {session.status !== 'finished' && (
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                  title={session.status === 'paused' ? 'Lanjutkan Kuis' : 'Jeda Kuis'}
                >
                  {session.status === 'paused' ? (
                    <Play className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Pause className="w-4 h-4 text-amber-400" />
                  )}
                </button>
              )}

              {/* End Session Button or View Recap (Mobile) */}
              {session.status !== 'finished' ? (
                <button
                  type="button"
                  onClick={() => setConfirmEndModal(true)}
                  className="px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold min-h-[44px] flex items-center gap-1 shadow-md shadow-rose-950/40 transition-colors"
                  title="Akhiri Kuis"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span className="text-[11px]">Akhiri</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onViewRecap(session)}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold min-h-[44px] flex items-center gap-1.5 shadow-md transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Rekapan</span>
                </button>
              )}
            </div>
          </div>

          {/* Baris 2 di Mobile / Bagian Kanan di Desktop */}
          <div className="flex items-center justify-between md:justify-end gap-1.5 sm:gap-2 w-full md:w-auto pt-2 md:pt-0 border-t border-slate-800/80 md:border-t-0">
            {/* PIN Badge Ringkas & Rapi */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-2.5 sm:px-3 py-1.5 rounded-xl shadow-xs flex-shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">PIN:</span>
              <span className="font-mono font-black text-amber-300 tracking-wider text-sm sm:text-base">
                {session.pinCode}
              </span>
              <button
                type="button"
                onClick={handleCopyPin}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center btn-press"
                title="Salin PIN Ruang"
                aria-label="Salin PIN Ruang"
              >
                {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>

            {/* Toolbar Kontrol Host */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Tombol Buka Ruang Chat Kelas Guru */}
              {session.status !== 'finished' && (
                <button
                  type="button"
                  onClick={handleOpenChatDrawer}
                  className={`relative p-2.5 sm:px-3 py-2 rounded-xl border text-xs font-bold min-h-[44px] flex items-center gap-1.5 transition-colors ${
                    session.isChatMuted || session.settings?.isChatMuted
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                      : 'border-blue-500/40 bg-blue-600/20 hover:bg-blue-600/30 text-blue-200'
                  }`}
                  title="Buka Ruang Obrolan Kelas"
                  aria-label="Buka Ruang Obrolan Kelas"
                >
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="hidden md:inline">Chat Kelas</span>
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
                  className={`p-2 sm:px-2.5 py-2 rounded-xl border text-xs font-bold min-h-[44px] flex items-center gap-1.5 transition-colors ${
                    session.isChatMuted || session.settings?.isChatMuted
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={session.isChatMuted || session.settings?.isChatMuted ? 'Buka Kunci Obrolan Siswa' : 'Bungkam Obrolan Siswa'}
                  aria-label={session.isChatMuted || session.settings?.isChatMuted ? 'Buka Kunci Obrolan Siswa' : 'Bungkam Obrolan Siswa'}
                >
                  {session.isChatMuted || session.settings?.isChatMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  <span className="hidden xl:inline">{session.isChatMuted || session.settings?.isChatMuted ? 'Terkunci' : 'Chat Aktif'}</span>
                </button>
              )}

              {/* Simulation student button */}
              <button
                type="button"
                onClick={handleSimulateStudents}
                disabled={isSimulating || session.status === 'finished'}
                className="p-2 sm:px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold min-h-[44px] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Simulasi 3 Murid Bergabung (Uji Coba Kelas)"
                aria-label="Simulasi 3 Murid Bergabung"
              >
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span className="hidden lg:inline">+3 Siswa Tes</span>
              </button>

              {/* Desktop-only: Pause & End Session */}
              <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
                {session.status !== 'finished' && (
                  <button
                    type="button"
                    onClick={handleTogglePause}
                    className="p-2 sm:px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 transition-colors"
                    title={session.status === 'paused' ? 'Lanjutkan Kuis' : 'Jeda Kuis'}
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

                {session.status !== 'finished' ? (
                  <button
                    type="button"
                    onClick={() => setConfirmEndModal(true)}
                    className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold min-h-[44px] flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition-colors"
                    title="Akhiri Kuis & Buka Rekapan Nilai"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline">Akhiri Kuis</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onViewRecap(session)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold min-h-[44px] flex items-center gap-1.5 shadow-md transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Buka Rekapan</span>
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Metric Quick Strip */}
      <section className="bg-slate-900 border-b border-slate-800 px-3 sm:px-6 lg:px-8 py-2.5">
        <div className="w-full max-w-[2000px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs">
          {session.status === 'waiting' ? (
            <>
              {/* Kartu 1: Siswa Terhubung */}
              <div className="bg-slate-800/60 rounded-xl p-2.5 flex items-center gap-2.5 border border-slate-700/50">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Siswa Terhubung</div>
                  <div className="text-sm sm:text-base font-black text-white">
                    {session.participants.length} <span className="text-xs font-normal text-slate-400">anak</span>
                  </div>
                </div>
              </div>

              {/* Kartu 2: Status Sesi */}
              <div className="bg-slate-800/60 rounded-xl p-2.5 flex items-center gap-2.5 border border-slate-700/50">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Status Ruang</div>
                  <div className="text-sm sm:text-base font-black text-amber-300">
                    Ruang Tunggu Siap
                  </div>
                </div>
              </div>

              {/* Kartu 3: Total Soal */}
              <div className="bg-slate-800/60 rounded-xl p-2.5 flex items-center gap-2.5 border border-slate-700/50">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Total Soal Kuis</div>
                  <div className="text-sm sm:text-base font-black text-indigo-300">
                    {quiz.questions.length} <span className="text-xs font-normal text-slate-400">butir</span>
                  </div>
                </div>
              </div>

              {/* Kartu 4: Format Sesi */}
              <div className="bg-slate-800/60 rounded-xl p-2.5 flex items-center gap-2.5 border border-slate-700/50">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Format Sesi</div>
                  <div className="text-sm sm:text-base font-black text-purple-300">
                    {isTeacherLed ? 'Dipandu Guru' : 'Mandiri'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-800/60 rounded-xl p-2.5 flex items-center gap-2.5 border border-slate-700/50">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Siswa Terhubung</div>
                  <div className="text-sm sm:text-base font-black text-white">
                    {session.participants.length} <span className="text-xs font-normal text-slate-400">anak</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-2.5 flex items-center gap-2.5 border border-slate-700/50">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Akurasi Kelas</div>
                  <div className="text-sm sm:text-base font-black text-emerald-400">
                    {classStats.accuracy}%
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-2.5 flex items-center gap-2.5 border border-slate-700/50">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Rata-rata Skor</div>
                  <div className="text-sm sm:text-base font-black text-amber-300">
                    {classStats.avgScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-2.5 flex items-center gap-2.5 border border-slate-700/50">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Selesai Mengerjakan</div>
                  <div className="text-sm sm:text-base font-black text-purple-300">
                    {classStats.finishedCount} / {session.participants.length}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Main Sub-tabs Selector */}
      <nav className="bg-slate-900/60 px-3 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="w-full max-w-[2000px] mx-auto flex items-center gap-2 overflow-x-auto py-2 no-scrollbar scrollbar-none">
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('leaderboard');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] whitespace-nowrap ${
              activeTab === 'leaderboard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Leaderboard Siswa ({session.participants.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('matrix');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Matriks Akurasi Soal ({totalQuestions})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('display');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all min-h-[44px] whitespace-nowrap ${
              activeTab === 'display'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Layar Bersama / Soal Aktif</span>
          </button>
        </div>
      </nav>

      {/* Tab Body Content */}
      <main className="flex-1 w-full max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-8 py-5">
        
        {/* TAB 1: LEADERBOARD LIVE */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            {/* Teacher Led: Waiting Room Hero Status & PIN Centerpiece */}
            {session.status === 'waiting' && (
              <div className="bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
                <div className="flex flex-col xl:flex-row items-center justify-between gap-5">
                  
                  {/* Kiri: Status Ruang Tunggu & Keterangan */}
                  <div className="flex items-center gap-4 w-full xl:w-auto">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-3xl animate-pulse flex-shrink-0 shadow-inner">
                      ⏳
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base sm:text-lg font-black text-white tracking-wide">
                          Ruang Tunggu Kelas Terbuka
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black text-xs flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>{session.participants.length} Siswa Terhubung</span>
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Minta siswa membuka aplikasi dan memasukkan PIN di bawah, atau bagikan tautan kuis langsung:
                      </p>
                    </div>
                  </div>

                  {/* Tengah: Box PIN Ruang Kelas yang Sangat Jelas & Konsisten */}
                  <div className="flex items-center gap-3 bg-slate-950/90 border-2 border-amber-400/60 rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 shadow-lg shadow-amber-500/10 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                    <div>
                      <div className="text-[10px] uppercase font-black text-amber-400/90 tracking-widest flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>PIN Ruang Kelas</span>
                      </div>
                      <div className="font-mono text-2xl sm:text-3xl font-black text-amber-300 tracking-widest select-all">
                        {session.pinCode}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
                      <button
                        type="button"
                        onClick={handleCopyPin}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 min-h-[44px] btn-press"
                        title="Salin PIN"
                      >
                        {copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                        <span className="hidden sm:inline">{copiedPin ? 'Tersalin' : 'Salin PIN'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-3 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-blue-500/40 min-h-[44px] btn-press"
                        title="Bagikan Tautan Kuis"
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-blue-400" />}
                        <span className="hidden sm:inline">{copiedLink ? 'Link Tersalin' : 'Tautan'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Kanan: Tombol Hero Mulai Kuis */}
                  {isTeacherLed && (
                    <button
                      type="button"
                      onClick={handleStartQuiz}
                      className="w-full xl:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2.5 transition-all transform active:scale-95 flex-shrink-0 min-h-[48px] btn-press animate-pulse"
                    >
                      <Play className="w-5 h-5 fill-white" />
                      <span>Mulai Kuis Sekarang</span>
                    </button>
                  )}

                </div>
              </div>
            )}

            {/* Teacher Led: Active Question Advance Control Bar */}
            {isTeacherLed && session.status === 'active' && (
              <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-xs font-black tracking-wide">
                    SOAL {(session.currentQuestionIndex ?? 0) + 1} / {totalQuestions}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    Mode: {session.settings?.teacherPacingSubMode === 'timed_next' ? '⏱️ Timer Soal + Kendali Lanjut Guru' : '🎯 Kendali Penuh Guru (Bebas Waktu)'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {hostCountdownSec !== null ? (
                    <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black min-h-[44px] flex items-center gap-2 animate-pulse">
                      <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                      <span>Countdown Siswa: {hostCountdownSec > 0 ? `${hostCountdownSec}s...` : 'Mulai!'}</span>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => promptAdvanceQuestion(Math.max(0, (session.currentQuestionIndex ?? 0) - 1), 'prev')}
                        disabled={(session.currentQuestionIndex ?? 0) === 0}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-bold disabled:opacity-40 min-h-[44px] flex items-center gap-1.5 transition-colors"
                        title="Kembali ke Soal Sebelumnya (dengan konfirmasi)"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Sebelumnya</span>
                      </button>

                      {(session.currentQuestionIndex ?? 0) < totalQuestions - 1 ? (
                        <button
                          type="button"
                          onClick={() => promptAdvanceQuestion((session.currentQuestionIndex ?? 0) + 1, 'next')}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-black min-h-[44px] flex items-center gap-1.5 shadow-md shadow-blue-950/50 transition-colors"
                          title="Buka Soal Berikutnya (dengan konfirmasi & hitung mundur 3s)"
                        >
                          <span>Buka Soal Berikutnya</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmEndModal(true)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black min-h-[44px] flex items-center gap-1.5 shadow-md transition-colors"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Selesaikan Kuis</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Bilah Reaksi Semangat Guru (Aktif di Ruang Tunggu Pra-Kuis maupun Saat Kuis Berlangsung) */}
            {session.status !== 'finished' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:px-5 sm:py-3.5 flex flex-col items-center justify-center gap-2 shadow-lg max-w-xl mx-auto w-full transition-all">
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

            {session.participants.length === 0 ? (
              <div className="bg-slate-900/60 rounded-3xl border border-dashed border-slate-750 p-8 sm:p-10 text-center max-w-lg mx-auto space-y-4 shadow-xl">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-3xl">
                  👥
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-white">
                    Belum Ada Siswa Bergabung
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Siswa yang memasukkan PIN di atas akan langsung muncul di daftar ini secara otomatis.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSimulateStudents}
                    disabled={isSimulating}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-indigo-300 text-xs font-bold inline-flex items-center gap-2 transition-colors min-h-[44px] btn-press disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isSimulating ? 'Memuat Simulasi...' : 'Uji Coba Masukkan 3 Siswa Simulasi'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Peringkat & Nama Siswa</span>
                  <span>Progres Soal & Skor</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {sortedParticipants.map((p, index) => {
                    const isTop3 = index < 3;
                    const rankColor = index === 0 
                      ? 'text-amber-300 border-amber-500/50 bg-amber-500/10' 
                      : index === 1 
                      ? 'text-slate-200 border-slate-400/50 bg-slate-500/10' 
                      : index === 2 
                      ? 'text-amber-600 border-amber-700/50 bg-amber-800/10' 
                      : 'text-slate-400 border-slate-800 bg-slate-900';

                    const avatarEmoji = AVATAR_MAP[p.avatarId] || '🦁';

                    // Hitung nilai dan jumlah benar yang akurat dari riwayat jawaban unik per soal (kebal dari anomali duplikasi reload)
                    const pAnsList = p.answers ? Object.values(p.answers).filter((a: any) => a && typeof a.questionIndex === 'number') : [];
                    const displayCorrectCount = pAnsList.length > 0
                      ? pAnsList.filter((a: any) => a.isCorrect).length
                      : p.correctCount;
                    const displayIncorrectCount = pAnsList.length > 0
                      ? pAnsList.filter((a: any) => !a.isCorrect).length
                      : p.incorrectCount;
                    const displayScore = pAnsList.length > 0
                      ? Math.round((displayCorrectCount / totalQuestions) * 100)
                      : p.score;

                    return (
                      <div
                        key={p.id}
                        className={`p-3 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isTop3 ? 'shadow-md ' + rankColor : 'bg-slate-900/90 border-slate-800'
                        }`}
                      >
                        {/* Left: Rank, Avatar, Name */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl font-black text-sm sm:text-base flex items-center justify-center flex-shrink-0 border ${rankColor}`}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </div>

                          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-800 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-inner">
                            {avatarEmoji}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm sm:text-base text-white truncate max-w-[140px] sm:max-w-xs">
                                {p.name}
                              </span>
                              {p.streak >= 2 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black">
                                  <Flame className="w-3 h-3 text-rose-400 fill-rose-400" />
                                  {p.streak}
                                </span>
                              )}
                              {p.finished && (
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                  Selesai
                                </span>
                              )}
                              {p.tabSwitchCount && p.tabSwitchCount > 0 ? (
                                <span 
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold animate-pulse"
                                  title={`Terdeteksi berpindah tab/layar sebanyak ${p.tabSwitchCount} kali`}
                                >
                                  <span>⚠️</span>
                                  <span>{p.tabSwitchCount}x Tab</span>
                                </span>
                              ) : null}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>Benar: <strong className="text-emerald-400">{displayCorrectCount}</strong></span>
                              <span>•</span>
                              <span>Salah: <strong className="text-rose-400">{displayIncorrectCount}</strong></span>
                              <span>•</span>
                              <span>{Math.round(p.timeSpentSec)} dtk</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Progress bar & Score */}
                        <div className="text-right flex items-center gap-4 flex-shrink-0">
                          <div className="hidden sm:block w-32 lg:w-48 text-left">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                              <span>Progres</span>
                              <span>{p.currentQuestionIndex} / {totalQuestions}</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                                style={{ width: `${Math.min(100, (p.currentQuestionIndex / totalQuestions) * 100)}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="text-base sm:text-xl font-black text-amber-300 leading-none">
                              {displayScore} <span className="text-xs font-normal text-slate-400">pts</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-1">
                              {'⭐'.repeat(p.stars || 1)}
                            </div>
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

        {/* TAB 2: MATRIKS AKURASI SOAL */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Tingkat Keberhasilan Siswa per Butir Soal
                </h3>
                <p className="text-xs text-slate-400">
                  Pantau soal mana yang mudah dipahami dan soal mana yang paling banyak keliru dijawab oleh kelas.
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
                    className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-bold">
                        Soal #{idx + 1}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
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

                    <p className="text-xs sm:text-sm text-slate-200 font-medium line-clamp-2">
                      {q.text}
                    </p>

                    <div className="space-y-1 text-xs">
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
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Dijawab {stat.totalAnswered} siswa</span>
                        <span className="text-emerald-400 font-bold">Kunci: {q.options[q.correctIndex]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: LAYAR BERSAMA / PROYEKTOR */}
        {activeTab === 'display' && (
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="flex items-center justify-between bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white text-xs font-bold">
                  Soal {currentDisplayQuestionIdx + 1} dari {quiz.questions.length}
                </span>
                <span className="text-xs text-slate-400">Tampilan Layar Presentasi</span>
              </div>
              <div className="flex items-center gap-2">
                {isTeacherLed && (
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold border border-indigo-500/30">
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
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-xs font-bold disabled:opacity-40 min-h-[44px] transition-colors"
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
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold disabled:opacity-40 min-h-[44px] transition-colors"
                >
                  Selanjutnya ▶
                </button>
              </div>
            </div>

            {currentDisplayQuestion && (
              <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-2xl">
                <h2 className="text-lg sm:text-2xl font-black text-white text-center leading-snug">
                  {currentDisplayQuestion.text}
                </h2>

                {currentDisplayQuestion.imageUrl && (
                  <div className="max-w-sm mx-auto rounded-2xl overflow-hidden border border-slate-700">
                    <img
                      src={currentDisplayQuestion.imageUrl}
                      alt="Gambar Soal"
                      className="w-full max-h-60 object-contain bg-slate-950"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {currentDisplayQuestion.options.map((opt, oIdx) => {
                    const isCorrect = oIdx === currentDisplayQuestion.correctIndex;
                    return (
                      <div
                        key={oIdx}
                        className={`p-4 rounded-2xl border text-sm sm:text-base font-bold flex items-center gap-3 transition-colors ${
                          isCorrect
                            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                            : 'bg-slate-800/80 border-slate-700 text-slate-200'
                        }`}
                      >
                        <span className="w-7 h-7 rounded-xl bg-slate-700 flex items-center justify-center text-xs font-black">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 text-xs text-slate-300">
                  <strong className="text-amber-300 block mb-1">Penjelasan Guru:</strong>
                  {currentDisplayQuestion.explanation}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Confirmation Modal to Advance / Rewind Question in Teacher-Led Mode */}
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
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 font-bold text-xs min-h-[44px] transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAdvance}
                className={`py-2.5 px-4 rounded-xl font-black text-xs text-white min-h-[44px] shadow-md transition-colors ${
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

      {/* Confirmation Modal to End Session */}
      {confirmEndModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full space-y-4 shadow-2xl animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl mx-auto">
              <Square className="w-6 h-6 fill-current" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-white">Akhiri Sesi Kuis Ini?</h3>
              <p className="text-xs text-slate-400">
                Setelah diakhiri, siswa tidak dapat lagi mengirim jawaban baru dan ruang sesi akan dikunci. Seluruh rekapan nilai akan otomatis dirangkum ke dalam laporan lengkap.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmEndModal(false)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleEndQuiz}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs min-h-[44px]"
              >
                Ya, Akhiri & Buat Rekap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Live Reactions Overlay (Aktif Sepanjang Sesi) */}
      {session.status !== 'finished' && (
        <QuizizzReactionOverlay sessionId={session.id} reactions={session.reactions} />
      )}


      {/* Popup Notifikasi Obrolan Masuk */}
      <ZoomChatToast
        sessionId={session.id}
        chatMessages={session.chatMessages}
        position="top-right"
        onOpenChat={handleOpenChatDrawer}
        currentUserName={session.teacherName || 'Guru (Host)'}
      />

      {/* Laci Obrolan Interaktif Guru (Teacher Chat Drawer) */}
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
  );
};
