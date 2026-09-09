import React, { useState, useEffect } from 'react';
import { RotateCw, X } from 'lucide-react';

export const ReorientationOverlay: React.FC = () => {
  const [isLandscapeOnSmallScreen, setIsLandscapeOnSmallScreen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // If height is very small (< 500px) and width is larger, it's landscape on a phone
      const isLandscape = window.innerWidth > window.innerHeight;
      const isShortMobile = window.innerHeight < 520 && window.innerWidth < 1000;
      setIsLandscapeOnSmallScreen(isLandscape && isShortMobile);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isLandscapeOnSmallScreen || isDismissed) return null;

  return (
    <div className="fixed bottom-3 right-3 left-3 z-40 bg-slate-900/90 backdrop-blur-sm text-white p-3 rounded-2xl shadow-xl flex items-center justify-between border border-white/20 animate-pop-in">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500 rounded-xl animate-wiggle">
          <RotateCw className="w-5 h-5 text-white" />
        </div>
        <div className="text-xs sm:text-sm">
          <p className="font-bold text-amber-300">Tips Tampilan Nyaman</p>
          <p className="text-slate-200">Gunakan posisi tegak (portrait) untuk pengalaman menjawab yang lebih lega.</p>
        </div>
      </div>
      <button
        onClick={() => setIsDismissed(true)}
        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
        aria-label="Tutup saran orientasi"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
