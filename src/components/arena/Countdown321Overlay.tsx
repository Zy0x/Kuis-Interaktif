import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Sparkles } from 'lucide-react';

interface Countdown321OverlayProps {
  questionNumber: number;
  totalQuestions: number;
  onComplete: () => void;
  isMuted?: boolean;
}

// Audio synthesizer ringkas menggunakan Web Audio API tanpa ketergantungan file eksternal (Rule 6, Rule 7)
function playCountdownTone(step: number, isMuted: boolean) {
  if (isMuted) return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    if (step > 0) {
      // Step 3, 2, 1: Beep teratur dengan nada menaik
      const freq = step === 3 ? 520 : step === 2 ? 650 : 780;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } else {
      // Step 0 ("MULAI!"): Fanfare 2-nada ceria
      [880, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);

        gain.gain.setValueAtTime(0.18, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.04);
        osc.stop(now + 0.38);
      });
    }
  } catch {
    // Audio fallback aman
  }
}

export const Countdown321Overlay: React.FC<Countdown321OverlayProps> = ({
  questionNumber,
  totalQuestions,
  onComplete,
  isMuted = false,
}) => {
  const [count, setCount] = useState<number>(3);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const playedTonesRef = useRef<Set<number>>(new Set());

  const handleFinish = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true;
      onCompleteRef.current();
    }
  }, []);

  useEffect(() => {
    const startTime = Date.now();

    // Bunyikan nada pertama untuk angka 3
    if (!playedTonesRef.current.has(3)) {
      playedTonesRef.current.add(3);
      playCountdownTone(3, isMutedRef.current);
    }

    // Interval presisi 50ms berbasis selisih waktu nyata (wall-clock timestamp)
    // Anti macet: tidak terpengaruh re-render parent ataupun pembatalan effect
    const interval = setInterval(() => {
      if (completedRef.current) {
        clearInterval(interval);
        return;
      }

      const elapsed = Date.now() - startTime;

      if (elapsed >= 3600) {
        clearInterval(interval);
        handleFinish();
      } else if (elapsed >= 3000) {
        setCount(0); // 0 = "MULAI!"
        if (!playedTonesRef.current.has(0)) {
          playedTonesRef.current.add(0);
          playCountdownTone(0, isMutedRef.current);
        }
      } else if (elapsed >= 2000) {
        setCount(1);
        if (!playedTonesRef.current.has(1)) {
          playedTonesRef.current.add(1);
          playCountdownTone(1, isMutedRef.current);
        }
      } else if (elapsed >= 1000) {
        setCount(2);
        if (!playedTonesRef.current.has(2)) {
          playedTonesRef.current.add(2);
          playCountdownTone(2, isMutedRef.current);
        }
      }
    }, 50);

    // Batas aman: jika setelah 4.5 detik belum selesai, paksa selesai agar tidak pernah memblokir kuis
    const safetyTimeout = setTimeout(() => {
      clearInterval(interval);
      handleFinish();
    }, 4500);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimeout);
    };
  }, [handleFinish]);

  return (
    <div
      className="fixed inset-0 z-50 w-full h-full h-[100dvh] flex flex-col items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Hitung mundur sebelum soal dimulai"
    >
      <div className="flex flex-col items-center justify-center text-center max-w-sm sm:max-w-md w-full space-y-6">
        
        {/* Pill Nomor Soal */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-slate-200 text-xs sm:text-sm font-black shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>SOAL {questionNumber} DARI {totalQuestions}</span>
        </div>

        {/* Lingkaran Countdown Angka / Mulai */}
        <div className="relative flex items-center justify-center w-36 h-36 sm:w-44 sm:h-44">
          {/* Efek Ping Ring */}
          <div
            key={`pulse-${count}`}
            className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
              count === 3
                ? 'bg-amber-500'
                : count === 2
                ? 'bg-blue-500'
                : count === 1
                ? 'bg-purple-500'
                : 'bg-emerald-500'
            }`}
            style={{ animationDuration: '0.9s' }}
          />

          {/* Lingkaran Utama */}
          <div
            key={`circle-${count}`}
            className={`w-full h-full rounded-full flex items-center justify-center shadow-2xl border-4 transition-all duration-300 animate-scale-up ${
              count === 3
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-amber-500/30'
                : count === 2
                ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-blue-500/30'
                : count === 1
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-purple-500/30'
                : 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-emerald-500/40 scale-110'
            }`}
          >
            {count > 0 ? (
              <span className="text-7xl sm:text-8xl font-black font-mono tracking-tighter drop-shadow-md">
                {count}
              </span>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-3xl sm:text-4xl font-black tracking-wider text-emerald-300 drop-shadow-lg animate-bounce">
                  MULAI! 🚀
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Teks Petunjuk Interaktif */}
        <div className="space-y-1.5 px-2">
          <h3 className="text-base sm:text-lg font-black text-white">
            {count > 0 ? 'Bersiaplah!' : 'Selamat Mengerjakan!'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            {count > 0
              ? 'Soal akan segera dibuka untuk seluruh kelas serentak.'
              : 'Baca pertanyaan dengan teliti dan pilih jawaban terbaikmu!'}
          </p>
        </div>

        {/* Tombol Lewati untuk Aksesibilitas & Responsivitas Cepat (Rule 1, Rule 2, Rule 8) */}
        <button
          type="button"
          onClick={handleFinish}
          className="text-xs font-semibold text-slate-400 hover:text-white underline underline-offset-4 opacity-75 hover:opacity-100 transition-opacity min-h-[44px] px-4 py-2"
          aria-label="Lewati hitung mundur langsung ke soal"
        >
          Lewati Hitung Mundur →
        </button>

      </div>
    </div>
  );
};
