import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SessionChatMessage, ChatReplyRef } from '../../types/quiz';
import { DataManager, getLiveRealtimeChannel } from '../../lib/supabaseClient';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../lib/navigationHistory';
import { useSwipeToReply } from '../../hooks/useSwipeToReply';
import { QuotedMessageBubble } from './QuotedMessageBubble';
import { 
  X, 
  Send, 
  MessageSquare, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Users, 
  ShieldAlert,
  CornerUpLeft
} from 'lucide-react';

interface TeacherChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  teacherName: string;
  isChatMuted: boolean;
  onToggleChatMute: () => void;
  participantsCount: number;
  playClick: () => void;
}

const QUICK_ANNOUNCEMENTS = [
  '🌟 Selamat datang di kuis kita!',
  '📝 Baca soal dengan tenang & teliti ya!',
  '🚀 Kuis akan segera dimulai, bersiap!',
  '💪 Tetap semangat dan fokus!',
  '⏳ Waktu hampir habis, periksa jawabanmu!',
  '👏 Hebat semuanya! Kerja bagus!',
];
// ─── Sub-component: Teacher individual message bubble with swipe + hover reply ─
interface TeacherChatMessageItemProps {
  m: SessionChatMessage;
  teacherName: string;
  hoveredMsgId: string | null;
  onHoverEnter: (id: string) => void;
  onHoverLeave: () => void;
  onReply: (msg: SessionChatMessage) => void;
  onJump: (msgId: string) => void;
  setRef: (el: HTMLDivElement | null) => void;
}

