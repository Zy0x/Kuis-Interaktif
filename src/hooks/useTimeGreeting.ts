import { useState, useEffect } from 'react';

export type TimePhase = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'midnight';

export interface TimeGreetingData {
  phase: TimePhase;
  label: string;
  emoji: string;
  greetingPrefix: string;
  studentQuote: string;
  teacherQuote: string;
  gradientClass: string;
  currentTimeString: string;
}

export const getTimePhase = (date: Date): TimePhase => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // 00:00 - 02:59 -> midnight
  if (totalMinutes < 3 * 60) {
    return 'midnight';
  }
  // 03:00 - 05:59 -> dawn
  if (totalMinutes < 6 * 60) {
    return 'dawn';
  }
  // 06:00 - 10:59 -> morning (matahari sedikit/terbit)
  if (totalMinutes < 11 * 60) {
    return 'morning';
  }
  // 11:00 - 14:59 -> noon (matahari penuh/siang)
  if (totalMinutes < 15 * 60) {
    return 'noon';
  }
  // 15:00 - 18:29 -> afternoon (sore/senja keemasan)
  if (totalMinutes < 18 * 60 + 30) {
    return 'afternoon';
  }
  // 18:30 - 23:59 -> evening (malam berbintang)
  return 'evening';
};

export const getTimeGreetingData = (phase: TimePhase, date: Date): TimeGreetingData => {
  const hoursStr = String(date.getHours()).padStart(2, '0');
  const minsStr = String(date.getMinutes()).padStart(2, '0');
  const currentTimeString = `${hoursStr}:${minsStr}`;

  switch (phase) {
    case 'morning':
      return {
        phase: 'morning',
        label: 'Pagi Hari',
        emoji: '🌅',
        greetingPrefix: 'Selamat Pagi',
        studentQuote: 'Awali harimu dengan semangat baru! Pilih kuis favoritmu dan kumpulkan 3 Bintang Emas hari ini.',
        teacherQuote: 'Selamat mengawali aktivitas belajar mengajar di sekolah! Pantau kuis aktif atau tampilkan ke Smartboard.',
        gradientClass: 'bg-gradient-to-r from-amber-600 via-sky-600 to-blue-700 dark:from-amber-950/70 dark:via-sky-950/60 dark:to-slate-900',
        currentTimeString,
      };

    case 'noon':
      return {
        phase: 'noon',
        label: 'Siang Hari',
        emoji: '☀️',
        greetingPrefix: 'Selamat Siang',
        studentQuote: 'Tetap ceria & berenergi di siang hari! Uji ketangkasan berpikirmu lewat latihan kuis interaktif.',
        teacherQuote: 'Sesi belajar tengah hari yang aktif! Tinjau rekapan nilai siswa atau luncurkan kuis kilat di kelas.',
        gradientClass: 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 dark:from-sky-950/80 dark:via-blue-950/70 dark:to-slate-900',
        currentTimeString,
      };

    case 'afternoon':
      return {
        phase: 'afternoon',
        label: 'Sore Hari',
        emoji: '🌇',
        greetingPrefix: 'Selamat Sore',
        studentQuote: 'Sore yang menyenangkan! Luangkan sedikit waktu untuk mengulang materi kuis sebelum beristirahat.',
        teacherQuote: 'Mempersiapkan materi esok hari? Buat kuis baru atau cetak Lembar Kerja Siswa (LKS) dengan praktis.',
        gradientClass: 'bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-800 dark:from-amber-950/70 dark:via-orange-950/60 dark:to-slate-900',
        currentTimeString,
      };

    case 'evening':
      return {
        phase: 'evening',
        label: 'Malam Hari',
        emoji: '🌙',
        greetingPrefix: 'Selamat Malam',
        studentQuote: 'Malam tenang yang asyik! Yuk asah pengetahuanmu dengan santai dan raih lencana prestasimu.',
        teacherQuote: 'Waktu santai untuk evaluasi! Periksa statistik pemahaman siswa dan kelola bank soal kelas.',
        gradientClass: 'bg-gradient-to-r from-indigo-900 via-blue-950 to-slate-950 dark:from-slate-950 dark:via-indigo-950/90 dark:to-slate-900',
        currentTimeString,
      };

    case 'midnight':
      return {
        phase: 'midnight',
        label: 'Tengah Malam',
        emoji: '✨',
        greetingPrefix: 'Selamat Malam',
        studentQuote: 'Sudah larut malam! Belajar sebentar boleh, tapi jangan lupa istirahat yang cukup untuk esok hari ya.',
        teacherQuote: 'Terima kasih atas dedikasi tanpa lelah, Bapak/Ibu Guru. Jaga kesehatan dan selamat beristirahat.',
        gradientClass: 'bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950',
        currentTimeString,
      };

    case 'dawn':
    default:
      return {
        phase: 'dawn',
        label: 'Dini Hari (Fajar)',
        emoji: '🌌',
        greetingPrefix: 'Selamat Dini Hari',
        studentQuote: 'Suasana fajar yang sejuk & tenang! Bangun lebih awal membuat pikiran segar menyambut ilmu baru.',
        teacherQuote: 'Menyambut fajar hari baru penuh inspirasi. Ruang Pendidik SD siap mendampingi proses belajar anak didik.',
        gradientClass: 'bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 dark:from-slate-950 dark:via-purple-950/60 dark:to-slate-900',
        currentTimeString,
      };
  }
};

export const useTimeGreeting = (overridePhase?: TimePhase) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [urlPhase, setUrlPhase] = useState<TimePhase | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('phase') as TimePhase | null;
      if (p && ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'midnight'].includes(p)) {
        setUrlPhase(p);
      }
    }

    // Update every 60 seconds
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const activePhase = overridePhase || urlPhase || getTimePhase(currentDate);
  const data = getTimeGreetingData(activePhase, currentDate);

  return {
    ...data,
    date: currentDate,
  };
};
