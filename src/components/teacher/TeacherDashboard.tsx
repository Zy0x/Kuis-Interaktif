import React, { useState, useEffect } from 'react';
import type { Quiz, TeacherProfile, StudentSubmission } from '../../types/quiz';
import { DataManager } from '../../lib/supabaseClient';
import { useBackHandler } from '../../lib/navigationHistory';
import { 
  GraduationCap, 
  Plus, 
  Printer, 
  Tv, 
  Copy, 
  Check, 
  Download, 
  Zap, 
  BookOpen, 
  Users, 
  Sparkles, 
  LogOut, 
  ArrowLeft,
  Share2
} from 'lucide-react';

interface TeacherDashboardProps {
  teacher: TeacherProfile;
  onLogout: () => void;
  onGoHome: () => void;
  onOpenCreator: () => void;
  onLaunchSmartboard: (quiz: Quiz) => void;
  onPrintWorksheet: (quiz: Quiz) => void;
  playClick: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  teacher,
  onLogout,
  onGoHome,
  onOpenCreator,
  onLaunchSmartboard,
  onPrintWorksheet,
  playClick,
}) => {
  const [activeTab, setActiveTab] = useState<'quizzes' | 'submissions' | 'generator'>('quizzes');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Generator state
  const [genGrade, setGenGrade] = useState<number>(3);
  const [genCount, setGenCount] = useState<number>(5);
  const [genLoading, setGenLoading] = useState(false);

  // 1. Level 2 (Prioritas 50): Jika berada di tab Submissions / Generator, mundur ke Tab Kuis
  useBackHandler('teacher-tab-back', 50, () => {
    if (activeTab !== 'quizzes') {
      setActiveTab('quizzes');
      return true;
    }
    return false;
  }, activeTab !== 'quizzes');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const all = DataManager.getAllQuizzes();
    setQuizzes(all);
    const subs = await DataManager.getTeacherSubmissions();
    setSubmissions(subs);
  };

  const handleCopyPin = (pin: string) => {
    playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pin);
      setCopiedPin(pin);
      setTimeout(() => setCopiedPin(null), 2000);
    }
  };

  const handleCopyLink = (quiz: Quiz) => {
    playClick();
    const url = `${window.location.origin}${window.location.pathname}?pin=${quiz.pinCode || '1001'}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(quiz.id);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    playClick();
    if (window.confirm('Yakin ingin menghapus kuis ini?')) {
      await DataManager.deleteCustomQuiz(quizId);
      loadData();
    }
  };

  const handleRunGenerator = async () => {
    playClick();
    setGenLoading(true);
    try {
      const generated = DataManager.generateQuickMathQuiz(genGrade, genCount);
      generated.creatorName = teacher.fullName;
      await DataManager.saveCustomQuiz(generated);
      await loadData();
      setActiveTab('quizzes');
    } finally {
      setGenLoading(false);
    }
  };

  const handleExportCSV = () => {
    playClick();
    if (submissions.length === 0) {
      alert('Belum ada data pengerjaan siswa untuk diekspor.');
      return;
    }

    const headers = ['Nama Siswa', 'Kuis', 'Nilai', 'Bintang', 'Benar', 'Total Soal', 'Waktu (detik)', 'Waktu Selesai'];
    const rows = submissions.map((s) => [
      `"${s.studentName}"`,
      `"${s.quizTitle}"`,
      s.score,
      s.stars,
      s.correctCount,
      s.totalCount,
      s.timeSpentSec,
      `"${s.submittedAt}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Nilai_KuisSD_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 flex flex-col">
      {/* Top Navbar */}
      <header className="w-full bg-white border-b border-slate-200/90 px-4 sm:px-8 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playClick();
                onGoHome();
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight flex items-center gap-1.5">
                  <span>Dashboard Guru</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Pro
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {teacher.fullName} • {teacher.schoolName || 'SD Indonesia'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playClick();
                onOpenCreator();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm min-h-[44px] shadow-sm transition-colors btn-press"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Buat Kuis Baru</span>
              <span className="sm:hidden">Buat</span>
            </button>

            <button
              onClick={() => {
                playClick();
                onLogout();
              }}
              className="p-2.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              title="Keluar Akun Guru"
              aria-label="Keluar Akun Guru"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 pt-6 space-y-6 flex-1">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-hover">
          <button
            onClick={() => {
              playClick();
              setActiveTab('quizzes');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] whitespace-nowrap ${
              activeTab === 'quizzes'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bank Kuis & PIN Kelas ({quizzes.length})</span>
          </button>

          <button
            onClick={() => {
              playClick();
              setActiveTab('submissions');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] whitespace-nowrap ${
              activeTab === 'submissions'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Rekap Nilai Siswa ({submissions.length})</span>
          </button>

          <button
            onClick={() => {
              playClick();
              setActiveTab('generator');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] whitespace-nowrap ${
              activeTab === 'generator'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Generator Kilat Soal</span>
          </button>
        </div>

        {/* TAB 1: BANK KUIS & PIN KELAS */}
        {activeTab === 'quizzes' && (
          <section className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">Koleksi Kuis Aktif</h2>
                <p className="text-xs text-slate-500">
                  Bagikan 4 digit PIN kepada siswa atau buka di Smartboard / TV Interaktif ruang kelas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz) => {
                const isCustom = quiz.id.startsWith('custom_');
                return (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card flex flex-col justify-between hover:border-blue-300 transition-all space-y-4"
                  >
                    <div>
                      {/* Top Row: PIN & Mapel */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-blue-700">PIN:</span>
                          <span className="font-mono font-black text-sm text-blue-900 tracking-wider">
                            {quiz.pinCode || '1001'}
                          </span>
                          <button
                            onClick={() => handleCopyPin(quiz.pinCode || '1001')}
                            className="p-1 hover:text-blue-600 rounded transition-colors"
                            title="Salin PIN"
                          >
                            {copiedPin === (quiz.pinCode || '1001') ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </button>
                        </div>

                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          Kelas {quiz.grade}
                        </span>
                      </div>

                      {/* Title & Emoji */}
                      <div className="flex items-start gap-2.5">
                        <span className="text-2xl p-2 rounded-xl bg-slate-50 border border-slate-100 select-none flex-shrink-0">
                          {quiz.coverEmoji}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2">
                            {quiz.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {quiz.description || 'Kuis interaktif kelas SD'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span>{quiz.questions.length} Soal</span>
                      <span>{quiz.durationPerQuestionSec}s / soal</span>
                      <span>{quiz.subject}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-1">
                      {/* Smartboard IFP Launch Button */}
                      <button
                        onClick={() => {
                          playClick();
                          onLaunchSmartboard(quiz);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-2 min-h-[44px] btn-press transition-all"
                      >
                        <Tv className="w-4 h-4" />
                        <span>Buka Mode Smartboard (IFP)</span>
                      </button>

                      {/* Secondary Buttons Row */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleCopyLink(quiz)}
                          className="py-2 px-2.5 rounded-xl font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-1.5 min-h-[42px] transition-colors"
                        >
                          {copiedLink === quiz.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Bagi Tautan</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            playClick();
                            onPrintWorksheet(quiz);
                          }}
                          className="py-2 px-2.5 rounded-xl font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-1.5 min-h-[42px] transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak LKS</span>
                        </button>
                      </div>

                      {isCustom && (
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="w-full py-1.5 text-rose-500 hover:text-rose-700 text-[11px] font-medium transition-colors text-center"
                        >
                          Hapus Kuis Ini
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 2: REKAP NILAI SISWA */}
        {activeTab === 'submissions' && (
          <section className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">Rekap Nilai Siswa Real-Time</h2>
                <p className="text-xs text-slate-500">
                  Data hasil pengerjaan kuis siswa tersimpan otomatis ke database.
                </p>
              </div>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 min-h-[44px] transition-colors btn-press self-start sm:self-auto"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Unduh Rekap (CSV/Excel)</span>
              </button>
            </div>

            {submissions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
                <div className="text-4xl mb-2">📋</div>
                <h3 className="font-bold text-slate-800 text-base">Belum Ada Hasil Kuis Siswa</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Bagikan PIN kuis kepada siswa di kelas. Saat siswa menyelesaikan kuis, nilainya akan otomatis muncul di sini.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card">
                <div className="overflow-x-auto scrollbar-hover">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-3.5">Nama Siswa</th>
                        <th className="p-3.5">Judul Kuis</th>
                        <th className="p-3.5 text-center">Nilai</th>
                        <th className="p-3.5 text-center">Bintang</th>
                        <th className="p-3.5 text-center">Akurasi</th>
                        <th className="p-3.5 text-center">Durasi</th>
                        <th className="p-3.5">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                            {sub.studentName}
                          </td>
                          <td className="p-3.5 text-slate-700 max-w-[200px] truncate">
                            {sub.quizTitle}
                          </td>
                          <td className="p-3.5 text-center font-black text-blue-600 text-base">
                            {sub.score}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className="text-amber-500 font-bold">
                              {'⭐'.repeat(sub.stars)}
                            </span>
                          </td>
                          <td className="p-3.5 text-center text-slate-600 font-medium">
                            {sub.correctCount} / {sub.totalCount}
                          </td>
                          <td className="p-3.5 text-center text-slate-500 font-medium">
                            {sub.timeSpentSec}s
                          </td>
                          <td className="p-3.5 text-slate-400 text-xs whitespace-nowrap">
                            {sub.submittedAt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB 3: GENERATOR KILAT SOAL */}
        {activeTab === 'generator' && (
          <section className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-2xl">
                ⚡
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Generator Kilat Soal Matematika
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Buat satu set latihan berhitung lengkap dengan opsi jawaban dan pembahasan langkah otomatis hanya dalam 1 detik.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Pilih Tingkat Kelas SD:
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        playClick();
                        setGenGrade(g);
                      }}
                      className={`py-3 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] ${
                        genGrade === g
                          ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                          : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Kelas {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Jumlah Soal:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[5, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => {
                        playClick();
                        setGenCount(cnt);
                      }}
                      className={`py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all min-h-[44px] ${
                        genCount === cnt
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cnt} Soal
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Spesifikasi Soal Kelas {genGrade}:
                </span>
                <p className="text-blue-800">
                  {genGrade <= 2
                    ? 'Penjumlahan dan pengurangan angka ramah anak dengan batas puluhan.'
                    : genGrade <= 4
                    ? 'Perkalian dan pembagian konsep dasar bilangan cacah.'
                    : 'Operasi campuran, persentase, dan perpangkatan kuadrat.'}
                </p>
              </div>

              <button
                type="button"
                disabled={genLoading}
                onClick={handleRunGenerator}
                className="w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 min-h-[50px] btn-press transition-all disabled:opacity-50"
              >
                <Zap className="w-5 h-5 text-amber-300" />
                <span>{genLoading ? 'Membuat Kuis...' : 'Generate & Simpan ke Bank Soal'}</span>
              </button>
            </div>
          </section>
        )}

      </main>
    </div>
  );
};
