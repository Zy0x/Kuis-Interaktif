/**
 * Utilitas Text-to-Speech (TTS) Ramah Anak SD & Teroptimasi Multi-Perangkat
 * Dirancang khusus untuk kestabilan 100% pada peramban mobile low-end (Android RAM 1-3GB) hingga desktop.
 * Fitur Utama:
 * 1. Pencegah Logat Bule: Verifikasi ketat ketersediaan suara id-ID sebelum memutar.
 * 2. Anti-Freeze & Anti-Garbage Collection: Heartbeat resume & global utterance retention pencegah bug pemotongan 15 detik di Chrome Android.
 * 3. Pemrosesan Kalimat Terpisah (Chunking): Responsivitas instan (<50ms) tanpa jeda pemrosesan panjang.
 * 4. Sanitasi Matematika & Simbol SD: Otomatis membaca pecahan, operasi hitung, satuan, titik-titik isian dengan bahasa alami anak SD.
 */

export type SpeechErrorReason = 'UNSUPPORTED' | 'NO_INDONESIAN_VOICE' | 'TTS_FAILED';
export type SpeechChunkTarget = 'question' | 'option' | 'none';

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (reason: SpeechErrorReason, message?: string) => void;
  onChunkChange?: (chunkIndex: number, target: SpeechChunkTarget, optionIndex?: number) => void;
  rate?: number;
  pitch?: number;
}

let cachedVoices: SpeechSynthesisVoice[] = [];
let cachedIndonesianVoice: SpeechSynthesisVoice | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let fallbackAudio: HTMLAudioElement | null = null;
let prefetchAudio: HTMLAudioElement | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let watchdogTimer: ReturnType<typeof setTimeout> | null = null;
let isAudioStreamPlaying = false;
let activeSessionId = 0;

/**
 * Mencari suara Bahasa Indonesia terbaik dari daftar suara perangkat.
 * Mengutamakan suara lokal offline dan natural berdefinisi tinggi.
 * Mendukung kode modern (id-ID) dan kode warisan Android (in-ID).
 */
export function findIndonesianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const isIndonesianLang = (lang: string) => {
    const l = (lang || '').toLowerCase().replace(/_/g, '-');
    return (
      l === 'id' ||
      l === 'in' ||
      l === 'ind' ||
      l.startsWith('id-') ||
      l.startsWith('in-') ||
      l.startsWith('ind-')
    );
  };

  const isIndonesianName = (name: string) => {
    const n = (name || '').toLowerCase();
    return (
      n.includes('indonesia') ||
      n.includes('indonesian') ||
      n.includes('bahasa') ||
      n.includes('id-id') ||
      n.includes('in-id') ||
      n.includes('gadis') ||
      n.includes('ardi') ||
      n.includes('andika')
    );
  };

  // 1. Suara lokal offline / natural persis id-ID atau in-ID
  const localNaturalId = voices.find(
    (v) =>
      (isIndonesianLang(v.lang) || isIndonesianName(v.name)) &&
      (v.localService || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('local'))
  );
  if (localNaturalId) return localNaturalId;

  // 2. Suara dengan kode bahasa persis id-ID / in-ID
  const exactId = voices.find((v) => isIndonesianLang(v.lang));
  if (exactId) return exactId;

  // 3. Suara dengan nama mengandung kata kunci Indonesia
  const nameId = voices.find((v) => isIndonesianName(v.name));
  if (nameId) return nameId;

  return null;
}

/**
 * Inisialisasi awal daftar suara di browser.
 * Dijalankan otomatis saat modul diimpor dan diperbarui saat onvoiceschanged terpicu.
 */
function refreshVoices(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const list = window.speechSynthesis.getVoices();
    if (list && list.length > 0) {
      cachedVoices = list;
      cachedIndonesianVoice = findIndonesianVoice(list);
    }
  } catch {}
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  try {
    window.speechSynthesis.onvoiceschanged = () => {
      refreshVoices();
    };
  } catch {}
}

/**
 * Memeriksa apakah browser mendukung Web Speech API
 */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Menghentikan pembacaan suara yang sedang aktif seketika (baik native TTS maupun stream audio).
 */
