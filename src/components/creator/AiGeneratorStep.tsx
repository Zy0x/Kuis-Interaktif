import React, { useState, useEffect, useMemo } from 'react';
import type { Subject, QuizQuestion } from '../../types/quiz';
import { 
  generateHybridQuizQuestions, 
  checkSupabaseAiStatus,
  getSupabaseAiStatusSync,
  type AiProvider,
  type SupabaseAiStatus
} from '../../lib/geminiApi';
import { 
  parseRawQuestionsText, 
  generateAiPrompt, 
  getQuestionCsvTemplate, 
  type ParsedQuestionItem 
} from '../../lib/aiQuestionParser';
import { 
  Sparkles, 
  Zap, 
  ArrowLeft, 
  ArrowRight,
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Cloud,
  Download,
  UploadCloud,
  Copy,
  Check,
  Shuffle,
  Info,
  Eye
} from 'lucide-react';

interface AiGeneratorStepProps {
  onGenerated: (data: {
    questions: QuizQuestion[];
    topic: string;
    subject: Subject;
    grade: number;
    questionCount: number;
    coverEmoji: string;
    badgeTitle: string;
  }) => void;
  onBack: () => void;
  playClick: () => void;
  initialSubject?: Subject;
  initialGrade?: number;
}

const EMOJI_BY_SUBJECT: Record<Subject, string> = {
  'Matematika': '📐',
  'IPA': '🌱',
  'Bahasa Indonesia': '📚',
  'Pendidikan Pancasila': '🇮🇩',
  'Pengetahuan Umum': '💡'
};

interface TopicRecommendation {
  topic: string;
  context: string;
}

