import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, X, Info } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../lib/navigationHistory';

export interface ImageZoomModalProps {
  isOpen: boolean;
  imageUrl?: string | null;
  imageCaption?: string | null;
  alt?: string;
  onClose: () => void;
  playClick?: () => void;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  isOpen,
  imageUrl,
  imageCaption,
  alt = 'Pratinjau Gambar Diperbesar',
  onClose,
  playClick = () => {},
}) => {
  useBodyScrollLock(isOpen);

  useBackHandler(
    'image-zoom-modal',
    90,
    () => {
      onClose();
      return true;
    },
    isOpen
  );

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialPinchScaleRef = useRef<number>(1);
  const lastTapRef = useRef<number>(0);

  // Reset transform saat modal dibuka kembali
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  // Keyboard navigation (+, -, Escape, 0)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setScale((prev) => Math.min(4, Number((prev + 0.5).toFixed(1))));
      } else if (e.key === '-' || e.key === '_') {
        setScale((prev) => {
          const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
          if (next === 1) setPosition({ x: 0, y: 0 });
          return next;
        });
      } else if (e.key === '0' || e.key.toLowerCase() === 'r') {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleZoomIn = () => {
    playClick();
    setScale((prev) => Math.min(4, Number((prev + 0.5).toFixed(1))));
  };

  const handleZoomOut = () => {
    playClick();
    setScale((prev) => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    playClick();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleClose = () => {
    playClick();
    onClose();
  };

  // Double tap / double click to toggle zoom (1x <-> 2x)
  const handleDoubleTapOrClick = (clientX: number, clientY: number) => {
    playClick();
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
      const offsetX = (window.innerWidth / 2 - clientX) * 0.5;
      const offsetY = (window.innerHeight / 2 - clientY) * 0.5;
      setPosition({ x: offsetX, y: offsetY });
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag & Pinch-to-zoom handlers
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap terdeteksi
        handleDoubleTapOrClick(e.touches[0].clientX, e.touches[0].clientY);
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      if (scale > 1) {
        setIsDragging(true);
        dragStartRef.current = {
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y,
        };
      }
    } else if (e.touches.length === 2) {
      // Mulai pinch-to-zoom
      setIsDragging(false);
      initialPinchDistanceRef.current = getTouchDistance(e.touches[0], e.touches[1]);
      initialPinchScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    } else if (e.touches.length === 2 && initialPinchDistanceRef.current) {
      const currentDist = getTouchDistance(e.touches[0], e.touches[1]);
      const diffRatio = currentDist / initialPinchDistanceRef.current;
      const newScale = Math.min(4, Math.max(1, Number((initialPinchScaleRef.current * diffRatio).toFixed(2))));
      setScale(newScale);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    initialPinchDistanceRef.current = null;
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between select-none animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Penampil Gambar Diperbesar"
    >
      {/* Backdrop redup dan blur */}
      <div
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Top Floating Action Bar */}
      <header className="relative z-20 w-full max-w-4xl px-4 pt-4 sm:pt-6 flex items-center justify-between gap-3 pointer-events-auto">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-2xl text-white text-xs font-semibold shadow-lg">
          <ZoomIn className="w-4 h-4 text-blue-400" />
          <span>Perbesaran: {Math.round(scale * 100)}%</span>
        </div>

        {/* Action Controls: Zoom Out, Reset, Zoom In, Close */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/80 backdrop-blur-md border border-white/15 p-1 sm:p-1.5 rounded-2xl shadow-xl">
          <button
            type="button"
            disabled={scale <= 1}
            onClick={handleZoomOut}
            className="p-2.5 rounded-xl text-white/90 hover:text-white hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent transition-all min-h-[44px] min-w-[44px] flex items-center justify-center btn-press cursor-pointer"
            title="Perkecil Gambar (-)"
            aria-label="Perkecil Gambar"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          <button
            type="button"
            disabled={scale === 1}
            onClick={handleResetZoom}
            className="px-2.5 py-2 rounded-xl text-xs font-bold text-white/90 hover:text-white hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent transition-all min-h-[44px] flex items-center justify-center gap-1 btn-press cursor-pointer"
            title="Kembalikan ke Ukuran Semula (R)"
            aria-label="Reset Ukuran Gambar"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden xs:inline">100%</span>
          </button>

          <button
            type="button"
            disabled={scale >= 4}
            onClick={handleZoomIn}
            className="p-2.5 rounded-xl text-white/90 hover:text-white hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent transition-all min-h-[44px] min-w-[44px] flex items-center justify-center btn-press cursor-pointer"
            title="Perbesar Gambar (+)"
            aria-label="Perbesar Gambar"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <div className="w-[1px] h-6 bg-white/20 mx-0.5" />

          <button
            type="button"
            onClick={handleClose}
            className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-400/30 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center btn-press cursor-pointer"
            title="Tutup (Esc)"
            aria-label="Tutup Penampil Gambar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Image Viewport with Pan & Zoom */}
      <main
        className="relative z-10 w-full flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-6"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`relative max-w-full max-h-full flex items-center justify-center transition-transform ${
            isDragging ? 'cursor-grabbing duration-0' : scale > 1 ? 'cursor-grab duration-150' : 'cursor-zoom-in duration-200'
          }`}
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
            transformOrigin: 'center center',
          }}
          onDoubleClick={(e) => handleDoubleTapOrClick(e.clientX, e.clientY)}
        >
          <img
            src={imageUrl}
            alt={alt}
            draggable={false}
            className="max-h-[75vh] sm:max-h-[80vh] w-auto max-w-[95vw] object-contain rounded-2xl shadow-2xl border border-white/10 select-none pointer-events-none"
          />
        </div>
      </main>

      {/* Bottom Info Bar & Caption */}
      <footer className="relative z-20 w-full max-w-2xl px-4 pb-4 sm:pb-6 pointer-events-auto flex flex-col items-center gap-2">
        {imageCaption ? (
          <div className="w-full bg-slate-900/85 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl text-center shadow-lg animate-fade-in">
            <p className="text-xs sm:text-sm font-medium text-white/95 leading-relaxed">
              {imageCaption}
            </p>
          </div>
        ) : null}

        <div className="flex items-center gap-2 text-[11px] text-white/60">
          <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span>Klik ganda / cubit untuk zoom cepat • Geser saat gambar diperbesar</span>
        </div>
      </footer>
    </div>
  );
};