const TeacherChatMessageItem: React.FC<TeacherChatMessageItemProps> = ({
  m, teacherName, hoveredMsgId,
  onHoverEnter, onHoverLeave, onReply, onJump, setRef,
}) => {
  const avatar = (m.avatarId && AVATAR_MAP[m.avatarId]) || (m.isTeacher ? '👨‍🏫' : '🦁');
  const isTeacherMsg = Boolean(m.isTeacher);
  const isHovered = hoveredMsgId === m.id;
  const timeStr = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const { handlers: swipeHandlers } = useSwipeToReply({
    onReply: () => onReply(m),
  });

  const ReplyBtn = (
    <button
      type="button"
      title="Balas pesan ini"
      aria-label="Balas pesan"
      onClick={() => onReply(m)}
      className={[
        'p-1.5 rounded-xl transition-all duration-150',
        'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
        'hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400',
        'shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center',
        isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none',
        'transition-opacity transition-transform',
      ].join(' ')}
    >
      <CornerUpLeft className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <div
      ref={setRef}
      className="w-full my-1.5 animate-fade-in group"
      onMouseEnter={() => onHoverEnter(m.id)}
      onMouseLeave={onHoverLeave}
      {...swipeHandlers}
    >
      <div
        className={`flex gap-2.5 items-start ${
          isTeacherMsg ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-base shadow-2xs flex-shrink-0 select-none mt-0.5">
          {avatar}
        </div>

        <div className={`flex items-end gap-1.5 max-w-[85%] ${isTeacherMsg ? 'flex-row-reverse' : 'flex-row'}`}>
          <div
            className={`rounded-2xl p-3 text-xs flex-1 min-w-0 ${
              isTeacherMsg
                ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-750 rounded-tl-xs shadow-2xs'
            }`}
          >
            {m.replyTo && (
              <QuotedMessageBubble
                replyTo={m.replyTo}
                currentUserName={teacherName}
                onClick={() => onJump(m.replyTo!.id)}
                variant="embed"
              />
            )}
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`font-extrabold truncate ${isTeacherMsg ? 'text-blue-100' : 'text-slate-900 dark:text-white'}`}>
                {m.studentName}
              </span>
              {isTeacherMsg && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-amber-950 flex-shrink-0">
                  Guru 👑
                </span>
              )}
            </div>
            <p className="leading-relaxed break-words whitespace-pre-wrap">{m.text}</p>
            <div className={`text-[10px] mt-1 text-right ${isTeacherMsg ? 'text-blue-200' : 'text-slate-400'}`}>
              {timeStr}
            </div>
          </div>
          {ReplyBtn}
        </div>
      </div>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

export const TeacherChatDrawer: React.FC<TeacherChatDrawerProps> = ({
  isOpen,
  onClose,
  sessionId,
  teacherName,
  isChatMuted,
  onToggleChatMute,
  participantsCount,
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
  const [replyingTo, setReplyingTo] = useState<ChatReplyRef | null>(null);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const sendingRef = useRef(false);
  const lastSentRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useBodyScrollLock(isOpen);
  useBackHandler('teacher-chat-drawer', 70, () => {
    onClose();
    return true;
  }, isOpen);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);
  };

  // Jump to original message & flash highlight
  const scrollToMessage = useCallback((msgId: string) => {
    const el = messageRefs.current.get(msgId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('animate-reply-highlight');
    setTimeout(() => el.classList.remove('animate-reply-highlight'), 1600);
  }, []);

  // Start reply mode
  const startReply = useCallback((msg: SessionChatMessage) => {
    setReplyingTo({
      id: msg.id,
      studentName: msg.studentName,
      text: msg.text,
      isTeacher: msg.isTeacher,
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

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

    window.addEventListener('kuis_chat_message', handleLocalMsg);

    // BroadcastChannel across tabs
    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('kuis_realtime_session_sync');
        bc.onmessage = (event) => {
          if (event.data?.type === 'NEW_CHAT_MESSAGE' && event.data?.sessionId === sessionId && event.data?.message) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === event.data.message.id)) return prev;
              const last = prev[prev.length - 1];
              if (
                last &&
                last.studentName === event.data.message.studentName &&
                last.text === event.data.message.text &&
                Math.abs(event.data.message.createdAt - last.createdAt) < 1000
              ) {
                return prev;
              }
              return [...prev, event.data.message];
            });
            scrollToBottom();
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel error in TeacherChatDrawer:', e);
    }

    // Supabase Realtime Broadcast — cross-device sync
    let rtChannel: ReturnType<typeof getLiveRealtimeChannel> | null = null;
    try {
      const ch = getLiveRealtimeChannel(sessionId);
      rtChannel = ch;
      ch
        .on('broadcast', { event: 'chat' }, (payload: { payload?: { message?: SessionChatMessage; sessionId?: string } }) => {
          const msg = payload?.payload?.message;
          const sid = payload?.payload?.sessionId;
          if (sid !== sessionId || !msg) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            const last = prev[prev.length - 1];
            if (
              last &&
              last.studentName === msg.studentName &&
              last.text === msg.text &&
              Math.abs(msg.createdAt - last.createdAt) < 1000
            ) {
              return prev;
            }
            return [...prev, msg];
          });
          scrollToBottom();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime broadcast error in TeacherChatDrawer:', e);
    }

    const interval = setInterval(refreshMessages, 2500);

    return () => {
      window.removeEventListener('kuis_chat_message', handleLocalMsg);
      if (bc) bc.close();
      if (rtChannel) rtChannel.unsubscribe();
      clearInterval(interval);
    };
  }, [sessionId]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    const clean = textToSend.trim();
    if (!clean || sendingRef.current) return;

    // Debounce rapid repeated clicks within 800ms
    const now = Date.now();
    if (lastSentRef.current.text === clean && now - lastSentRef.current.time < 800) {
      return;
    }
    lastSentRef.current = { text: clean, time: now };

    sendingRef.current = true;
    setIsSending(true);
    playClick();

    const currentReply = replyingTo;
    setReplyingTo(null);

    try {
      const newMsg = await DataManager.sendSessionChatMessage(sessionId, {
        studentName: teacherName || 'Guru (Host)',
        avatarId: 'owl',
        text: clean,
        isTeacher: true,
        replyTo: currentReply ?? undefined,
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

  const handleQuickChip = (chipText: string) => {
    handleSendMessage(chipText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none overscroll-contain">
      {/* Backdrop */}
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
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight flex items-center gap-1.5 truncate">
                <span>Obrolan Kelas Live</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>{participantsCount} Peserta Terhubung</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Mute Chat Toggle Button */}
            <button
              type="button"
              onClick={onToggleChatMute}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 ${
                isChatMuted
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={isChatMuted ? 'Chat Siswa Sedang Dibungkam (Klik untuk membuka)' : 'Bungkam Chat Siswa'}
              aria-label={isChatMuted ? 'Buka Bungkam Chat Siswa' : 'Bungkam Chat Siswa'}
            >
              {isChatMuted ? <VolumeX className="w-4 h-4 text-rose-600 dark:text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                playClick();
                onClose();
              }}
              className="p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Tutup Obrolan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Alert Mute jika aktif */}
        {isChatMuted && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 px-4 py-2 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span className="font-medium flex-1">Chat siswa dibungkam. Hanya guru yang dapat mengirim pesan.</span>
          </div>
        )}

        {/* Chat Messages Body */}
        <div 
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
                💬
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Belum ada obrolan</p>
              <p className="text-xs max-w-xs">
                Kirim pesan sambutan atau instruksi kepada siswa melalui kotak di bawah atau gunakan chip cepat.
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <TeacherChatMessageItem
                key={m.id}
                m={m}
                teacherName={teacherName}
                hoveredMsgId={hoveredMsgId}
                onHoverEnter={setHoveredMsgId}
                onHoverLeave={() => setHoveredMsgId(null)}
                onReply={startReply}
                onJump={scrollToMessage}
                setRef={(el) => {
                  if (el) messageRefs.current.set(m.id, el);
                  else messageRefs.current.delete(m.id);
                }}
              />
            ))
          )}
        </div>

        {/* Quick Announcement Chips for Teacher */}
        <div className="p-2.5 bg-slate-100/80 dark:bg-slate-850 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 px-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Pengumuman Cepat Guru:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {QUICK_ANNOUNCEMENTS.map((ann, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickChip(ann)}
                disabled={isSending}
                className="px-3 py-2 min-h-[44px] rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800 whitespace-nowrap transition-colors flex-shrink-0 flex items-center justify-center btn-press"
              >
                {ann}
              </button>
            ))}
          </div>
        </div>

        {/* Reply Preview Bar */}
        {replyingTo && (
          <div className="px-3 sm:px-4 py-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 animate-reply-preview-in">
            <div className="flex-1 min-w-0">
              <QuotedMessageBubble
                replyTo={replyingTo}
                currentUserName={teacherName}
                variant="preview"
              />
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Batal balas"
              title="Batal balas"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Chat Input Footer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ketik pesan guru ke kelas..."
              maxLength={150}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {inputText.length > 100 && (
              <span className="absolute right-3 top-2.5 text-[10px] text-slate-400">
                {150 - inputText.length}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-bold min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors btn-press shadow-xs flex-shrink-0"
            title="Kirim Pesan"
            aria-label="Kirim Pesan"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
