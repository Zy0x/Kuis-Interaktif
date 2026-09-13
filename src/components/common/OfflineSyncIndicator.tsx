import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { offlineQueue } from '../../lib/offlineQueue';
import { supabase } from '../../lib/supabaseClient';

export const OfflineSyncIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (supabase) {
        offlineQueue.flushQueue(supabase).then(({ success }) => {
          if (success > 0) {
            setJustSynced(true);
            setTimeout(() => setJustSynced(false), 3000);
          }
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = offlineQueue.subscribe((count, syncing) => {
      setPendingCount(count);
      setIsSyncing(syncing);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const handleManualSync = () => {
    if (isOnline && supabase && !isSyncing) {
      offlineQueue.flushQueue(supabase).then(({ success }) => {
        if (success > 0) {
          setJustSynced(true);
          setTimeout(() => setJustSynced(false), 3000);
        }
      });
    }
  };

  // Jangan tampilkan apa-apa jika online dan tidak ada antrean tertunda
  if (isOnline && pendingCount === 0 && !justSynced) {
    return null;
  }

  return (
    <aside 
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] max-w-[92vw] sm:max-w-md animate-fade-in pointer-events-auto"
    >
      <div 
        onClick={handleManualSync}
        className={`px-3.5 py-2 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold transition-all min-h-[44px] cursor-pointer select-none ${
          justSynced
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
            : !isOnline
            ? 'bg-amber-600 text-white border-amber-500 shadow-amber-500/20'
            : 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
        }`}
      >
        {justSynced ? (
          <>
            <CheckCircle2 className="w-4 h-4 shrink-0 text-white animate-bounce-soft" />
            <span className="truncate">Jawaban berhasil tersinkronkan ke server!</span>
          </>
        ) : !isOnline ? (
          <>
            <WifiOff className="w-4 h-4 shrink-0 text-amber-200" />
            <div className="min-w-0">
              <span className="block truncate">Sinyal terputus • Jawaban tersimpan lokal</span>
              {pendingCount > 0 && (
                <span className="text-[10px] font-normal text-amber-200 block truncate">
                  {pendingCount} data tersimpan aman di perangkat
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <RefreshCw className={`w-4 h-4 shrink-0 text-white ${isSyncing ? 'animate-spin' : ''}`} />
            <div className="min-w-0">
              <span className="block truncate">
                {isSyncing ? 'Menyinkronkan ke server...' : `${pendingCount} jawaban menunggu sync`}
              </span>
              <span className="text-[10px] font-normal text-blue-200 block truncate">
                Ketuk untuk menyinkronkan sekarang
              </span>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};