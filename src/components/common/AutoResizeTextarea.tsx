import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minHeight?: number;
  maxHeight?: number;
}

/**
 * Textarea yang otomatis menyesuaikan tinggi secara dinamis (auto-resizing & line-wrapping)
 * sesuai panjang konten teks pengguna. Mencegah pemotongan teks horizontal pada formulir kuis.
 */
export const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  (
    {
      value,
      onChange,
      onInput,
      minHeight = 44,
      maxHeight = 180,
      className = '',
      rows = 1,
      ...props
    },
    ref
  ) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    useImperativeHandle(ref, () => innerRef.current!);

    const adjustHeight = () => {
      const el = innerRef.current;
      if (!el) return;

      // Reset sementara agar scrollHeight dihitung akurat saat teks dihapus/berkurang
      el.style.height = `${minHeight}px`;

      const scrollHeight = el.scrollHeight;
      const targetHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      el.style.height = `${targetHeight}px`;

      if (scrollHeight > maxHeight) {
        el.style.overflowY = 'auto';
      } else {
        el.style.overflowY = 'hidden';
      }
    };

    // Sinkronisasi tinggi saat nilai value berubah dari luar (misal preset / paste / state update)
    useEffect(() => {
      adjustHeight();
    }, [value]);

    return (
      <textarea
        ref={innerRef}
        rows={rows}
        value={value}
        onChange={(e) => {
          adjustHeight();
          onChange?.(e);
        }}
        onInput={(e) => {
          adjustHeight();
          onInput?.(e);
        }}
        className={`w-full resize-none overflow-hidden [field-sizing:content] leading-relaxed transition-[border-color,box-shadow] duration-150 ${className}`}
        style={{ minHeight: `${minHeight}px` }}
        {...props}
      />
    );
  }
);

AutoResizeTextarea.displayName = 'AutoResizeTextarea';
