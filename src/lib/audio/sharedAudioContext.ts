// Shared Singleton Audio Engine for Kuis Interaktif
// Provides unified AudioContext, hardware pre-warming (silent unlock), and background tab management.

let sharedAudioContext: AudioContext | null = null;
let isAudioUnlocked = false;

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!sharedAudioContext) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (AudioCtx) {
      try {
        sharedAudioContext = new AudioCtx();
      } catch (err) {
        console.warn('Gagal menginisialisasi AudioContext:', err);
      }
    }
  }

  if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }

  return sharedAudioContext;
}

export function unlockAudioContext() {
  if (isAudioUnlocked) return;

  const ctx = getSharedAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      isAudioUnlocked = true;
    }).catch(() => {});
  } else if (ctx.state === 'running') {
    isAudioUnlocked = true;
  }

  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {}
}

export function setupAudioAutoUnlock() {
  if (typeof window === 'undefined') return () => {};

  const handleFirstInteraction = () => {
    unlockAudioContext();
    removeListeners();
  };

  const removeListeners = () => {
    window.removeEventListener('pointerdown', handleFirstInteraction, true);
    window.removeEventListener('touchstart', handleFirstInteraction, true);
    window.removeEventListener('keydown', handleFirstInteraction, true);
    window.removeEventListener('click', handleFirstInteraction, true);
  };

  window.addEventListener('pointerdown', handleFirstInteraction, { capture: true, passive: true });
  window.addEventListener('touchstart', handleFirstInteraction, { capture: true, passive: true });
  window.addEventListener('keydown', handleFirstInteraction, { capture: true, passive: true });
  window.addEventListener('click', handleFirstInteraction, { capture: true, passive: true });

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
        sharedAudioContext.resume().catch(() => {});
      }
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    removeListeners();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
