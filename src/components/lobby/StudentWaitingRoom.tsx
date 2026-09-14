import React, { useState, useEffect, useRef } from 'react';
import type { Quiz, QuizSession } from '../../types/quiz';
import { DataManager } from '../../lib/supabaseClient';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { ThemeToggle } from '../common/ThemeToggle';
import { QuizizzReactionOverlay } from '../common/QuizizzReactionOverlay';
import { QuizizzReactionButtonRow } from '../common/QuizizzReactionButtonRow';
import { ZoomChatToast } from '../common/ZoomChatToast';
import { StudentChatDrawer } from '../chat/StudentChatDrawer';
import { 
  ArrowLeft, 
  Sparkles, 
  Users, 
  MessageCircle, 
  VolumeX,
  Radio,
  Smile
} from 'lucide-react';

export interface StudentWaitingRoomProps {
  quiz: Quiz;
  session: QuizSession;
  studentName: string;
  avatarId: string;
  onStartQuiz: () => void;
  onBackToHome: () => void;
  playClick: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const StudentWaitingRoom: React.FC<StudentWaitingRoomProps> = ({
  quiz,
  session: initialSession,
  studentName,
  avatarId,
  onStartQuiz,
  onBackToHome,
  playClick,
  isDark = false,
  onToggleTheme = () => {},
}) => {
  const [session, setSession] = useState<QuizSession>(initialSession);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isSessionEndedModalOpen, setIsSessionEndedModalOpen] = useState(() => initialSession?.status === 'finished');
  
  const lastSeenChatCountRef = useRef(initialSession?.chatMessages?.length || 0);

  // Pantau jika status sesi berubah menjadi finished
  useEffect(() => {
    if (session.status === 'finished') {
      setIsSessionEndedModalOpen(true);
      try {
        sessionStorage.removeItem(`kuis_student_waiting_quiz_${quiz.id}`);
        if (quiz.pinCode) sessionStorage.removeItem(`kuis_student_waiting_pin_${quiz.pinCode}`);
        if (session.id) sessionStorage.removeItem(`kuis_student_waiting_${session.id}`);
      } catch {}
    }
  }, [session.status, quiz.id, quiz.pinCode, session.id]);

