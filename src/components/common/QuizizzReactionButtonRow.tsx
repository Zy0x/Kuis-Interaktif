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
}) => {
  const [activePressedEmoji, setActivePressedEmoji] = useState<string | null>(null);

  const handleSendReaction = async (emoji: string) => {
    if (playClick) playClick();
    setActivePressedEmoji(emoji);
    setTimeout(() => setActivePressedEmoji(null), 250);

    const tempReaction: SessionLiveReaction = {
      id: 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      studentName: senderName,
      avatarId,
      isTeacher,
      emoji,
      createdAt: Date.now(),
    };

    // 0ms instant local & cross-tab broadcast
    broadcastLiveReaction(sessionId, tempReaction);

    // Persist to session storage & backend
    try {
      await DataManager.sendSessionReaction(sessionId, {
        studentName: senderName,
        avatarId,
        isTeacher,
        emoji,
      });
    } catch (err) {
      console.warn('Failed to send reaction:', err);
    }
  };

  return (
    <div className={`flex flex-col items-center ${compact ? 'gap-1' : 'gap-2'}`}>
      {title && (
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
          {title}
        </span>
      )}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
        {QUIZIZZ_REACTIONS.map((r) => {
          const isPressed = activePressedEmoji === r.emoji;
          return (
            <button
              key={r.emoji}
              type="button"
              onClick={() => handleSendReaction(r.emoji)}
              className={`rounded-2xl transition-all select-none flex items-center justify-center transform active:scale-90 hover:scale-110 btn-press ${
                compact
                  ? 'p-2 text-lg sm:text-xl min-h-[40px] min-w-[40px] bg-slate-100/90 dark:bg-slate-800/90 hover:bg-amber-100/80 dark:hover:bg-amber-950/60 border border-slate-200/80 dark:border-slate-700/80'
                  : 'px-3 py-2 sm:px-3.5 sm:py-2.5 text-xl sm:text-2xl min-h-[44px] min-w-[44px] bg-white dark:bg-slate-850 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-200/90 dark:border-slate-800 shadow-xs'
              } ${isPressed ? 'ring-2 ring-amber-400 scale-125 bg-amber-50 dark:bg-amber-900/40' : ''}`}
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
  );
};
