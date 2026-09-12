import React, { useState, useEffect, useRef } from 'react';
import type { QuizSession } from '../../types/quiz';
import { DataManager } from '../../lib/supabaseClient';
import { 
  Send, 
  MessageCircle, 
  Gamepad2, 
  VolumeX, 
  Volume2, 
  CheckCircle2
} from 'lucide-react';

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
// Mini-Game 1: Tangkap Bintang Ceria (Star Catcher)
// -------------------------------------------------------------
interface StarItem {
  id: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  emoji: string;
}

const STAR_EMOJIS = ['⭐', '🌟', '✨', '💫', '🎈'];

const StarCatcherGame: React.FC<{ playClick: () => void; playCorrect?: () => void }> = ({ playClick, playCorrect }) => {
  const [stars, setStars] = useState<StarItem[]>([]);
  const [funScore, setFunScore] = useState(0);

  useEffect(() => {
    // Spawn initial stars
    const initial: StarItem[] = Array.from({ length: 4 }).map((_, idx) => ({
      id: 'star_' + Date.now() + '_' + idx,
      x: 10 + Math.random() * 80,
      y: 15 + Math.random() * 65,
      size: 32 + Math.floor(Math.random() * 16),
      speed: 1 + Math.random() * 1.5,
      emoji: STAR_EMOJIS[Math.floor(Math.random() * STAR_EMOJIS.length)],
    }));
    setStars(initial);

    // Float interval
    const interval = setInterval(() => {
      setStars((prev) =>
        prev.map((s) => {
          let newY = s.y - s.speed;
          let newX = s.x + (Math.random() * 2 - 1);
          if (newY < 5) {
            newY = 85;
            newX = 10 + Math.random() * 80;
          }
          return { ...s, y: newY, x: Math.max(5, Math.min(90, newX)) };
        })
      );
    }, 120);

    return () => clearInterval(interval);
  }, []);

  const handleCatchStar = (id: string) => {
    if (playCorrect) playCorrect();
    else playClick();
    setFunScore((prev) => prev + 10);
    setStars((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              y: 85,
              x: 10 + Math.random() * 80,
              emoji: STAR_EMOJIS[Math.floor(Math.random() * STAR_EMOJIS.length)],
            }
          : s
      )
    );
  };

  return (
    <div className="relative w-full h-48 sm:h-56 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 rounded-2xl border border-indigo-900/60 overflow-hidden select-none p-3">
      {/* Header bar mini-game */}
      <div className="flex items-center justify-between text-xs font-bold text-indigo-300 z-10 relative">
        <span className="flex items-center gap-1.5">
          <Gamepad2 className="w-4 h-4 text-amber-400" />
          <span>Mini-Game: Tangkap Bintang Mengambang!</span>
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
          ⭐ {funScore} Poin
        </span>
      </div>

      <p className="text-[11px] text-slate-400 z-10 relative mt-0.5">
        Ketuk bintang atau balon yang mengambang untuk mengumpulkan poin santai.
      </p>

      {/* Floating Stars */}
      {stars.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => handleCatchStar(s.id)}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all active:scale-125 cursor-pointer text-3xl select-none hover:opacity-90"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            fontSize: `${s.size}px`,
          }}
          aria-label="Tangkap Bintang"
        >
          {s.emoji}
        </button>
      ))}
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
const FLOATING_REACTIONS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Semangat' },
  { emoji: '⭐', label: 'Bintang' },
  { emoji: '👏', label: 'Tepuk Tangan' },
  { emoji: '🎉', label: 'Pesta' },
];

