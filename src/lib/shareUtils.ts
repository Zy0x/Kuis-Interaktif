import { copyTextToClipboard } from './aiQuestionParser';

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

export interface ShareLinkOptions {
  url: string;
  title?: string;
  onSuccess?: () => void;
  onCopied?: () => void;
}

/**
 * Membagikan tautan kuis secara universal hanya berupa link murni (tanpa teks panjang).
 * 1. Menggunakan Web Share API (navigator.share) jika didukung (HTTPS / localhost).
 * 2. Memicu Share Drawer sistem Android via Android Intent jika diakses melalui HTTP lokal.
 * 3. Fallback otomatis ke salin tautan clipboard jika keduanya tidak didukung.
 */
export async function shareLinkUniversal(options: ShareLinkOptions): Promise<void> {
  const { url, title, onSuccess, onCopied } = options;

  // 1. Coba Web Share API native (HTTPS / Localhost)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const shareData: ShareData = { url };
      if (title) shareData.title = title;

      if (typeof navigator.canShare === 'function') {
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          onSuccess?.();
          return;
        } else if (navigator.canShare({ url })) {
          await navigator.share({ url });
          onSuccess?.();
          return;
        }
      } else {
        await navigator.share(shareData);
        onSuccess?.();
        return;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
    }
  }

  // 2. Pada smartphone Android di jaringan HTTP (misal IP Wi-Fi lokal),
  // picu Share Drawer sistem Android bawaan menggunakan Android Intent
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  if (isAndroid) {
    try {
      const intentUrl = `intent:#Intent;action=android.intent.action.SEND;type=text/plain;S.android.intent.extra.TEXT=${encodeURIComponent(
        url
      )};end`;
      window.location.href = intentUrl;
      onSuccess?.();
      return;
    } catch {}
  }

  // 3. Fallback otomatis ke Clipboard
  const copied = await copyTextToClipboard(url);
  if (copied) {
    onCopied?.();
  }
}
