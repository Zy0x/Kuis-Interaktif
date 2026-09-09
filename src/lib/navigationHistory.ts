// Navigation History & Hierarchical Back Gesture Manager
// Menangani gestur usap layar sentuh, mouse back button, keyboard Escape, dan popstate browser
import { useEffect, useRef } from 'react';

type BackHandler = () => boolean;

interface RegisteredHandler {
  id: string;
  priority: number;
  handler: BackHandler;
}

class NavigationHistoryManager {
  private handlers: RegisteredHandler[] = [];
  private lastBackPressTime = 0;
  private visualFeedbackCallback: ((text: string) => void) | null = null;
  private isListening = false;

  // Touch gesture tracker
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private isSwiping = false;

  constructor() {
    this.initListeners();
  }

  public setVisualFeedback(cb: ((text: string) => void) | null) {
    this.visualFeedbackCallback = cb;
  }

  /**
   * Daftarkan handler mundur berbasis prioritas:
   * Prioritas 100: Modal / Dialog / Overlays (Level 1)
   * Prioritas 80: Safety Confirmations (misal keluar kuis saat aktif)
   * Prioritas 50: Sub-step / Tabs (Level 2)
   * Prioritas 20: Transisi Layar Utama (Level 3)
   * Prioritas 10: Reset Filter / Root (Level 4)
   */
  public register(id: string, priority: number, handler: BackHandler): () => void {
    this.handlers = this.handlers.filter((h) => h.id !== id);
    this.handlers.push({ id, priority, handler });
    this.handlers.sort((a, b) => b.priority - a.priority);

    this.pushHistoryStateIfNeeded();

    return () => {
      this.unregister(id);
    };
  }

  public unregister(id: string) {
    this.handlers = this.handlers.filter((h) => h.id !== id);
  }

  public getActiveHandlers(): { id: string; priority: number }[] {
    return this.handlers.map((h) => ({ id: h.id, priority: h.priority }));
  }

  /**
   * Eksekusi mundur bertingkat
   * Mengembalikan true jika berhasil ditangani oleh salah satu tingkat hierarki
   */
  public triggerBack(): boolean {
    for (const item of this.handlers) {
      try {
        const handled = item.handler();
        if (handled) {
          this.showFeedback('‹ Kembali');
          return true;
        }
      } catch (err) {
        console.error(`Error in back handler ${item.id}:`, err);
      }
    }

    // Jika tidak ada handler yang menangani (sudah di akar beranda):
    const now = Date.now();
    if (now - this.lastBackPressTime < 2000) {
      return false;
    } else {
      this.lastBackPressTime = now;
      this.showFeedback('Tekan sekali lagi untuk keluar');
      this.pushHistoryStateIfNeeded();
      return true;
    }
  }

  private showFeedback(text: string) {
    if (this.visualFeedbackCallback) {
      this.visualFeedbackCallback(text);
    }
  }

  public pushHistoryStateIfNeeded() {
    try {
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({ app: 'kuis-sd-seru', time: Date.now() }, '');
      }
    } catch {
      // ignore
    }
  }

  private initListeners() {
    if (typeof window === 'undefined' || this.isListening) return;
    this.isListening = true;

    try {
      window.history.replaceState({ app: 'kuis-sd-seru', root: true }, '');
      window.history.pushState({ app: 'kuis-sd-seru', active: true }, '');
    } catch {
      // ignore
    }

    // 1. Popstate (Browser back button, Android virtual/hardware back gesture)
    window.addEventListener('popstate', (e) => {
      e.preventDefault();
      const handled = this.triggerBack();
      if (handled) {
        // Re-push history state agar navigasi pop berikutnya tetap tertangkap
        this.pushHistoryStateIfNeeded();
      }
    });

    // 2. Mouse Back Button (Button 3 & 4 pada mouse)
    const handleMouseBack = (e: MouseEvent | PointerEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        e.stopPropagation();
        this.triggerBack();
      }
    };

    window.addEventListener('pointerup', handleMouseBack);
    window.addEventListener('mouseup', handleMouseBack);

    // 3. Keyboard (Escape & Alt + ArrowLeft)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || (e.altKey && e.key === 'ArrowLeft')) {
        const handled = this.triggerBack();
        if (handled) {
          e.preventDefault();
        }
      }
    });

    // 4. Touchscreen Strict Edge Swipe (Hanya dari bezel tepi kiri <= 24px, bebas konflik dengan scroll horizontal)
    const isInsideScrollable = (el: Element | null): boolean => {
      let curr: Element | null = el;
      while (curr && curr !== document.body && curr !== document.documentElement) {
        const style = window.getComputedStyle(curr);
        const overflowX = style.overflowX;
        if (overflowX === 'auto' || overflowX === 'scroll') {
          if (curr.scrollWidth > curr.clientWidth) {
            return true;
          }
        }
        curr = curr.parentElement;
      }
      return false;
    };

    window.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length !== 1) {
          this.isSwiping = false;
          return;
        }
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();

        // Hanya aktif jika sentuhan dimulai persis di tepi kiri layar (<= 24px)
        // dan tidak berada di dalam kontainer yang dapat digeser horizontal (misal chip mapel/jenjang)
        const targetEl = touch.target as Element | null;
        const inScrollable = isInsideScrollable(targetEl);
        this.isSwiping = this.touchStartX <= 24 && !inScrollable;
      },
      { passive: true }
    );

    window.addEventListener(
      'touchmove',
      (e) => {
        if (!this.isSwiping || e.touches.length !== 1) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = Math.abs(touch.clientY - this.touchStartY);

        // Batalkan jika gerakan mengarah vertikal atau ke arah kiri
        if (deltaY > 30 || deltaX < -10) {
          this.isSwiping = false;
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'touchend',
      (e) => {
        if (!this.isSwiping || e.changedTouches.length !== 1) {
          this.isSwiping = false;
          return;
        }
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = Math.abs(touch.clientY - this.touchStartY);
        const duration = Date.now() - this.touchStartTime;

        // Gestur kembali hanya sah jika dimulai dari bezel (<=24px), usapan ke kanan tegas, dan durasi singkat
        const isStrictEdgeSwipe = deltaX >= 55 && deltaY <= 30 && duration < 450;

        if (isStrictEdgeSwipe) {
          this.triggerBack();
        }
        this.isSwiping = false;
      },
      { passive: true }
    );
  }
}

export const navigationManager = new NavigationHistoryManager();

if (typeof window !== 'undefined') {
  (window as any).__navigationManager = navigationManager;
}

/**
 * React Hook helper untuk mendaftarkan handler mundur secara deklaratif
 * Menggunakan handlerRef untuk menghindari closure trap saat state komponen berubah
 */
export function useBackHandler(
  id: string,
  priority: number,
  handler: BackHandler,
  active: boolean = true
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!active) return;
    const unregister = navigationManager.register(id, priority, () => handlerRef.current());
    return () => {
      unregister();
    };
  }, [id, priority, active]);
}
