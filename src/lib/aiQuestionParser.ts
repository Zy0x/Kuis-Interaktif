import type { QuizQuestion, QuestionType, Subject } from '../types/quiz';

export interface GeneratePromptParams {
  subject: Subject;
  grade: number;
  topic: string;
  count: number;
  questionType?: 'multiple_choice' | 'true_false' | 'campuran';
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
 */
export const generateAiPrompt = (params: GeneratePromptParams): string => {
  const typeInstruction = 
    params.questionType === 'true_false'
      ? 'Gunakan tipe Benar / Salah (options: ["Benar", "Salah"]).'
      : params.questionType === 'campuran'
      ? 'Campurkan tipe Pilihan Ganda (4 opsi) dan Benar/Salah.'
      : 'Gunakan tipe Pilihan Ganda (4 opsi A, B, C, D).';

  return `Kamu adalah ahli penyusun materi dan soal ujian interaktif Sekolah Dasar (SD) berstandar Kurikulum Merdeka Indonesia.
Buatkan ${params.count} butir soal kuis interaktif yang mendidik, menyenangkan, dan komunikatif untuk:
- Mata Pelajaran: ${params.subject}
- Tingkat: Kelas ${params.grade} SD
- Topik Pembahasan: "${params.topic}"
- Tingkat Kesulitan: ${params.difficulty || 'sedang'}
- Bentuk Soal: ${typeInstruction}

ATURAN PENTING KELUARAN (WAJIB DIIKUTI):
Keluarkan HANYA blok JSON murni tanpa pembuka/penutup basa-basi, menggunakan format array objek berikut:
[
  {
    "text": "Teks pertanyaan yang jelas, tidak membingungkan, dan ramah anak SD?",
    "type": "multiple_choice",
    "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
    "correctIndex": 0,
    "explanation": "Penjelasan singkat mengapa jawaban ini benar sesuai materi.",
    "imageCaption": "🌱 Ilustrasi atau stiker terkait materi"
  }
]

Catatan teknis:
1. "correctIndex" adalah angka indeks opsi jawaban yang benar (0 untuk opsi pertama, 1 untuk kedua, dst).
2. Untuk tipe "true_false", isi options dengan ["Benar", "Salah"] dan correctIndex 0 (Benar) atau 1 (Salah).
3. "imageCaption" dapat berisi teks stiker/emoji sederhana yang relevan untuk memperjelas soal.`;
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

        const type: QuestionType = item.type === 'true_false' ? 'true_false' : 'multiple_choice';
        const explanation = String(item.explanation || item.pembahasan || item.alasan || 'Jawaban ini benar sesuai konsep materi.').trim();
        const imageCaption = item.imageCaption || item.ilustrasi ? String(item.imageCaption || item.ilustrasi).trim() : undefined;

        // Validasi kelengkapan
        if (!text) {
          return {
            id,
            valid: false,
            errorReason: 'Teks pertanyaan kosong.',
            question: { id, text: 'Soal Tanpa Teks', type, options: ['-', '-'], correctIndex: 0, explanation }
          };
        }

        if (type === 'true_false') {
          const tfOptions = options.length >= 2 ? options.slice(0, 2) : ['Benar', 'Salah'];
          return {
            id,
            valid: true,
            question: {
              id,
              text,
              type: 'true_false',
              options: tfOptions,
              correctIndex: Math.min(Math.max(0, correctIndex), 1),
              explanation,
              imageCaption
            }
          };
        }

        if (options.length < 2) {
          return {
            id,
            valid: false,
            errorReason: 'Pilihan jawaban kurang dari 2 opsi.',
            question: { id, text, type, options, correctIndex: 0, explanation, imageCaption }
          };
        }

        const validIndex = Math.min(Math.max(0, correctIndex), options.length - 1);

        return {
          id,
          valid: true,
          question: {
            id,
            text,
            type: 'multiple_choice',
            options,
            correctIndex: validIndex,
            explanation,
            imageCaption
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
    
    // Baris pertama (atau gabungan baris sebelum opsi) adalah pertanyaan
    let questionText = '';
    const optionLines: string[] = [];
    let detectedKeyLetter: string | null = null;
    let explanationText = '';
    let isTrueFalse = false;

    lines.forEach((line) => {
      // Deteksi kunci jawaban: "Kunci: A", "Kunci Jawaban: B", "Jawaban: C"
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
        // Jika bertanda bintang (*), ini adalah kunci
        if (optMatch[1].includes('*')) {
          const letter = optMatch[1].replace(/[^A-D]/gi, '').toUpperCase();
          if (letter) detectedKeyLetter = letter;
        }
        optionLines.push(optMatch[2].trim());
        return;
      }

      // Deteksi format Benar / Salah
      if (line.match(/^(?:Opsi\s*:?\s*)?\[?(?:Benar|Salah)\]?/i) || line.includes('[B/S]')) {
        isTrueFalse = true;
      }

      // Jika belum masuk opsi dan bukan keterangan lain, anggap bagian dari teks pertanyaan
      if (optionLines.length === 0) {
        const cleanedQuestionLine = line.replace(/^(?:(?:Soal\s*)?\d+[\.\)]|\#\s*\d+)\s*/i, '').trim();
        if (cleanedQuestionLine) {
          questionText += (questionText ? ' ' : '') + cleanedQuestionLine;
        }
      }
    });

    if (!questionText) {
      questionText = lines[0].replace(/^(?:(?:Soal\s*)?\d+[\.\)]|\#\s*\d+)\s*/i, '').trim();
    }

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
          explanation: explanationText || 'Jawaban ini benar sesuai konsep materi.'
        }
      });
      return;
    }

