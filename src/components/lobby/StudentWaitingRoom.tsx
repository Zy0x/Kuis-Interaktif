import React, { useState, useEffect, useRef } from 'react';
import type { Quiz, QuizSession } from '../../types/quiz';
import { DataManager } from '../../lib/supabaseClient';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { ThemeToggle } from '../common/ThemeToggle';
import { QuizizzReactionOverlay } from '../common/QuizizzReactionOverlay';
import { QuizizzReactionButtonRow } from '../common/QuizizzReactionButtonRow';
import { ZoomChatToast } from '../common/ZoomChatToast';
import { 
  ArrowLeft, 
  Sparkles, 
  Users, 
  Send, 
  MessageCircle, 
  VolumeX,
  Volume2,
  CheckCheck
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

const PRESET_QUICK_MESSAGES = [
  'Siap belajar! 🚀',
  'Semangat teman-teman! 💪',
  'Bismillah lancar! 🤲',
  'Kuis seru banget! ⭐',
  'Pasti bisa nilai 100! 🎯',
];

const formatChatTime = (timestamp?: number): string => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

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
  const [chatText, setChatText] = useState('');
  const [isSessionEndedModalOpen, setIsSessionEndedModalOpen] = useState(() => initialSession?.status === 'finished');
  const chatScrollRef = useRef<HTMLDivElement>(null);

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

  const handleSendChatMessage = async (textToSend: string) => {
    if (session.status === 'finished' || isSessionEndedModalOpen) return;
    const clean = textToSend.trim();
    if (!clean) return;
    playClick();
    await DataManager.sendSessionChatMessage(session.id, {
      studentName,
      avatarId,
      text: clean,
    });
    setChatText('');
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const myAvatar = AVATAR_MAP[avatarId] || '🦁';
  const participants = session.participants || [];
  const isChatMuted = Boolean(session.settings?.isChatMuted);
  const chatMessages = session.chatMessages || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between select-none relative overflow-hidden">
      {/* Quizizz-Grade Floating Reactions Overlay */}
      <QuizizzReactionOverlay sessionId={session.id} />

      {/* Top Header */}
      <header className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-8 py-2.5 sm:py-3 sticky top-0 z-30 shadow-sm">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              playClick();
              onBackToHome();
            }}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Keluar Ruang</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>PIN: <strong className="font-mono">{session.pinCode}</strong></span>
            </div>
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-5 flex flex-col gap-5 justify-center">
        
        {/* Banner Status Menunggu Guru */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-pop text-center space-y-4 animate-fade-in relative overflow-hidden">
          {/* Animated Background Pulse Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* User Mascot Avatar Display */}
          <div className="relative inline-block">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-blue-50 dark:bg-blue-900/40 border-2 border-blue-300 dark:border-blue-700 flex items-center justify-center text-4xl sm:text-5xl shadow-md animate-bounce">
              {myAvatar}
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs whitespace-nowrap">
              SIAP!
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Kamu Sudah Terdaftar, {studentName}! 🎉
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {quiz.title} • Kelas {quiz.grade} ({quiz.subject})
            </p>
          </div>

          {/* Waiting Status Indicator with Pulse */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-black shadow-xs animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping flex-shrink-0" />
            <span>Menunggu Bapak/Ibu Guru Memulai Kuis di Depan Kelas...</span>
          </div>

          <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto">
            Begitu Guru menekan tombol mulai, layar HP-mu akan otomatis menyajikan soal pertama secara serentak.
          </p>

          {/* Floating Reaction Bar Ala Quizizz */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <QuizizzReactionButtonRow
              sessionId={session.id}
              senderName={studentName}
              avatarId={avatarId}
              isTeacher={false}
              playClick={playClick}
              title="Kirim Reaksi Semangat:"
            />
          </div>
        </div>

        {/* 2-Columns: Teman Sekelas & Live Chat */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Kolom Kiri: Teman Sekelas yang Sudah Join */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col h-[460px] sm:h-[500px] md:h-[540px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Teman yang Sudah Masuk</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs">
                {participants.length} Siswa
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1">
              {participants.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Belum ada peserta lain yang masuk...</p>
              ) : (
                participants.map((p) => {
                  const pAvatar = AVATAR_MAP[p.avatarId] || '⭐';
                  const isMe = p.name.trim().toLowerCase() === studentName.trim().toLowerCase();
                  return (
                    <div
                      key={p.id}
                      className={`p-2 rounded-xl flex items-center gap-2.5 border transition-all ${
                        isMe
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-800'
                      }`}
                    >
                      <span className="text-xl select-none">{pAvatar}</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex-1">
                        {p.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded-md">
                          Kamu
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Kolom Kanan: Obrolan Kelas Positif */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col h-[460px] sm:h-[500px] md:h-[540px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-purple-500" />
                <span>Obrolan Kelas</span>
              </span>
              {isChatMuted ? (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                  <VolumeX className="w-3 h-3" />
                  <span>Dibungkam Guru</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  <Volume2 className="w-3 h-3" />
                  <span>Terpantau Guru</span>
                </span>
              )}
            </div>

            {/* Message List */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-3 py-2.5 px-1 text-xs">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500 space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shadow-2xs">
                    💬
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Belum ada pesan</p>
                  <p className="text-[11px] max-w-xs leading-relaxed">
                    Kirim salam atau kata semangat untuk teman-teman dan guru!
                  </p>
                </div>
              ) : (
                chatMessages.map((m) => {
                  const mAvatar = AVATAR_MAP[m.avatarId] || (m.isTeacher ? '👨‍🏫' : '💬');
                  const isTeacher = Boolean(m.isTeacher);
                  const isMe = !isTeacher && m.studentName.trim().toLowerCase() === studentName.trim().toLowerCase();
                  const timeStr = formatChatTime(m.createdAt);

                  // 1. KATEGORI: GURU (Autoritatif, Berkelas, Spotlight Emas / Amber)
                  if (isTeacher) {
                    return (
                      <div key={m.id} className="flex flex-col items-start w-full my-1 animate-fade-in">
                        <div className="flex items-start gap-2 max-w-[92%] sm:max-w-[86%] mr-auto">
                          {/* Avatar Guru dengan Badge Mahkota */}
                          <div className="relative flex-shrink-0 mt-0.5 select-none">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center text-sm shadow-xs border border-amber-300">
                              {mAvatar}
                            </div>
                            <span className="absolute -top-1.5 -right-1.5 text-[11px] leading-none select-none filter drop-shadow">
                              👑
                            </span>
                          </div>

                          {/* Bubble Pesan Guru */}
                          <div className="bg-gradient-to-br from-amber-50 via-amber-50/90 to-orange-50/40 dark:from-amber-950/60 dark:via-amber-950/40 dark:to-slate-900 border border-amber-300/90 dark:border-amber-700/80 border-l-4 border-l-amber-500 rounded-2xl rounded-tl-xs p-3 shadow-xs text-amber-950 dark:text-amber-100 flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5 mb-1 pb-1 border-b border-amber-200/70 dark:border-amber-800/60">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-black text-xs text-amber-950 dark:text-amber-200 truncate">
                                  {m.studentName}
                                </span>
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-2xs flex items-center gap-0.5 flex-shrink-0">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>Guru</span>
                                </span>
                              </div>
                            </div>
                            <p className="text-xs font-semibold leading-relaxed break-words whitespace-pre-wrap text-amber-950 dark:text-amber-100">
                              {m.text}
                            </p>
                            <div className="flex items-center justify-between text-[9.5px] text-amber-700/80 dark:text-amber-400/80 mt-1.5 pt-0.5">
                              <span className="font-bold flex items-center gap-1 opacity-80 text-[9px]">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Pesan Guru</span>
                              </span>
                              {timeStr && <span>{timeStr}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 2. KATEGORI: DIRI SENDIRI / "KAMU" (Rata Kanan, Modern Gradient Bubble)
                  if (isMe) {
                    return (
                      <div key={m.id} className="flex flex-col items-end w-full my-1 animate-fade-in">
                        <div className="flex items-end justify-end gap-1.5 max-w-[85%] sm:max-w-[78%] ml-auto">
                          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-600 dark:to-indigo-500 text-white rounded-2xl rounded-tr-xs p-3 shadow-sm flex-1 min-w-0">
                            <div className="flex items-center justify-end gap-1.5 mb-1 text-[10px] font-bold text-purple-200/90">
                              <span className="bg-purple-700/70 dark:bg-purple-800/70 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider text-purple-100">
                                Kamu
                              </span>
                              <span>{mAvatar}</span>
                            </div>
                            <p className="text-xs font-normal leading-relaxed break-words whitespace-pre-wrap text-white">
                              {m.text}
                            </p>
                            <div className="flex items-center justify-end gap-1 text-[9.5px] text-purple-200/80 mt-1.5">
                              {timeStr && <span>{timeStr}</span>}
                              <CheckCheck className="w-3 h-3 text-purple-200/90" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 3. KATEGORI: ORANG LAIN / TEMAN SEKELAS (Rata Kiri, Soft Neutral Bubble + Avatar Siswa)
                  return (
                    <div key={m.id} className="flex flex-col items-start w-full my-1 animate-fade-in">
                      <div className="flex items-start justify-start gap-2 max-w-[85%] sm:max-w-[78%] mr-auto">
                        {/* Avatar Teman */}
                        <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm shadow-2xs flex-shrink-0 select-none mt-0.5">
                          {mAvatar}
                        </div>

                        {/* Bubble Teman */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs rounded-2xl rounded-tl-xs p-3 text-slate-800 dark:text-slate-100 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-black text-[11px] text-indigo-600 dark:text-indigo-400 truncate">
                              {m.studentName}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400">
                              Teman
                            </span>
                          </div>
                          <p className="text-xs font-normal leading-relaxed break-words whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                            {m.text}
                          </p>
                          {timeStr && (
                            <div className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-1.5 text-right">
                              {timeStr}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Chips & Chat Input */}
            {!isChatMuted && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {PRESET_QUICK_MESSAGES.map((msg) => (
                    <button
                      key={msg}
                      type="button"
                      onClick={() => handleSendChatMessage(msg)}
                      className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 whitespace-nowrap min-h-[44px] flex items-center justify-center btn-press"
                    >
                      {msg}
                    </button>
                  ))}
                </div>

                {/* Input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChatMessage(chatText);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    maxLength={100}
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="Ketik pesan positif..."
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-900 dark:text-white min-h-[44px]"
                  />
                  <button
                    type="submit"
                    disabled={!chatText.trim()}
                    className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors btn-press flex-shrink-0"
                    aria-label="Kirim Pesan"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full py-2.5 text-center text-[11px] text-slate-400 dark:text-slate-500">
        Kuis Interaktif • Ruang Tunggu Terpadu
      </footer>

      {/* Popup Chat Masuk Ala Zoom */}
      <ZoomChatToast
        sessionId={session.id}
        onOpenChat={() => {
          if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
          }
        }}
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
