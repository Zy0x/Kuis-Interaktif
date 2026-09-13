import React, { useState, useEffect } from 'react';
import { RotateCw, X } from 'lucide-react';

export const ReorientationOverlay: React.FC = () => {
  const [isLandscapeOnSmallScreen, setIsLandscapeOnSmallScreen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('pwa_orientation_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const checkOrientation = () => {
      // Deteksi landscape baik via screen.orientation maupun dimensi window
      const isLandscapeApi = window.screen?.orientation?.type
        ? window.screen.orientation.type.includes('landscape')
        : false;
      const isLandscapeDimensions = window.innerWidth > window.innerHeight;
      const isLandscape = isLandscapeApi || isLandscapeDimensions;

      // Ponsel atau layar kompak: tinggi vertikal terbatas (< 540px) pada rasio lebar 16:9, 19.5:9, hingga 21:9 (1080x2460 dsb)
      const isConstrainedMobile = window.innerHeight < 540 && window.innerWidth < 1100;
      setIsLandscapeOnSmallScreen(isLandscape && isConstrainedMobile);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    window.screen?.orientation?.addEventListener?.('change', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      window.screen?.orientation?.removeEventListener?.('change', checkOrientation);
    };
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('pwa_orientation_dismissed', 'true');
    } catch {}
  };

  const handleRequestPortrait = async () => {
    try {
      if ('orientation' in window.screen && (window.screen.orientation as any).lock) {
        await (window.screen.orientation as any).lock('portrait');
      }
    } catch {
      // Browser mungkin membutuhkan gesture fullscreen
    }
  };

  if (!isLandscapeOnSmallScreen || isDismissed) return null;

  return (
    <div className="fixed bottom-3 right-3 left-3 z-40 bg-slate-900/95 text-white p-3 sm:p-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-slate-700/60 animate-fade-in pb-[max(env(safe-area-inset-bottom),0.75rem)]">
      <div 
        onClick={handleRequestPortrait}
        className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
      >
        <div className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl animate-wiggle shrink-0 transition-colors">
          <RotateCw className="w-5 h-5 text-white" />
        </div>
        <div className="text-xs sm:text-sm min-w-0">
          <p className="font-bold text-amber-300 truncate">Tips Tampilan Layar</p>
          <p className="text-slate-200 text-[11px] sm:text-xs leading-tight line-clamp-2">
            Gunakan posisi tegak (portrait) untuk kenyamanan optimal membaca soal.
          </p>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors shrink-0 ml-2"
        aria-label="Tutup saran orientasi"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

