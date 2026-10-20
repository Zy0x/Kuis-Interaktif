/**
 * Utilitas Berbagi Laporan Hasil Kuis ke WhatsApp Wali Murid & Media Komunikasi
 */

export interface StudentQuizReportParams {
  studentName: string;
  quizTitle: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSec: number;
  schoolName?: string;
  dateStr?: string;
}

/**
 * Menghasilkan tautan langsung WhatsApp dengan template pesan apresiasi resmi dan santun
 */
export function generateStudentWhatsAppUrl(params: StudentQuizReportParams): string {
  const isPassed = params.score >= 70;
  const statusBadge = isPassed ? 'TUNTAS (Memuaskan)' : 'REMEDIAL (Perlu Penguatan)';
  const stars = isPassed ? (params.score === 100 ? '⭐⭐⭐' : '⭐⭐') : '⭐';
  const school = params.schoolName ? `\n🏫 *${params.schoolName}*` : '';
  const date = params.dateStr ? `\n📅 Tanggal: ${params.dateStr}` : '';

  const message = `Yth. Bapak/Ibu Wali Murid dari *${params.studentName}*,${school}
${date}
Berikut rekap hasil pengerjaan kuis siswa:
📝 *Materi*: ${params.quizTitle}
📊 *Nilai Akhir*: ${params.score} / 100 ${stars}
🎯 *Status*: ${statusBadge}
✅ *Jawaban Benar*: ${params.correctCount} dari ${params.totalQuestions} soal
⏱️ *Durasi Pengerjaan*: ${params.timeSpentSec} detik

${
  isPassed
    ? '🎉 _Selamat atas capaian membanggakan ananda! Mohon terus didukung dan diapresiasi semangat belajarnya di rumah._'
    : '💪 _Ananda telah berusaha dengan baik. Mari bersama kita berikan bimbingan dan semangat agar hasil berikutnya semakin optimal._'
}

Terima kasih banyak atas kerja sama dan pendampingan Bapak/Ibu di rumah. 🙏`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
