import { useRef, useCallback } from "react";

interface UseSwipeToReplyOptions {
  onReply: () => void;
  threshold?: number;
  disabled?: boolean;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function useSwipeToReply({
  onReply,
  threshold = 60,
  disabled = false,
}: UseSwipeToReplyOptions): {
  handlers: SwipeHandlers;
  swipeX: React.MutableRefObject<number>;
  isSwipingRef: React.MutableRefObject<boolean>;
} {
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const swipeX = useRef(0);
  const isSwipingRef = useRef(false);
  const triggeredRef = useRef(false);

  const applyTransform = useCallback((el: HTMLElement | null, x: number) => {
    if (!el) return;
    el.style.transform = x > 0 ? `translateX(${Math.min(x, threshold)}px)` : "";
    el.style.transition = x > 0 ? "none" : "transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)";
  }, [threshold]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isSwipingRef.current = false;
    triggeredRef.current = false;
    swipeX.current = 0;
  }, [disabled]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    const deltaX = e.touches[0].clientX - startXRef.current;
    const deltaY = e.touches[0].clientY - startYRef.current;
    if (!isSwipingRef.current && Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    if (deltaX <= 0) return;
    isSwipingRef.current = true;
    swipeX.current = deltaX;
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    applyTransform(el, deltaX);
    if (deltaX >= threshold && !triggeredRef.current) {
      triggeredRef.current = true;
      if ("vibrate" in navigator) navigator.vibrate(30);
      onReply();
    }
  }, [disabled, threshold, onReply, applyTransform]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    const el = e.currentTarget as HTMLElement;
    applyTransform(el, 0);
    swipeX.current = 0;
    isSwipingRef.current = false;
  }, [disabled, applyTransform]);

  return { handlers: { onTouchStart, onTouchMove, onTouchEnd }, swipeX, isSwipingRef };
}