const SMART_TOPICS_BY_SUBJECT_AND_GRADE: Record<Subject, Record<number, TopicRecommendation[]>> = {
  'IPA': {
    1: [
      { topic: 'Bagian Tubuh dan Panca Indra', context: 'Kenalkan fungsi mata, hidung, telinga, lidah, dan kulit dengan bahasa ramah anak kelas 1.' },
      { topic: 'Benda Hidup dan Benda Tak Hidup', context: 'Bedakan ciri tanaman, hewan, mainan, dan batu di sekitar rumah dan sekolah.' },
      { topic: 'Merawat Kebersihan Diri', context: 'Kebiasaan mencuci tangan, menggosok gigi, dan mandi teratur setiap hari.' }
    ],
    2: [
      { topic: 'Pertumbuhan Hewan dan Tumbuhan', context: 'Perkembangan anak ayam, kupu-kupu, dan biji kacang hijau menjadi kecambah.' },
      { topic: 'Tempat Hidup Hewan dan Tumbuhan', context: 'Habitat darat, air tawar, dan laut dengan contoh hewan di lingkungan sekitar.' },
      { topic: 'Mengenal Wujud Benda Padat dan Cair', context: 'Sifat bentuk air, minyak, batu, dan kayu dalam wadah yang berbeda.' }
    ],
    3: [
      { topic: 'Ciri-Ciri dan Kebutuhan Makhluk Hidup', context: 'Fokus pada bernapas, makan, tumbuh, peka rangsang, dan berkembang biak.' },
      { topic: 'Perubahan Wujud Benda', context: 'Membeku, mencair, menguap, dan mengembun dalam kehidupan sehari-hari.' },
      { topic: 'Cuaca dan Musim di Indonesia', context: 'Cuaca cerah, berawan, hujan, serta ciri musim hujan dan kemarau.' }
    ],
    4: [
      { topic: 'Bagian Tubuh Tumbuhan dan Fungsinya', context: 'Akar, batang, daun (fotosintesis), bunga, dan buah dengan contoh tanaman lokal.' },
      { topic: 'Metamorfosis Hewan Sempurna & Tak Sempurna', context: 'Bandingkan daur hidup kupu-kupu/katak dengan belalang/kecoak.' },
      { topic: 'Wujud Zat dan Perubahannya (Menyublim & Mengkristal)', context: 'Eksperimen kapur barus dan uap iodin secara kontekstual.' },
      { topic: 'Gaya dan Pengaruhnya terhadap Benda', context: 'Gaya otot, gesek, gravitasi, magnet, dan pegas saat menggerakkan benda.' }
    ],
    5: [
      { topic: 'Sistem Pernapasan Manusia dan Hewan', context: 'Organ hidung, tenggorokan, bronkus, alveolus, serta pernapasan ikan dan serangga.' },
      { topic: 'Sistem Pencernaan Makanan pada Manusia', context: 'Mulut, kerongkongan, lambung, usus halus, usus besar, dan pola makan sehat.' },
      { topic: 'Rantai Makanan dan Jaring-Jaring Kehidupan', context: 'Produsen, konsumen I-III, dan pengurai dalam ekosistem sawah dan hutan.' },
      { topic: 'Siklus Air dan Pentingnya Menjaga Air Bersih', context: 'Evaporasi, kondensasi, presipitasi, dan infiltrasi dalam siklus hidrologi.' }
    ],
    6: [
      { topic: 'Perkembangbiakan Generatif & Vegetatif Tumbuhan', context: 'Penyerbukan bunga, cangkok, setek, tunas, dan umbi lapis pada tanaman budidaya.' },
      { topic: 'Ciri Khusus Hewan dan Tumbuhan (Adaptasi)', context: 'Unta di gurun, kelelawar ekolokasi, kaktus dengan duri, dan kantong semar.' },
      { topic: 'Rangkaian Listrik Seri dan Paralel', context: 'Kelebihan dan kelemahan rangkaian seri-paralel lampu rumah tangga.' },
      { topic: 'Sistem Tata Surya dan Karakteristik Planet', context: 'Matahari, 8 planet, rotasi dan revolusi bumi serta dampaknya terhadap gerhana.' }
    ]
  },
  'Matematika': {
    1: [
      { topic: 'Penjumlahan dan Pengurangan Bilangan sampai 20', context: 'Menghitung banyak buah dan mainan dengan benda konkret.' },
      { topic: 'Mengenal Bangun Datar Sederhana', context: 'Segitiga, persegi, persegi panjang, dan lingkaran di kelas.' },
      { topic: 'Membandingkan Panjang dan Berat Benda', context: 'Konsep lebih panjang, lebih pendek, lebih berat, dan lebih ringan.' }
    ],
    2: [
      { topic: 'Penjumlahan dan Pengurangan Bersusun sampai 100', context: 'Teknik menyimpan dan meminjam pada hitung belanja sederhana.' },
      { topic: 'Mengenal Konsep Perkalian Dasar', context: 'Perkalian sebagai penjumlahan berulang (misal 3 x 4 = 4+4+4).' },
      { topic: 'Pecahan Sederhana Setengah dan Seperempat', context: 'Membagi kue dan buah apel secara adil dengan pecahan 1/2 dan 1/4.' }
    ],
    3: [
      { topic: 'Operasi Perkalian dan Pembagian Bilangan Cacah', context: 'Tabel perkalian 1-10 dan pembagian sebagai pengurangan berulang sampai habis.' },
      { topic: 'Pecahan Biasa pada Garis Bilangan', context: 'Menentukan letak pecahan 1/2, 1/3, 1/4, dan membandingkan nilainya.' },
      { topic: 'Keliling Bangun Datar Persegi dan Persegi Panjang', context: 'Menghitung keliling meja, buku, dan lapangan sekolah dengan satuan cm.' }
    ],
    4: [
      { topic: 'Pecahan Senilai dan Operasi Penjumlahan Pecahan', context: 'Pecahan biasa dan desimal persepuluhan berpenyebut sama dan berbeda.' },
      { topic: 'KPK dan FPB Dua Bilangan', context: 'Faktorisasi prima untuk menentukan jadwal les bersama dan pembagian paket hadiah.' },
      { topic: 'Luas Bangun Datar Persegi, Panjang, dan Segitiga', context: 'Rumus luas dan penerapan pada petak ubin lantai dan kebun.' }
    ],
    5: [
      { topic: 'Operasi Hitung Pecahan Biasa, Campuran, dan Desimal', context: 'Penjumlahan, pengurangan, perkalian pecahan serta konversi ke persen.' },
      { topic: 'Kecepatan, Jarak, dan Waktu Tempuh', context: 'Rumus v = s/t pada perjalanan kendaraan dan konversi satuan waktu.' },
      { topic: 'Volume Bangun Ruang Kubus dan Balok', context: 'Menghitung volume akuarium dan kardus dengan kubus satuan dan rumus.' }
    ],
    6: [
      { topic: 'Operasi Hitung Campuran Bilangan Bulat Positif & Negatif', context: 'Garis bilangan, suhu di bawah nol, dan urutan pengerjaan kurung-kali-bagi-tambah-kurang.' },
      { topic: 'Unsur-Unsur Lingkaran, Keliling, dan Luas', context: 'Jari-jari, diameter, juring, busur, serta keliling dan luas roda sepeda.' },
      { topic: 'Volume Tabung, Kerucut, dan Prisma', context: 'Penerapan rumus bangun ruang sisi lengkung pada kaleng dan tumpeng.' },
      { topic: 'Pengolahan Data: Mean, Median, dan Modus', context: 'Mencari nilai rata-rata ulangan, nilai tengah, dan data paling sering muncul.' }
    ]
  },
  'Bahasa Indonesia': {
    1: [
      { topic: 'Mengenal Huruf Vokal dan Huruf Konsonan', context: 'Membaca suku kata berpola terbuka ba-bi-bu-be-bo dan kata benda sehari-hari.' },
      { topic: 'Kalimat Sapaan dan Ungkapan Terima Kasih', context: 'Ungkapan tolong, maaf, dan permisi kepada orang tua dan guru.' }
    ],
    2: [
      { topic: 'Tanda Baca Titik dan Huruf Kapital', context: 'Penggunaan huruf besar pada awal kalimat, nama orang, dan nama hari.' },
      { topic: 'Membaca Teks Pendek dan Menjawab 5W1H Sederhana', context: 'Menemukan siapa, di mana, dan apa yang terjadi dalam dongeng fabel.' }
    ],
    3: [
      { topic: 'Ide Pokok Paragraf dan Informasi Tersurat', context: 'Menemukan gagasan utama dalam bacaan cerita anak dan artikel edukasi.' },
      { topic: 'Dongeng dan Pesan Moral Tokoh', context: 'Watak tokoh protagonis-antagonis dan amanat cerita rakyat nusantara.' }
    ],
    4: [
      { topic: 'Teks Petunjuk Pembuatan dan Penggunaan Alat', context: 'Urutan langkah-langkah kerja sistematis dengan kata kerja imperatif.' },
      { topic: 'Wawancara Sederhana dengan Narasumber', context: 'Merancang daftar pertanyaan apa, siapa, di mana, kapan, mengapa, dan bagaimana.' }
    ],
    5: [
      { topic: 'Teks Eksplanasi Fenomena Alam dan Sosial', context: 'Struktur pernyataan umum, deretan penjelas kausalitas, dan kesimpulan.' },
      { topic: 'Iklan Media Cetak dan Elektronik', context: 'Kata kunci persuasif, sasaran konsumen, dan keunggulan produk edukatif.' }
    ],
    6: [
      { topic: 'Teks Pidato Persuasif dan Kerangkanya', context: 'Salam pembuka, pendahuluan, isi imbauan, penutup, dan pesan ajakan positif.' },
      { topic: 'Unsur Intrinsik Cerita Pendek dan Novel Anak', context: 'Tema, alur maju-mundur, sudut pandang pengarang, dan latar suasana.' }
    ]
  },
  'Pendidikan Pancasila': {
    1: [
      { topic: 'Simbol Sila-Sila Pancasila dalam Burung Garuda', context: 'Bintang, rantai, pohon beringin, kepala banteng, serta padi dan kapas.' },
      { topic: 'Aturan di Rumah dan di Sekolah', context: 'Merapikan tempat tidur, tertib belajar di kelas, dan rukun bersama teman.' }
    ],
    2: [
      { topic: 'Pengamalan Sila Pertama dan Kedua Pancasila', context: 'Toleransi beribadah dan sikap tolong-menolong tanpa membeda-bedakan.' },
      { topic: 'Keberagaman Suku dan Budaya Indonesia', context: 'Bhinneka Tunggal Ika dengan contoh makanan dan pakaian adat nusantara.' }
    ],
    3: [
      { topic: 'Musyawarah untuk Mufakat di Lingkungan Sekolah', context: 'Pemilihan ketua kelas dan menghargai pendapat saat diskusi kelompok.' },
      { topic: 'Hak dan Kewajiban Anak di Rumah dan Sekolah', context: 'Mendapat kasih sayang, kewajiban belajar giat, dan menjaga kebersihan fasilitas.' }
    ],
    4: [
      { topic: 'Makna Simbol Garuda Pancasila dan Nilai-Nilainya', context: 'Arti jumlah bulu pada leher, sayap, ekor, serta semboyan Bhinneka Tunggal Ika.' },
      { topic: 'Norma dan Aturan dalam Kehidupan Bermasyarakat', context: 'Norma agama, kesusilaan, kesopanan, dan hukum di lingkungan sekitar.' }
    ],
    5: [
      { topic: 'Gotong Royong sebagai Ciri Khas Bangsa Indonesia', context: 'Tradisi kerja bakti, sambatan, dan manfaat persatuan bagi keutuhan NKRI.' },
      { topic: 'Keragaman Budaya Nusantara dan Cara Melestarikannya', context: 'Rumah adat, tarian tradisional, alat musik daerah, dan bangga memakai batik.' }
    ],
    6: [
      { topic: 'Penerapan Nilai-Nilai Pancasila dalam Kehidupan Sehari-Hari', context: 'Studi kasus integrasi sila 1 sampai 5 dalam tantangan era modern.' },
      { topic: 'Menjaga Persatuan dan Kesatuan Bangsa di Era Digital', context: 'Menghindari hoaks, saling menghormati di media sosial, dan toleransi beragama.' }
    ]
  },
  'Pengetahuan Umum': {
    1: [
      { topic: 'Profesi dan Cita-Cita Mulia', context: 'Dokter, guru, polisi, petani, masinis, dan peran mereka membantu masyarakat.' },
      { topic: 'Rambu Lalu Lintas dan Keselamatan di Jalan', context: 'Lampu merah-kuning-hijau, zebra cross, dan keselamatan trotoar.' }
    ],
    2: [
      { topic: 'Peta Sederhana dan Arah Mata Angin', context: 'Utara, timur, selatan, barat serta denah rumah menuju sekolah.' },
      { topic: 'Pahlawan Nasional Indonesia', context: 'Ki Hajar Dewantara, R.A. Kartini, Pangeran Diponegoro, dan jasa mereka.' }
    ],
    3: [
      { topic: 'Kenampakan Alam dan Kenampakan Buatan', context: 'Gunung, sungai, dan danau vs waduk, jembatan, dan jalan raya.' },
      { topic: 'Kegiatan Ekonomi: Produksi, Distribusi, Konsumsi', context: 'Petani menanam padi, pedagang menjual, dan pembeli mengonsumsi.' }
    ],
    4: [
      { topic: 'Kekayaan Alam Hayati dan Tambang Indonesia', context: 'Rempah-rempah, kayu hutan tropis, minyak bumi, dan batubara nusantara.' },
      { topic: 'Peninggalan Sejarah Candi Hindu dan Buddha', context: 'Candi Borobudur, Prambanan, Muara Takus, dan sejarah kerajaannya.' }
    ],
    5: [
      { topic: 'Letak Geografis dan Astronomis Indonesia', context: 'Posisi silang dua benua dan dua samudra serta iklim tropis khatulistiwa.' },
      { topic: 'Peristiwa Menjelang Proklamasi Kemerdekaan', context: 'Peristiwa Rengasdengklok, penyusunan naskah di rumah Tadashi Maeda, dan 17 Agustus 1945.' }
    ],
    6: [
      { topic: 'Organisasi ASEAN dan Peran Indonesia', context: 'Negara pendiri ASEAN, Deklarasi Bangkok, dan kerja sama pendidikan/sosial budaya.' },
      { topic: 'Globalisasi dan Dampaknya bagi Generasi Muda', context: 'Kemajuan teknologi komunikasi, transportasi, dan menjaga jati diri bangsa.' }
    ]
  }
};

type SubStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const AiGeneratorStep: React.FC<AiGeneratorStepProps> = ({
  onGenerated,
  onBack,
  playClick,
  initialSubject = 'IPA',
  initialGrade = 4,
}) => {
  // Wizard Sub-Step Navigation (1 s.d. 7)
  const [subStep, setSubStep] = useState<SubStepNumber>(1);

  // Step 1: Mata Pelajaran & Kelas
  const [subject, setSubject] = useState<Subject>(initialSubject);
  const [grade, setGrade] = useState<number>(initialGrade);

  // Step 2: Topik & Bahan Pertimbangan AI
  const [topic, setTopic] = useState('');
  const [contextNotes, setContextNotes] = useState('');
  const [randomSeed, setRandomSeed] = useState(0);

  // Step 3: Jumlah Soal, Format Proporsi & Gambar
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [customCountStr, setCustomCountStr] = useState<string>('5');
  const [proportionMode, setProportionMode] = useState<'balanced' | 'custom'>('balanced');
  const [proportions, setProportions] = useState<{
    multiple_choice: number;
    true_false: number;
    short_answer: number;
    matching_pairs: number;
  }>({
    multiple_choice: 3,
    true_false: 1,
    short_answer: 1,
    matching_pairs: 0,
  });
  const [includeAiImages, setIncludeAiImages] = useState<boolean>(false);

  // Step 4: Mesin Pembuat Soal
  const [selectedEngine, setSelectedEngine] = useState<AiProvider | 'local' | 'prompt'>('local');

  // Step 5: Teks Prompt & Unggah Berkas
  const [rawInputText, setRawInputText] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [inputMethodTab, setInputMethodTab] = useState<'paste' | 'file'>('paste');

  // Step 6: Hasil Parsing Inspektor
  const [parsedItems, setParsedItems] = useState<ParsedQuestionItem[]>([]);

  // Step 7: Kumpulan Soal Terakhir & Sumber Alur
  const [finalQuestions, setFinalQuestions] = useState<QuizQuestion[]>([]);
  const [flowSource, setFlowSource] = useState<'ai_direct' | 'prompt_flow'>('ai_direct');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Supabase Cloud AI Status (Rule 9 & 10)
  const [supabaseAi, setSupabaseAi] = useState<SupabaseAiStatus>(() => getSupabaseAiStatusSync());
  const [isCheckingCloudAi, setIsCheckingCloudAi] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    checkSupabaseAiStatus()
      .then((status) => {
        if (!isMounted) return;
        setSupabaseAi(status);
        if (status.hasGroq) {
          setSelectedEngine('groq');
        } else if (status.hasGemini) {
          setSelectedEngine('gemini');
        }
      })
      .catch((err) => {
        console.warn('Cek status Cloud AI notice:', err);
      })
      .finally(() => {
        if (isMounted) setIsCheckingCloudAi(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Saran Topik Cerdas Berdasarkan Mapel & Kelas
  const topicRecommendations = useMemo(() => {
    const bySubject = SMART_TOPICS_BY_SUBJECT_AND_GRADE[subject] || SMART_TOPICS_BY_SUBJECT_AND_GRADE['IPA'];
    const list = bySubject[grade] || bySubject[3] || [];
    if (randomSeed === 0) return list;
    return [...list].reverse();
  }, [subject, grade, randomSeed]);

  // Total Soal Terkalkulasi untuk Proporsi
  const currentTotalQuestions = parseInt(customCountStr) || questionCount || 5;
  const sumCustomProportions = 
    proportions.multiple_choice + 
    proportions.true_false + 
    proportions.short_answer + 
    proportions.matching_pairs;

  // Auto-balance helper saat beralih atau menambah jumlah
  const handleAutoDistributeProportions = (targetTotal: number) => {
    const mc = Math.max(1, Math.round(targetTotal * 0.5));
    const tf = Math.max(0, Math.round(targetTotal * 0.2));
    const sa = Math.max(0, Math.round(targetTotal * 0.2));
    const mp = Math.max(0, targetTotal - (mc + tf + sa));
    setProportions({
      multiple_choice: mc,
      true_false: tf,
      short_answer: sa,
      matching_pairs: mp,
    });
  };

  // Prompt Teks Ultra-Presisi untuk Step 5
  const generatedPromptText = useMemo(() => {
    return generateAiPrompt({
      subject,
      grade,
      topic: topic.trim() || 'Materi Pelajaran Tematik',
      count: currentTotalQuestions,
      questionType: proportionMode === 'balanced' ? 'campuran' : undefined,
      typeProportions: proportionMode === 'custom' ? proportions : undefined,
      contextNotes: contextNotes.trim() || undefined,
      includeImages: includeAiImages,
    });
  }, [subject, grade, topic, currentTotalQuestions, proportionMode, proportions, contextNotes, includeAiImages]);

  // Handler Salin Teks Prompt
  const handleCopyPrompt = async () => {
    playClick();
    try {
      await navigator.clipboard.writeText(generatedPromptText);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Handler Download Template CSV
  const handleDownloadCsvTemplate = () => {
    playClick();
    const csvContent = getQuestionCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Template_Bank_Soal_SD_${subject.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handler Unggah Berkas (CSV / JSON / TXT)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playClick();
    setErrorMessage(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setRawInputText(content);
        setInputMethodTab('paste');
      }
    };

    reader.onerror = () => {
      setErrorMessage('Gagal membaca berkas. Pastikan format berkas valid.');
    };

    reader.readAsText(file);
  };

  // Eksekusi AI Direct (Step 4 -> Step 7)
  const handleExecuteAiDirect = async () => {
    playClick();
    setErrorMessage(null);

    if (!topic.trim()) {
      setErrorMessage('Mohon lengkapi judul atau topik kuis terlebih dahulu.');
      setSubStep(2);
      return;
    }

    setIsLoading(true);

    try {
      const providerToUse: AiProvider = (selectedEngine === 'local' || selectedEngine === 'prompt') ? 'gemini' : selectedEngine;
      const result = await generateHybridQuizQuestions({
        topic: topic.trim(),
        subject,
        grade,
        count: currentTotalQuestions,
        questionType: 'campuran',
        provider: selectedEngine === 'local' ? undefined : providerToUse,
        includeAiImages,
      });

      if (!result.questions || result.questions.length === 0) {
        throw new Error('Tidak ada butir soal yang berhasil diracik. Silakan coba kembali.');
      }

      setFinalQuestions(result.questions);
      setFlowSource('ai_direct');
      setSubStep(7);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat meracik soal AI.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Eksekusi Verifikasi Prompt (Step 5 -> Step 6)
  const handleParseAndGoToPreview = () => {
    playClick();
    setErrorMessage(null);

    const trimmed = rawInputText.trim();
    if (!trimmed) {
      setErrorMessage('Mohon tempelkan teks hasil dari AI atau unggah berkas soal terlebih dahulu.');
      return;
    }

    try {
      const parsed = parseRawQuestionsText(trimmed);
      const validQuestions = parsed.filter((p) => p.valid);

      if (validQuestions.length === 0) {
        setErrorMessage('Format soal tidak dapat dikenali. Pastikan teks berisi pertanyaan, opsi pilihan, dan kunci jawaban.');
        return;
      }

      setParsedItems(parsed);
      setFinalQuestions(validQuestions.map((p) => p.question));
      setFlowSource('prompt_flow');
      setSubStep(6);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal mengurai teks soal.';
      setErrorMessage(msg);
    }
  };

  // Finalisasi Selesai di Step 7 -> Masuk ke Bank Soal
  const handleFinishToQuestionBank = () => {
    playClick();
    if (finalQuestions.length === 0) {
      setErrorMessage('Belum ada butir soal yang siap dimasukkan ke Bank Soal.');
      return;
    }

    onGenerated({
      questions: finalQuestions,
      topic: topic.trim() || `Kuis ${subject} Kelas ${grade}`,
      subject,
      grade,
      questionCount: finalQuestions.length,
      coverEmoji: EMOJI_BY_SUBJECT[subject] || '🌟',
      badgeTitle: 'Bintang Pintar',
    });
  };

  // Stepper Title Maps
  const STEP_TITLES: Record<SubStepNumber, { title: string; subtitle: string }> = {
    1: { title: 'Mata Pelajaran & Kelas SD', subtitle: 'Tentukan kurikulum dasar kuis interaktif yang akan dibuat' },
    2: { title: 'Topik & Bahan Pertimbangan AI', subtitle: 'Tuliskan materi pembelajaran dan konteks khusus yang diinginkan' },
    3: { title: 'Jumlah & Proporsi Format Soal', subtitle: 'Atur jumlah butir soal, pembagian format, dan ilustrasi gambar' },
    4: { title: 'Mesin Pembuat Soal', subtitle: 'Pilih mesin komputasi AI atau metode pembuatan prompt' },
    5: { title: 'Salin Prompt & Unggah Berkas', subtitle: 'Salin instruksi prompt ke AI eksternal atau tempel/unggah berkas soal' },
    6: { title: 'Inspektor Verifikasi Visual', subtitle: 'Periksa kelengkapan seluruh butir soal sebelum dikonfirmasi' },
    7: { title: 'Konfirmasi Spesifikasi Target Kuis', subtitle: 'Ringkasan akhir spesifikasi sebelum masuk ke editor Bank Soal' },
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 animate-fade-in">
      
      {/* Top Stepper Indicator */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                Langkah {subStep} dari 7
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline">
                • Generator AI Wizard
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white mt-1">
              {STEP_TITLES[subStep].title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {STEP_TITLES[subStep].subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              onBack();
            }}
            className="px-3 sm:px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shrink-0 min-h-[44px] btn-press"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Ganti Metode</span>
          </button>
        </div>

        {/* Progress Track */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
          <div 
            className="bg-blue-600 h-full transition-all duration-300 ease-out rounded-full"
            style={{ width: `${(subStep / 7) * 100}%` }}
          />
        </div>

        {/* Step Indicator Badges */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px] font-bold text-slate-400">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <div 
              key={num} 
              className={`flex items-center gap-1 shrink-0 ${
                subStep === num 
                  ? 'text-blue-600 dark:text-blue-400 font-extrabold' 
                  : subStep > num 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                subStep === num 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : subStep > num 
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-slate-100 dark:bg-slate-800'
              }`}>
                {subStep > num ? '✓' : num}
              </div>
              <span className="hidden md:inline">
                {num === 1 && 'Mapel'}
                {num === 2 && 'Topik'}
                {num === 3 && 'Format'}
                {num === 4 && 'Mesin'}
                {num === 5 && 'Prompt'}
                {num === 6 && 'Pratinjau'}
                {num === 7 && 'Konfirmasi'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Message Toast Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-3 text-xs sm:text-sm animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button 
            type="button" 
            onClick={() => setErrorMessage(null)} 
            className="text-rose-400 hover:text-rose-700 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-STEP 1: MATA PELAJARAN DAN TINGKAT KELAS SD */}
      {/* ========================================================================= */}
      {subStep === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          
          {/* Pilihan Mata Pelajaran */}
          <div>
            <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-2">
              Pilih Mata Pelajaran <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(['IPA', 'Matematika', 'Bahasa Indonesia', 'Pendidikan Pancasila', 'Pengetahuan Umum'] as Subject[]).map((subj) => (
                <button
                  key={subj}
                  type="button"
                  onClick={() => {
                    playClick();
                    setSubject(subj);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all min-h-[58px] flex items-center gap-3.5 btn-press ${
                    subject === subj
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-2xl">{EMOJI_BY_SUBJECT[subj]}</span>
                  <div className="min-w-0">
                    <span className="font-black text-sm block truncate">{subj}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                      Kurikulum Merdeka SD
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pilihan Tingkat Kelas SD (1 s.d. 6) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-2">
              Pilih Tingkat Kelas SD <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {[1, 2, 3, 4, 5, 6].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    playClick();
                    setGrade(g);
                  }}
                  className={`py-3.5 px-2 rounded-2xl font-black text-sm transition-all min-h-[52px] flex flex-col items-center justify-center gap-0.5 btn-press ${
                    grade === g
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-400/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                  }`}
                >
                  <span>Kelas {g}</span>
                  <span className="text-[10px] font-normal opacity-80">Sekolah Dasar</span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigasi Bawah */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                playClick();
                setSubStep(2);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 min-h-[48px] btn-press transition-all"
            >
              <span>Lanjut ke Topik Kuis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-STEP 2: TOPIK, BAHAN PERTIMBANGAN AI, & SARAN CERDAS */}
      {/* ========================================================================= */}
      {subStep === 2 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          
          {/* Tag Penanda Konteks */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs font-bold">
            <span>{EMOJI_BY_SUBJECT[subject]}</span>
            <span>{subject} • Kelas {grade} SD</span>
          </div>

          {/* Input Topik / Judul Kuis */}
          <div>
            <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-1.5">
              Topik atau Materi Pembahasan Kuis <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: Organ Pernapasan Manusia, Pecahan Senilai, Pengamalan Sila Pancasila..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 font-semibold text-sm focus:border-blue-500 focus:outline-none min-h-[48px]"
            />
          </div>

          {/* Saran Topik Cerdas Berdasarkan Mapel & Kelas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Rekomendasi Topik {subject} Kelas {grade} SD
              </span>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setRandomSeed((prev) => prev + 1);
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold min-h-[32px]"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Acak Ide Lain
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {topicRecommendations.map((rec) => (
                <button
                  key={rec.topic}
                  type="button"
                  onClick={() => {
                    playClick();
                    setTopic(rec.topic);
                    setContextNotes(rec.context);
                  }}
                  className={`text-xs px-3.5 py-2 rounded-xl border font-bold transition-all min-h-[40px] flex items-center gap-1.5 btn-press ${
                    topic === rec.topic
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>+ {rec.topic}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bahan Pertimbangan AI (Context Notes) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-1.5">
              Informasi Singkat / Bahan Pertimbangan AI <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              rows={3}
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
              placeholder="Contoh: Fokuskan pada fungsi organ paru-paru dan cara menjaga kesehatannya. Gunakan bahasa santai dan menyenangkan ramah anak..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              💡 Catatan ini akan dipertimbangkan AI agar hasil butir soal lebih kontekstual dan sesuai situasi belajar siswa Anda.
            </p>
          </div>

          {/* Navigasi Bawah */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                setSubStep(1);
              }}
              className="px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 min-h-[48px] flex items-center gap-1.5 btn-press transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                if (!topic.trim()) {
                  setErrorMessage('Mohon isi topik atau materi pembelajaran terlebih dahulu.');
                  return;
                }
                setErrorMessage(null);
                setSubStep(3);
              }}
              className="px-6 py-3 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 min-h-[48px] btn-press transition-all"
            >
              <span>Lanjut ke Format Soal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-STEP 3: JUMLAH SOAL, PROPORSI FORMAT, & GAMBAR */}
      {/* ========================================================================= */}
      {subStep === 3 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          
          {/* Pilihan Jumlah Soal */}
          <div>
            <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-2">
              Jumlah Butir Soal <span className="text-slate-400 font-normal">(1 s.d. 50 butir)</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {[5, 10, 15].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    playClick();
                    setQuestionCount(cnt);
                    setCustomCountStr(String(cnt));
                  }}
                  className={`flex-1 py-3 px-3 rounded-2xl font-black text-sm min-h-[48px] transition-all btn-press ${
                    questionCount === cnt && customCountStr === String(cnt)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                  }`}
                >
                  {cnt} Butir
                </button>
              ))}
              <div className="w-full sm:w-36">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={customCountStr}
                  onChange={(e) => {
                    setCustomCountStr(e.target.value);
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setQuestionCount(val);
                  }}
                  placeholder="Kustom"
                  className="w-full px-3 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm text-center min-h-[48px] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Mode Format Tipe Soal */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                Format Tipe Soal
              </label>

              {/* Mode Toggle */}
              <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setProportionMode('balanced');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                    proportionMode === 'balanced'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  ⚖️ Otomatis Seimbang
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setProportionMode('custom');
                    handleAutoDistributeProportions(currentTotalQuestions);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                    proportionMode === 'custom'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  🎛️ Kustom Proporsi
                </button>
              </div>
            </div>

            {proportionMode === 'balanced' ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  AI akan secara otomatis meracik kombinasi seimbang antara <strong>Pilihan Ganda</strong>, <strong>Benar/Salah</strong>, <strong>Isian Singkat</strong>, dan <strong>Menjodohkan</strong> sesuai karakteristik anak kelas {grade} SD.
                </span>
              </div>
            ) : (
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-bold text-slate-500">Tentukan Jumlah Per Tipe:</span>
                  <span className={`font-extrabold px-2.5 py-0.5 rounded-full ${
                    sumCustomProportions === currentTotalQuestions
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}>
                    Total: {sumCustomProportions} / {currentTotalQuestions} Butir
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Multiple Choice */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">Pilihan Ganda</span>
                      <span className="text-[10px] text-slate-400">4 opsi (A, B, C, D)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setProportions((p) => ({ ...p, multiple_choice: Math.max(0, p.multiple_choice - 1) }))}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center hover:bg-slate-200 btn-press"
                      >-</button>
                      <span className="w-6 text-center font-black text-sm text-slate-900 dark:text-white">{proportions.multiple_choice}</span>
                      <button
                        type="button"
                        onClick={() => setProportions((p) => ({ ...p, multiple_choice: p.multiple_choice + 1 }))}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center hover:bg-slate-200 btn-press"
                      >+</button>
                    </div>
                  </div>

                  {/* True / False */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">Benar / Salah</span>
                      <span className="text-[10px] text-slate-400">Analisis pernyataan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setProportions((p) => ({ ...p, true_false: Math.max(0, p.true_false - 1) }))}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center hover:bg-slate-200 btn-press"
                      >-</button>
                      <span className="w-6 text-center font-black text-sm text-slate-900 dark:text-white">{proportions.true_false}</span>
                      <button
                        type="button"
                        onClick={() => setProportions((p) => ({ ...p, true_false: p.true_false + 1 }))}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center hover:bg-slate-200 btn-press"
                      >+</button>
                    </div>
                  </div>

                  {/* Short Answer */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">Isian Singkat</span>
                      <span className="text-[10px] text-slate-400">Mengetik kata kunci</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setProportions((p) => ({ ...p, short_answer: Math.max(0, p.short_answer - 1) }))}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center hover:bg-slate-200 btn-press"
                      >-</button>
                      <span className="w-6 text-center font-black text-sm text-slate-900 dark:text-white">{proportions.short_answer}</span>
                      <button
                        type="button"
                        onClick={() => setProportions((p) => ({ ...p, short_answer: p.short_answer + 1 }))}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center hover:bg-slate-200 btn-press"
                      >+</button>
                    </div>
                  </div>

                  {/* Matching Pairs */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">Menjodohkan</span>
                      <span className="text-[10px] text-slate-400">Pasangan konsep</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setProportions((p) => ({ ...p, matching_pairs: Math.max(0, p.matching_pairs - 1) }))}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center hover:bg-slate-200 btn-press"
                      >-</button>
                      <span className="w-6 text-center font-black text-sm text-slate-900 dark:text-white">{proportions.matching_pairs}</span>
                      <button
                        type="button"
                        onClick={() => setProportions((p) => ({ ...p, matching_pairs: p.matching_pairs + 1 }))}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center hover:bg-slate-200 btn-press"
                      >+</button>
                    </div>
                  </div>
                </div>

                {sumCustomProportions !== currentTotalQuestions && (
                  <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    ⚠️ Total proporsi ({sumCustomProportions}) harus persis sama dengan jumlah butir terpilih ({currentTotalQuestions}).
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Kotak Include Gambar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 cursor-pointer min-h-[52px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-press">
              <input
                type="checkbox"
                checked={includeAiImages}
                onChange={(e) => setIncludeAiImages(e.target.checked)}
                className="w-5 h-5 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 shrink-0"
              />
              <div>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white block">
                  🎨 Sertakan Gambar Ilustrasi Edukasi AI
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Menyertakan deskripsi visual dan gambar edukasi relevan pada butir soal
                </span>
              </div>
            </label>
          </div>

          {/* Navigasi Bawah */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                setSubStep(2);
              }}
              className="px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 min-h-[48px] flex items-center gap-1.5 btn-press transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <button
              type="button"
              disabled={proportionMode === 'custom' && sumCustomProportions !== currentTotalQuestions}
              onClick={() => {
                playClick();
                setErrorMessage(null);
                setSubStep(4);
              }}
              className="px-6 py-3 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 min-h-[48px] btn-press transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Lanjut ke Mesin Pembuat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-STEP 4: MESIN PEMBUAT SOAL (LOKAL, GROQ, GEMINI, GENERATE PROMPT) */}
      {/* ========================================================================= */}
      {subStep === 4 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                Pilih Mesin Pembuat Soal
              </label>
              {isCheckingCloudAi && (
                <span className="text-[11px] text-blue-500 font-bold flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memeriksa Status Cloud...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Pilih salah satu dari 3 model langsung untuk meracik instan, atau pilih <strong>Generate Prompt</strong> jika ingin menggunakan AI eksternal atau berkas dokumen.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Option 1: Kurikulum SD Lokal */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedEngine('local');
                }}
                className={`p-4 rounded-2xl border text-left transition-all min-h-[82px] flex items-start gap-3.5 btn-press ${
                  selectedEngine === 'local'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                  🤖
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm">Kurikulum SD Lokal</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      Mandiri
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Pembuat soal cepat berbasis bank materi Kurikulum Merdeka lokal tanpa ketergantungan kuota API.
                  </p>
                </div>
              </button>

              {/* Option 2: Groq Cloud LPU */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedEngine('groq');
                }}
                className={`p-4 rounded-2xl border text-left transition-all min-h-[82px] flex items-start gap-3.5 btn-press ${
                  selectedEngine === 'groq'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 flex items-center justify-center shrink-0 font-bold">
                  ⚡
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-sm">Groq Cloud LPU</span>
                    {supabaseAi.hasGroq && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <Cloud className="w-3 h-3" /> Cloud Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Komputasi LPU super kilat (&lt;1 detik) dengan pemahaman silabus kurikulum akurat.
                  </p>
                </div>
              </button>

              {/* Option 3: Google Gemini AI */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedEngine('gemini');
                }}
                className={`p-4 rounded-2xl border text-left transition-all min-h-[82px] flex items-start gap-3.5 btn-press ${
                  selectedEngine === 'gemini'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 flex items-center justify-center shrink-0 font-bold">
                  ✨
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-sm">Google Gemini AI</span>
                    {supabaseAi.hasGemini && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <Cloud className="w-3 h-3" /> Cloud Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Penalaran edukatif mendalam, kaya variasi pertanyaan kontekstual ramah anak SD.
                  </p>
                </div>
              </button>

              {/* Option 4: Generate Prompt */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedEngine('prompt');
                }}
                className={`p-4 rounded-2xl border text-left transition-all min-h-[82px] flex items-start gap-3.5 btn-press ${
                  selectedEngine === 'prompt'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
                  📝
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm">Generate Prompt / Berkas</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      Fleksibel
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Gunakan ChatGPT / Claude, atau unggah tabel Excel/CSV/JSON/Teks dokumen kuis.
                  </p>
                </div>
              </button>

            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                playClick();
                setSubStep(3);
              }}
              className="px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 min-h-[48px] flex items-center gap-1.5 btn-press transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            {selectedEngine === 'prompt' ? (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setErrorMessage(null);
                  setSubStep(5);
                }}
                className="px-6 py-3 rounded-2xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md flex items-center gap-2 min-h-[48px] btn-press transition-all"
              >
                <span>Buka Generator Prompt (Langkah 5)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleExecuteAiDirect}
                className="px-8 py-3 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 min-h-[48px] btn-press transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sedang Meracik Soal...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>Buat Soal & Lanjut ke Langkah 7</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-STEP 5: SALIN PROMPT & UNGGAH BERKAS */}
      {/* ========================================================================= */}
      {subStep === 5 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          
          {/* Card 1: Kotak Prompt Siap Pakai */}
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                  1
                </span>
                <span className="font-extrabold text-xs sm:text-sm text-indigo-950 dark:text-indigo-200">
                  Teks Prompt Siap Pakai (Presisi & Anti AI Slop)
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs btn-press min-h-[38px]"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Teks Prompt</span>
                  </>
                )}
              </button>
            </div>

            {/* Readonly Prompt Box */}
            <div className="relative">
              <textarea
                readOnly
                rows={5}
                value={generatedPromptText}
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 text-[11px] sm:text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none select-all"
              />
            </div>

            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">
              💡 <strong>Tata Cara Singkat:</strong> Salin prompt di atas → tempel ke ChatGPT / Gemini / Claude → salin jawaban AI dan tempelkan pada kolom di bawah.
            </p>
          </div>

          {/* Card 2: Area Masukan (Tempel Teks atau Unggah Berkas) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                  2
                </span>
                <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Masukkan Hasil Soal atau Berkas
                </span>
              </div>

              {/* Sub-tab Switcher */}
              <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setInputMethodTab('paste');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all min-h-[34px] ${
                    inputMethodTab === 'paste'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  📝 Tempel Teks / JSON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setInputMethodTab('file');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all min-h-[34px] ${
                    inputMethodTab === 'file'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  📂 Unggah Berkas
                </button>
              </div>
            </div>

            {inputMethodTab === 'paste' ? (
              <div>
                <textarea
                  rows={8}
                  value={rawInputText}
                  onChange={(e) => setRawInputText(e.target.value)}
                  placeholder="Tempelkan teks respons JSON dari AI atau teks daftar soal bernomor (1. ... A. ... B. ... Kunci: ...) di sini..."
                  className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 font-mono text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Mendukung JSON Array otomatis maupun teks format baris bebas.</span>
                  <span>{rawInputText.length} karakter</span>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-center space-y-3">
                <UploadCloud className="w-10 h-10 text-blue-500 mx-auto" />
                <div>
                  <label className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs min-h-[44px] btn-press">
                    Pilih Berkas Soal (.xlsx, .csv, .json, .txt)
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.json,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-slate-400 mt-2">
                    Mendukung berkas spreadsheet CSV, Excel, dokumen teks, atau berkas JSON.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1.5 min-h-[36px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Contoh Format Template CSV/Excel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                setSubStep(4);
              }}
              className="px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 min-h-[48px] flex items-center gap-1.5 btn-press transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Mesin</span>
            </button>

            <button
              type="button"
              onClick={handleParseAndGoToPreview}
              className="px-6 py-3 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 min-h-[48px] btn-press transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>Periksa & Pratinjau Soal (Langkah 6)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-STEP 6: INSPEKTOR VERIFIKASI VISUAL (READ-ONLY) */}
      {/* ========================================================================= */}
      {subStep === 6 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          
          {/* Header Status Deteksi */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="font-extrabold text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 block">
                  {parsedItems.filter((p) => p.valid).length} Butir Soal Terdeteksi Sempurna
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block">
                  Seluruh pertanyaan, kunci jawaban, dan pembahasan telah diverifikasi siap pakai.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playClick();
                setSubStep(5);
              }}
              className="px-3.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 btn-press min-h-[38px]"
            >
              ✏️ Perbaiki Teks di Step 5
            </button>
          </div>

          {/* Notice Callout */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              💡 <strong>Catatan:</strong> Pengeditan mendalam (menambah, mengubah butir pertanyaan, atau mengganti gambar) dapat dilakukan dengan bebas pada <strong>Tab 2 (Bank Soal)</strong> nanti.
            </span>
          </div>

          {/* List Kartu Soal Pratinjau Read-Only */}
          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {finalQuestions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-slate-700 dark:text-slate-300">
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {q.type === 'multiple_choice' && 'Pilihan Ganda'}
                      {q.type === 'true_false' && 'Benar / Salah'}
                      {q.type === 'short_answer' && 'Isian Singkat'}
                      {q.type === 'matching_pairs' && 'Menjodohkan'}
                      {q.type === 'image_guess' && 'Tebak Gambar'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                    {q.points || 10} Poin
                  </span>
                </div>

                <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  {q.text}
                </p>

                {/* Display Opsi / Jawaban */}
                {q.type === 'multiple_choice' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                          oIdx === q.correctIndex
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-bold'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                        {oIdx === q.correctIndex && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'true_false' && (
                  <div className="flex items-center gap-2 pt-1">
                    {['Benar', 'Salah'].map((opt, oIdx) => (
                      <div
                        key={opt}
                        className={`flex-1 p-2 rounded-xl text-xs font-bold text-center ${
                          oIdx === q.correctIndex
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300'
                            : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {opt} {oIdx === q.correctIndex && '✓'}
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'short_answer' && (
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-slate-400 mr-2">Kunci Jawaban:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {q.acceptableAnswers?.join(' / ') || q.options[0] || '-'}
                    </span>
                  </div>
                )}

                {q.type === 'matching_pairs' && q.matchingPairs && (
                  <div className="space-y-1 pt-1 text-xs">
                    {q.matchingPairs.map((p, pIdx) => (
                      <div key={pIdx} className="p-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{p.left}</span>
                        <span className="text-slate-400 font-bold">➔</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{p.right}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800 flex items-start gap-1.5">
                    <span>💡</span>
                    <span>{q.explanation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                setSubStep(5);
              }}
              className="px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 min-h-[48px] flex items-center gap-1.5 btn-press transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Step 5</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                setSubStep(7);
              }}
              className="px-6 py-3 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 min-h-[48px] btn-press transition-all"
            >
              <span>Lanjut ke Konfirmasi (Langkah 7)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-STEP 7: KONFIRMASI SPESIFIKASI TARGET KUIS (READ-ONLY) */}
      {/* ========================================================================= */}
      {subStep === 7 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          
          <div className="text-center space-y-1 pb-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-2xl mb-2 shadow-xs">
              {EMOJI_BY_SUBJECT[subject]}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Konfirmasi Spesifikasi Kuis
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Periksa ringkasan konfigurasi kuis Anda di bawah sebelum melangkah ke Bank Soal.
            </p>
          </div>

          {/* Clean Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm space-y-3">
            
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Mata Pelajaran & Kelas</span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {subject} • Kelas {grade} SD
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Topik / Materi Kuis</span>
              <span className="font-bold text-slate-900 dark:text-white text-right max-w-xs truncate">
                {topic || 'Materi Pembelajaran'}
              </span>
            </div>

            {contextNotes && (
              <div className="flex items-start justify-between pt-3 gap-4">
                <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Bahan Pertimbangan AI</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 text-right text-xs italic">
                  "{contextNotes}"
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Jumlah Butir Soal</span>
              <span className="font-black text-blue-600 dark:text-blue-400">
                {finalQuestions.length} Butir Soal Siap
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Format Tipe Soal</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {proportionMode === 'balanced' ? 'Campuran (Otomatis Seimbang)' : 'Kustom Proporsi Spesifik'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Ilustrasi Gambar</span>
              <span className={`font-bold ${includeAiImages ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                {includeAiImages ? '🎨 Aktif (Edukasi AI)' : 'Teks Saja'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Mesin / Metode Pembuat</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedEngine === 'local' && '🤖 Kurikulum SD Lokal'}
                {selectedEngine === 'groq' && '⚡ Groq Cloud LPU'}
                {selectedEngine === 'gemini' && '✨ Google Gemini AI'}
                {selectedEngine === 'prompt' && '📝 Generator Prompt / Dokumen'}
              </span>
            </div>

          </div>

          {/* Action Footer */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                if (flowSource === 'prompt_flow') {
                  setSubStep(6);
                } else {
                  setSubStep(4);
                }
              }}
              className="px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 min-h-[48px] flex items-center gap-1.5 btn-press transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <button
              type="button"
              onClick={handleFinishToQuestionBank}
              className="px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center gap-2 min-h-[48px] btn-press transition-all"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Buat Kuis Sekarang & Buka Bank Soal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
