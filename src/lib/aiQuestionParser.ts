import type { QuizQuestion, QuestionType, Subject, EducationLevel } from '../types/quiz';

export interface GeneratePromptParams {
  subject: Subject;
  grade: number;
  topic: string;
  count: number;
  educationLevel?: EducationLevel;
  questionType?: QuestionType | 'campuran';
  difficulty?: 'mudah' | 'sedang' | 'menantang';
  contextNotes?: string;
  typeProportions?: {
    multiple_choice?: number;
    true_false?: number;
    short_answer?: number;
    matching_pairs?: number;
  };
  includeImages?: boolean;
  mcOptionCount?: number; // 3, 4, atau 5 pilihan
  trueFalseStyle?: 'benar_salah' | 'sesuai_tidak' | 'ya_tidak';
  matchingPairCount?: number; // 3, 4, atau 5 pasang
}

export interface ParsedQuestionItem {
  id: string;
  valid: boolean;
  question: QuizQuestion;
  errorReason?: string;
}

/**
 * Utilitas penyalin teks ke clipboard yang tangguh dan universal:
 * 1. Mendukung Clipboard API modern (navigator.clipboard.writeText)
 * 2. Fallback otomatis ke targetElement jika disediakan (langsung select & copy)
 * 3. Fallback ke document.execCommand('copy') via textarea tersembunyi
 * 4. Bekerja sempurna pada lingkungan non-HTTPS (HTTP LAN), WebView, iOS Safari, dan Android
 */
export async function copyTextToClipboard(
  text: string,
  targetElement?: HTMLTextAreaElement | HTMLInputElement | null
): Promise<boolean> {
  if (!text) return false;

  // 1. Coba Clipboard API modern terlebih dahulu (jika tersedia dan diizinkan browser)
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (apiErr) {
      console.warn('navigator.clipboard.writeText tidak dapat diakses, mencoba fallback:', apiErr);
    }
  }

  // 2. Jika elemen target (textarea yang sudah terpasang di DOM) tersedia, salin langsung
  if (targetElement && typeof document !== 'undefined') {
    try {
      targetElement.focus({ preventScroll: true });
      targetElement.select();
      if (typeof targetElement.setSelectionRange === 'function') {
        targetElement.setSelectionRange(0, text.length);
      }
      const success = document.execCommand('copy');
      if (success) {
        return true;
      }
    } catch (targetErr) {
      console.warn('Penyalinan via targetElement gagal:', targetErr);
    }
  }

  // 3. Fallback umum: buat elemen textarea tersembunyi
  if (typeof document !== 'undefined') {
    let textArea: HTMLTextAreaElement | null = null;
    try {
      textArea = document.createElement('textarea');
      textArea.value = text;

      // Pengaturan gaya agar tidak memicu layout shift atau terlihat di layar
      textArea.style.fontSize = '12pt';
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '-9999px';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0';
      textArea.style.zIndex = '-9999';
      textArea.setAttribute('readonly', '');

      document.body.appendChild(textArea);

      textArea.focus({ preventScroll: true });
      textArea.select();
      if (typeof textArea.setSelectionRange === 'function') {
        textArea.setSelectionRange(0, text.length);
      }

      const success = document.execCommand('copy');
      if (textArea.parentNode) {
        document.body.removeChild(textArea);
      }
      textArea = null;

      if (success) {
        return true;
      }
    } catch (fallbackErr) {
      console.warn('Fallback document.execCommand gagal:', fallbackErr);
      if (textArea && textArea.parentNode) {
        document.body.removeChild(textArea);
      }
    }
  }

  return false;
}

/**
 * Membersihkan awalan label huruf atau angka pada teks opsi pilihan ganda
 * Contoh: "A. Harimau" -> "Harimau", "(B) Kelinci" -> "Kelinci", "1. Kucing" -> "Kucing"
 */
export const cleanOptionText = (opt: any): string => {
  if (typeof opt !== 'string') return String(opt ?? '').trim();
  let cleaned = opt.trim();
  // Hilangkan pola awalan seperti:
  cleaned = cleaned.replace(/^(\*?\s*[\(\[]?[A-Ea-e0-9]+(?:[\)\]]|\s*[-–—:\.\)])\s*)/, '').trim();
  return cleaned;
};

/**
 * Menyelesaikan indeks jawaban benar secara toleran dari berbagai bentuk keluaran AI:
 * - Integer 0-based: 0, 1, 2
 * - String angka: "0", "1", "2"
 * - Huruf opsi: "A", "B", "C", "D", "E"
 * - Teks opsi langsung: "Harimau"
 */
export const resolveCorrectIndex = (
  rawCorrect: any,
  rawKunci: any,
  options: string[]
): number => {
  if (options.length === 0) return 0;

  // 1. Jika sudah bertipe number murni
  if (typeof rawCorrect === 'number' && !isNaN(rawCorrect)) {
    let idx = Math.floor(rawCorrect);
    // Jika AI keliru menggunakan 1-based indexing (misal 1 untuk A, 4 untuk D) dan idx == options.length
    if (idx === options.length && options.length > 0) {
      idx = options.length - 1;
    }
    return Math.min(Math.max(0, idx), options.length - 1);
  }
  if (typeof rawKunci === 'number' && !isNaN(rawKunci)) {
    let idx = Math.floor(rawKunci);
    if (idx === options.length && options.length > 0) {
      idx = options.length - 1;
    }
    return Math.min(Math.max(0, idx), options.length - 1);
  }

  // 2. Jika string
  const val = String(rawCorrect ?? rawKunci ?? '').trim();
  if (!val) return 0;

  // Cek apakah string angka: "0", "1", "2", dll
  if (/^\d+$/.test(val)) {
    let num = parseInt(val, 10);
    if (num === options.length && options.length > 0) {
      num = options.length - 1;
    }
    return Math.min(Math.max(0, num), options.length - 1);
  }

  // Cek apakah huruf A, B, C, D, E (dengan atau tanpa tanda baca kurung/titik)
  const letterMatch = val.match(/^[\(\[]?([A-Ea-e])[\)\]\.\:\-]?$/i);
  if (letterMatch) {
    const letter = letterMatch[1].toUpperCase();
    const idx = ['A', 'B', 'C', 'D', 'E'].indexOf(letter);
    if (idx >= 0 && idx < options.length) {
      return idx;
    }
  }

  // Cek pencocokan teks opsi langsung
  const cleanVal = cleanOptionText(val).toLowerCase();
  const foundIdx = options.findIndex((opt) => cleanOptionText(opt).toLowerCase() === cleanVal);
  if (foundIdx >= 0) {
    return foundIdx;
  }

  // Pencocokan substring toleran
  const partialIdx = options.findIndex((opt) => {
    const o = cleanOptionText(opt).toLowerCase();
    return o.length > 2 && (o.includes(cleanVal) || cleanVal.includes(o));
  });
  if (partialIdx >= 0) {
    return partialIdx;
  }

  return 0;
};

/**
 * Sanitasi string JSON sebelum diurai:
 * Mengatasi smart quotes, trailing comma, komentar JS, dan karakter tak terlihat.
 */
const sanitizeJsonString = (str: string): string => {
  return str
    // Standarisasi tanda petik miring / tipografis (smart quotes)
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    // Hapus komentar satu baris //...
    .replace(/\/\/[^\r\n]*$/gm, '')
    // Hapus komentar multi-baris /* ... */
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Hapus trailing comma sebelum kurung tutup } atau ]
    .replace(/,\s*([\]\}])/g, '$1')
    // Hapus karakter zero-width tak terlihat
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
};

/**
 * Mengekstraksi substring JSON yang valid dari teks luaran AI
 * Membuang kalimat basa-basi pembuka dan penutup secara presisi.
 */
