// Shared Singleton Audio Engine for Kuis Interaktif
// Provides unified AudioContext, hardware pre-warming (silent unlock), and background tab management.
// Specially hardened for low-end mobile hardware, custom ROMs, and aggressive browser autoplay policies.

let sharedAudioContext: AudioContext | null = null;
let isAudioUnlocked = false;

export function isAudioHardwareUnlocked(): boolean {
  return isAudioUnlocked;
}

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!sharedAudioContext) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (AudioCtx) {
      try {
        // Mode latency interactive untuk performa mulus di low-end CPU
        sharedAudioContext = new AudioCtx({ latencyHint: 'interactive' });
      } catch {
        try {
          sharedAudioContext = new AudioCtx();
        } catch (err) {
          console.warn('Gagal menginisialisasi AudioContext:', err);
        }
      }
    }
  }

  if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }

  return sharedAudioContext;
}

export function unlockAudioContext(): void {
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      isAudioUnlocked = true;
    }).catch(() => {});
  } else if (ctx.state === 'running') {
    isAudioUnlocked = true;
  }

  // Pre-warm hardware dengan 1 sampel hening menggunakan sampleRate perangkat asli
  // Hindari hardcode 22050 yang memicu crash pada ALSA / chip audio murah
  try {
    const sampleRate = ctx.sampleRate || 44100;
    const buffer = ctx.createBuffer(1, 1, sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {}
}

export function ensureAudioRunning(): Promise<boolean> {
  const ctx = getSharedAudioContext();
  if (!ctx) return Promise.resolve(false);
  if (ctx.state === 'running') return Promise.resolve(true);

  return ctx.resume().then(() => {
    isAudioUnlocked = true;
    return true;
  }).catch(() => false);
}

export function setupAudioAutoUnlock(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleInteraction = () => {
    unlockAudioContext();
  };

  // Jangan lepas event listener terlalu cepat di Android low-end; biarkan aktif untuk menjaga status context
  window.addEventListener('pointerdown', handleInteraction, { capture: true, passive: true });
  window.addEventListener('touchstart', handleInteraction, { capture: true, passive: true });
  window.addEventListener('keydown', handleInteraction, { capture: true, passive: true });
  window.addEventListener('click', handleInteraction, { capture: true, passive: true });

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
        sharedAudioContext.resume().catch(() => {});
      }
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.removeEventListener('pointerdown', handleInteraction, true);
    window.removeEventListener('touchstart', handleInteraction, true);
    window.removeEventListener('keydown', handleInteraction, true);
    window.removeEventListener('click', handleInteraction, true);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
