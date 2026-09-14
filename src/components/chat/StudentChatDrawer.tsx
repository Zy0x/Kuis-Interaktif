import React, { useState, useEffect, useRef } from 'react';
import type { SessionChatMessage } from '../../types/quiz';
import { DataManager, supabase, getLiveRealtimeChannel } from '../../lib/supabaseClient';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../lib/navigationHistory';
import { 
  X, 
  Send, 
  MessageSquare, 
  VolumeX, 
  Sparkles, 
  CheckCheck
} from 'lucide-react';

interface StudentChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  studentName: string;
  avatarId: string;
  isChatMuted: boolean;
  sessionStatus?: string;
  isSessionEndedModalOpen?: boolean;
  playClick: () => void;
}

const PRESET_QUICK_MESSAGES = [
  'Siap belajar! 🚀',
  'Semangat teman-teman! 💪',
  'Bismillah lancar! 🤲',
  'Kuis seru banget! ⭐',
  'Pasti bisa nilai 100! 🎯',
  'Halo semuanya! 👋',
];

const formatChatTime = (timestamp?: number): string => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const StudentChatDrawer: React.FC<StudentChatDrawerProps> = ({
  isOpen,
  onClose,
  sessionId,
  studentName,
  avatarId,
  isChatMuted,
  sessionStatus = 'waiting',
  isSessionEndedModalOpen = false,
  playClick,
}) => {
  const [messages, setMessages] = useState<SessionChatMessage[]>(() => {
    const session = DataManager.getActiveSessionById(sessionId);
    const raw = session?.chatMessages || [];
    return raw.filter((msg, idx, arr) => {
      if (idx === 0) return true;
      const prev = arr[idx - 1];
      return !(
        prev.studentName === msg.studentName &&
        prev.text === msg.text &&
        Math.abs(msg.createdAt - prev.createdAt) < 1000
      );
    });
  });

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const lastSentRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useBodyScrollLock(isOpen);
  useBackHandler('student-chat-drawer', 70, () => {
    onClose();
    return true;
  }, isOpen);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 60);
  };

  // Sync messages in real-time
  useEffect(() => {
    if (!sessionId) return;

    const refreshMessages = () => {
      const session = DataManager.getActiveSessionById(sessionId);
      if (session && session.chatMessages) {
        const cleanMsgs = session.chatMessages.filter((msg, idx, arr) => {
          if (idx === 0) return true;
          const prev = arr[idx - 1];
          return !(
            prev.studentName === msg.studentName &&
            prev.text === msg.text &&
            Math.abs(msg.createdAt - prev.createdAt) < 1000
          );
        });
        setMessages(cleanMsgs);
        scrollToBottom();
      }
    };

    refreshMessages();

    // Local custom event
    const handleLocalMsg = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.sessionId === sessionId && detail?.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === detail.message.id)) return prev;
          const last = prev[prev.length - 1];
          if (
            last &&
            last.studentName === detail.message.studentName &&
            last.text === detail.message.text &&
            Math.abs(detail.message.createdAt - last.createdAt) < 1000
          ) {
            return prev;
          }
          return [...prev, detail.message];
        });
        scrollToBottom();
      }
    };
    window.addEventListener('session_chat_message', handleLocalMsg);

    // BroadcastChannel sync
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('active_quiz_sessions_sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'SESSION_UPDATED' && event.data?.sessionId === sessionId) {
          refreshMessages();
        }
      };
    } catch {}

    // Realtime broadcast listener lintas perangkat
    if (supabase && sessionId) {
      try {
        const subChannel = getLiveRealtimeChannel(sessionId);
        if (subChannel) {
          subChannel.on('broadcast', { event: 'chat' }, (eventPayload: any) => {
            const payload = eventPayload?.payload;
            if (payload?.sessionId === sessionId && payload?.message) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === payload.message.id)) return prev;
                return [...prev, payload.message];
              });
              scrollToBottom();
            }
          });
        }
      } catch (err) {
        console.warn('StudentChatDrawer realtime chat error:', err);
      }
    }

    // Polling interval 2s fallback
    const interval = setInterval(refreshMessages, 2000);

    return () => {
      window.removeEventListener('session_chat_message', handleLocalMsg);
      if (bc) bc.close();
      clearInterval(interval);
    };
  }, [sessionId]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (sessionStatus === 'finished' || isSessionEndedModalOpen || isChatMuted) return;
    const clean = textToSend.trim();
    if (!clean || sendingRef.current) return;

    const now = Date.now();
    if (lastSentRef.current.text === clean && now - lastSentRef.current.time < 800) {
      return;
    }
    lastSentRef.current = { text: clean, time: now };

    sendingRef.current = true;
    setIsSending(true);
    playClick();

    try {
      const newMsg = await DataManager.sendSessionChatMessage(sessionId, {
        studentName,
        avatarId,
        text: clean,
      });

      if (newMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          const last = prev[prev.length - 1];
          if (
            last &&
            last.studentName === newMsg.studentName &&
            last.text === newMsg.text &&
            Math.abs(newMsg.createdAt - last.createdAt) < 1000
          ) {
            return prev;
          }
          return [...prev, newMsg];
        });
        setInputText('');
        scrollToBottom();
      }
    } catch (err) {
      console.warn('Gagal mengirim pesan chat:', err);
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none overscroll-contain">
      {/* Backdrop with Blur */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => {
          playClick();
          onClose();
        }}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div 
        className="relative z-10 w-full sm:w-[440px] h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-slide-left-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight flex items-center gap-1.5 truncate">
                <span>Obrolan Kelas</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                <span className="text-purple-600 dark:text-purple-400 font-bold">{messages.length} Pesan</span>
                <span>• Terpantau Guru</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                playClick();
                onClose();
              }}
              className="p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Tutup Obrolan"
              title="Tutup Obrolan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Alert Mute jika aktif */}
        {isChatMuted && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-4 py-2.5 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
            <VolumeX className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold flex-1">Chat siswa sedang dibungkam oleh Guru agar kelas fokus.</span>
          </div>
        )}

        {/* Chat Messages Body */}
        <div 
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl shadow-xs">
                💬
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum Ada Obrolan</p>
              <p className="text-xs max-w-xs text-slate-400 dark:text-slate-500">
                Kirim sapaan semangat atau pesan positif kepada teman sekelasmu menggunakan tombol di bawah!
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const mAvatar = (m.avatarId && AVATAR_MAP[m.avatarId]) || (m.isTeacher ? '👨‍🏫' : '🦁');
              const isMe = m.studentName.trim().toLowerCase() === studentName.trim().toLowerCase() && !m.isTeacher;
              const isTeacher = Boolean(m.isTeacher);
              const timeStr = formatChatTime(m.createdAt);

              // 1. KATEGORI: PESAN GURU (Aksen Emas Terhormat, Mahkota)
              if (isTeacher) {
                return (
                  <div key={m.id} className="flex flex-col items-start w-full my-1.5 animate-fade-in">
                    <div className="flex items-start gap-2.5 max-w-[92%] mr-auto">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center text-sm shadow-xs border border-amber-300 shrink-0 select-none mt-0.5">
                        {mAvatar}
                      </div>

                      <div className="bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200/90 dark:border-amber-800/60 rounded-2xl rounded-tl-xs p-3 shadow-2xs flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-black text-xs text-amber-950 dark:text-amber-200 truncate">
                              {m.studentName}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-2xs flex items-center gap-0.5 shrink-0">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Guru</span>
                            </span>
                          </div>
                          {timeStr && (
                            <span className="text-amber-700/70 dark:text-amber-400/70 text-[9.5px] font-semibold shrink-0">
                              {timeStr}
                            </span>
                          )}
                        </div>
                        <p className="leading-relaxed font-medium text-xs text-amber-950 dark:text-amber-100 break-words whitespace-pre-wrap">
                          {m.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              // 2. KATEGORI: PESAN KAMU / SENDIRI (Rata Kanan, Gradien Ungu Modern)
              if (isMe) {
                return (
                  <div key={m.id} className="flex flex-col items-end w-full my-1.5 animate-fade-in">
                    <div className="flex items-end justify-end gap-2 max-w-[88%] ml-auto">
                      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl rounded-tr-xs p-3 shadow-sm flex-1 min-w-0">
                        <div className="flex items-center justify-end gap-1.5 mb-1 text-[10px] font-bold text-purple-200/90">
                          <span className="bg-purple-700/70 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider text-purple-100">
                            KAMU
                          </span>
                          <span className="text-xs select-none">{mAvatar}</span>
                        </div>
                        <p className="leading-relaxed break-words whitespace-pre-wrap text-white font-medium">
                          {m.text}
                        </p>
                        <div className="flex items-center justify-end gap-1 text-[9px] text-purple-200/80 mt-1">
                          <span>{timeStr}</span>
                          <CheckCheck className="w-3 h-3 text-purple-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // 3. KATEGORI: TEMAN SEKELAS (Rata Kiri, Soft Neutral Bubble)
              return (
                <div key={m.id} className="flex flex-col items-start w-full my-1.5 animate-fade-in">
                  <div className="flex items-start justify-start gap-2.5 max-w-[88%] mr-auto">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-base shadow-2xs shrink-0 select-none mt-0.5">
                      {mAvatar}
                    </div>

                    <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 rounded-2xl rounded-tl-xs p-3 shadow-xs">
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold">
                        <span className="text-slate-800 dark:text-slate-200 truncate">
                          {m.studentName}
                        </span>
                        <span className="text-slate-400 text-[9px] ml-auto">
                          {timeStr}
                        </span>
                      </div>
                      <p className="leading-relaxed text-slate-700 dark:text-slate-200 break-words whitespace-pre-wrap">
                        {m.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Chips & Chat Input */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          {/* Quick Preset Message Chips */}
          {!isChatMuted && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hover">
              {PRESET_QUICK_MESSAGES.map((msg) => (
                <button
                  key={msg}
                  type="button"
                  disabled={sessionStatus === 'finished' || isSessionEndedModalOpen || isSending}
                  onClick={() => handleSendMessage(msg)}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 whitespace-nowrap min-h-[38px] flex items-center justify-center btn-press disabled:opacity-40 shrink-0"
                >
                  {msg}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              maxLength={100}
              value={inputText}
              disabled={isChatMuted || sessionStatus === 'finished' || isSessionEndedModalOpen || isSending}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isChatMuted
                  ? 'Obrolan dibungkam oleh Guru...'
                  : sessionStatus === 'finished'
                  ? 'Sesi telah berakhir...'
                  : 'Ketik pesan positif...'
              }
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white min-h-[48px] shadow-xs disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isChatMuted || sessionStatus === 'finished' || isSessionEndedModalOpen || isSending}
              className="p-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold disabled:opacity-40 min-h-[48px] min-w-[48px] flex items-center justify-center transition-colors btn-press shrink-0 shadow-sm"
              aria-label="Kirim Pesan"
              title="Kirim Pesan"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