const extractJsonSubstring = (text: string): string | null => {
  let clean = text.trim();
  // Hilangkan pembungkus markdown ```json ... ``` jika ada
  if (clean.includes('```')) {
    const codeBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      clean = codeBlockMatch[1].trim();
    }
  }

  // Cari blok array [ ... ]
  const firstBracket = clean.indexOf('[');
  const lastBracket = clean.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    return clean.substring(firstBracket, lastBracket + 1);
  }

  // Cek apakah dibungkus objek { "questions": [ ... ] } atau { "soal": [ ... ] }
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return clean.substring(firstBrace, lastBrace + 1);
  }

  return null;
};

/**
 * Menghasilkan teks instruksi prompt terstruktur presisi tinggi untuk ditempel
 * pada AI eksternal (ChatGPT, Google Gemini, Claude, DeepSeek, dll).
 * Menjamin 100% kepatuhan format JSON, anti-chat role lock, dan bebas AI slop.
 */
export const generateAiPrompt = (params: GeneratePromptParams): string => {
  const level = params.educationLevel || (params.grade >= 10 ? 'SMA' : params.grade >= 7 ? 'SMP' : 'SD');
  const mcCount = params.mcOptionCount || (level === 'SMA' ? 5 : (level === 'SD' && params.grade <= 2 ? 3 : 4));
  const mcLetters = ['A', 'B', 'C', 'D', 'E'].slice(0, mcCount).join(', ');
  
  const tfLabels = params.trueFalseStyle === 'sesuai_tidak' 
    ? ['Sesuai', 'Tidak Sesuai'] 
    : params.trueFalseStyle === 'ya_tidak' 
    ? ['Ya', 'Tidak'] 
    : ['Benar', 'Salah'];
  const tfOptions = JSON.stringify(tfLabels);
  
  const matchingCount = params.matchingPairCount || (level === 'SD' ? 3 : 4);

  // Tentukan jenis soal yang aktif berdasarkan input pengguna
  const activeTypes: QuestionType[] = [];
  let typeInstruction = '';

  if (params.typeProportions) {
    const p = params.typeProportions;
    const parts: string[] = [];
    if (p.multiple_choice && p.multiple_choice > 0) {
      activeTypes.push('multiple_choice');
      parts.push(`${p.multiple_choice} butir Pilihan Ganda (type: "multiple_choice", ${mcCount} opsi: ${mcLetters})`);
    }
    if (p.true_false && p.true_false > 0) {
      activeTypes.push('true_false');
      parts.push(`${p.true_false} butir Benar/Salah (type: "true_false", opsi: ${tfOptions})`);
    }
    if (p.short_answer && p.short_answer > 0) {
      activeTypes.push('short_answer');
      parts.push(`${p.short_answer} butir Isian Singkat (type: "short_answer", sertakan variasi pada acceptableAnswers)`);
    }
    if (p.matching_pairs && p.matching_pairs > 0) {
      activeTypes.push('matching_pairs');
      parts.push(`${p.matching_pairs} butir Menjodohkan (type: "matching_pairs", tepat ${matchingCount} pasang kartu)`);
    }
    if (parts.length > 0) {
      typeInstruction = `Wajib ikuti pembagian proporsi tipe soal berikut secara tepat:\n- ${parts.join('\n- ')}`;
    }
  } else if (params.questionType === 'true_false') {
    activeTypes.push('true_false');
    typeInstruction = `Gunakan HANYA tipe Benar / Salah (type: "true_false") dengan 2 opsi tepat: ${tfOptions}.`;
  } else if (params.questionType === 'short_answer') {
    activeTypes.push('short_answer');
    typeInstruction = 'Gunakan HANYA tipe Isian Singkat (type: "short_answer"). Siswa mengetikkan 1-2 kata kunci atau angka. Wajib sertakan 2-4 sinonim/variasi jawaban pada array acceptableAnswers.';
  } else if (params.questionType === 'image_guess') {
    activeTypes.push('image_guess');
    typeInstruction = `Gunakan HANYA tipe Tebak Gambar Misteri (type: "image_guess") dengan ${mcCount} opsi (${mcLetters}) dan wajib sertakan imageCaption nama objek yang ditebak.`;
  } else if (params.questionType === 'matching_pairs') {
    activeTypes.push('matching_pairs');
    typeInstruction = `Gunakan HANYA tipe Menjodohkan (type: "matching_pairs") dengan tepat ${matchingCount} pasang kartu konsep kiri (left) dan kanan (right).`;
  } else if (params.questionType === 'campuran') {
    activeTypes.push('multiple_choice', 'true_false', 'short_answer', 'matching_pairs');
    typeInstruction = `Campurkan secara seimbang format soal berikut:\n- Pilihan Ganda (type: "multiple_choice", ${mcCount} opsi: ${mcLetters})\n- Benar / Salah (type: "true_false", opsi: ${tfOptions})\n- Isian Singkat (type: "short_answer", acceptableAnswers)\n- Menjodohkan (type: "matching_pairs", ${matchingCount} pasang)`;
  } else {
    // Default: Pilihan Ganda saja
    activeTypes.push('multiple_choice');
    typeInstruction = `Gunakan HANYA tipe Pilihan Ganda (type: "multiple_choice") dengan tepat ${mcCount} opsi (${mcLetters}).`;
  }

  if (activeTypes.length === 0) {
    activeTypes.push('multiple_choice');
  }

  const contextBlock = params.contextNotes && params.contextNotes.trim()
    ? `- Bahan Pertimbangan / Konteks Khusus: "${params.contextNotes.trim()}"\n`
    : '';

  const imageBlock = params.includeImages
    ? `- Kebutuhan Gambar: Karena opsi ilustrasi diaktifkan, pada SETIAP butir soal sertakan properti "imageCaption" (label singkat bahasa Indonesia) dan "imagePrompt" (deskripsi visual 1 kalimat bahasa Inggris untuk generator gambar).\n`
    : '';

  const levelText = level === 'SMA'
    ? `Kelas ${params.grade} SMA / SMK (Fase ${params.grade === 10 ? 'E' : 'F'})`
    : level === 'SMP'
      ? `Kelas ${params.grade} SMP (Fase D)`
      : `Kelas ${params.grade} SD (Fase ${params.grade <= 2 ? 'A' : params.grade <= 4 ? 'B' : 'C'})`;

  // Buat contoh dinamis HANYA untuk tipe soal yang aktif (mencegah model AI bodoh bingung atau salah tiru)
  const sampleItems: string[] = [];

  if (activeTypes.includes('multiple_choice')) {
    const sampleOptions = mcCount === 3
      ? '["Pilihan Satu", "Pilihan Dua", "Pilihan Tiga"]'
      : mcCount === 5
      ? '["Pilihan Satu", "Pilihan Dua", "Pilihan Tiga", "Pilihan Empat", "Pilihan Lima"]'
      : '["Pilihan Satu", "Pilihan Dua", "Pilihan Tiga", "Pilihan Empat"]';

    sampleItems.push(`  {
    "type": "multiple_choice",
    "text": "Pertanyaan materi dengan stimulus penalaran yang jelas?",
    "options": ${sampleOptions},
    "correctIndex": 0,
    "explanation": "Penjelasan konsep mengapa jawaban pertama benar (1-3 kalimat edukatif).",
    "points": 10${params.includeImages ? ',\n    "imageCaption": "🌱 Label Ilustrasi Materi",\n    "imagePrompt": "Educational clean illustration of the topic"' : ''}
  }`);
  }

  if (activeTypes.includes('true_false')) {
    sampleItems.push(`  {
    "type": "true_false",
    "text": "Pernyataan materi faktual atau konseptual yang diuji kebenarannya?",
    "options": ${tfOptions},
    "correctIndex": 0,
    "explanation": "Penjelasan konsep pendukung mengapa pernyataan ini bernilai benar/salah.",
    "points": 10${params.includeImages ? ',\n    "imageCaption": "🔬 Label Ilustrasi Materi",\n    "imagePrompt": "A scientific diagram illustrating the fact"' : ''}
  }`);
  }

  if (activeTypes.includes('short_answer')) {
    sampleItems.push(`  {
    "type": "short_answer",
    "text": "Pertanyaan isian singkat terarah yang membutuhkan jawaban presisi?",
    "acceptableAnswers": ["Kunci Utama", "variasi sinonim", "ejaan lain", "angka"],
    "explanation": "Penjelasan konsep materi yang melatarbelakangi jawaban yang tepat.",
    "points": 10${params.includeImages ? ',\n    "imageCaption": "📝 Label Ilustrasi",\n    "imagePrompt": "A clear graphic representing the answer"' : ''}
  }`);
  }

  if (activeTypes.includes('matching_pairs')) {
    const samplePairs = Array.from({ length: matchingCount }, (_, i) => 
      `      {"left": "Konsep ${i + 1}", "right": "Pasangan ${i + 1}"}`
    ).join(',\n');

    sampleItems.push(`  {
    "type": "matching_pairs",
    "text": "Jodohkan konsep di sebelah kiri dengan pasangan definisinya di sebelah kanan!",
    "matchingPairs": [
${samplePairs}
    ],
    "explanation": "Penjelasan keterkaitan antarkonsep yang dijodohkan.",
    "points": 15${params.includeImages ? ',\n    "imageCaption": "🧩 Label Ilustrasi Menjodohkan",\n    "imagePrompt": "Diagram showing the related concepts connected together"' : ''}
  }`);
  }

  if (activeTypes.includes('image_guess')) {
    const sampleOptions = mcCount === 3
      ? '["Objek Satu", "Objek Dua", "Objek Tiga"]'
      : mcCount === 5
      ? '["Objek Satu", "Objek Dua", "Objek Tiga", "Objek Empat", "Objek Lima"]'
      : '["Objek Satu", "Objek Dua", "Objek Tiga", "Objek Empat"]';

    sampleItems.push(`  {
    "type": "image_guess",
    "text": "Perhatikan petunjuk visual berikut! Apakah nama objek/organ ini?",
    "options": ${sampleOptions},
    "correctIndex": 0,
    "imageCaption": "🫁 Organ Paru-paru",
    "explanation": "Penjelasan identitas dan fungsi objek tersebut.",
    "points": 10${params.includeImages ? ',\n    "imagePrompt": "Clean 3D medical style render of human lungs on plain background"' : ''}
  }`);
  }

  const exampleJsonBlock = `[\n${sampleItems.join(',\n')}\n]`;

  return `[SISTEM INSTRUKSI: GENERATOR DATA SOAL / HEADLESS JSON COMPILER]
PERAN ANDA:
Anda bertindak murni sebagai ENGINE GENERATOR DATA SOAL berstandar Kurikulum Merdeka Indonesia.
⚠️ PERHATIAN PENTING: Anda BUKAN pemandu kuis interaktif, BUKAN asisten obrolan (chat assistant), dan BUKAN lawan bermain kuis!

PERINGATAN KERAS & ATURAN MUTLAK (WAJIB DIPATUHI 100%):
1. DILARANG KERAS mengajak pengguna bermain kuis di dalam obrolan chat!
2. JANGAN menyapa ("Halo!", "Tentu!", "Siap!"), JANGAN bertanya ("Apakah kamu siap?"), dan JANGAN menyajikan soal satu demi satu!
3. WAJIB hasilkan SELURUH ${params.count} butir soal SEKALIGUS dalam SATU respons utuh!
4. DILARANG menyisipkan teks pengantar atau penutup apapun di luar blok kode JSON!
5. Keluaran WAJIB diawali dengan karakter '[' dan diakhiri dengan karakter ']' (HANYA SATU BLOK KODE JSON MURNI).

SPESIFIKASI SOAL:
- Mata Pelajaran: ${params.subject}
- Tingkat / Jenjang: ${levelText}
- Topik Pembahasan: "${params.topic}"
- Jumlah Target: TEPAT ${params.count} butir soal lengkap
- Tingkat Kesulitan: ${params.difficulty || 'sedang'} (berbobot edukatif, menstimulasi penalaran, kontekstual)
${contextBlock}${imageBlock}- Aturan Tipe Soal:
  ${typeInstruction}

PANDUAN STRUKTUR JSON (ANTI-KESALAHAN FORMAT):
1. Properti "type": Wajib bernilai salah satu dari: ${activeTypes.map((t) => `"${t}"`).join(', ')}.
2. Properti "text": Teks pertanyaan yang jelas, berbobot, dan tidak ambigu.
3. Properti "options": Array string berisi teks jawaban MURNI.
   ⚠️ DILARANG MENYERTAKAN AWALAN HURUF SEPERTI "A. ", "B. ", "1. " DI DALAM ARRAY OPTIONS!
   - Contoh BENAR: ["Jakarta", "Surabaya", "Bandung", "Medan"]
   - Contoh SALAH: ["A. Jakarta", "B. Surabaya", "C. Bandung", "D. Medan"]
4. Properti "correctIndex": WAJIB ANGKA BULAT INTEGER 0-BASED (0 untuk opsi pertama, 1 untuk opsi kedua, dst).
   ⚠️ DILARANG MENGGUNAKAN HURUF ("A", "B") DAN DILARANG MENGGUNAKAN STRING ("0").
5. Properti "explanation": Penjelasan konsep mengapa kunci tersebut benar (1-3 kalimat edukatif).
6. Properti "points": Nilai poin standar (10 untuk pilihan ganda/isian/benar-salah, 15 untuk menjodohkan).
7. Validitas JSON: Wajib mematuhi RFC 8259. DILARANG menggunakan trailing comma (koma gantung sebelum '}' atau ']') dan DILARANG menyisipkan komentar (seperti // atau /* */).

CONTOH FORMAT KELUARAN YANG DIWAJIBKAN:
${exampleJsonBlock}

PENGINGAT TERAKHIR:
Hasilkan TEPAT ${params.count} butir soal di atas SEKALIGUS sekarang juga. Mulai respons Anda langsung dengan karakter '[':`;
};

