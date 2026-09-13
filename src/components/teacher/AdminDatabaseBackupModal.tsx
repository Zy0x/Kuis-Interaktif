import React, { useState, useEffect } from 'react';
import { 
  BackupService, 
  type EncryptedBackupPackage, 
  type BackupHistoryItem, 
  type DatabaseDumpPayload,
  type IntegrityTestResult 
} from '../../lib/backupService';
import { 
  Database, 
  ShieldCheck, 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  FileText, 
  Copy, 
  Check, 
  Clock,
  Activity,
  Calendar,
  Sliders,
  Zap
} from 'lucide-react';

interface AdminDatabaseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherEmail: string;
  teacherName: string;
  playClick: () => void;
}

function generateCaptchaCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let res = '';
  for (let i = 0; i < 5; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export const AdminDatabaseBackupModal: React.FC<AdminDatabaseBackupModalProps> = ({
  isOpen,
  onClose,
  teacherEmail,
  teacherName,
  playClick,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore' | 'integrity' | 'danger'>('backup');

  // Backup State
  const [backupPassword, setBackupPassword] = useState('');
  const [confirmBackupPassword, setConfirmBackupPassword] = useState('');
  const [showBackupPassword, setShowBackupPassword] = useState(false);
  const [backupMode, setBackupMode] = useState<'FULL' | 'INCREMENTAL'>('FULL');
  const [incrementalSince, setIncrementalSince] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessInfo, setExportSuccessInfo] = useState<{
    fileName: string;
    checksum: string;
    size: number;
    mode: 'FULL' | 'INCREMENTAL';
  } | null>(null);
  const [exportError, setExportError] = useState('');

  // Schedule Reminder State
  const [backupScheduleDays, setBackupScheduleDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kuis_sd_backup_schedule_days');
      return saved ? Number(saved) : 7;
    } catch {
      return 7;
    }
  });

  // Integrity Test State
  const [isRunningIntegrityTest, setIsRunningIntegrityTest] = useState(false);
  const [integrityTestResult, setIntegrityTestResult] = useState<IntegrityTestResult | null>(null);

  // Advanced Restore Options
  const [remapIds, setRemapIds] = useState(false);
  const [showDomainAdjustment, setShowDomainAdjustment] = useState(false);
  const [fromDomain, setFromDomain] = useState('');
  const [toDomain, setToDomain] = useState('');

  // History State
  const [history, setHistory] = useState<BackupHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [copiedChecksum, setCopiedChecksum] = useState<string | null>(null);

  // Restore State
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePassword, setRestorePassword] = useState('');
  const [showRestorePassword, setShowRestorePassword] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectedData, setInspectedData] = useState<{
    payload: DatabaseDumpPayload;
    packageInfo: EncryptedBackupPackage;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgressText, setRestoreProgressText] = useState('');
  const [restoreProgressPercent, setRestoreProgressPercent] = useState(0);
  const [restoreSuccessResult, setRestoreSuccessResult] = useState<any | null>(null);
  const [restoreError, setRestoreError] = useState('');

  // Danger Zone (Wipe) State
  const [wipePassword, setWipePassword] = useState('');
  const [wipeCaptchaCode, setWipeCaptchaCode] = useState(() => generateCaptchaCode());
  const [wipeCaptchaInput, setWipeCaptchaInput] = useState('');
  const [wipePhrase, setWipePhrase] = useState('');
  const [wipeAgreed, setWipeAgreed] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [wipeSuccess, setWipeSuccess] = useState(false);
  const [wipeError, setWipeError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const list = await BackupService.fetchBackupHistory();
      setHistory(list);
    } catch {
      // Ignored
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCopyChecksum = (sha: string) => {
    playClick();
    navigator.clipboard.writeText(sha);
    setCopiedChecksum(sha);
    setTimeout(() => setCopiedChecksum(null), 2000);
  };

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setExportError('');
    setExportSuccessInfo(null);

    if (backupPassword.length < 6) {
      setExportError('Kata sandi enkripsi wajib minimal 6 karakter demi keamanan database.');
      return;
    }
    if (backupPassword !== confirmBackupPassword) {
      setExportError('Konfirmasi kata sandi tidak cocok. Mohon teliti kembali.');
      return;
    }

    playClick();
    setIsExporting(true);
    try {
      const res = await BackupService.exportEncryptedDatabaseBackup(
        backupPassword, 
        teacherName || teacherEmail,
        {
          backupMode,
          incrementalSince: backupMode === 'INCREMENTAL' ? new Date(incrementalSince).toISOString() : undefined,
        }
      );
      
      // Trigger download
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.backupFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccessInfo({
        fileName: res.backupFileName,
        checksum: res.checksumSha256,
        size: res.fileSizeBytes,
        mode: res.backupMode,
      });
      setBackupPassword('');
      setConfirmBackupPassword('');
      loadHistory();
    } catch (err: any) {
      setExportError(err.message || 'Gagal membuat berkas cadangan database.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRunIntegrityTest = async () => {
    playClick();
    setIsRunningIntegrityTest(true);
    setIntegrityTestResult(null);
    try {
      const res = await BackupService.runAutomatedBackupIntegrityTest();
      setIntegrityTestResult(res);
    } catch (err: any) {
      console.error('Integrity test failure:', err);
    } finally {
      setIsRunningIntegrityTest(false);
    }
  };

  const handleInspectFile = async () => {
    if (!restoreFile) {
      setRestoreError('Pilih berkas cadangan (.sql.enc / .enc) terlebih dahulu.');
      return;
    }
    if (!restorePassword) {
      setRestoreError('Masukkan kata sandi dekripsi berkas.');
      return;
    }

    playClick();
    setRestoreError('');
    setIsInspecting(true);
    try {
      const inspected = await BackupService.inspectBackupFile(restoreFile, restorePassword);
      setInspectedData(inspected);
    } catch (err: any) {
      setRestoreError(err.message || 'Gagal memverifikasi berkas cadangan.');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!restoreFile || !restorePassword) return;
    playClick();
    setRestoreError('');
    setRestoreSuccessResult(null);
    setIsRestoring(true);

    try {
      const result = await BackupService.restoreDatabaseFromBackup(
        restoreFile,
        restorePassword,
        teacherName || teacherEmail,
        (msg, pct) => {
          setRestoreProgressText(msg);
          setRestoreProgressPercent(pct);
        },
        {
          remapIds,
          domainAdjustment: fromDomain && toDomain ? { fromDomain, toDomain } : undefined,
        }
      );
      setRestoreSuccessResult(result);
      setInspectedData(null);
      setRestoreFile(null);
      setRestorePassword('');
      loadHistory();
    } catch (err: any) {
      setRestoreError(err.message || 'Gagal memulihkan database.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRefreshCaptcha = () => {
    playClick();
    setWipeCaptchaCode(generateCaptchaCode());
    setWipeCaptchaInput('');
  };

  const handleExecuteWipe = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    setWipeError('');
    setIsWiping(true);
    try {
      await BackupService.wipeEntireDatabase(
        wipePassword,
        wipePhrase,
        wipeAgreed,
        teacherEmail,
        wipeCaptchaInput,
        wipeCaptchaCode
      );
      setWipeSuccess(true);
      setWipePassword('');
      setWipeCaptchaInput('');
      setWipeCaptchaCode(generateCaptchaCode());
      setWipePhrase('');
      setWipeAgreed(false);
      loadHistory();
    } catch (err: any) {
      setWipeError(err.message || 'Gagal membersihkan database.');
      setWipeCaptchaCode(generateCaptchaCode());
      setWipeCaptchaInput('');
    } finally {
      setIsWiping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Admin Database & Backup Terenkripsi
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  AES-256-GCM
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pencadangan lengkap (schema + data), verifikasi checksum SHA-256, dan pemulihan aman.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup Panel Database"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 bg-white dark:bg-slate-900 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('backup');
            }}
            className={`py-3 px-2.5 sm:px-3.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all min-h-[44px] flex-shrink-0 ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Pencadangan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('restore');
            }}
            className={`py-3 px-2.5 sm:px-3.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all min-h-[44px] flex-shrink-0 ${
              activeTab === 'restore'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Pemulihan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('integrity');
            }}
            className={`py-3 px-2.5 sm:px-3.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all min-h-[44px] flex-shrink-0 ${
              activeTab === 'integrity'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Uji Integritas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('danger');
            }}
            className={`py-3 px-2.5 sm:px-3.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all min-h-[44px] ml-auto flex-shrink-0 ${
              activeTab === 'danger'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-rose-500/80 hover:text-rose-600'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Zona Darurat</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Status & Jadwal Pencadangan (Rule 13) */}
          {(() => {
            const lastBackupTimestamp = history[0]?.created_at || (() => {
              try {
                return localStorage.getItem('kuis_sd_last_backup_timestamp');
              } catch {
                return null;
              }
            })();
            const daysElapsed = lastBackupTimestamp 
              ? Math.floor((Date.now() - new Date(lastBackupTimestamp).getTime()) / (1000 * 60 * 60 * 24))
              : null;
            const isOverdue = daysElapsed !== null && daysElapsed >= backupScheduleDays;

            return (
              <div className="p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isOverdue 
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isOverdue ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Status Jadwal Pencadangan
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isOverdue
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {isOverdue ? 'Jadwal Terlewat' : 'Sistem Terlindungi'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {lastBackupTimestamp ? (
                        <>Cadangan terakhir: <strong>{new Date(lastBackupTimestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</strong> ({daysElapsed === 0 ? 'hari ini' : `${daysElapsed} hari lalu`}).</>
                      ) : (
                        <>Belum pernah ada arsip cadangan yang tercatat.</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Jadwal:</span>
                  </label>
                  <select
                    value={backupScheduleDays}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setBackupScheduleDays(val);
                      try {
                        localStorage.setItem('kuis_sd_backup_schedule_days', String(val));
                      } catch {}
                    }}
                    className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 min-h-[44px] cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value={1}>Harian (1 Hari)</option>
                    <option value={7}>Mingguan (7 Hari)</option>
                    <option value={30}>Bulanan (30 Hari)</option>
                  </select>
                </div>
              </div>
            );
          })()}
          
          {/* TAB 1: BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
                  <strong className="block font-bold">Standar Enkripsi Enterprise (Rule 13)</strong>
                  <p>
                    Data kuis, butir soal, rekap ujian, dan sesi live akan diekspor dalam format SQL dump terenkripsi 
                    <strong> AES-256-GCM</strong> dengan kompresi <strong>GZIP Stream</strong> dan PBKDF2 (100.000 iterasi). Simpan kata sandi Anda dengan aman karena 
                    berkas tidak dapat dipulihkan jika kata sandi hilang.
                  </p>
                </div>
              </div>

              {exportError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{exportError}</span>
                </div>
              )}

              {exportSuccessInfo && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Pencadangan Berhasil Diunduh!</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono break-all bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <div><strong>Berkas:</strong> {exportSuccessInfo.fileName}</div>
                    <div><strong>Cakupan:</strong> {exportSuccessInfo.mode === 'INCREMENTAL' ? 'Inkremental (Delta)' : 'Penuh (Full Schema + Data)'}</div>
                    <div><strong>Ukuran:</strong> {(exportSuccessInfo.size / 1024).toFixed(1)} KB</div>
                    <div><strong>SHA-256:</strong> {exportSuccessInfo.checksum}</div>
                  </div>
                </div>
              )}

              {/* Form Input Password */}
              <form onSubmit={handleCreateBackup} className="space-y-4 bg-slate-50 dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-500" />
                    <span>Mode Cakupan Pencadangan (Rule 13)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setBackupMode('FULL');
                      }}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all min-h-[44px] ${
                        backupMode === 'FULL'
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        backupMode === 'FULL' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}>
                        <Database className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs">Pencadangan Penuh (Full)</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Ekspor skema DDL lengkap + seluruh baris data.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setBackupMode('INCREMENTAL');
                      }}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all min-h-[44px] ${
                        backupMode === 'INCREMENTAL'
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        backupMode === 'INCREMENTAL' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}>
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs">Pencadangan Inkremental (Delta)</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Hanya data baru/diubah sejak tanggal rujukan.
                        </div>
                      </div>
                    </button>
                  </div>

                  {backupMode === 'INCREMENTAL' && (
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-1.5 animate-fade-in">
                      <label className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Ambil Data Baru Sejak Tanggal:</span>
                      </label>
                      <input
                        type="date"
                        value={incrementalSince}
                        onChange={(e) => setIncrementalSince(e.target.value)}
                        className="w-full sm:w-64 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 min-h-[44px]"
                      />
                    </div>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  Kunci Enkripsi Cadangan Baru
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Kata Sandi Enkripsi (Min. 6 Karakter)
                    </label>
                    <div className="relative">
                      <input
                        type={showBackupPassword ? 'text' : 'password'}
                        value={backupPassword}
                        onChange={(e) => setBackupPassword(e.target.value)}
                        placeholder="Masukkan kata sandi..."
                        className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-blue-500 min-h-[44px]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowBackupPassword(!showBackupPassword)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        {showBackupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Ulangi Kata Sandi Enkripsi
                    </label>
                    <input
                      type={showBackupPassword ? 'text' : 'password'}
                      value={confirmBackupPassword}
                      onChange={(e) => setConfirmBackupPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-blue-500 min-h-[44px]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isExporting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm min-h-[44px] transition-colors disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengenkripsi & Mengunduh...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Buat & Unduh Cadangan Database (.sql.enc)</span>
                    </>
                  )}
                </button>
              </form>

              {/* History Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Catatan Riwayat Pencadangan ({history.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={loadHistory}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5 min-h-[44px] px-2.5 py-1 -my-1 rounded-xl btn-press font-bold"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                    <span>Segarkan</span>
                  </button>

                </div>

                {history.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl text-center">
                    Belum ada riwayat pencadangan tercatat di database.
                  </p>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {history.map((h) => (
                      <div key={h.id} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-850/50">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                            <span>{h.backup_name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(h.created_at).toLocaleString('id-ID')} • Oleh: {h.created_by} • {(h.file_size_bytes / 1024).toFixed(1)} KB
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyChecksum(h.sha256_checksum)}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1.5 self-start sm:self-auto min-h-[44px]"
                          title="Salin SHA-256 Checksum"
                        >
                          {copiedChecksum === h.sha256_checksum ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>SHA: {h.sha256_checksum.slice(0, 10)}...</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RESTORE */}
          {activeTab === 'restore' && (
            <div className="space-y-6">
              <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <strong className="block font-bold">Prosedur Pemulihan Bertahap (Staged Upsert)</strong>
                  <p>
                    Data dari berkas cadangan akan divalidasi checksum SHA-256 sebelum ditransaksikan ke database. 
                    Jika kuis atau sesi dengan ID sama telah ada, data akan diperbarui secara presisi tanpa merusak relasi.
                  </p>
                </div>
              </div>

              {restoreError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{restoreError}</span>
                </div>
              )}

              {restoreSuccessResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Pemulihan Database Sukses 100%!</span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                      <div className="text-lg font-black text-blue-600">{restoreSuccessResult.restoredQuizzes}</div>
                      <div className="text-[10px] text-slate-400">Koleksi Kuis</div>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                      <div className="text-lg font-black text-indigo-600">{restoreSuccessResult.restoredQuestions}</div>
                      <div className="text-[10px] text-slate-400">Pertanyaan</div>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                      <div className="text-lg font-black text-amber-600">{restoreSuccessResult.restoredSessions}</div>
                      <div className="text-[10px] text-slate-400">Sesi Live</div>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                      <div className="text-lg font-black text-emerald-600">{restoreSuccessResult.restoredAttempts}</div>
                      <div className="text-[10px] text-slate-400">Rekap Nilai</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Box */}
              <div className="space-y-4 bg-slate-50 dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pilih Berkas Cadangan (.sql.enc / .enc)
                  </label>
                  <input
                    type="file"
                    accept=".enc,.sql.enc,.json"
                    onChange={(e) => {
                      setRestoreFile(e.target.files?.[0] || null);
                      setInspectedData(null);
                    }}
                    className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kata Sandi Dekripsi Berkas
                  </label>
                  <div className="relative">
                    <input
                      type={showRestorePassword ? 'text' : 'password'}
                      value={restorePassword}
                      onChange={(e) => {
                        setRestorePassword(e.target.value);
                        setInspectedData(null);
                      }}
                      placeholder="Masukkan kata sandi saat berkas dicadangkan..."
                      className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-blue-500 min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRestorePassword(!showRestorePassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      {showRestorePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!inspectedData ? (
                  <button
                    type="button"
                    onClick={handleInspectFile}
                    disabled={isInspecting || !restoreFile || !restorePassword}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 min-h-[44px] transition-colors disabled:opacity-50"
                  >
                    {isInspecting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mendekripsi & Memeriksa SHA-256...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Verifikasi & Pratinjau Cadangan</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-4 pt-2">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 flex-wrap">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Berkas Valid & Terverifikasi (v{inspectedData.packageInfo.appVersion})</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold border border-blue-200 dark:border-blue-800">
                          {inspectedData.packageInfo.compression === 'GZIP' ? 'GZIP Compressed' : 'Standard Payload'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                        <div>Waktu Ekspor: {new Date(inspectedData.packageInfo.createdAt).toLocaleString('id-ID')}</div>
                        <div>Total Kuis: {inspectedData.payload.summary.totalQuizzes} • Soal: {inspectedData.payload.summary.totalQuestions} • Sesi: {inspectedData.payload.summary.totalSessions}</div>
                        <div className="font-mono text-[10px] break-all">SHA-256: {inspectedData.packageInfo.checksumSha256}</div>
                      </div>
                    </div>

                    {/* Opsi Restorasi Lanjutan (Rule 13) */}
                    <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-500" />
                        <span>Opsi Pemulihan Lanjutan (Rule 13)</span>
                      </h5>

                      <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={remapIds}
                          onChange={(e) => setRemapIds(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            Acak Ulang UUID (Remap ID Baru)
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Menghasilkan UUID baru untuk kuis dan soal yang diimpor, sehingga tidak akan menimpa kuis yang sudah ada di database saat ini.
                          </p>
                        </div>
                      </label>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                        <div 
                          className="flex items-center justify-between cursor-pointer select-none min-h-[44px]"
                          onClick={() => {
                            playClick();
                            setShowDomainAdjustment(!showDomainAdjustment);
                          }}
                        >
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Penyesuaian Domain URL (Cross-Domain Restore)
                          </span>
                          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40">
                            {showDomainAdjustment ? 'Sembunyikan' : 'Konfigurasi (Opsional)'}
                          </span>
                        </div>

                        {showDomainAdjustment && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-fade-in">
                            <div>
                              <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Domain Asal (Dari):</label>
                              <input
                                type="text"
                                value={fromDomain}
                                onChange={(e) => setFromDomain(e.target.value)}
                                placeholder="https://domain-lama.com"
                                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs min-h-[44px]"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Domain Tujuan (Ke):</label>
                              <input
                                type="text"
                                value={toDomain}
                                onChange={(e) => setToDomain(e.target.value)}
                                placeholder="https://domain-baru.com"
                                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs min-h-[44px]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {isRestoring && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                          <span>{restoreProgressText}</span>
                          <span>{restoreProgressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full transition-all duration-300"
                            style={{ width: `${restoreProgressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExecuteRestore}
                        disabled={isRestoring}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-md min-h-[44px] transition-colors disabled:opacity-50"
                      >
                        {isRestoring ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Memulihkan Basis Data...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Mulai Pulihkan Database Sekarang</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setInspectedData(null)}
                        disabled={isRestoring}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold min-h-[44px]"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INTEGRITY SELF-TEST (RULE 13) */}
          {activeTab === 'integrity' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 flex items-start gap-3">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
                  <strong className="block font-bold">Diagnostik & Verifikasi Integritas Sub-Sistem Cadangan (Rule 13)</strong>
                  <p>
                    Uji mandiri komprehensif untuk memvalidasi engine enkripsi WebCrypto AES-256-GCM, kompresi native GZIP Stream, integritas digest SHA-256, keabsahan skema DDL SQL lengkap, serta simulasi pemulihan lintas domain secara aman di memori browser tanpa memodifikasi data riil.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Pengujian Otomatis Sub-Sistem
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Jalankan verifikasi untuk memastikan browser Anda 100% siap memproses pencadangan dan pemulihan data.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRunIntegrityTest}
                  disabled={isRunningIntegrityTest}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm min-h-[44px] transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {isRunningIntegrityTest ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sedang Menguji...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Jalankan Pengujian Mandiri Sekarang</span>
                    </>
                  )}
                </button>
              </div>

              {integrityTestResult && (
                <div className="space-y-4 animate-scale-up">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    integrityTestResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {integrityTestResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      )}
                      <div>
                        <div className="font-black text-xs sm:text-sm">
                          {integrityTestResult.success ? 'Seluruh Sub-Sistem Lolos Uji Integritas 100%' : 'Ditemukan Kendala pada Uji Sub-Sistem'}
                        </div>
                        <div className="text-[11px] opacity-80 mt-0.5">
                          {integrityTestResult.checks.filter(c => c.passed).length} dari {integrityTestResult.checks.length} modul pengujian valid.
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs font-black">{integrityTestResult.totalDurationMs} ms</div>
                      <div className="text-[10px] opacity-70">Total Latensi</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {integrityTestResult.checks.map((check) => (
                      <div
                        key={check.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            {check.title}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            check.passed
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}>
                            {check.passed ? 'PASSED' : 'FAILED'} ({check.durationMs}ms)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {check.details}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DANGER ZONE (WIPE) */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900 dark:text-rose-200 space-y-1">
                  <strong className="block font-bold text-sm">Zona Bahaya Kritis: Hapus Seluruh Database (Rule 13)</strong>
                  <p>
                    Tindakan ini akan menghapus seluruh sesi live, peserta, kuis buatan guru, dan riwayat nilai siswa secara permanen. 
                    Tindakan ini <strong>tidak dapat dibatalkan</strong> kecuali Anda memiliki arsip cadangan terenkripsi.
                  </p>
                </div>
              </div>

              {wipeError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{wipeError}</span>
                </div>
              )}

              {wipeSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Seluruh data berhasil dibersihkan dan dicatat ke audit log.</span>
                </div>
              )}

              <form onSubmit={handleExecuteWipe} className="space-y-4 bg-slate-50 dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Lapis 1: Masukkan Kata Sandi Akun Super-Admin
                  </label>
                  <input
                    type="password"
                    value={wipePassword}
                    onChange={(e) => setWipePassword(e.target.value)}
                    placeholder="Kata sandi akun Anda..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-rose-500 min-h-[44px]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Lapis 2: Masukkan Kode Keamanan Anti-Bot (CAPTCHA Rule 13)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="px-3.5 py-2 bg-slate-200 dark:bg-slate-750 rounded-xl border border-slate-300 dark:border-slate-600 tracking-[0.3em] font-mono text-base font-black text-rose-700 dark:text-rose-400 select-none shadow-inner line-through decoration-rose-500/40 decoration-2 flex items-center justify-center min-w-[90px]">
                      {wipeCaptchaCode}
                    </div>
                    <button
                      type="button"
                      onClick={handleRefreshCaptcha}
                      className="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                      title="Acak Ulang Kode CAPTCHA"
                      aria-label="Acak Ulang Kode CAPTCHA"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      maxLength={5}
                      value={wipeCaptchaInput}
                      onChange={(e) => setWipeCaptchaInput(e.target.value.toUpperCase())}
                      placeholder="Ketik 5 digit kode di kiri..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-rose-500 min-h-[44px]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Lapis 3: Ketik Tepat Kalimat Konfirmasi: <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px] font-black text-rose-600">HAPUS SELURUH DATABASE KUIS SD SERU</code>
                  </label>
                  <input
                    type="text"
                    value={wipePhrase}
                    onChange={(e) => setWipePhrase(e.target.value)}
                    placeholder="Ketik persis kalimat di atas..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-rose-500 min-h-[44px]"
                    required
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="wipeAgreeCheck"
                    checked={wipeAgreed}
                    onChange={(e) => setWipeAgreed(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                    required
                  />
                  <label htmlFor="wipeAgreeCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    Lapis 4: Saya memahami sepenuhnya bahwa tindakan ini permanen dan menghapus seluruh database.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={
                    isWiping || 
                    !wipeAgreed || 
                    wipePhrase.trim() !== 'HAPUS SELURUH DATABASE KUIS SD SERU' ||
                    wipeCaptchaInput.trim().toUpperCase() !== wipeCaptchaCode.toUpperCase() ||
                    wipePassword.trim().length < 6
                  }
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md min-h-[44px] transition-colors disabled:opacity-40"
                >
                  {isWiping ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menghapus Database...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Eksekusi Pembersihan Database</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
