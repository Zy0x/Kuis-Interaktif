import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface DriveUploadResult {
  success: boolean;
  directUrl: string;
  thumbnailUrl?: string;
  webViewLink?: string;
  fileId?: string;
  name?: string;
  error?: string;
}

export interface DriveStatusResult {
  connected: boolean;
  message: string;
  authMode?: string;
  clientEmail?: string;
  folder?: any;
  error?: string;
}

/**
 * Unggah file gambar / media langsung ke Google Drive Pro via Supabase Edge Function (Rule 9 & Rule 10)
 * Kredensial terlindungi aman di server-side (Edge Function Secrets).
 */
export async function uploadFileToGoogleDrive(
  file: File | Blob,
  customFileName?: string
): Promise<DriveUploadResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      directUrl: '',
      error: 'Koneksi Supabase belum terkonfigurasi.',
    };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    if (customFileName) {
      formData.append('fileName', customFileName);
    }

    const { data, error } = await supabase.functions.invoke('upload-drive', {
      body: formData,
    });

    if (error) {
      return {
        success: false,
        directUrl: '',
        error: error.message || 'Gagal menghubungi Edge Function upload-drive.',
      };
    }

    if (!data?.success) {
      return {
        success: false,
        directUrl: '',
        error: data?.error || 'Gagal mengunggah media ke Google Drive.',
      };
    }

    return {
      success: true,
      directUrl: data.directUrl,
      thumbnailUrl: data.thumbnailUrl,
      webViewLink: data.webViewLink,
      fileId: data.fileId,
      name: data.name,
    };
  } catch (err: any) {
    console.error('DriveUploadService error:', err);
    return {
      success: false,
      directUrl: '',
      error: err?.message || 'Terjadi gangguan jaringan saat mengunggah media.',
    };
  }
}

/**
 * Unggah gambar berbasis Base64 langsung ke Google Drive Pro
 */
export async function uploadBase64ToGoogleDrive(
  base64Data: string,
  fileName?: string,
  mimeType?: string
): Promise<DriveUploadResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      directUrl: '',
      error: 'Koneksi Supabase belum terkonfigurasi.',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('upload-drive', {
      body: {
        base64: base64Data,
        fileName: fileName || `image_${Date.now()}.png`,
        mimeType: mimeType || 'image/png',
      },
    });

    if (error) {
      return {
        success: false,
        directUrl: '',
        error: error.message || 'Gagal memproses unggahan base64 ke Google Drive.',
      };
    }

    if (!data?.success) {
      return {
        success: false,
        directUrl: '',
        error: data?.error || 'Gagal menyimpan media ke Google Drive.',
      };
    }

    return {
      success: true,
      directUrl: data.directUrl,
      thumbnailUrl: data.thumbnailUrl,
      webViewLink: data.webViewLink,
      fileId: data.fileId,
      name: data.name,
    };
  } catch (err: any) {
    console.error('DriveUploadService base64 error:', err);
    return {
      success: false,
      directUrl: '',
      error: err?.message || 'Terjadi kesalahan sistem saat unggah gambar.',
    };
  }
}

/**
 * Periksa konektivitas dan hak akses ke Google Drive Pro
 */
export async function checkGoogleDriveStatus(): Promise<DriveStatusResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      connected: false,
      message: 'Supabase belum terkonfigurasi.',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('upload-drive', {
      body: { action: 'check_status' },
    });

    if (error) {
      return {
        connected: false,
        message: error.message || 'Gagal verifikasi status Google Drive.',
        error: error.message,
      };
    }

    if (data?.success) {
      return {
        connected: true,
        message: `Terkoneksi ke folder: ${data.folder?.name || 'Storage Kuis'}`,
        authMode: data.authMode,
        clientEmail: data.clientEmail,
        folder: data.folder,
      };
    }

    return {
      connected: false,
      message: data?.error || 'Gagal terhubung ke Google Drive.',
      error: data?.error,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Terjadi kesalahan pengecekan status Google Drive.',
      error: err?.message,
    };
  }
}
