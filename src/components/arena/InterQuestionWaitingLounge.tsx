import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { QuizSession } from '../../types/quiz';
import { DataManager } from '../../lib/supabaseClient';
import { AVATAR_MAP } from '../../data/seedQuizzes';
import { isDesktopDevice } from '../../lib/deviceUtils';
import { 
  Send, 
  MessageCircle, 
  Gamepad2, 
  VolumeX, 
  Volume2, 
  CheckCircle2,
  RotateCcw,
  Trophy
} from 'lucide-react';
import { QuizizzReactionOverlay } from '../common/QuizizzReactionOverlay';
import { QuizizzReactionButtonRow } from '../common/QuizizzReactionButtonRow';


export interface InterQuestionWaitingLoungeProps {
  session: QuizSession;
  questionIndex: number;
  totalQuestions: number;
  studentName: string;
  avatarId: string;
  earnedStars?: number;
  earnedScore?: number;
  onAdvanceToQuestion: (nextIndex: number) => void;
  onQuizFinished: () => void;
  playClick: () => void;
  playCorrect?: () => void;
}

// -------------------------------------------------------------
// Mini-Game 1: Dino Run (T-Rex Runner SD Seru)
// -------------------------------------------------------------
function playDinoAudio(type: 'jump' | 'hit' | 'score') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'jump') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } else if (type === 'hit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.23);
    } else if (type === 'score') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch {}
}

interface ObstacleItem {
  id: number;
  x: number;
  width: number;
  height: number;
  type: 'cactus_small' | 'cactus_double' | 'cactus_tall';
}

