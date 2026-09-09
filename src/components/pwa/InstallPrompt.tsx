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
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-white text-slate-900 p-4 rounded-2xl shadow-xl border border-slate-200 flex items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-slate-900 leading-tight">Pasang Kuis SD Seru</h4>
          <p className="text-xs text-slate-500 mt-0.5">Akses cepat & belajar tanpa ribet browser</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded-xl text-xs shadow-sm transition-colors active:scale-95 flex items-center gap-1 min-h-[40px]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Pasang</span>
        </button>
        <button
          onClick={handleClose}
          className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Tutup promosi instalasi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
