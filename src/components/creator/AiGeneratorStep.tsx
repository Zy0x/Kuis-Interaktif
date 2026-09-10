import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Subject, QuizQuestion, EducationLevel } from '../../types/quiz';
import { 
  generateHybridQuizQuestions, 
  checkSupabaseAiStatus, 
  getSupabaseAiStatusSync, 
  generateAiTopicIdeas,
  generateAiCapaianPembelajaran,
  isAnyAiAvailable,
  getStoredDeepSeekApiKey,
  saveStoredDeepSeekApiKey,
  hasDeepSeekApiKey,
  getStoredDeepSeekModel,
  saveStoredDeepSeekModel,
  getStoredGroqApiKey,
  saveStoredGroqApiKey,
  hasGroqApiKey,
  getStoredGroqModel,
  saveStoredGroqModel,
  getStoredGeminiApiKey,
  saveStoredGeminiApiKey,
  hasGeminiApiKey,
  getStoredGeminiModel,
  saveStoredGeminiModel,
  getEngineHealthDetail,
  type DeepSeekModel,
  type GroqModel,
  type GeminiModel,
  type SupabaseAiStatus,
  type EngineHealthDetail,
  type AiProvider
} from '../../lib/geminiApi';
import { 
  parseRawQuestionsText, 
  generateAiPrompt, 
  getQuestionCsvTemplate,
  copyTextToClipboard
} from '../../lib/aiQuestionParser';
import { 
  Sparkles, 
  Zap, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  AlertTriangle,
  Download, 
  UploadCloud, 
  Copy, 
  Check, 
  CheckCircle2,
  Shuffle, 
  Info, 
  Eye,
  EyeOff,
  Search,
  X,
  Key,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { ResizableTextarea } from '../common/ResizableTextarea';

export type CreationStage = 1 | 2 | 3 | 4;
export type SupportedFormat = 'multiple_choice' | 'true_false' | 'short_answer' | 'matching_pairs';

interface AiGeneratorStepProps {
  onGenerated: (data: {
    questions: QuizQuestion[];
    topic: string;
    subject: Subject;
    grade: number;
    educationLevel?: EducationLevel;
    questionCount: number;
    coverEmoji: string;
    badgeTitle: string;
  }) => void;
  onBack: () => void;
  playClick: () => void;
  initialSubject?: Subject;
  initialGrade?: number;
  initialEducationLevel?: EducationLevel;
  stage: CreationStage;
  onStageChange: (stage: CreationStage) => void;
  topic: string;
  onTopicChange: (topic: string) => void;
}

const EMOJI_BY_SUBJECT: Record<Subject, string> = {
  // SD & Umum
  'Matematika': '📐',
  'IPA': '🌱',
  'IPAS': '🌿',
  'IPS': '🌐',
  'Bahasa Indonesia': '📚',
  'Pendidikan Pancasila': '🇮🇩',
  'Pengetahuan Umum': '💡',
  'Bahasa Inggris': '🇬🇧',
  'PJOK': '⚽',
  'Seni Musik': '🎵',
  'Seni Rupa': '🎨',
  'Seni Tari': '💃',
  'Seni Teater': '🎭',
  'Pendidikan Agama Islam': '🕌',
  'Pendidikan Agama Kristen': '✝️',
  'Pendidikan Agama Katolik': '⛪',
  'Pendidikan Agama Hindu': '🕉️',
  'Pendidikan Agama Buddha': '☸️',
  'Pendidikan Agama Konghucu': '⛩️',
  'Bahasa Daerah': '🗣️',
  'Informatika': '💻',
  // Khas SMP (Fase D)
  'IPA Terpadu': '🔬',
  'IPS Terpadu': '🌍',
  'Prakarya': '✂️',
  // Khas SMA / SMK (Fase E & F)
  'Fisika': '⚛️',
  'Kimia': '🧪',
  'Biologi': '🧬',
  'Ekonomi': '📈',
  'Sosiologi': '👥',
  'Geografi': '🗺️',
  'Sejarah': '🏛️',
  'Matematika Tingkat Lanjut': '♾️',
  'Antropologi': '🏺',
};

interface TopicRecommendation {
  topic: string;
  context: string;
}

const SMART_TOPICS_BY_SUBJECT_AND_GRADE: Partial<Record<Subject, Record<number, TopicRecommendation[]>>> = {
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
      { topic: 'Majas Personifikasi dan Perumpamaan Sederhana', context: 'Gaya bahasa benda mati seolah bernyawa dalam puisi anak.' }
    ],
    5: [
      { topic: 'Surat Undangan Resmi dan Tidak Resmi', context: 'Unsur kepala surat, tanggal, isi, penutup, dan tata bahasa baku.' },
      { topic: 'Iklan Media Cetak dan Kata Kunci Persuasif', context: 'Menganalisis pesan persuasif pada poster lingkungan dan kesehatan.' }
    ],
    6: [
      { topic: 'Pidato Persuasif dan Kerangka Naskah', context: 'Struktur salam pembuka, pendahuluan, inti ajakan, dan penutup pidato perpisahan.' },
      { topic: 'Teks Formulir Pendaftaran dan Daftar Riwayat Hidup', context: 'Mengisi identitas, pendidikan, dan ekstrakurikuler secara teliti.' }
    ]
  },
  'Pendidikan Pancasila': {
    1: [
      { topic: 'Simbol-Simbol Garuda Pancasila', context: 'Mengenal Bintang, Rantai, Pohon Beringin, Kepala Banteng, serta Padi dan Kapas.' },
      { topic: 'Aturan di Rumah dan di Sekolah', context: 'Tertib bangun pagi, merapikan mainan, dan mendengarkan penjelasan guru.' }
    ],
    2: [
      { topic: 'Perilaku Sesuai Sila-Sila Pancasila di Rumah', context: 'Berdoa sebelum makan (Sila 1) dan tolong-menolong sesama saudara (Sila 2).' },
      { topic: 'Menghargai Keberagaman Teman Sekelas', context: 'Perbedaan suku, warna kulit, dan kegemaran permainan tradisional.' }
    ],
    3: [
      { topic: 'Musyawarah untuk Mufakat di Lingkungan Sekolah', context: 'Pemilihan ketua kelas dan pembagian jadwal piket kebersihan kelas.' },
      { topic: 'Kewajiban dan Hak Siswa di Sekolah', context: 'Hak mendapatkan ilmu dan kewajiban menjaga fasilitas perpustakaan.' }
    ],
    4: [
      { topic: 'Makna Bhinneka Tunggal Ika dalam Kehidupan Bermasyarakat', context: 'Saling menghormati hari raya keagamaan dan gotong royong warga RT.' },
      { topic: 'Desa, Kelurahan, dan Kecamatan Tempat Tinggalku', context: 'Struktur pemerintahan desa dan pelayanan administrasi masyarakat.' }
    ],
    5: [
      { topic: 'Nilai Juang Para Pahlawan Perumus Pancasila', context: 'Semangat persatuan tokoh BPUPKI dan PPKI mengutamakan kepentingan bangsa.' },
      { topic: 'Norma Agama, Kesusilaan, Kesopanan, dan Hukum', context: 'Sanksi sosial, etika berbicara sopan, dan mematuhi rambu lalu lintas.' }
    ],
    6: [
      { topic: 'Keutuhan Negara Kesatuan Republik Indonesia (NKRI)', context: 'Batas wilayah maritim dan pulau-pulau terluar Indonesia.' },
      { topic: 'Hak Asasi Manusia dan Perlindungan Anak Indonesia', context: 'Hak atas pendidikan layak, perlindungan dari perundungan (bullying).' }
    ]
  },
  'IPS': {
    1: [
      { topic: 'Mengenal Rambu Lalu Lintas dan Keselamatan Jalan', context: 'Lampu merah, zebra cross, dan keselamatan menyeberang jalan raya.' },
      { topic: 'Profesi dan Pekerjaan di Sekitar Kita', context: 'Dokter, polisi, pemadam kebakaran, petani, dan guru.' }
    ],
    2: [
      { topic: 'Alat Transportasi Tradisional dan Modern', context: 'Delman, becak, perahu klotok vs kereta cepat, pesawat komersial.' },
      { topic: 'Pahlawan Nasional dan Monumen Bersejarah', context: 'Pangeran Diponegoro, R.A. Kartini, Monas, dan Candi Borobudur.' }
    ],
    3: [
      { topic: 'Rumah Adat dan Pakaian Tradisional Indonesia', context: 'Rumah Gadang, Tongkonan, Joglo, Ulos, Kebaya, dan Baju Bodo.' },
      { topic: 'Keajaiban Flora dan Fauna Khas Indonesia', context: 'Komodo, Orangutan, Burung Cenderawasih, Bunga Rafflesia Arnoldii.' }
    ],
    4: [
      { topic: 'Nama Provinsi dan Ibu Kota di Kepulauan Indonesia', context: 'Pulau Sumatra, Jawa, Kalimantan, Sulawesi, Maluku, dan Papua.' },
      { topic: 'Lagu Wajib Nasional dan Makna Perjuangannya', context: 'Indonesia Raya, Halo-Halo Bandung, Bagimu Negeri, Satu Nusa Satu Bangsa.' }
    ],
    5: [
      { topic: 'Organisasi ASEAN dan Negara Tetangga Asia Tenggara', context: 'Negara pendiri ASEAN, ibu kota, mata uang, dan lambang negara anggota.' },
      { topic: 'Sumber Daya Alam dan Keragaman Geografis Indonesia', context: 'Dataran tinggi, dataran rendah, kawasan pesisir, dan pemanfaatan berkelanjutan.' }
    ],
    6: [
      { topic: 'Benua dan Samudra di Dunia Beserta Ciri Khasnya', context: 'Benua Asia, Afrika, Amerika, Eropa, Australia, Antartika.' },
      { topic: 'Perkembangan Teknologi Komunikasi dari Masa ke Masa', context: 'Dari telegraf, surat merpati, telepon kabel hingga era internet dan AI.' }
    ]
  },
  'Pengetahuan Umum': {
    1: [
      { topic: 'Mengenal Rambu Lalu Lintas dan Keselamatan Jalan', context: 'Lampu merah, zebra cross, dan keselamatan menyeberang jalan raya.' },
      { topic: 'Profesi dan Pekerjaan di Sekitar Kita', context: 'Dokter, polisi, pemadam kebakaran, petani, dan guru.' }
    ],
    2: [
      { topic: 'Alat Transportasi Tradisional dan Modern', context: 'Delman, becak, perahu klotok vs kereta cepat, pesawat komersial.' },
      { topic: 'Pahlawan Nasional dan Monumen Bersejarah', context: 'Pangeran Diponegoro, R.A. Kartini, Monas, dan Candi Borobudur.' }
    ],
    3: [
      { topic: 'Rumah Adat dan Pakaian Tradisional Indonesia', context: 'Rumah Gadang, Tongkonan, Joglo, Ulos, Kebaya, dan Baju Bodo.' },
      { topic: 'Keajaiban Flora dan Fauna Khas Indonesia', context: 'Komodo, Orangutan, Burung Cenderawasih, Bunga Rafflesia Arnoldii.' }
    ],
    4: [
      { topic: 'Nama Provinsi dan Ibu Kota di Kepulauan Indonesia', context: 'Pulau Sumatra, Jawa, Kalimantan, Sulawesi, Maluku, dan Papua.' },
      { topic: 'Lagu Wajib Nasional dan Makna Perjuangannya', context: 'Indonesia Raya, Halo-Halo Bandung, Bagimu Negeri, Satu Nusa Satu Bangsa.' }
    ],
    5: [
      { topic: 'Organisasi ASEAN dan Negara Tetangga Asia Tenggara', context: 'Negara pendiri ASEAN, ibu kota, mata uang, dan lambang negara anggota.' },
      { topic: 'Sumber Energi Terbarukan dan Pelestarian Bumi', context: 'Pembangkit listrik tenaga surya, bayu/angin, air, dan bahaya polusi mikroplastik.' }
    ],
    6: [
      { topic: 'Benua dan Samudra di Dunia Beserta Ciri Khasnya', context: 'Benua Asia, Afrika, Amerika, Eropa, Australia, Antartika.' },
      { topic: 'Perkembangan Teknologi Komunikasi dari Masa ke Masa', context: 'Dari telegraf, surat merpati, telepon kabel hingga era internet dan AI.' }
    ]
  },
  'Bahasa Inggris': {
    1: [
      { topic: 'My Family & Colors', context: 'Introduce father, mother, brother, sister and primary colors with cheerful songs.' },
      { topic: 'Classroom Objects & Numbers 1-10', context: 'Identify book, pencil, ruler, eraser and counting items in the classroom.' },
      { topic: 'Greetings & Feelings', context: 'Practice Good Morning, How are you?, I am happy, I am sleepy.' }
    ],
    2: [
      { topic: 'Animals Around Us & Pets', context: 'Cat, dog, rabbit, bird, fish and animal sounds in simple sentences.' },
      { topic: 'Parts of the Body', context: 'Head, shoulders, knees, toes, eyes, ears, mouth, and nose.' },
      { topic: 'Daily Activities & Action Verbs', context: 'Walk, run, jump, read, write, sing, and dance.' }
    ],
    3: [
      { topic: 'Telling Time & Daily Routine', context: 'O\'clock, half past, morning routine, and school schedule.' },
      { topic: 'Food and Drinks & Simple Preferences', context: 'I like apples, I don\'t like milk, breakfast, lunch, and dinner.' },
      { topic: 'My Favorite Hobbies & Sports', context: 'Playing football, drawing, reading stories, and swimming.' }
    ],
    4: [
      { topic: 'Weather and Four Seasons', context: 'Sunny, rainy, cloudy, windy, hot, cold, and seasonal clothes.' },
      { topic: 'School Subjects & Favorite Lessons', context: 'English, Math, Science, Art, and describing what we learn.' },
      { topic: 'Giving Simple Directions in School', context: 'Turn left, turn right, go straight, next to the library.' }
    ],
    5: [
      { topic: 'Professions & Dream Jobs', context: 'Doctor, teacher, astronaut, chef, police officer and what they do.' },
      { topic: 'Public Places in the City', context: 'Hospital, supermarket, post office, park, and zoo.' },
      { topic: 'Sharing Past Holiday Experiences', context: 'Simple past tense: went, saw, visited, enjoyed with pictures.' }
    ],
    6: [
      { topic: 'Travel Experience & World Landmarks', context: 'Airports, trains, monuments, and cultural wonders around the globe.' },
      { topic: 'Protecting Our Planet & Environment', context: 'Recycling, planting trees, saving water, and animal habitats.' },
      { topic: 'Technology and Gadgets for Learning', context: 'Computers, internet safety, and smart devices in daily life.' }
    ]
  },
  'PJOK': {
    1: [
      { topic: 'Gerak Dasar Lokomotor (Jalan, Lari, Lompat)', context: 'Latihan gerak berpindah tempat dengan permainan estafet ramah anak.' },
      { topic: 'Mengenal Anggota Tubuh & Kebersihan Diri', context: 'Membiasakan mencuci tangan, mandi, dan menjaga kebersihan pakaian olahraga.' }
    ],
    2: [
      { topic: 'Gerak Non-Lokomotor (Meliuk, Mengayun, Menekuk)', context: 'Peregangan sendi dan otot di tempat sebelum memulai aktivitas olahraga.' },
      { topic: 'Senam Irama Anak Sederhana', context: 'Kombinasi langkah kaki dan ayunan lengan mengikuti irama musik riang.' }
    ],
    3: [
      { topic: 'Kombinasi Gerak Manipulatif Melempar & Menangkap Bola', context: 'Dasar permainan kasti dan bola tangan mini dengan kerja sama tim.' },
      { topic: 'Latihan Kebugaran Jasmani & Daya Tahan Tubuh', context: 'Lari bolak-balik (shuttle run) dan lompat tali untuk melatih stamina.' }
    ],
    4: [
      { topic: 'Dasar Renang & Keselamatan di Air', context: 'Gerak meluncur, pernapasan renang gaya dada, dan aturan kolam renang.' },
      { topic: 'Permainan Kasti dan Rounders Lapangan Kecil', context: 'Teknik memukul, berlari ke tiang hinggap, dan menjaga sportivitas.' }
    ],
    5: [
      { topic: 'Dasar Bola Voli Mini & Sepak Bola Mini', context: 'Passing bawah, passing atas, menendang, dan mengoper bola ke teman.' },
      { topic: 'Senam Ketangkasan & Guling Depan (Forward Roll)', context: 'Pendaratan aman di atas matras dengan bimbingan dan pengawasan guru.' }
    ],
    6: [
      { topic: 'Pertolongan Pertama pada Kecelakaan (P3K) Ringan', context: 'Menangani luka lecet, memar, mimisan, dan kram saat berolahraga.' },
      { topic: 'Pola Hidup Sehat & Pencegahan Bahaya Rokok/Zat Berbahaya', context: 'Menjaga organ jantung, paru-paru, dan menolak ajakan merokok sejak dini.' }
    ]
  },
  'Seni Rupa': {
    1: [
      { topic: 'Garis Lurus, Lengkung, dan Warna Primer', context: 'Mengenal merah, kuning, biru, dan aneka garis ekspresi dalam gambar.' },
      { topic: 'Kolase Kertas Origami Sederhana', context: 'Menggunting dan menempel potongan kertas menjadi bentuk buah atau bunga.' }
    ],
    2: [
      { topic: 'Pola Geometris & Gradasi Warna Sekunder', context: 'Mencampur warna primer menjadi jingga, hijau, dan ungu.' },
      { topic: 'Menggambar Hewan Peliharaan dan Lingkungan', context: 'Mengamati bentuk tubuh kucing, kelinci, dan ikan di akuarium.' }
    ],
    3: [
      { topic: 'Ilustrasi Cerita Rakyat Nusantara', context: 'Menggambar adegan dongeng fabel atau legenda lokal yang sarat pesan moral.' },
      { topic: 'Tekstur Alami Benda (Teknik Arsir & Rubbing)', context: 'Menjiplak tekstur daun, koin, dan kulit kayu dengan pensil warna.' }
    ],
    4: [
      { topic: 'Ragam Hias Motif Tradisional Nusantara (Batik)', context: 'Mengenal motif kawung, mega mendung, dan parang nusantara.' },
      { topic: 'Membentuk Karya Tiga Dimensi Plastisin/Tanah Liat', context: 'Membuat miniatur buah, cangkir, atau hewan dengan teknik pilin dan butsir.' }
    ],
    5: [
      { topic: 'Prinsip Proporsi dan Perspektif Satu Titik Hilang', context: 'Menggambar jalan raya dan rel kereta dengan ilusi kedalaman ruang.' },
      { topic: 'Desain Poster Edukasi Peduli Lingkungan', context: 'Kombinasi gambar ajakan hemat air, buang sampah, dan tipografi menarik.' }
    ],
    6: [
      { topic: 'Apresiasi Karya Seni Lukis Indonesia', context: 'Mengenal karya Raden Saleh, Affandi, dan Basoeki Abdullah.' },
      { topic: 'Pameran Karya Seni Rupa Sekolah Dasar', context: 'Tata letak karya, pencahayaan, katalog mini, dan mengapresiasi karya teman.' }
    ]
  },
  'Seni Musik': {
    1: [
      { topic: 'Membedakan Nada Tinggi, Rendah, Kuat, dan Lemah', context: 'Eksplorasi suara alam (hujan, angin) dan suara alat musik petik/pukul.' },
      { topic: 'Menyanyikan Lagu Anak Nasional dengan Riang', context: 'Lagu Balonku, Bintang Kecil, dan Pelangi dengan tempo yang tepat.' }
    ],
    2: [
      { topic: 'Pola Irama Birama 2/4 dan 3/4', context: 'Tepuk tangan dan hentakan kaki mengikuti ketukan berulang.' },
      { topic: 'Mengenal Alat Musik Perkusi Sederhana', context: 'Rebana, marakas, tamborin, dan kastanyet buatan tangan.' }
    ],
    3: [
      { topic: 'Membaca Notasi Angka Dasar (Do Re Mi)', context: 'Solmisasi tangga nada dasar dan menyanyikan interval nada berdekatan.' },
      { topic: 'Menyanyikan Lagu Daerah Bersama Teman', context: 'Lagu Gundhul Pacul, Ampar-Ampar Pisang, dan Yamko Rambe Yamko.' }
    ],
    4: [
      { topic: 'Alat Musik Melodis (Pianika & Rekorder)', context: 'Penjarian not dasar pada tuts pianika dengan tiupan stabil.' },
      { topic: 'Dinamika Musik Forte (Keras) dan Piano (Lembut)', context: 'Mengekspresikan suasana sedih, gembira, atau heroik dalam lagu wajib.' }
    ],
    5: [
      { topic: 'Tangga Nada Diatonis Mayor dan Minor', context: 'Ciri lagu riang (mayor) vs lagu khidmat/sedih (minor) beserta contohnya.' },
      { topic: 'Ansambel Musik Sederhana Sekolah', context: 'Kombinasi pianika, rekorder, dan marakas secara serempak dan kompak.' }
    ],
    6: [
      { topic: 'Mengenal Komponis Lagu Nasional Indonesia', context: 'Perjuangan W.R. Supratman, Ismail Marzuki, Ibu Sud, dan H. Mutahar.' },
      { topic: 'Apresiasi Alat Musik Tradisional Nusantara', context: 'Gamelan Jawa/Bali, Angklung Sunda, Sasando Rote, dan Kolintang Minahasa.' }
    ]
  },
  'Pendidikan Agama Islam': {
    1: [
      { topic: 'Rukun Islam dan Rukun Iman', context: 'Syahadat, salat, puasa, zakat, haji, serta iman kepada Allah dan malaikat.' },
      { topic: 'Huruf Hijaiyah Berharakat dan Adab Berdoa', context: 'Mengenal fathah, kasrah, dammah, serta adab makan dan belajar.' }
    ],
    2: [
      { topic: 'Asmaul Husna (Ar-Rahman, Ar-Rahim, Al-Malik)', context: 'Mengenal kasih sayang Allah dan meneladani sifat pengasih dalam pergaulan.' },
      { topic: 'Tata Cara Berwudu yang Bersih dan Tertib', context: 'Urutan rukun wudu, niat, dan doa sesudah wudu secara benar.' }
    ],
    3: [
      { topic: 'Salat Fardu Lima Waktu & Bacaannya', context: 'Subuh, Zuhur, Asar, Magrib, Isya beserta jumlah rakaat dan gerakan salat.' },
      { topic: 'Kisah Keteladanan Nabi Ibrahim AS & Nabi Ismail AS', context: 'Nilai keikhlasan, ketaatan kepada orang tua, dan asal mula ibadah kurban.' }
    ],
    4: [
      { topic: 'Surah Pendek Al-Falaq, An-Nas, dan Al-Ma\'un', context: 'Menghafal lafal ayat, arti kata kunci, dan pesan perlindungan kepada Allah.' },
      { topic: 'Mengenal 10 Malaikat Allah dan Tugas Utamanya', context: 'Jibril, Mikail, Israfil, Izrail, Munkar, Nakir, Raqib, Atid, Malik, Ridwan.' }
    ],
    5: [
      { topic: 'Puasa Ramadan dan Nilai Kejujuran Diri', context: 'Syarat wajib puasa, rukun puasa, dan keutamaan menahan hawa nafsu.' },
      { topic: 'Meneladani Khulafaur Rasyidin (Abu Bakar, Umar, Utsman, Ali)', context: 'Karakter kepemimpinan yang adil, jujur, dermawan, dan pemberani.' }
    ],
    6: [
      { topic: 'Ibadah Zakat, Infak, dan Sedekah', context: 'Membantu kaum duafa, membersihkan harta, dan menumbuhkan kepedulian sosial.' },
      { topic: 'Indahnya Toleransi Beragama (Surah Al-Kafirun)', context: 'Menghargai ibadah umat agama lain tanpa mencampuradukkan akidah.' }
    ]
  },
  'Informatika': {
    1: [
      { topic: 'Mengenal Komputer, Tablet, dan Ponsel Pintar', context: 'Layar monitor, keyboard, tetikus (mouse), dan kegunaannya di sekolah.' },
      { topic: 'Aturan Waktu Layar Sehat dan Sikap Duduk Ergonomis', context: 'Menjaga jarak mata dari layar, batas waktu main game, dan peregangan tubuh.' }
    ],
    2: [
      { topic: 'Menggambar Kreatif dengan Program Paint Sederhana', context: 'Menggunakan kuas digital, ember cat (fill), dan aneka bentuk bangun.' },
      { topic: 'Perangkat Keras (Hardware) vs Perangkat Lunak (Software)', context: 'Benda fisik yang bisa disentuh vs program aplikasi di dalam komputer.' }
    ],
    3: [
      { topic: 'Logika Urutan Langkah Kegiatan (Algoritma Sederhana)', context: 'Menyusun instruksi teratur membuat teh manis atau merapikan tempat tidur.' },
      { topic: 'Mengenal Ikon Folder, Simpan (Save), dan Buka Berkas', context: 'Manajemen berkas sederhana agar dokumen tugas sekolah tersimpan rapi.' }
    ],
    4: [
      { topic: 'Mengetik Cerita Pendek di Aplikasi Pengolah Kata', context: 'Mengatur ukuran huruf, gaya tebal/miring, dan spasi paragraf rapi.' },
      { topic: 'Etika Berkomunikasi di Ruang Digital (Netiket SD)', context: 'Bahasa santun saat mengirim pesan, tidak mengejek, dan izin sebelum foto.' }
    ],
    5: [
      { topic: 'Mencari Informasi Edukatif di Internet dengan Aman', context: 'Kata kunci pencarian yang tepat, membedakan fakta vs iklan tipuan.' },
      { topic: 'Pengenalan Tabel dan Grafik Sederhana (Spreadsheet)', context: 'Menginput data nama, nilai ulangan, dan membuat diagram batang otomatis.' }
    ],
    6: [
      { topic: 'Keamanan Akun & Membuat Kata Sandi yang Kuat', context: 'Menjaga privasi data diri, bahaya membagikan sandi kepada orang asing.' },
      { topic: 'Pengenalan Logika Pemrograman Visual (Scratch / Blockly)', context: 'Membuat animasi kucing berjalan dan berbicara dengan blok kode warna-warni.' }
    ]
  },
  'Bahasa Daerah': {
    1: [
      { topic: 'Sapaan Santun dan Ungkapan Sehari-hari Daerah', context: 'Menyapa orang tua, guru, dan teman menggunakan bahasa daerah yang santun.' },
      { topic: 'Nama Anggota Tubuh dalam Bahasa Daerah', context: 'Mengenal padanan kata kepala, mata, tangan, dan kaki dalam bahasa lokal.' }
    ],
    2: [
      { topic: 'Angka dan Berhitung dalam Bahasa Daerah', context: 'Menghitung benda 1 sampai 20 dengan pelafalan bahasa daerah yang fasih.' },
      { topic: 'Tembang Dolanan dan Permainan Tradisional', context: 'Lagu dolanan anak yang ceria diiringi gerakan permainan tradisional.' }
    ],
    3: [
      { topic: 'Dongeng Fabel dan Cerita Rakyat Khas Daerah', context: 'Menyimak cerita hewan bijak dan menyimpulkan nasihat budi pekerti luhur.' },
      { topic: 'Tingkatan Bahasa (Tata Krama / Unggah-Ungguh)', context: 'Membedakan cara berbicara kepada teman sebaya dan orang yang lebih tua.' }
    ],
    4: [
      { topic: 'Parikan / Pantun Tradisional Bahasa Daerah', context: 'Mengenal rima sampiran dan isi yang memuat pesan nasihat jenaka.' },
      { topic: 'Mengenal Rumah Adat dan Pakaian Adat Daerah', context: 'Kosakata nama bagian rumah adat dan busana adat kebanggaan nusantara.' }
    ],
    5: [
      { topic: 'Pengenalan Aksara Tradisional Daerah Dasar', context: 'Bentuk huruf dasar aksara daerah, cara membaca dan melafalkannya.' },
      { topic: 'Cerita Kepahlawanan Tokoh Pejuang Daerah', context: 'Kisah perjuangan pahlawan lokal membela tanah air dan rakyat nusantara.' }
    ],
    6: [
      { topic: 'Membaca dan Menulis Teks Narasi Bahasa Daerah', context: 'Menulis pengalaman liburan ke desa dengan kosakata daerah yang kaya.' },
      { topic: 'Apresiasi Sastra & Puisi Tradisional Daerah', context: 'Membaca puisi daerah dengan penjiwaan, intonasi, dan pelafalan yang tepat.' }
    ]
  }
};

