import type { QuizQuestion, QuestionType, Subject } from '../types/quiz';

export interface GeneratePromptParams {
  subject: Subject;
  grade: number;
  topic: string;
  count: number;
  questionType?: QuestionType | 'campuran';
  difficulty?: 'mudah' | 'sedang' | 'menantang';
}

export interface ParsedQuestionItem {
  id: string;
  valid: boolean;
  question: QuizQuestion;
  errorReason?: string;
}

/**
 * Menghasilkan teks instruksi prompt terstruktur presisi tinggi untuk ditempel
 * pada AI eksternal (ChatGPT, Google Gemini, Claude, dll).
 * Mendukung seluruh 5 format tipe soal Kurikulum Merdeka SD.
 */
export const generateAiPrompt = (params: GeneratePromptParams): string => {
  let typeInstruction = 'Gunakan tipe Pilihan Ganda (4 opsi A, B, C, D).';
  if (params.questionType === 'true_false') {
    typeInstruction = 'Gunakan tipe Benar / Salah (options: ["Benar", "Salah"]).';
  } else if (params.questionType === 'short_answer') {
    typeInstruction = 'Gunakan tipe Isian Singkat (siswa mengetikkan 1-2 kata kunci jawaban).';
  } else if (params.questionType === 'image_guess') {
    typeInstruction = 'Gunakan tipe Tebak Gambar Misteri (pilihan ganda dengan emoji/stiker visual pengenal).';
  } else if (params.questionType === 'matching_pairs') {
    typeInstruction = 'Gunakan tipe Menjodohkan (pasangan kartu konsep kiri dan kanan).';
  } else if (params.questionType === 'campuran') {
    typeInstruction = 'Campurkan secara seimbang format: Pilihan Ganda (multiple_choice), Benar/Salah (true_false), Isian Singkat (short_answer), dan Menjodohkan (matching_pairs).';
  }

  return `Kamu adalah ahli penyusun materi dan soal ujian interaktif Sekolah Dasar (SD) berstandar Kurikulum Merdeka Indonesia.
Buatkan ${params.count} butir soal kuis interaktif yang mendidik, menyenangkan, dan komunikatif untuk:
- Mata Pelajaran: ${params.subject}
- Tingkat: Kelas ${params.grade} SD
- Topik Pembahasan: "${params.topic}"
- Tingkat Kesulitan: ${params.difficulty || 'sedang'}
- Bentuk Soal: ${typeInstruction}

ATURAN PENTING KELUARAN (WAJIB DIIKUTI):
Keluarkan HANYA blok JSON murni tanpa pembuka/penutup basa-basi, menggunakan array objek dengan format berikut:
[
  {
    "type": "multiple_choice",
    "text": "Teks pertanyaan pilihan ganda yang jelas untuk anak SD?",
    "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
    "correctIndex": 0,
    "explanation": "Penjelasan konsep mengapa jawaban ini benar.",
    "imageCaption": "🌱 Ilustrasi materi",
    "points": 10
  },
  {
    "type": "true_false",
    "text": "Pernyataan yang perlu dianalisis kebenarannya?",
    "options": ["Benar", "Salah"],
    "correctIndex": 0,
    "explanation": "Penjelasan konsep kebenaran materi.",
    "points": 10
  },
  {
    "type": "short_answer",
    "text": "Pertanyaan isian singkat ramah anak?",
    "acceptableAnswers": ["Kunci Utama", "variasi sinonim", "ejaan lain"],
    "explanation": "Penjelasan konsep materi yang tepat.",
    "points": 10
  },
  {
    "type": "matching_pairs",
    "text": "Jodohkan konsep di sebelah kiri dengan pasangannya di sebelah kanan!",
    "matchingPairs": [
      {"left": "Konsep 1", "right": "Pasangan 1"},
      {"left": "Konsep 2", "right": "Pasangan 2"},
      {"left": "Konsep 3", "right": "Pasangan 3"}
    ],
    "explanation": "Penjelasan kecocokan seluruh pasangan.",
    "points": 15
  },
  {
    "type": "image_guess",
    "text": "Perhatikan petunjuk visual berikut! Apakah nama objek/organ ini?",
    "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
    "correctIndex": 0,
    "imageCaption": "🫁 Organ Tubuh",
    "explanation": "Penjelasan objek materi terkait.",
    "points": 10
  }
]

Panduan Teknis:
1. Pastikan setiap butir soal menyertakan "type" sesuai format di atas.
2. Untuk "short_answer", sertakan array "acceptableAnswers" berisi kata kunci benar dan variasinya.
3. Untuk "matching_pairs", sertakan array "matchingPairs" minimal 3 pasang objek { "left": "...", "right": "..." }.
4. Untuk "multiple_choice" dan "image_guess", "correctIndex" adalah nomor indeks (0 untuk opsi pertama, dst).
5. Bobot "points" standar adalah 10 (atau 15 untuk menjodohkan).`;
};

