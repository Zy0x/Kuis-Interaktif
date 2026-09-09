import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        onFinish();
      }, 350); // Fade out duration
    }, 1400);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-blue-600 via-indigo-600 to-sky-500 text-white transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center text-center px-6 animate-pop-in">
        {/* Playful Animated Logo */}
        <div className="relative mb-6">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-white p-3 shadow-2xl animate-bounce-soft flex items-center justify-center">
            <span className="text-6xl sm:text-7xl select-none">⭐</span>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-900 text-xs sm:text-sm font-black px-3 py-1 rounded-full shadow-lg border-2 border-white">
            Kelas 1 - 6
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md mb-2">
          Kuis Seru
        </h1>
        <p className="text-blue-100 font-semibold text-base sm:text-lg max-w-xs mb-8">
          Belajar Pintar, Asyik, dan Menyenangkan! 🎒
        </p>

        {/* Loading Pill */}
        <div className="w-48 h-3 bg-blue-400/50 rounded-full overflow-hidden p-0.5 border border-white/30">
          <div className="h-full bg-amber-300 rounded-full animate-pulse-glow" style={{ width: '80%' }} />
        </div>
        <span className="text-xs text-blue-100/80 font-medium mt-3">Menyiapkan Arena Kuis...</span>
      </div>
    </div>
  );
};
