import React, { forwardRef, useRef, useImperativeHandle } from 'react';

export interface ResizableTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minHeight?: number;
  maxHeight?: number;
  containerClassName?: string;
  showResizeGrip?: boolean;
}

export const ResizableTextarea = forwardRef<HTMLTextAreaElement, ResizableTextareaProps>(({
  minHeight = 90,
  maxHeight = 700,
  className = '',
  containerClassName = '',
  showResizeGrip = true,
  style,
  ...props
}, ref) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => internalRef.current as HTMLTextAreaElement);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    const pointerId = e.pointerId;

    try {
      target.setPointerCapture(pointerId);
    } catch {
      // Abaikan jika pointer capture tidak didukung
    }

    const startY = e.clientY;
    const startHeight = internalRef.current?.offsetHeight || minHeight;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientY - startY;
      const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + delta));
      if (internalRef.current) {
        internalRef.current.style.height = `${newHeight}px`;
        internalRef.current.style.minHeight = `${newHeight}px`;
      }
    };

    const onPointerUp = () => {
      try {
        target.releasePointerCapture(pointerId);
      } catch {
        // Abaikan
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  return (
    <div className={`relative group ${containerClassName}`}>
      <textarea
        ref={internalRef}
        style={style}
        className={`w-full px-4 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-xs sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-xs resize-none leading-relaxed pb-7 transition-colors ${className}`}
        {...props}
      />

      {showResizeGrip && (
        <div
          role="button"
          tabIndex={-1}
          aria-label="Tarik sudut untuk mengubah ukuran kolom teks"
          title="Tarik sudut ini untuk memperbesar tinggi kolom"
          onPointerDown={handlePointerDown}
          className="absolute right-2 bottom-2.5 p-1.5 cursor-ns-resize text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 select-none touch-none flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors active:scale-95 z-10"
        >
          <svg className="w-3.5 h-3.5 opacity-60 hover:opacity-100 transition-opacity" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="13" cy="13" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
            <circle cx="13" cy="8" r="1.5" />
            <circle cx="3" cy="13" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="13" cy="3" r="1.5" />
          </svg>
        </div>
      )}
    </div>
  );
});

ResizableTextarea.displayName = 'ResizableTextarea';
export default ResizableTextarea;
