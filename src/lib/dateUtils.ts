/**
 * Utilitas format waktu resmi Indonesia (WIB, WITA, WIT)
 * Dirancang ramah pengguna, akurat, dan serasi untuk antarmuka Guru & Siswa.
 */

export function formatIndonesianTime(
  isoString?: string | null,
  options?: { withSeconds?: boolean; withDate?: boolean }
): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';

    // Deteksi zona waktu lokal perangkat
    // Offset dihitung dalam menit (UTC - local):
    // WIB  : UTC+7 -> offset -420
    // WITA : UTC+8 -> offset -480
    // WIT  : UTC+9 -> offset -540
    const offsetMin = date.getTimezoneOffset();
    let tzLabel = 'WIB';
    if (offsetMin === -480) {
      tzLabel = 'WITA';
    } else if (offsetMin === -540) {
      tzLabel = 'WIT';
    } else if (offsetMin !== -420) {
      // Default Indonesia barat untuk konteks nasional
      tzLabel = 'WIB';
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    let timeStr = `${hours}:${minutes}`;
    if (options?.withSeconds) {
      timeStr += `:${seconds}`;
    }
    timeStr += ` ${tzLabel}`;

    if (options?.withDate) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const day = date.getDate();
      const month = months[date.getMonth()];
      return `${day} ${month}, ${timeStr}`;
    }

    return timeStr;
  } catch {
    return '-';
  }
}
