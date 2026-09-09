import React, { useEffect, useState } from 'react';
import { Download, Sparkles, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt banner after 3 seconds on first visit
      const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-40 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3.5 rounded-3xl shadow-2xl border-2 border-white/30 flex items-center justify-between gap-3 animate-pop-in">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-amber-400 rounded-2xl flex items-center justify-center text-slate-900 text-xl font-bold shadow-md">
          <Sparkles className="w-6 h-6 text-slate-900" />
        </div>
        <div>
          <h4 className="font-extrabold text-sm sm:text-base leading-tight">Pasang Kuis SD Seru</h4>
          <p className="text-xs text-blue-100">Buka kuis lebih cepat tanpa lewat browser!</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleInstall}
          className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold px-3.5 py-2 rounded-2xl text-xs sm:text-sm shadow-md transition-transform active:scale-95 flex items-center gap-1 min-h-[44px]"
        >
          <Download className="w-4 h-4" />
          <span>Pasang</span>
        </button>
        <button
          onClick={handleClose}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-white/80 hover:text-white"
          aria-label="Tutup promosi instalasi"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