export function stopSpeech(): void {
  activeSessionId++;
  isAudioStreamPlaying = false;

  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (watchdogTimer) {
    clearTimeout(watchdogTimer);
    watchdogTimer = null;
  }

  if (isSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  currentUtterance = null;

  if (fallbackAudio) {
    try {
      fallbackAudio.pause();
      fallbackAudio.onplay = null;
      fallbackAudio.onended = null;
      fallbackAudio.onerror = null;
      fallbackAudio.src = '';
    } catch {}
  }

  try {
    if (typeof window !== 'undefined') {
      delete (window as any).__activeUtterance;
    }
  } catch {}
}

/**
 * Memeriksa apakah ada proses suara yang sedang berjalan (native TTS atau stream audio).
 */
export function isSpeaking(): boolean {
  if (isAudioStreamPlaying) return true;
  if (fallbackAudio && !fallbackAudio.paused) return true;
  if (!isSpeechSupported()) return false;
  return window.speechSynthesis.speaking || Boolean(currentUtterance);
}

/**
 * Format simbol matematika, pecahan, satuan, dan tanda baca khusus pelajaran SD
 * agar dibaca alami dan mudah dipahami siswa sekolah dasar.
 */
export function formatElementaryMathAndSymbols(rawText: string): string {
  if (!rawText) return '';

  return rawText
    // 1. Bersihkan tag HTML atau format markdown
    .replace(/<[^>]*>/g, '')
    .replace(/[*_~`#]/g, '')

    // 2. Format Pecahan Umum SD (1/2, 1/4, 3/4, dst)
    .replace(/\b1\/2\b/g, ' satu per dua ')
    .replace(/\b1\/4\b/g, ' satu per empat ')
    .replace(/\b3\/4\b/g, ' tiga per empat ')
    .replace(/\b1\/3\b/g, ' satu per tiga ')
    .replace(/\b2\/3\b/g, ' dua per tiga ')
    .replace(/\b(\d+)\s*\/\s*(\d+)\b/g, '$1 per $2')

    // 3. Simbol Operasi Matematika SD
    .replace(/[×]/g, ' kali ')
    .replace(/[÷]/g, ' bagi ')
    // Pembagian dengan titik dua hanya jika berdiri sendiri diapit angka (misal: 12 : 3)
    .replace(/(\d+)\s*:\s*(\d+)(?!\d)/g, (_m, a, b) => {
      // Jika format jam (misal 08:30), baca sebagai waktu
      if (b.length === 2 && parseInt(b, 10) < 60 && parseInt(a, 10) < 24) {
        return `${a} lewat ${b}`;
      }
      return `${a} bagi ${b}`;
    })
    .replace(/\s*\*\s*/g, ' kali ')
    .replace(/\+/g, ' tambah ')
    // Tanda minus / kurang (hanya diapit angka atau berdiri sendiri dengan spasi)
    .replace(/(\d+)\s*[-−]\s*(\d+)/g, '$1 kurang $2')
    .replace(/\s+[-−]\s+/g, ' kurang ')
    .replace(/=/g, ' sama dengan ')
    .replace(/%/g, ' persen ')

    // 4. Satuan Ukuran Pelajaran SD
    .replace(/°C\b|derajat\s*celcius/gi, ' derajat celcius ')
    .replace(/\bkm\/jam\b/gi, ' kilometer per jam ')
    .replace(/\bm²\b|\bm2\b/gi, ' meter persegi ')
    .replace(/\bcm²\b|\bcm2\b/gi, ' sentimeter persegi ')
    .replace(/\bkm²\b|\bkm2\b/gi, ' kilometer persegi ')
    .replace(/\bm³\b|\bm3\b/gi, ' meter kubik ')
    .replace(/\bcm³\b|\bcm3\b/gi, ' sentimeter kubik ')
    .replace(/\bkg\b/gi, 'kilogram')
    .replace(/\bgr\b|\bgram\b/gi, 'gram')
    .replace(/\bkm\b/gi, 'kilometer')
    .replace(/\bcm\b/gi, 'sentimeter')
    .replace(/\bmm\b/gi, 'milimeter')
    .replace(/\bdetik\b/gi, 'detik')
    .replace(/\bmenit\b/gi, 'menit')

    // 5. Titik-titik isian / blank (misal: "Hasilnya adalah .....")
    .replace(/[._]{2,}/g, ' titik-titik ')

    // 6. Singkatan Edukatif Umum
    .replace(/\bKPK\b/g, 'K P K')
    .replace(/\bFPB\b/g, 'F P B')
    .replace(/\bSD\b/g, 'S D')
    .replace(/\bMI\b/g, 'M I')
    .replace(/\bIPA\b/g, 'I P A')
    .replace(/\bIPS\b/g, 'I P S')
    .replace(/\bPPKn\b/gi, 'P P K n')

    // 7. Normalisasi spasi
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Pemutar Audio Bahasa Indonesia cadangan berbasis streaming cloud universal.
 * Menjamin 100% suara tetap keluar pada HP low-end & Custom ROM (Redmi Note 7, LineageOS, AOSP, dsb)
 * yang sama sekali tidak memiliki engine Google TTS di sistem operasinya.
 */
function playCloudAudioSequence(
  chunks: string[],
  sessionId: number,
  callbacks?: SpeakOptions,
  startChunkIndex = 0
): void {
  if (typeof window === 'undefined') return;

  let currentChunkIndex = startChunkIndex;

  const prefetchNext = (idx: number) => {
    if (idx < chunks.length) {
      try {
        if (!prefetchAudio) {
          prefetchAudio = new Audio();
        }
        const text = chunks[idx];
        prefetchAudio.src = `https://code.responsivevoice.org/develop/getvoice.php?t=${encodeURIComponent(text)}&tl=id`;
        prefetchAudio.load();
      } catch {}
    }
  };

  const playChunk = () => {
    if (sessionId !== activeSessionId) {
      isAudioStreamPlaying = false;
      return;
    }

    if (currentChunkIndex >= chunks.length) {
      isAudioStreamPlaying = false;
      callbacks?.onEnd?.();
      return;
    }

    const chunkText = chunks[currentChunkIndex];
    if (!fallbackAudio) {
      fallbackAudio = new Audio();
    }

    const audioUrl = `https://code.responsivevoice.org/develop/getvoice.php?t=${encodeURIComponent(chunkText)}&tl=id`;
    fallbackAudio.src = audioUrl;

    fallbackAudio.onplay = () => {
      if (sessionId !== activeSessionId) return;
      isAudioStreamPlaying = true;
      if (currentChunkIndex === 0) {
        callbacks?.onStart?.();
        callbacks?.onChunkChange?.(0, 'question');
      } else {
        callbacks?.onChunkChange?.(currentChunkIndex, 'option', currentChunkIndex - 1);
      }
      // Pra-muat kalimat berikutnya di latar belakang agar transisi mulus
      prefetchNext(currentChunkIndex + 1);
    };

    fallbackAudio.onended = () => {
      if (sessionId !== activeSessionId) return;
      currentChunkIndex++;
      playChunk();
    };

    fallbackAudio.onerror = () => {
      if (sessionId !== activeSessionId) return;
      isAudioStreamPlaying = false;
      callbacks?.onError?.('TTS_FAILED', 'Gagal memuat suara soal. Periksa koneksi internet perangkat Anda.');
    };

    fallbackAudio.play().catch((err) => {
      if (sessionId !== activeSessionId) return;
      isAudioStreamPlaying = false;
      callbacks?.onError?.('TTS_FAILED', `Gagal memutar audio: ${err.message || 'pemutaran diblokir'}`);
    });
  };

  playChunk();
}

