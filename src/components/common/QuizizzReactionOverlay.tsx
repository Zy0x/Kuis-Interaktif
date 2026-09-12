import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { SessionLiveReaction } from '../../types/quiz';
import { AVATAR_MAP } from '../../data/seedQuizzes';

export interface QuizizzReactionOverlayProps {
  sessionId?: string;
}

interface FloatingParticle {
  id: string;
  emoji: string;
  senderName?: string;
  avatarId?: string;
  isTeacher?: boolean;
  left: number; // 10% to 90%
  duration: number; // 2.2 to 3.2 seconds
  scale: number; // 0.9 to 1.3
  rotation: number; // -15 to +15 deg
  sway1: number;
  sway2: number;
  sway3: number;
  sway4: number;
}

export const QuizizzReactionOverlay: React.FC<QuizizzReactionOverlayProps> = ({
  sessionId,
}) => {
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const lastSpawnTimesRef = useRef<Map<string, number>>(new Map());

  const spawnParticle = useCallback((reaction: SessionLiveReaction) => {
    // Generate unique organic sway points and parameters
    const randomLeft = Math.floor(10 + Math.random() * 80);
    const duration = +(3.0 + Math.random() * 0.8).toFixed(2);
    const scale = +(0.95 + Math.random() * 0.35).toFixed(2);
    const rotation = Math.floor(-15 + Math.random() * 30);
    const sway1 = Math.floor(10 + Math.random() * 20) * (Math.random() > 0.5 ? 1 : -1);
    const sway2 = Math.floor(12 + Math.random() * 22) * (Math.random() > 0.5 ? -1 : 1);
    const sway3 = Math.floor(8 + Math.random() * 18) * (Math.random() > 0.5 ? 1 : -1);
    const sway4 = Math.floor(6 + Math.random() * 14) * (Math.random() > 0.5 ? -1 : 1);

    const particle: FloatingParticle = {
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      emoji: reaction.emoji,
      senderName: reaction.senderName || reaction.studentName,
      avatarId: reaction.avatarId,
      isTeacher: reaction.isTeacher,
      left: randomLeft,
      duration,
      scale,
      rotation,
      sway1,
      sway2,
      sway3,
      sway4,
    };

    setParticles((prev) => {
      // Limit to max 35 active particles to maintain ultra-smooth 60fps
      const next = prev.length >= 35 ? prev.slice(-34) : prev;
      return [...next, particle];
    });

    // Auto cleanup when animation finishes
    const cleanupMs = Math.round(duration * 1000) + 100;
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== particle.id));
    }, cleanupMs);
  }, []);

  // Listen to real-time reactions via BroadcastChannel & CustomEvent
  useEffect(() => {
    const handleReaction = (reaction: SessionLiveReaction, targetSessionId?: string) => {
      if (sessionId && targetSessionId && targetSessionId !== sessionId) {
        return;
      }
      // Deduplicate rapid bursts with same reaction ID
      if (reaction.id) {
        const now = Date.now();
        const last = lastSpawnTimesRef.current.get(reaction.id);
        if (last && now - last < 400) return;
        lastSpawnTimesRef.current.set(reaction.id, now);
      }
      spawnParticle(reaction);
    };

    // 1. BroadcastChannel
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('kuis_realtime_session_sync');
        channel.onmessage = (event) => {
          const data = event.data;
          if (data?.type === 'LIVE_REACTION' && data.reaction) {
            handleReaction(data.reaction, data.sessionId);
          }
        };
      }
    } catch (e) {
      console.warn('QuizizzReactionOverlay BroadcastChannel error:', e);
    }

    // 2. CustomEvent within same tab/window
    const handleCustom = (e: Event) => {
      const evt = e as CustomEvent;
      if (evt.detail?.reaction) {
        handleReaction(evt.detail.reaction, evt.detail.sessionId);
      }
    };
    window.addEventListener('kuis_live_reaction', handleCustom);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('kuis_live_reaction', handleCustom);
    };
  }, [sessionId, spawnParticle]);

  if (particles.length === 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => {
        const avatarEmoji = (p.avatarId && AVATAR_MAP[p.avatarId]) || (p.isTeacher ? '👨‍🏫' : '🌟');
        return (
          <div
            key={p.id}
            className="absolute bottom-6 animate-quizizz-float flex flex-col items-center select-none"
            style={
              {
                left: `${p.left}%`,
                '--float-duration': `${p.duration}s`,
                '--sway-1': `${p.sway1}px`,
                '--sway-2': `${p.sway2}px`,
                '--sway-3': `${p.sway3}px`,
                '--sway-4': `${p.sway4}px`,
              } as React.CSSProperties
            }
          >
            {/* Floating Pop Emoji */}
            <div
              className="text-3xl sm:text-4xl md:text-5xl filter drop-shadow-xl animate-reaction-pop transform transition-transform"
              style={{ transform: `rotate(${p.rotation}deg) scale(${p.scale})` }}
            >
              {p.emoji}
            </div>

            {/* Glassmorphic Sender Avatar & Name Chip */}
            {p.senderName && (
              <div
                className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black shadow-lg backdrop-blur-md flex items-center gap-1.5 border whitespace-nowrap animate-fade-in ${
                  p.isTeacher
                    ? 'bg-amber-950/85 text-amber-200 border-amber-400/60 ring-1 ring-amber-400/40'
                    : 'bg-slate-900/85 text-white border-slate-700/80 ring-1 ring-white/20'
                }`}
              >
                <span className="text-xs select-none">{avatarEmoji}</span>
                <span className="truncate max-w-[110px] sm:max-w-[160px]">{p.senderName}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
