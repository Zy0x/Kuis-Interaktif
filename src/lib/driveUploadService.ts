import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface DriveUploadOptions {
  fileName?: string;
  folderId?: string;
  folderName?: string;
  quizPin?: string;
  quizTitle?: string;
  quizId?: string;
}

export interface DriveUploadResult {
  success: boolean;
  directUrl: string;
  thumbnailUrl?: string;
  webViewLink?: string;
  fileId?: string;
  name?: string;
  folderId?: string;
  folderName?: string;
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
 * Mendukung pengelompokan otomatis per subfolder kuis (misal: [PIN 7871] Judul Kuis).
 */
export async function uploadFileToGoogleDrive(
  file: File | Blob,
  customFileNameOrOptions?: string | DriveUploadOptions,
  legacyOptions?: DriveUploadOptions
): Promise<DriveUploadResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      directUrl: '',
      error: 'Koneksi Supabase belum terkonfigurasi.',
    };
  }

  const options: DriveUploadOptions =
    typeof customFileNameOrOptions === 'object'
      ? customFileNameOrOptions
      : {
          fileName: customFileNameOrOptions,
          ...legacyOptions,
        };

  try {
    const formData = new FormData();
    formData.append('file', file);
    if (options.fileName) {
      formData.append('fileName', options.fileName);
    }
    if (options.quizPin) {
      formData.append('quizPin', options.quizPin);
    }
    if (options.quizTitle) {
      formData.append('quizTitle', options.quizTitle);
    }
    if (options.quizId) {
      formData.append('quizId', options.quizId);
    }
    if (options.folderName) {
      formData.append('folderName', options.folderName);
    }
    if (options.folderId) {
      formData.append('folderId', options.folderId);
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
      folderId: data.folderId,
      folderName: data.folderName,
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
  fileNameOrOptions?: string | DriveUploadOptions,
  mimeType?: string,
  extraOptions?: DriveUploadOptions
): Promise<DriveUploadResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      directUrl: '',
      error: 'Koneksi Supabase belum terkonfigurasi.',
    };
  }

  const options: DriveUploadOptions =
    typeof fileNameOrOptions === 'object'
      ? fileNameOrOptions
      : {
          fileName: fileNameOrOptions,
          ...extraOptions,
        };

  try {
    const { data, error } = await supabase.functions.invoke('upload-drive', {
      body: {
        base64: base64Data,
        fileName: options.fileName || `image_${Date.now()}.png`,
        mimeType: mimeType || 'image/png',
        quizPin: options.quizPin,
        quizTitle: options.quizTitle,
        quizId: options.quizId,
        folderName: options.folderName,
        folderId: options.folderId,
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
