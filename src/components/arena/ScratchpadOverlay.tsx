import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  X, 
  Trash2, 
  Edit3, 
  Eraser
} from 'lucide-react';
import { triggerHaptic } from '../../lib/mobileUtils';

interface ScratchpadOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const ScratchpadOverlay: React.FC<ScratchpadOverlayProps> = ({
  isOpen,
  onClose,
  isDark = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [penColor, setPenColor] = useState<string>(isDark ? '#38bdf8' : '#2563eb');
  const strokeWidth = 3;
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Inisialisasi resolusi kanvas dengan DPI layar tinggi
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Tunggu DOM selesai me-render ukuran kanvas
      const timer = setTimeout(initCanvas, 50);
      window.addEventListener('resize', initCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', initCanvas);
      };
    }
  }, [isOpen, initCanvas]);

  if (!isOpen) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lastPointRef.current = { x, y };

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(x, y, strokeWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = tool === 'eraser' ? (isDark ? '#0f172a' : '#ffffff') : penColor;
      if (tool === 'eraser') {
        ctx.clearRect(x - strokeWidth, y - strokeWidth, strokeWidth * 2, strokeWidth * 2);
      } else {
        ctx.fill();
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(currentX, currentY);

      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = strokeWidth * 4;
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = penColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      }
    }

    lastPointRef.current = { x: currentX, y: currentY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const clearCanvas = () => {
    triggerHaptic('medium');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-40 flex flex-col animate-fade-in select-none pointer-events-auto"
      style={{ touchAction: 'none' }}
    >
      {/* Background Semi Transparan — Soal di belakang tetap terbaca samar */}
      <div className="absolute inset-0 bg-slate-900/65 dark:bg-black/75 backdrop-blur-[2px]" />

      {/* Floating Compact Toolbar di Bagian Atas */}
      <div className="relative z-10 w-full max-w-lg mx-auto p-2.5 xs:p-3 flex items-center justify-between gap-1.5 xs:gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800">
          
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setTool('pen');
            }}
            className={`p-2 rounded-xl transition-all min-h-[40px] min-w-[40px] flex items-center justify-center ${
              tool === 'pen'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Pena Cakar Hitungan"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Color Switcher */}
          <div className="flex items-center gap-1 px-1">
            {['#38bdf8', '#fbbf24', '#34d399', '#f43f5e'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setTool('pen');
                  setPenColor(c);
                }}
                className={`w-5 h-5 rounded-full transition-transform ${penColor === c && tool === 'pen' ? 'scale-125 ring-2 ring-white dark:ring-slate-300' : 'opacity-70 hover:opacity-100'}`}
                style={{ backgroundColor: c }}
                title={`Warna ${c}`}
              />
            ))}
          </div>

          <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setTool('eraser');
            }}
            className={`p-2 rounded-xl transition-all min-h-[40px] min-w-[40px] flex items-center justify-center ${
              tool === 'eraser'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Penghapus"
          >
            <Eraser className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={clearCanvas}
            className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
            title="Hapus Semua Coretan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="p-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-700 dark:text-slate-200 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 border border-slate-200/80 dark:border-slate-800 shadow-xl min-h-[44px] min-w-[44px] flex items-center justify-center btn-press transition-colors"
          title="Tutup Kanvas Coretan"
          aria-label="Tutup Kanvas Coretan"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Area Kanvas Menggambar */}
      <div className="relative flex-1 w-full h-full cursor-crosshair">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute inset-0 w-full h-full"
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-center">
          <span className="px-3 py-1 rounded-full bg-black/40 text-white/80 text-[11px] font-medium backdrop-blur-xs">
            ✍️ Coret angka/perhitungan di sini dengan jari
          </span>
        </div>
      </div>
    </div>
  );
};