const CORE_SUBJECTS_BY_LEVEL: Record<EducationLevel, Subject[]> = {
  SD: ['IPA', 'Matematika', 'Bahasa Indonesia', 'Pendidikan Pancasila', 'IPS'],
  SMP: ['IPA Terpadu', 'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPS Terpadu'],
  SMA: ['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Bahasa Indonesia'],
};

const isSubjectAllowedInLevel = (subj: Subject, lvl: EducationLevel): boolean => {
  if (lvl === 'SD') {
    return !['IPA Terpadu', 'IPS Terpadu', 'Prakarya', 'Fisika', 'Kimia', 'Biologi', 'Ekonomi', 'Sosiologi', 'Geografi', 'Sejarah', 'Matematika Tingkat Lanjut', 'Antropologi'].includes(subj);
  }
  if (lvl === 'SMP') {
    return !['Fisika', 'Kimia', 'Biologi', 'Ekonomi', 'Sosiologi', 'Geografi', 'Sejarah', 'Matematika Tingkat Lanjut', 'Antropologi'].includes(subj);
  }
  return true; // SMA allows all
};

const getCuratedTopics = (subj: Subject, grd: number, level?: EducationLevel): TopicRecommendation[] => {
  const map = SMART_TOPICS_BY_SUBJECT_AND_GRADE as Record<string, Record<number, TopicRecommendation[]>>;
  if (map[subj]?.[grd] && map[subj][grd].length > 0) {
    return map[subj][grd];
  }
  const effectiveLevel = level || (grd >= 10 ? 'SMA' : grd >= 7 ? 'SMP' : 'SD');
  const levelLabel = effectiveLevel === 'SMA' ? 'SMA / SMK' : effectiveLevel === 'SMP' ? 'SMP' : 'SD';
  return [
    { topic: `Konsep Inti ${subj} Kelas ${grd}`, context: `Eksplorasi konsep esensial yang wajib dikuasai siswa Kelas ${grd} ${levelLabel} sesuai Kurikulum Merdeka.` },
    { topic: `Penerapan ${subj} dalam Konteks Nyata`, context: `Studi kasus konkret dan kontekstual yang dekat dengan pengalaman siswa Kelas ${grd} ${levelLabel}.` },
    { topic: `Analisis & Penalaran Masalah ${subj}`, context: `Soal-soal pemantik nalar kritis (HOTS) dan solutif yang menantang pemahaman komprehensif.` },
  ];
};

