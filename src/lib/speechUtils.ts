/**
 * Utilitas Text-to-Speech (TTS) Ramah Anak SD
 * Membantu siswa kelas awal (Fase A) dan inklusif membaca soal kuis dengan suara jernih Bahasa Indonesia.
 * 100% Berjalan Lokal via Browser Web Speech API tanpa kuota / API Key.
 */

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeech(): void {
  if (isSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
      currentUtterance = null;
    } catch {}
  }
}

export function isSpeaking(): boolean {
  if (!isSpeechSupported()) return false;
  return window.speechSynthesis.speaking || Boolean(currentUtterance);
}

/**
 * Membacakan pertanyaan kuis dan pilihan opsi dalam Bahasa Indonesia.
 */
export function speakQuestion(
  questionText: string,
  options?: string[],
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }
): void {
  if (!isSpeechSupported()) {
    callbacks?.onError?.();
    return;
  }

  stopSpeech();

  // Bersihkan teks dari markup khusus agar dibaca luwes
  const cleanQ = questionText
    .replace(/[×*]/g, ' kali ')
    .replace(/[÷/]/g, ' bagi ')
    .replace(/[-−]/g, ' kurang ')
    .replace(/[+]/g, ' tambah ')
    .replace(/[=]/g, ' sama dengan ')
    .replace(/\s+/g, ' ')
    .trim();

  let fullSpeechText = `Pertanyaan: ${cleanQ}.`;

  if (options && options.length > 0) {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const optSpoken = options
      .map((opt, i) => `Pilihan ${letters[i] || i + 1}: ${opt}`)
      .join('. ');
    fullSpeechText += ` ${optSpoken}.`;
  }

  const utterance = new SpeechSynthesisUtterance(fullSpeechText);
  utterance.lang = 'id-ID';
  utterance.rate = 0.92; // Kecepatan tenang dan ramah untuk pemahaman anak SD
  utterance.pitch = 1.05; // Nada cerah dan bersahabat

  // Cari suara Bahasa Indonesia terbaik di perangkat
  const voices = window.speechSynthesis.getVoices();
  const idVoice = voices.find(
    (v) => v.lang === 'id-ID' || v.lang.startsWith('id') || v.name.toLowerCase().includes('indonesia')
  );
  if (idVoice) {
    utterance.voice = idVoice;
  }

  utterance.onstart = () => {
    callbacks?.onStart?.();
  };

  utterance.onend = () => {
    currentUtterance = null;
    callbacks?.onEnd?.();
  };

  utterance.onerror = () => {
    currentUtterance = null;
    callbacks?.onError?.();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}
