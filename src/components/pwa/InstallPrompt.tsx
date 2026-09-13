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
    const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');

    // Periksa apakah event prompt sudah tertangkap sebelumnya oleh index.html
    const existingPrompt = (window as any).__deferredInstallPrompt;
    if (existingPrompt) {
      setDeferredPrompt(existingPrompt as BeforeInstallPromptEvent);
      if (!isDismissed) {
        setIsVisible(true);
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      (window as any).__deferredInstallPrompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    const handleCustomEvent = (e: any) => {
      if (e.detail) {
        setDeferredPrompt(e.detail as BeforeInstallPromptEvent);
        if (!isDismissed) {
          setIsVisible(true);
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('pwa-installable', handleCustomEvent);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('pwa-installable', handleCustomEvent);
    };
  }, []);

  const handleInstall = async () => {
    const promptEvent = deferredPrompt || (window as any).__deferredInstallPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setIsVisible(false);
      sessionStorage.setItem('pwa_prompt_dismissed', 'true');
    }
    setDeferredPrompt(null);
    (window as any).__deferredInstallPrompt = null;
  };

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };


  if (!isVisible) return null;

  return (
    <div className="fixed bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2.5 xs:p-3 sm:p-4 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2 sm:gap-3 animate-fade-in pb-[max(env(safe-area-inset-bottom),0.625rem)] sm:pb-4">
      <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate">Pasang Kuis Seru</h4>
          <p className="text-[10px] xs:text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">Akses instan & belajar tanpa ribet browser</p>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="px-2.5 xs:px-3 py-1.5 xs:py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 sm:gap-1.5 shadow-sm transition-colors min-h-[44px] btn-press"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Pasang</span>
        </button>
        <button
          onClick={handleClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Tutup Banner Install"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
