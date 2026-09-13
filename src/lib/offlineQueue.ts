/**
 * Offline Sync & Outbox Queue Manager
 * Standar Teknis Rule 9, Rule 10 & Rule 11
 *
 * Menjamin ketahanan pengiriman jawaban siswa dan hasil kuis ketika:
 * - Jaringan seluler sekolah tidak stabil / sinyal lemah.
 * - Mode pesawat atau terputus sementara.
 * - Supabase API mengalami latensi tinggi atau timeout.
 *
 * Menyimpan antrean ke localStorage secara persisten, menggabungkan (deduplicate) pembaruan
 * berulang untuk partisipan yang sama, dan menyinkronkan otomatis saat jaringan pulih.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_PENDING_QUEUE = 'kuis_sd_pending_sync_queue_v1';

export type SyncOperationType = 'session_participant_upsert' | 'quiz_attempt_insert';

export interface PendingSyncItem {
  id: string;
  type: SyncOperationType;
  payload: any;
  onConflict?: string;
  createdAt: number;
  retryCount: number;
  lastAttemptAt?: number;
}

type SyncListener = (pendingCount: number, isSyncing: boolean) => void;

class OfflineQueueService {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private syncTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notifyListeners();
      });

      // Interval pemeriksaan antrean berkala setiap 20 detik jika ada antrean tertunda
      this.syncTimer = setInterval(() => {
        if (typeof navigator !== 'undefined' && navigator.onLine && this.getQueue().length > 0) {
          this.notifyListeners();
        }
      }, 20000);
    }
  }

  /**
   * Mengambil seluruh item dalam antrean lokal
   */
  public getQueue(): PendingSyncItem[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PENDING_QUEUE);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Menyimpan antrean ke localStorage
   */
  private saveQueue(queue: PendingSyncItem[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_PENDING_QUEUE, JSON.stringify(queue.slice(0, 100)));
    } catch (e) {
      console.warn('Gagal menyimpan offline sync queue:', e);
    }
    this.notifyListeners();
  }

  /**
   * Menambahkan operasi ke dalam antrean offline.
   * Cerdas: Jika tipe adalah 'session_participant_upsert' untuk session_id dan student_name yang sama,
   * data digabungkan ke data terbaru agar tidak membebani database dengan kueri bertumpuk.
   */
  public enqueue(
    type: SyncOperationType,
    payload: any,
    onConflict: string = 'session_id, student_name'
  ): void {
    const queue = this.getQueue();
    const now = Date.now();

    if (type === 'session_participant_upsert') {
      const existingIdx = queue.findIndex(
        (item) =>
          item.type === 'session_participant_upsert' &&
          item.payload?.session_id === payload?.session_id &&
          item.payload?.student_name?.trim()?.toLowerCase() === payload?.student_name?.trim()?.toLowerCase()
      );

      if (existingIdx !== -1) {
        // Timpa dengan status data terbaru (kumulatif jawaban dan skor terkini)
        queue[existingIdx] = {
          ...queue[existingIdx],
          payload: {
            ...queue[existingIdx].payload,
            ...payload,
            // Pertahankan map jawaban kumulatif jika ada
            answers: {
              ...(queue[existingIdx].payload?.answers || {}),
              ...(payload?.answers || {}),
            },
          },
          lastAttemptAt: now,
        };
        this.saveQueue(queue);
        return;
      }
    }

    const newItem: PendingSyncItem = {
      id: 'queue_' + now + '_' + Math.random().toString(36).substring(2, 7),
      type,
      payload,
      onConflict,
      createdAt: now,
      retryCount: 0,
    };

    queue.push(newItem);
    this.saveQueue(queue);
  }

  /**
   * Menghapus item tertentu dari antrean berdasarkan ID
   */
  public remove(id: string): void {
    const queue = this.getQueue().filter((item) => item.id !== id);
    this.saveQueue(queue);
  }

  /**
   * Jumlah item yang belum tersinkronkan
   */
  public getPendingCount(): number {
    return this.getQueue().length;
  }

  /**
   * Eksekusi sinkronisasi antrean ke Supabase
   */
  public async flushQueue(supabase: SupabaseClient | null): Promise<{ success: number; failed: number }> {
    if (!supabase || this.isSyncing) {
      return { success: 0, failed: 0 };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: 0, failed: 0 };
    }

    const queue = this.getQueue();
    if (queue.length === 0) {
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    let successCount = 0;
    let failedCount = 0;
    const remainingQueue: PendingSyncItem[] = [];

    for (const item of queue) {
      try {
        if (item.type === 'session_participant_upsert') {
          const { error } = await supabase.from('quiz_session_participants').upsert(
            item.payload,
            item.onConflict ? { onConflict: item.onConflict } : undefined
          );

          if (error) {
            throw error;
          }
          successCount++;
        } else if (item.type === 'quiz_attempt_insert') {
          const { error } = await supabase.from('quiz_attempts').insert(item.payload);

          if (error) {
            throw error;
          }
          successCount++;
        }
      } catch (err: any) {
        console.warn(`[OfflineQueue] Gagal sync item ${item.id} (${item.type}):`, err?.message || err);
        failedCount++;
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastAttemptAt = Date.now();

        // Pertahankan di antrean jika percobaan gagal belum melebihi 10 kali
        if (item.retryCount < 10) {
          remainingQueue.push(item);
        }
      }
    }

    this.saveQueue(remainingQueue);
    this.isSyncing = false;
    this.notifyListeners();

    if (successCount > 0) {
      console.info(`✅ [OfflineQueue] Berhasil menyinkronkan ${successCount} data ke Supabase.`);
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Langganan notifikasi status antrean untuk komponen UI
   */
  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getPendingCount(), this.isSyncing);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const count = this.getPendingCount();
    this.listeners.forEach((fn) => {
      try {
        fn(count, this.isSyncing);
      } catch {}
    });
  }

  /**
   * Menghentikan timer sinkronisasi latar belakang jika service didestroy
   */
  public destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
}

export const offlineQueue = new OfflineQueueService();