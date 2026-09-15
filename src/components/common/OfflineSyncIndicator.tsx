import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, X } from 'lucide-react';
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

  // Auto-flush saat halaman dibuka jika online dan ada antrean tertunda
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine && supabase && offlineQueue.getPendingCount() > 0) {
      offlineQueue.flushQueue(supabase).then(({ success }) => {
        if (success > 0) {
          setJustSynced(true);
          setTimeout(() => setJustSynced(false), 3000);
        }
      });
    }
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

  const queue = offlineQueue.getQueue();
  const hasActualAnswers = queue.some(
    (item) => item.type === 'quiz_attempt_insert' || Object.keys(item.payload?.answers || {}).length > 0
  );
  const syncLabel = hasActualAnswers ? 'jawaban' : 'data sesi';

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
            <span className="truncate">Data berhasil disinkronkan ke server!</span>
          </>
        ) : !isOnline ? (
          <>
            <WifiOff className="w-4 h-4 shrink-0 text-amber-200" />
            <div className="min-w-0 flex-1">
              <span className="block truncate">Sinyal terputus • {syncLabel} tersimpan lokal</span>
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
            <div className="min-w-0 flex-1">
              <span className="block truncate">
                {isSyncing ? 'Menyinkronkan ke server...' : `${pendingCount} ${syncLabel} menunggu sync`}
              </span>
              <span className="text-[10px] font-normal text-blue-200 block truncate">
                Ketuk untuk menyinkronkan sekarang
              </span>
            </div>
          </>
        )}

        {/* Tombol Tutup & Bersihkan Antrean Basi */}
        {!justSynced && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              offlineQueue.clearQueue();
              setPendingCount(0);
            }}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0 ml-auto"
            title="Tutup & Bersihkan Antrean"
            aria-label="Tutup & Bersihkan Antrean"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
};