const GRADE_SPECIFIC_CP: Partial<Record<Subject, Record<number, string>>> = {
  'Matematika': {
    1: 'Peserta didik mengenali dan membilang bilangan cacah hingga 20, melakukan penjumlahan dan pengurangan konkret sampai 10, serta mengenal bangun datar sederhana (segitiga, segiempat, lingkaran).',
    2: 'Peserta didik menguasai operasi penjumlahan dan pengurangan bersusun bilangan cacah hingga 100, memahami konsep perkalian sebagai penjumlahan berulang, serta mengenal pecahan 1/2 dan 1/4 menggunakan benda konkret.',
    3: 'Peserta didik memahami operasi perkalian dan pembagian bilangan cacah s.d. 1.000, menentukan pecahan biasa pada garis bilangan, serta menghitung keliling bangun datar persegi dan persegi panjang.',
    4: 'Peserta didik menguasai pecahan senilai, konsep FPB dan KPK, operasi hitung campuran bilangan cacah s.d. 10.000, serta menghitung luas persegi, persegi panjang, dan segitiga.',
    5: 'Peserta didik menguasai operasi hitung pecahan biasa, campuran, dan desimal, memahami perbandingan dan rasio kecepatan-jarak-waktu, serta menghitung volume bangun ruang kubus dan balok.',
    6: 'Peserta didik memahami operasi hitung campuran bilangan bulat positif dan negatif, menghitung unsur-unsur serta luas keliling lingkaran, volume bangun ruang prisma dan tabung, serta mengolah data mean, median, modus.',
    7: 'Peserta didik mengoperasikan bilangan bulat dan pecahan rasional, memahami bentuk aljabar, persamaan dan pertidaksamaan linear satu variabel, serta menyelesaikan masalah rasio dan proporsi.',
    8: 'Peserta didik membuktikan dan menerapkan teorema Pythagoras, menyelesaikan sistem persamaan linear dua variabel (SPLDV), relasi dan fungsi, pola bilangan, serta luas permukaan dan volume bangun ruang sisi datar.',
    9: 'Peserta didik menguasai persamaan dan fungsi kuadrat, transformasi geometri (translasi, refleksi, rotasi, dilatasi), kekongruenan dan kesebangunan bangun geometri, serta statistika dan peluang teoretis.',
    10: 'Peserta didik menggeneralisasi sifat-sifat eksponen dan logaritma, barisan dan deret aritmetika/geometri, vektor pada bidang, serta perbandingan trigonometri pada segitiga siku-siku.',
    11: 'Peserta didik menguasai fungsi komposisi dan invers, geometri analitik lingkaran dan garis singgung, transformasi fungsi, serta logika matematika dan penalaran analitis.',
    12: 'Peserta didik menganalisis geometri ruang dimensi tiga (jarak titik ke garis/bidang), statistika inferensial dan distribusi normal, serta konsep limit fungsi dan dasar-dasar kalkulus.',
  },
  'IPA': {
    1: 'Peserta didik mengamati lingkungan sekitar, mengenali fungsi panca indra dan bagian tubuh luar, serta membedakan benda hidup dan benda mati dalam kehidupan sehari-hari.',
    2: 'Peserta didik mengidentifikasi kebutuhan dasar makhluk hidup (air, makanan, udara), mengamati siklus pergantian siang-malam dan cuaca, serta mempraktikkan kebiasaan menjaga kebersihan lingkungan.',
    3: 'Peserta didik mengidentifikasi wujud benda (padat, cair, gas) beserta perubahannya (mencair, membeku, menguap), memahami ciri-ciri pertumbuhan makhluk hidup, dan pengaruh gaya dorong/tarik terhadap gerak.',
    4: 'Peserta didik menganalisis daur hidup hewan (metamorfosis sempurna dan tak sempurna), fungsi bagian tubuh tumbuhan (akar, batang, daun), sifat-sifat gaya (otot, magnet, gravitasi), serta perubahan wujud zat menyublim.',
    5: 'Peserta didik menganalisis sistem pernapasan dan pencernaan manusia, hubungan rantai makanan dan jaring-jaring kehidupan pada ekosistem, sifat perpindahan kalor (konduksi, konveksi, radiasi), serta siklus air.',
    6: 'Peserta didik menganalisis cara perkembangbiakan vegetatif dan generatif tumbuhan/hewan, adaptasi makhluk hidup terhadap habitatnya, sifat rangkaian listrik seri-paralel, serta sistem tata surya dan gerhana.',
  },
  'IPA Terpadu': {
    7: 'Peserta didik memahami hakikat sains, metode ilmiah dan pengukuran, zat dan karakteristik perubahannya, suhu, kalor, pemuaian, serta interaksi makhluk hidup dalam ekosistem.',
    8: 'Peserta didik menganalisis struktur dan fungsi sel, sistem organ manusia (pencernaan, peredaran darah, pernapasan, ekskresi), gerak lurus dan Hukum Newton, serta usaha dan pesawat sederhana.',
    9: 'Peserta didik memahami materi genetik dan pewarisan sifat Mendel, listrik statis dan dinamis rangkaian rumah tangga, kemagnetan dan induksi elektromagnetik, bioteknologi, serta tanah dan keberlangsungan hidup.',
  },
  'IPS Terpadu': {
    7: 'Peserta didik memahami konektivitas antarruang dan pengaruh letak geografis Indonesia, dinamika kependudukan, interaksi sosial dan pembentukan lembaga sosial, serta motif dan tindakan ekonomi kelangkaan.',
    8: 'Peserta didik menganalisis keragaman geografis dan sosial budaya kawasan ASEAN, pengaruh interaksi antarruang terhadap mobilitas sosial dan pluralitas, dinamika konflik integrasi sosial, serta peran pelaku ekonomi.',
    9: 'Peserta didik menganalisis interaksi keruangan benua Asia dan benua lainnya, dampak globalisasi sosial budaya dan IPTEK, ketergantungan antarruang dan ekonomi kreatif, serta perjuangan mempertahankan kedaulatan NKRI.',
  },
  'Fisika': {
    10: 'Peserta didik menguasai hakikat fisika dan metode ilmiah, besaran vektor gaya, kinematika gerak lurus (GLB dan GLBB), dinamika gerak dan Hukum Newton tentang gerak dan gravitasi.',
    11: 'Peserta didik menganalisis konsep fluida statis dan dinamis, termodinamika dan kalor, gelombang mekanik dan gelombang bunyi, gelombang cahaya, serta alat-alat optik.',
    12: 'Peserta didik menganalisis gejala listrik statis dan dinamis arus searah/bolak-balik, induksi elektromagnetik, relativitas khusus, radiasi benda hitam, dualisme gelombang partikel, dan teknologi fisika inti.',
  },
  'Kimia': {
    10: 'Peserta didik memahami struktur atom dan mekanika kuantum dasar, sistem periodik unsur, konfigurasi elektron, ikatan kimia, serta tata nama senyawa dan penyetaraan persamaan reaksi kimia sederhana.',
    11: 'Peserta didik menganalisis stoikiometri dan hukum dasar kimia, konsep mol, termokimia (entalpi), laju reaksi dan faktor yang mempengaruhinya, kesetimbangan kimia, teori asam-basa, pH, titrasi, serta larutan penyangga.',
    12: 'Peserta didik mengevaluasi sifat koligatif larutan, reaksi redoks dan elektrokimia (sel Volta & sel elektrolisis), kimia unsur periode 3 dan transisi, senyawa hidrokarbon, gugus fungsi karbon, dan makromolekul.',
  },
  'Biologi': {
    10: 'Peserta didik memahami keanekaragaman hayati tingkat gen, spesies, ekosistem, virologi dan pencegahan virus, bakteri, protista, jamur, serta peranan komponen ekosistem dan konservasi lingkungan.',
    11: 'Peserta didik menganalisis struktur mikroskopis dan fungsi sel, jaringan tumbuhan dan hewan, serta sistem organ manusia: sirkulasi darah, pencernaan, respirasi, ekskresi, sistem saraf koordinasi, dan sistem reproduksi.',
    12: 'Peserta didik menganalisis metabolisme sel (enzim, katabolisme respirasi aerob/anaerob, anabolisme fotosintesis), substansi genetika (DNA, RNA, sintesis protein), pola-pola hereditas Mendel, bioteknologi modern, serta teori dan bukti evolusi.',
  },
  'Ekonomi': {
    10: 'Peserta didik memahami konsep kelangkaan dan skala prioritas biaya peluang, masalah pokok ekonomi modern, sistem ekonomi komparatif, circular flow diagram pelaku ekonomi, serta terbentuknya harga keseimbangan pasar.',
    11: 'Peserta didik menganalisis perhitungan pendapatan nasional, pertumbuhan dan pembangunan ekonomi, ketenagakerjaan dan pengangguran, indeks harga dan inflasi, kebijakan moneter dan fiskal, serta APBN/APBD.',
    12: 'Peserta didik menguasai siklus akuntansi perusahaan jasa dan dagang (jurnal, buku besar, kertas kerja, laporan keuangan), manajemen badan usaha, koperasi, perdagangan internasional, neraca pembayaran, dan devisa.',
  },
  'Sosiologi': {
    10: 'Peserta didik memahami sosiologi sebagai ilmu pengkaji masyarakat, proses sosialisasi dan pembentukan kepribadian, interaksi sosial asosiatif/disosiatif, serta nilai, norma sosial, dan penanganan perilaku menyimpang.',
    11: 'Peserta didik menganalisis ragam kelompok sosial di masyarakat, partikularisme kelompok, permasalahan sosial (kemiskinan, kriminalitas), dinamika konflik sosial, kekerasan, serta resolusi konflik dan integrasi sosial.',
    12: 'Peserta didik mengevaluasi perubahan sosial di era globalisasi dan masyarakat digital, ketimpangan sosial modern, kearifan lokal nusantara, serta merancang proyek riset mini pemberdayaan komunitas lokal.',
  },
  'Geografi': {
    10: 'Peserta didik memahami ruang lingkup geografi, objek formal/material, prinsip dan pendekatan geografi, pemetaan digital dan SIG, penginderaan jauh, serta dinamika litosfer, pedosfer, dan dampaknya.',
    11: 'Peserta didik menganalisis letak strategis maritim Indonesia, biosfer dan persebaran flora fauna dunia, potensi dan pengelolaan sumber daya alam berkelanjutan, ketahanan pangan, industri, dan energi baru terbarukan.',
    12: 'Peserta didik menganalisis struktur keruangan desa dan kota, interaksi spasial wilayah, pemerataan pembangunan pusat pertumbuhan, mitigasi kebencanaan nasional, serta kerja sama geopolitik regional dan global.',
  },
  'Sejarah': {
    10: 'Peserta didik memahami konsep berpikir diakronik dan sinkronik dalam sejarah, sumber sejarah dan historiografi, masa praaksara nusantara, teori asal-usul nenek moyang bangsa Indonesia, dan jalur rempah nusantara.',
    11: 'Peserta didik menganalisis perkembangan kerajaan Hindu-Buddha dan Islam di nusantara, kolonialisme dan imperialisme bangsa Eropa, pergerakan nasional (Budi Utomo, Sumpah Pemuda), hingga momentum Proklamasi Kemerdekaan 1945.',
    12: 'Peserta didik menganalisis perjuangan mempertahankan kemerdekaan fisik dan diplomasi (1945-1950), masa Demokrasi Liberal dan Terpimpin, era Orde Baru, lahirnya Gerakan Reformasi 1998, serta peran diplomasi internasional Indonesia.',
  },
  'Matematika Tingkat Lanjut': {
    11: 'Peserta didik menguasai operasi fungsi polinomial dan teorema sisa, matriks dan operasi aljabar matriks, transformasi geometri dengan matriks, fungsi trigonometri analitik, serta lingkaran.',
    12: 'Peserta didik menganalisis limit fungsi trigonometri, limit di ketakhinggaan, turunan fungsi trigonometri dan aplikasinya, integral substitusi dan parsial, serta distribusi peluang binomial dan normal.',
  },
  'Antropologi': {
    11: 'Peserta didik memahami ruang lingkup antropologi ragawi dan budaya, konsep etnisitas dan kebudayaan, sistem kekerabatan masyarakat adat, serta dinamika folklor dan kearifan lokal nusantara.',
    12: 'Peserta didik menganalisis dinamika perubahan budaya akibat modernisasi dan digitalisasi, antropologi terapan dalam pembangunan sosial, serta kerukunan multikulturalisme di Indonesia.',
  },
  'Prakarya': {
    7: 'Peserta didik mengeksplorasi bahan serat alami dan tekstil, membuat produk kerajinan bernilai fungsi, serta merancang olahan pangan buah dan sayur lokal bernilai gizi.',
    8: 'Peserta didik memodifikasi bahan lunak dan limbah anorganik menjadi produk kriya bernilai jual, serta mengolah bahan pangan setengah jadi serealia dan umbi khas nusantara.',
    9: 'Peserta didik merancang produk rekayasa elektronika sederhana, kriya bahan keras alami/buatan (kayu, logam), budi daya ternak unggul, dan strategi wirausaha kemasan higienis modern.',
    10: 'Peserta didik merancang proposal wirausaha produk kriya/pangan lokal, analisis SWOT dan BEP sederhana, serta pemasaran produk berbasis platform digital kreatif.',
    11: 'Peserta didik memproduksi karya kriya inovatif bernilai ekspor, teknik pengawetan pangan nabati/hewani, serta segmentasi pasar dan manajemen keuangan usaha rintisan.',
    12: 'Peserta didik mendesain prototipe produk teknologi terapan fungsional, kemasan ramah lingkungan (ecopackaging), dan pameran inkubasi bisnis kewirausahaan mandiri.',
  },
  'Bahasa Indonesia': {
    1: 'Peserta didik menyimak instruksi lisan sederhana, membaca kata dan suku kata berpola terbuka/tertutup, serta menulis huruf tegak bersambung dan kalimat sederhana berakhiran tanda titik.',
    2: 'Peserta didik membaca nyaring teks pendek dengan intonasi tepat, menggunakan huruf kapital pada nama orang dan hari, menyusun kalimat tanya sederhana, serta menyampaikan pendapat lisan secara santun.',
    3: 'Peserta didik menemukan ide pokok teks deskripsi dan petunjuk sederhana, memperkaya kosakata baku, menulis paragraf pendek terstruktur, serta menceritakan kembali isi dongeng fabel secara runtut.',
    4: 'Peserta didik menganalisis ide pokok teks narasi dan petunjuk bertahap, membedakan kalimat fakta dan opini, menulis teks deskripsi pengalaman pribadi, serta menyimak wawancara sederhana.',
    5: 'Peserta didik menganalisis informasi tersurat dan tersirat dari teks eksplanasi ilmiah populer, menyampaikan pidato persuasif di depan kelas, serta menulis ringkasan laporan hasil pengamatan.',
    6: 'Peserta didik mengevaluasi teks argumentasi dan berita kritis, menyusun karya fiksi/nonfiksi pendek yang padu, menguasai pengisian formulir resmi, serta mengapresiasi majas personifikasi dan metafora.',
    7: 'Peserta didik menyimak, membaca, dan menganalisis teks deskripsi, cerita fantasi imajinatif, teks prosedur langkah berurutan, serta teks laporan hasil observasi (LHO) dengan bahasa runtut dan baku.',
    8: 'Peserta didik menganalisis struktur dan kaidah kebahasaan teks berita faktual, poster dan iklan persuasif, artikel ilmiah populer bertema sosial, serta mengapresiasi karya fiksi cerpen dan puisi kontemporer.',
    9: 'Peserta didik mengevaluasi teks laporan percobaan ilmiah, pidato persuasif di ruang publik, teks cerpen sarat nilai humaniora, serta teks tanggapan kritis terhadap isu sosial kemasyarakatan.',
    10: 'Peserta didik merekonstruksi teks laporan hasil observasi objektif, teks anekdot kritik sosial, komparasi teks hikayat sastra klasik dan cerpen, serta teks negosiasi dalam transaksi kesepakatan sosial.',
    11: 'Peserta didik menyusun karya ilmiah berbasis data faktual, menganalisis struktur teks eksplanasi kompleks, teks drama realis berlatar sosial, serta teks resensi buku fiksi dan nonfiksi argumentatif.',
    12: 'Peserta didik menyusun surat lamaran pekerjaan formal, menganalisis teks editorial/opini media massa, novel sastra Indonesia modern, serta menulis artikel ilmiah populer dan esai reflektif kritis.',
  },
  'Pendidikan Pancasila': {
    1: 'Peserta didik mengenal lambang Garuda Pancasila dan sila-silanya, menyebutkan contoh aturan di rumah dan sekolah, serta menghargai perbedaan fisik dan kegemaran teman di kelas.',
    2: 'Peserta didik menceritakan arti simbol-simbol sila Pancasila, menaati aturan musyawarah di kelas, serta mempraktikkan sikap saling tolong-menolong tanpa membedakan teman sebaya.',
    3: 'Peserta didik menerapkan nilai-nilai Pancasila dalam kegiatan gotong royong di lingkungan sekolah, memahami hak dan kewajiban siswa, serta menghargai keragaman tradisi lokal.',
    4: 'Peserta didik meneladani makna sila Pancasila dalam toleransi beragama dan suku bangsa, memahami norma hukum tertulis dan norma kesopanan, serta bangga terhadap identitas budaya daerah.',
    5: 'Peserta didik mendalami nilai sejarah perumusan Pancasila sebagai dasar negara, membedakan hak-kewajiban-tanggung jawab warga negara, serta aktif dalam pelestarian warisan budaya nusantara.',
    6: 'Peserta didik memahami Pancasila sebagai pandangan hidup bangsa, peran lembaga negara, menjaga keutuhan NKRI, serta menerapkan etika bermedia sosial dan toleransi global.',
    7: 'Peserta didik memahami sejarah kelahiran Pancasila oleh BPUPKI, menaati norma hukum dan kepatuhan sosial, serta merawat persatuan dalam keragaman suku, agama, dan antargolongan (SARA).',
    8: 'Peserta didik memahami kedudukan Pancasila sebagai dasar negara dan ideologi terbuka, tata urutan peraturan perundang-undangan nasional, serta mempraktikkan budaya musyawarah mufakat.',
    9: 'Peserta didik menganalisis dinamika penerapan Pancasila dari masa ke masa, pokok pikiran Pembukaan UUD NRI 1945, kedaulatan rakyat dan sistem demokrasi Indonesia, serta bela negara.',
    10: 'Peserta didik mendalami nilai-nilai Pancasila dalam kerangka praktik penyelenggaraan ketatanegaraan, substansi hak dan kewajiban asasi manusia, serta integrasi nasional dalam Bhinneka Tunggal Ika.',
    11: 'Peserta didik menganalisis sistem hukum dan peradilan di Indonesia, dinamika demokrasi Pancasila, peran diplomasi Indonesia dalam perdamaian dunia, serta memperkokoh persatuan NKRI.',
    12: 'Peserta didik mengevaluasi penanganan pelanggaran hak dan pengingkaran kewajiban warga negara, pengaruh kemajuan IPTEK terhadap keutuhan NKRI, dan etika geopolitik global.',
  },
  'IPS': {
    1: 'Peserta didik mengenal aneka profesi di lingkungan sekitar, rambu keselamatan dasar di jalan raya, serta mengenal jenis alat transportasi tradisional dan modern ramah anak.',
    2: 'Peserta didik mengenal peta pulau-pulau besar di Indonesia, ragam pakaian adat nusantara, serta tata krama berkunjung ke tempat umum dan fasilitas bersama.',
    3: 'Peserta didik mengenal keragaman suku bangsa di 38 provinsi Indonesia, rumah adat dan senjata tradisional, serta kisah perjuangan pahlawan perintis kemerdekaan.',
    4: 'Peserta didik memahami bentang alam Indonesia (pegunungan, danau, selat, laut), flora dan fauna endemik garis Wallace-Weber, serta peristiwa bersejarah Sumpah Pemuda.',
    5: 'Peserta didik memahami letak geografis benua dan samudra dunia, organisasi negara-negara sahabat ASEAN, pemanfaatan sumber daya alam berkelanjutan, dan interaksi ekonomi.',
    6: 'Peserta didik memahami sejarah diplomasi kemerdekaan RI, peran Indonesia di PBB dan kancah internasional, serta perkembangan teknologi komunikasi dan etika era digital global.',
    7: 'Peserta didik memahami profil negara-negara anggota ASEAN, wawasan nusantara kedaulatan maritim, pahlawan nasional, serta perkembangan sains dan teknologi abad 21.',
    8: 'Peserta didik menganalisis peran diplomasi Indonesia di kawasan Asia-Pasifik, peristiwa sejarah dunia penentu peradaban modern, serta literasi mitigasi bencana geologis nusantara.',
    9: 'Peserta didik mengevaluasi peran Indonesia di G20 dan PBB, perkembangan kecerdasan buatan, energi hijau masa depan, serta tantangan geopolitik global kontemporer.',
    10: 'Peserta didik mengkaji wawasan kebangsaan integratif, literasi sains internasional, sejarah diplomasi Konferensi Asia Afrika (KAA), serta perkembangan arsitektur ekonomi dunia.',
    11: 'Peserta didik menganalisis isu-isu SDGs global (perubahan iklim, transisi energi), hubungan internasional multilateral, serta geopolitik maritim Indo-Pasifik.',
    12: 'Peserta didik mengevaluasi literasi penalaran skolastik tingkat tinggi, wawasan hukum tata negara, tren disrupsi teknologi digital dan AI, serta kesiapan kepemimpinan global masa depan.',
  },
  'Pengetahuan Umum': {
    1: 'Peserta didik mengenal aneka profesi di lingkungan sekitar, rambu keselamatan dasar di jalan raya, serta mengenal jenis alat transportasi tradisional dan modern ramah anak.',
    2: 'Peserta didik mengenal peta pulau-pulau besar di Indonesia, ragam pakaian adat nusantara, serta tata krama berkunjung ke tempat umum dan fasilitas bersama.',
    3: 'Peserta didik mengenal keragaman suku bangsa di 38 provinsi Indonesia, rumah adat dan senjata tradisional, serta kisah perjuangan pahlawan perintis kemerdekaan.',
    4: 'Peserta didik memahami bentang alam Indonesia (pegunungan, danau, selat, laut), flora dan fauna endemik garis Wallace-Weber, serta peristiwa bersejarah Sumpah Pemuda.',
    5: 'Peserta didik memahami letak geografis benua dan samudra dunia, organisasi negara-negara sahabat ASEAN, pemanfaatan sumber daya alam berkelanjutan, dan energi baru terbarukan.',
    6: 'Peserta didik memahami sejarah diplomasi kemerdekaan RI, peran Indonesia di PBB dan kancah internasional, serta perkembangan teknologi komunikasi dan etika era digital global.',
    7: 'Peserta didik memahami profil negara-negara anggota ASEAN, wawasan nusantara kedaulatan maritim, pahlawan nasional, serta perkembangan sains dan teknologi abad 21.',
    8: 'Peserta didik menganalisis peran diplomasi Indonesia di kawasan Asia-Pasifik, peristiwa sejarah dunia penentu peradaban modern, serta literasi mitigasi bencana geologis nusantara.',
    9: 'Peserta didik mengevaluasi peran Indonesia di G20 dan PBB, perkembangan kecerdasan buatan, energi hijau masa depan, serta tantangan geopolitik global kontemporer.',
    10: 'Peserta didik mengkaji wawasan kebangsaan integratif, literasi sains internasional, sejarah diplomasi Konferensi Asia Afrika (KAA), serta perkembangan arsitektur ekonomi dunia.',
    11: 'Peserta didik menganalisis isu-isu SDGs global (perubahan iklim, transisi energi), hubungan internasional multilateral, serta geopolitik maritim Indo-Pasifik.',
    12: 'Peserta didik mengevaluasi literasi penalaran skolastik tingkat tinggi, wawasan hukum tata negara, tren disrupsi teknologi digital dan AI, serta kesiapan kepemimpinan global masa depan.',
  },
  'Bahasa Inggris': {
    1: 'Learners recognize and pronounce basic greetings, numbers 1-10, primary colors, and classroom objects through engaging songs, flashcards, and interactive games.',
    2: 'Learners express feelings and simple needs, count numbers 11-20, identify family members and animals, and follow simple two-step classroom commands.',
    3: 'Learners describe daily routines and telling time on the clock, express likes and dislikes for food/drinks, and ask simple yes/no questions using basic present tense.',
    4: 'Learners describe people’s physical appearance, clothes, and favorite hobbies, comprehend short illustrated paragraphs, and talk about weather conditions.',
    5: 'Learners engage in dialogues asking for directions, ordering food at a canteen, talk about past experiences using simple past tense, and write short descriptive sentences.',
    6: 'Learners read short narrative stories and informational texts, express future plans using "going to", write friendly messages, and explain basic comparisons (bigger, smaller).',
    7: 'Learners introduce themselves and others in formal and informal registers, describe hobbies, daily routines, school subjects, and ask for and give personal information.',
    8: 'Learners comprehend and compose recount texts of memorable past experiences, sequential notice/imperative procedures, and express compliments and constructive opinions.',
    9: 'Learners critically evaluate narrative folk tales and legends, scientific procedure manuals, factual report texts on nature, and express future wishes, hopes, and congratulations.',
    10: 'Learners comprehend and write descriptive texts of world monuments and tourist spots, recount historical milestones, and express future intentions with precision.',
    11: 'Learners analyze and produce analytical exposition essays on environmental and societal challenges, cause-effect academic arguments, and active-passive voice transformations.',
    12: 'Learners critically evaluate news items and editorial discourses, formal job application letters with curriculum vitae, balanced discussion texts, and conduct structured debates.',
  },
  'PJOK': {
    1: 'Peserta didik mempraktikkan pola gerak dasar lokomotor (berjalan, berlari, melompat) dan non-lokomotor, serta membiasakan mencuci tangan dan postur berdiri tegak.',
    2: 'Peserta didik mengombinasikan gerak lokomotor dan non-lokomotor dalam permainan tradisional sederhana (kucing-tikus, gobak sodor) dan melatih kelenturan tubuh.',
    3: 'Peserta didik mempraktikkan gerak manipulatif (melempar, menangkap, menendang bola), senam lantai ketangkasan sederhana, serta pembiasaan istirahat dan tidur sehat.',
    4: 'Peserta didik mengombinasikan pola gerak dasar dalam permainan bola kecil (kasti) dan bola besar (sepak bola mini/voli mini), serta memahami pertolongan pertama luka lecet.',
    5: 'Peserta didik menerapkan taktik gerak olahraga beregu, senam irama ritmik berpasangan, teknik dasar renang gaya dada, serta memahami bahaya merokok dan zat adiktif.',
    6: 'Peserta didik menganalisis dan mempraktikkan keterampilan kebugaran jasmani (daya tahan, kekuatan, kelincahan), keselamatan aktivitas di air, serta pencegahan cedera olahraga dan perundungan.',
    7: 'Peserta didik menganalisis keterampilan gerak spesifik permainan bola besar (sepak bola, bola basket, voli) dan atletik lari jarak pendek, serta prinsip gizi seimbang remaja.',
    8: 'Peserta didik menganalisis variasi gerak spesifik beladiri pencak silat, senam lantai guling lenting, dan menjaga pola hidup sehat dari bahaya penyakit menular.',
    9: 'Peserta didik merancang program latihan kebugaran jasmani terukur (daya tahan aerobik dan kelincahan), keselamatan aktivitas di alam terbuka, dan pencegahan pergaulan bebas.',
    10: 'Peserta didik menganalisis taktik dan strategi penyerangan/pertahanan permainan olahraga beregu, senam aerobik artistik, dan pemahaman pencegahan zat psikotropika narkoba.',
    11: 'Peserta didik merancang dan mempraktikkan program latihan kebugaran jasmani berbasis komponen fisik spesifik, teknik penyelamatan diri di air, dan manajemen stres positif.',
    12: 'Peserta didik mengevaluasi konsep gaya hidup sehat berkelanjutan, pertolongan pertama pada kedaruratan fisik (P3K lanjutan), dan pembiasaan aktivitas fisik seumur hidup.',
  },
  'Seni Rupa': {
    1: 'Peserta didik bereksplorasi dengan unsur rupa garis tebal/tipis, bentuk geometris sederhana, dan warna primer melalui kegiatan menggambar ekspresi bebas.',
    2: 'Peserta didik mencampurkan warna primer menjadi sekunder, menciptakan pola cetak sederhana dari pelepah pisang/daun, dan membuat bentuk hewan/bunga dari plastisin.',
    3: 'Peserta didik merancang komposisi ritme visual, menciptakan karya kolase dari bahan alam sekitar, dan membuat karya dekoratif dua dimensi bertema flora-fauna.',
    4: 'Peserta didik menerapkan prinsip proporsi dan simetri dalam menggambar rumah adat, merancang motif ragam hias batik nusantara, serta membuat karya topeng kertas tiga dimensi.',
    5: 'Peserta didik merancang karya gambar perspektif satu titik hilang, membuat desain poster edukatif peduli lingkungan hidup, dan mengolah limbah plastik menjadi kriya kreatif.',
    6: 'Peserta didik merancang komposisi visual bermakna dengan prinsip keseimbangan dan kontras, membuat instalasi seni terapan, serta mengapresiasi karya seni rupa maestro Indonesia.',
    7: 'Peserta didik menerapkan unsur dan prinsip seni rupa dalam menggambar alam benda dan ragam hias fauna, serta membuat produk kriya bahan lunak berbasis kearifan lokal.',
    8: 'Peserta didik menggambar model manusia dengan proporsi tepat, membuat ilustrasi komik pendek edukatif, dan merancang desain poster digital persuasif.',
    9: 'Peserta didik melukis ekspresif berbagai media cat, membuat karya patung tiga dimensi dari tanah liat/semen, serta menyelenggarakan pameran karya seni kelas.',
    10: 'Peserta didik menganalisis konsep dan teknik berkarya seni rupa dua dimensi dan tiga dimensi, serta mengapresiasi nilai estetis karya seni lukis mancanegara.',
    11: 'Peserta didik merancang karya seni rupa kontemporer eksperimental, teknik cetak tinggi/sablon grafis, dan menyusun ulasan kritik seni rupa komparatif.',
    12: 'Peserta didik merancang kurasi dan tata pameran seni rupa modern, mengapresiasi seni instalasi, serta mengkaji keterkaitan seni rupa dengan industri kreatif visual.',
  },
  'Seni Musik': {
    1: 'Peserta didik mengenali pola irama konstan, membedakan bunyi tinggi-rendah dan panjang-pendek, serta menyanyikan lagu anak-anak bertempo santai dengan gembira.',
    2: 'Peserta didik memainkan pola irama ritmis sederhana menggunakan tepukan tangan/alat musik perkusi botol, serta membaca birama 2/4 dan 3/4 dengan tepat.',
    3: 'Peserta didik menyanyikan lagu wajib nasional dan lagu daerah dengan dinamika keras-lembut, serta membaca simbol notasi angka dasar 1 (do) hingga 5 (sol).',
    4: 'Peserta didik memainkan alat musik melodis sederhana (pianika/rekorder) dengan teknik penjarian dasar, serta bernyanyi secara serempak dan kanon dalam kelompok kecil.',
    5: 'Peserta didik memainkan ansambel musik campuran sederhana, mengapresiasi kekayaan alat musik tradisional nusantara (angklung, kolintang, gamelan), dan menyanyikan lagu daerah dua suara.',
    6: 'Peserta didik mengaransemen pola irama lagu sederhana, menampilkan pagelaran musik ansambel tematik kelas, serta mengapresiasi tokoh komponis nasional Indonesia.',
    7: 'Peserta didik bernyanyi secara unisono dan vokal grup lagu daerah dengan artikulasi tepat, serta memainkan instrumen musik tradisional nusantara secara harmonis.',
    8: 'Peserta didik mengidentifikasi tangga nada dan akord dasar musik populer nusantara, membaca notasi balok birama sederhana, serta menyajikan ansambel musik campuran.',
    9: 'Peserta didik mengaransemen lagu populer ke dalam paduan suara dua-tiga suara, memainkan karya musik ansambel kontemporer, dan mengapresiasi karya musisi legendaris.',
    10: 'Peserta didik menganalisis harmoni tangga nada diatonis dan pentatonis, teknik vokal solo/duet, serta mengapresiasi nilai estetis karya musik nusantara dan barat.',
    11: 'Peserta didik mengaransemen lagu tradisional ke format musik modern, memainkan instrumen akor pengiring, serta menganalisis genre musik jazz, klasik, dan pop.',
    12: 'Peserta didik merancang manajemen pagelaran konser musik sekolah, teknik rekaman audio digital sederhana, serta mengapresiasi etika hak cipta industri musik.',
  },
  'Informatika': {
    1: 'Peserta didik mengenali berbagai piranti teknologi informasi di sekitar (komputer, ponsel, tablet), membiasakan jarak pandang layar yang aman, dan memahami aturan penggunaan gawai.',
    2: 'Peserta didik mengenal perangkat input sederhana (mouse dan papan tombol), mempraktikkan cara menyalakan/mematikan komputer dengan benar, dan menyusun urutan langkah instruksi logis (algoritma sehari-hari).',
    3: 'Peserta didik memahami konsep computational thinking (dekomposisi masalah sederhana), mengenal antarmuka sistem operasi ramah anak, dan membedakan ikon aplikasi edukasi.',
    4: 'Peserta didik mengoperasikan perangkat lunak pengolah kata sederhana (mengetik teks dan mengganti warna/ukuran huruf), serta memahami etika kesopanan saat berkomunikasi digital.',
    5: 'Peserta didik mengolah data angka dan grafik sederhana menggunakan aplikasi lembar kerja (spreadsheet), mencari informasi edukatif aman di internet, dan mengenali bahaya hoaks.',
    6: 'Peserta didik memahami logika pemrograman visual berbasis blok (Scratch/Blockly), merancang animasi atau kuis interaktif sederhana, serta memahami pentingnya perlindungan privasi dan kata sandi.',
    7: 'Peserta didik memahami computational thinking (algoritma sekuensial), arsitektur perangkat keras dan lunak, topologi jaringan internet dasar, serta analisis data spreadsheet.',
    8: 'Peserta didik menerapkan algoritma searching dan sorting visual, representasi data bilangan biner, keamanan sandi dan etika berinternet, serta pemrograman visual interaktif modular.',
    9: 'Peserta didik merancang algoritma modular bercabang dan berulang, integrasi aplikasi perkantoran, analisis big data dasar, serta pengantar sintaks pemrograman tekstual (Python).',
    10: 'Peserta didik menerapkan berpikir komputasional dengan bahasa Python (variabel, percabangan, perulangan, fungsi), analisis data digital, dan etika privasi kecerdasan buatan (AI).',
    11: 'Peserta didik menguasai konsep pemrograman berorientasi objek (OOP), basis data relasional dan query SQL, arsitektur jaringan TCP/IP, serta pertahanan keamanan siber.',
    12: 'Peserta didik merancang proyek pengembangan aplikasi (web atau aplikasi bergerak), konsep machine learning dasar, serta analisis dampak sosial transformasi digital masyarakat 5.0.',
  },
  'Pendidikan Agama Islam': {
    1: 'Peserta didik mengenal rukun iman dan rukun Islam, huruf hijaiyah berharakat tunggal (fathah, kasrah, dammah), melafalkan Surah Al-Fatihah, dan adab berdoa sebelum/sesudah makan.',
    2: 'Peserta didik melafalkan Surah An-Nas dan Al-Falaq, memahami asmaul husna (Ar-Rahman, Ar-Rahim, Al-Malik), serta mempraktikkan tata cara wudu secara berurutan dan tertib.',
    3: 'Peserta didik memahami makna salat fardu lima waktu beserta bacaannya, melafalkan Surah Al-Kausar dan Al-Ikhlas, serta meneladani sifat jujur dan amanah Nabi Muhammad SAW.',
    4: 'Peserta didik memahami makna asmaul husna Al-Basir dan Al-Adl, ketentuan bersuci dari hadas kecil, membaca Surah At-Tin dengan tartil, dan menghargai keragaman teman sebaya.',
    5: 'Peserta didik mendalami makna ibadah puasa Ramadan dan salat tarawih, melafalkan Surah Al-Ma\'un dengan tajwid, dan meneladani keteguhan Nabi Ibrahim AS dan Nabi Ismail AS.',
    6: 'Peserta didik memahami makna zakat fitrah, infak, sedekah, mendalami Surah Al-Kafirun tentang toleransi beragama, serta meneladani sifat kepemimpinan Khulafaur Rasyidin.',
    7: 'Peserta didik membaca Al-Qur\'an dengan hukum tajwid alif lam syamsiyah/qamariyah, meneladani sifat amanah dan istikamah, serta memahami tata cara salat berjemaah dan sujud syukur.',
    8: 'Peserta didik mengkaji hukum bacaan mad dan waqaf, mendalami sifat tawakal dan ikhtiar, fikih sujud sahwi dan sujud tilawah, serta sejarah keemasan Daulah Abbasiyah.',
    9: 'Peserta didik mendalami hukum tajwid qalqalah dan ghunnah, aqidah hari akhir, fikih penyembelihan kurban dan akikah, serta sejarah masuknya Islam ke Indonesia via Wali Songo.',
    10: 'Peserta didik mengkaji tafsir Surah Al-Hujurat tentang ukhuwah dan toleransi, asmaul husna Al-Karim dan Al-Mu\'min, fikih muamalah perbankan syariah, serta sejarah peradaban Islam.',
    11: 'Peserta didik menganalisis hukum tajwid ra dan lam jalalah, iman kepada kitab-kitab Allah, fikih jenazah, khotbah, dan dakwah, serta peran tokoh pembaruan Islam modern.',
    12: 'Peserta didik mengevaluasi konsep qadha dan qadar, adab berfikir kritis dan musyawarah (Surah Ali Imran 190-191), fikih pernikahan dalam Islam, mawaris/waris, dan etika kepemimpinan adil.',
  },
  'Bahasa Daerah': {
    1: 'Peserta didik menyimak sapaan santun daerah, mengenal nama anggota tubuh dan panggilan keluarga dalam bahasa daerah, serta melantunkan tembang dolanan anak bersama teman.',
    2: 'Peserta didik membaca teks pendek bahasa daerah bertema kebersihan rumah, menggunakan tingkatan bahasa santun kepada orang tua, dan menyebutkan nama-nama anak hewan dalam bahasa daerah.',
    3: 'Peserta didik memahami makna tembang macapat/lagu daerah sederhana, menceritakan kembali dongeng fabel daerah, serta melengkapi kalimat rumpang bahasa daerah.',
    4: 'Peserta didik memahami unggah-ungguh basa saat berbicara di sekolah, mengartikan paribasan/peribahasa daerah bertema budi pekerti, dan membaca teks cerita rakyat daerah.',
    5: 'Peserta didik menganalisis watak tokoh dalam teks wayang/cerita kepahlawanan lokal, menulis karangan narasi pengalaman pribadi dalam bahasa daerah, dan melantunkan parikan/pantun daerah.',
    6: 'Peserta didik mengenal lambang aksara tradisional daerah dasar (legena/sandhangan), membaca teks bertuliskan aksara daerah pendek, dan mengapresiasi seni pidato/sesorah adat daerah.',
    7: 'Peserta didik menganalisis teks cerita legenda nusantara berbahasa daerah, menerapkan unggah-ungguh basa kepada orang lebih tua, dan menulis tembang macapat/pantun daerah sederhana.',
    8: 'Peserta didik menelaah teks pawarta/berita berbahasa daerah, mengapresiasi dialog drama komedi tradisional, dan menulis kalimat beraksara daerah dengan pasangan/sandhangan.',
    9: 'Peserta didik mengevaluasi naskah pidato/pratama sesorah adat berbahasa daerah, menganalisis nilai filosofis karya sastra klasik daerah, dan menulis teks narasi budaya.',
    10: 'Peserta didik mengkaji teks adat istiadat kearifan lokal (upacara adat), tata krama komunikasi bahasa krama/tinggi, serta transliterasi teks aksara tradisional kuno.',
    11: 'Peserta didik menganalisis karya sastra sandiwara/ketoprak/lenong berbahasa daerah, menulis artikel opini budaya daerah, dan mengkaji falsafah tembang adiluhung.',
    12: 'Peserta didik menyusun naskah pranatacara (pembawa acara) resmi adat berbahasa daerah, mengapresiasi puisi/geguritan modern, serta pelestarian warisan linguistik daerah.',
  }
};

