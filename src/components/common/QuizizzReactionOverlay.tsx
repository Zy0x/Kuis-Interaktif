import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { SessionLiveReaction } from '../../types/quiz';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { supabase, getLiveRealtimeChannel } from '../../lib/supabaseClient';

export interface QuizizzReactionOverlayProps {
  sessionId?: string;
  reactions?: SessionLiveReaction[];
}

interface FloatingParticle {
  id: string;
  emoji: string;
  senderName?: string;
  avatarId?: string;
  isTeacher?: boolean;
  left: number; // 5% to 75% within the side-stream channel
  duration: number; // 1.8 to 2.2 seconds
  scale: number;
  rotation: number;
}

export const QuizizzReactionOverlay: React.FC<QuizizzReactionOverlayProps> = ({
  sessionId,
  reactions,
}) => {
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const lastSpawnTimesRef = useRef<Map<string, number>>(new Map());

  const spawnParticle = useCallback((reaction: SessionLiveReaction) => {
    // Confined to the narrow side-stream channel (10% to 65% of container width)
    const randomLeft = Math.floor(10 + Math.random() * 55);
    const duration = +(1.8 + Math.random() * 0.4).toFixed(2);
    const scale = +(0.95 + Math.random() * 0.2).toFixed(2);
    const rotation = Math.floor(-8 + Math.random() * 16);

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
    };

    setParticles((prev) => {
      // Limit to max 14 active particles to guarantee buttery-smooth 60-120fps with zero lag
      const next = prev.length >= 14 ? prev.slice(-13) : prev;
      return [...next, particle];
    });

    // Auto cleanup when animation finishes
    const cleanupMs = Math.round(duration * 1000) + 100;
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== particle.id));
    }, cleanupMs);
  }, []);

  const handleReaction = useCallback((reaction: SessionLiveReaction, targetSessionId?: string) => {
    if (sessionId && targetSessionId && targetSessionId !== sessionId) {
      return;
    }
    // Deduplicate rapid bursts with same reaction ID or within 400ms
    const key = reaction.id || `${reaction.emoji}_${reaction.senderName || reaction.studentName}_${Math.floor((reaction.createdAt || Date.now()) / 1000)}`;
    const now = Date.now();
    const last = lastSpawnTimesRef.current.get(key);
    if (last && now - last < 400) return;
    lastSpawnTimesRef.current.set(key, now);

    spawnParticle(reaction);
  }, [sessionId, spawnParticle]);

  // 1. Supabase Realtime WebSocket Broadcast (Lintas perangkat/mobile ke PC, sub-50ms)
  useEffect(() => {
    if (!sessionId || !supabase) return;

    let subChannel: any = null;
    try {
      subChannel = getLiveRealtimeChannel(sessionId);
      if (subChannel) {
        subChannel.on('broadcast', { event: 'reaction' }, (eventPayload: any) => {
          const payload = eventPayload?.payload;
          if (payload?.reaction) {
            handleReaction(payload.reaction, payload.sessionId);
          }
        });
      }
    } catch (err) {
      console.warn('QuizizzReactionOverlay realtime broadcast error:', err);
    }
  }, [sessionId, handleReaction]);

  // 2. Fallback: Sinkronkan reaksi dari data sesi Supabase Database (jika polling atau postgres_changes)
  useEffect(() => {
    if (!reactions || reactions.length === 0) return;
    const now = Date.now();
    // Periksa 6 reaksi paling baru
    const recent = reactions.slice(-6);
    recent.forEach((r) => {
      const created = r.createdAt || now;
      if (now - created < 3500) {
        const key = r.id || `${r.emoji}_${r.senderName || r.studentName}_${Math.floor(created / 1000)}`;
        if (!lastSpawnTimesRef.current.has(key)) {
          lastSpawnTimesRef.current.set(key, now);
          spawnParticle(r);
        }
      }
    });
  }, [reactions, spawnParticle]);

  // 3. Listen to local BroadcastChannel (same browser) & CustomEvent (same window)
  useEffect(() => {
    // 3a. BroadcastChannel
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

    // 3b. CustomEvent within same tab/window
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
  }, [sessionId, handleReaction]);

  if (particles.length === 0) return null;

  return (
    <div
      className="fixed bottom-24 sm:bottom-28 right-2 sm:right-6 w-52 sm:w-64 h-[380px] sm:h-[420px] pointer-events-none z-50 overflow-hidden flex flex-col justify-end select-none"
      aria-hidden="true"
    >
      {particles.map((p) => {
        const avatarEmoji = (p.avatarId && AVATAR_MAP[p.avatarId]) || (p.isTeacher ? '👨‍🏫' : '🌟');
        return (
          <div
            key={p.id}
            className="absolute bottom-2 animate-quizizz-rise flex flex-col items-center select-none"
            style={
              {
                left: `${p.left}%`,
                '--rise-duration': `${p.duration}s`,
              } as React.CSSProperties
            }
          >
            {/* Gentle Horizontal Sway */}
            <div className="animate-quizizz-sway flex flex-col items-center">
              {/* Floating Pop Emoji */}
              <div
                className="text-2xl sm:text-3xl filter drop-shadow animate-reaction-pop select-none"
                style={{ transform: `rotate(${p.rotation}deg) scale(${p.scale})` }}
              >
                {p.emoji}
              </div>

              {/* Compact, Flat, High-Performance Chip (No Heavy Blur) */}
              {p.senderName && (
                <div
                  className={`mt-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold shadow-md flex items-center gap-1 border whitespace-nowrap animate-fade-in ${
                    p.isTeacher
                      ? 'bg-amber-950 text-amber-200 border-amber-400/80 ring-1 ring-amber-400/40'
                      : 'bg-slate-900/90 text-slate-200 border-slate-700'
                  }`}
                >
                  <span className="text-[10px] select-none">{avatarEmoji}</span>
                  <span className="truncate max-w-[85px] sm:max-w-[110px]">{p.senderName}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