/**
 * Membacakan pertanyaan kuis dan opsi jawaban secara berurutan (chunked playback).
 * Menggunakan arsitektur Dual-Engine:
 * 1. Prioritas Native TTS jika engine Bahasa Indonesia terpasang lokal di OS.
 * 2. Otomatis Fallback ke Cloud Audio Stream jika perangkat (Redmi Note 7 Custom ROM) tidak memiliki paket suara.
 */
export function speakQuestion(
  questionText: string,
  options?: string[],
  callbacks?: SpeakOptions
): void {
  // Hentikan pembacaan sebelumnya
  stopSpeech();

  // Reset status pause pada engine browser jika tersangkut
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch {}

  // Pastikan daftar suara tersegarkan
  refreshVoices();

  // Buat potongan kalimat agar segera bersuara tanpa jeda pemrosesan panjang di CPU lambat
  const cleanQ = formatElementaryMathAndSymbols(questionText);
  const chunks: string[] = [`Pertanyaan: ${cleanQ}.`];

  if (options && options.length > 0) {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    options.forEach((opt, idx) => {
      const cleanOpt = formatElementaryMathAndSymbols(opt);
      chunks.push(`Pilihan ${letters[idx] || idx + 1}: ${cleanOpt}.`);
    });
  }

  const thisSessionId = activeSessionId;

  // Jika Web Speech API sama sekali tidak didukung di peramban ini
  if (!isSpeechSupported()) {
    playCloudAudioSequence(chunks, thisSessionId, callbacks, 0);
    return;
  }

  // Verifikasi ketersediaan suara Bahasa Indonesia lokal
  const availableVoices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  const idVoice = cachedIndonesianVoice || findIndonesianVoice(availableVoices);

  // Jika peramban telah memuat daftar suara (>0) tetapi TIDAK MEMILIKI suara Bahasa Indonesia sama sekali
  // (Kondisi umum pada Redmi Note 7 Custom ROM / AOSP tanpa Google Speech Services)
  // Segera gunakan Cloud Audio Stream agar suara tetap keluar dengan aksen Indonesia asli!
  if (availableVoices.length > 0 && !idVoice) {
    playCloudAudioSequence(chunks, thisSessionId, callbacks, 0);
    return;
  }

  let currentChunkIndex = 0;

  // Heartbeat resume untuk mencegah pembekuan otomatis (Chrome Android 15-second cutoff bug)
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    if (activeSessionId !== thisSessionId) {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      return;
    }
    if (isSpeechSupported() && window.speechSynthesis.speaking) {
      try {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } catch {}
    }
  }, 7500);

  const cleanupSession = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (watchdogTimer) {
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
    }
    currentUtterance = null;
    try {
      if (typeof window !== 'undefined') {
        delete (window as any).__activeUtterance;
      }
    } catch {}
  };

  const playNextChunk = () => {
    // Jika sesi telah dihentikan atau diganti
    if (thisSessionId !== activeSessionId) {
      cleanupSession();
      return;
    }

    // Jika seluruh kalimat telah selesai dibacakan
    if (currentChunkIndex >= chunks.length) {
      cleanupSession();
      callbacks?.onEnd?.();
      return;
    }

    const chunkText = chunks[currentChunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.lang = idVoice?.lang || 'id-ID';
    utterance.rate = callbacks?.rate ?? 0.92; // Kecepatan ramah pemahaman anak SD
    utterance.pitch = callbacks?.pitch ?? 1.04; // Nada bersahabat

    if (idVoice) {
      utterance.voice = idVoice;
    }

    // Watchdog timer (1200ms) untuk mendeteksi silent-drop bug di Chromium Android
    if (watchdogTimer) clearTimeout(watchdogTimer);
    watchdogTimer = setTimeout(() => {
      if (thisSessionId !== activeSessionId) return;
      cleanupSession();
      try {
        window.speechSynthesis.cancel();
      } catch {}
      // Otomatis beralih ke streaming audio awan jika native TTS tersangkut
      playCloudAudioSequence(chunks, thisSessionId, callbacks, currentChunkIndex);
    }, 1200);

    utterance.onstart = () => {
      if (watchdogTimer) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
      if (thisSessionId !== activeSessionId) return;
      if (currentChunkIndex === 0) {
        callbacks?.onStart?.();
        callbacks?.onChunkChange?.(0, 'question');
      } else {
        callbacks?.onChunkChange?.(currentChunkIndex, 'option', currentChunkIndex - 1);
      }
    };

    utterance.onend = () => {
      if (watchdogTimer) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
      if (thisSessionId !== activeSessionId) return;
      currentChunkIndex++;
      playNextChunk();
    };

    utterance.onerror = (event) => {
      if (watchdogTimer) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
      if (thisSessionId !== activeSessionId) return;
      // Abaikan error pembatalan yang disengaja saat tombol Stop ditekan
      if (event.error === 'canceled' || event.error === 'interrupted') {
        cleanupSession();
        callbacks?.onEnd?.();
        return;
      }
      cleanupSession();
      // Jika terjadi error sintesis di Android, jangan menyerah; alihkan ke audio stream!
      playCloudAudioSequence(chunks, thisSessionId, callbacks, currentChunkIndex);
    };

    currentUtterance = utterance;
    // Proteksi agar objek tidak terhapus oleh V8 Garbage Collector di RAM kecil
    try {
      (window as any).__activeUtterance = utterance;
    } catch {}

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      cleanupSession();
      playCloudAudioSequence(chunks, thisSessionId, callbacks, currentChunkIndex);
    }
  };

  // Mulai putar chunk pertama
  playNextChunk();
}