/**
 * Mengurai teks mentah (baik JSON maupun format teks bernomor bebas) menjadi
 * butir-butir soal yang siap dimasukkan ke Bank Soal kuis.
 * Dilengkapi pertahanan berlapis terhadap format AI eksternal yang tidak sempurna.
 */
export const parseRawQuestionsText = (rawText: string): ParsedQuestionItem[] => {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  // 1. Ekstraksi & penguraian JSON dengan sanitasi tangguh
  const jsonCandidate = extractJsonSubstring(trimmed);
  if (jsonCandidate) {
    try {
      const sanitized = sanitizeJsonString(jsonCandidate);
      let parsed: any = null;

      try {
        parsed = JSON.parse(sanitized);
      } catch {
        // Coba perbaiki format jika model AI menggunakan kutip satu (single quotes)
        try {
          const fixedQuotes = sanitized
            .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g, '"$1":')
            .replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ': "$1"');
          parsed = JSON.parse(fixedQuotes);
        } catch {
          // Gagal JSON, lanjut ke pengujian format lain di bawah
        }
      }

      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.questions)
        ? parsed.questions
        : Array.isArray(parsed?.soal)
        ? parsed.soal
        : Array.isArray(parsed?.data)
        ? parsed.data
        : null;

      if (list && list.length > 0) {
        return list.map((item: any, idx: number): ParsedQuestionItem => {
          const id = 'q_ai_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_' + idx;
          const text = String(item.text || item.question || item.pertanyaan || item.soal || '').trim();
          const explanation = String(item.explanation || item.pembahasan || item.alasan || item.penjelasan || 'Jawaban ini benar sesuai konsep materi.').trim();
          const imageCaption = item.imageCaption || item.ilustrasi ? String(item.imageCaption || item.ilustrasi).trim() : undefined;
          const imageUrl = item.imageUrl || item.gambar ? String(item.imageUrl || item.gambar).trim() : undefined;
          const points = typeof item.points === 'number' && item.points > 0 ? item.points : (typeof item.poin === 'number' && item.poin > 0 ? item.poin : 10);
          const customDurationSec = typeof item.customDurationSec === 'number' && item.customDurationSec > 0 ? item.customDurationSec : undefined;

          const rawType = String(item.type || item.tipe || '').toLowerCase().trim();
          let type: QuestionType = 'multiple_choice';

          if (rawType === 'true_false' || rawType === 'benar_salah' || rawType === 'benar-salah' || rawType === 'bs' || rawType === 'b/s' || rawType === 'sesuai_tidak' || rawType === 'ya_tidak') {
            type = 'true_false';
          } else if (rawType === 'short_answer' || rawType === 'isian' || rawType === 'isian_singkat' || rawType === 'isian singkat' || item.acceptableAnswers || item.variasi_jawaban) {
            type = 'short_answer';
          } else if (rawType === 'matching_pairs' || rawType === 'menjodohkan' || rawType === 'jodohkan' || rawType === 'pasangan' || item.matchingPairs || item.pasangan) {
            type = 'matching_pairs';
          } else if (rawType === 'image_guess' || rawType === 'tebak_gambar' || rawType === 'tebak gambar') {
            type = 'image_guess';
          } else if (Array.isArray(item.options) && item.options.length === 2 && (String(item.options[0]).toLowerCase() === 'benar' || String(item.options[0]).toLowerCase() === 'ya' || String(item.options[0]).toLowerCase() === 'sesuai')) {
            type = 'true_false';
          }

          // Validasi teks pertanyaan
          if (!text) {
            return {
              id,
              valid: false,
              errorReason: 'Teks pertanyaan kosong.',
              question: { id, text: 'Soal Tanpa Teks', type, options: ['-', '-'], correctIndex: 0, explanation, points }
            };
          }

          // A. Format Benar / Salah
          if (type === 'true_false') {
            const rawOptions = Array.isArray(item.options) ? item.options : (Array.isArray(item.pilihan) ? item.pilihan : []);
            const options = rawOptions.length >= 2 ? rawOptions.slice(0, 2).map((o: any) => cleanOptionText(o)) : ['Benar', 'Salah'];
            
            let correctIndex = 0;
            const val = String(item.correctIndex ?? item.kunci ?? item.jawaban ?? '').toLowerCase().trim();
            if (val.includes('salah') || val.includes('tidak') || val.includes('false') || val === '1' || val === 'b') {
              correctIndex = 1;
            } else if (typeof item.correctIndex === 'number') {
              correctIndex = item.correctIndex === 1 ? 1 : 0;
            }

            return {
              id,
              valid: true,
              question: {
                id,
                text,
                type: 'true_false',
                options,
                correctIndex,
                explanation,
                imageCaption,
                imageUrl,
                points,
                customDurationSec
              }
            };
          }

          // B. Format Isian Singkat (Short Answer)
          if (type === 'short_answer') {
            let acceptable: string[] = [];
            if (Array.isArray(item.acceptableAnswers)) {
              acceptable = item.acceptableAnswers.map((s: any) => cleanOptionText(s)).filter(Boolean);
            } else if (Array.isArray(item.variasi_jawaban)) {
              acceptable = item.variasi_jawaban.map((s: any) => cleanOptionText(s)).filter(Boolean);
            } else if (typeof item.acceptableAnswers === 'string') {
              acceptable = item.acceptableAnswers.split(',').map((s: string) => cleanOptionText(s)).filter(Boolean);
            } else if (typeof item.kunci === 'string') {
              acceptable = [cleanOptionText(item.kunci)];
            } else if (typeof item.jawaban === 'string') {
              acceptable = [cleanOptionText(item.jawaban)];
            } else if (Array.isArray(item.options) && item.options.length > 0) {
              acceptable = [cleanOptionText(item.options[0])];
            }

            acceptable = Array.from(new Set(acceptable.filter(Boolean)));

            if (acceptable.length === 0) {
              return {
                id,
                valid: false,
                errorReason: 'Kunci jawaban isian singkat belum ditentukan.',
                question: { id, text, type, options: [''], correctIndex: 0, explanation, points }
              };
            }

            return {
              id,
              valid: true,
              question: {
                id,
                text,
                type: 'short_answer',
                options: [acceptable[0]],
                correctIndex: 0,
                acceptableAnswers: acceptable,
                explanation,
                imageCaption,
                imageUrl,
                points,
                customDurationSec
              }
            };
          }

          // C. Format Menjodohkan (Matching Pairs)
          if (type === 'matching_pairs') {
            const rawPairs = Array.isArray(item.matchingPairs) 
              ? item.matchingPairs 
              : (Array.isArray(item.pasangan) ? item.pasangan : (Array.isArray(item.pairs) ? item.pairs : []));

            const pairs: { left: string; right: string }[] = rawPairs
              .map((p: any) => {
                if (typeof p === 'string') {
                  const parts = p.split(/↔|<->|->|==|=/);
                  if (parts.length >= 2) {
                    return { left: cleanOptionText(parts[0]), right: cleanOptionText(parts[1]) };
                  }
                }
                return {
                  left: cleanOptionText(p.left || p.kiri || p.item || p.key || ''),
                  right: cleanOptionText(p.right || p.kanan || p.pasangan || p.value || p.match || '')
                };
              })
              .filter((p: { left: string; right: string }) => p.left && p.right);

            if (pairs.length < 2) {
              return {
                id,
                valid: false,
                errorReason: 'Minimal harus ada 2 pasangan kartu yang valid.',
                question: { id, text, type, options: [], correctIndex: 0, explanation, points }
              };
            }

            return {
              id,
              valid: true,
              question: {
                id,
                text,
                type: 'matching_pairs',
                options: pairs.map((p) => `${p.left} ↔ ${p.right}`),
                correctIndex: 0,
                matchingPairs: pairs,
                explanation,
                imageCaption,
                imageUrl,
                points: points || 15,
                customDurationSec
              }
            };
          }

          // D. Pilihan Ganda atau Tebak Gambar
          const rawOptions = Array.isArray(item.options) ? item.options : (Array.isArray(item.pilihan) ? item.pilihan : []);
          // Bersihkan awalan huruf dari opsi secara otomatis
          const options = rawOptions.map((o: any) => cleanOptionText(o)).filter(Boolean);

          const validIndex = resolveCorrectIndex(item.correctIndex, item.kunci || item.jawaban, options);

          if (options.length < 2) {
            return {
              id,
              valid: false,
              errorReason: 'Pilihan jawaban kurang dari 2 opsi.',
              question: { id, text, type, options, correctIndex: 0, explanation, imageCaption, points }
            };
          }

          return {
            id,
            valid: true,
            question: {
              id,
              text,
              type: type === 'image_guess' ? 'image_guess' : 'multiple_choice',
              options,
              correctIndex: validIndex,
              explanation,
              imageCaption,
              imageUrl,
              points,
              customDurationSec
            }
          };
        });
      }
    } catch {
      // Jika bukan JSON atau gagal parse, lanjutkan ke pemeriksa format selanjutnya
    }
  }

  // 2. Cek apakah teks berformat CSV (tabel baris berkoma atau bertitik-koma)
  if (isCsvFormat(trimmed)) {
    const csvParsed = parseCsvQuestions(trimmed);
    if (csvParsed.length > 0) {
      return csvParsed;
    }
  }

  // 3. Parser Teks Bebas Berbahasa Indonesia (Format 1. ... A. ... B. ... Kunci: ...)
  return parseNaturalTextFormat(trimmed);
};

