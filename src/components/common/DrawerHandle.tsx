import React, { forwardRef } from 'react';

export interface DrawerHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  pillClassName?: string;
}

/**
 * Komponen handle bar / pill atas untuk drawer mobile.
 * Mendukung interaksi drag/swipe down to close dengan target sentuh responsif (>=44px),
 * cursor grab intuitif, dan proteksi penuh anti pull-to-refresh mobile.
 */
export const DrawerHandle = forwardRef<HTMLDivElement, DrawerHandleProps>(
  ({ className = '', pillClassName = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label="Tarik ke bawah untuk menutup"
        title="Tarik ke bawah untuk menutup"
        className={`w-full py-2 sm:py-2.5 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none shrink-0 group ${className}`}
        {...props}
      >
        <div
          className={`w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400 dark:group-hover:bg-slate-500 group-active:scale-95 transition-all duration-150 ${pillClassName}`}
        />
      </div>
    );
  }
);

DrawerHandle.displayName = 'DrawerHandle';
