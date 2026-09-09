import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  playClick?: () => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isDark,
  onToggle,
  playClick,
  className = '',
}) => {
  const handleClick = () => {
    if (playClick) playClick();
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2.5 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center btn-press border ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-750 text-amber-300 border-slate-700 shadow-sm'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80 shadow-xs'
      } ${className}`}
      title={isDark ? 'Ganti ke Mode Terang (Siang)' : 'Ganti ke Mode Gelap (Malam)'}
      aria-label={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-300 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-600 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
};
