import React, { useState, useEffect, useRef } from 'react';
import type { SessionChatMessage } from '../../types/quiz';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { supabase, getLiveRealtimeChannel } from '../../lib/supabaseClient';
import { BellOff, X } from 'lucide-react';

interface StudentChatBubbleToastProps {
  sessionId: string;
  chatMessages?: SessionChatMessage[];
  onOpenChat: () => void;
  currentUserName?: string;
  isChatDrawerOpen?: boolean;
  isMutedByStudent?: boolean;
  onToggleMuteByStudent?: (muted: boolean) => void;
}

// Efek suara pop-chime lembut khas chat (Web Audio API)
function playSubtleChatNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Abaikan pembatasan audio browser
  }
}

export const StudentChatBubbleToast: React.FC<StudentChatBubbleToastProps> = ({
  sessionId,
  chatMessages,
  onOpenChat,
  currentUserName,
  isChatDrawerOpen = false,
  isMutedByStudent = false,
  onToggleMuteByStudent,
}) => {
  const [activeMessage, setActiveMessage] = useState<SessionChatMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProcessedMessageIdRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);

  const clearTimer = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  };

  const startDismissTimer = () => {
    clearTimer();
    dismissTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setActiveMessage(null), 300);
    }, 5000);
  };

  const handleIncomingMessage = (msg: SessionChatMessage) => {
    if (!msg || !msg.id) return;

    // Jangan tampilkan jika laci chat sedang terbuka atau notifikasi disenyapkan oleh siswa
    if (isChatDrawerOpen || isMutedByStudent) return;

    // Jangan tampilkan toast untuk pesan yang dikirim oleh diri sendiri
    if (currentUserName && msg.studentName.trim().toLowerCase() === currentUserName.trim().toLowerCase()) {
      return;
    }

    // Hindari notifikasi ganda untuk id yang sama
    if (lastProcessedMessageIdRef.current === msg.id) {
      return;
    }

    lastProcessedMessageIdRef.current = msg.id;
    setActiveMessage(msg);
    setIsVisible(true);
    startDismissTimer();

    // Bunyikan pop-chime lembut jika notifikasi tidak disenyapkan
    if (!isMutedByStudent) {
      playSubtleChatNotificationSound();
    }
  };

  // 1. Pantau perubahan array chatMessages dari sinkronisasi database / polling
  useEffect(() => {
    if (!chatMessages || chatMessages.length === 0) {
      isInitialMountRef.current = false;
      return;
    }

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      const latest = chatMessages[chatMessages.length - 1];
      if (latest) {
        lastProcessedMessageIdRef.current = latest.id;
      }
      return;
    }

    const latest = chatMessages[chatMessages.length - 1];
    if (latest && latest.id !== lastProcessedMessageIdRef.current) {
      handleIncomingMessage(latest);
    }
  }, [chatMessages, isChatDrawerOpen, isMutedByStudent]);

  // 2. Tutup sembulan seketika jika laci chat dibuka
  useEffect(() => {
    if (isChatDrawerOpen && isVisible) {
      setIsVisible(false);
      clearTimer();
      setTimeout(() => setActiveMessage(null), 200);
    }
  }, [isChatDrawerOpen, isVisible]);

  // 3. Listener Realtime Broadcast / Event Lokal
  useEffect(() => {
    if (!sessionId) return;

    const handleCustomMsg = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.sessionId === sessionId && detail?.message) {
        handleIncomingMessage(detail.message);
      }
    };

    window.addEventListener('kuis_chat_message', handleCustomMsg);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(`kuis_chat_sync_${sessionId}`);
      bc.onmessage = (event) => {
        if (event.data?.type === 'CHAT_MESSAGE' && event.data?.message) {
          handleIncomingMessage(event.data.message);
        }
      };
    } catch {}

    if (supabase) {
      try {
        const channel = getLiveRealtimeChannel(sessionId);
        if (channel) {
          channel.on('broadcast', { event: 'chat' }, (eventPayload: any) => {
            const payload = eventPayload?.payload;
            if (payload?.sessionId === sessionId && payload?.message) {
              handleIncomingMessage(payload.message);
            }
          });
        }
      } catch (err) {
        console.warn('StudentChatBubbleToast realtime broadcast error:', err);
      }
    }

    return () => {
      window.removeEventListener('kuis_chat_message', handleCustomMsg);
      if (bc) bc.close();
      clearTimer();
    };
  }, [sessionId, currentUserName, isChatDrawerOpen, isMutedByStudent]);

  if (!activeMessage || isChatDrawerOpen || isMutedByStudent) return null;

  const avatarDisplay = (activeMessage.avatarId && AVATAR_MAP[activeMessage.avatarId]) || 
    (activeMessage.isTeacher ? '👨‍🏫' : '🦁');

  const animationClasses = isVisible 
    ? 'opacity-100 translate-x-0 scale-100' 
    : 'opacity-0 translate-x-4 scale-95 pointer-events-none';

  return (
    <div
      role="alert"
      aria-live="polite"
      onMouseEnter={clearTimer}
      onMouseLeave={startDismissTimer}
      onTouchStart={clearTimer}
      onTouchEnd={startDismissTimer}
      onClick={() => {
        setIsVisible(false);
        setActiveMessage(null);
        onOpenChat();
      }}
      className={`fixed bottom-5 sm:bottom-6 right-20 sm:right-24 z-40 transition-all duration-300 transform max-w-[calc(100vw-5.75rem)] sm:max-w-[320px] w-max cursor-pointer select-none ${animationClasses}`}
    >
      {/* Speech Bubble Card */}
      <div className="relative bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-md border border-purple-500/40 dark:border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-900/30 p-2.5 sm:p-3 flex items-center gap-2 hover:border-purple-400 transition-colors group">
        
        {/* Right Pointer Arrow directed at circular chat button */}
        <div 
          className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-l-[8px] border-l-slate-900/95 drop-shadow-xs"
          aria-hidden="true"
        />

        {/* Sender Avatar */}
        <div className="relative shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 flex items-center justify-center text-base sm:text-lg shadow-xs border border-purple-500/30">
            {avatarDisplay}
          </div>
          {activeMessage.isTeacher && (
            <span className="absolute -top-1.5 -right-1.5 text-[10px] select-none filter drop-shadow">
              👑
            </span>
          )}
        </div>

        {/* Message Content */}
        <div className="min-w-0 flex-1 pr-0.5">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[11px] font-bold text-white truncate max-w-[120px] sm:max-w-[150px]">
              {activeMessage.studentName}
            </span>
            {activeMessage.isTeacher && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-950/80 text-amber-300 border border-amber-800/80 shrink-0">
                Guru
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-200 line-clamp-2 leading-tight break-words font-medium">
            {activeMessage.text}
          </p>
        </div>

        {/* Action Controls: Mute & Close */}
        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          {/* Tombol Senyapkan Notifikasi (Mute Toast) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
              setTimeout(() => setActiveMessage(null), 200);
              if (onToggleMuteByStudent) {
                onToggleMuteByStudent(true);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-amber-300 rounded-lg hover:bg-slate-800/80 transition-colors min-h-[44px] min-w-[36px] flex items-center justify-center"
            title="Senyapkan Notifikasi Sembulan"
            aria-label="Senyapkan Notifikasi Sembulan"
          >
            <BellOff className="w-3.5 h-3.5" />
          </button>

          {/* Tombol Tutup Sembulan Saat Ini */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
              setTimeout(() => setActiveMessage(null), 200);
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors min-h-[44px] min-w-[36px] flex items-center justify-center"
            title="Tutup Notifikasi"
            aria-label="Tutup Notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
