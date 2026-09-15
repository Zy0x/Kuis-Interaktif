import { useState, useEffect } from 'react';

const STORAGE_KEY_ANTI_REACTION = 'kuis_anti_reaction_enabled';

/**
 * Memeriksa apakah preferensi Anti-Reaksi aktif dari penyimpanan lokal.
 */
export function getAntiReactionPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_ANTI_REACTION) === 'true';
  } catch {
    return false;
  }
}

/**
 * Menyimpan preferensi Anti-Reaksi ke penyimpanan lokal dan menyiarkan ke seluruh komponen.
 */
export function setAntiReactionPreference(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_ANTI_REACTION, enabled ? 'true' : 'false');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kuis_anti_reaction_changed', { detail: { enabled } }));
    }
  } catch {}
}

/**
 * Hook reaktif untuk membaca dan mengubah status Anti-Reaksi secara tersinkronisasi di seluruh aplikasi.
 */
export function useAntiReaction(): [boolean, (valOrUpdater?: boolean | ((prev: boolean) => boolean)) => void] {
  const [isAntiReact, setIsAntiReact] = useState<boolean>(() => getAntiReactionPreference());

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (typeof customEvt.detail?.enabled === 'boolean') {
        setIsAntiReact(customEvt.detail.enabled);
      } else {
        setIsAntiReact(getAntiReactionPreference());
      }
    };

    window.addEventListener('kuis_anti_reaction_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('kuis_anti_reaction_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const toggleOrSet = (valOrUpdater?: boolean | ((prev: boolean) => boolean)) => {
    let nextVal: boolean;
    if (typeof valOrUpdater === 'function') {
      nextVal = valOrUpdater(isAntiReact);
    } else if (typeof valOrUpdater === 'boolean') {
      nextVal = valOrUpdater;
    } else {
      nextVal = !isAntiReact;
    }
    setIsAntiReact(nextVal);
    setAntiReactionPreference(nextVal);
  };

  return [isAntiReact, toggleOrSet];
}
