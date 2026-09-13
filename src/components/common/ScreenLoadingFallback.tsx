import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface ScreenLoadingFallbackProps {
  message?: string;
  isDark?: boolean;
}

export const ScreenLoadingFallback: React.FC<ScreenLoadingFallbackProps> = ({
  message = 'Memuat ruang kuis...',
  isDark = false,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`min-h-screen w-full flex flex-col items-center justify-center p-4 select-none transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <div className="flex flex-col items-center gap-4 max-w-sm text-center animate-fade-in">
        {/* Animated Icon Box */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-500/10 dark:bg-blue-400/15 border border-blue-500/20 flex items-center justify-center shadow-inner">
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400 animate-spin" />
          <Sparkles className="w-4 h-4 text-amber-500 absolute top-2 right-2 animate-bounce" />
        </div>

        {/* Loading Text */}
        <div className="space-y-1">
          <p className="text-base sm:text-lg font-black tracking-tight text-slate-800 dark:text-slate-100">
            {message}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Kuis Interaktif Seru • Sedang menyiapkan modul
          </p>
        </div>
      </div>
    </div>
  );
};