  // Sync session in real time
  useEffect(() => {
    const handleSync = (updated: QuizSession) => {
      if (updated.id === session.id || updated.pinCode === session.pinCode) {
        setSession(updated);
        // If teacher started quiz, transition to arena!
        if (updated.status === 'active') {
          onStartQuiz();
        } else if (updated.status === 'finished') {
          setIsSessionEndedModalOpen(true);
        }
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('kuis_realtime_session_sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'SESSION_UPDATED' && event.data.session) {
            handleSync(event.data.session);
          }
        };
      }
    } catch {}

    const handleCustom = (e: Event) => {
      const evt = e as CustomEvent;
      if (evt.detail?.session) {
        handleSync(evt.detail.session);
      }
    };
    window.addEventListener('kuis_session_updated', handleCustom);

    // Langganan WebSocket Realtime Supabase agar transisi ke arena langsung instan
    const unsubRealtime = DataManager.subscribeToQuizSession(session.id, (fresh) => {
      handleSync(fresh);
    });

    // Polling fallback every 2 seconds (local + cloud sync)
    const interval = setInterval(async () => {
      const fresh = DataManager.getActiveSessionById(session.id);
      if (fresh) {
        handleSync(fresh);
      }
      try {
        const cloudFresh = await DataManager.fetchActiveSessionById(session.id);
        if (cloudFresh) {
          handleSync(cloudFresh);
        }
      } catch {}
    }, 2000);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('kuis_session_updated', handleCustom);
      clearInterval(interval);
      unsubRealtime();
    };
  }, [session.id, session.pinCode, onStartQuiz]);

  // Hitung pesan belum dibaca untuk Floating Chat Button
  useEffect(() => {
    const currentCount = session.chatMessages?.length || 0;
    if (isChatDrawerOpen) {
      lastSeenChatCountRef.current = currentCount;
      setUnreadChatCount(0);
    } else {
      const diff = currentCount - lastSeenChatCountRef.current;
      setUnreadChatCount(diff > 0 ? diff : 0);
    }
  }, [session.chatMessages, isChatDrawerOpen]);

  const handleOpenChatDrawer = () => {
    playClick();
    setIsChatDrawerOpen(true);
    lastSeenChatCountRef.current = session.chatMessages?.length || 0;
    setUnreadChatCount(0);
  };

  const handleCloseChatDrawer = () => {
    playClick();
    setIsChatDrawerOpen(false);
    lastSeenChatCountRef.current = session.chatMessages?.length || 0;
    setUnreadChatCount(0);
  };

  const myAvatar = AVATAR_MAP[avatarId] || '🦁';
  const participants = session.participants || [];
  const isChatMuted = Boolean(session.settings?.isChatMuted);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between select-none relative overflow-x-hidden">
      {/* Quizizz-Grade Floating Reactions Overlay */}
      <QuizizzReactionOverlay sessionId={session.id} reactions={session.reactions} />

      {/* Top Header - Fluid Max-W 2000px */}
      <header className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 md:px-8 lg:px-12 py-2.5 sm:py-3 sticky top-0 z-30 shadow-sm">
        <div className="w-full max-w-[2000px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                playClick();
                onBackToHome();
              }}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] shrink-0"
              aria-label="Keluar Ruang"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">Keluar Ruang</span>
              <span className="xs:hidden">Keluar</span>
            </button>

            {/* Breadcrumb Info on Tablet / Desktop */}
            <div className="hidden sm:flex items-center gap-2 min-w-0 pl-1 border-l border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px] md:max-w-xs lg:max-w-md">
                {quiz.title}
              </span>
              <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shrink-0">
                Ruang Tunggu Kelas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="px-2.5 sm:px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold uppercase hidden xs:inline">PIN:</span>
              <strong className="font-mono tracking-wider font-black text-blue-900 dark:text-blue-100">{session.pinCode}</strong>
            </div>
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          </div>
        </div>
      </header>

      {/* Main Content Area - Full Responsive from Mobile-S to 4K Ultra-Wide */}
      <main className="flex-1 w-full max-w-[2000px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 py-3.5 sm:py-6 flex flex-col gap-4 sm:gap-6 justify-start">
        
        {/* Banner Status Menunggu Guru - Responsive Hero Layout */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-200/90 dark:border-slate-800 shadow-pop animate-fade-in relative overflow-hidden">
          {/* Animated Background Pulse Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 lg:gap-8">
            {/* Left Wing: User Mascot Avatar & Greeting */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-5 text-center sm:text-left">
              {/* User Mascot Avatar Display */}
              <div className="relative shrink-0 select-none">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-22 lg:h-22 rounded-3xl bg-blue-50 dark:bg-blue-900/40 border-2 border-blue-300 dark:border-blue-700 flex items-center justify-center text-3xl sm:text-4xl lg:text-5xl shadow-md animate-bounce">
                  {myAvatar}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs whitespace-nowrap">
                  SIAP!
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  Kamu Sudah Terdaftar, {studentName}! 🎉
                </h1>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 flex-wrap text-xs">
                  <span className="px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold">
                    {quiz.title}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    Kelas {quiz.grade}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold">
                    {quiz.subject}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Wing: Waiting Status Badge & Reactions Row */}
            <div className="flex flex-col items-center lg:items-end gap-2.5 sm:gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
              {/* Waiting Status Indicator with Pulse */}
              <div className="inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-black shadow-xs animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                <span>Menunggu Bapak/Ibu Guru Memulai Kuis di Depan Kelas...</span>
              </div>

              <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 text-center lg:text-right max-w-md">
                Layar perangkatmu akan otomatis menyajikan soal pertama secara serentak begitu Guru menekan tombol mulai.
              </p>

              {/* Floating Reaction Bar Ala Quizizz */}
              <div className="w-full lg:w-auto flex justify-center lg:justify-end">
                <QuizizzReactionButtonRow
                  sessionId={session.id}
                  senderName={studentName}
                  avatarId={avatarId}
                  isTeacher={false}
                  playClick={playClick}
                  compact={true}
                  title="Kirim Reaksi Semangat:"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Galeri Teman Sekelas (Showcase Arena) - Lebar Penuh, Rapi, & Responsif */}
        <section 
          aria-labelledby="participants-heading"
          className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col flex-1 min-h-[380px] sm:min-h-[440px]"
        >
          {/* Header Galeri */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 shadow-2xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 id="participants-heading" className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  Teman Sekelas yang Sudah Bergabung
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Semua peserta yang terhubung di ruang tunggu ini akan bersaing secara sehat
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>{participants.length} Siswa</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                <span className="hidden xs:inline">Ruang Aktif</span>
              </span>
            </div>
          </div>

          {/* Grid Peserta */}
          <div className="flex-1 py-4">
            {participants.length === 0 ? (
              <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-3xl shadow-xs">
                  <Smile className="w-8 h-8 text-slate-400 opacity-60" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada teman lain yang masuk</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ajak teman sekelasmu untuk memasukkan PIN <strong className="font-mono text-blue-600 dark:text-blue-400 font-black">{session.pinCode}</strong> di perangkat mereka!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-3 sm:gap-4">
                {participants.map((p) => {
                  const pAvatar = AVATAR_MAP[p.avatarId] || '⭐';
                  const isMe = p.name.trim().toLowerCase() === studentName.trim().toLowerCase();
                  return (
                    <div
                      key={p.id}
                      className={`relative p-3 sm:p-3.5 rounded-2xl flex flex-col items-center text-center gap-2 border transition-all duration-200 hover:-translate-y-0.5 shadow-2xs ${
                        isMe
                          ? 'bg-gradient-to-b from-blue-50/90 to-indigo-50/50 dark:from-blue-950/60 dark:to-slate-900 border-blue-300 dark:border-blue-700 ring-2 ring-blue-400/40 shadow-blue-500/10'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800'
                      }`}
                    >
                      {/* Badge "Kamu" jika profil diri sendiri */}
                      {isMe && (
                        <span className="absolute -top-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                          Kamu
                        </span>
                      )}

                      {/* Avatar Peserta */}
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-sm select-none border ${
                        isMe 
                          ? 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800' 
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700'
                      }`}>
                        {pAvatar}
                      </div>

                      {/* Informasi Nama Siswa */}
                      <div className="w-full min-w-0">
                        <span 
                          className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate block px-1"
                          title={p.name}
                        >
                          {p.name}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <span>Tersambung</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Floating Action Button (FAB) Obrolan Kelas - Pojok Kanan Bawah */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center group">
        {/* Tooltip Pill on Tablet / Desktop */}
        <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-xl bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-bold shadow-xl backdrop-blur-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          <MessageCircle className="w-3.5 h-3.5 text-purple-400 dark:text-purple-600" />
          <span>Obrolan Kelas</span>
          {isChatMuted && <span className="text-rose-400 dark:text-rose-600 text-[10px]">(Dibungkam)</span>}
        </span>

        {/* Main Floating Action Button */}
        <button
          type="button"
          onClick={handleOpenChatDrawer}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white shadow-2xl shadow-purple-500/30 flex items-center justify-center btn-press hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/30 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-purple-400/50"
          aria-label="Buka Obrolan Kelas"
          title="Buka Obrolan Kelas"
        >
          {isChatMuted ? (
            <VolumeX className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300" />
          ) : (
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
          )}

          {/* Unread Counter Badge */}
          {unreadChatCount > 0 && !isChatDrawerOpen && (
            <span className="absolute -top-1 -right-1 px-1.5 min-w-[22px] h-[22px] bg-rose-500 text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md animate-bounce">
              {unreadChatCount > 99 ? '99+' : unreadChatCount}
            </span>
          )}
        </button>
      </div>

      {/* Slide-Over Side Panel (Drawer) Obrolan Siswa */}
      <StudentChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={handleCloseChatDrawer}
        sessionId={session.id}
        studentName={studentName}
        avatarId={avatarId}
        isChatMuted={isChatMuted}
        sessionStatus={session.status}
        isSessionEndedModalOpen={isSessionEndedModalOpen}
        playClick={playClick}
      />

      {/* Footer */}
      <footer className="w-full py-2.5 text-center text-[11px] text-slate-400 dark:text-slate-500">
        Kuis Interaktif • Ruang Tunggu Terpadu
      </footer>

      {/* Popup Chat Masuk Ala Zoom */}
      <ZoomChatToast
        sessionId={session.id}
        onOpenChat={handleOpenChatDrawer}
        currentUserName={studentName}
      />

      {/* Modal Sesi Berakhir (Rule 1 & Rule 8: Elegan & Touch-First, Pengganti window.alert) */}
      {isSessionEndedModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-ended-title"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-backdrop-fade" />
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 animate-scale-in">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-2xl shadow-xs">
              🔔
            </div>
            <div className="space-y-1.5">
              <h4 id="session-ended-title" className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Sesi Kuis Berakhir
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Sesi kuis telah diakhiri atau ditutup oleh Guru. Terima kasih telah bergabung!
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                playClick();
                setIsSessionEndedModalOpen(false);
                try {
                  sessionStorage.removeItem(`kuis_student_waiting_quiz_${quiz.id}`);
                  if (quiz.pinCode) sessionStorage.removeItem(`kuis_student_waiting_pin_${quiz.pinCode}`);
                  if (session.id) sessionStorage.removeItem(`kuis_student_waiting_${session.id}`);
                } catch {}
                onBackToHome();
              }}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 min-h-[48px] shadow-sm flex items-center justify-center gap-2 transition-colors btn-press"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
