import React, { useState, useRef, useEffect } from 'react';
import { DataManager, broadcastLiveReaction } from '../../lib/supabaseClient';
import type { SessionLiveReaction } from '../../types/quiz';
import { QUIZIZZ_REACTIONS } from './QuizizzReactionButtonRow';
import { X, Sparkles } from 'lucide-react';

export interface FloatingReactionButtonProps {
  sessionId: string;
  senderName: string;
  avatarId?: string;
  isTeacher?: boolean;
  playClick?: () => void;
  positionClassName?: string;
}

export const FloatingReactionButton: React.FC<FloatingReactionButtonProps> = ({
  sessionId,
  senderName,
  avatarId,
  isTeacher = false,
  playClick,
  positionClassName = 'bottom-20 right-3 sm:bottom-24 sm:right-6',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePressedEmoji, setActivePressedEmoji] = useState<string | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const autoCloseTimerRef = useRef<any>(null);
  const lastClickTimeRef = useRef<number>(0);
  const lastBackendSendRef = useRef<number>(0);
  const queuedReactionRef = useRef<SessionLiveReaction | null>(null);
  const debounceTimerRef = useRef<any>(null);

  // Auto close dock after 6 seconds of inactivity
  const resetAutoCloseTimer = () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    autoCloseTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 6000);
  };

  useEffect(() => {
    if (isOpen) {
      resetAutoCloseTimer();
    }
    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [isOpen]);

  // Handle click outside to close dock
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const persistReaction = async (reaction: SessionLiveReaction) => {
    try {
      await DataManager.sendSessionReaction(sessionId, reaction, { skipBroadcast: true });
    } catch (err) {
      console.warn('Failed to persist floating reaction:', err);
    }
  };

  const handleSendReaction = (emoji: string) => {
    const now = Date.now();
    // Anti-spam click cooldown (350ms minimum interval antar klik)
    if (now - lastClickTimeRef.current < 350) {
      return;
    }
    lastClickTimeRef.current = now;

    if (playClick) playClick();
    if (navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch {}
    }

    setActivePressedEmoji(emoji);
    setTimeout(() => setActivePressedEmoji(null), 250);
    resetAutoCloseTimer();

    const reactionId = 'react_' + now + '_' + Math.random().toString(36).substring(2, 7);
    const liveReaction: SessionLiveReaction = {
      id: reactionId,
      studentName: senderName,
      senderName: senderName,
      avatarId,
      isTeacher,
      emoji,
      createdAt: now,
    };

    // Broadcast instant
    broadcastLiveReaction(sessionId, liveReaction);

    // Throttled persistence
    if (now - lastBackendSendRef.current > 500) {
      lastBackendSendRef.current = now;
      persistReaction(liveReaction);
    } else {
      queuedReactionRef.current = liveReaction;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (queuedReactionRef.current) {
          lastBackendSendRef.current = Date.now();
          persistReaction(queuedReactionRef.current);
          queuedReactionRef.current = null;
        }
      }, 500);
    }
  };

  return (
    <div ref={dockRef} className={`fixed ${positionClassName} z-40 select-none`}>
      {/* Expanded Reaction Dock */}
      {isOpen ? (
        <div className="bg-slate-900/95 dark:bg-slate-900/95 border border-slate-700/90 dark:border-slate-700/90 rounded-3xl p-3 shadow-2xl backdrop-blur-md animate-scale-up flex flex-col gap-2 max-w-[280px] sm:max-w-[320px]">
          <div className="flex items-center justify-between px-1 border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isTeacher ? 'Reaksi Guru:' : 'Kirim Reaksi:'}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 justify-items-center">
            {QUIZIZZ_REACTIONS.map((r) => {
              const isPressed = activePressedEmoji === r.emoji;
              return (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => handleSendReaction(r.emoji)}
                  className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl flex items-center justify-center text-xl transition-all transform active:scale-80 hover:scale-110 btn-press bg-slate-800/80 hover:bg-amber-950/60 border border-slate-700/70 shrink-0 ${
                    isPressed ? 'ring-2 ring-amber-400 scale-125 bg-amber-900/60' : ''
                  }`}
                  title={r.label}
                  aria-label={r.label}
                >
                  <span className={`transform transition-transform ${isPressed ? 'scale-125' : ''}`}>
                    {r.emoji}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Floating Action Trigger Button */
        <button
          type="button"
          onClick={() => {
            if (playClick) playClick();
            setIsOpen(true);
          }}
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-white shadow-xl shadow-rose-950/50 flex items-center justify-center transform active:scale-90 hover:scale-105 transition-all btn-press border-2 border-white/30"
          title="Kirim Reaksi Emoji"
          aria-label="Kirim Reaksi Emoji"
        >
          <span className="text-xl sm:text-2xl animate-bounce">💖</span>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-900 animate-pulse" />
        </button>
      )}
    </div>
  );
};
