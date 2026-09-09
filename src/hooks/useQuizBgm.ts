import { useState, useEffect, useCallback, useRef } from 'react';
import { getProceduralBgm } from '../lib/audio/proceduralBgm';

const STORAGE_KEY_BGM_MUTED = 'kuis_sd_bgm_muted';

export function useQuizBgm() {
  const [isBgmMuted, setIsBgmMuted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BGM_MUTED);
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const bgmRef = useRef(getProceduralBgm());

  // Keep player muted state synced with hook state
  useEffect(() => {
    bgmRef.current.setMuted(isBgmMuted);
  }, [isBgmMuted]);

  // Clean up on unmount
  useEffect(() => {
    const player = bgmRef.current;
    return () => {
      player.stop();
    };
  }, []);

  const toggleBgmMute = useCallback(() => {
    setIsBgmMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_BGM_MUTED, JSON.stringify(next));
      } catch {
        // ignore
      }
      bgmRef.current.setMuted(next);
      return next;
    });
  }, []);

  const startBgm = useCallback(() => {
    bgmRef.current.start();
  }, []);

  const stopBgm = useCallback(() => {
    bgmRef.current.stop();
  }, []);

  const pauseBgm = useCallback(() => {
    bgmRef.current.pause();
  }, []);

  const resumeBgm = useCallback(() => {
    bgmRef.current.resume();
  }, []);

  const setDucked = useCallback((ducked: boolean) => {
    bgmRef.current.setDucked(ducked);
  }, []);

  const setUrgent = useCallback((urgent: boolean) => {
    bgmRef.current.setUrgent(urgent);
  }, []);

  return {
    isBgmMuted,
    toggleBgmMute,
    startBgm,
    stopBgm,
    pauseBgm,
    resumeBgm,
    setDucked,
    setUrgent,
  };
}