interface CloudItem {
  x: number;
  y: number;
  speed: number;
  scale: number;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 160;
const GROUND_Y = 126;
const DINO_X = 48;
const DINO_WIDTH = 34;
const DINO_HEIGHT = 38;
const GRAVITY = 0.65;
const JUMP_VEL = -9.2;

const DinoRunGame: React.FC<{ playClick: () => void; playCorrect?: () => void }> = ({ playClick, playCorrect }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kuis_dino_highscore');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [isGameOver, setIsGameOver] = useState(false);

  // Mutable refs for high performance 60fps loop
  const gameStateRef = useRef({
    dinoY: GROUND_Y - DINO_HEIGHT,
    velY: 0,
    isJumping: false,
    groundOffset: 0,
    obstacles: [] as ObstacleItem[],
    clouds: [
      { x: 100, y: 32, speed: 0.35, scale: 0.9 },
      { x: 320, y: 22, speed: 0.3, scale: 1.1 },
      { x: 500, y: 40, speed: 0.4, scale: 0.8 },
    ] as CloudItem[],
    frame: 0,
    score: 0,
    speed: 4.5,
    isGameOver: false,
    nextSpawnDistance: 200,
    obstacleIdSeq: 1,
  });

  const jump = useCallback(() => {
    const state = gameStateRef.current;
    if (state.isGameOver) return;
    if (!state.isJumping) {
      state.velY = JUMP_VEL;
      state.isJumping = true;
      playDinoAudio('jump');
      if (playClick) playClick();
    }
  }, [playClick]);

  const restartGame = useCallback(() => {
    const state = gameStateRef.current;
    state.dinoY = GROUND_Y - DINO_HEIGHT;
    state.velY = 0;
    state.isJumping = false;
    state.obstacles = [];
    state.score = 0;
    state.speed = 4.5;
    state.frame = 0;
    state.groundOffset = 0;
    state.isGameOver = false;
    state.nextSpawnDistance = 200;
    setIsGameOver(false);
    setScore(0);
    if (playClick) playClick();
  }, [playClick]);

  // Keyboard controls (Space, ArrowUp, KeyW)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Jangan cegah spasi jika siswa sedang mengetik pesan di kolom obrolan
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (gameStateRef.current.isGameOver) {
          restartGame();
        } else {
          jump();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [jump, restartGame]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const state = gameStateRef.current;

      if (!state.isGameOver) {
        state.frame++;

        // 1. Score & Speed Progression
        if (state.frame % 6 === 0) {
          state.score++;
          setScore(state.score);
          if (state.score % 100 === 0) {
            playDinoAudio('score');
            if (playCorrect) playCorrect();
          }
        }
        state.speed = Math.min(7.5, 4.5 + Math.floor(state.score / 50) * 0.25);

        // 2. Dino Physics
        state.dinoY += state.velY;
        state.velY += GRAVITY;
        const groundLimit = GROUND_Y - DINO_HEIGHT;
        if (state.dinoY >= groundLimit) {
          state.dinoY = groundLimit;
          state.velY = 0;
          state.isJumping = false;
        }

        // 3. Ground scrolling
        state.groundOffset += state.speed;

        // 4. Clouds movement
        for (const cl of state.clouds) {
          cl.x -= cl.speed;
          if (cl.x < -60) {
            cl.x = CANVAS_WIDTH + 20 + Math.random() * 40;
            cl.y = 18 + Math.random() * 32;
          }
        }

        // 5. Obstacles movement & spawn
        state.nextSpawnDistance -= state.speed;
        if (state.nextSpawnDistance <= 0) {
          const rand = Math.random();
          let type: 'cactus_small' | 'cactus_double' | 'cactus_tall' = 'cactus_small';
          let width = 20;
          let height = 28;

          if (rand < 0.45) {
            type = 'cactus_small';
            width = 18;
            height = 26;
          } else if (rand < 0.78) {
            type = 'cactus_tall';
            width = 22;
            height = 34;
          } else {
            type = 'cactus_double';
            width = 34;
            height = 26;
          }

          state.obstacles.push({
            id: state.obstacleIdSeq++,
            x: CANVAS_WIDTH + 10,
            width,
            height,
            type,
          });

          // Random gap to next obstacle (fair and playable)
          state.nextSpawnDistance = 210 + Math.random() * 150;
        }

        // Move obstacles
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
          const obs = state.obstacles[i];
          obs.x -= state.speed;

          // Remove off-screen obstacles
          if (obs.x + obs.width < -20) {
            state.obstacles.splice(i, 1);
            continue;
          }

          // 6. Collision Check (AABB with slight padding for fairness)
          const dinoBox = {
            x: DINO_X + 6,
            y: state.dinoY + 4,
            w: DINO_WIDTH - 11,
            h: DINO_HEIGHT - 6,
          };
          const cactusBox = {
            x: obs.x + 3,
            y: GROUND_Y - obs.height + 2,
            w: obs.width - 6,
            h: obs.height - 3,
          };

          if (
            dinoBox.x < cactusBox.x + cactusBox.w &&
            dinoBox.x + dinoBox.w > cactusBox.x &&
            dinoBox.y < cactusBox.y + cactusBox.h &&
            dinoBox.y + dinoBox.h > cactusBox.y
          ) {
            // Collision!
            state.isGameOver = true;
            setIsGameOver(true);
            playDinoAudio('hit');

            setHighScore((prevHigh) => {
              const finalScore = state.score;
              if (finalScore > prevHigh) {
                try {
                  localStorage.setItem('kuis_dino_highscore', finalScore.toString());
                } catch {}
                return finalScore;
              }
              return prevHigh;
            });
            break;
          }
        }
      }

      // --- RENDERING ---
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background Sky subtle tint
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (const cl of state.clouds) {
        ctx.beginPath();
        ctx.arc(cl.x, cl.y, 10 * cl.scale, 0, Math.PI * 2);
        ctx.arc(cl.x + 12 * cl.scale, cl.y - 4 * cl.scale, 14 * cl.scale, 0, Math.PI * 2);
        ctx.arc(cl.x + 24 * cl.scale, cl.y, 10 * cl.scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Ground
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
      ctx.stroke();

      // Scrolling Ground dashes
      ctx.fillStyle = '#475569';
      for (let x = -(state.groundOffset % 24); x < CANVAS_WIDTH; x += 24) {
        ctx.fillRect(x + 4, GROUND_Y + 4, 6, 1.5);
        ctx.fillRect(x + 15, GROUND_Y + 8, 3, 1.5);
        ctx.fillRect(x + 20, GROUND_Y + 5, 4, 1.5);
      }

      // Draw Obstacles (Cacti)
      for (const obs of state.obstacles) {
        const cactusY = GROUND_Y - obs.height;
        ctx.save();
        ctx.fillStyle = '#10b981';
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 1.5;

        if (obs.type === 'cactus_small') {
          const cx = obs.x + obs.width / 2;
          ctx.beginPath();
          ctx.roundRect(cx - 4, cactusY, 8, obs.height, 3);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.roundRect(cx - 9, cactusY + 7, 7, 4, 2);
          ctx.roundRect(cx - 9, cactusY + 3, 4, 8, 2);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.roundRect(cx + 2, cactusY + 11, 7, 4, 2);
          ctx.roundRect(cx + 5, cactusY + 7, 4, 8, 2);
          ctx.fill();
          ctx.stroke();
        } else if (obs.type === 'cactus_double') {
          for (let offset = 0; offset < 2; offset++) {
            const cx = obs.x + 8 + offset * 16;
            const h = offset === 0 ? obs.height : obs.height - 4;
            const cy = GROUND_Y - h;
            ctx.beginPath();
            ctx.roundRect(cx - 4, cy, 8, h, 3);
            ctx.fill();
            ctx.stroke();

            if (offset === 0) {
              ctx.beginPath();
              ctx.roundRect(cx - 7, cy + 6, 6, 3, 1.5);
              ctx.roundRect(cx - 7, cy + 2, 3, 7, 1.5);
              ctx.fill();
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.roundRect(cx + 2, cy + 7, 6, 3, 1.5);
              ctx.roundRect(cx + 5, cy + 3, 3, 7, 1.5);
              ctx.fill();
              ctx.stroke();
            }
          }
        } else {
          // Tall Cactus
          const cx = obs.x + obs.width / 2;
          ctx.beginPath();
          ctx.roundRect(cx - 5, cactusY, 10, obs.height, 4);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.roundRect(cx - 11, cactusY + 9, 8, 5, 2);
          ctx.roundRect(cx - 11, cactusY + 3, 5, 11, 2);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.roundRect(cx + 3, cactusY + 15, 8, 5, 2);
          ctx.roundRect(cx + 6, cactusY + 9, 5, 11, 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw Dino
      ctx.save();
      ctx.translate(DINO_X, state.dinoY);

      // Body & Head
      ctx.fillStyle = state.isGameOver ? '#f43f5e' : '#10b981';
      ctx.beginPath();
      ctx.roundRect(8, 12, 20, 20, 4);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(16, 2, 18, 14, 3);
      ctx.fill();

      // Tail
      ctx.beginPath();
      ctx.moveTo(8, 22);
      ctx.lineTo(0, 16);
      ctx.lineTo(8, 28);
      ctx.closePath();
      ctx.fill();

      // Arm
      ctx.fillStyle = state.isGameOver ? '#e11d48' : '#059669';
      ctx.fillRect(24, 20, 6, 3);
      ctx.fillRect(28, 20, 2, 6);

      // Back Spikes (cute yellow triangles)
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(8, 12);
      ctx.lineTo(4, 8);
      ctx.lineTo(12, 10);
      ctx.moveTo(14, 6);
      ctx.lineTo(12, 2);
      ctx.lineTo(18, 5);
      ctx.fill();

      // Eye
      if (state.isGameOver) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(22, 6);
        ctx.lineTo(26, 10);
        ctx.moveTo(26, 6);
        ctx.lineTo(22, 10);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(24, 8, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(25, 8, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Legs
      ctx.fillStyle = state.isGameOver ? '#e11d48' : '#047857';
      if (state.isJumping) {
        ctx.fillRect(10, 32, 4, 3);
        ctx.fillRect(14, 32, 4, 3);
      } else {
        const isStep1 = Math.floor(state.frame / 6) % 2 === 0;
        if (isStep1) {
          ctx.fillRect(12, 32, 4, 6);
          ctx.fillRect(12, 36, 6, 2);
          ctx.fillRect(20, 32, 4, 4);
        } else {
          ctx.fillRect(12, 32, 4, 4);
          ctx.fillRect(20, 32, 4, 6);
          ctx.fillRect(20, 36, 6, 2);
        }
      }
      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [playCorrect]);

  return (
    <div 
      onClick={() => {
        if (gameStateRef.current.isGameOver) {
          restartGame();
        } else {
          jump();
        }
      }}
      className="relative w-full bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 rounded-2xl border border-indigo-900/60 overflow-hidden select-none p-3 cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label="Mini-Game Dino Run - Ketuk untuk melompat"
    >
      {/* Header bar mini-game */}
      <div className="flex items-center justify-between text-xs font-bold text-emerald-300 z-10 relative">
        <span className="flex items-center gap-1.5">
          <Gamepad2 className="w-4 h-4 text-emerald-400" />
          <span>Mini-Game: Dino Run 🦖</span>
        </span>
        <div className="flex items-center gap-2">
          {highScore > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>Rekor: {highScore}m</span>
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
            🏃 {score}m
          </span>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 z-10 relative mt-0.5">
        Ketuk layar atau tekan <strong>Spasi</strong> untuk melompati rintangan kaktus!
      </p>

      {/* Canvas Game Area */}
      <div className="relative w-full mt-2 rounded-xl overflow-hidden bg-slate-950/80 border border-slate-800">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-36 sm:h-40 block"
        />

        {/* Game Over Overlay */}
        {isGameOver && (
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-2 z-20 animate-fade-in"
            onClick={(e) => {
              e.stopPropagation();
              restartGame();
            }}
          >
            <div className="text-center space-y-1">
              <span className="text-2xl">🦖💥</span>
              <h4 className="text-xs sm:text-sm font-black text-white">Ups, Dino Menabrak Kaktus!</h4>
              <p className="text-xs text-emerald-300 font-bold font-mono">Jarak Tempuh: {score} meter</p>
              {score >= highScore && score > 0 && (
                <p className="text-[10px] sm:text-[11px] text-amber-300 font-extrabold animate-bounce">
                  🎉 Rekor Terbaik Baru!
                </p>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  restartGame();
                }}
                className="mt-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md btn-press min-h-[44px] mx-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Lari Lagi (Spasi)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Mini-Game 2: Tebak Emoji Cerdas (Emoji Guess)
// -------------------------------------------------------------
const EMOJI_RIDDLES = [
  { clue: 'Hewan yang mempunyai belalai panjang dan telinga lebar:', answer: '🐘', options: ['🦁', '🐘', '🐬', '🦒'] },
  { clue: 'Benda langit yang bersinar di siang hari dan menghangatkan bumi:', answer: '☀️', options: ['🌙', '⭐', '☀️', '☁️'] },
  { clue: 'Buah berwarna merah dengan biji kecil di luar rasanya manis segar:', answer: '🍓', options: ['🍌', '🍓', '🍇', '🍉'] },
  { clue: 'Alat tulis untuk menggambar dan mencatat:', answer: '✏️', options: ['✂️', '✏️', '📏', '📎'] },
];

const EmojiGuessGame: React.FC<{ playClick: () => void; playCorrect?: () => void }> = ({ playClick, playCorrect }) => {
  const [riddleIndex, setRiddleIndex] = useState(0);
  const [solved, setSolved] = useState(false);
  const [points, setPoints] = useState(0);

  const curRiddle = EMOJI_RIDDLES[riddleIndex % EMOJI_RIDDLES.length];

  const handlePick = (opt: string) => {
    playClick();
    if (opt === curRiddle.answer) {
      if (playCorrect) playCorrect();
      setSolved(true);
      setPoints((p) => p + 15);
      setTimeout(() => {
        setSolved(false);
        setRiddleIndex((prev) => prev + 1);
      }, 900);
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-purple-950 via-slate-900 to-slate-950 rounded-2xl border border-purple-900/60 p-3 sm:p-4 space-y-2 select-none">
      <div className="flex items-center justify-between text-xs font-bold text-purple-300">
        <span className="flex items-center gap-1.5">
          <Gamepad2 className="w-4 h-4 text-purple-400" />
          <span>Mini-Game: Tebak Emoji Kilat!</span>
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
          🎯 {points} Poin
        </span>
      </div>

      <p className="text-xs sm:text-sm font-semibold text-white leading-snug">
        {curRiddle.clue}
      </p>

      <div className="grid grid-cols-4 gap-2 pt-1">
        {curRiddle.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handlePick(opt)}
            className={`p-2.5 rounded-xl border text-2xl sm:text-3xl flex items-center justify-center transition-all min-h-[50px] btn-press ${
              solved && opt === curRiddle.answer
                ? 'bg-emerald-500/30 border-emerald-400 ring-2 ring-emerald-400 animate-bounce'
                : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Component Utama: InterQuestionWaitingLounge
// -------------------------------------------------------------
export const InterQuestionWaitingLounge: React.FC<InterQuestionWaitingLoungeProps> = ({
  session: initialSession,
  questionIndex,
  totalQuestions,
  studentName,
  avatarId,
  earnedStars = 0,
  earnedScore = 0,
  onAdvanceToQuestion,
  onQuizFinished,
  playClick,
  playCorrect,
}) => {
  const [session, setSession] = useState<QuizSession>(initialSession);
  const [chatText, setChatText] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Penyesuaian tinggi textarea otomatis hingga 3 baris saat teks panjang (User Request & Rule 1)
  useEffect(() => {
    const el = chatInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const sh = el.scrollHeight;
    if (sh > 48) {
      el.style.height = `${Math.min(Math.max(sh, 88), 92)}px`;
    } else {
      el.style.height = '';
    }
  }, [chatText]);

  // Sync session and detect teacher advancing question
  useEffect(() => {
    const handleSync = (updated: QuizSession) => {
      if (updated.id === session.id || updated.pinCode === session.pinCode) {
        setSession(updated);

        // Synchronously advance or rewind when teacher updates currentQuestionIndex
        if (
          typeof updated.currentQuestionIndex === 'number' &&
          updated.currentQuestionIndex !== questionIndex &&
          updated.currentQuestionIndex >= 0
        ) {
          if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          onAdvanceToQuestion(updated.currentQuestionIndex);
        }

        // Quiz finished
        if (updated.status === 'finished') {
          onQuizFinished();
        }
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('kuis_realtime_session_sync');
        channel.onmessage = (e) => {
          if (e.data?.type === 'SESSION_UPDATED' && e.data.session) {
            handleSync(e.data.session);
          }
        };
      }
    } catch {}

    const handleCustom = (e: Event) => {
      const evt = e as CustomEvent;
      if (evt.detail?.session) {
        handleSync(evt.detail.session);
      }
    };
    window.addEventListener('kuis_session_updated', handleCustom);

    // Fallback polling (local + cloud sync)
    const interval = setInterval(async () => {
      const fresh = DataManager.getActiveSessionById(session.id);
      if (fresh) {
        handleSync(fresh);
      }
      try {
        const cloudFresh = await DataManager.fetchActiveSessionById(session.id);
        if (cloudFresh) {
          handleSync(cloudFresh);
        }
      } catch {}
    }, 1500);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('kuis_session_updated', handleCustom);
      clearInterval(interval);
    };
  }, [session.id, session.pinCode, questionIndex, onAdvanceToQuestion, onQuizFinished]);

  const handleSendChatMessage = async (textToSend: string) => {
    const clean = textToSend.trim();
    if (!clean) return;
    playClick();
    await DataManager.sendSessionChatMessage(session.id, {
      studentName,
      avatarId,
      text: clean,
    });
    setChatText('');
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const isChatMuted = Boolean(session.settings?.isChatMuted);
  const chatMessages = session.chatMessages || [];

  // Synchronized Mini-Game: All students at questionIndex play the same game
  const isEvenRound = questionIndex % 2 === 0;

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in select-none">
      
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
        
        {/* Top Header: Answer Saved Status */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Jawaban Soal #{questionIndex + 1} dari {totalQuestions} Tersimpan!</span>
            {earnedStars > 0 && <span className="ml-1 text-amber-300 font-black">+{earnedStars}⭐</span>}
            {earnedScore > 0 && <span className="ml-0.5 text-emerald-300 font-black">+{earnedScore}pts</span>}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            Santai Sejenak, {studentName}! 🌟
          </h2>
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Menunggu Guru Membuka Soal Berikutnya...</span>
          </div>
        </div>

        {/* Floating Live Reactions Overlay di Lounge Jeda Soal */}
        <QuizizzReactionOverlay sessionId={session.id} reactions={session.reactions} />

        {/* Bilah Reaksi Semangat Murid di Lounge Jeda Soal */}
        <div className="bg-slate-950/60 rounded-2xl p-2.5 border border-slate-800/80 flex flex-col items-center justify-center">
          <QuizizzReactionButtonRow
            sessionId={session.id}
            senderName={studentName}
            avatarId={avatarId}
            isTeacher={false}
            playClick={playClick}
            compact={true}
            title="Kirim Reaksi Semangat:"
          />
        </div>

        {/* Synchronized Mini-Game for this round */}
        {isEvenRound ? (
          <DinoRunGame playClick={playClick} playCorrect={playCorrect} />
        ) : (
          <EmojiGuessGame playClick={playClick} playCorrect={playCorrect} />
        )}

        {/* Live Chat Panel (Classroom Social) */}
        <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5 text-purple-400" />
              <span>Obrolan Kelas Jeda Soal</span>
            </span>
            {isChatMuted ? (
              <span className="text-amber-400 flex items-center gap-1">
                <VolumeX className="w-3 h-3" />
                <span>Dibungkam</span>
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <Volume2 className="w-3 h-3" />
                <span>Aktif</span>
              </span>
            )}
          </div>

          {/* Messages */}
          <div ref={chatScrollRef} className="max-h-36 overflow-y-auto space-y-2 text-xs pr-1">
            {chatMessages.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-2">Kirim reaksi semangat untuk teman-teman!</p>
            ) : (
              chatMessages.slice(-12).map((m) => {
                const isTeacher = Boolean(m.isTeacher);
                const isMe = !isTeacher && m.studentName.trim().toLowerCase() === studentName.trim().toLowerCase();
                const mAvatar = (m.avatarId && AVATAR_MAP[m.avatarId]) || (isTeacher ? '👨‍🏫' : '💬');

                // 1. Guru
                if (isTeacher) {
                  return (
                    <div key={m.id} className="flex flex-col items-start w-full my-0.5">
                      <div className="flex items-start gap-1.5 max-w-[90%] mr-auto">
                        <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs shadow-xs flex-shrink-0 mt-0.5 select-none">
                          {mAvatar}
                        </div>
                        <div className="bg-amber-950/70 border border-amber-500/50 border-l-2 border-l-amber-400 rounded-xl rounded-tl-xs p-2 text-amber-100 flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="font-black text-[11px] text-amber-300 truncate">{m.studentName}</span>
                            <span className="px-1 py-0.2 rounded text-[8px] font-black bg-amber-500 text-white">Guru 👑</span>
                          </div>
                          <p className="text-[11px] font-semibold break-words whitespace-pre-wrap leading-snug">{m.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                // 2. Diri Sendiri (Kamu)
                if (isMe) {
                  return (
                    <div key={m.id} className="flex flex-col items-end w-full my-0.5">
                      <div className="flex items-end justify-end gap-1 max-w-[85%] ml-auto">
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl rounded-tr-xs p-2 shadow-xs flex-1 min-w-0">
                          <div className="flex items-center justify-end gap-1 text-[9px] text-purple-200 font-bold mb-0.5">
                            <span className="bg-purple-800/60 px-1 py-0.2 rounded text-[8px] uppercase">Kamu</span>
                            <span>{mAvatar}</span>
                          </div>
                          <p className="text-[11px] font-medium break-words whitespace-pre-wrap leading-snug text-white">{m.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                // 3. Teman
                return (
                  <div key={m.id} className="flex flex-col items-start w-full my-0.5">
                    <div className="flex items-start justify-start gap-1.5 max-w-[85%] mr-auto">
                      <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 select-none">
                        {mAvatar}
                      </div>
                      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl rounded-tl-xs p-2 text-slate-200 flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="font-bold text-[10px] text-indigo-400 truncate">{m.studentName}</span>
                          <span className="text-[8px] font-bold px-1 rounded bg-slate-800 text-slate-400">Teman</span>
                        </div>
                        <p className="text-[11px] font-normal break-words whitespace-pre-wrap leading-snug text-slate-200">{m.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Obrolan Santai Input */}
          {!isChatMuted && (
            <div className="pt-1">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
                className="flex items-end gap-1.5"
              >
                <textarea
                  ref={chatInputRef}
                  rows={1}
                  maxLength={120}
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (e.nativeEvent.isComposing) return;
                      if (isDesktopDevice()) {
                        if (!e.shiftKey) {
                          e.preventDefault();
                          if (chatText.trim()) {
                            handleSendChatMessage(chatText);
                          }
                        }
                      } else {
                        e.stopPropagation();
                      }
                    }
                  }}
                  placeholder={
                    isDesktopDevice()
                      ? 'Ketik komentar santai (Enter kirim, Shift+Enter baris baru)...'
                      : 'Ketik komentar santai...'
                  }
                  className="flex-1 px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500 min-h-[44px] max-h-24 resize-none leading-relaxed overflow-y-auto"
                />
                <button
                  type="button"
                  disabled={!chatText.trim()}
                  onClick={() => handleSendChatMessage(chatText)}
                  className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center btn-press flex-shrink-0 mb-0.5"
                  aria-label="Kirim Pesan"
                  title="Kirim Pesan"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
