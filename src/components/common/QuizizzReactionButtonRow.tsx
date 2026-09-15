import React, { useState } from 'react';
import { DataManager, broadcastLiveReaction } from '../../lib/supabaseClient';
import type { SessionLiveReaction } from '../../types/quiz';

export interface QuizizzReactionButtonRowProps {
  sessionId: string;
  senderName: string;
  avatarId?: string;
  isTeacher?: boolean;
  playClick?: () => void;
  compact?: boolean;
  title?: string;
  scrollable?: boolean;
}

export const QUIZIZZ_REACTIONS = [
  { emoji: '❤️', label: 'Cinta' },
  { emoji: '🔥', label: 'Semangat' },
  { emoji: '⭐', label: 'Bintang' },
  { emoji: '👏', label: 'Tepuk Tangan' },
  { emoji: '🎉', label: 'Pesta' },
  { emoji: '🚀', label: 'Gaspol' },
  { emoji: '🤩', label: 'Kagum' },
  { emoji: '💯', label: 'Seratus' },
];

export const QuizizzReactionButtonRow: React.FC<QuizizzReactionButtonRowProps> = ({
  sessionId,
  senderName,
  avatarId,
  isTeacher = false,
  playClick,
  compact = false,
  title = 'Kirim Reaksi Semangat:',
  scrollable = false,
}) => {
  const [activePressedEmoji, setActivePressedEmoji] = useState<string | null>(null);
  const lastClickTimeRef = React.useRef<number>(0);
  const lastBackendSendRef = React.useRef<number>(0);
  const queuedReactionRef = React.useRef<SessionLiveReaction | null>(null);
  const debounceTimerRef = React.useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const persistReaction = async (reaction: SessionLiveReaction) => {
    try {
      await DataManager.sendSessionReaction(sessionId, reaction, { skipBroadcast: true });
    } catch (err) {
      console.warn('Failed to send reaction:', err);
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
    setActivePressedEmoji(emoji);
    setTimeout(() => setActivePressedEmoji(null), 250);

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

    // 0ms instant local & cross-tab / cross-device broadcast
    broadcastLiveReaction(sessionId, liveReaction);

    // Throttled network persistence ke backend Supabase (maks 1 per 500ms)
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
    <div className={`flex flex-col items-center ${compact ? 'gap-1.5' : 'gap-2.5'} w-full max-w-full`}>
      {title && (
        <span className="text-[11px] sm:text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider select-none text-center">
          {title}
        </span>
      )}
      <div
        className={`flex items-center gap-2 sm:gap-2.5 max-w-full ${
          scrollable
            ? 'overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] justify-start sm:justify-center py-1 px-1 w-full touch-pan-x'
            : 'flex-wrap justify-center'
        }`}
      >
        {QUIZIZZ_REACTIONS.map((r) => {
          const isPressed = activePressedEmoji === r.emoji;
          return (
            <button
              key={r.emoji}
              type="button"
              onClick={() => handleSendReaction(r.emoji)}
              className={`rounded-2xl transition-all select-none flex items-center justify-center transform active:scale-85 hover:scale-110 btn-press shrink-0 shadow-2xs hover:shadow-sm ${
                compact
                  ? 'w-11 h-11 sm:w-12 sm:h-12 text-xl sm:text-2xl min-h-[44px] min-w-[44px] bg-slate-100 dark:bg-slate-800/90 hover:bg-amber-100/70 dark:hover:bg-amber-950/60 active:bg-amber-200/80 dark:active:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/80'
                  : 'w-12 h-12 sm:w-13 sm:h-13 text-xl sm:text-2xl min-h-[48px] min-w-[48px] bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 active:bg-amber-100 dark:active:bg-slate-650 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shadow-xs'
              } ${
                isPressed
                  ? 'ring-2 ring-amber-400 scale-125 bg-amber-100 dark:bg-amber-900/60 shadow-md shadow-amber-500/20'
                  : 'hover:border-amber-400/60 dark:hover:border-amber-500/50'
              }`}
              title={r.label}
              aria-label={r.label}
            >
              <span className={`transform transition-transform select-none ${isPressed ? 'scale-125' : ''}`}>
                {r.emoji}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
