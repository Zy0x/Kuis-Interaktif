import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY_MANUAL_THEME = 'kuis_sd_manual_theme';

/**
 * Menentukan tema otomatis berdasarkan waktu lokal pengguna:
 * - Pukul 18.00 hingga 06.59.59 (< 07.00) -> Tema Gelap (Dark)
 * - Pukul 07.00 hingga 17.59.59 (< 18.00) -> Tema Terang (Light)
 */
export const getTimeBasedTheme = (date: Date = new Date()): Theme => {
  const hours = date.getHours();
  // 18.00 hingga 07.00: tema gelap. Sisanya: terang.
  if (hours >= 18 || hours < 7) {
    return 'dark';
  }
  return 'light';
};

export const useTheme = () => {
  // Cek apakah pengguna secara eksplisit menekan tombol toggle tema pada sesi ini
  const [manualOverride, setManualOverride] = useState<Theme | null>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_MANUAL_THEME);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [, setTick] = useState(0);

  // Periksa waktu secara periodik setiap 30 detik untuk transisi otomatis mulus pada jam 18:00 dan 07:00
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Tema aktif: jika pengguna belum override secara manual di sesi ini, ikuti aturan waktu lokal
  const theme: Theme = manualOverride ?? getTimeBasedTheme(new Date());

  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update PWA meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#0F172A' : '#2563EB');
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const toggleTheme = useCallback(() => {
    setManualOverride((prev) => {
      const current = prev ?? getTimeBasedTheme(new Date());
      const nextTheme = current === 'light' ? 'dark' : 'light';
      try {
        sessionStorage.setItem(STORAGE_KEY_MANUAL_THEME, nextTheme);
      } catch {
        // ignore
      }
      return nextTheme;
    });
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      sessionStorage.setItem(STORAGE_KEY_MANUAL_THEME, newTheme);
    } catch {
      // ignore
    }
    setManualOverride(newTheme);
  }, []);

  const resetToTimeBased = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY_MANUAL_THEME);
    } catch {
      // ignore
    }
    setManualOverride(null);
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    isAuto: manualOverride === null,
    toggleTheme,
    setTheme,
    resetToTimeBased,
  };
};
