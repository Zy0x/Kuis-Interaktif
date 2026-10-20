/**
 * Utilitas untuk sanitasi, normalisasi, dan analisis peserta kuis siswa.
 * Mencegah duplikasi nomor absen berulang (seperti "7. 7. 7. Hafif Ahmad")
 * serta mendeteksi pengulangan kuis oleh siswa yang sama.
 */

import type { QuizSessionParticipant } from '../types/quiz';

export interface ParsedStudentName {
  rollNumber: string;
  cleanName: string;
  formattedName: string;
}

/**
 * Membersihkan nama siswa dari pola nomor absen yang menumpuk berulang
 * Contoh kasus:
 * - "7. 7. 7. 7. Hafif Ahmad" => roll: "7", clean: "Hafif Ahmad", formatted: "7. Hafif Ahmad"
 * - "1. 1.Akhmad Fahrurozi/Rozi" => roll: "1", clean: "Akhmad Fahrurozi/Rozi", formatted: "1. Akhmad Fahrurozi/Rozi"
 * - "20. sofiyah nur laila" => roll: "20", clean: "sofiyah nur laila", formatted: "20. sofiyah nur laila"
 * - "Budi Santoso (2)" => roll: "", clean: "Budi Santoso (2)", formatted: "Budi Santoso (2)"
 */
export function parseStudentName(rawName?: string | null, existingRoll?: string | null): ParsedStudentName {
  if (!rawName || typeof rawName !== 'string') {
    const roll = existingRoll?.trim() || '';
    return { rollNumber: roll, cleanName: '', formattedName: '' };
  }

  let current = rawName.trim();
  let detectedRoll = existingRoll?.trim() || '';

  // 1. Bersihkan prefix No/Absen/Huruf Kelas HANYA jika langsung diikuti angka (misal: 'No. 15', 'A. 15. 15.', 'Absen 7')
  // JANGAN sentuh singkatan nama asli seperti 'H. Ali', 'M. Rizki', 'St. Nurhaliza'
  const classOrPrefixPattern = /^(?:(?:no|absen|nomor)\.?\s*|(?:kelas\s*[a-z0-9]+\.?\s*)|(?:[a-z]\.?\s*(?=\d)))/i;
  if (classOrPrefixPattern.test(current)) {
    current = current.replace(classOrPrefixPattern, '').trim();
  }

  // 2. Ekstrak dan bersihkan prefix nomor berulang di awal nama
  // Pola: satu atau lebih blok [angka diikuti pemisah seperti titik, spasi, atau strip]
  const prefixPattern = /^(\d+)[\.\s\-]+/;
  while (prefixPattern.test(current)) {
    const match = current.match(prefixPattern);
    if (match) {
      if (!detectedRoll) {
        detectedRoll = match[1];
      }
      current = current.replace(prefixPattern, '').trim();
    }
  }

  // 3. Tangani kasus nomor menempel dengan titik tanpa spasi (misal: "1.Akhmad")
  const attachedPattern = /^(\d+)\.(.+)$/;
  const attachedMatch = current.match(attachedPattern);
  if (attachedMatch) {
    if (!detectedRoll) {
      detectedRoll = attachedMatch[1];
    }
    current = attachedMatch[2].trim();
  }

  // 4. Bersihkan seluruh suffix penomoran otomatis/disambiguasi di akhir nama (misal: " (2)", " (2) (2)", " (3)")
  // Nama siswa yang ditampilkan ke guru harus murni nama asli siswa tanpa embel-embel sistem (misal: 'Salsabila', 'Muhamad sakur', 'Asshifa')
  current = current.replace(/(?:\s*\(\d+\))+$/g, '').trim();

  // Jika nama bersih menjadi kosong karena string asli hanya berisi angka/titik
  const cleanName = current || rawName.trim();
  const rollNumber = detectedRoll;
  const formattedName = rollNumber ? `${rollNumber}. ${cleanName}` : cleanName;

  return {
    rollNumber,
    cleanName,
    formattedName,
  };
}

/**
 * Format nama tampilan siswa yang aman & bersih secara instan
 */
export function formatStudentDisplayName(rawName?: string | null, existingRoll?: string | null): string {
  const parsed = parseStudentName(rawName, existingRoll);
  return parsed.formattedName || rawName?.trim() || 'Siswa Pintar';
}

