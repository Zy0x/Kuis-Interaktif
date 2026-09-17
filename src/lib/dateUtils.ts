/**
 * Utilitas format waktu resmi Indonesia (WIB, WITA, WIT)
 * Dirancang ramah pengguna, akurat, dan serasi untuk antarmuka Guru & Siswa.
 */

export interface FormatIndonesianTimeOptions {
  withSeconds?: boolean;
  withDate?: boolean;
  withDay?: boolean;
  shortDay?: boolean;
  withYear?: boolean;
}

export function formatIndonesianTime(
  isoString?: string | null,
  options?: FormatIndonesianTimeOptions
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
      const daysFull = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const daysShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      const dayName = options.shortDay ? daysShort[date.getDay()] : daysFull[date.getDay()];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const yearStr = options.withYear ? ` ${date.getFullYear()}` : '';

      if (options.withDay !== false) {
        return `${dayName}, ${day} ${month}${yearStr}, ${timeStr}`;
      }

      return `${day} ${month}${yearStr}, ${timeStr}`;
    }

    return timeStr;
  } catch {
    return '-';
  }
}

export function formatIndonesianDate(
  isoString?: string | null,
  options?: { withDay?: boolean; shortDay?: boolean; withYear?: boolean }
): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';

    const daysFull = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const daysShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const dayName = options?.shortDay ? daysShort[date.getDay()] : daysFull[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const yearStr = options?.withYear ? ` ${date.getFullYear()}` : '';

    if (options?.withDay !== false) {
      return `${dayName}, ${day} ${month}${yearStr}`;
    }

    return `${day} ${month}${yearStr}`;
  } catch {
    return '-';
  }
}
