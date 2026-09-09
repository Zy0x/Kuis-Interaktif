import React from 'react';
import type { Quiz } from '../../types/quiz';
import { Printer, ArrowLeft, CheckCircle } from 'lucide-react';

interface WorksheetPrintViewProps {
  quiz: Quiz;
  onBack: () => void;
  playClick: () => void;
}

export const WorksheetPrintView: React.FC<WorksheetPrintViewProps> = ({
  quiz,
  onBack,
  playClick,
}) => {
  const handlePrint = () => {
    playClick();
    window.print();
  };

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center">
      
      {/* Non-Printable Top Bar */}
      <header className="print:hidden w-full bg-white border-b border-slate-200 px-4 sm:px-8 py-3 sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <button
          onClick={() => {
            playClick();
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </button>

        <div className="text-center hidden sm:block">
          <h2 className="text-sm font-bold text-slate-900">Format Cetak Lembar Kerja Siswa (A4)</h2>
          <p className="text-xs text-slate-500">Siap dicetak atau disimpan sebagai PDF</p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md min-h-[44px] btn-press"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak / Simpan PDF</span>
        </button>
      </header>

      {/* Printable Sheet Wrapper (A4 Styling) */}
      <main className="w-full max-w-[800px] my-6 print:my-0 print:w-full bg-white p-8 sm:p-12 shadow-lg print:shadow-none border print:border-none border-slate-200 rounded-2xl print:rounded-none">
        
        {/* LKS Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                LEMBAR KERJA SISWA (LKS) SEKOLAH DASAR
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {quiz.title}
              </h1>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Mata Pelajaran: <strong>{quiz.subject}</strong> | Tingkat: <strong>Kelas {quiz.grade} SD</strong>
              </p>
            </div>

            {/* Score Box */}
            <div className="border-2 border-slate-800 rounded-lg p-2 w-24 text-center flex-shrink-0">
              <span className="text-[10px] font-bold uppercase text-slate-600 block">Nilai</span>
              <div className="h-10 flex items-center justify-center font-bold text-lg text-slate-400">
                / 100
              </div>
            </div>
          </div>

          {/* Student Identity Form Fields */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 text-xs font-medium text-slate-700">
            <div className="space-y-1.5">
              <div>Nama Siswa : ..............................................................</div>
              <div>No. Absen  : ..............................................................</div>
            </div>
            <div className="space-y-1.5">
              <div>Hari / Tgl : ..............................................................</div>
              <div>Paraf Guru : ..............................................................</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 mb-6 space-y-1">
          <p className="font-bold text-slate-900">Petunjuk Pengerjaan:</p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-600">
            <li>Tuliskan nama lengkap dan nomor absen pada kolom yang tersedia.</li>
            <li>Bacalah setiap soal dengan teliti sebelum menentukan jawaban.</li>
            <li>Berikan tanda silang (X) atau bulatkan pada huruf opsi A, B, C, atau D yang kamu anggap paling benar.</li>
          </ul>
        </div>

        {/* Question Items */}
        <div className="space-y-6">
          {quiz.questions.map((q, qIndex) => (
            <div key={q.id} className="space-y-2.5 break-inside-avoid">
              <div className="flex items-start gap-2 text-sm text-slate-900 font-semibold leading-snug">
                <span className="font-bold flex-shrink-0">{qIndex + 1}.</span>
                <span className="flex-1">{q.text}</span>
              </div>

              {/* Optional Question Image / Emoji illustration */}
              {q.imageUrl && (
                <div className="ml-5 my-2 max-w-[200px] border border-slate-300 rounded p-1">
                  <img src={q.imageUrl} alt="Ilustrasi" className="max-h-28 w-auto mx-auto object-contain" />
                </div>
              )}
              {q.imageCaption && (
                <div className="ml-5 text-2xl my-1 select-none">
                  {q.imageCaption}
                </div>
              )}

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-5 text-xs text-slate-800">
                {q.options.map((opt, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center font-bold text-[10px] text-slate-700 flex-shrink-0">
                      {letters[optIndex]}
                    </span>
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Teacher Answer Key (Page break for print) */}
        <div className="mt-12 pt-6 border-t-2 border-dashed border-slate-300 break-before-page">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Kunci Jawaban & Pembahasan (Khusus Guru)</span>
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">
            Bagian ini dapat disimpan atau dipisahkan oleh guru saat membagikan lembar kerja.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {quiz.questions.map((q, idx) => (
              <div key={q.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Nomor {idx + 1}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold">
                    {letters[q.correctIndex]} ({q.options[q.correctIndex]})
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {q.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};