const PRESET_MESSAGES = [
  'Mantap! 🎉',
  'Semangat lanjut! 💪',
  'Soalnya seru! ⭐',
  'Bismillah 100! 🎯',
];

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
  const [floatingBubbles, setFloatingBubbles] = useState<
    { id: string; emoji: string; left: number }[]
  >([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Sync session and detect teacher advancing question
  useEffect(() => {
    const handleSync = (updated: QuizSession) => {
      if (updated.id === session.id || updated.pinCode === session.pinCode) {
        setSession(updated);

        // Check if session finished
        if (updated.status === 'finished') {
          onQuizFinished();
          return;
        }

        // Check if teacher advanced to a newer question!
        if (
          typeof updated.currentQuestionIndex === 'number' &&
          updated.currentQuestionIndex > questionIndex
        ) {
          onAdvanceToQuestion(updated.currentQuestionIndex);
        }
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('kuis_realtime_session_sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'SESSION_UPDATED' && event.data.session) {
            handleSync(event.data.session);
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

    const interval = setInterval(() => {
      const fresh = DataManager.getActiveSessionById(session.id);
      if (fresh) {
        handleSync(fresh);
      }
    }, 1500);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('kuis_session_updated', handleCustom);
      clearInterval(interval);
    };
  }, [session.id, session.pinCode, questionIndex, onAdvanceToQuestion, onQuizFinished]);

  const triggerBubble = (emoji: string) => {
    const newBubble = {
      id: 'bubble_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      emoji,
      left: Math.floor(15 + Math.random() * 70),
    };
    setFloatingBubbles((prev) => [...prev, newBubble]);
    setTimeout(() => {
      setFloatingBubbles((prev) => prev.filter((b) => b.id !== newBubble.id));
    }, 2200);
  };

  const handleSendReaction = async (emoji: string) => {
    playClick();
    triggerBubble(emoji);
    await DataManager.sendSessionReaction(session.id, {
      studentName,
      avatarId,
      emoji,
    });
  };

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
      
      {/* Floating Bubbles Layer */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingBubbles.map((b) => (
          <div
            key={b.id}
            className="absolute bottom-16 text-3xl sm:text-4xl animate-float-up opacity-90 drop-shadow-md"
            style={{ left: `${b.left}%` }}
          >
            {b.emoji}
          </div>
        ))}
      </div>

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

        {/* Synchronized Mini-Game for this round */}
        {isEvenRound ? (
          <StarCatcherGame playClick={playClick} playCorrect={playCorrect} />
        ) : (
          <EmojiGuessGame playClick={playClick} playCorrect={playCorrect} />
        )}

        {/* Quick Reactions Bar */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {FLOATING_REACTIONS.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => handleSendReaction(r.emoji)}
                className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xl transition-transform active:scale-90 min-h-[44px] min-w-[44px] flex items-center justify-center btn-press shadow-sm"
                title={r.label}
                aria-label={r.label}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Live Chat Box */}
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
          <div ref={chatScrollRef} className="max-h-24 overflow-y-auto space-y-1.5 text-xs pr-1">
            {chatMessages.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-2">Kirim reaksi semangat untuk teman-teman!</p>
            ) : (
              chatMessages.slice(-8).map((m) => {
                const isMe = m.studentName.trim().toLowerCase() === studentName.trim().toLowerCase();
                return (
                  <div
                    key={m.id}
                    className={`p-1.5 rounded-lg text-[11px] ${
                      isMe
                        ? 'bg-purple-950/50 text-purple-200 border border-purple-800/50'
                        : 'bg-slate-800/70 text-slate-200'
                    }`}
                  >
                    <span className="font-bold text-slate-400 mr-1.5">{m.studentName}:</span>
                    <span>{m.text}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Preset Buttons & Input */}
          {!isChatMuted && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                {PRESET_MESSAGES.map((msg) => (
                  <button
                    key={msg}
                    type="button"
                    onClick={() => handleSendChatMessage(msg)}
                    className="px-2 py-0.5 rounded-lg bg-purple-900/30 text-purple-300 text-[10px] font-bold border border-purple-800/40 whitespace-nowrap hover:bg-purple-900/60 min-h-[28px]"
                  >
                    {msg}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage(chatText);
                }}
                className="flex items-center gap-1"
              >
                <input
                  type="text"
                  maxLength={80}
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Ketik komentar santai..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500 min-h-[36px]"
                />
                <button
                  type="submit"
                  disabled={!chatText.trim()}
                  className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold disabled:opacity-40 min-h-[36px] min-w-[36px] flex items-center justify-center btn-press"
                  aria-label="Kirim"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