    // Pilihan ganda
    let correctIdx = 0;
    if (detectedKeyLetter) {
      const letterIdx = ['A', 'B', 'C', 'D'].indexOf(detectedKeyLetter);
      if (letterIdx >= 0) correctIdx = letterIdx;
    }

    const validOptions = optionLines.length >= 2 ? optionLines : (
      // Fallback jika tidak menemukan format A/B/C/D secara eksplisit
      lines.slice(1).filter((l) => !l.toLowerCase().startsWith('kunci') && !l.toLowerCase().startsWith('pembahasan'))
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
        explanation: explanationText || 'Jawaban ini benar sesuai konsep materi.'
      }
    });
  });

  return results;
};

/**
 * Generator Cerdas Berbasis Kurikulum Merdeka SD:
 * Menyediakan paket soal edukatif seketika berdasarkan topik umum bahkan
 * tanpa koneksi API luar, sehingga guru selalu mendapatkan hasil instan.
 */
export const generateCurriculumSeedQuestions = (
  topic: string,
  subject: Subject,
  grade: number,
  count: number = 5
): QuizQuestion[] => {
  const normalizedTopic = topic.toLowerCase();

  // Template bank topik populer Kurikulum Merdeka SD
  const templates: Record<string, Partial<QuizQuestion>[]> = {
    pernapasan: [
      {
        text: 'Organ pada manusia yang berfungsi sebagai tempat terjadinya pertukaran gas oksigen dan karbon dioksida adalah...',
        type: 'multiple_choice',
        options: ['Alveolus di dalam paru-paru', 'Tenggorokan (Trakea)', 'Kerongkongan', 'Jantung'],
        correctIndex: 0,
        explanation: 'Alveolus memiliki dinding tipis berkulit kapiler yang memungkinkan difusi oksigen ke darah dan pelepasan karbon dioksida.',
        imageCaption: '🫁 Paru-paru Manusia'
      },
      {
        text: 'Hewan katak dewasa bernapas menggunakan paru-paru dan permukaan kulitnya yang basah.',
        type: 'true_false',
        options: ['Benar', 'Salah'],
        correctIndex: 0,
        explanation: 'Katak adalah amfibi. Saat berudu bernapas dengan insang, dan saat dewasa menggunakan paru-paru serta kulit lembap.',
        imageCaption: '🐸 Katak Amfibi'
      },
      {
        text: 'Alat pernapasan pada serangga seperti belalang dan kupu-kupu disebut...',
        type: 'multiple_choice',
        options: ['Insang', 'Trakea', 'Paru-paru buku', 'Kulit luar'],
        correctIndex: 1,
        explanation: 'Trakea adalah pembuluh-pembuluh halus yang mengedarkan oksigen langsung ke seluruh tubuh serangga.',
        imageCaption: '🦗 Belalang & Trakea'
      },
      {
        text: 'Rambut-rambut halus dan lendir di dalam rongga hidung berfungsi untuk menyaring kotoran dan debu dari udara yang masuk.',
        type: 'true_false',
        options: ['Benar', 'Salah'],
        correctIndex: 0,
        explanation: 'Rambut hidung dan selaput lendir bekerja menyaring debu serta menyesuaikan suhu dan kelembapan udara pernapasan.',
        imageCaption: '👃 Hidung & Udara Bersih'
      },
      {
        text: 'Ikan paus dan lumba-lumba bernapas menggunakan insang karena mereka hidup di dalam laut.',
        type: 'true_false',
        options: ['Benar', 'Salah'],
        correctIndex: 1,
        explanation: 'Paus dan lumba-lumba adalah mamalia air yang bernapas dengan paru-paru, sehingga sering muncul ke permukaan air untuk menghirup udara.',
        imageCaption: '🐋 Mamalia Laut'
      }
    ],
    pencernaan: [
      {
        text: 'Proses pencernaan makanan secara mekanik dan kimiawi pertama kali terjadi di dalam...',
        type: 'multiple_choice',
        options: ['Mulut', 'Lambung', 'Usus Halus', 'Kerongkongan'],
        correctIndex: 0,
        explanation: 'Di mulut terjadi pencernaan mekanik oleh gigi dan pencernaan kimiawi oleh enzim ptialin (amilase) pada air liur.',
        imageCaption: '👄 Rongga Mulut'
      },
      {
        text: 'Organ pencernaan yang berfungsi menyerap sari-sari makanan ke dalam peredaran darah adalah...',
        type: 'multiple_choice',
        options: ['Usus Halus', 'Usus Besar', 'Lambung', 'Kerongkongan'],
        correctIndex: 0,
        explanation: 'Dinding usus halus dipenuhi jonjot-jonjot usus (vili) yang menyerap nutrisi makanan ke dalam darah.',
        imageCaption: '🥣 Penyerapan Nutrisi'
      },
      {
        text: 'Fungsi utama dari usus besar pada sistem pencernaan manusia adalah...',
        type: 'multiple_choice',
        options: ['Menyerap air dan membentuk feses', 'Mencerna karbohidrat', 'Menghasilkan asam lambung', 'Menghancurkan protein'],
        correctIndex: 0,
        explanation: 'Usus besar menyerap sisa air dan mineral dari ampas makanan serta membusukkannya dengan bantuan bakteri baik E. coli.',
        imageCaption: '💧 Penyerapan Air'
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
        imageCaption: '⭐ Sila Pertama'
      },
      {
        text: 'Musyawarah untuk mufakat dalam mengambil keputusan bersama di kelas mencerminkan pengamalan sila ke...',
        type: 'multiple_choice',
        options: ['Keempat (Kepala Banteng)', 'Ketiga (Pohon Beringin)', 'Kedua (Rantai Emas)', 'Kelima (Padi dan Kapas)'],
        correctIndex: 0,
        explanation: 'Sila ke-4 menekankan kerakyatan yang dipimpin oleh hikmat kebijaksanaan dalam permusyawaratan/perwakilan.',
        imageCaption: '🤝 Musyawarah Mufakat'
      },
      {
        text: 'Membantu teman yang terjatuh tanpa membeda-bedakan suku dan agama adalah contoh pengamalan sila kedua Pancasila.',
        type: 'true_false',
        options: ['Benar', 'Salah'],
        correctIndex: 0,
        explanation: 'Sila ke-2 mengajarkan sikap saling menyayangi sesama manusia dan menjunjung tinggi nilai kemanusiaan.',
        imageCaption: '🇮🇩 Nilai Kemanusiaan'
      }
    ],
    matematika: [
      {
        text: `Berapakah hasil dari 25 × 4 + 50?`,
        type: 'multiple_choice',
        options: ['150', '125', '100', '175'],
        correctIndex: 0,
        explanation: 'Operasi perkalian didahulukan: 25 × 4 = 100, kemudian 100 + 50 = 150.',
        imageCaption: '🔢 Operasi Hitung'
      },
      {
        text: 'Pecahan 1/2 nilainya senilai dengan pecahan 2/4 dan 5/10.',
        type: 'true_false',
        options: ['Benar', 'Salah'],
        correctIndex: 0,
        explanation: 'Jika pembilang dan penyebut dikalikan dengan angka yang sama (2 atau 5), nilai pecahannya tetap sama yaitu setengah (0,5).',
        imageCaption: '🍕 Pecahan Senilai'
      },
      {
        text: 'Sebuah persegi memiliki panjang sisi 8 cm. Berapakah keliling persegi tersebut?',
        type: 'multiple_choice',
        options: ['32 cm', '64 cm', '16 cm', '24 cm'],
        correctIndex: 0,
        explanation: 'Keliling persegi = 4 × sisi = 4 × 8 cm = 32 cm.',
        imageCaption: '⏹️ Bangun Persegi'
      }
    ]
  };

  // Pilih koleksi yang cocok dengan topik
  let selected = templates.pernapasan;
  if (normalizedTopic.includes('cerna') || normalizedTopic.includes('makan') || normalizedTopic.includes('organ')) {
    selected = templates.pencernaan;
  } else if (normalizedTopic.includes('pancasila') || normalizedTopic.includes('garuda') || subject === 'Pendidikan Pancasila') {
    selected = templates.pancasila;
  } else if (normalizedTopic.includes('hitung') || normalizedTopic.includes('pecahan') || normalizedTopic.includes('kali') || subject === 'Matematika') {
    selected = templates.matematika;
  }

  // Buat butir soal sebanyak `count`
  const questions: QuizQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const template = selected[i % selected.length];
    const uniqueId = 'q_ai_gen_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_' + i;
    
    questions.push({
      id: uniqueId,
      text: template.text || `Pertanyaan materi ${topic} untuk Kelas ${grade} SD nomor ${i + 1}?`,
      type: template.type || 'multiple_choice',
      options: template.options ? [...template.options] : ['Jawaban A', 'Jawaban B', 'Jawaban C', 'Jawaban D'],
      correctIndex: template.correctIndex ?? 0,
      explanation: template.explanation || `Penjelasan konsep pembelajaran untuk materi ${topic}.`,
      imageCaption: template.imageCaption || '📚 Materi Pelajaran SD'
    });
  }

  return questions;
};