const getFallbackGradeCp = (subj: Subject, grd: number, level?: EducationLevel): string => {
  const effectiveLevel = level || (grd >= 10 ? 'SMA' : grd >= 7 ? 'SMP' : 'SD');
  if (effectiveLevel === 'SMA' || grd >= 10) {
    return `Peserta didik menganalisis dan mengevaluasi konsep esensial ${subj} Kelas ${grd} SMA / SMK secara kritis, mandiri, serta menerapkan penalaran tingkat tinggi (HOTS) dalam memecahkan masalah kontekstual.`;
  }
  if (effectiveLevel === 'SMP' || grd >= 7) {
    return `Peserta didik mendalami konsep inti, menghubungkan prinsip ilmiah dan relasi sebab-akibat, serta mengomunikasikan pemahaman materi ${subj} Kelas ${grd} SMP secara runtut dan terpadu.`;
  }
  if (grd === 1) {
    return `Peserta didik mengenal konsep dasar, simbol konkret, dan pembiasaan eksplorasi rasa ingin tahu ramah anak dalam materi ${subj} Kelas 1 SD.`;
  }
  if (grd === 2) {
    return `Peserta didik mempraktikkan keterampilan awal, merespons instruksi terarah, dan bekerja sama secara santun dalam aktivitas materi ${subj} Kelas 2 SD.`;
  }
  if (grd === 3) {
    return `Peserta didik memperkuat pemahaman konsep materi ${subj} Kelas 3 SD melalui observasi lingkungan, latihan terbimbing, dan penerapan logika dasar.`;
  }
  if (grd === 4) {
    return `Peserta didik mengembangkan kemampuan klasifikasi, analisis bertahap, dan pemecahan masalah kontekstual dalam materi ${subj} Kelas 4 SD.`;
  }
  if (grd === 5) {
    return `Peserta didik mendalami konsep materi ${subj} Kelas 5 SD secara analitis, menghubungkan sebab-akibat, dan menyusun laporan terstruktur.`;
  }
  return `Peserta didik mengevaluasi konsep materi ${subj} secara terpadu, menarik kesimpulan logis, serta menyajikan solusi kreatif dalam materi ${subj} Kelas 6 SD.`;
};

const getSubjectCp = (subj: Subject, grd: number, level?: EducationLevel): string => {
  const effectiveSubj = (subj === 'Pengetahuan Umum' ? 'IPS' : subj) as Subject;
  const gradeEntry = GRADE_SPECIFIC_CP[effectiveSubj] || GRADE_SPECIFIC_CP[subj];
  if (gradeEntry && gradeEntry[grd]) {
    return gradeEntry[grd];
  }
  return getFallbackGradeCp(effectiveSubj, grd, level);
};

const getGradeCpVariant = (subj: Subject, grd: number, variant: number, level?: EducationLevel): string => {
  const base = getSubjectCp(subj, grd, level);
  const effectiveLevel = level || (grd >= 10 ? 'SMA' : grd >= 7 ? 'SMP' : 'SD');
  const levelLabel = effectiveLevel === 'SMA' ? 'SMA / SMK' : effectiveLevel === 'SMP' ? 'SMP' : 'SD';
  if (variant === 1) {
    return `${base} Peserta didik didorong untuk mengaplikasikan pemahaman ini dalam proyek eksplorasi terapan dan pemecahan masalah kontekstual sehari-hari.`;
  }
  if (variant === 2) {
    return `${base} Fokus pembelajaran ditekankan pada penguatan nalar kritis, kemampuan berkolaborasi, dan kemandirian belajar siswa Kelas ${grd} ${levelLabel}.`;
  }
  return base;
};

const getPhaseInfo = (
  grd: number,
  level?: EducationLevel
): { phase: string; title: string; desc: string } => {
  const effectiveLevel = level || (grd >= 10 ? 'SMA' : grd >= 7 ? 'SMP' : 'SD');
  if (effectiveLevel === 'SMA' || grd >= 10) {
    if (grd === 10) {
      return { phase: 'Fase E', title: 'Fondasi Peminatan', desc: 'Kelas 10 SMA / SMK' };
    }
    return { phase: 'Fase F', title: 'Pendalaman & HOTS', desc: `Kelas ${grd} SMA / SMK` };
  }
  if (effectiveLevel === 'SMP' || grd >= 7) {
    return { phase: 'Fase D', title: 'Eksplorasi & Logika Kritis', desc: `Kelas ${grd} SMP` };
  }
  if (grd <= 2) return { phase: 'Fase A', title: 'Fondasi Awal', desc: 'Kelas 1 & 2 SD' };
  if (grd <= 4) return { phase: 'Fase B', title: 'Penguatan Konsep', desc: 'Kelas 3 & 4 SD' };
  return { phase: 'Fase C', title: 'Penalaran Lanjut', desc: 'Kelas 5 & 6 SD' };
};

interface SubjectCatalogItem {
  id: Subject;
  name: string;
  emoji: string;
  desc: string;
}

interface SubjectCategoryGroup {
  name: string;
  items: SubjectCatalogItem[];
}

const getSubjectCatalogGroups = (level: EducationLevel): SubjectCategoryGroup[] => {
  if (level === 'SMP') {
    return [
      {
        name: 'Mata Pelajaran Inti SMP',
        items: [
          { id: 'IPA Terpadu', name: 'IPA Terpadu', emoji: '🔬', desc: 'Fisika, Biologi, Kimia Terpadu SMP' },
          { id: 'Matematika', name: 'Matematika', emoji: '📐', desc: 'Aljabar, Geometri, Teorema Pythagoras & Statistika' },
          { id: 'Bahasa Indonesia', name: 'Bahasa Indonesia', emoji: '📚', desc: 'Teks Prosedur, LHO, Berita, Resensi & Cerpen' },
          { id: 'Bahasa Inggris', name: 'Bahasa Inggris', emoji: '🇬🇧', desc: 'Recount, Narrative, Procedure & Daily Dialogues' },
          { id: 'IPS Terpadu', name: 'IPS Terpadu', emoji: '🌍', desc: 'Geografi, Sejarah, Sosiologi & Ekonomi Terpadu' },
        ],
      },
      {
        name: 'Teknologi, Terapan & Keterampilan',
        items: [
          { id: 'Informatika', name: 'Informatika', emoji: '💻', desc: 'Computational Thinking, Algoritma, Data & Koding' },
          { id: 'Prakarya', name: 'Prakarya & Kewirausahaan', emoji: '✂️', desc: 'Kerajinan, Rekayasa, Budi Daya & Pengolahan' },
        ],
      },
      {
        name: 'Pendidikan Karakter, Jasmani & Agama',
        items: [
          { id: 'Pendidikan Pancasila', name: 'Pendidikan Pancasila', emoji: '🇮🇩', desc: 'Konstitusi, Demokrasi, Norma & Nilai Kebangsaan' },
          { id: 'PJOK', name: 'PJOK', emoji: '⚽', desc: 'Kebugaran, Atletik, Olahraga Beregu & Kesehatan Remaja' },
          { id: 'Pendidikan Agama Islam', name: 'Pendidikan Agama Islam (PAI)', emoji: '🕌', desc: 'Akidah Akhlak, Fikih, Sejarah Kebudayaan Islam' },
          { id: 'Pendidikan Agama Kristen', name: 'Pendidikan Agama Kristen', emoji: '✝️', desc: 'Nilai Kristiani, Iman & Keteladanan Remaja' },
          { id: 'Pendidikan Agama Katolik', name: 'Pendidikan Agama Katolik', emoji: '⛪', desc: 'Gereja, Moralitas & Liturgi' },
          { id: 'Pendidikan Agama Hindu', name: 'Pendidikan Agama Hindu', emoji: '🕉️', desc: 'Dharma, Tattwa & Etika Hindu' },
          { id: 'Pendidikan Agama Buddha', name: 'Pendidikan Agama Buddha', emoji: '☸️', desc: 'Dharma, Sila & Meditasi' },
          { id: 'Pendidikan Agama Konghucu', name: 'Pendidikan Agama Konghucu', emoji: '⛩️', desc: 'Kitab Sishu & Kebajikan Remaja' },
        ],
      },
      {
        name: 'Seni, Bahasa & Wawasan',
        items: [
          { id: 'Seni Rupa', name: 'Seni Rupa', emoji: '🎨', desc: 'Gambar Bentuk, Ilustrasi & Kriya Kreatif' },
          { id: 'Seni Musik', name: 'Seni Musik', emoji: '🎵', desc: 'Vokal Grup, Akord & Musik Tradisional' },
          { id: 'Seni Tari', name: 'Seni Tari', emoji: '💃', desc: 'Koreografi Tari Kreasi & Tradisi' },
          { id: 'Seni Teater', name: 'Seni Teater', emoji: '🎭', desc: 'Tata Panggung, Pantomim & Naskah Drama' },
          { id: 'Bahasa Daerah', name: 'Bahasa Daerah / Mulok', emoji: '🗣️', desc: 'Sastra, Unggah-Ungguh & Budaya Lokal' },
          { id: 'Pengetahuan Umum', name: 'Pengetahuan Umum', emoji: '💡', desc: 'Wawasan Nusantara & Isu Global' },
        ],
      },
    ];
  }

  if (level === 'SMA') {
    return [
      {
        name: 'Peminatan MIPA (Sains & Matematika)',
        items: [
          { id: 'Matematika', name: 'Matematika Umum', emoji: '📐', desc: 'Eksponen, Barisan, Vektor & Trigonometri' },
          { id: 'Matematika Tingkat Lanjut', name: 'Matematika Tingkat Lanjut', emoji: '♾️', desc: 'Kalkulus, Polinomial, Matriks & Vektor Lanjut' },
          { id: 'Fisika', name: 'Fisika', emoji: '⚛️', desc: 'Mekanika, Termodinamika, Gelombang & Optik' },
          { id: 'Kimia', name: 'Kimia', emoji: '🧪', desc: 'Stoikiometri, Ikatan Kimia, Asam-Basa & Redoks' },
          { id: 'Biologi', name: 'Biologi', emoji: '🧬', desc: 'Sel, Genetika, Metabolisme & Bioteknologi' },
          { id: 'Informatika', name: 'Informatika Lanjut', emoji: '💻', desc: 'OOP, Basis Data SQL, Algoritma & AI Ethics' },
        ],
      },
      {
        name: 'Peminatan IPS & Humaniora',
        items: [
          { id: 'Ekonomi', name: 'Ekonomi & Akuntansi', emoji: '📈', desc: 'Pasar, Moneter-Fiskal, Siklus Akuntansi & Bisnis' },
          { id: 'Sosiologi', name: 'Sosiologi', emoji: '👥', desc: 'Struktur Sosial, Konflik, Perubahan Sosial & Riset' },
          { id: 'Geografi', name: 'Geografi', emoji: '🗺️', desc: 'SIG, Litosfer, Tata Ruang & Geopolitik Dunia' },
          { id: 'Sejarah', name: 'Sejarah', emoji: '🏛️', desc: 'Pergerakan Nasional, Kemerdekaan & Sejarah Dunia' },
          { id: 'Antropologi', name: 'Antropologi', emoji: '🏺', desc: 'Etnografi, Budaya Nusantara & Dinamika Sosial' },
        ],
      },
      {
        name: 'Mata Pelajaran Wajib Umum',
        items: [
          { id: 'Bahasa Indonesia', name: 'Bahasa Indonesia', emoji: '📚', desc: 'Artikel Ilmiah, Esai Kritis, Teks Editorial & Novel' },
          { id: 'Bahasa Inggris', name: 'Bahasa Inggris', emoji: '🇬🇧', desc: 'Analytical Exposition, Discussion & Argumentation' },
          { id: 'Pendidikan Pancasila', name: 'Pendidikan Pancasila', emoji: '🇮🇩', desc: 'Hukum Positif, HAM, Ideologi & Geopolitik' },
          { id: 'PJOK', name: 'PJOK', emoji: '⚽', desc: 'Manajemen Kebugaran, Taktik Olahraga & Gaya Hidup' },
          { id: 'Pengetahuan Umum', name: 'Pengetahuan Umum & HOTS', emoji: '💡', desc: 'Wawasan Kebangsaan, Literasi Sains & Skolastik' },
        ],
      },
      {
        name: 'Seni, Terapan, Bahasa & Agama',
        items: [
          { id: 'Seni Rupa', name: 'Seni Rupa', emoji: '🎨', desc: 'Kritik Seni, Desain Komunikasi Visual & Pameran' },
          { id: 'Seni Musik', name: 'Seni Musik', emoji: '🎵', desc: 'Harmoni Musik Barat/Tradisional & Komposisi' },
          { id: 'Seni Tari', name: 'Seni Tari', emoji: '💃', desc: 'Koreografi Kontemporer & Analisis Tari' },
          { id: 'Seni Teater', name: 'Seni Teater', emoji: '🎭', desc: 'Dramaturgi, Directing & Pementasan' },
          { id: 'Prakarya', name: 'Prakarya & Kewirausahaan', emoji: '✂️', desc: 'Business Plan, Desain Produk & Inkubasi Usaha' },
          { id: 'Bahasa Daerah', name: 'Bahasa Daerah / Sastra', emoji: '🗣️', desc: 'Filologi, Aksara Kuno & Sastra Klasik Daerah' },
          { id: 'Pendidikan Agama Islam', name: 'Pendidikan Agama Islam (PAI)', emoji: '🕌', desc: 'Kajian Tafsir Hadis, Ushul Fikih & Peradaban' },
          { id: 'Pendidikan Agama Kristen', name: 'Pendidikan Agama Kristen', emoji: '✝️', desc: 'Etika Kristen, Teologi Praktis & Pelayanan' },
          { id: 'Pendidikan Agama Katolik', name: 'Pendidikan Agama Katolik', emoji: '⛪', desc: 'Ajaran Sosial Gereja & Moralitas Kristiani' },
          { id: 'Pendidikan Agama Hindu', name: 'Pendidikan Agama Hindu', emoji: '🕉️', desc: 'Filsafat Hindu & Yoga Asanas' },
          { id: 'Pendidikan Agama Buddha', name: 'Pendidikan Agama Buddha', emoji: '☸️', desc: 'Tripitaka & Kebajikan Bodhisattva' },
          { id: 'Pendidikan Agama Konghucu', name: 'Pendidikan Agama Konghucu', emoji: '⛩️', desc: 'Etika Ru Jiao & Harmoni Semesta' },
        ],
      },
    ];
  }

  // Default SD
  return [
    {
      name: 'Mata Pelajaran Wajib Utama',
      items: [
        { id: 'Matematika', name: 'Matematika', emoji: '📐', desc: 'Aritmetika, Geometri, Pecahan & Logika' },
        { id: 'IPA', name: 'IPA (Sains)', emoji: '🌱', desc: 'Alam, Makhluk Hidup, Energi & Wujud Zat' },
        { id: 'IPAS', name: 'IPAS (Fase B & C)', emoji: '🌿', desc: 'Integrasi Sains dan Ilmu Sosial Tematik SD' },
        { id: 'IPS', name: 'IPS (Ilmu Pengetahuan Sosial)', emoji: '🌍', desc: 'Geografi Lingkungan, Sejarah Lokal, Sosial & Budaya' },
        { id: 'Bahasa Indonesia', name: 'Bahasa Indonesia', emoji: '📚', desc: 'Literasi, Teks, Membaca & Kosakata' },
        { id: 'Pendidikan Pancasila', name: 'Pendidikan Pancasila', emoji: '🇮🇩', desc: 'Karakter, Norma, Toleransi & NKRI' },
      ],
    },
    {
      name: 'Bahasa & Literasi',
      items: [
        { id: 'Bahasa Inggris', name: 'Bahasa Inggris', emoji: '🇬🇧', desc: 'Vocabulary, Grammar & Reading Comprehension' },
        { id: 'Bahasa Daerah', name: 'Bahasa Daerah / Mulok', emoji: '🗣️', desc: 'Aksara, Unggah-Ungguh & Sastra Lokal' },
      ],
    },
    {
      name: 'Jasmani & Olahraga',
      items: [
        { id: 'PJOK', name: 'PJOK', emoji: '⚽', desc: 'Pendidikan Jasmani, Olahraga & Pola Hidup Sehat' },
      ],
    },
    {
      name: 'Seni & Kebudayaan',
      items: [
        { id: 'Seni Rupa', name: 'Seni Rupa', emoji: '🎨', desc: 'Menggambar, Warna, Ragam Hias & Patung' },
        { id: 'Seni Musik', name: 'Seni Musik', emoji: '🎵', desc: 'Irama, Notasi Angka, Lagu Wajib & Ansambel' },
        { id: 'Seni Tari', name: 'Seni Tari', emoji: '💃', desc: 'Pola Lantai, Gerak Ritmik & Tari Daerah' },
        { id: 'Seni Teater', name: 'Seni Teater', emoji: '🎭', desc: 'Ekspresi Emosi, Pantomim & Seni Peran' },
      ],
    },
    {
      name: 'Pendidikan Agama & Budi Pekerti',
      items: [
        { id: 'Pendidikan Agama Islam', name: 'Pendidikan Agama Islam (PAI)', emoji: '🕌', desc: 'Akidah, Akhlak, Fikih, Al-Qur\'an & Sejarah' },
        { id: 'Pendidikan Agama Kristen', name: 'Pendidikan Agama Kristen', emoji: '✝️', desc: 'Ajaran Kasih, Alkitab & Keteladanan Kristiani' },
        { id: 'Pendidikan Agama Katolik', name: 'Pendidikan Agama Katolik', emoji: '⛪', desc: 'Sakramen, Liturgi & Nilai Kehidupan Kristiani' },
        { id: 'Pendidikan Agama Hindu', name: 'Pendidikan Agama Hindu', emoji: '🕉️', desc: 'Panca Sradha, Tri Kaya Parisudha & Kitab Weda' },
        { id: 'Pendidikan Agama Buddha', name: 'Pendidikan Agama Buddha', emoji: '☸️', desc: 'Triratna, Empat Kebenaran Mulia & Karma' },
        { id: 'Pendidikan Agama Konghucu', name: 'Pendidikan Agama Konghucu', emoji: '⛩️', desc: 'Ajaran Bakhti, Kebajikan (Ren) & Kitab Suci' },
      ],
    },
    {
      name: 'Teknologi & Literasi Digital',
      items: [
        { id: 'Informatika', name: 'Informatika / Literasi Digital', emoji: '💻', desc: 'Perangkat Digital, Etika Internet & Logika Koding' },
      ],
    },
  ];
};

