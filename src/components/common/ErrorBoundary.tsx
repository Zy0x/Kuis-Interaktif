import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearNavigationState } from '../../lib/navigationState';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary menangkap galat render:', error, errorInfo);
  }

  private handleGoHome = () => {
    clearNavigationState();
    try {
      window.location.href = window.location.origin + window.location.pathname;
    } catch {
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-5 animate-scale-in">
            {/* Visual Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/80 flex items-center justify-center text-3xl shadow-xs">
              ⚡
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                Terjadi Kendala Memuat Halaman
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Aplikasi mengalami kendala teknis saat memuat komponen ini. Jangan khawatir, progres dan sesi belajarmu tetap aman.
              </p>
            </div>

            {/* Action Buttons (Touch-first >= 44px per Rule 1) */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-98 transition-all min-h-[46px] flex items-center justify-center"
              >
                Segarkan Halaman
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 active:scale-98 transition-all min-h-[46px] flex items-center justify-center"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
