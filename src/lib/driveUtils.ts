/**
 * Google Drive Media Resilience Utility
 * Standar Teknis Rule 9 & Rule 10
 *
 * Menangani seluruh variasi tautan Google Drive publik / shared:
 * - https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing
 * - https://drive.google.com/file/d/{FILE_ID}/preview
 * - https://drive.google.com/open?id={FILE_ID}
 * - https://drive.google.com/uc?id={FILE_ID}
 * - https://drive.google.com/thumbnail?id={FILE_ID}
 * - https://docs.google.com/file/d/{FILE_ID}/edit
 * - https://drive.google.com/file/u/0/d/{FILE_ID}/view
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://colpcgesngntiztjeprg.supabase.co';

// Regex untuk mendeteksi domain Google Drive atau Docs
const GDRIVE_DOMAIN_REGEX = /^(https?:\/\/)?(drive|docs)\.google\.com\//i;

// Regex ekstraksi Google Drive File ID dari berbagai format URL
const GDRIVE_ID_PATTERNS: RegExp[] = [
  /\/file\/d\/([a-zA-Z0-9_-]{20,})/i,
  /\/file\/u\/\d+\/d\/([a-zA-Z0-9_-]{20,})/i,
  /[?&]id=([a-zA-Z0-9_-]{20,})/i,
  /\/d\/([a-zA-Z0-9_-]{20,})/i,
  /\/uc\?.*id=([a-zA-Z0-9_-]{20,})/i,
  /\/thumbnail\?.*id=([a-zA-Z0-9_-]{20,})/i,
];

/**
 * Mengecek apakah sebuah URL berasal dari Google Drive
 */
export function isGoogleDriveUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return GDRIVE_DOMAIN_REGEX.test(trimmed);
}

/**
 * Mengekstrak File ID dari berbagai format tautan Google Drive
 */
export function extractGoogleDriveFileId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Jika input sudah merupakan raw fileId Google Drive (alphanumeric panjang 25-50 char)
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(trimmed)) {
    return trimmed;
  }

  for (const pattern of GDRIVE_ID_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Menghasilkan URL Google Drive CDN Thumbnail
 * Keunggulan: Kecepatan tinggi via Google Cache CDN, bebas CORS blocking untuk <img>, tidak terhalang virus warning.
 */
export function getDriveThumbnailUrl(fileIdOrUrl: string, size = 1200): string {
  const fileId = extractGoogleDriveFileId(fileIdOrUrl) || fileIdOrUrl;
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${size}`;
}

/**
 * Menghasilkan URL streaming melalui Supabase Edge Function proxy
 * Keunggulan: Zero-CORS, di-cache secara immutable oleh Supabase CDN.
 */
export function getDriveProxyUrl(fileIdOrUrl: string): string {
  const fileId = extractGoogleDriveFileId(fileIdOrUrl) || fileIdOrUrl;
  const baseUrl = SUPABASE_URL.replace(/\/+$/, '');
  return `${baseUrl}/functions/v1/upload-drive?fileId=${encodeURIComponent(fileId)}`;
}

/**
 * Resolusi cerdas untuk URL media kuis (sampul, gambar soal, dsb).
 * Mengubah tautan Google Drive mentah (web viewer) menjadi URL gambar langsung yang dapat di-render oleh tag <img>.
 * URL biasa (Unsplash, Wikimedia, data:image, blob:) tetap utuh tanpa modifikasi.
 */
export function resolveMediaUrl(
  url?: string | null,
  options?: {
    size?: number;
    preferProxy?: boolean;
  }
): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Jika berupa data URI atau Blob URI, kembalikan langsung
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Jika terdeteksi Google Drive URL
  if (isGoogleDriveUrl(trimmed)) {
    const fileId = extractGoogleDriveFileId(trimmed);
    if (fileId) {
      if (options?.preferProxy) {
        return getDriveProxyUrl(fileId);
      }
      return getDriveThumbnailUrl(fileId, options?.size || 1200);
    }
  }

  // URL normal lainnya
  return trimmed;
}

/**
 * URL Cadangan (Fallback) jika URL utama mengalami kegagalan render di browser.
 * Jika URL utama menggunakan CDN Thumbnail Google Drive, alihkan ke Edge Function proxy (atau sebaliknya).
 */
export function getAlternativeMediaUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  const fileId = extractGoogleDriveFileId(trimmed);
  if (!fileId) return null;

  // Jika saat ini menggunakan thumbnail CDN, alihkan ke Supabase Edge proxy
  if (trimmed.includes('drive.google.com/thumbnail')) {
    return getDriveProxyUrl(fileId);
  }

  // Jika saat ini menggunakan Supabase Edge proxy, alihkan ke thumbnail CDN
  if (trimmed.includes('/functions/v1/upload-drive')) {
    return getDriveThumbnailUrl(fileId, 1200);
  }

  // Jika format lainnya, default ke thumbnail CDN
  return getDriveThumbnailUrl(fileId, 1200);
}