export const AiGeneratorStep: React.FC<AiGeneratorStepProps> = ({
  onGenerated,
  onBack: _onBack,
  playClick,
  initialSubject = 'Matematika',
  initialGrade = 3,
  initialEducationLevel,
  stage,
  onStageChange,
  topic,
  onTopicChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const topicTextareaRef = useRef<HTMLTextAreaElement>(null);
  const contextNotesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Otomatis sesuaikan tinggi textarea topik agar teks panjang selalu wrap ke bawah dan terbaca utuh
  useEffect(() => {
    if (topicTextareaRef.current) {
      topicTextareaRef.current.style.height = 'auto';
      topicTextareaRef.current.style.height = `${Math.max(46, topicTextareaRef.current.scrollHeight)}px`;
    }
  }, [topic, stage]);

  // Selalu reset posisi scroll ke paling atas dan kembalikan fokus saat tahapan funnel berubah
  useEffect(() => {
    const resetScrollAndFocus = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (containerRef.current) {
        containerRef.current.focus({ preventScroll: true });
      }
    };

    resetScrollAndFocus();
    const rafId = requestAnimationFrame(() => {
      resetScrollAndFocus();
    });
    return () => cancelAnimationFrame(rafId);
  }, [stage]);

  const [educationLevel, setEducationLevel] = useState<EducationLevel>(() => {
    if (initialEducationLevel) return initialEducationLevel;
    if (initialGrade) {
      if (initialGrade >= 10) return 'SMA';
      if (initialGrade >= 7) return 'SMP';
      return 'SD';
    }
    try {
      const saved = localStorage.getItem('kuis_last_education_level') as EducationLevel;
      if (saved === 'SD' || saved === 'SMP' || saved === 'SMA') return saved;
    } catch {
      // noop
    }
    return 'SD';
  });

  const [subject, setSubject] = useState<Subject>(() => {
    if (initialSubject && isSubjectAllowedInLevel(initialSubject, educationLevel)) {
      return initialSubject;
    }
    return CORE_SUBJECTS_BY_LEVEL[educationLevel][0];
  });

  const [grade, setGrade] = useState<number>(() => {
    if (initialGrade) {
      if (educationLevel === 'SD' && initialGrade >= 1 && initialGrade <= 6) return initialGrade;
      if (educationLevel === 'SMP' && initialGrade >= 7 && initialGrade <= 9) return initialGrade;
      if (educationLevel === 'SMA' && initialGrade >= 10 && initialGrade <= 12) return initialGrade;
    }
    return educationLevel === 'SMA' ? 10 : educationLevel === 'SMP' ? 7 : 3;
  });

  const [contextNotes, setContextNotes] = useState('');
  const [randomSeed, setRandomSeed] = useState(0);

  // Switcher Jenjang Pendidikan (SD, SMP, SMA)
  const handleEducationLevelChange = (lvl: EducationLevel) => {
    playClick();
    setEducationLevel(lvl);
    try {
      localStorage.setItem('kuis_last_education_level', lvl);
    } catch {
      // noop
    }

    // Sesuaikan kelas default untuk jenjang baru
    let newGrade = grade;
    if (lvl === 'SD' && (grade < 1 || grade > 6)) newGrade = 3;
    if (lvl === 'SMP' && (grade < 7 || grade > 9)) newGrade = 7;
    if (lvl === 'SMA' && (grade < 10 || grade > 12)) newGrade = 10;
    if (newGrade !== grade) setGrade(newGrade);

    // Sesuaikan mapel default jika mapel saat ini tidak tersedia di jenjang baru
    if (!isSubjectAllowedInLevel(subject, lvl)) {
      setSubject(CORE_SUBJECTS_BY_LEVEL[lvl][0]);
    }
  };

  // Modal Katalog Mapel Lengkap
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');

  // Brainstorming Ide Topik AI
  const [isBrainstormingAi, setIsBrainstormingAi] = useState(false);
  const [aiBrainstormedTopics, setAiBrainstormedTopics] = useState<TopicRecommendation[] | null>(null);

  // Filtered Subject Categories for Modal
  const subjectCatalogGroups = useMemo(() => getSubjectCatalogGroups(educationLevel), [educationLevel]);

  const filteredSubjectCategories = useMemo(() => {
    const q = subjectSearchQuery.trim().toLowerCase();
    if (!q) return subjectCatalogGroups;
    return subjectCatalogGroups.map((grp) => ({
      ...grp,
      items: grp.items.filter(
        (it) => it.name.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q) || grp.name.toLowerCase().includes(q)
      ),
    })).filter((grp) => grp.items.length > 0);
  }, [subjectSearchQuery, subjectCatalogGroups]);

  // Capaian Pembelajaran (CP) AI
  const [aiGradeCp, setAiGradeCp] = useState<string | null>(null);
  const [isGeneratingAiCp, setIsGeneratingAiCp] = useState(false);
  const [cpVariantIndex, setCpVariantIndex] = useState(0);

  // Reset topik AI & CP AI saat ganti mata pelajaran atau jenjang kelas
  useEffect(() => {
    setAiBrainstormedTopics(null);
    setAiGradeCp(null);
    setCpVariantIndex(0);
  }, [subject, grade, educationLevel]);

  // Handler Rumuskan / Elaborasi CP Spesifik Kelas via AI
  const handleGenerateAiCp = async () => {
    playClick();
    if (isAnyAiAvailable()) {
      setIsGeneratingAiCp(true);
      try {
        const result = await generateAiCapaianPembelajaran({ subject, grade, educationLevel });
        if (result?.cp) {
          setAiGradeCp(result.cp);
          return;
        }
      } catch (err) {
        console.warn('AI CP Generation note:', err);
      } finally {
        setIsGeneratingAiCp(false);
      }
    }
    // Rotasi varian pedagogis kontekstual jika AI offline atau belum tersambung
    const nextIdx = ((cpVariantIndex || 0) + 1) % 3;
    setCpVariantIndex(nextIdx);
    const altCp = getGradeCpVariant(subject, grade, nextIdx, educationLevel);
    setAiGradeCp(altCp);
  };

  // Handler Brainstorm AI / Acak Ide Dinamis
  const handleBrainstormTopics = async () => {
    playClick();
    if (isAnyAiAvailable()) {
      setIsBrainstormingAi(true);
      try {
        const ideas = await generateAiTopicIdeas({ subject, grade, educationLevel });
        if (ideas.length > 0) {
          setAiBrainstormedTopics(ideas);
          return;
        }
      } catch (err) {
        console.warn('AI Topic Brainstorm notice, falling back to local presets:', err);
      } finally {
        setIsBrainstormingAi(false);
      }
    }
    setAiBrainstormedTopics(null);
    setRandomSeed((prev) => prev + 1);
  };

  // Soal & Format Tipe Soal
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [customCountStr, setCustomCountStr] = useState<string>('');
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<SupportedFormat[]>([
    'multiple_choice',
  ]);
  const [proportionMode, setProportionMode] = useState<'balanced' | 'custom'>('balanced');
  const [proportions, setProportions] = useState({
    multiple_choice: 5,
    true_false: 0,
    short_answer: 0,
    matching_pairs: 0,
  });
  const [includeAiImages, setIncludeAiImages] = useState(false);
  const [mcOptionCount, setMcOptionCount] = useState<3 | 4 | 5>(4);
  const [trueFalseStyle, setTrueFalseStyle] = useState<'benar_salah' | 'sesuai_tidak' | 'ya_tidak'>('benar_salah');
  const [matchingPairCount, setMatchingPairCount] = useState<3 | 4 | 5>(4);

  // Pilihan Mesin AI (default 'auto' untuk memilih mesin terbaik secara otomatis)
  const [selectedEngine, setSelectedEngine] = useState<'auto' | 'local' | 'deepseek' | 'groq' | 'gemini' | 'prompt'>('auto');
  const [showSpecificCloudModels, setShowSpecificCloudModels] = useState(false);

  // Modal Pengaturan Kunci API Mandiri (BYOK)
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyTab, setApiKeyTab] = useState<'deepseek' | 'groq' | 'gemini'>('deepseek');
  const [deepseekKeyInput, setDeepseekKeyInput] = useState(() => getStoredDeepSeekApiKey());
  const [deepseekModelChoice, setDeepseekModelChoice] = useState<DeepSeekModel>(() => getStoredDeepSeekModel());
  const [groqKeyInput, setGroqKeyInput] = useState(() => getStoredGroqApiKey());
  const [groqModelChoice, setGroqModelChoice] = useState<GroqModel>(() => getStoredGroqModel());
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => getStoredGeminiApiKey());
  const [geminiModelChoice, setGeminiModelChoice] = useState<GeminiModel>(() => getStoredGeminiModel());
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState<string | null>(null);

  // Input Teks Salin Prompt / Dokumen
  const [rawInputText, setRawInputText] = useState('');
  const [inputMethodTab, setInputMethodTab] = useState<'paste' | 'file'>('paste');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Status & Indikator
  const [isLoading, setIsLoading] = useState(false);
  
  // Notifikasi Toast Mengambang (Floating Toast - selalu terlihat di viewport tanpa perlu scroll)
  const [toast, setToast] = useState<{
    message: string;
    type: 'error' | 'warning' | 'success' | 'info';
  } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (
    message: string,
    type: 'error' | 'warning' | 'success' | 'info' = 'error'
  ) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  const setErrorMessage = (msg: string | null) => {
    if (msg) {
      showToast(msg, 'error');
    } else {
      setToast(null);
    }
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const [supabaseAi, setSupabaseAi] = useState<SupabaseAiStatus>(() => getSupabaseAiStatusSync());
  const [isCheckingCloudAi, setIsCheckingCloudAi] = useState(false);

  // Periksa kesiapan Supabase AI saat pertama kali dimuat
  useEffect(() => {
    setIsCheckingCloudAi(true);
    checkSupabaseAiStatus()
      .then((status) => {
        setSupabaseAi(status);
      })
      .catch(() => {})
      .finally(() => {
        setIsCheckingCloudAi(false);
      });
  }, []);

  // Status kesehatan & limit masing-masing cloud engine
  const deepseekHealth = useMemo(() => getEngineHealthDetail('deepseek', supabaseAi), [supabaseAi]);
  const groqHealth = useMemo(() => getEngineHealthDetail('groq', supabaseAi), [supabaseAi]);
  const geminiHealth = useMemo(() => getEngineHealthDetail('gemini', supabaseAi), [supabaseAi]);

  // Status apakah provider tertentu sedang limit kuota harian
  const isDeepSeekLimited = deepseekHealth.status === 'quota_exhausted';
  const isGroqLimited = groqHealth.status === 'quota_exhausted';
  const isGeminiLimited = geminiHealth.status === 'quota_exhausted';

  // Cek ketersediaan provider cloud (konfigurasi + tidak limit kuota)
  const isDeepSeekConfigured = Boolean(supabaseAi.hasDeepSeek) || hasDeepSeekApiKey();
  const isGroqConfigured = Boolean(supabaseAi.hasGroq) || hasGroqApiKey();
  const isGeminiConfigured = Boolean(supabaseAi.hasGemini) || hasGeminiApiKey();

  const isDeepSeekAvailable = isDeepSeekConfigured && !isDeepSeekLimited && deepseekHealth.status !== 'error';
  const isGroqAvailable = isGroqConfigured && !isGroqLimited && groqHealth.status !== 'error';
  const isGeminiAvailable = isGeminiConfigured && !isGeminiLimited && geminiHealth.status !== 'error';

  const anyCloudConfigured = isDeepSeekConfigured || isGroqConfigured || isGeminiConfigured;
  const anyCloudAvailable = isDeepSeekAvailable || isGroqAvailable || isGeminiAvailable;

  // Seluruh AI Cloud limit: jika cloud dikonfigurasi namun tidak ada satupun yang bisa dipakai (semua limit kuota/error)
  const isAllCloudLimited = anyCloudConfigured && !anyCloudAvailable;

  // Resolusi engine aktual dari mode Auto — prioritas: DeepSeek → Groq → Gemini → Lokal
  const resolvedEngine = useMemo<'local' | 'deepseek' | 'groq' | 'gemini'>(() => {
    if (selectedEngine !== 'auto') {
      return (selectedEngine === 'prompt' ? 'local' : selectedEngine) as 'local' | 'deepseek' | 'groq' | 'gemini';
    }
    if (isDeepSeekAvailable) return 'deepseek';
    if (isGroqAvailable) return 'groq';
    if (isGeminiAvailable) return 'gemini';
    return 'local';
  }, [selectedEngine, isDeepSeekAvailable, isGroqAvailable, isGeminiAvailable]);

  // Otomatis alihkan ke mode 'prompt' jika seluruh AI Cloud limit dan mode aktif saat ini bukan lokal
  useEffect(() => {
    if (isAllCloudLimited) {
      if (selectedEngine === 'auto' || selectedEngine === 'deepseek' || selectedEngine === 'groq' || selectedEngine === 'gemini') {
        setSelectedEngine('prompt');
      }
    }
  }, [isAllCloudLimited, selectedEngine]);

  // Alihkan engine individu jika engine spesifik yang dipilih sedang limit
  useEffect(() => {
    if (selectedEngine === 'deepseek' && isDeepSeekLimited) {
      setSelectedEngine(anyCloudAvailable ? 'auto' : 'prompt');
    } else if (selectedEngine === 'groq' && isGroqLimited) {
      setSelectedEngine(anyCloudAvailable ? 'auto' : 'prompt');
    } else if (selectedEngine === 'gemini' && isGeminiLimited) {
      setSelectedEngine(anyCloudAvailable ? 'auto' : 'prompt');
    }
  }, [selectedEngine, isDeepSeekLimited, isGroqLimited, isGeminiLimited, anyCloudAvailable]);


  // Hitung total butir soal aktual
  const currentTotalQuestions = useMemo(() => {
    if (customCountStr.trim() !== '') {
      const parsed = parseInt(customCountStr);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 50) return parsed;
    }
    return questionCount;
  }, [customCountStr, questionCount]);

  // Proporsi Auto-Distribute cerdas dinamis sesuai tipe yang dipilih
  const handleAutoDistributeProportions = (total: number, typesToDistribute?: SupportedFormat[]) => {
    if (total <= 0) return;
    const activeTypes = typesToDistribute || selectedQuestionTypes;
    if (activeTypes.length === 0) return;

    if (activeTypes.length === 1) {
      const single = activeTypes[0];
      setProportions({
        multiple_choice: single === 'multiple_choice' ? total : 0,
        true_false: single === 'true_false' ? total : 0,
        short_answer: single === 'short_answer' ? total : 0,
        matching_pairs: single === 'matching_pairs' ? total : 0,
      });
      return;
    }

    const base = Math.floor(total / activeTypes.length);
    let rem = total % activeTypes.length;

    // Prioritaskan multiple_choice jika ada
    const sorted = [...activeTypes].sort((a, b) => (a === 'multiple_choice' ? -1 : b === 'multiple_choice' ? 1 : 0));
    const newProps = {
      multiple_choice: 0,
      true_false: 0,
      short_answer: 0,
      matching_pairs: 0,
    };

    sorted.forEach((t) => {
      const add = base + (rem > 0 ? 1 : 0);
      if (rem > 0) rem--;
      newProps[t] = add;
    });

    setProportions(newProps);
  };

  const handleToggleQuestionType = (type: SupportedFormat) => {
    playClick();
    setSelectedQuestionTypes((prev) => {
      const isSelected = prev.includes(type);
      if (isSelected) {
        if (prev.length <= 1) {
          return prev; // Minimal harus ada 1 tipe terpilih
        }
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // Sinkronisasi otomatis proporsi saat tipe atau jumlah soal berubah
  useEffect(() => {
    if (selectedQuestionTypes.length === 1) {
      const single = selectedQuestionTypes[0];
      setProportions({
        multiple_choice: single === 'multiple_choice' ? currentTotalQuestions : 0,
        true_false: single === 'true_false' ? currentTotalQuestions : 0,
        short_answer: single === 'short_answer' ? currentTotalQuestions : 0,
        matching_pairs: single === 'matching_pairs' ? currentTotalQuestions : 0,
      });
    } else if (proportionMode === 'balanced') {
      handleAutoDistributeProportions(currentTotalQuestions, selectedQuestionTypes);
    }
  }, [selectedQuestionTypes, currentTotalQuestions, proportionMode]);

  const sumCustomProportions = useMemo(() => {
    return selectedQuestionTypes.reduce((acc, t) => acc + (proportions[t] || 0), 0);
  }, [selectedQuestionTypes, proportions]);

  // Rekomendasi Topik Cerdas Berdasarkan Mapel, Kelas & Jenjang
  const activeTopicRecommendations = useMemo(() => {
    if (aiBrainstormedTopics && aiBrainstormedTopics.length > 0) {
      return { list: aiBrainstormedTopics, isAi: true };
    }
    const presetList = getCuratedTopics(subject, grade, educationLevel);
    if (presetList.length === 0) return { list: [], isAi: false };
    const shifted = [...presetList];
    const offset = randomSeed % shifted.length;
    return {
      list: shifted.slice(offset).concat(shifted.slice(0, offset)).slice(0, 4),
      isAi: false,
    };
  }, [aiBrainstormedTopics, subject, grade, educationLevel, randomSeed]);

  const currentPhaseInfo = useMemo(() => getPhaseInfo(grade, educationLevel), [grade, educationLevel]);
  const currentCpStatement = useMemo(() => aiGradeCp || getSubjectCp(subject, grade, educationLevel), [aiGradeCp, subject, grade, educationLevel]);

  const coreSubjects = CORE_SUBJECTS_BY_LEVEL[educationLevel] || CORE_SUBJECTS_BY_LEVEL.SD;
  const isCoreSubject = coreSubjects.includes(subject);

  // Helper render status mesin AI informatif
  const renderEngineStatusBadge = (health: EngineHealthDetail, isCompact = false) => {
    let badgeClasses = 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300';
    if (health.status === 'busy') {
      badgeClasses = 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 animate-pulse';
    } else if (health.status === 'quota_exhausted' || health.status === 'error') {
      badgeClasses = 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300';
    } else if (health.status === 'unconfigured') {
      badgeClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }

    const label = isCompact
      ? (health.status === 'ready' ? 'Siap' : health.status === 'busy' ? 'Sibuk' : health.status === 'quota_exhausted' ? 'Habis' : health.status === 'error' ? 'Kendala' : 'Belum')
      : health.label;

    return (
      <span className={`${isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'} rounded-md font-bold flex items-center gap-1 shrink-0 ${badgeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: health.color }} />
        <span className="truncate max-w-[95px]">{label}</span>
      </span>
    );
  };

  // Prompt Teks Siap Pakai
  const generatedPromptText = useMemo(() => {
    const isSingle = selectedQuestionTypes.length === 1;
    return generateAiPrompt({
      subject,
      grade,
      educationLevel,
      topic: topic.trim() || 'Materi Pelajaran Tematik',
      count: currentTotalQuestions,
      questionType: isSingle ? selectedQuestionTypes[0] : 'campuran',
      typeProportions: !isSingle ? proportions : undefined,
      contextNotes: contextNotes.trim() || undefined,
      includeImages: includeAiImages,
      mcOptionCount,
      trueFalseStyle,
      matchingPairCount,
    });
  }, [subject, grade, educationLevel, topic, currentTotalQuestions, selectedQuestionTypes, proportions, contextNotes, includeAiImages, mcOptionCount, trueFalseStyle, matchingPairCount]);

  // Handler Salin Prompt (Kompatibel dengan segala browser, mobile, & non-HTTPS)
  const handleCopyPrompt = async () => {
    playClick();
    if (!generatedPromptText) {
      showToast('Teks prompt masih kosong.', 'error');
      return;
    }
    const success = await copyTextToClipboard(generatedPromptText, promptTextareaRef.current);
    if (success) {
      setCopiedPrompt(true);
      showToast('Prompt kuis berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopiedPrompt(false), 2500);
    } else {
      // Jika browser memblokir clipboard otomatis, seleksi teks di textarea agar pengguna mudah menekan Salin / Ctrl+C
      if (promptTextareaRef.current) {
        promptTextareaRef.current.focus();
        promptTextareaRef.current.select();
      }
      showToast('Teks prompt telah ditandai. Tekan Salin atau Ctrl+C.', 'warning');
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
    link.setAttribute('download', `Template_Bank_Soal_${educationLevel}_${subject.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Template CSV berhasil diunduh.', 'success');
  };

  // Handler Unggah Berkas
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
        showToast('Berkas soal berhasil dimuat ke editor!', 'success');
      }
    };

    reader.onerror = () => {
      showToast('Gagal membaca berkas. Pastikan format berkas valid.', 'error');
    };

    reader.readAsText(file);
  };

  // Simpan Pengaturan Kunci API Pribadi
  const handleSaveApiKeySettings = () => {
    playClick();
    if (apiKeyTab === 'deepseek') {
      saveStoredDeepSeekApiKey(deepseekKeyInput.trim());
      saveStoredDeepSeekModel(deepseekModelChoice);
      setKeySaveMessage(deepseekKeyInput.trim() ? 'Kunci DeepSeek berhasil disimpan.' : 'Kunci DeepSeek telah dihapus.');
    } else if (apiKeyTab === 'groq') {
      saveStoredGroqApiKey(groqKeyInput.trim());
      saveStoredGroqModel(groqModelChoice);
      setKeySaveMessage(groqKeyInput.trim() ? 'Kunci Groq berhasil disimpan.' : 'Kunci Groq telah dihapus.');
    } else if (apiKeyTab === 'gemini') {
      saveStoredGeminiApiKey(geminiKeyInput.trim());
      saveStoredGeminiModel(geminiModelChoice);
      setKeySaveMessage(geminiKeyInput.trim() ? 'Kunci Gemini berhasil disimpan.' : 'Kunci Gemini telah dihapus.');
    }
    setSupabaseAi({ ...getSupabaseAiStatusSync() });
    setTimeout(() => {
      setKeySaveMessage(null);
      setIsApiKeyModalOpen(false);
    }, 1000);
  };

  // Eksekusi AI Direct (Lokal / DeepSeek / Groq / Gemini) -> Langsung Buka Studio Bank Soal
  const handleExecuteAiDirect = async () => {
    playClick();
    setErrorMessage(null);

    if (!topic.trim()) {
      showToast('Mohon tentukan topik kuis terlebih dahulu.', 'warning');
      onStageChange(2);
      return;
    }

    setIsLoading(true);

    const isSingle = selectedQuestionTypes.length === 1;
    const baseParams = {
      topic: topic.trim(),
      subject,
      grade,
      educationLevel,
      count: currentTotalQuestions,
      questionType: isSingle ? selectedQuestionTypes[0] : 'campuran' as const,
      typeProportions: !isSingle ? proportions : undefined,
      includeAiImages,
      contextNotes: contextNotes.trim() || undefined,
      mcOptionCount,
      trueFalseStyle,
      matchingPairCount,
    };

    // Rantai fallback — mode Auto mencoba semua engine cloud yang tersedia secara berurutan
    const fallbackChain: Array<'deepseek' | 'groq' | 'gemini' | 'local'> = (() => {
      if (selectedEngine === 'local') return ['local'];
      if (selectedEngine !== 'auto') return [resolvedEngine as 'deepseek' | 'groq' | 'gemini' | 'local'];
      const chain: Array<'deepseek' | 'groq' | 'gemini' | 'local'> = [];
      if (isDeepSeekAvailable) chain.push('deepseek');
      if (isGroqAvailable) chain.push('groq');
      if (isGeminiAvailable) chain.push('gemini');
      // Perhatian: Tidak mendorong 'local' otomatis di mode Auto saat cloud limit.
      // Sesuai instruksi: bila seluruh cloud limit, alihkan ke Prompt / Berkas (Direkomendasikan)
      return chain;
    })();

    if (selectedEngine === 'auto' && fallbackChain.length === 0) {
      setSelectedEngine('prompt');
      showToast('Seluruh kuota AI Cloud harian mencapai batas. Mode otomatis dialihkan ke Prompt / Berkas.', 'warning');
      setIsLoading(false);
      return;
    }

    try {
      let lastError: Error | null = null;
      let result: Awaited<ReturnType<typeof generateHybridQuizQuestions>> | null = null;

      for (const engine of fallbackChain) {
        try {
          const provider: AiProvider | undefined =
            engine === 'deepseek' ? 'deepseek' :
            engine === 'groq' ? 'groq' :
            engine === 'gemini' ? 'gemini' : undefined;

          result = await generateHybridQuizQuestions({
            ...baseParams,
            provider,
            allowLocalFallback: false,
          });
          if (result.questions && result.questions.length > 0) break;
        } catch (err: unknown) {
          lastError = err instanceof Error ? err : new Error(String(err));
          if (selectedEngine === 'auto' && fallbackChain.indexOf(engine) < fallbackChain.length - 1) continue;
          throw lastError;
        }
      }

      if (!result || !result.questions || result.questions.length === 0) {
        throw lastError || new Error('Tidak ada butir soal yang berhasil diracik. Silakan coba kembali.');
      }

      const badge = educationLevel === 'SMA' ? 'Bintang Cendekia' : educationLevel === 'SMP' ? 'Bintang Mandiri' : 'Bintang Pintar';

      // Langsung buka Studio Bank Soal
      onGenerated({
        questions: result.questions,
        topic: topic.trim(),
        subject,
        grade,
        educationLevel,
        questionCount: result.questions.length,
        coverEmoji: EMOJI_BY_SUBJECT[subject] || '🌟',
        badgeTitle: badge,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat meracik soal AI.';
      // Sinkronkan status Supabase AI terbaru untuk memicu reaktivitas badge kuota
      const updatedAiStatus = getSupabaseAiStatusSync();
      setSupabaseAi({ ...updatedAiStatus });

      const isQuotaErr = msg.toLowerCase().includes('429') || 
                         msg.toLowerCase().includes('quota') || 
                         msg.toLowerCase().includes('limit') || 
                         msg.toLowerCase().includes('balance') ||
                         msg.toLowerCase().includes('exhausted');

      if (isQuotaErr || selectedEngine === 'auto') {
        setSelectedEngine('prompt');
        showToast('Seluruh kuota AI Cloud saat ini mencapai limit harian. Mode dialihkan ke Prompt / Berkas (Direkomendasikan).', 'warning');
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Eksekusi Verifikasi Prompt / Berkas -> Langsung Buka Studio Bank Soal
  const handleParseAndOpenStudio = () => {
    playClick();
    setErrorMessage(null);

    const trimmed = rawInputText.trim();
    if (!trimmed) {
      showToast('Mohon tempelkan teks hasil dari AI atau unggah berkas soal terlebih dahulu.', 'warning');
      return;
    }

    try {
      const parsed = parseRawQuestionsText(trimmed);
      const validQuestions = parsed.filter((p) => p.valid).map((p) => p.question);

      if (validQuestions.length === 0) {
        showToast('Format soal tidak dapat dikenali. Pastikan teks berisi pertanyaan, opsi pilihan, dan kunci jawaban.', 'error');
        return;
      }

      const badge = educationLevel === 'SMA' ? 'Bintang Cendekia' : educationLevel === 'SMP' ? 'Bintang Mandiri' : 'Bintang Pintar';
      const levelLabel = educationLevel === 'SMA' ? 'SMA' : educationLevel === 'SMP' ? 'SMP' : 'SD';

      onGenerated({
        questions: validQuestions,
        topic: topic.trim() || `Kuis ${subject} Kelas ${grade} ${levelLabel}`,
        subject,
        grade,
        educationLevel,
        questionCount: validQuestions.length,
        coverEmoji: EMOJI_BY_SUBJECT[subject] || '🌟',
        badgeTitle: badge,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal mengurai teks soal.';
      showToast(msg, 'error');
    }
  };

  return (
    <div ref={containerRef} tabIndex={-1} className="w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 py-3 sm:py-4 animate-fade-in space-y-6 outline-none focus:outline-none">

      {/* ========================================================================= */}
      {/* TAHAP 1: JENJANG PENDIDIKAN, MATA PELAJARAN & TINGKAT KELAS */}
      {/* ========================================================================= */}
      {stage === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 sm:space-y-8 animate-fade-in">
          
          {/* Selector Jenjang Pendidikan (SD, SMP, SMA/SMK) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">Jenjang Pendidikan</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  Kurikulum Merdeka
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Memfilter mapel, fase, dan capaian pembelajaran
              </p>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full sm:w-auto sm:shrink-0">
              {([
                { id: 'SD' as EducationLevel, label: 'SD / MI', icon: '🎒' },
                { id: 'SMP' as EducationLevel, label: 'SMP / MTs', icon: '🏫' },
                { id: 'SMA' as EducationLevel, label: 'SMA / SMK', icon: '🎓' },
              ]).map((lvl) => {
                const isSelected = educationLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => handleEducationLevelChange(lvl.id)}
                    className={`flex-1 sm:flex-none min-h-[44px] px-2 sm:px-4 py-2 rounded-xl flex items-center justify-center sm:justify-start gap-1.5 transition-all text-xs sm:text-sm btn-press ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-base shrink-0">{lvl.icon}</span>
                    <span className="font-extrabold truncate">{lvl.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pilihan Mata Pelajaran (6 Kotak: 5 Utama + 1 Lainnya dengan Modal) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                Pilih Mata Pelajaran {educationLevel === 'SMA' ? 'SMA / SMK' : educationLevel === 'SMP' ? 'SMP' : 'SD'} <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
                {educationLevel === 'SMA' ? 'Fokus Peminatan MIPA, IPS, dan Wajib' : educationLevel === 'SMP' ? 'Fokus Mapel Terpadu Fase D' : 'Kurikulum Merdeka SD'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
              {/* 5 Mapel Inti Terpopuler sesuai Jenjang */}
              {coreSubjects.map((subj) => {
                const isSelected = subject === subj;
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => {
                      playClick();
                      setSubject(subj);
                    }}
                    className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all min-h-[72px] flex items-center gap-3 btn-press ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/25 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl shrink-0">{EMOJI_BY_SUBJECT[subj]}</span>
                    <div className="min-w-0 flex-1">
                      <span className="font-black text-xs sm:text-sm leading-snug line-clamp-2">{subj}</span>
                      <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                        {educationLevel === 'SMA' ? 'Peminatan / Wajib' : educationLevel === 'SMP' ? 'Kurikulum SMP' : 'Kurikulum Merdeka'}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Kotak ke-6: Lainnya (Membuka Modal Overlay Mapel Lengkap) */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsSubjectModalOpen(true);
                }}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all min-h-[72px] flex items-center gap-3 btn-press relative ${
                  !isCoreSubject
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/25 shadow-sm'
                    : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/60 dark:bg-slate-850/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-2xl sm:text-3xl shrink-0">
                  {!isCoreSubject ? (EMOJI_BY_SUBJECT[subject] || '📚') : '📚'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-black text-xs sm:text-sm leading-snug line-clamp-2">
                      {!isCoreSubject ? subject : 'Lainnya'}
                    </span>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-extrabold shrink-0">▾</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                    {!isCoreSubject ? 'Ganti mapel ▾' : educationLevel === 'SMA' ? 'MIPA, IPS, Bahasa...' : educationLevel === 'SMP' ? 'Informatika, Prakarya...' : 'PJOK, Seni, Agama...'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Pilihan Tingkat Kelas (Pengelompokan Fase Kurikulum Merdeka Dinamis) */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                Pilih Tingkat Kelas {educationLevel === 'SMA' ? 'SMA / SMK' : educationLevel === 'SMP' ? 'SMP' : 'SD'} <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
                Terstruktur menurut Fase Kurikulum Merdeka ({educationLevel === 'SMA' ? 'Fase E & F' : educationLevel === 'SMP' ? 'Fase D' : 'Fase A – C'})
              </span>
            </div>

            {/* Layout Kelas SD: Fase A, B, C */}
            {educationLevel === 'SD' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {/* Fase A: Kelas 1 & 2 */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  grade === 1 || grade === 2
                    ? 'border-blue-500/80 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-800 ring-1 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40'
                }`}>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Fase A
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Fondasi Awal</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          playClick();
                          setGrade(g);
                        }}
                        className={`py-3 px-2 rounded-xl font-black text-xs sm:text-sm transition-all min-h-[48px] flex flex-col items-center justify-center btn-press ${
                          grade === g
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/80'
                        }`}
                      >
                        <span className="font-extrabold text-sm">Kelas {g}</span>
                        <span className="text-[10px] font-normal opacity-85">Sekolah Dasar</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fase B: Kelas 3 & 4 */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  grade === 3 || grade === 4
                    ? 'border-blue-500/80 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-800 ring-1 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40'
                }`}>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Fase B
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Penguatan Konsep</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[3, 4].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          playClick();
                          setGrade(g);
                        }}
                        className={`py-3 px-2 rounded-xl font-black text-xs sm:text-sm transition-all min-h-[48px] flex flex-col items-center justify-center btn-press ${
                          grade === g
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/80'
                        }`}
                      >
                        <span className="font-extrabold text-sm">Kelas {g}</span>
                        <span className="text-[10px] font-normal opacity-85">Sekolah Dasar</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fase C: Kelas 5 & 6 */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  grade === 5 || grade === 6
                    ? 'border-blue-500/80 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-800 ring-1 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40'
                }`}>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Fase C
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Penalaran Lanjut</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[5, 6].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          playClick();
                          setGrade(g);
                        }}
                        className={`py-3 px-2 rounded-xl font-black text-xs sm:text-sm transition-all min-h-[48px] flex flex-col items-center justify-center btn-press ${
                          grade === g
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/80'
                        }`}
                      >
                        <span className="font-extrabold text-sm">Kelas {g}</span>
                        <span className="text-[10px] font-normal opacity-85">Sekolah Dasar</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Layout Kelas SMP: Fase D (Kelas 7, 8, 9) */}
            {educationLevel === 'SMP' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { g: 7, subTitle: 'Transisi & Adaptasi Awal', tag: 'Fase D (Kls 7)' },
                  { g: 8, subTitle: 'Pendalaman Eksplorasi', tag: 'Fase D (Kls 8)' },
                  { g: 9, subTitle: 'Pemantapan & Penalaran', tag: 'Fase D (Kls 9)' },
                ].map((item) => {
                  const isSelected = grade === item.g;
                  return (
                    <div
                      key={item.g}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-blue-500/80 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-800 ring-1 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2.5 px-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                          {item.tag}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{item.subTitle}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setGrade(item.g);
                        }}
                        className={`w-full py-3.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all min-h-[50px] flex flex-col items-center justify-center btn-press ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/80'
                        }`}
                      >
                        <span className="font-extrabold text-base">Kelas {item.g} SMP</span>
                        <span className="text-[10px] font-normal opacity-85">Sekolah Menengah Pertama</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Layout Kelas SMA: Fase E (Kelas 10) & Fase F (Kelas 11 & 12) */}
            {educationLevel === 'SMA' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {/* Fase E: Kelas 10 */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  grade === 10
                    ? 'border-blue-500/80 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-800 ring-1 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40'
                }`}>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      Fase E
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Fondasi Peminatan</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setGrade(10);
                    }}
                    className={`w-full py-3.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all min-h-[50px] flex flex-col items-center justify-center btn-press ${
                      grade === 10
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/80'
                    }`}
                  >
                    <span className="font-extrabold text-base">Kelas 10 SMA</span>
                    <span className="text-[10px] font-normal opacity-85">Eksplorasi Minat & Bakat</span>
                  </button>
                </div>

                {/* Fase F: Kelas 11 */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  grade === 11
                    ? 'border-blue-500/80 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-800 ring-1 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40'
                }`}>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Fase F (Kls 11)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Pendalaman & HOTS</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setGrade(11);
                    }}
                    className={`w-full py-3.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all min-h-[50px] flex flex-col items-center justify-center btn-press ${
                      grade === 11
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/80'
                    }`}
                  >
                    <span className="font-extrabold text-base">Kelas 11 SMA</span>
                    <span className="text-[10px] font-normal opacity-85">Pendalaman Peminatan</span>
                  </button>
                </div>

                {/* Fase F: Kelas 12 */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  grade === 12
                    ? 'border-blue-500/80 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-800 ring-1 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40'
                }`}>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Fase F (Kls 12)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Pemantapan & Seleksi</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setGrade(12);
                    }}
                    className={`w-full py-3.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all min-h-[50px] flex flex-col items-center justify-center btn-press ${
                      grade === 12
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/80'
                    }`}
                  >
                    <span className="font-extrabold text-base">Kelas 12 SMA</span>
                    <span className="text-[10px] font-normal opacity-85">Kelulusan & SNBT/Kedinasan</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Capaian Pembelajaran (CP) Preview Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/70 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/30 border border-blue-200/80 dark:border-blue-900/60 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-[11px] font-black shadow-xs shrink-0">
                  CP
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    Capaian Pembelajaran (CP) Spesifik Kelas {grade} {educationLevel === 'SMA' ? 'SMA / SMK' : educationLevel === 'SMP' ? 'SMP' : 'SD'}
                  </span>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    • {currentPhaseInfo.phase} ({currentPhaseInfo.desc})
                  </span>
                  {aiGradeCp && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 animate-fade-in flex items-center gap-1">
                      <span>AI Generated</span>
                      <span>✨</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateAiCp}
                  disabled={isGeneratingAiCp}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 shadow-xs flex items-center gap-1.5 transition-all btn-press disabled:opacity-60 min-h-[34px]"
                  title="Rumuskan / elaborasi Capaian Pembelajaran spesifik kelas ini via AI"
                >
                  {isGeneratingAiCp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                      <span>Merumuskan via AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{aiGradeCp ? 'Acak Ulang via AI' : 'Elaborasi CP via AI'}</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                  {EMOJI_BY_SUBJECT[subject]} {subject}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium sm:pl-9">
              &ldquo;{currentCpStatement}&rdquo;
            </p>
          </div>

          {/* Navigasi Tahap 1 (Tombol Ganti Metode Dihapus, Cukup Primary Action) */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                playClick();
                setErrorMessage(null);
                onStageChange(2);
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 min-h-[48px] btn-press transition-all"
            >
              <span>Lanjut ke Topik Materi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 2: TOPIK & SASARAN PEMBELAJARAN */}
      {/* ========================================================================= */}
      {stage === 2 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 sm:space-y-8 animate-fade-in">
          
          {/* Strip Konteks Mapel & Kelas (Ramping 1 Baris, Opsi B) */}
          <button
            type="button"
            onClick={() => {
              playClick();
              onStageChange(1);
            }}
            title="Klik untuk ubah mapel atau kelas pada Tahap 1"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50 hover:bg-blue-100/70 dark:hover:bg-blue-900/60 text-blue-950 dark:text-blue-100 text-xs font-bold max-w-full transition-colors cursor-pointer group text-left shadow-2xs"
          >
            <span className="text-base shrink-0">{EMOJI_BY_SUBJECT[subject]}</span>
            <span className="truncate">{subject}</span>
            <span className="text-blue-400 dark:text-blue-500 shrink-0">•</span>
            <span className="text-blue-700 dark:text-blue-300 shrink-0 font-semibold text-[11px] sm:text-xs">
              Kelas {grade} {educationLevel === 'SMA' ? 'SMA / SMK' : educationLevel === 'SMP' ? 'SMP' : 'SD'}
            </span>
          </button>

          {/* 2-Kolom: Topik & Saran Cerdas (Kiri) vs Catatan Khusus (Kanan) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start">
            
            {/* Kolom Kiri: Input Topik & Rekomendasi Ringkas */}
            <div className="lg:col-span-6 space-y-2.5">
              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-1.5">
                  Topik atau Materi Pembahasan Kuis <span className="text-rose-500">*</span>
                </label>
                <textarea
                  ref={topicTextareaRef}
                  rows={1}
                  spellCheck={false}
                  value={topic}
                  onChange={(e) => onTopicChange(e.target.value.replace(/\r?\n/g, ' '))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Ketik topik kuis atau pilih saran di bawah..."
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 font-bold text-xs sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none min-h-[48px] shadow-xs resize-none overflow-hidden leading-relaxed transition-[height] duration-75"
                />
              </div>

              {/* Rekomendasi Topik Ringan: Helper Sekunder Tanpa Truncate & Bento Grid Max 2 Baris */}
              {activeTopicRecommendations.list.length > 0 && (
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Saran ide topik:</span>
                      {activeTopicRecommendations.isAi && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                          AI
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      disabled={isBrainstormingAi}
                      onClick={handleBrainstormTopics}
                      className="text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 hover:underline btn-press disabled:opacity-60"
                      title="Acak atau segarkan ide topik"
                    >
                      {isBrainstormingAi ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                          <span>Meracik...</span>
                        </>
                      ) : (
                        <>
                          <Shuffle className="w-3 h-3" />
                          <span>Acak Ide</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Bento Grid: Ponsel 1 baris swipeable (bebas scrollbar), Layar Lebar Grid 2-Kolom (Maksimal 2 Baris, Zero Truncate) */}
                  <div className="flex sm:grid sm:grid-cols-2 items-stretch gap-1.5 sm:gap-2 overflow-x-auto sm:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-1 sm:py-0 -mx-0.5 sm:mx-0 px-0.5 sm:px-0 touch-pan-x">
                    {activeTopicRecommendations.list.slice(0, 4).map((rec) => {
                      const isSelected = topic === rec.topic;
                      return (
                        <button
                          key={rec.topic}
                          type="button"
                          onClick={() => {
                            playClick();
                            onTopicChange(rec.topic);
                            if (rec.context) setContextNotes(rec.context);
                          }}
                          className={`text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-left transition-all btn-press flex items-start gap-1.5 group whitespace-normal break-words shrink-0 sm:shrink max-w-[280px] sm:max-w-none shadow-2xs ${
                            isSelected
                              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-400/80 dark:border-blue-600/80 text-blue-700 dark:text-blue-300 font-bold'
                              : 'bg-slate-100/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-850 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-700'
                          }`}
                        >
                          <span className={`text-[11px] shrink-0 mt-0.5 font-bold transition-colors ${
                            isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-blue-500'
                          }`}>
                            {isSelected ? '✓' : '+'}
                          </span>
                          <span className="leading-snug break-words whitespace-normal flex-1">
                            {rec.topic}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Kolom Kanan: Catatan Khusus */}
            <div className="lg:col-span-6 space-y-2">
              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-1.5">
                  Catatan Tambahan <span className="text-slate-400 font-normal text-xs">(Opsional)</span>
                </label>
                <ResizableTextarea
                  ref={contextNotesTextareaRef}
                  rows={4}
                  spellCheck={false}
                  value={contextNotes}
                  onChange={(e) => setContextNotes(e.target.value)}
                  placeholder="Contoh: Fokuskan pada organ tertentu, gunakan bahasa santai dan ramah anak..."
                  minHeight={90}
                  maxHeight={500}
                  className="min-h-[115px] sm:min-h-[125px]"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed flex items-center justify-between">
                <span>Tambahkan panduan fokus materi atau gaya bahasa khusus untuk ditaati AI.</span>
                <span className="hidden sm:inline text-[10px] text-slate-400/80">Tarik sudut kanan bawah untuk perbesar</span>
              </p>
            </div>

          </div>

          {/* Navigasi Tahap 2 */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                playClick();
                if (!topic.trim()) {
                  showToast('Mohon tentukan materi atau topik pembahasan kuis terlebih dahulu.', 'warning');
                  return;
                }
                onStageChange(3);
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 min-h-[48px] btn-press transition-all"
            >
              <span>Lanjut ke Format Soal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 3: FORMAT & KONFIGURASI BUTIR SOAL */}
      {/* ========================================================================= */}
      {stage === 3 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 sm:space-y-8 animate-fade-in">
          
          {/* Ringkasan Konfigurasi Kuis Tahap 3 (Adaptif) */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between gap-2.5 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0 select-none">
                  {EMOJI_BY_SUBJECT[subject] || '📚'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  <span>{subject}</span>
                  <span className="text-slate-300 dark:text-slate-600 select-none">•</span>
                  <span className="text-slate-600 dark:text-slate-300 font-semibold text-xs sm:text-sm">
                    Kelas {grade} {educationLevel === 'SMA' ? 'SMA / SMK' : educationLevel === 'SMP' ? 'SMP' : 'SD'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  onStageChange(2);
                }}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline px-1 py-0.5 min-h-[28px] flex items-center"
                title="Ubah topik atau materi kuis"
              >
                Ubah Topik
              </button>
            </div>

            {topic ? (
              <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug break-words">
                &ldquo;{topic}&rdquo;
              </div>
            ) : (
              <div className="text-xs sm:text-sm italic text-slate-400 dark:text-slate-500">
                Topik kuis belum ditentukan
              </div>
            )}
          </div>

          {/* Pilihan Jumlah Butir Soal */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                Jumlah Butir Soal <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium">
                Pilih opsi cepat atau kustom (1 - 50)
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
              {[5, 10, 15, 20, 25].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    playClick();
                    setQuestionCount(cnt);
                    setCustomCountStr('');
                    if (proportionMode === 'custom') {
                      handleAutoDistributeProportions(cnt);
                    }
                  }}
                  className={`py-2.5 sm:py-3 px-2 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm min-h-[46px] sm:min-h-[48px] transition-all btn-press flex items-center justify-center gap-1 ${
                    questionCount === cnt && customCountStr === ''
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-400/40 font-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <span className="text-sm sm:text-base font-extrabold">{cnt}</span>
                  <span className="text-[11px] opacity-80">Soal</span>
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
                  placeholder="Kustom"
                  className={`w-full px-2 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border font-bold text-xs sm:text-sm text-center min-h-[46px] sm:min-h-[48px] focus:outline-none transition-all shadow-xs ${
                    customCountStr !== ''
                      ? 'border-blue-500 ring-2 ring-blue-400/40 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-extrabold'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Format Tipe Soal & Proporsi */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                Format Tipe Soal <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium">
                Pilih satu atau kombinasikan beberapa format
              </span>
            </div>

            {/* Kartu Format: Grid 2-kolom kompak di mobile, 4-kolom di desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              {[
                {
                  type: 'multiple_choice' as const,
                  label: 'Pilihan Ganda',
                  icon: '🔘',
                  desc: `${mcOptionCount} opsi jawaban (${['A','B','C','D','E'].slice(0,mcOptionCount).join(', ')})`,
                },
                {
                  type: 'true_false' as const,
                  label: 'Benar / Salah',
                  icon: '⚖️',
                  desc: trueFalseStyle === 'sesuai_tidak' ? 'Sesuai atau Tidak Sesuai' : trueFalseStyle === 'ya_tidak' ? 'Ya atau Tidak' : 'Benar atau Salah',
                },
                {
                  type: 'short_answer' as const,
                  label: 'Isian Singkat',
                  icon: '✍️',
                  desc: 'Ketik kata kunci atau angka',
                },
                {
                  type: 'matching_pairs' as const,
                  label: 'Menjodohkan',
                  icon: '🧩',
                  desc: `${matchingPairCount} pasang kartu konsep`,
                },
              ].map((fmt) => {
                const isSelected = selectedQuestionTypes.includes(fmt.type);
                return (
                  <button
                    key={fmt.type}
                    type="button"
                    onClick={() => handleToggleQuestionType(fmt.type)}
                    className={`p-3 sm:p-4 rounded-2xl border text-left transition-all min-h-[92px] sm:min-h-[104px] flex flex-col justify-between btn-press ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-xl sm:text-2xl shrink-0">{fmt.icon}</span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'border-2 border-slate-300 dark:border-slate-600 bg-transparent'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <div>
                      <span className="font-extrabold text-xs sm:text-sm block leading-snug">
                        {fmt.label}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {fmt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Panel Pengaturan Lanjutan — tampil jika tipe terkait dipilih */}
            {(selectedQuestionTypes.includes('multiple_choice') || selectedQuestionTypes.includes('true_false') || selectedQuestionTypes.includes('matching_pairs')) && (
              <div className="space-y-2.5 pt-1 animate-fade-in">
                {/* Pilihan Ganda: jumlah opsi */}
                {selectedQuestionTypes.includes('multiple_choice') && (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50">
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">Jumlah Opsi Pilihan Ganda</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">A, B, C — atau hingga A, B, C, D, E</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      {([3, 4, 5] as const).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => { playClick(); setMcOptionCount(n); }}
                          className={`w-9 h-8 rounded-lg text-xs font-extrabold transition-all btn-press ${
                            mcOptionCount === n
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Benar / Salah: gaya label */}
                {selectedQuestionTypes.includes('true_false') && (
                  <div className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50">
                    <div>
                      <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">Gaya Label Benar / Salah</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">Pilih pasangan opsi jawaban yang sesuai</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      {([
                        { val: 'benar_salah', label: 'Benar / Salah' },
                        { val: 'sesuai_tidak', label: 'Sesuai / Tidak' },
                        { val: 'ya_tidak', label: 'Ya / Tidak' },
                      ] as const).map(({ val, label }) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => { playClick(); setTrueFalseStyle(val); }}
                          className={`flex-1 h-8 rounded-lg text-[11px] font-bold transition-all btn-press whitespace-nowrap ${
                            trueFalseStyle === val
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Menjodohkan: jumlah pasang */}
                {selectedQuestionTypes.includes('matching_pairs') && (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50">
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">Jumlah Pasangan Kartu</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">Berapa pasang kiri-kanan per soal</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      {([3, 4, 5] as const).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => { playClick(); setMatchingPairCount(n); }}
                          className={`w-9 h-8 rounded-lg text-xs font-extrabold transition-all btn-press ${
                            matchingPairCount === n
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pengaturan Proporsi: Hanya tampil jika pengguna memilih >= 2 format */}
            {selectedQuestionTypes.length > 1 && (
              <div className="space-y-3 pt-2 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      Pembagian Proporsi Soal ({selectedQuestionTypes.length} Format)
                    </span>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Tentukan pembagian jumlah butir soal untuk tiap format terpilih
                    </p>
                  </div>

                  {/* Mode Switcher */}
                  <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setProportionMode('balanced');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        proportionMode === 'balanced'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-extrabold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>⚖️ Seimbang</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setProportionMode('custom');
                        handleAutoDistributeProportions(currentTotalQuestions, selectedQuestionTypes);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        proportionMode === 'custom'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-extrabold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>🎛️ Kustom</span>
                    </button>
                  </div>
                </div>

                {proportionMode === 'balanced' ? (
                  <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5 animate-fade-in">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div className="space-y-1 leading-relaxed">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                        Distribusi Berimbang Otomatis ({currentTotalQuestions} Butir):
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {selectedQuestionTypes.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs"
                          >
                            <span>
                              {t === 'multiple_choice' ? '🔘 Pilihan Ganda' :
                               t === 'true_false' ? '⚖️ Benar/Salah' :
                               t === 'short_answer' ? '✍️ Isian Singkat' : '🧩 Menjodohkan'}
                            </span>
                            <span className="text-blue-600 dark:text-blue-400 font-bold">
                              {proportions[t]} butir
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-700 animate-fade-in">
                    <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-200/60 dark:border-slate-700/60 flex-wrap gap-2">
                      <span className="font-bold text-slate-600 dark:text-slate-300">
                        Alokasi Butir Tiap Format:
                      </span>
                      <span className={`font-black px-2.5 py-0.5 rounded-full text-xs ${
                        sumCustomProportions === currentTotalQuestions
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        Total: {sumCustomProportions} / {currentTotalQuestions} Butir
                      </span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                      {selectedQuestionTypes.map((t) => {
                        const info = {
                          multiple_choice: { label: 'Pilihan Ganda', badgeBg: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300' },
                          true_false: { label: 'Benar / Salah', badgeBg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300' },
                          short_answer: { label: 'Isian Singkat', badgeBg: 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300' },
                          matching_pairs: { label: 'Menjodohkan', badgeBg: 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300' },
                        }[t];
                        const val = proportions[t] || 0;
                        const pct = Math.round((val / Math.max(1, currentTotalQuestions)) * 100);

                        return (
                          <div
                            key={t}
                            className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {info.label}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${info.badgeBg}`}>
                                {pct}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-1.5 w-full justify-between">
                                <button
                                  type="button"
                                  onClick={() => {
                                    playClick();
                                    setProportions((p) => ({ ...p, [t]: Math.max(0, (p[t] || 0) - 1) }));
                                  }}
                                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-sm flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 btn-press text-slate-800 dark:text-slate-200 shrink-0"
                                >-</button>
                                <span className="font-black text-sm text-slate-900 dark:text-white">
                                  {val}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    playClick();
                                    setProportions((p) => ({ ...p, [t]: (p[t] || 0) + 1 }));
                                  }}
                                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-sm flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 btn-press text-slate-800 dark:text-slate-200 shrink-0"
                                >+</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {sumCustomProportions !== currentTotalQuestions && (
                      <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-0.5">
                        <span>⚠️</span>
                        <span>Total alokasi ({sumCustomProportions}) harus pas dengan total butir ({currentTotalQuestions}).</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Kotak Sertakan Gambar AI */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors btn-press">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg shrink-0">
                  🎨
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      Ilustrasi Soal
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80 uppercase tracking-wider">
                      Beta
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 leading-snug">
                    Buat gambar visual pendukung yang sesuai dengan materi kuis.
                  </span>
                </div>
              </div>
              <div className="relative inline-flex items-center shrink-0">
                <input
                  type="checkbox"
                  checked={includeAiImages}
                  onChange={(e) => setIncludeAiImages(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>
          </div>

          {/* Navigasi Tahap 3 */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                playClick();
                if (selectedQuestionTypes.length === 0) {
                  showToast('Pilih minimal 1 format tipe soal untuk melanjutkan.', 'warning');
                  return;
                }
                if (selectedQuestionTypes.length > 1 && proportionMode === 'custom' && sumCustomProportions !== currentTotalQuestions) {
                  showToast(`Total butir soal (${sumCustomProportions}) belum sama dengan target kuis (${currentTotalQuestions}).`, 'warning');
                  return;
                }
                onStageChange(4);
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 min-h-[48px] btn-press transition-all"
            >
              <span>Lanjut ke Pilihan Mesin AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAHAP 4: PILIHAN MESIN AI & EKSEKUSI PEMBUATAN SOAL */}
      {/* ========================================================================= */}
      {stage === 4 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 sm:space-y-8 animate-fade-in">
          
          {/* Ringkasan Konfigurasi Kuis (Mini Spec Card Adaptif) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-2xs">
            {/* Baris 1: Identitas Mata Pelajaran & Kelas (Kiri) vs Spesifikasi Soal (Kanan) */}
            <div className="flex items-center justify-between gap-2.5 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base sm:text-lg shrink-0 select-none">
                  {EMOJI_BY_SUBJECT[subject] || '📚'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  <span>{subject}</span>
                  <span className="text-slate-300 dark:text-slate-600 select-none">•</span>
                  <span className="text-slate-600 dark:text-slate-300 font-semibold text-xs sm:text-sm">
                    Kelas {grade} {educationLevel === 'SMA' ? 'SMA / SMK' : educationLevel === 'SMP' ? 'SMP' : 'SD'}
                  </span>
                </div>
              </div>

              {/* Lencana Spesifikasi Soal */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-extrabold text-[11px] sm:text-xs">
                  {currentTotalQuestions} Soal
                </span>
                {includeAiImages && (
                  <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px] sm:text-[11px] border border-amber-200/60 dark:border-amber-800/60">
                    + Ilustrasi
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    onStageChange(3);
                  }}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline px-1 py-0.5 min-h-[28px] flex items-center"
                  title="Ubah jumlah atau format soal"
                >
                  Ubah
                </button>
              </div>
            </div>

            {/* Baris 2: Topik Pembahasan (Ditampilkan utuh, multi-line jika panjang, bebas keterpotongan) */}
            {topic ? (
              <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug break-words">
                &ldquo;{topic}&rdquo;
              </div>
            ) : (
              <div className="text-xs sm:text-sm italic text-slate-400 dark:text-slate-500">
                Topik kuis belum ditentukan
              </div>
            )}
          </div>

          {/* Pilihan Mesin Pembuat Soal */}
          <div className="space-y-4">
            {/* Header: Baris 1 Sejajar (Judul + Kelompok Aksi Kanan), Baris 2 Deskripsi */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  Pilih Mesin AI
                </label>

                {/* Toolbar Aksi Terpadu */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Tombol Segarkan Status (Sleek Ghost Icon Button) */}
                  <button
                    type="button"
                    disabled={isCheckingCloudAi}
                    onClick={() => {
                      playClick();
                      setIsCheckingCloudAi(true);
                      checkSupabaseAiStatus(true)
                        .then((status) => {
                          setSupabaseAi(status);
                        })
                        .catch(() => {})
                        .finally(() => setIsCheckingCloudAi(false));
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all btn-press disabled:opacity-50 flex items-center justify-center min-w-[36px] min-h-[36px]"
                    title="Periksa ulang status ketersediaan mesin AI"
                    aria-label="Periksa ulang status ketersediaan mesin AI"
                  >
                    <RefreshCw className={`w-4 h-4 ${isCheckingCloudAi ? 'animate-spin text-blue-500' : ''}`} />
                  </button>

                  {/* Tombol Kunci API: Ramping & Elegan */}
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setIsApiKeyModalOpen(true);
                    }}
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all btn-press min-h-[36px] shadow-2xs"
                    title="Atur Kunci API pribadi untuk DeepSeek, Groq, atau Gemini"
                  >
                    <Key className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Kunci API</span>
                    {(hasDeepSeekApiKey() || hasGroqApiKey() || hasGeminiApiKey()) && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Kunci API pribadi aktif"></span>
                    )}
                  </button>
                </div>
              </div>

              {/* Baris 2: Deskripsi Panduan */}
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                Pilih generator AI langsung atau salin prompt / impor berkas.
              </p>
            </div>

            {/* Alert Banner jika Seluruh AI Cloud Sedang Limit Kuota */}
            {isAllCloudLimited && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3 animate-fade-in shadow-2xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold text-amber-950 dark:text-amber-100 text-xs sm:text-sm">
                    Seluruh Layanan AI Cloud Sedang Mencapai Limit Kuota
                  </p>
                  <p className="leading-relaxed text-amber-800 dark:text-amber-300 text-[11px] sm:text-xs">
                    Pilihan otomatis dialihkan ke <strong>Prompt / Berkas (Direkomendasikan)</strong>. Generator lokal dihindari agar butir soal kuis Anda tetap berkualitas matang, mendidik, dan tidak monoton. Silakan salin prompt di bawah ke ChatGPT/Claude/Gemini secara gratis.
                  </p>
                </div>
              </div>
            )}

            {/* 1. Tiga Mode Pilihan Mesin Utama */}
            <div className="space-y-3">
              {/* Opsi 1: Mode Otomatis (Rekomendasi Utama Cloud) */}
              <button
                type="button"
                disabled={isAllCloudLimited}
                onClick={() => {
                  if (isAllCloudLimited) return;
                  playClick();
                  setSelectedEngine('auto');
                }}
                className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 min-h-[64px] ${
                  isAllCloudLimited
                    ? 'opacity-60 cursor-not-allowed bg-slate-100/90 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                    : selectedEngine === 'auto'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-50 ring-2 ring-blue-500/25 shadow-xs btn-press'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 btn-press'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 transition-colors shadow-2xs ${
                    isAllCloudLimited
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      : selectedEngine === 'auto'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 dark:bg-blue-900/60 text-blue-600'
                  }`}>
                    ⚡
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-extrabold text-xs sm:text-base block truncate ${
                        isAllCloudLimited ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        Otomatis
                      </span>
                      {isAllCloudLimited ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          Semua Cloud Limit
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                          Direkomendasikan
                        </span>
                      )}
                      {isCheckingCloudAi ? (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Memeriksa...
                        </span>
                      ) : isAllCloudLimited ? (
                        <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold">
                          (Kuota Habis)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                          (Aktif: {resolvedEngine === 'deepseek' ? '🐋 DeepSeek' : resolvedEngine === 'groq' ? '⚡ Groq' : resolvedEngine === 'gemini' ? '✨ Gemini' : '🤖 Lokal'})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 leading-snug">
                      {isAllCloudLimited
                        ? 'Seluruh kuota AI Cloud harian sedang limit. Pilihan dialihkan ke Prompt / Berkas di bawah.'
                        : 'Pilih model terbaik otomatis. Beralih ke cadangan jika batas tercapai.'}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    isAllCloudLimited
                      ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                      : selectedEngine === 'auto'
                      ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}>
                    {!isAllCloudLimited && selectedEngine === 'auto' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </button>

              {/* Grid 2 Kolom: Lokal (Offline) vs Prompt / Berkas (Manual / Rekomendasi Saat Limit) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opsi 2: Lokal */}
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedEngine('local');
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 btn-press min-h-[58px] ${
                    selectedEngine === 'local'
                      ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-50 ring-2 ring-blue-500/25 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 flex items-center justify-center text-xl font-bold shrink-0">
                      🤖
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-base text-slate-900 dark:text-white shrink-0">
                          Lokal
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Selalu Siap
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 leading-snug line-clamp-2">
                        Buat soal langsung di peramban tanpa internet atau kuota API.
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                      selectedEngine === 'local'
                        ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}>
                      {selectedEngine === 'local' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </button>

                {/* Opsi 3: Prompt / Berkas (Jatuh Ke Sini & Direkomendasikan Saat Cloud Limit) */}
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedEngine('prompt');
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 btn-press min-h-[58px] ${
                    selectedEngine === 'prompt'
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-50 ring-2 ring-indigo-500/25 shadow-xs'
                      : isAllCloudLimited
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 hover:border-amber-400'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 flex items-center justify-center text-xl font-bold shrink-0">
                      📝
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-base text-slate-900 dark:text-white shrink-0">
                          Prompt / Berkas
                        </span>
                        {isAllCloudLimited ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 inline-flex items-center gap-1 shrink-0 shadow-2xs">
                            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                            Direkomendasikan
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                            Manual
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 leading-snug line-clamp-2">
                        {isAllCloudLimited
                          ? 'Rekomendasi saat kuota Cloud habis: salin prompt ke ChatGPT/Claude/Gemini untuk butir soal kaya & matang.'
                          : 'Gunakan hasil prompt AI eksternal atau impor berkas dokumen.'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                      selectedEngine === 'prompt'
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}>
                      {selectedEngine === 'prompt' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </button>
              </div>

              {/* Accordion / Opsi Lipat: Model Cloud AI Spesifik (DeepSeek, Groq, Gemini) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setShowSpecificCloudModels(!showSpecificCloudModels);
                  }}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1.5 px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 btn-press"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showSpecificCloudModels || selectedEngine === 'deepseek' || selectedEngine === 'groq' || selectedEngine === 'gemini' ? 'rotate-180 text-blue-500' : ''}`} />
                  <span>Pilih Model Cloud Tertentu (DeepSeek, Groq, Gemini)</span>
                  {isAllCloudLimited ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-extrabold">
                      Semua Cloud Limit
                    </span>
                  ) : (selectedEngine === 'deepseek' || selectedEngine === 'groq' || selectedEngine === 'gemini') ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-extrabold">
                      Aktif: {selectedEngine === 'deepseek' ? 'DeepSeek' : selectedEngine === 'groq' ? 'Groq' : 'Gemini'}
                    </span>
                  ) : null}
                </button>

                {/* Sub-grid Model Cloud: Tampil hanya jika dibuka atau jika salah satu sedang aktif */}
                {(showSpecificCloudModels || selectedEngine === 'deepseek' || selectedEngine === 'groq' || selectedEngine === 'gemini') && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 animate-fade-in">
                    {/* Option: DeepSeek AI */}
                    <button
                      type="button"
                      disabled={isDeepSeekLimited}
                      onClick={() => {
                        if (isDeepSeekLimited) return;
                        playClick();
                        setSelectedEngine('deepseek');
                      }}
                      title={isDeepSeekLimited ? 'Kuota DeepSeek sedang mencapai limit' : undefined}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center sm:items-stretch sm:flex-col justify-between gap-3 min-h-[58px] sm:min-h-[135px] ${
                        isDeepSeekLimited
                          ? 'opacity-50 cursor-not-allowed bg-slate-100/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                          : selectedEngine === 'deepseek'
                          ? 'border-sky-600 bg-sky-50/80 dark:bg-sky-950/40 text-sky-950 dark:text-sky-50 ring-2 ring-sky-500/25 shadow-xs btn-press'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 btn-press'
                      }`}
                    >
                      <div className="flex items-center sm:items-start gap-3 sm:block flex-1 min-w-0">
                        <div className="flex items-center justify-between sm:mb-2.5 shrink-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${
                            isDeepSeekLimited
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                              : 'bg-sky-100 dark:bg-sky-900/60 text-sky-600'
                          }`}>
                            🐋
                          </div>
                          <div className="hidden sm:block">
                            {renderEngineStatusBadge(deepseekHealth)}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`font-extrabold text-xs sm:text-sm block truncate ${
                              isDeepSeekLimited ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                            }`}>
                              DeepSeek AI
                            </span>
                            <div className="sm:hidden">
                              {renderEngineStatusBadge(deepseekHealth, true)}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2 sm:line-clamp-none">
                            {isDeepSeekLimited
                              ? 'Batas kuota harian tercapai. Tidak dapat dipilih.'
                              : 'Fokus pada soal penalaran logis dan berpikir kritis (HOTS).'}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center sm:mt-2.5 sm:self-end">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isDeepSeekLimited
                            ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                            : selectedEngine === 'deepseek'
                            ? 'border-sky-600 bg-sky-600 text-white shadow-2xs'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}>
                          {!isDeepSeekLimited && selectedEngine === 'deepseek' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </button>

                    {/* Option: Groq Cloud */}
                    <button
                      type="button"
                      disabled={isGroqLimited}
                      onClick={() => {
                        if (isGroqLimited) return;
                        playClick();
                        setSelectedEngine('groq');
                      }}
                      title={isGroqLimited ? 'Kuota Groq sedang mencapai limit' : undefined}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center sm:items-stretch sm:flex-col justify-between gap-3 min-h-[58px] sm:min-h-[135px] ${
                        isGroqLimited
                          ? 'opacity-50 cursor-not-allowed bg-slate-100/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                          : selectedEngine === 'groq'
                          ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-50 ring-2 ring-amber-500/25 shadow-xs btn-press'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 btn-press'
                      }`}
                    >
                      <div className="flex items-center sm:items-start gap-3 sm:block flex-1 min-w-0">
                        <div className="flex items-center justify-between sm:mb-2.5 shrink-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${
                            isGroqLimited
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                              : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600'
                          }`}>
                            ⚡
                          </div>
                          <div className="hidden sm:block">
                            {renderEngineStatusBadge(groqHealth)}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`font-extrabold text-xs sm:text-sm block truncate ${
                              isGroqLimited ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                            }`}>
                              Groq Cloud
                            </span>
                            <div className="sm:hidden">
                              {renderEngineStatusBadge(groqHealth, true)}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2 sm:line-clamp-none">
                            {isGroqLimited
                              ? 'Batas kuota harian tercapai. Tidak dapat dipilih.'
                              : 'Generasi butir soal paling cepat dengan pemrosesan efisien.'}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center sm:mt-2.5 sm:self-end">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isGroqLimited
                            ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                            : selectedEngine === 'groq'
                            ? 'border-amber-600 bg-amber-600 text-white shadow-2xs'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}>
                          {!isGroqLimited && selectedEngine === 'groq' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </button>

                    {/* Option: Google Gemini */}
                    <button
                      type="button"
                      disabled={isGeminiLimited}
                      onClick={() => {
                        if (isGeminiLimited) return;
                        playClick();
                        setSelectedEngine('gemini');
                      }}
                      title={isGeminiLimited ? 'Kuota Google Gemini sedang mencapai limit' : undefined}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center sm:items-stretch sm:flex-col justify-between gap-3 min-h-[58px] sm:min-h-[135px] ${
                        isGeminiLimited
                          ? 'opacity-50 cursor-not-allowed bg-slate-100/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                          : selectedEngine === 'gemini'
                          ? 'border-purple-600 bg-purple-50/80 dark:bg-purple-950/40 text-purple-950 dark:text-purple-50 ring-2 ring-purple-500/25 shadow-xs btn-press'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 btn-press'
                      }`}
                    >
                      <div className="flex items-center sm:items-start gap-3 sm:block flex-1 min-w-0">
                        <div className="flex items-center justify-between sm:mb-2.5 shrink-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${
                            isGeminiLimited
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                              : 'bg-purple-100 dark:bg-purple-900/60 text-purple-600'
                          }`}>
                            ✨
                          </div>
                          <div className="hidden sm:block">
                            {renderEngineStatusBadge(geminiHealth)}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`font-extrabold text-xs sm:text-sm block truncate ${
                              isGeminiLimited ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                            }`}>
                              Google Gemini
                            </span>
                            <div className="sm:hidden">
                              {renderEngineStatusBadge(geminiHealth, true)}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2 sm:line-clamp-none">
                            {isGeminiLimited
                              ? 'Batas kuota harian tercapai. Tidak dapat dipilih.'
                              : 'Gaya bahasa luwes dengan variasi pertanyaan yang luas.'}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center sm:mt-2.5 sm:self-end">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isGeminiLimited
                            ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                            : selectedEngine === 'gemini'
                            ? 'border-purple-600 bg-purple-600 text-white shadow-2xs'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}>
                          {!isGeminiLimited && selectedEngine === 'gemini' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Indikator Status & Rekomendasi Mesin Terpilih (Informatif & Solutif) */}
            {selectedEngine !== 'auto' && selectedEngine !== 'local' && selectedEngine !== 'prompt' && (() => {
              const health = getEngineHealthDetail(selectedEngine, supabaseAi);
              if (health.status === 'quota_exhausted') {
                return (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-extrabold block">
                          Kuota {selectedEngine === 'deepseek' ? 'DeepSeek' : selectedEngine === 'groq' ? 'Groq' : 'Gemini'} Telah Habis:
                        </span>
                        <p className="leading-relaxed text-[11px] sm:text-xs text-rose-800 dark:text-rose-300">
                          {health.description} Anda dapat beralih ke mode <strong>Prompt / Berkas (Direkomendasikan)</strong> untuk hasil soal yang matang dan bervariasi.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setSelectedEngine('prompt');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs shrink-0 self-start sm:self-center btn-press"
                    >
                      <span>Gunakan Prompt / Berkas</span>
                    </button>
                  </div>
                );
              }
              if (health.status === 'busy') {
                return (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-extrabold block">
                          Layanan {selectedEngine === 'deepseek' ? 'DeepSeek' : selectedEngine === 'groq' ? 'Groq' : 'Gemini'} Sedang Sibuk:
                        </span>
                        <p className="leading-relaxed text-[11px] sm:text-xs text-amber-800 dark:text-amber-300">
                          Server sedang memproses antrean tinggi. Anda dapat tetap melanjutkan atau beralih ke mesin <strong>Lokal</strong> untuk peracikan tanpa jeda antrean.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setSelectedEngine('local');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold text-xs hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs shrink-0 self-start sm:self-center btn-press"
                    >
                      <span>Beralih ke Lokal</span>
                    </button>
                  </div>
                );
              }
              if (health.status === 'error') {
                return (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-extrabold block">
                          Gangguan Sambungan AI ({selectedEngine.toUpperCase()}):
                        </span>
                        <p className="leading-relaxed text-[11px] sm:text-xs text-rose-800 dark:text-rose-300">
                          {health.description} Silakan beralih ke mesin <strong>Lokal</strong> untuk meracik kuis tanpa kendala koneksi API.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setSelectedEngine('local');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs shrink-0 self-start sm:self-center btn-press"
                    >
                      <span>Gunakan Mesin Lokal Saja</span>
                    </button>
                  </div>
                );
              }
              return null;
            })()}

            {/* Banner info bantuan jika DeepSeek dipilih dan belum ada kunci */}
            {selectedEngine === 'deepseek' && !hasDeepSeekApiKey() && !supabaseAi.hasDeepSeek && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-900/60 text-xs text-sky-900 dark:text-sky-200 flex items-center justify-between gap-3 flex-wrap animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🐋</span>
                  <span>
                    <strong>Kunci DeepSeek Diperlukan:</strong> Masukkan API Key dari <em>platform.deepseek.com</em> untuk mengaktifkan model ini.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setApiKeyTab('deepseek');
                    setIsApiKeyModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs btn-press shrink-0 min-h-[36px]"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Atur Kunci API</span>
                </button>
              </div>
            )}
          </div>

          {/* Area Interaktif Khusus jika Salin Prompt / Berkas Dipilih */}
          {selectedEngine === 'prompt' && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 animate-fade-in space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
                
                {/* Kolom Kiri: Teks Prompt Siap Pakai */}
                <div className="lg:col-span-6 flex flex-col justify-between p-4 sm:p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 gap-3.5 shadow-2xs">
                  {/* Header Card 1 */}
                  <div className="flex items-center justify-between flex-wrap gap-2 shrink-0">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black inline-flex items-center justify-center">1</span>
                      <span>Salin Prompt AI</span>
                    </span>

                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs btn-press min-h-[36px]"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Prompt</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Area Konten Fleksibel */}
                  <div className="flex-1 flex flex-col min-h-0 space-y-1.5">
                    <ResizableTextarea
                      ref={promptTextareaRef}
                      readOnly
                      rows={5}
                      value={generatedPromptText}
                      placeholder="Prompt AI akan dimuat di sini..."
                      containerClassName="flex-1 flex flex-col min-h-0"
                      className="flex-1 font-mono text-xs sm:text-sm select-all min-h-[135px]"
                      minHeight={135}
                      maxHeight={750}
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5 shrink-0">
                      <span>Klik kolom untuk pilih semua teks prompt.</span>
                      <span className="hidden sm:inline text-[10px] text-slate-400/80">Tarik sudut kanan bawah untuk perbesar</span>
                    </div>
                  </div>

                  {/* Footer Helper Box Card 1 */}
                  <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50 text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed font-medium flex items-center gap-2 shrink-0">
                    <span className="text-base shrink-0">💡</span>
                    <span><strong>Cara Pakai:</strong> Salin prompt di atas → tempelkan ke ChatGPT/Claude/Gemini → salin balasannya dan masukkan pada kolom di samping/bawah.</span>
                  </div>
                </div>

                {/* Kolom Kanan: Input Hasil Soal / Unggah Berkas */}
                <div className="lg:col-span-6 flex flex-col justify-between p-4 sm:p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 gap-3.5 shadow-2xs">
                  {/* Header Card 2 */}
                  <div className="flex items-center justify-between flex-wrap gap-2 shrink-0">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black inline-flex items-center justify-center">2</span>
                      <span>Hasil Kuis / Berkas</span>
                    </span>

                    <div className="flex p-0.5 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-300/50 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setInputMethodTab('paste');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[32px] ${
                          inputMethodTab === 'paste'
                            ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        📝 Tempel Teks
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setInputMethodTab('file');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[32px] ${
                          inputMethodTab === 'file'
                            ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        📂 Unggah Berkas
                      </button>
                    </div>
                  </div>

                  {/* Area Konten Fleksibel yang Mengisi Ruang Penuh */}
                  <div className="flex-1 flex flex-col min-h-0">
                    {inputMethodTab === 'paste' ? (
                      <div className="flex-1 flex flex-col justify-between space-y-1.5 min-h-0">
                        <ResizableTextarea
                          rows={5}
                          value={rawInputText}
                          onChange={(e) => setRawInputText(e.target.value)}
                          placeholder="Tempelkan hasil respons AI (format JSON array atau teks bernomor: 1. Pertanyaan... A. Opsi... Kunci: ...) di sini..."
                          containerClassName="flex-1 flex flex-col min-h-0"
                          className="flex-1 font-mono text-xs sm:text-sm min-h-[135px]"
                          minHeight={135}
                          maxHeight={750}
                        />
                        <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5 shrink-0">
                          <span>Mendukung format JSON atau teks kuis bernomor.</span>
                          <span className="hidden sm:inline text-[10px] text-slate-400/80">Tarik sudut kanan bawah untuk perbesar</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 p-5 sm:p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center space-y-3 flex flex-col justify-center items-center shadow-xs min-h-[150px]">
                        <UploadCloud className="w-10 h-10 text-blue-500 shrink-0" />
                        <div>
                          <label className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-sm min-h-[42px] btn-press">
                            Pilih Berkas (.xlsx, .csv, .json, .txt)
                            <input
                              type="file"
                              accept=".xlsx,.xls,.csv,.json,.txt"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[11px] text-slate-400 mt-1.5">
                            Mendukung file spreadsheet CSV, Excel, atau berkas teks.
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 w-full flex items-center justify-center">
                          <button
                            type="button"
                            onClick={handleDownloadCsvTemplate}
                            className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1.5 min-h-[32px]"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Unduh Contoh Template CSV
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Helper Box Card 2: Menyelaraskan dengan Card 1 */}
                  <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed font-medium flex items-center gap-2 shrink-0">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Seluruh butir soal akan otomatis diekstrak dan siap diperiksa di Studio Bank Soal.</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Action Footer Tahap 4 */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            {selectedEngine === 'prompt' ? (
              <button
                type="button"
                onClick={handleParseAndOpenStudio}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 min-h-[48px] btn-press transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Periksa & Buka Bank Soal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isLoading || (proportionMode === 'custom' && sumCustomProportions !== currentTotalQuestions)}
                onClick={handleExecuteAiDirect}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 min-h-[48px] btn-press transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sedang Meracik Butir Soal...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>Buat Kuis Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL OVERLAY: KATALOG MATA PELAJARAN LENGKAP (PORTAL KE BODY Z-[100]) */}
      {/* ========================================================================= */}
      {isSubjectModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsSubjectModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-zoom-in my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-black shrink-0">
                  📚
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                    Katalog Mata Pelajaran Lengkap
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Kurikulum Merdeka {educationLevel === 'SMA' ? 'SMA / SMK' : educationLevel === 'SMP' ? 'SMP / MTs' : 'SD / MI'} (Standar & Terstruktur)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-press shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pencarian Mapel */}
            <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={subjectSearchQuery}
                  onChange={(e) => setSubjectSearchQuery(e.target.value)}
                  placeholder="Cari mata pelajaran (misal: inggris, pjok, seni, agama, informatika)..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                />
                {subjectSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSubjectSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Daftar Mapel Terkategori */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {filteredSubjectCategories.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <p className="text-3xl">🔍</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Mata pelajaran tidak ditemukan</p>
                  <p className="text-xs text-slate-400">Coba gunakan kata kunci pencarian yang lain.</p>
                </div>
              ) : (
                filteredSubjectCategories.map((category) => (
                  <div key={category.name} className="space-y-2.5">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                      {category.name}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {category.items.map((item) => {
                        const isSelected = subject === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              playClick();
                              setSubject(item.id);
                              setIsSubjectModalOpen(false);
                            }}
                            className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all min-h-[56px] btn-press ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/25 shadow-xs'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="text-2xl shrink-0">{item.emoji}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-extrabold text-xs sm:text-sm truncate">
                                  {item.name}
                                </span>
                                {isSelected && (
                                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                                {item.desc}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Kurikulum Merdeka {educationLevel === 'SMA' ? 'SMA / SMK' : educationLevel === 'SMP' ? 'SMP / MTs' : 'SD / MI'} (Terstruktur)</span>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="px-4 py-2 rounded-xl font-bold bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors btn-press min-h-[40px]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* ========================================================================= */}
      {/* MODAL OVERLAY: PENGATURAN KUNCI API PRIBADI (PORTAL KE BODY Z-[100]) */}
      {/* ========================================================================= */}
      {isApiKeyModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsApiKeyModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-zoom-in my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-black shrink-0">
                  🔑
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                    Kunci API Pribadi
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Tersimpan aman di peramban perangkat Anda (privat)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(false)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-press shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Provider Switcher Tabs */}
            <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40">
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800 border border-slate-300/40 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setApiKeyTab('deepseek');
                  }}
                  className={`py-2 px-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 min-h-[38px] ${
                    apiKeyTab === 'deepseek'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>🐋 DeepSeek</span>
                  {hasDeepSeekApiKey() && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setApiKeyTab('groq');
                  }}
                  className={`py-2 px-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 min-h-[38px] ${
                    apiKeyTab === 'groq'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>⚡ Groq</span>
                  {hasGroqApiKey() && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setApiKeyTab('gemini');
                  }}
                  className={`py-2 px-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 min-h-[38px] ${
                    apiKeyTab === 'gemini'
                      ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>✨ Gemini</span>
                  {hasGeminiApiKey() && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {keySaveMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{keySaveMessage}</span>
                </div>
              )}

              {/* TAB 1: DEEPSEEK AI */}
              {apiKeyTab === 'deepseek' && (
                <div className="space-y-4 animate-fade-in">
                  {supabaseAi.hasDeepSeek && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                      <span><strong>Kunci Bawaan Siap:</strong> Layanan DeepSeek aktif di sistem. Kolom di bawah opsional jika ingin memakai akun & kuota pribadi Anda.</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Kunci API DeepSeek:
                      </label>
                      <a
                        href="https://platform.deepseek.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                      >
                        Dapatkan Kunci <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showKeySecret ? 'text' : 'password'}
                        value={deepseekKeyInput}
                        onChange={(e) => setDeepseekKeyInput(e.target.value)}
                        placeholder="sk-..."
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-sky-500 min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeySecret(!showKeySecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[36px] flex items-center"
                      >
                        {showKeySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                      Pilihan Model:
                    </label>
                    <select
                      value={deepseekModelChoice}
                      onChange={(e) => setDeepseekModelChoice(e.target.value as DeepSeekModel)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none min-h-[44px]"
                    >
                      <option value="deepseek-chat">DeepSeek-V3 (Standar & Cepat)</option>
                      <option value="deepseek-reasoner">DeepSeek-R1 (Penalaran HOTS)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>Kunci tersimpan lokal di peramban dan hanya digunakan saat meracik soal.</span>
                  </div>
                </div>
              )}

              {/* TAB 2: GROQ CLOUD */}
              {apiKeyTab === 'groq' && (
                <div className="space-y-4 animate-fade-in">
                  {supabaseAi.hasGroq && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                      <span><strong>Kunci Bawaan Siap:</strong> Layanan Groq aktif di sistem. Kolom di bawah opsional jika ingin memakai akun & kuota pribadi Anda.</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Kunci API Groq:
                      </label>
                      <a
                        href="https://console.groq.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                      >
                        Dapatkan Kunci <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showKeySecret ? 'text' : 'password'}
                        value={groqKeyInput}
                        onChange={(e) => setGroqKeyInput(e.target.value)}
                        placeholder="gsk_..."
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-amber-500 min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeySecret(!showKeySecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[36px] flex items-center"
                      >
                        {showKeySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                      Pilihan Model:
                    </label>
                    <select
                      value={groqModelChoice}
                      onChange={(e) => setGroqModelChoice(e.target.value as GroqModel)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none min-h-[44px]"
                    >
                      <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Akurat & Seimbang)</option>
                      <option value="llama-3.1-8b-instant">Llama 3.1 8B (Sangat Cepat)</option>
                      <option value="deepseek-r1-distill-llama-70b">DeepSeek R1 Distill (Penalaran HOTS)</option>
                      <option value="qwen/qwen3.8-27b">Qwen 3.8 27B (Responsif)</option>
                      <option value="gemma2-9b-it">Gemma 2 9B (Ringan)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>Kunci tersimpan lokal di peramban dan hanya digunakan saat meracik soal.</span>
                  </div>
                </div>
              )}

              {/* TAB 3: GEMINI AI */}
              {apiKeyTab === 'gemini' && (
                <div className="space-y-4 animate-fade-in">
                  {supabaseAi.hasGemini && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                      <span><strong>Kunci Bawaan Siap:</strong> Layanan Gemini aktif di sistem. Kolom di bawah opsional jika ingin memakai akun & kuota pribadi Anda.</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Kunci API Gemini:
                      </label>
                      <a
                        href="https://aistudio.google.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                      >
                        Dapatkan Kunci <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showKeySecret ? 'text' : 'password'}
                        value={geminiKeyInput}
                        onChange={(e) => setGeminiKeyInput(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-purple-500 min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeySecret(!showKeySecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[36px] flex items-center"
                      >
                        {showKeySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                      Pilihan Model:
                    </label>
                    <select
                      value={geminiModelChoice}
                      onChange={(e) => setGeminiModelChoice(e.target.value as GeminiModel)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none min-h-[44px]"
                    >
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash (Cepat & Akurat)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Detail & Konteks Luas)</option>
                      <option value="gemini-3.8-flash">Gemini 3.8 Flash (Performa Tinggi)</option>
                      <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Sangat Ringan)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>Kunci tersimpan lokal di peramban dan hanya digunakan saat meracik soal.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 flex items-center justify-between gap-2.5">
              <div>
                {((apiKeyTab === 'deepseek' && hasDeepSeekApiKey()) ||
                  (apiKeyTab === 'groq' && hasGroqApiKey()) ||
                  (apiKeyTab === 'gemini' && hasGeminiApiKey())) && (
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      if (apiKeyTab === 'deepseek') {
                        saveStoredDeepSeekApiKey('');
                        setDeepseekKeyInput('');
                      } else if (apiKeyTab === 'groq') {
                        saveStoredGroqApiKey('');
                        setGroqKeyInput('');
                      } else if (apiKeyTab === 'gemini') {
                        saveStoredGeminiApiKey('');
                        setGeminiKeyInput('');
                      }
                      setSupabaseAi({ ...getSupabaseAiStatusSync() });
                      setKeySaveMessage('Kunci telah dihapus.');
                      setTimeout(() => setKeySaveMessage(null), 1000);
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline px-2 py-1.5 min-h-[36px]"
                  >
                    Hapus Kunci
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-750 transition-colors btn-press min-h-[40px]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiKeySettings}
                  className="px-5 py-2 rounded-xl font-black text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center gap-1.5 btn-press transition-all min-h-[40px]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Kunci</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Floating Toast Notification (Portal mengambang presisi di atas seluruh konten dan selalu terlihat di viewport) */}
      {toast && typeof document !== 'undefined' && createPortal(
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-8 left-1/2 z-[200] w-[calc(100vw-2rem)] xs:w-[calc(100vw-2.5rem)] sm:w-auto sm:min-w-[360px] sm:max-w-[480px] animate-toast-slide-up pointer-events-auto"
        >
          <div
            className={`relative overflow-hidden rounded-2xl p-3 sm:p-3.5 shadow-2xl backdrop-blur-xl border flex items-center gap-3 transition-all ${
              toast.type === 'error'
                ? 'bg-slate-900/95 dark:bg-slate-900/95 border-rose-500/40 text-slate-100 shadow-[0_16px_36px_-6px_rgba(244,63,94,0.25)]'
                : toast.type === 'warning'
                ? 'bg-slate-900/95 dark:bg-slate-900/95 border-amber-500/40 text-slate-100 shadow-[0_16px_36px_-6px_rgba(245,158,11,0.25)]'
                : toast.type === 'success'
                ? 'bg-slate-900/95 dark:bg-slate-900/95 border-emerald-500/40 text-slate-100 shadow-[0_16px_36px_-6px_rgba(16,185,129,0.25)]'
                : 'bg-slate-900/95 dark:bg-slate-900/95 border-blue-500/40 text-slate-100 shadow-[0_16px_36px_-6px_rgba(59,130,246,0.25)]'
            }`}
          >
            {/* Left Icon Badge */}
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                toast.type === 'error'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : toast.type === 'warning'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : toast.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5" />
              ) : toast.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>

            {/* Text Message Area */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider ${
                    toast.type === 'error'
                      ? 'text-rose-400'
                      : toast.type === 'warning'
                      ? 'text-amber-400'
                      : toast.type === 'success'
                      ? 'text-emerald-400'
                      : 'text-blue-400'
                  }`}
                >
                  {toast.type === 'error'
                    ? 'Kendala'
                    : toast.type === 'warning'
                    ? 'Perhatian'
                    : toast.type === 'success'
                    ? 'Berhasil'
                    : 'Informasi'}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug break-words">
                {toast.message}
              </p>
            </div>

            {/* Close Button - Target Sentuh Standar 44x44px (User Rule 1) */}
            <button
              type="button"
              onClick={() => setToast(null)}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center shrink-0 -mr-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Animated Progress Bar */}
            <div
              className={`absolute bottom-0 left-0 h-[2.5px] rounded-full animate-toast-progress ${
                toast.type === 'error'
                  ? 'bg-rose-500'
                  : toast.type === 'warning'
                  ? 'bg-amber-500'
                  : toast.type === 'success'
                  ? 'bg-emerald-500'
                  : 'bg-blue-500'
              }`}
            />
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