/**
 * Mengurai teks mentah (baik JSON maupun format teks bernomor bebas) menjadi
 * butir-butir soal yang siap dimasukkan ke Bank Soal kuis.
 */
export const parseRawQuestionsText = (rawText: string): ParsedQuestionItem[] => {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  // 1. Coba parse sebagai JSON terlebih dahulu
  try {
    // Bersihkan pembungkus markdown ```json ... ``` jika ada
    let cleanJson = trimmed;
    if (cleanJson.includes('```')) {
      const match = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        cleanJson = match[1].trim();
      }
    }

    const parsed = JSON.parse(cleanJson);
    const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.questions) ? parsed.questions : null);

    if (list && list.length > 0) {
      return list.map((item: any, idx: number): ParsedQuestionItem => {
        const id = 'q_ai_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_' + idx;
        const text = String(item.text || item.question || item.pertanyaan || '').trim();
        const explanation = String(item.explanation || item.pembahasan || item.alasan || 'Jawaban ini benar sesuai konsep materi.').trim();
        const imageCaption = item.imageCaption || item.ilustrasi ? String(item.imageCaption || item.ilustrasi).trim() : undefined;
        const imageUrl = item.imageUrl || item.gambar ? String(item.imageUrl || item.gambar).trim() : undefined;
        const points = typeof item.points === 'number' && item.points > 0 ? item.points : (typeof item.poin === 'number' ? item.poin : 10);
        const customDurationSec = typeof item.customDurationSec === 'number' && item.customDurationSec > 0 ? item.customDurationSec : undefined;

        const rawType = String(item.type || item.tipe || '').toLowerCase();
        let type: QuestionType = 'multiple_choice';

        if (rawType === 'true_false' || rawType === 'benar_salah' || rawType === 'benar-salah') {
          type = 'true_false';
        } else if (rawType === 'short_answer' || rawType === 'isian' || rawType === 'isian_singkat' || item.acceptableAnswers || item.variasi_jawaban) {
          type = 'short_answer';
        } else if (rawType === 'matching_pairs' || rawType === 'menjodohkan' || rawType === 'jodohkan' || item.matchingPairs || item.pasangan) {
          type = 'matching_pairs';
        } else if (rawType === 'image_guess' || rawType === 'tebak_gambar') {
          type = 'image_guess';
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
          const options = rawOptions.length >= 2 ? rawOptions.slice(0, 2).map(String) : ['Benar', 'Salah'];
          let correctIndex = 0;
          if (typeof item.correctIndex === 'number') {
            correctIndex = item.correctIndex;
          } else if (typeof item.kunci === 'string') {
            correctIndex = item.kunci.toLowerCase().includes('salah') ? 1 : 0;
          }

          return {
            id,
            valid: true,
            question: {
              id,
              text,
              type: 'true_false',
              options,
              correctIndex: Math.min(Math.max(0, correctIndex), 1),
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
            acceptable = item.acceptableAnswers.map((s: any) => String(s).trim()).filter(Boolean);
          } else if (Array.isArray(item.variasi_jawaban)) {
            acceptable = item.variasi_jawaban.map((s: any) => String(s).trim()).filter(Boolean);
          } else if (typeof item.acceptableAnswers === 'string') {
            acceptable = item.acceptableAnswers.split(',').map((s: string) => s.trim()).filter(Boolean);
          } else if (typeof item.kunci === 'string') {
            acceptable = [item.kunci.trim()];
          } else if (typeof item.jawaban === 'string') {
            acceptable = [item.jawaban.trim()];
          } else if (Array.isArray(item.options) && item.options.length > 0) {
            acceptable = [String(item.options[0]).trim()];
          }

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
          const rawPairs = Array.isArray(item.matchingPairs) ? item.matchingPairs : (Array.isArray(item.pasangan) ? item.pasangan : []);
          const pairs: { left: string; right: string }[] = rawPairs
            .map((p: any) => ({
              left: String(p.left || p.kiri || p.item || '').trim(),
              right: String(p.right || p.kanan || p.pasangan || '').trim()
            }))
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
        const options = rawOptions.map((o: any) => String(o).trim()).filter(Boolean);

        let correctIndex = 0;
        if (typeof item.correctIndex === 'number') {
          correctIndex = item.correctIndex;
        } else if (typeof item.kunci === 'number') {
          correctIndex = item.kunci;
        } else if (typeof item.correctIndex === 'string' || typeof item.kunci === 'string') {
          const letter = String(item.correctIndex || item.kunci).trim().toUpperCase();
          const letterIdx = ['A', 'B', 'C', 'D'].indexOf(letter);
          if (letterIdx >= 0) correctIndex = letterIdx;
        }

        if (options.length < 2) {
          return {
            id,
            valid: false,
            errorReason: 'Pilihan jawaban kurang dari 2 opsi.',
            question: { id, text, type, options, correctIndex: 0, explanation, imageCaption, points }
          };
        }

        const validIndex = Math.min(Math.max(0, correctIndex), options.length - 1);

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
    // Jika bukan JSON murni, lanjutkan ke parser teks bebas di bawah
  }

  // 2. Parser Teks Bebas Berbahasa Indonesia (Format 1. ... A. ... B. ... Kunci: ...)
  return parseNaturalTextFormat(trimmed);
};

/**
 * Parser pola teks alami (misal copy-paste dari Word, WhatsApp, atau ringkasan AI).
 */
const parseNaturalTextFormat = (text: string): ParsedQuestionItem[] => {
  const results: ParsedQuestionItem[] = [];
  
  // Pisahkan butir soal berdasarkan pola angka pembuka: "1.", "1)", "Soal 1:", dll
  const blocks = text.split(/(?:^|\n)(?=(?:(?:Soal\s*)?\d+[\.\)]|\#\s*\d+))/i).filter((b) => b.trim().length > 0);

  blocks.forEach((block, idx) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const id = 'q_parsed_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_' + idx;
    
    let questionText = '';
    const optionLines: string[] = [];
    let detectedKeyLetter: string | null = null;
    let explanationText = '';
    let isTrueFalse = false;
    let isShortAnswer = false;
    let isMatching = false;
    let acceptableAnswersList: string[] = [];
    const matchingPairsList: { left: string; right: string }[] = [];

    lines.forEach((line) => {
      // Deteksi format Menjodohkan: "Hidung ↔ Menyaring debu" atau "Kiri -> Kanan"
      const matchPairRegex = /^[-*•]?\s*([^↔\->=]+)\s*(?:↔|<->|->|==|=)\s*(.+)$/;
      const pairMatch = line.match(matchPairRegex);
      if (pairMatch && (isMatching || line.includes('↔') || line.includes('<->') || line.includes('->'))) {
        isMatching = true;
        matchingPairsList.push({ left: pairMatch[1].trim(), right: pairMatch[2].trim() });
        return;
      }

      // Deteksi kunci isian singkat: "Kunci Isian: ...", "Jawaban Singkat: ...", "Variasi: ..."
      const shortAnsMatch = line.match(/(?:Kunci\s*(?:Isian|Singkat)?|Jawaban\s*Singkat|Variasi(?:\s*Jawaban)?)\s*:\s*(.+)/i);
      if (shortAnsMatch) {
        isShortAnswer = true;
        const vals = shortAnsMatch[1].split(',').map((s) => s.trim()).filter(Boolean);
        acceptableAnswersList.push(...vals);
        return;
      }

      // Deteksi kunci jawaban umum: "Kunci: A", "Kunci Jawaban: B", "Jawaban: Benar"
      const keyMatch = line.match(/(?:Kunci(?:\s*Jawaban)?|Jawaban)\s*:\s*([A-D]|Benar|Salah)/i);
      if (keyMatch) {
        detectedKeyLetter = keyMatch[1].toUpperCase();
        return;
      }

      // Deteksi pembahasan: "Pembahasan: ...", "Penjelasan: ..."
      const expMatch = line.match(/(?:Pembahasan|Penjelasan|Alasan)\s*:\s*(.+)/i);
      if (expMatch) {
        explanationText = expMatch[1].trim();
        return;
      }

      // Deteksi opsi: "A. ...", "B) ...", "*A. ..."
      const optMatch = line.match(/^(\*?\s*[A-D][\.\)]\s*)(.+)/i);
      if (optMatch) {
        if (optMatch[1].includes('*')) {
          const letter = optMatch[1].replace(/[^A-D]/gi, '').toUpperCase();
          if (letter) detectedKeyLetter = letter;
        }
        optionLines.push(optMatch[2].trim());
        return;
      }

      // Deteksi indikator Benar / Salah atau Menjodohkan
      if (line.match(/^(?:Opsi\s*:?\s*)?\[?(?:Benar|Salah)\]?/i) || line.includes('[B/S]')) {
        isTrueFalse = true;
      }
      if (line.toLowerCase().includes('jodohkan') || line.toLowerCase().includes('pasangkan')) {
        isMatching = true;
      }

      // Jika belum masuk opsi dan bukan keterangan lain, anggap bagian dari teks pertanyaan
      if (optionLines.length === 0 && matchingPairsList.length === 0 && acceptableAnswersList.length === 0) {
        const cleanedQuestionLine = line.replace(/^(?:(?:Soal\s*)?\d+[\.\)]|\#\s*\d+)\s*/i, '').trim();
        if (cleanedQuestionLine) {
          questionText += (questionText ? ' ' : '') + cleanedQuestionLine;
        }
      }
    });

    if (!questionText) {
      questionText = lines[0].replace(/^(?:(?:Soal\s*)?\d+[\.\)]|\#\s*\d+)\s*/i, '').trim();
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
    if (isTrueFalse || (optionLines.length === 0 && (detectedKeyLetter === 'BENAR' || detectedKeyLetter === 'SALAH'))) {
      const correctIdx = detectedKeyLetter === 'SALAH' ? 1 : 0;
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
    let correctIdx = 0;
    if (detectedKeyLetter) {
      const letterIdx = ['A', 'B', 'C', 'D'].indexOf(detectedKeyLetter);
      if (letterIdx >= 0) correctIdx = letterIdx;
    }

    const validOptions = optionLines.length >= 2 ? optionLines : (
      lines.slice(1).filter((l) => !l.toLowerCase().startsWith('kunci') && !l.toLowerCase().startsWith('pembahasan') && !l.toLowerCase().startsWith('variasi'))
    );

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
        options: validOptions.length >= 2 ? validOptions : ['Pilihan A', 'Pilihan B'],
        correctIndex: Math.min(correctIdx, Math.max(0, validOptions.length - 1)),
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
