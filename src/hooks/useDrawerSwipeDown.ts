import { useState, useRef, useCallback, useEffect, type CSSProperties } from 'react';

export interface UseDrawerSwipeDownOptions {
  /** Callback saat drawer berhasil ditutup */
  onClose: () => void;
  /** Jarak tarikan (px) minimal untuk memicu penutupan (default: 70px) */
  threshold?: number;
  /** Kecepatan tarikan (px/ms) untuk mendeteksi flick/swipe cepat (default: 0.35) */
  velocityThreshold?: number;
  /** Mengaktifkan/menonaktifkan gesture (default: true) */
  enabled?: boolean;
}

/**
 * Hook interaktif untuk mendeteksi swipe/drag ke bawah pada drawer atau bottom sheet.
 * Menggunakan window-level pointer tracking untuk kehalusan maksimal dan
 * native non-passive touch listener untuk mencegah pull-to-refresh mobile browser secara mutlak.
 */
export function useDrawerSwipeDown({
  onClose,
  threshold = 70,
  velocityThreshold = 0.35,
  enabled = true,
}: UseDrawerSwipeDownOptions) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const isDraggingRef = useRef(false);
  const handleRef = useRef<HTMLDivElement | null>(null);

  // Reset state ke kondisi default
  const reset = useCallback(() => {
    setDragOffset(0);
    setIsDragging(false);
    setIsClosing(false);
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    const el = handleRef.current;
    if (!el || !enabled) return;

    const onPointerDown = (e: PointerEvent) => {
      // Hanya tangani tombol utama (klik kiri mouse atau sentuhan jari)
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      startYRef.current = e.clientY;
      startTimeRef.current = performance.now();
      isDraggingRef.current = true;
      setIsDragging(true);

      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // Fallback jika tidak didukung
      }

      const onPointerMove = (ev: PointerEvent) => {
        if (!isDraggingRef.current) return;
        const deltaY = ev.clientY - startYRef.current;
        if (deltaY > 0) {
          // Translasi ke bawah mengikuti jari
          setDragOffset(deltaY);
        } else {
          setDragOffset(0);
        }
      };

      const onPointerUp = (ev: PointerEvent) => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setIsDragging(false);

        try {
          el.releasePointerCapture(ev.pointerId);
        } catch {
          // Fallback
        }

        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);

        const deltaY = ev.clientY - startYRef.current;
        const elapsed = Math.max(performance.now() - startTimeRef.current, 1);
        const velocity = deltaY / elapsed;

        // Tutup jika ditarik melampaui batas jarak ATAU flick cepat ke bawah
        if (deltaY >= threshold || (velocity > velocityThreshold && deltaY > 25)) {
          setIsClosing(true);
          setDragOffset(Math.max(window.innerHeight || 450, 450));
          setTimeout(() => {
            onClose();
            reset();
          }, 180);
        } else {
          // Snap back halus jika belum mencapai threshold
          setDragOffset(0);
        }
      };

      const onPointerCancel = () => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setIsDragging(false);
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          // Fallback
        }
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
        setDragOffset(0);
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerCancel);
    };

    // Proteksi mutlak anti pull-to-refresh native pada browser mobile (Chrome/Safari/PWA)
    const onTouchMove = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [enabled, threshold, velocityThreshold, onClose, reset]);

  // Style inline untuk container drawer/sheet yang ditarik
  const drawerStyle: CSSProperties = {
    transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
    transition: isDragging
      ? 'none'
      : isClosing
        ? 'transform 0.18s cubic-bezier(0.32, 0, 0.67, 0)'
        : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: isDragging ? 'transform' : undefined,
  };

  // Style inline untuk backdrop agar memudar halus saat ditarik
  const backdropStyle: CSSProperties = {
    opacity: isDragging && dragOffset > 0 ? Math.max(0.2, 1 - dragOffset / 350) : undefined,
    transition: isDragging ? 'none' : 'opacity 0.25s ease',
  };

  return {
    handleRef,
    drawerStyle,
    backdropStyle,
    isDragging,
    dragOffset,
    reset,
  };
}
