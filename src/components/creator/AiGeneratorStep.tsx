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
    <div className="w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 py-4 sm:py-6 animate-fade-in space-y-6">
      
      {/* Top Stepper Indicator */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                Langkah {subStep} dari 7
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline">
                • Generator AI Wizard
              </span>
            </div>
            <h2 className="text-base sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {STEP_TITLES[subStep].title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {STEP_TITLES[subStep].subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              onBack();
            }}
            className="px-3.5 sm:px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors shrink-0 min-h-[44px] btn-press"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ganti Metode</span>
          </button>
        </div>

        {/* Progress Track */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
          <div 
            className="bg-blue-600 h-full transition-all duration-300 ease-out rounded-full"
            style={{ width: `${(subStep / 7) * 100}%` }}
          />
        </div>

        {/* Step Indicator Badges */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px] sm:text-xs font-bold text-slate-400">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <div 
              key={num} 
              className={`flex items-center gap-1.5 shrink-0 transition-colors ${
                subStep === num 
                  ? 'text-blue-600 dark:text-blue-400 font-black' 
                  : subStep > num 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs transition-all ${
                subStep === num 
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300/40' 
                  : subStep > num 
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-slate-100 dark:bg-slate-800'
              }`}>
                {subStep > num ? '✓' : num}
              </div>
              <span className="hidden sm:inline text-xs font-bold">
                {num === 1 && '1. Mapel & Kelas'}
                {num === 2 && '2. Topik & Saran'}
                {num === 3 && '3. Format & Proporsi'}
                {num === 4 && '4. Mesin Pembuat'}
                {num === 5 && '5. Prompt / Berkas'}
                {num === 6 && '6. Inspeksi Soal'}
                {num === 7 && '7. Konfirmasi'}
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 sm:space-y-8">
          
          {/* Pilihan Mata Pelajaran */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                Pilih Mata Pelajaran <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
                Kurikulum Merdeka SD
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
              {(['IPA', 'Matematika', 'Bahasa Indonesia', 'Pendidikan Pancasila', 'Pengetahuan Umum'] as Subject[]).map((subj) => (
                <button
                  key={subj}
                  type="button"
                  onClick={() => {
                    playClick();
                    setSubject(subj);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all min-h-[68px] flex items-center gap-3.5 btn-press ${
                    subject === subj
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/25 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-3xl shrink-0">{EMOJI_BY_SUBJECT[subj]}</span>
                  <div className="min-w-0">
                    <span className="font-black text-sm block truncate">{subj}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                      Kurikulum Merdeka
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pilihan Tingkat Kelas SD (1 s.d. 6) */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                Pilih Tingkat Kelas SD <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
                Fase A (1-2), B (3-4), C (5-6)
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    playClick();
                    setGrade(g);
                  }}
                  className={`py-4 px-2 rounded-2xl font-black text-sm transition-all min-h-[56px] flex flex-col items-center justify-center gap-0.5 btn-press ${
                    grade === g
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-400/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                  }`}
                >
                  <span className="text-sm font-extrabold">Kelas {g}</span>
                  <span className="text-[10px] font-normal opacity-85">Sekolah Dasar</span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigasi Bawah */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                playClick();
                setSubStep(2);
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 min-h-[48px] btn-press transition-all"
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 sm:space-y-8">
          
          {/* Tag Penanda Konteks */}
          <div className="flex items-center justify-between gap-3 flex-wrap p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60">
            <div className="flex items-center gap-2.5 text-blue-900 dark:text-blue-200 text-xs sm:text-sm font-black">
              <span className="text-xl sm:text-2xl">{EMOJI_BY_SUBJECT[subject]}</span>
              <span>Mata Pelajaran: {subject}</span>
              <span className="text-blue-400">•</span>
              <span>Tingkat: Kelas {grade} SD</span>
            </div>
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-900/60 px-2.5 py-1 rounded-lg">
              Kurikulum Merdeka
            </span>
          </div>

          {/* 2-Column Responsive Layout for Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* Left Column: Topik & Rekomendasi Cerdas */}
            <div className="lg:col-span-6 space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-2">
                  Topik atau Materi Pembahasan Kuis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Organ Pernapasan Manusia, Pecahan Senilai, Pengamalan Sila Pancasila..."
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 font-semibold text-sm focus:border-blue-500 focus:outline-none min-h-[50px] shadow-xs"
                />
              </div>

              {/* Saran Topik Cerdas */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Rekomendasi Topik {subject} Kelas {grade}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setRandomSeed((prev) => prev + 1);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold min-h-[32px] btn-press"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    Acak Ide
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
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>+ {rec.topic}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Bahan Pertimbangan AI & Panduan */}
            <div className="lg:col-span-6 space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-2">
                  Informasi Singkat / Bahan Pertimbangan AI <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  rows={4}
                  value={contextNotes}
                  onChange={(e) => setContextNotes(e.target.value)}
                  placeholder="Contoh: Fokuskan pada fungsi organ paru-paru dan cara menjaga kesehatannya. Gunakan bahasa santai dan menyenangkan ramah anak SD..."
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-xs sm:text-sm focus:border-blue-500 focus:outline-none shadow-xs"
                />
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-xs">
                  <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Tips Memberikan Konteks kepada AI:</span>
                </div>
                <ul className="text-[11px] sm:text-xs text-indigo-800 dark:text-indigo-300/90 space-y-1 pl-6 list-disc leading-relaxed">
                  <li>Tentukan fokus sub-materi tertentu agar tidak melebar.</li>
                  <li>Sebutkan jika ada istilah khusus yang ingin dikenalkan kepada siswa.</li>
                  <li>AI akan menyesuaikan tingkat kerumitan kalimat dengan usia siswa kelas {grade} SD.</li>
                </ul>
              </div>
            </div>

          </div>

          {/* Navigasi Bawah */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                setSubStep(1);
              }}
              className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 min-h-[48px] flex items-center gap-2 btn-press transition-colors"
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
              className="px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 min-h-[48px] btn-press transition-all"
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 sm:space-y-8">
          
          {/* Pilihan Jumlah Soal */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                Jumlah Butir Soal <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Pilih opsi cepat atau ketik angka (1 - 50 butir)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {[5, 10, 15, 20, 25].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    playClick();
                    setQuestionCount(cnt);
                    setCustomCountStr(String(cnt));
                    if (proportionMode === 'custom') {
                      handleAutoDistributeProportions(cnt);
                    }
                  }}
                  className={`py-3.5 px-3 rounded-2xl font-black text-sm min-h-[50px] transition-all btn-press flex items-center justify-center ${
                    questionCount === cnt && customCountStr === String(cnt)
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-400/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                  }`}
                >
                  {cnt} Butir Soal
                </button>
              ))}
              <div>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={customCountStr}
                  onChange={(e) => {
                    setCustomCountStr(e.target.value);
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      setQuestionCount(val);
                      if (proportionMode === 'custom') {
                        handleAutoDistributeProportions(val);
                      }
                    }
                  }}
                  placeholder="Kustom (1-50)"
                  className="w-full px-3 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm text-center min-h-[50px] focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Mode Format Tipe Soal */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  Format Tipe Soal & Proporsi
                </label>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Tentukan bagaimana AI membagi tipe soal yang dihasilkan.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setProportionMode('balanced');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] flex items-center gap-1.5 ${
                    proportionMode === 'balanced'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>⚖️ Otomatis Seimbang</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setProportionMode('custom');
                    handleAutoDistributeProportions(currentTotalQuestions);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] flex items-center gap-1.5 ${
                    proportionMode === 'custom'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>🎛️ Kustom Mandiri</span>
                </button>
              </div>
            </div>

            {proportionMode === 'balanced' ? (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-700/60 text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Mode Otomatis Berimbang Aktif:
                  </span>
                  <span>
                    AI akan secara cerdas meracik distribusi berimbang antara <strong>Pilihan Ganda (~50%)</strong>, <strong>Benar/Salah (~20%)</strong>, <strong>Isian Singkat (~20%)</strong>, dan <strong>Menjodohkan (~10%)</strong> sesuai karakteristik kognitif anak kelas {grade} SD.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Tentukan Jumlah Butir Tiap Format:</span>
                  <span className={`font-black px-3 py-1 rounded-full text-xs ${
                    sumCustomProportions === currentTotalQuestions
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}>
                    Total Dialokasikan: {sumCustomProportions} / {currentTotalQuestions} Butir
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Multiple Choice */}
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">Pilihan Ganda</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
                          {Math.round((proportions.multiple_choice / Math.max(1, currentTotalQuestions)) * 100)}%
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">4 opsi pilihan (A, B, C, D)</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-400">Butir:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setProportions((p) => ({ ...p, multiple_choice: Math.max(0, p.multiple_choice - 1) }))}
                          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center hover:bg-slate-200 btn-press"
                        >-</button>
                        <span className="w-7 text-center font-black text-sm text-slate-900 dark:text-white">{proportions.multiple_choice}</span>
                        <button
                          type="button"
                          onClick={() => setProportions((p) => ({ ...p, multiple_choice: p.multiple_choice + 1 }))}
                          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center hover:bg-slate-200 btn-press"
                        >+</button>
                      </div>
                    </div>
                  </div>

                  {/* True / False */}
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">Benar / Salah</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300">
                          {Math.round((proportions.true_false / Math.max(1, currentTotalQuestions)) * 100)}%
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">Analisis pernyataan materi</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-400">Butir:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setProportions((p) => ({ ...p, true_false: Math.max(0, p.true_false - 1) }))}
                          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center hover:bg-slate-200 btn-press"
                        >-</button>
                        <span className="w-7 text-center font-black text-sm text-slate-900 dark:text-white">{proportions.true_false}</span>
                        <button
                          type="button"
                          onClick={() => setProportions((p) => ({ ...p, true_false: p.true_false + 1 }))}
                          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center hover:bg-slate-200 btn-press"
                        >+</button>
                      </div>
                    </div>
                  </div>

                  {/* Short Answer */}
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">Isian Singkat</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300">
                          {Math.round((proportions.short_answer / Math.max(1, currentTotalQuestions)) * 100)}%
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">Mengetik kata kunci jawaban</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-400">Butir:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setProportions((p) => ({ ...p, short_answer: Math.max(0, p.short_answer - 1) }))}
                          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center hover:bg-slate-200 btn-press"
                        >-</button>
                        <span className="w-7 text-center font-black text-sm text-slate-900 dark:text-white">{proportions.short_answer}</span>
                        <button
                          type="button"
                          onClick={() => setProportions((p) => ({ ...p, short_answer: p.short_answer + 1 }))}
                          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center hover:bg-slate-200 btn-press"
                        >+</button>
                      </div>
                    </div>
                  </div>

                  {/* Matching Pairs */}
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">Menjodohkan</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                          {Math.round((proportions.matching_pairs / Math.max(1, currentTotalQuestions)) * 100)}%
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">Pasangan konsep kiri & kanan</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-400">Butir:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setProportions((p) => ({ ...p, matching_pairs: Math.max(0, p.matching_pairs - 1) }))}
                          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center hover:bg-slate-200 btn-press"
                        >-</button>
                        <span className="w-7 text-center font-black text-sm text-slate-900 dark:text-white">{proportions.matching_pairs}</span>
                        <button
                          type="button"
                          onClick={() => setProportions((p) => ({ ...p, matching_pairs: p.matching_pairs + 1 }))}
                          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-sm flex items-center justify-center hover:bg-slate-200 btn-press"
                        >+</button>
                      </div>
                    </div>
                  </div>
                </div>

                {sumCustomProportions !== currentTotalQuestions && (
                  <p className="text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-1">
                    <span>⚠️</span>
                    <span>Total proporsi ({sumCustomProportions}) harus persis sama dengan total butir terpilih ({currentTotalQuestions}). Silakan sesuaikan jumlah di atas.</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Kotak Include Gambar */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850/60 cursor-pointer min-h-[60px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-press">
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
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                  Menyertakan prompt visual dan gambar edukasi relevan pada butir soal untuk merangsang daya visual siswa SD.
                </span>
              </div>
            </label>
          </div>

          {/* Navigasi Bawah */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                setSubStep(2);
              }}
              className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 min-h-[48px] flex items-center gap-2 btn-press transition-colors"
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
              className="px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 min-h-[48px] btn-press transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 sm:space-y-8">
          
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                Pilih Mesin Pembuat Soal
              </label>
              {isCheckingCloudAi && (
                <span className="text-[11px] text-blue-500 font-bold flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memeriksa Status Cloud...
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5">
              Pilih salah satu dari 3 model langsung untuk meracik instan, atau pilih <strong>Generate Prompt</strong> jika ingin menggunakan AI eksternal atau berkas dokumen Anda.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              
              {/* Option 1: Kurikulum SD Lokal */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedEngine('local');
                }}
                className={`p-5 rounded-2xl border text-left transition-all min-h-[140px] flex flex-col justify-between btn-press ${
                  selectedEngine === 'local'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/25 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 flex items-center justify-center text-xl font-bold">
                      🤖
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      Mandiri / Offline
                    </span>
                  </div>
                  <span className="font-black text-sm sm:text-base block">Kurikulum SD Lokal</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Pembuat soal cepat berbasis bank materi Kurikulum Merdeka lokal tanpa ketergantungan kuota API.
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  {selectedEngine === 'local' ? '✓ Sedang Dipilih' : 'Klik untuk Memilih'}
                </div>
              </button>

              {/* Option 2: Groq Cloud LPU */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedEngine('groq');
                }}
                className={`p-5 rounded-2xl border text-left transition-all min-h-[140px] flex flex-col justify-between btn-press ${
                  selectedEngine === 'groq'
                    ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500/25 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 flex items-center justify-center text-xl font-bold">
                      ⚡
                    </div>
                    {supabaseAi.hasGroq ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <Cloud className="w-3 h-3" /> Cloud Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        Super Kilat
                      </span>
                    )}
                  </div>
                  <span className="font-black text-sm sm:text-base block">Groq Cloud LPU</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Komputasi LPU Llama 3.3 70B super kilat (&lt;1 detik) dengan pemahaman silabus kurikulum presisi.
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  {selectedEngine === 'groq' ? '✓ Sedang Dipilih' : 'Klik untuk Memilih'}
                </div>
              </button>

              {/* Option 3: Google Gemini AI */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedEngine('gemini');
                }}
                className={`p-5 rounded-2xl border text-left transition-all min-h-[140px] flex flex-col justify-between btn-press ${
                  selectedEngine === 'gemini'
                    ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 ring-2 ring-purple-500/25 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 flex items-center justify-center text-xl font-bold">
                      ✨
                    </div>
                    {supabaseAi.hasGemini ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <Cloud className="w-3 h-3" /> Cloud Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        Cerdas & Kaya
                      </span>
                    )}
                  </div>
                  <span className="font-black text-sm sm:text-base block">Google Gemini AI</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Penalaran edukatif mendalam, kaya variasi pertanyaan kontekstual ramah anak SD.
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  {selectedEngine === 'gemini' ? '✓ Sedang Dipilih' : 'Klik untuk Memilih'}
                </div>
              </button>

              {/* Option 4: Generate Prompt */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedEngine('prompt');
                }}
                className={`p-5 rounded-2xl border text-left transition-all min-h-[140px] flex flex-col justify-between btn-press ${
                  selectedEngine === 'prompt'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/25 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 flex items-center justify-center text-xl font-bold">
                      📝
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      Fleksibel / Berkas
                    </span>
                  </div>
                  <span className="font-black text-sm sm:text-base block">Generate Prompt / Berkas</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Gunakan ChatGPT / Claude, atau unggah tabel Excel/CSV/JSON/Teks dokumen kuis Anda.
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  {selectedEngine === 'prompt' ? '✓ Sedang Dipilih' : 'Klik untuk Memilih'}
                </div>
              </button>

            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                playClick();
                setSubStep(3);
              }}
              className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 min-h-[48px] flex items-center gap-2 btn-press transition-colors"
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
                className="px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md flex items-center gap-2 min-h-[48px] btn-press transition-all"
              >
                <span>Buka Generator Prompt (Langkah 5)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleExecuteAiDirect}
                className="px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 min-h-[48px] btn-press transition-all disabled:opacity-50"
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 sm:space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            
            {/* Card 1: Kotak Prompt Siap Pakai (Left Column on Desktop) */}
            <div className="lg:col-span-6 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-4 shadow-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                      1
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm text-indigo-950 dark:text-indigo-200">
                      Teks Prompt Siap Pakai (Anti AI Slop)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs btn-press min-h-[40px]"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Tersalin ke Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin Teks Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Readonly Prompt Box */}
                <div className="relative">
                  <textarea
                    readOnly
                    rows={11}
                    value={generatedPromptText}
                    className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none select-all leading-relaxed"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-100/70 dark:bg-indigo-900/40 text-[11px] sm:text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed font-medium">
                💡 <strong>Alur Praktis:</strong> 1. Salin prompt di atas → 2. Tempel ke ChatGPT, Claude, atau Gemini → 3. Salin jawaban AI dan tempelkan pada kolom di sebelah kanan.
              </div>
            </div>

            {/* Card 2: Area Masukan (Right Column on Desktop) */}
            <div className="lg:col-span-6 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                      2
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Masukkan Hasil Soal atau Berkas
                    </span>
                  </div>

                  {/* Sub-tab Switcher */}
                  <div className="flex p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setInputMethodTab('paste');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[34px] ${
                        inputMethodTab === 'paste'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[34px] ${
                        inputMethodTab === 'file'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      📂 Unggah Berkas
                    </button>
                  </div>
                </div>

                {inputMethodTab === 'paste' ? (
                  <div>
                    <textarea
                      rows={11}
                      value={rawInputText}
                      onChange={(e) => setRawInputText(e.target.value)}
                      placeholder="Tempelkan teks respons JSON dari AI atau teks daftar soal bernomor (1. ... A. ... B. ... Kunci: ...) di sini..."
                      className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 font-mono text-xs sm:text-sm focus:border-blue-500 focus:outline-none leading-relaxed shadow-xs"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>Mendukung format JSON Array maupun format teks soal bernomor.</span>
                      <span className="font-bold">{rawInputText.length} karakter</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center space-y-4">
                    <UploadCloud className="w-12 h-12 text-blue-500 mx-auto" />
                    <div>
                      <label className="inline-block px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-md min-h-[44px] btn-press">
                        Pilih Berkas (.xlsx, .csv, .json, .txt)
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

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
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

              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                ⚡ Parser cerdas otomatis mendeteksi format, kunci jawaban, dan pembahasan soal.
              </p>
            </div>

          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                setSubStep(4);
              }}
              className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 min-h-[48px] flex items-center gap-2 btn-press transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Mesin</span>
            </button>

            <button
              type="button"
              onClick={handleParseAndGoToPreview}
              className="px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 min-h-[48px] btn-press transition-all"
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 sm:space-y-8">
          
          {/* Header Status Deteksi */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="font-extrabold text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 block">
                  {parsedItems.filter((p) => p.valid).length} Butir Soal Terdeteksi Sempurna
                </span>
                <span className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-400 block mt-0.5">
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
              className="px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-2 btn-press min-h-[40px] shadow-xs"
            >
              <span>✏️ Perbaiki Teks di Step 5</span>
            </button>
          </div>

          {/* Notice Callout */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              💡 <strong>Tips Guru:</strong> Anda dapat memeriksa seluruh butir di bawah. Pengeditan teks mendalam, penambahan butir baru, atau penggantian gambar dapat dilakukan leluasa pada <strong>Tab 2 (Bank Soal)</strong> nanti.
            </span>
          </div>

          {/* List Kartu Soal Pratinjau Read-Only (Multi-column on Desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 max-h-[620px] overflow-y-auto pr-1.5 p-1">
            {finalQuestions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 space-y-3 flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 font-black text-xs text-slate-700 dark:text-slate-300 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {q.type === 'multiple_choice' && 'Pilihan Ganda'}
                        {q.type === 'true_false' && 'Benar / Salah'}
                        {q.type === 'short_answer' && 'Isian Singkat'}
                        {q.type === 'matching_pairs' && 'Menjodohkan'}
                        {q.type === 'image_guess' && 'Tebak Gambar'}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                      {q.points || 10} Poin
                    </span>
                  </div>

                  <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                    {q.text}
                  </p>

                  {/* Display Opsi / Jawaban */}
                  {q.type === 'multiple_choice' && (
                    <div className="grid grid-cols-1 gap-1.5 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                            oIdx === q.correctIndex
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700 font-bold'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                          {oIdx === q.correctIndex && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'true_false' && (
                    <div className="flex items-center gap-2 pt-1">
                      {['Benar', 'Salah'].map((opt, oIdx) => (
                        <div
                          key={opt}
                          className={`flex-1 p-2.5 rounded-xl text-xs font-bold text-center ${
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
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                      <span className="text-slate-400 mr-2">Kunci Jawaban:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        {q.acceptableAnswers?.join(' / ') || q.options[0] || '-'}
                      </span>
                    </div>
                  )}

                  {q.type === 'matching_pairs' && q.matchingPairs && (
                    <div className="space-y-1.5 pt-1 text-xs">
                      {q.matchingPairs.map((p, pIdx) => (
                        <div key={pIdx} className="p-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{p.left}</span>
                          <span className="text-slate-400 font-bold">➔</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{p.right}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-start gap-1.5">
                    <span>💡</span>
                    <span>{q.explanation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                setSubStep(5);
              }}
              className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 min-h-[48px] flex items-center gap-2 btn-press transition-colors"
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
              className="px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 min-h-[48px] btn-press transition-all"
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 sm:space-y-8">
          
          <div className="text-center space-y-1 pb-2">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-3xl mb-2 shadow-sm ring-4 ring-blue-100 dark:ring-blue-900/30">
              {EMOJI_BY_SUBJECT[subject]}
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Konfirmasi Spesifikasi Kuis
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              Periksa ringkasan konfigurasi kuis Anda di bawah sebelum melangkah ke Bank Soal.
            </p>
          </div>

          {/* Executive 4-Card Metric Grid on Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            
            {/* Card 1: Mapel & Kelas */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Kurikulum & Sasaran
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{EMOJI_BY_SUBJECT[subject]}</span>
                <div>
                  <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                    {subject}
                  </h4>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                    Kelas {grade} SD • Merdeka
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Topik Pembahasan */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Topik / Materi Kuis
              </span>
              <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight line-clamp-2" title={topic}>
                {topic || 'Materi Pelajaran'}
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                {contextNotes ? `Konteks: "${contextNotes.slice(0, 30)}..."` : 'Tanpa catatan khusus'}
              </span>
            </div>

            {/* Card 3: Jumlah & Tipe Soal */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Butir & Format
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                  {finalQuestions.length}
                </span>
                <span className="text-xs font-bold text-slate-500">Butir Soal</span>
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold block">
                {proportionMode === 'balanced' ? '⚖️ Campuran Seimbang' : '🎛️ Proporsi Mandiri'}
              </span>
            </div>

            {/* Card 4: Mesin Sumber Soal */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Mesin Sumber Soal
              </span>
              <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                {selectedEngine === 'local' && '🤖 Kurikulum Lokal'}
                {selectedEngine === 'groq' && '⚡ Groq Cloud LPU'}
                {selectedEngine === 'gemini' && '✨ Google Gemini AI'}
                {selectedEngine === 'prompt' && '📝 Generator Prompt'}
              </h4>
              <span className={`text-xs font-bold block ${includeAiImages ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {includeAiImages ? '🎨 Gambar Edukasi Aktif' : '📄 Teks Murni'}
              </span>
            </div>

          </div>

          {/* Context Notes Banner (if provided) */}
          {contextNotes && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-xs sm:text-sm text-blue-950 dark:text-blue-200 block">
                  Bahan Pertimbangan Tambahan:
                </span>
                <p className="text-xs sm:text-sm text-blue-900/90 dark:text-blue-300 mt-1 italic leading-relaxed">
                  "{contextNotes}"
                </p>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
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
              className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 min-h-[48px] flex items-center gap-2 btn-press transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <button
              type="button"
              onClick={handleFinishToQuestionBank}
              className="px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 flex items-center gap-2 min-h-[48px] btn-press transition-all"
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
