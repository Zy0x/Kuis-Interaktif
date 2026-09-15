import { useState, useEffect } from 'react';

export interface DeadlineCountdownResult {
  hasDeadline: boolean;
  isExpired: boolean;
  isUrgent: boolean;
  diffMs: number;
  formattedDate: string;
  countdownText: string;
  statusBadge: 'active' | 'urgent' | 'expired' | 'no_deadline';
}

/**
 * Format string ISO deadline ke tanggal bahasa Indonesia lengkap dan ramah pengguna
 */
export const formatIndonesianFullDeadline = (isoString?: string): string => {
  if (!isoString) return 'Tanpa Batas Waktu';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return (
      d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB'
    );
  } catch {
    return isoString;
  }
};

/**
 * Menghitung sisa waktu / countdown akurat terhadap waktu sekarang
 */
export const getAccurateDeadlineCountdown = (
  isoString?: string,
  nowMs: number = Date.now()
): DeadlineCountdownResult => {
  if (!isoString) {
    return {
      hasDeadline: false,
      isExpired: false,
      isUrgent: false,
      diffMs: Infinity,
      formattedDate: 'Tanpa Batas Waktu',
      countdownText: 'Akses Fleksibel Kapan Saja',
      statusBadge: 'no_deadline',
    };
  }

  const targetDate = new Date(isoString);
  const targetMs = targetDate.getTime();

  if (isNaN(targetMs)) {
    return {
      hasDeadline: false,
      isExpired: false,
      isUrgent: false,
      diffMs: Infinity,
      formattedDate: isoString,
      countdownText: 'Format Tidak Dikenal',
      statusBadge: 'no_deadline',
    };
  }

  const diffMs = targetMs - nowMs;
  const formattedDate = formatIndonesianFullDeadline(isoString);

  // Jika sudah kedaluwarsa
  if (diffMs <= 0) {
    return {
      hasDeadline: true,
      isExpired: true,
      isUrgent: false,
      diffMs,
      formattedDate,
      countdownText: 'Tenggat Waktu Berakhir (00j 00m 00d)',
      statusBadge: 'expired',
    };
  }

  // Jika sisa waktu <= 24 jam (Urgent / Hitung mundur akurat jam, menit, detik)
  if (diffMs <= 86400000) {
    const totalSec = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const hh = String(hours).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');

    return {
      hasDeadline: true,
      isExpired: false,
      isUrgent: true,
      diffMs,
      formattedDate,
      countdownText: `Sisa ${hh}j ${mm}m ${ss}d`,
      statusBadge: 'urgent',
    };
  }

  // Jika sisa waktu > 24 jam (Tampilkan format Hari & Jam)
  const days = Math.floor(diffMs / 86400000);
  const remainingHours = Math.floor((diffMs % 86400000) / 3600000);

  return {
    hasDeadline: true,
    isExpired: false,
    isUrgent: false,
    diffMs,
    formattedDate,
    countdownText: `Sisa ${days} hari ${remainingHours > 0 ? `${remainingHours} jam` : ''}`.trim(),
    statusBadge: 'active',
  };
};

/**
 * Hook React untuk memicu update re-render detik countdown secara real-time
 */
export const useDeadlineTicker = (intervalMs = 1000): number => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
};
