import React, { useState, useEffect, useRef } from 'react';
import type { SessionChatMessage } from '../../types/quiz';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { MessageSquare, X } from 'lucide-react';

interface ZoomChatToastProps {
  sessionId: string;
  onOpenChat: () => void;
  currentUserName?: string;
}

// Suara notifikasi lembut via Web Audio API (tidak memerlukan berkas audio eksternal)
function playSubtleChatNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Nada pop-chime lembut khas Zoom / chat app
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Abaikan kegagalan audio jika browser membatasi autoplay
  }
}

export const ZoomChatToast: React.FC<ZoomChatToastProps> = ({
  sessionId,
  onOpenChat,
  currentUserName,
}) => {
  const [activeMessage, setActiveMessage] = useState<SessionChatMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    }, 4500);
  };

  const handleIncomingMessage = (msg: SessionChatMessage) => {
    // Jangan tampilkan toast untuk pesan yang dikirim oleh diri sendiri
    if (currentUserName && msg.studentName.trim().toLowerCase() === currentUserName.trim().toLowerCase()) {
      return;
    }

    playSubtleChatNotificationSound();
    setActiveMessage(msg);
    setIsVisible(true);
    startDismissTimer();
  };

  useEffect(() => {
    // 1. Dengarkan event lokal window
    const handleCustomMsg = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.sessionId === sessionId && detail?.message) {
        handleIncomingMessage(detail.message);
      }
    };

    window.addEventListener('kuis_chat_message', handleCustomMsg);

    // 2. Dengarkan BroadcastChannel lintas tab/jendela
    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('kuis_realtime_session_sync');
        bc.onmessage = (event) => {
          if (event.data?.type === 'NEW_CHAT_MESSAGE' && event.data?.sessionId === sessionId && event.data?.message) {
            handleIncomingMessage(event.data.message);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel error in ZoomChatToast:', e);
    }

    return () => {
      window.removeEventListener('kuis_chat_message', handleCustomMsg);
      if (bc) bc.close();
      clearTimer();
    };
  }, [sessionId, currentUserName]);

  if (!activeMessage) return null;

  const avatarDisplay = (activeMessage.avatarId && AVATAR_MAP[activeMessage.avatarId]) || 
    (activeMessage.isTeacher ? '👨‍🏫' : '🦁');

  return (
    <div
      role="alert"
      aria-live="polite"
      onMouseEnter={clearTimer}
      onMouseLeave={startDismissTimer}
      onClick={() => {
        setIsVisible(false);
        setActiveMessage(null);
        onOpenChat();
      }}
      className={`fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 transition-all duration-300 transform max-w-sm w-[calc(100vw-2rem)] sm:w-80 cursor-pointer ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
      }`}
    >
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-blue-200/80 dark:border-blue-900/60 rounded-2xl shadow-xl shadow-blue-500/10 p-3 sm:p-3.5 flex items-start gap-3 hover:border-blue-400 dark:hover:border-blue-700 transition-colors group">
        
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shadow-xs border border-slate-200 dark:border-slate-700">
            {avatarDisplay}
          </div>
          {activeMessage.isTeacher && (
            <span className="absolute -top-1.5 -right-1.5 text-xs select-none filter drop-shadow">
              👑
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-1.5 mb-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {activeMessage.studentName}
              </span>
              {activeMessage.isTeacher && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/80 flex-shrink-0">
                  Guru
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
              Baru saja
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed break-words">
            {activeMessage.text}
          </p>

          <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
            <MessageSquare className="w-3 h-3" />
            <span>Klik untuk membuka obrolan</span>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
            setTimeout(() => setActiveMessage(null), 300);
          }}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 min-h-[28px] min-w-[28px] flex items-center justify-center"
          title="Tutup Notifikasi"
          aria-label="Tutup Notifikasi"
        >
          <X className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
