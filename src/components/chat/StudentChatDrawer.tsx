import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SessionChatMessage, ChatReplyRef } from '../../types/quiz';
import { DataManager, supabase, getLiveRealtimeChannel } from '../../lib/supabaseClient';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { isDesktopDevice } from '../../lib/deviceUtils';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../lib/navigationHistory';
import { useSwipeToReply } from '../../hooks/useSwipeToReply';
import { QuotedMessageBubble } from './QuotedMessageBubble';
import { 
  X, 
  Send, 
  MessageSquare, 
  VolumeX, 
  Sparkles, 
  CheckCheck,
  CornerUpLeft,
  Bell,
  BellOff
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
  isNotificationMuted?: boolean;
  onToggleNotificationMute?: (muted: boolean) => void;
}

const formatChatTime = (timestamp?: number): string => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// â”€â”€â”€ Sub-component: individual message bubble with swipe + hover reply â”€â”€â”€â”€â”€â”€â”€â”€
interface ChatMessageItemProps {
  m: SessionChatMessage;
  studentName: string;
  hoveredMsgId: string | null;
  isChatMuted: boolean;
  sessionStatus: string;
  onHoverEnter: (id: string) => void;
  onHoverLeave: () => void;
  onReply: (msg: SessionChatMessage) => void;
  onJump: (msgId: string) => void;
  setRef: (el: HTMLDivElement | null) => void;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  m, studentName, hoveredMsgId, isChatMuted, sessionStatus,
  onHoverEnter, onHoverLeave, onReply, onJump, setRef,
}) => {
  const mAvatar = (m.avatarId && AVATAR_MAP[m.avatarId]) || (m.isTeacher ? 'ðŸ‘¨â€ðŸ«' : 'ðŸ¦');
  const isMe = m.studentName.trim().toLowerCase() === studentName.trim().toLowerCase() && !m.isTeacher;
  const isTeacherMsg = Boolean(m.isTeacher);
  const timeStr = formatChatTime(m.createdAt);
  const isHovered = hoveredMsgId === m.id;

  const { handlers: swipeHandlers } = useSwipeToReply({
    onReply: () => onReply(m),
    disabled: isChatMuted || sessionStatus === 'finished',
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
        'hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-400',
        'shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center',
        isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none',
        'transition-opacity transition-transform',
      ].join(' ')}
    >
      <CornerUpLeft className="w-3.5 h-3.5" />
    </button>
  );

  if (isTeacherMsg) {
    return (
      <div
        ref={setRef}
        className="flex flex-col items-start w-full my-1.5 animate-fade-in group"
        onMouseEnter={() => onHoverEnter(m.id)}
        onMouseLeave={onHoverLeave}
        {...swipeHandlers}
      >
        <div className="flex items-start gap-2.5 max-w-[92%] mr-auto w-full">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center text-sm shadow-xs border border-amber-300 shrink-0 select-none mt-0.5">
            {mAvatar}
          </div>
          <div className="flex items-end gap-1.5 flex-1 min-w-0">
            <div className="bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200/90 dark:border-amber-800/60 rounded-2xl rounded-tl-xs p-3 shadow-2xs flex-1 min-w-0">
              {m.replyTo && (
                <QuotedMessageBubble
                  replyTo={m.replyTo}
                  currentUserName={studentName}
                  onClick={() => onJump(m.replyTo!.id)}
                  variant="embed"
                />
              )}
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-black text-xs text-amber-950 dark:text-amber-200 truncate">{m.studentName}</span>
                  <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-2xs flex items-center gap-0.5 shrink-0">
                    <Sparkles className="w-2.5 h-2.5" /><span>Guru</span>
                  </span>
                </div>
                {timeStr && <span className="text-amber-700/70 dark:text-amber-400/70 text-[9.5px] font-semibold shrink-0">{timeStr}</span>}
              </div>
              <p className="leading-relaxed font-medium text-xs text-amber-950 dark:text-amber-100 break-words whitespace-pre-wrap">{m.text}</p>
            </div>
            {ReplyBtn}
          </div>
        </div>
      </div>
    );
  }

  if (isMe) {
    return (
      <div
        ref={setRef}
        className="flex flex-col items-end w-full my-1.5 animate-fade-in group"
        onMouseEnter={() => onHoverEnter(m.id)}
        onMouseLeave={onHoverLeave}
        {...swipeHandlers}
      >
        <div className="flex items-end justify-end gap-2 max-w-[88%] ml-auto">
          <button
            type="button"
            onClick={() => onReply(m)}
            aria-label="Balas pesan"
            className={[
              'p-1.5 rounded-xl transition-all duration-150',
              'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
              'hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-600',
              'shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center',
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none',
              'transition-opacity transition-transform',
            ].join(' ')}
          >
            <CornerUpLeft className="w-3.5 h-3.5" />
          </button>
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl rounded-tr-xs p-3 shadow-sm flex-1 min-w-0">
            {m.replyTo && (
              <div className="mb-2">
                <QuotedMessageBubble
                  replyTo={m.replyTo}
                  currentUserName={studentName}
                  onClick={() => onJump(m.replyTo!.id)}
                  variant="embed"
                />
              </div>
            )}
            <div className="flex items-center justify-end gap-1.5 mb-1 text-[10px] font-bold text-purple-200/90">
              <span className="bg-purple-700/70 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider text-purple-100">KAMU</span>
              <span className="text-xs select-none">{mAvatar}</span>
            </div>
            <p className="leading-relaxed break-words whitespace-pre-wrap text-white font-medium">{m.text}</p>
            <div className="flex items-center justify-end gap-1 text-[9px] text-purple-200/80 mt-1">
              <span>{timeStr}</span>
              <CheckCheck className="w-3 h-3 text-purple-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Teman sekelas
  return (
    <div
      ref={setRef}
      className="flex flex-col items-start w-full my-1.5 animate-fade-in group"
      onMouseEnter={() => onHoverEnter(m.id)}
      onMouseLeave={onHoverLeave}
      {...swipeHandlers}
    >
      <div className="flex items-start justify-start gap-2.5 max-w-[88%] mr-auto w-full">
        <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-base shadow-2xs shrink-0 select-none mt-0.5">
          {mAvatar}
        </div>
        <div className="flex items-end gap-1.5 flex-1 min-w-0">
          <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 rounded-2xl rounded-tl-xs p-3 shadow-xs flex-1 min-w-0">
            {m.replyTo && (
              <QuotedMessageBubble
                replyTo={m.replyTo}
                currentUserName={studentName}
                onClick={() => onJump(m.replyTo!.id)}
                variant="embed"
              />
            )}
            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold">
              <span className="text-slate-800 dark:text-slate-200 truncate">{m.studentName}</span>
              <span className="text-slate-400 text-[9px] ml-auto">{timeStr}</span>
            </div>
            <p className="leading-relaxed text-slate-700 dark:text-slate-200 break-words whitespace-pre-wrap">{m.text}</p>
          </div>
          {ReplyBtn}
        </div>
      </div>
    </div>
  );
};
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  isNotificationMuted = false,
  onToggleNotificationMute,
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useBodyScrollLock(isOpen);
  useBackHandler('student-chat-drawer', 70, () => {
    onClose();
    return true;
  }, isOpen);

  // Jika status sesi berubah menjadi 'active' (Guru memulai kuis), seketika tutup laci obrolan dan lepaskan keyboard
  useEffect(() => {
    if (sessionStatus === 'active' && isOpen) {
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      onClose();
    }
  }, [sessionStatus, isOpen, onClose]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 60);
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

  // Penyesuaian tinggi textarea otomatis hingga 3 baris saat teks panjang (User Request & Rule 1)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const sh = el.scrollHeight;
    if (sh > 48) {
      el.style.height = `${Math.min(Math.max(sh, 88), 92)}px`;
    } else {
      el.style.height = '';
    }
  }, [inputText]);

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

    const currentReply = replyingTo;
    setReplyingTo(null);

    try {
      const newMsg = await DataManager.sendSessionChatMessage(sessionId, {
        studentName,
        avatarId,
        text: clean,
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
                <span>â€¢ Terpantau Guru</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Tombol Sakelar Notifikasi Sembulan Siswa */}
            {onToggleNotificationMute && (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onToggleNotificationMute(!isNotificationMuted);
                }}
                className={`p-2 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isNotificationMuted
                    ? 'text-amber-500 hover:text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-label={isNotificationMuted ? 'Aktifkan Notifikasi Sembulan' : 'Senyapkan Notifikasi Sembulan'}
                title={isNotificationMuted ? 'Notifikasi Sembulan Disenyapkan (Klik untuk Aktifkan)' : 'Notifikasi Sembulan Aktif (Klik untuk Senyapkan)'}
              >
                {isNotificationMuted ? (
                  <BellOff className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </button>
            )}

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
                ðŸ’¬
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum Ada Obrolan</p>
              <p className="text-xs max-w-xs text-slate-400 dark:text-slate-500">
                Ketik sapaan semangat atau pesan positif kepada teman sekelasmu melalui kolom di bawah!
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <ChatMessageItem
                key={m.id}
                m={m}
                studentName={studentName}
                hoveredMsgId={hoveredMsgId}
                isChatMuted={isChatMuted}
                sessionStatus={sessionStatus}
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
        {/* Chat Input Area */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          {/* Reply Preview Bar */}
          {replyingTo && (
            <div className="flex items-center gap-2 animate-reply-preview-in">
              <div className="flex-1 min-w-0">
                <QuotedMessageBubble
                  replyTo={replyingTo}
                  currentUserName={studentName}
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

          {/* Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={inputRef}
              rows={1}
              maxLength={200}
              value={inputText}
              disabled={isChatMuted || sessionStatus === 'finished' || isSessionEndedModalOpen || isSending}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.nativeEvent.isComposing) return;
                  if (isDesktopDevice()) {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      if (inputText.trim() && !isChatMuted && sessionStatus !== 'finished' && !isSessionEndedModalOpen && !isSending) {
                        handleSendMessage(inputText);
                      }
                    }
                  } else {
                    e.stopPropagation();
                  }
                }
              }}
              placeholder={
                isChatMuted
                  ? 'Obrolan dibungkam oleh Guru...'
                  : sessionStatus === 'finished'
                  ? 'Sesi telah berakhir...'
                  : isDesktopDevice()
                  ? 'Ketik pesan positif (Enter kirim, Shift+Enter baris baru)...'
                  : 'Ketik pesan positif...'
              }
              className="flex-1 px-4 py-2.5 sm:py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white min-h-[44px] sm:min-h-[48px] max-h-28 resize-none leading-relaxed shadow-xs disabled:opacity-50 transition-all overflow-y-auto"
            />
            <button
              type="button"
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || isChatMuted || sessionStatus === 'finished' || isSessionEndedModalOpen || isSending}
              className="p-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold disabled:opacity-40 min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px] flex items-center justify-center transition-colors btn-press shrink-0 shadow-sm mb-0.5"
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