/**
 * Dapatkan base key unik siswa untuk mendeteksi apakah 2 entri merupakan siswa yang sama
 * Mengabaikan seluruh suffix disambiguasi seperti "(2)", "(3)", "(2) (2)" serta case sensitivity.
 */
export function getStudentBaseIdentityKey(rawName?: string | null): string {
  if (!rawName) return '';
  const parsed = parseStudentName(rawName);
  // Hilangkan seluruh suffix disambiguasi bertingkat seperti " (2)", " (2) (2)"
  const baseName = parsed.cleanName.replace(/(?:\s*\(\d+\))+$/g, '').trim().toLowerCase();
  return parsed.rollNumber ? `roll_${parsed.rollNumber}_${baseName}` : `name_${baseName}`;
}

export interface ParticipantWithAttemptMeta extends QuizSessionParticipant {
  parsedRollNumber: string;
  parsedCleanName: string;
  displayFormattedName: string;
  attemptNumber: number;
  totalAttempts: number;
  isDuplicateAttempt: boolean;
  isBestScoreAttempt: boolean;
  isLatestAttempt: boolean;
}

/**
 * Menganalisis daftar peserta sesi kuis live untuk mendeteksi duplikasi / pengulangan kuis
 * Menandai nomor percobaan, percobaan dengan skor tertinggi, dan percobaan terkini.
 */
export function analyzeSessionDuplicates(participants: QuizSessionParticipant[]): ParticipantWithAttemptMeta[] {
  if (!participants || participants.length === 0) return [];

  // 1. Kelompokkan peserta berdasarkan identitas dasar siswa
  const studentGroups = new Map<string, QuizSessionParticipant[]>();

  participants.forEach((p) => {
    const key = getStudentBaseIdentityKey(p.name);
    if (!studentGroups.has(key)) {
      studentGroups.set(key, []);
    }
    studentGroups.get(key)!.push(p);
  });

  // 2. Beri anotasi urutan percobaan (kronologis berdasarkan completedAt / lastActiveAt / index)
  const metaMap = new Map<string, {
    attemptNumber: number;
    totalAttempts: number;
    isDuplicateAttempt: boolean;
    isBestScoreAttempt: boolean;
    isLatestAttempt: boolean;
  }>();

  studentGroups.forEach((group) => {
    // Urutkan grup secara kronologis: yang pertama dibuat/selesai = Percobaan #1
    const sortedChronological = [...group].sort((a, b) => {
      const timeA = new Date(a.completedAt || a.lastActiveAt || 0).getTime();
      const timeB = new Date(b.completedAt || b.lastActiveAt || 0).getTime();
      return timeA - timeB;
    });

    // Cari skor tertinggi di grup ini
    let bestScore = -1;
    let minTimeForBest = Infinity;
    sortedChronological.forEach((p) => {
      if (p.score > bestScore || (p.score === bestScore && p.timeSpentSec < minTimeForBest)) {
        bestScore = p.score;
        minTimeForBest = p.timeSpentSec;
      }
    });

    const latestParticipant = sortedChronological[sortedChronological.length - 1];

    sortedChronological.forEach((p, idx) => {
      const isBest = p.score === bestScore && p.timeSpentSec === minTimeForBest;
      const isLatest = p.id === latestParticipant.id;

      metaMap.set(p.id, {
        attemptNumber: idx + 1,
        totalAttempts: group.length,
        isDuplicateAttempt: group.length > 1,
        isBestScoreAttempt: isBest,
        isLatestAttempt: isLatest,
      });
    });
  });

  // 3. Kembalikan array dengan metadata terlampir
  return participants.map((p) => {
    const parsed = parseStudentName(p.name);
    const meta = metaMap.get(p.id) || {
      attemptNumber: 1,
      totalAttempts: 1,
      isDuplicateAttempt: false,
      isBestScoreAttempt: true,
      isLatestAttempt: true,
    };

    return {
      ...p,
      parsedRollNumber: parsed.rollNumber,
      parsedCleanName: parsed.cleanName,
      displayFormattedName: parsed.formattedName || p.name,
      ...meta,
    };
  });
}
