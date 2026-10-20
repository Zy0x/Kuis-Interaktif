/**
 * Utilitas Mobile & Interaksi Pengguna (Haptics, Format Matematika, Responsivitas)
 * Mematuhi Standar Kurikulum Merdeka & Mobile-First UX
 */

/**
 * Memicu getaran mikro haptik (Haptic Feedback) pada perangkat yang mendukung navigator.vibrate
 * Durasi disetel sangat halus (10–25ms) agar nyaman dan tidak memberatkan baterai.
 */
export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light'): void {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
  try {
    if (type === 'light') {
      navigator.vibrate(12);
    } else if (type === 'medium') {
      navigator.vibrate(20);
    } else if (type === 'success') {
      navigator.vibrate([15, 30, 15]);
    } else if (type === 'warning') {
      navigator.vibrate([25, 40, 25]);
    }
  } catch {
    // Abaikan jika browser membatasi API vibrasi latar belakang
  }
}

/**
 * Format ekspresi matematika standar buku teks Kurikulum Merdeka SD:
 * - Mengubah 'x' atau '*' antar angka menjadi simbol perkalian '×' (\u00D7)
 * - Mengubah ':' atau '/' pembagian antar angka menjadi simbol pembagian '÷' (\u00F7) atau ':' berjarak rapi
 * - Menjaga spasi non-breaking agar operasi hitung tidak terpotong baris di layar sempit
 */
export function formatMathExpression(text: string): string {
  if (!text || typeof text !== 'string') return text || '';

  // 1. Ganti perkalian: angka [spasi]* x [spasi]* angka -> angka × angka
  let formatted = text.replace(/(\d+)\s*[xX*]\s*(\d+)/g, '$1\u00A0×\u00A0$2');

  // 2. Ganti pembagian: angka : angka atau angka / angka -> angka ÷ angka
  formatted = formatted.replace(/(\d+)\s*[:/]\s*(\d+)/g, '$1\u00A0÷\u00A0$2');

  // 3. Rapikan penjumlahan dan pengurangan dengan non-breaking space di sekitar operator jika ada operasi beruntun
  // Contoh: '25 - 5 + 5' -> '25 - 5 + 5' dengan spasi rapi
  formatted = formatted.replace(/(\d+)\s*\+\s*(\d+)/g, '$1\u00A0+\u00A0$2');
  formatted = formatted.replace(/(\d+)\s*-\s*(\d+)/g, '$1\u00A0−\u00A0$2');

  return formatted;
}

/**
 * Helper untuk mendapatkan label huruf opsi abjad (A, B, C, D, ...)
 */
export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function getOptionLetter(index: number): string {
  if (index >= 0 && index < OPTION_LETTERS.length) {
    return OPTION_LETTERS[index];
  }
  return String.fromCharCode(65 + Math.max(0, index));
}