/**
 * Parser pola teks alami (misal copy-paste dari Word, WhatsApp, atau ringkasan AI).
 * Tahan terhadap kalimat pembuka chat seperti "Halo! Berikut soal kuisnya:".
 */
const parseNaturalTextFormat = (text: string): ParsedQuestionItem[] => {
  const results: ParsedQuestionItem[] = [];
  
  // Cari posisi awal soal pertama untuk membuang salam pembuka percakapan AI
  const firstQuestionMatch = text.search(/(?:^|\n)\s*(?:(?:Soal|Pertanyaan|No\.?|Nomor)?\s*\**\d+[\.\)]|\#+\s*\d+)/i);
  const cleanText = firstQuestionMatch >= 0 ? text.substring(firstQuestionMatch).trim() : text.trim();

  // Pisahkan butir soal berdasarkan pola angka pembuka: "1.", "1)", "Soal 1:", "**1.**", dll
  const blocks = cleanText
    .split(/(?:^|\n)(?=(?:(?:Soal|Pertanyaan|No\.?|Nomor)?\s*\**\d+[\.\)]|\#+\s*\d+))/i)
    .filter((b) => b.trim().length > 0);

  blocks.forEach((block, idx) => {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const id = 'q_parsed_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_' + idx;
    
    let questionText = '';
    const optionLines: string[] = [];
    let detectedKeyVal: string | null = null;
    let explanationText = '';
    let isTrueFalse = false;
    let isShortAnswer = false;
    let isMatching = false;
    let acceptableAnswersList: string[] = [];
    const matchingPairsList: { left: string; right: string }[] = [];

    for (const line of lines) {
      // Deteksi format Menjodohkan: "Hidung ↔ Menyaring debu" atau "Kiri -> Kanan"
      const matchPairRegex = /^[-*•]?\s*([^↔\->=]+)\s*(?:↔|<->|->|==|=)\s*(.+)$/;
      const pairMatch = line.match(matchPairRegex);
      if (pairMatch && (isMatching || line.includes('↔') || line.includes('<->') || line.includes('->'))) {
        isMatching = true;
        matchingPairsList.push({ left: cleanOptionText(pairMatch[1]), right: cleanOptionText(pairMatch[2]) });
        continue;
      }

      // Deteksi kunci isian singkat: "Kunci Isian: ...", "Jawaban Singkat: ...", "Variasi: ..."
      const shortAnsMatch = line.match(/(?:Kunci\s*(?:Isian|Singkat)+|Jawaban\s*(?:Isian|Singkat)+|Variasi(?:\s*Jawaban)?|Acceptable\s*Answers?)\s*:\s*(.+)/i);
      if (shortAnsMatch) {
        isShortAnswer = true;
        const vals = shortAnsMatch[1].split(',').map((s) => cleanOptionText(s)).filter(Boolean);
        acceptableAnswersList.push(...vals);
        continue;
      }

      // Deteksi kunci jawaban umum: "Kunci: A", "Kunci Jawaban: B", "Jawaban: Benar", "Kunci: [A]"
      const keyMatch = line.match(/(?:Kunci(?:\s*Jawaban)?|Jawaban|Answer)\s*:\s*(\*?\s*[\(\[]?([A-Ea-e0-9]|Benar|Salah|True|False)[\)\]]?|[^\n]+)/i);
      if (keyMatch) {
        detectedKeyVal = keyMatch[1].replace(/[\*\[\]\(\)]/g, '').trim();
        continue;
      }

      // Deteksi pembahasan: "Pembahasan: ...", "Penjelasan: ...", "Alasan: ..."
      const expMatch = line.match(/(?:Pembahasan|Penjelasan|Alasan|Catatan|Explanation)\s*:\s*(.+)/i);
      if (expMatch) {
        explanationText = expMatch[1].trim();
        continue;
      }

      // Deteksi opsi pilihan: "A. ...", "B) ...", "*A. ...", "(A) ...", "- A. ...", "A - ..."
      const optMatch = line.match(/^(\*?\s*[-*•]?\s*[\(\[]?([A-Ea-e])(?:[\)\]]|\s*[-–—:\.\)])\s*)(.+)/i);
      if (optMatch) {
        if (optMatch[1].includes('*') || line.startsWith('*')) {
          detectedKeyVal = optMatch[2].toUpperCase();
        }
        optionLines.push(cleanOptionText(optMatch[3]));
        continue;
      }

      // Deteksi indikator Benar / Salah atau Menjodohkan
      if (line.match(/^(?:Opsi\s*:?\s*)?\[?(?:Benar|Salah|True|False|Sesuai|Tidak Sesuai)\]?/i) || line.includes('[B/S]')) {
        isTrueFalse = true;
      }
      if (line.toLowerCase().includes('jodohkan') || line.toLowerCase().includes('pasangkan')) {
        isMatching = true;
      }

      // Jika belum masuk opsi dan bukan metadata lain, anggap bagian dari teks pertanyaan
      if (optionLines.length === 0 && matchingPairsList.length === 0 && acceptableAnswersList.length === 0) {
        const cleanedQuestionLine = line
          .replace(/^(?:(?:Soal|Pertanyaan|No\.?|Nomor)?\s*\**\d+[\.\)]|\#+\s*\d+)\s*/i, '')
          .replace(/^\*\*|\*\*$/g, '')
          .trim();
        if (cleanedQuestionLine) {
          questionText += (questionText ? ' ' : '') + cleanedQuestionLine;
        }
      }
    }

    if (!questionText) {
      questionText = lines[0]
        .replace(/^(?:(?:Soal|Pertanyaan|No\.?|Nomor)?\s*\**\d+[\.\)]|\#+\s*\d+)\s*/i, '')
        .replace(/^\*\*|\*\*$/g, '')
        .trim();
    }

    // Kasus Menjodohkan
    if (isMatching && matchingPairsList.length >= 2) {
      results.push({
        id,
        valid: Boolean(questionText),
        errorReason: questionText ? undefined : 'Pertanyaan tidak terbaca.',
        question: {
          id,
          text: questionText || 'Jodohkan konsep berikut dengan pasangan yang tepat!',
          type: 'matching_pairs',
          options: matchingPairsList.map((p) => `${p.left} ↔ ${p.right}`),
          correctIndex: 0,
          matchingPairs: matchingPairsList,
          explanation: explanationText || 'Pasangan kartu telah dicocokkan sesuai materi.',
          points: 15
        }
      });
      return;
    }

    // Kasus Isian Singkat
    if (isShortAnswer && acceptableAnswersList.length > 0) {
      results.push({
        id,
        valid: Boolean(questionText),
        errorReason: questionText ? undefined : 'Pertanyaan tidak terbaca.',
        question: {
          id,
          text: questionText || 'Isilah titik-titik di bawah ini dengan tepat!',
          type: 'short_answer',
          options: [acceptableAnswersList[0]],
          correctIndex: 0,
          acceptableAnswers: acceptableAnswersList,
          explanation: explanationText || 'Jawaban ini benar sesuai konsep materi.',
          points: 10
        }
      });
      return;
    }

    // Kasus Benar / Salah
    const keyUpper = detectedKeyVal ? String(detectedKeyVal).toUpperCase().trim() : '';
    const isBsKey = Boolean(
      keyUpper === 'BENAR' || 
      keyUpper === 'SALAH' ||
      keyUpper === 'TRUE' ||
      keyUpper === 'FALSE'
    );
    if (isTrueFalse || (optionLines.length === 0 && isBsKey)) {
      const correctIdx = (
        keyUpper === 'SALAH' || 
        keyUpper === 'FALSE' ||
        keyUpper === 'B' ||
        keyUpper === '1'
      ) ? 1 : 0;

      results.push({
        id,
        valid: Boolean(questionText),
        errorReason: questionText ? undefined : 'Pertanyaan tidak dapat terbaca.',
        question: {
          id,
          text: questionText || 'Soal Benar / Salah',
          type: 'true_false',
          options: ['Benar', 'Salah'],
          correctIndex: correctIdx,
          explanation: explanationText || 'Jawaban ini benar sesuai konsep materi.',
          points: 10
        }
      });
      return;
    }

    // Kasus Pilihan Ganda
    const validOptions = optionLines.length >= 2 ? optionLines : (
      lines.slice(1)
        .map((l) => cleanOptionText(l))
        .filter((l) => 
          !l.toLowerCase().startsWith('kunci') && 
          !l.toLowerCase().startsWith('jawaban') && 
          !l.toLowerCase().startsWith('pembahasan') && 
          !l.toLowerCase().startsWith('penjelasan') && 
          !l.toLowerCase().startsWith('variasi')
        )
    );

    const correctIdx = resolveCorrectIndex(undefined, detectedKeyVal, validOptions);
    const isValid = Boolean(questionText) && validOptions.length >= 2;

    results.push({
      id,
      valid: isValid,
      errorReason: !questionText 
        ? 'Pertanyaan tidak terbaca.' 
        : validOptions.length < 2 
        ? 'Minimal harus memiliki 2 pilihan jawaban.' 
        : undefined,
      question: {
        id,
        text: questionText || 'Pertanyaan Baru',
        type: 'multiple_choice',
        options: validOptions.length >= 2 ? validOptions : ['Pilihan Satu', 'Pilihan Dua'],
        correctIndex: correctIdx,
        explanation: explanationText || 'Jawaban ini benar sesuai konsep materi.',
        points: 10
      }
    });
  });

  return results;
};

/**
 * Generator Cerdas Berbasis Kurikulum Merdeka SD:
 * Menyediakan paket soal edukatif seketika berdasarkan topik umum bahkan
 * tanpa koneksi API luar, sehingga guru selalu mendapatkan hasil instan beraneka ragam format.
 */
export const generateCurriculumSeedQuestions = (
  topic: string,
  subject: Subject,
  grade: number,
  count: number = 5,
  requestedType?: QuestionType | 'campuran'
): QuizQuestion[] => {
  const normalizedTopic = topic.toLowerCase();

  // Template bank topik populer Kurikulum Merdeka SD lengkap 5 jenis soal
  const templates: Record<string, Partial<QuizQuestion>[]> = {
    pernapasan: [
      {
        text: 'Organ pada manusia yang berfungsi sebagai tempat terjadinya pertukaran gas oksigen dan karbon dioksida adalah...',
        type: 'multiple_choice',
        options: ['Alveolus di dalam paru-paru', 'Tenggorokan (Trakea)', 'Kerongkongan', 'Jantung'],
        correctIndex: 0,
        explanation: 'Alveolus memiliki dinding tipis berkulit kapiler yang memungkinkan difusi oksigen ke darah dan pelepasan karbon dioksida.',
        imageCaption: '🫁 Paru-paru Manusia',
        points: 10
      },
      {
        text: 'Hewan katak dewasa bernapas menggunakan paru-paru dan permukaan kulitnya yang basah.',
        type: 'true_false',
        options: ['Benar', 'Salah'],
        correctIndex: 0,
        explanation: 'Katak adalah amfibi. Saat berudu bernapas dengan insang, dan saat dewasa menggunakan paru-paru serta kulit lembap.',
        imageCaption: '🐸 Katak Amfibi',
        points: 10
      },
      {
        text: 'Alat pernapasan khusus pada serangga (seperti belalang dan lebah) berupa pembuluh halus bercabang yang mengedarkan udara langsung ke seluruh sel tubuh dinamakan...',
        type: 'short_answer',
        options: ['Trakea'],
        correctIndex: 0,
        acceptableAnswers: ['Trakea', 'trakea', 'pembuluh trakea'],
        explanation: 'Trakea menyalurkan oksigen langsung ke seluruh jaringan tubuh serangga tanpa perantara eritrosit darah.',
        imageCaption: '🦗 Belalang & Trakea',
        points: 10
      },
      {
        text: 'Jodohkan hewan berikut dengan organ pernapasannya secara tepat!',
        type: 'matching_pairs',
        options: ['Ikan Mas ↔ Insang', 'Kucing ↔ Paru-paru', 'Cacing Tanah ↔ Permukaan Kulit Lembap'],
        correctIndex: 0,
        matchingPairs: [
          { left: 'Ikan Mas', right: 'Insang' },
          { left: 'Kucing', right: 'Paru-paru' },
          { left: 'Cacing Tanah', right: 'Permukaan Kulit Lembap' }
        ],
        explanation: 'Hewan bernapas sesuai habitatnya: ikan dengan insang, mamalia darat dengan paru-paru, dan cacing melalui kulit lembap.',
        imageCaption: '🐾 Ragam Pernapasan Hewan',
        points: 15
      },
      {
        text: 'Perhatikan gambar organ pernapasan berikut! Di organ manakah udara pertama kali disaring oleh rambut-rambut halus dan disesuaikan suhunya?',
        type: 'image_guess',
        options: ['Rongga Hidung', 'Laring', 'Bronkus', 'Alveolus'],
        correctIndex: 0,
        explanation: 'Rongga hidung memiliki rambut getar dan selaput lendir untuk menyaring debu serta menghangatkan udara.',
        imageCaption: '👃 Hidung & Udara Bersih',
        points: 10
      },
      {
        text: 'Ikan paus dan lumba-lumba bernapas menggunakan insang karena mereka hidup menetap di dalam lautan.',
        type: 'true_false',
        options: ['Benar', 'Salah'],
        correctIndex: 1,
        explanation: 'Paus dan lumba-lumba adalah mamalia air yang bernapas dengan paru-paru dan secara berkala menghirup udara di permukaan.',
        imageCaption: '🐋 Mamalia Laut',
        points: 10
      }
    ],
    pencernaan: [
      {
        text: 'Proses pencernaan makanan secara mekanik dan kimiawi pertama kali terjadi di dalam...',
        type: 'multiple_choice',
        options: ['Rongga Mulut', 'Lambung', 'Usus Halus', 'Kerongkongan'],
        correctIndex: 0,
        explanation: 'Di mulut terjadi pencernaan mekanik oleh gigi dan pencernaan kimiawi oleh enzim ptialin (amilase) pada air liur.',
        imageCaption: '👄 Rongga Mulut',
        points: 10
      },
      {
        text: 'Enzim yang dihasilkan oleh getah lambung untuk membunuh kuman penyakit dan mengasamkan makanan adalah asam...',
        type: 'short_answer',
        options: ['Klorida'],
        correctIndex: 0,
        acceptableAnswers: ['Klorida', 'asam klorida', 'HCl', 'hcl'],
        explanation: 'Asam klorida (HCl) di lambung mematikan bakteri pada makanan dan mengaktifkan pepsinogen menjadi pepsin.',
        imageCaption: '🧪 Lambung & Enzim',
        points: 10
      },
      {
        text: 'Jodohkan organ pencernaan berikut dengan fungsi utamanya!',
        type: 'matching_pairs',
        options: ['Usus Halus ↔ Menyerap sari nutrisi makanan', 'Usus Besar ↔ Menyerap sisa air & mineral', 'Lambung ↔ Mengolah makanan dengan asam'],
        correctIndex: 0,
        matchingPairs: [
          { left: 'Usus Halus', right: 'Menyerap sari nutrisi makanan' },
          { left: 'Usus Besar', right: 'Menyerap sisa air & mineral' },
          { left: 'Lambung', right: 'Mengolah makanan dengan asam' }
        ],
        explanation: 'Setiap organ pencernaan bekerja secara sistematis dari mencerna hingga menyerap sari nutrisi dan air.',
        imageCaption: '🥣 Sistem Pencernaan',
        points: 15
      },
      {
        text: 'Perhatikan gambar berikut! Bagian manakah dari saluran pencernaan yang meneruskan makanan dari rongga mulut menuju lambung melalui gerakan peristaltik?',
        type: 'image_guess',
        options: ['Kerongkongan (Esofagus)', 'Tenggorokan', 'Pankreas', 'Hati'],
        correctIndex: 0,
        explanation: 'Kerongkongan melakukan gerak peristaltik meremas dan mendorong bolus makanan masuk ke dalam lambung.',
        imageCaption: '🍎 Saluran Kerongkongan',
        points: 10
      },
      {
        text: 'Organ usus besar berfungsi utama untuk mencerna protein dan lemak dari makanan yang masuk.',
        type: 'true_false',
        options: ['Benar', 'Salah'],
        correctIndex: 1,
        explanation: 'Pencernaan nutrisi telah selesai di usus halus; usus besar bertugas menyerap air dan memadatkan sisa buangan.',
        imageCaption: '💧 Penyerapan Air',
        points: 10
      }
    ],
    pancasila: [
      {
        text: 'Simbol Bintang Emas pada perisai Burung Garuda merupakan lambang dari sila Pancasila yang berbunyi...',
        type: 'multiple_choice',
        options: [
          'Ketuhanan Yang Maha Esa',
          'Kemanusiaan yang adil dan beradab',
          'Persatuan Indonesia',
          'Keadilan sosial bagi seluruh rakyat Indonesia'
        ],
        correctIndex: 0,
        explanation: 'Bintang bersudut lima berlatar hitam melambangkan cahaya rohani bagi setiap manusia dari Tuhan Yang Maha Esa (Sila ke-1).',
        imageCaption: '⭐ Sila Pertama',
        points: 10
      },
      {
        text: 'Semboyan pemersatu bangsa Indonesia yang tertulis pada pita cengkeraman Burung Garuda adalah...',
        type: 'short_answer',
        options: ['Bhinneka Tunggal Ika'],
        correctIndex: 0,
        acceptableAnswers: ['Bhinneka Tunggal Ika', 'bhinneka tunggal ika', 'Bineka Tunggal Ika'],
        explanation: 'Bhinneka Tunggal Ika bermakna berbeda-beda tetapi tetap satu jua.',
        imageCaption: '🇮🇩 Semboyan Bangsa',
        points: 10
      },
      {
        text: 'Jodohkan lambang sila Pancasila berikut dengan nomor silanya secara tepat!',
        type: 'matching_pairs',
        options: ['Rantai Emas ↔ Sila Kedua', 'Pohon Beringin ↔ Sila Ketiga', 'Kepala Banteng ↔ Sila Keempat'],
        correctIndex: 0,
        matchingPairs: [
          { left: 'Rantai Emas', right: 'Sila Kedua' },
          { left: 'Pohon Beringin', right: 'Sila Ketiga' },
          { left: 'Kepala Banteng', right: 'Sila Keempat' }
        ],
        explanation: 'Sila ke-2 Rantai Emas, Sila ke-3 Pohon Beringin, dan Sila ke-4 Kepala Banteng.',
        imageCaption: '🦅 Lambang Pancasila',
        points: 15
      },
      {
        text: 'Membantu teman yang tertimpa musibah tanpa memandang perbedaan suku dan agamanya merupakan pengamalan sila kedua Pancasila.',
        type: 'true_false',
        options: ['Benar', 'Salah'],
        correctIndex: 0,
        explanation: 'Sila ke-2 menjunjung tinggi nilai kemanusiaan dan kepedulian antarsesama.',
        imageCaption: '🤝 Sikap Kemanusiaan',
        points: 10
      }
    ],
    matematika: [
      {
        text: 'Berapakah hasil dari 25 × 4 + 50?',
        type: 'multiple_choice',
        options: ['150', '125', '100', '175'],
        correctIndex: 0,
        explanation: 'Operasi perkalian didahulukan: 25 × 4 = 100, kemudian 100 + 50 = 150.',
        imageCaption: '🔢 Operasi Hitung',
        points: 10
      },
      {
        text: 'Sebuah persegi memiliki panjang sisi 9 cm. Berapakah luas persegi tersebut dalam cm²?',
        type: 'short_answer',
        options: ['81'],
        correctIndex: 0,
        acceptableAnswers: ['81', '81 cm²', '81 cm2'],
        explanation: 'Luas persegi = sisi × sisi = 9 × 9 = 81 cm².',
        imageCaption: '⏹️ Luas Bangun Datar',
        points: 10
      },
      {
        text: 'Jodohkan pecahan biasa berikut dengan bentuk desimalnya yang senilai!',
        type: 'matching_pairs',
        options: ['1/2 ↔ 0,5', '1/4 ↔ 0,25', '3/4 ↔ 0,75'],
        correctIndex: 0,
        matchingPairs: [
          { left: '1/2', right: '0,5' },
          { left: '1/4', right: '0,25' },
          { left: '3/4', right: '0,75' }
        ],
        explanation: '1 dibagi 2 adalah 0,5; 1 dibagi 4 adalah 0,25; dan 3 dibagi 4 adalah 0,75.',
        imageCaption: '🍕 Pecahan Senilai',
        points: 15
      },
      {
        text: 'Segitiga sama sisi memiliki 3 sisi yang sama panjang dan 3 sudut yang besarnya masing-masing 60 derajat.',
        type: 'true_false',
        options: ['Benar', 'Salah'],
        correctIndex: 0,
        explanation: 'Total sudut segitiga adalah 180 derajat, sehingga 180 / 3 = 60 derajat.',
        imageCaption: '📐 Bangun Segitiga',
        points: 10
      }
    ]
  };

  // Pilih koleksi yang cocok dengan topik
  let pool = templates.pernapasan;
  if (normalizedTopic.includes('cerna') || normalizedTopic.includes('makan') || normalizedTopic.includes('organ')) {
    pool = templates.pencernaan;
  } else if (normalizedTopic.includes('pancasila') || normalizedTopic.includes('garuda') || subject === 'Pendidikan Pancasila') {
    pool = templates.pancasila;
  } else if (normalizedTopic.includes('hitung') || normalizedTopic.includes('pecahan') || normalizedTopic.includes('kali') || subject === 'Matematika') {
    pool = templates.matematika;
  }

  // Filter jika meminta jenis spesifik
  let filteredPool = pool;
  if (requestedType && requestedType !== 'campuran') {
    const matched = pool.filter((item) => item.type === requestedType);
    if (matched.length > 0) {
      filteredPool = matched;
    }
  }

  // Buat butir soal sebanyak `count`
  const questions: QuizQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const template = filteredPool[i % filteredPool.length];
    const uniqueId = 'q_ai_gen_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_' + i;
    
    questions.push({
      id: uniqueId,
      text: template.text || `Pertanyaan materi ${topic} untuk Kelas ${grade} SD nomor ${i + 1}?`,
      type: template.type || 'multiple_choice',
      options: template.options ? [...template.options] : ['Jawaban A', 'Jawaban B', 'Jawaban C', 'Jawaban D'],
      correctIndex: template.correctIndex ?? 0,
      explanation: template.explanation || `Penjelasan konsep pembelajaran untuk materi ${topic}.`,
      imageCaption: template.imageCaption || '📚 Materi Pelajaran SD',
      acceptableAnswers: template.acceptableAnswers ? [...template.acceptableAnswers] : undefined,
      matchingPairs: template.matchingPairs ? [...template.matchingPairs] : undefined,
      points: template.points ?? 10
    });
  }

  return questions;
};

/**
 * Memeriksa apakah teks memiliki karakteristik tabel CSV
 */
export const isCsvFormat = (text: string): boolean => {
  const firstLine = text.trim().split(/\r?\n/)[0].toLowerCase();
  return (
    (firstLine.includes(',') || firstLine.includes(';')) &&
    (firstLine.includes('soal') || firstLine.includes('pertanyaan') || firstLine.includes('opsi') || firstLine.includes('kunci') || firstLine.includes('nomor'))
  );
};

/**
 * Mengurai baris CSV dengan dukungan pemisah koma atau titik-koma serta teks bertanda kutip
 */
const parseCsvLine = (line: string, delimiter: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

/**
 * Mengurai teks tabel CSV menjadi daftar butir soal kuis
 */
export const parseCsvQuestions = (csvText: string): ParsedQuestionItem[] => {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const header = parseCsvLine(lines[0].toLowerCase(), delimiter);

  // Cari posisi indeks kolom
  const colQuestion = header.findIndex((h) => h.includes('pertanyaan') || h.includes('soal') || h.includes('question'));
  const colType = header.findIndex((h) => h.includes('tipe') || h.includes('type'));
  const colOptA = header.findIndex((h) => h.includes('opsi a') || h.includes('pilihan a') || h === 'a');
  const colOptB = header.findIndex((h) => h.includes('opsi b') || h.includes('pilihan b') || h === 'b');
  const colOptC = header.findIndex((h) => h.includes('opsi c') || h.includes('pilihan c') || h === 'c');
  const colOptD = header.findIndex((h) => h.includes('opsi d') || h.includes('pilihan d') || h === 'd');
  const colKey = header.findIndex((h) => h.includes('kunci') || h.includes('jawaban') || h.includes('answer'));
  const colExpl = header.findIndex((h) => h.includes('penjelasan') || h.includes('pembahasan') || h.includes('explanation'));
  const colCaption = header.findIndex((h) => h.includes('gambar') || h.includes('caption') || h.includes('ilustrasi'));

  const items: ParsedQuestionItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], delimiter);
    if (cols.length === 0 || cols.every((c) => !c)) continue;

    const id = 'q_csv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_' + i;
    const text = colQuestion >= 0 ? cols[colQuestion] : cols[2] || cols[0];
    if (!text) continue;

    const rawType = (colType >= 0 ? cols[colType] : '').toLowerCase();
    let type: QuestionType = 'multiple_choice';
    if (rawType.includes('benar') || rawType.includes('salah') || rawType.includes('true')) {
      type = 'true_false';
    } else if (rawType.includes('isian') || rawType.includes('singkat') || rawType.includes('short')) {
      type = 'short_answer';
    } else if (rawType.includes('jodoh') || rawType.includes('matching')) {
      type = 'matching_pairs';
    }

    const keyRaw = colKey >= 0 ? cols[colKey] : cols[7] || 'A';
    const explanation = colExpl >= 0 ? cols[colExpl] : cols[8] || 'Jawaban benar sesuai materi pembelajaran.';
    const imageCaption = colCaption >= 0 ? cols[colCaption] : cols[9] || undefined;

    if (type === 'true_false') {
      const isBenar = keyRaw.toLowerCase().includes('benar') || keyRaw.toUpperCase() === 'A' || keyRaw.toLowerCase() === 'true';
      items.push({
        id,
        valid: true,
        question: {
          id,
          text,
          type: 'true_false',
          options: ['Benar', 'Salah'],
          correctIndex: isBenar ? 0 : 1,
          explanation,
          imageCaption,
          points: 10,
        },
      });
    } else if (type === 'short_answer') {
      items.push({
        id,
        valid: true,
        question: {
          id,
          text,
          type: 'short_answer',
          options: [keyRaw],
          correctIndex: 0,
          acceptableAnswers: [keyRaw],
          explanation,
          imageCaption,
          points: 10,
        },
      });
    } else if (type === 'matching_pairs') {
      const pairsRaw = [cols[colOptA], cols[colOptB], cols[colOptC], cols[colOptD]].filter(Boolean);
      const matchingPairs = pairsRaw.map((p) => {
        const parts = p.includes('=') ? p.split('=') : p.split(':');
        return {
          left: (parts[0] || 'Konsep').trim(),
          right: (parts[1] || 'Pasangan').trim(),
        };
      });
      items.push({
        id,
        valid: matchingPairs.length >= 2,
        question: {
          id,
          text,
          type: 'matching_pairs',
          options: matchingPairs.map((p) => `${p.left} - ${p.right}`),
          correctIndex: 0,
          matchingPairs: matchingPairs.length >= 2 ? matchingPairs : [
            { left: 'Konsep A', right: 'Pasangan A' },
            { left: 'Konsep B', right: 'Pasangan B' },
          ],
          explanation,
          imageCaption,
          points: 15,
        },
      });
    } else {
      const opts = [
        colOptA >= 0 ? cols[colOptA] : cols[3],
        colOptB >= 0 ? cols[colOptB] : cols[4],
        colOptC >= 0 ? cols[colOptC] : cols[5],
        colOptD >= 0 ? cols[colOptD] : cols[6],
      ].filter(Boolean);

      let correctIndex = 0;
      const cleanKey = keyRaw.trim().toUpperCase();
      if (cleanKey === 'B' || cleanKey === '1') correctIndex = 1;
      else if (cleanKey === 'C' || cleanKey === '2') correctIndex = 2;
      else if (cleanKey === 'D' || cleanKey === '3') correctIndex = 3;

      items.push({
        id,
        valid: opts.length >= 2,
        question: {
          id,
          text,
          type: 'multiple_choice',
          options: opts.length >= 2 ? opts : ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
          correctIndex,
          explanation,
          imageCaption,
          points: 10,
        },
      });
    }
  }

  return items;
};

/**
 * Menghasilkan string template CSV berstandar kuis Kurikulum Merdeka
 */
export const getQuestionCsvTemplate = (): string => {
  return `Nomor,Tipe Soal,Pertanyaan,Opsi A,Opsi B,Opsi C,Opsi D,Kunci Jawaban,Penjelasan,Keterangan Gambar
1,Pilihan Ganda,Bagian tumbuhan yang bertugas menyerap air dari dalam tanah adalah...,Akar,Batang,Daun,Bunga,A,Akar menyerap air dan mineral dari dalam tanah untuk disalurkan ke seluruh bagian tumbuhan.,Akar Tumbuhan
2,Benar Salah,Matahari adalah bintang yang paling dekat dengan bumi.,Benar,Salah,,,A,Matahari merupakan sebuah bintang berukuran sedang yang menjadi pusat tata surya kita.,Matahari
3,Isian Singkat,Alat pernapasan utama pada ikan adalah...,,,,,insang,Ikan bernapas menyerap oksigen terlarut dalam air menggunakan insang.,Insang Ikan
4,Menjodohkan,Jodohkan bagian tubuh tumbuhan dengan fungsinya!,Akar=Menyerap air,Batang=Menopang tumbuhan,Daun=Tempat fotosintesis,,Akar=Menyerap air;Batang=Menopang tumbuhan;Daun=Tempat fotosintesis,Setiap bagian organ tumbuhan memiliki peran vital dalam kelangsungan hidupnya.,Organ Tumbuhan`;
};

