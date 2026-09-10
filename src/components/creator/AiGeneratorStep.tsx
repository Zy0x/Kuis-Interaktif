import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Subject, QuizQuestion } from '../../types/quiz';
import { 
  generateHybridQuizQuestions, 
  checkSupabaseAiStatus, 
  getSupabaseAiStatusSync, 
  generateAiTopicIdeas,
  generateAiCapaianPembelajaran,
  isAnyAiAvailable,
  type AiProvider, 
  type SupabaseAiStatus 
} from '../../lib/geminiApi';
import { 
  parseRawQuestionsText, 
  generateAiPrompt, 
  getQuestionCsvTemplate 
} from '../../lib/aiQuestionParser';
import { 
  Sparkles, 
  Zap, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Cloud, 
  Download, 
  UploadCloud, 
  Copy, 
  Check, 
  Shuffle, 
  Info, 
  Eye,
  Search,
  X
} from 'lucide-react';

export type CreationStage = 1 | 2 | 3 | 4;

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
  stage: CreationStage;
  onStageChange: (stage: CreationStage) => void;
  topic: string;
  onTopicChange: (topic: string) => void;
}

const EMOJI_BY_SUBJECT: Record<Subject, string> = {
  'Matematika': '📐',
  'IPA': '🌱',
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

export const getCuratedTopics = (subj: Subject, grd: number): TopicRecommendation[] => {
  const map = SMART_TOPICS_BY_SUBJECT_AND_GRADE as Record<string, Record<number, TopicRecommendation[]>>;
  if (map[subj]?.[grd] && map[subj][grd].length > 0) {
    return map[subj][grd];
  }
  return [
    { topic: `Konsep Inti ${subj} Kelas ${grd}`, context: `Eksplorasi konsep terpenting yang wajib dikuasai siswa Kelas ${grd} SD sesuai Kurikulum Merdeka.` },
    { topic: `Penerapan ${subj} dalam Kehidupan Sehari-hari`, context: `Contoh konkret dan kontekstual yang dekat dengan pengalaman anak di rumah dan sekolah.` },
    { topic: `Uji Pemahaman & Logika Penalaran ${subj}`, context: `Soal-soal pemantik berpikir kritis dan solutif yang menyenangkan dan ramah anak.` },
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
  },
  'IPA': {
    1: 'Peserta didik mengamati lingkungan sekitar, mengenali fungsi panca indra dan bagian tubuh luar, serta membedakan benda hidup dan benda mati dalam kehidupan sehari-hari.',
    2: 'Peserta didik mengidentifikasi kebutuhan dasar makhluk hidup (air, makanan, udara), mengamati siklus pergantian siang-malam dan cuaca, serta mempraktikkan kebiasaan menjaga kebersihan lingkungan.',
    3: 'Peserta didik mengidentifikasi wujud benda (padat, cair, gas) beserta perubahannya (mencair, membeku, menguap), memahami ciri-ciri pertumbuhan makhluk hidup, dan pengaruh gaya dorong/tarik terhadap gerak.',
    4: 'Peserta didik menganalisis daur hidup hewan (metamorfosis sempurna dan tak sempurna), fungsi bagian tubuh tumbuhan (akar, batang, daun), sifat-sifat gaya (otot, magnet, gravitasi), serta perubahan wujud zat menyublim.',
    5: 'Peserta didik menganalisis sistem pernapasan dan pencernaan manusia, hubungan rantai makanan dan jaring-jaring kehidupan pada ekosistem, sifat perpindahan kalor (konduksi, konveksi, radiasi), serta siklus air.',
    6: 'Peserta didik menganalisis cara perkembangbiakan vegetatif dan generatif tumbuhan/hewan, adaptasi makhluk hidup terhadap habitatnya, sifat rangkaian listrik seri-paralel, serta sistem tata surya dan gerhana.',
  },
  'Bahasa Indonesia': {
    1: 'Peserta didik menyimak instruksi lisan sederhana, membaca kata dan suku kata berpola terbuka/tertutup, serta menulis huruf tegak bersambung dan kalimat sederhana berakhiran tanda titik.',
    2: 'Peserta didik membaca nyaring teks pendek dengan intonasi tepat, menggunakan huruf kapital pada nama orang dan hari, menyusun kalimat tanya sederhana, serta menyampaikan pendapat lisan secara santun.',
    3: 'Peserta didik menemukan ide pokok teks deskripsi dan petunjuk sederhana, memperkaya kosakata baku, menulis paragraf pendek terstruktur, serta menceritakan kembali isi dongeng fabel secara runtut.',
    4: 'Peserta didik menganalisis ide pokok teks narasi dan petunjuk bertahap, membedakan kalimat fakta dan opini, menulis teks deskripsi pengalaman pribadi, serta menyimak wawancara sederhana.',
    5: 'Peserta didik menganalisis informasi tersurat dan tersirat dari teks eksplanasi ilmiah populer, menyampaikan pidato persuasif di depan kelas, serta menulis ringkasan laporan hasil pengamatan.',
    6: 'Peserta didik mengevaluasi teks argumentasi dan berita kritis, menyusun karya fiksi/nonfiksi pendek yang padu, menguasai pengisian formulir resmi, serta mengapresiasi majas personifikasi dan metafora.',
  },
  'Pendidikan Pancasila': {
    1: 'Peserta didik mengenal lambang Garuda Pancasila dan sila-silanya, menyebutkan contoh aturan di rumah dan sekolah, serta menghargai perbedaan fisik dan kegemaran teman di kelas.',
    2: 'Peserta didik menceritakan arti simbol-simbol sila Pancasila, menaati aturan musyawarah di kelas, serta mempraktikkan sikap saling tolong-menolong tanpa membedakan teman sebaya.',
    3: 'Peserta didik menerapkan nilai-nilai Pancasila dalam kegiatan gotong royong di lingkungan sekolah, memahami hak dan kewajiban siswa, serta menghargai keragaman tradisi lokal.',
    4: 'Peserta didik meneladani makna sila Pancasila dalam toleransi beragama dan suku bangsa, memahami norma hukum tertulis dan norma kesopanan, serta bangga terhadap identitas budaya daerah.',
    5: 'Peserta didik mendalami nilai sejarah perumusan Pancasila sebagai dasar negara, membedakan hak-kewajiban-tanggung jawab warga negara, serta aktif dalam pelestarian warisan budaya nusantara.',
    6: 'Peserta didik memahami Pancasila sebagai pandangan hidup bangsa, peran lembaga negara, menjaga keutuhan NKRI, serta menerapkan etika bermedia sosial dan toleransi global.',
  },
  'Pengetahuan Umum': {
    1: 'Peserta didik mengenal aneka profesi di lingkungan sekitar, rambu keselamatan dasar di jalan raya, serta mengenal jenis alat transportasi tradisional dan modern ramah anak.',
    2: 'Peserta didik mengenal peta pulau-pulau besar di Indonesia, ragam pakaian adat nusantara, serta tata krama berkunjung ke tempat umum dan fasilitas bersama.',
    3: 'Peserta didik mengenal keragaman suku bangsa di 38 provinsi Indonesia, rumah adat dan senjata tradisional, serta kisah perjuangan pahlawan perintis kemerdekaan.',
    4: 'Peserta didik memahami bentang alam Indonesia (pegunungan, danau, selat, laut), flora dan fauna endemik garis Wallace-Weber, serta peristiwa bersejarah Sumpah Pemuda.',
    5: 'Peserta didik memahami letak geografis benua dan samudra dunia, organisasi negara-negara sahabat ASEAN, pemanfaatan sumber daya alam berkelanjutan, dan energi baru terbarukan.',
    6: 'Peserta didik memahami sejarah diplomasi kemerdekaan RI, peran Indonesia di PBB dan kancah internasional, serta perkembangan teknologi komunikasi dan etika era digital global.',
  },
  'Bahasa Inggris': {
    1: 'Learners recognize and pronounce basic greetings, numbers 1-10, primary colors, and classroom objects through engaging songs, flashcards, and interactive games.',
    2: 'Learners express feelings and simple needs, count numbers 11-20, identify family members and animals, and follow simple two-step classroom commands.',
    3: 'Learners describe daily routines and telling time on the clock, express likes and dislikes for food/drinks, and ask simple yes/no questions using basic present tense.',
    4: 'Learners describe people’s physical appearance, clothes, and favorite hobbies, comprehend short illustrated paragraphs, and talk about weather conditions.',
    5: 'Learners engage in dialogues asking for directions, ordering food at a canteen, talk about past experiences using simple past tense, and write short descriptive sentences.',
    6: 'Learners read short narrative stories and informational texts, express future plans using "going to", write friendly messages, and explain basic comparisons (bigger, smaller).',
  },
  'PJOK': {
    1: 'Peserta didik mempraktikkan pola gerak dasar lokomotor (berjalan, berlari, melompat) dan non-lokomotor, serta membiasakan mencuci tangan dan postur berdiri tegak.',
    2: 'Peserta didik mengombinasikan gerak lokomotor dan non-lokomotor dalam permainan tradisional sederhana (kucing-tikus, gobak sodor) dan melatih kelenturan tubuh.',
    3: 'Peserta didik mempraktikkan gerak manipulatif (melempar, menangkap, menendang bola), senam lantai ketangkasan sederhana, serta pembiasaan istirahat dan tidur sehat.',
    4: 'Peserta didik mengombinasikan pola gerak dasar dalam permainan bola kecil (kasti) dan bola besar (sepak bola mini/voli mini), serta memahami pertolongan pertama luka lecet.',
    5: 'Peserta didik menerapkan taktik gerak olahraga beregu, senam irama ritmik berpasangan, teknik dasar renang gaya dada, serta memahami bahaya merokok dan zat adiktif.',
    6: 'Peserta didik menganalisis dan mempraktikkan keterampilan kebugaran jasmani (daya tahan, kekuatan, kelincahan), keselamatan aktivitas di air, serta pencegahan cedera olahraga dan perundungan.',
  },
  'Seni Rupa': {
    1: 'Peserta didik bereksplorasi dengan unsur rupa garis tebal/tipis, bentuk geometris sederhana, dan warna primer melalui kegiatan menggambar ekspresi bebas.',
    2: 'Peserta didik mencampurkan warna primer menjadi sekunder, menciptakan pola cetak sederhana dari pelepah pisang/daun, dan membuat bentuk hewan/bunga dari plastisin.',
    3: 'Peserta didik merancang komposisi ritme visual, menciptakan karya kolase dari bahan alam sekitar, dan membuat karya dekoratif dua dimensi bertema flora-fauna.',
    4: 'Peserta didik menerapkan prinsip proporsi dan simetri dalam menggambar rumah adat, merancang motif ragam hias batik nusantara, serta membuat karya topeng kertas tiga dimensi.',
    5: 'Peserta didik merancang karya gambar perspektif satu titik hilang, membuat desain poster edukatif peduli lingkungan hidup, dan mengolah limbah plastik menjadi kriya kreatif.',
    6: 'Peserta didik merancang komposisi visual bermakna dengan prinsip keseimbangan dan kontras, membuat instalasi seni terapan, serta mengapresiasi karya seni rupa maestro Indonesia.',
  },
  'Seni Musik': {
    1: 'Peserta didik mengenali pola irama konstan, membedakan bunyi tinggi-rendah dan panjang-pendek, serta menyanyikan lagu anak-anak bertempo santai dengan gembira.',
    2: 'Peserta didik memainkan pola irama ritmis sederhana menggunakan tepukan tangan/alat musik perkusi botol, serta membaca birama 2/4 dan 3/4 dengan tepat.',
    3: 'Peserta didik menyanyikan lagu wajib nasional dan lagu daerah dengan dinamika keras-lembut, serta membaca simbol notasi angka dasar 1 (do) hingga 5 (sol).',
    4: 'Peserta didik memainkan alat musik melodis sederhana (pianika/rekorder) dengan teknik penjarian dasar, serta bernyanyi secara serempak dan kanon dalam kelompok kecil.',
    5: 'Peserta didik memainkan ansambel musik campuran sederhana, mengapresiasi kekayaan alat musik tradisional nusantara (angklung, kolintang, gamelan), dan menyanyikan lagu daerah dua suara.',
    6: 'Peserta didik mengaransemen pola irama lagu sederhana, menampilkan pagelaran musik ansambel tematik kelas, serta mengapresiasi tokoh komponis nasional Indonesia.',
  },
  'Informatika': {
    1: 'Peserta didik mengenali berbagai piranti teknologi informasi di sekitar (komputer, ponsel, tablet), membiasakan jarak pandang layar yang aman, dan memahami aturan penggunaan gawai.',
    2: 'Peserta didik mengenal perangkat input sederhana (mouse dan papan tombol), mempraktikkan cara menyalakan/mematikan komputer dengan benar, dan menyusun urutan langkah instruksi logis (algoritma sehari-hari).',
    3: 'Peserta didik memahami konsep computational thinking (dekomposisi masalah sederhana), mengenal antarmuka sistem operasi ramah anak, dan membedakan ikon aplikasi edukasi.',
    4: 'Peserta didik mengoperasikan perangkat lunak pengolah kata sederhana (mengetik teks dan mengganti warna/ukuran huruf), serta memahami etika kesopanan saat berkomunikasi digital.',
    5: 'Peserta didik mengolah data angka dan grafik sederhana menggunakan aplikasi lembar kerja (spreadsheet), mencari informasi edukatif aman di internet, dan mengenali bahaya hoaks.',
    6: 'Peserta didik memahami logika pemrograman visual berbasis blok (Scratch/Blockly), merancang animasi atau kuis interaktif sederhana, serta memahami pentingnya perlindungan privasi dan kata sandi.',
  },
  'Pendidikan Agama Islam': {
    1: 'Peserta didik mengenal rukun iman dan rukun Islam, huruf hijaiyah berharakat tunggal (fathah, kasrah, dammah), melafalkan Surah Al-Fatihah, dan adab berdoa sebelum/sesudah makan.',
    2: 'Peserta didik melafalkan Surah An-Nas dan Al-Falaq, memahami asmaul husna (Ar-Rahman, Ar-Rahim, Al-Malik), serta mempraktikkan tata cara wudu secara berurutan dan tertib.',
    3: 'Peserta didik memahami makna salat fardu lima waktu beserta bacaannya, melafalkan Surah Al-Kausar dan Al-Ikhlas, serta meneladani sifat jujur dan amanah Nabi Muhammad SAW.',
    4: 'Peserta didik memahami makna asmaul husna Al-Basir dan Al-Adl, ketentuan bersuci dari hadas kecil, membaca Surah At-Tin dengan tartil, dan menghargai keragaman teman sebaya.',
    5: 'Peserta didik mendalami makna ibadah puasa Ramadan dan salat tarawih, melafalkan Surah Al-Ma\'un dengan tajwid, dan meneladani keteguhan Nabi Ibrahim AS dan Nabi Ismail AS.',
    6: 'Peserta didik memahami makna zakat fitrah, infak, sedekah, mendalami Surah Al-Kafirun tentang toleransi beragama, serta meneladani sifat kepemimpinan Khulafaur Rasyidin.',
  },
  'Bahasa Daerah': {
    1: 'Peserta didik menyimak sapaan santun daerah, mengenal nama anggota tubuh dan panggilan keluarga dalam bahasa daerah, serta melantunkan tembang dolanan anak bersama teman.',
    2: 'Peserta didik membaca teks pendek bahasa daerah bertema kebersihan rumah, menggunakan tingkatan bahasa santun kepada orang tua, dan menyebutkan nama-nama anak hewan dalam bahasa daerah.',
    3: 'Peserta didik memahami makna tembang macapat/lagu daerah sederhana, menceritakan kembali dongeng fabel daerah, serta melengkapi kalimat rumpang bahasa daerah.',
    4: 'Peserta didik memahami unggah-ungguh basa saat berbicara di sekolah, mengartikan paribasan/peribahasa daerah bertema budi pekerti, dan membaca teks cerita rakyat daerah.',
    5: 'Peserta didik menganalisis watak tokoh dalam teks wayang/cerita kepahlawanan lokal, menulis karangan narasi pengalaman pribadi dalam bahasa daerah, dan melantunkan parikan/pantun daerah.',
    6: 'Peserta didik mengenal lambang aksara tradisional daerah dasar (legena/sandhangan), membaca teks bertuliskan aksara daerah pendek, dan mengapresiasi seni pidato/sesorah adat daerah.',
  }
};

const getFallbackGradeCp = (subj: Subject, grd: number): string => {
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

export const getSubjectCp = (subj: Subject, grd: number): string => {
  const gradeEntry = GRADE_SPECIFIC_CP[subj];
  if (gradeEntry && gradeEntry[grd]) {
    return gradeEntry[grd];
  }
  return getFallbackGradeCp(subj, grd);
};

export const getGradeCpVariant = (subj: Subject, grd: number, variant: number): string => {
  const base = getSubjectCp(subj, grd);
  if (variant === 1) {
    return `${base} Peserta didik didorong untuk mengaplikasikan pemahaman ini dalam proyek eksplorasi sederhana berbasis pengalaman kontekstual sehari-hari.`;
  }
  if (variant === 2) {
    return `${base} Fokus pembelajaran ditekankan pada penguatan nalar kritis, kemampuan berkolaborasi, dan rasa percaya diri siswa Kelas ${grd} SD.`;
  }
  return base;
};

const getPhaseInfo = (grd: number): { phase: 'Fase A' | 'Fase B' | 'Fase C'; title: string; desc: string } => {
  if (grd <= 2) return { phase: 'Fase A', title: 'Fondasi Awal', desc: 'Kelas 1 & 2 SD' };
  if (grd <= 4) return { phase: 'Fase B', title: 'Penguatan Konsep', desc: 'Kelas 3 & 4 SD' };
  return { phase: 'Fase C', title: 'Analisis & Penalaran', desc: 'Kelas 5 & 6 SD' };
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

const SUBJECT_CATALOG_GROUPS: SubjectCategoryGroup[] = [
  {
    name: 'Mata Pelajaran Wajib Utama',
    items: [
      { id: 'Matematika', name: 'Matematika', emoji: '📐', desc: 'Aritmetika, Geometri, Pecahan & Logika' },
      { id: 'IPA', name: 'IPA (Sains)', emoji: '🌱', desc: 'Alam, Makhluk Hidup, Energi & Wujud Zat' },
      { id: 'Bahasa Indonesia', name: 'Bahasa Indonesia', emoji: '📚', desc: 'Literasi, Teks, Membaca & Kosakata' },
      { id: 'Pendidikan Pancasila', name: 'Pendidikan Pancasila', emoji: '🇮🇩', desc: 'Karakter, Norma, Toleransi & NKRI' },
      { id: 'Pengetahuan Umum', name: 'Pengetahuan Umum', emoji: '💡', desc: 'Wawasan Dunia, Budaya & Sosial' },
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

export const AiGeneratorStep: React.FC<AiGeneratorStepProps> = ({
  onGenerated,
  onBack: _onBack,
  playClick,
  initialSubject = 'Matematika',
  initialGrade = 3,
  stage,
  onStageChange,
  topic,
  onTopicChange,
}) => {
  const [subject, setSubject] = useState<Subject>(initialSubject);
  const [grade, setGrade] = useState<number>(initialGrade);
  const [contextNotes, setContextNotes] = useState('');
  const [randomSeed, setRandomSeed] = useState(0);

  // Modal Katalog Mapel Lengkap
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');

  // Brainstorming Ide Topik AI
  const [isBrainstormingAi, setIsBrainstormingAi] = useState(false);
  const [aiBrainstormedTopics, setAiBrainstormedTopics] = useState<TopicRecommendation[] | null>(null);

  // Filtered Subject Categories for Modal
  const filteredSubjectCategories = useMemo(() => {
    const q = subjectSearchQuery.trim().toLowerCase();
    if (!q) return SUBJECT_CATALOG_GROUPS;
    return SUBJECT_CATALOG_GROUPS.map((grp) => ({
      ...grp,
      items: grp.items.filter(
        (it) => it.name.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q) || grp.name.toLowerCase().includes(q)
      ),
    })).filter((grp) => grp.items.length > 0);
  }, [subjectSearchQuery]);

  // Capaian Pembelajaran (CP) AI
  const [aiGradeCp, setAiGradeCp] = useState<string | null>(null);
  const [isGeneratingAiCp, setIsGeneratingAiCp] = useState(false);
  const [cpVariantIndex, setCpVariantIndex] = useState(0);

  // Reset topik AI & CP AI saat ganti mata pelajaran atau jenjang kelas
  useEffect(() => {
    setAiBrainstormedTopics(null);
    setAiGradeCp(null);
    setCpVariantIndex(0);
  }, [subject, grade]);

  // Handler Rumuskan / Elaborasi CP Spesifik Kelas via AI
  const handleGenerateAiCp = async () => {
    playClick();
    if (isAnyAiAvailable()) {
      setIsGeneratingAiCp(true);
      try {
        const result = await generateAiCapaianPembelajaran({ subject, grade });
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
    const altCp = getGradeCpVariant(subject, grade, nextIdx);
    setAiGradeCp(altCp);
  };

  // Handler Brainstorm AI / Acak Ide Dinamis
  const handleBrainstormTopics = async () => {
    playClick();
    if (isAnyAiAvailable()) {
      setIsBrainstormingAi(true);
      try {
        const ideas = await generateAiTopicIdeas({ subject, grade });
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

  // Soal & Proporsi
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [customCountStr, setCustomCountStr] = useState<string>('5');
  const [proportionMode, setProportionMode] = useState<'balanced' | 'custom'>('balanced');
  const [proportions, setProportions] = useState({
    multiple_choice: 3,
    true_false: 1,
    short_answer: 1,
    matching_pairs: 0,
  });
  const [includeAiImages, setIncludeAiImages] = useState(false);

  // Pilihan Mesin AI
  const [selectedEngine, setSelectedEngine] = useState<'local' | 'groq' | 'gemini' | 'prompt'>('groq');

  // Input Teks Salin Prompt / Dokumen
  const [rawInputText, setRawInputText] = useState('');
  const [inputMethodTab, setInputMethodTab] = useState<'paste' | 'file'>('paste');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Status & Indikator
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [supabaseAi, setSupabaseAi] = useState<SupabaseAiStatus>(() => getSupabaseAiStatusSync());
  const [isCheckingCloudAi, setIsCheckingCloudAi] = useState(false);

  // Periksa kesiapan Supabase AI saat pertama kali dimuat
  useEffect(() => {
    setIsCheckingCloudAi(true);
    checkSupabaseAiStatus()
      .then((status) => {
        setSupabaseAi(status);
        if (status.hasGroq) {
          setSelectedEngine('groq');
        } else if (status.hasGemini) {
          setSelectedEngine('gemini');
        } else {
          setSelectedEngine('local');
        }
      })
      .catch(() => {
        setSelectedEngine('local');
      })
      .finally(() => {
        setIsCheckingCloudAi(false);
      });
  }, []);

  // Hitung total butir soal aktual
  const currentTotalQuestions = useMemo(() => {
    const parsed = parseInt(customCountStr);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 50) return parsed;
    return questionCount;
  }, [customCountStr, questionCount]);

  // Proporsi Kustom Auto-Distribute saat jumlah soal berubah
  const handleAutoDistributeProportions = (total: number) => {
    if (total <= 0) return;
    const mc = Math.max(1, Math.round(total * 0.5));
    const tf = Math.max(0, Math.round(total * 0.2));
    const sa = Math.max(0, Math.round(total * 0.2));
    const mp = Math.max(0, total - (mc + tf + sa));
    setProportions({
      multiple_choice: mc,
      true_false: tf,
      short_answer: sa,
      matching_pairs: mp,
    });
  };

  const sumCustomProportions = proportions.multiple_choice + proportions.true_false + proportions.short_answer + proportions.matching_pairs;

  // Rekomendasi Topik Cerdas Berdasarkan Mapel & Kelas (AI Dinamis atau Presets Kurikulum)
  const activeTopicRecommendations = useMemo(() => {
    if (aiBrainstormedTopics && aiBrainstormedTopics.length > 0) {
      return { list: aiBrainstormedTopics, isAi: true };
    }
    const presetList = getCuratedTopics(subject, grade);
    if (presetList.length === 0) return { list: [], isAi: false };
    const shifted = [...presetList];
    const offset = randomSeed % shifted.length;
    return {
      list: shifted.slice(offset).concat(shifted.slice(0, offset)).slice(0, 4),
      isAi: false,
    };
  }, [aiBrainstormedTopics, subject, grade, randomSeed]);

  const currentPhaseInfo = useMemo(() => getPhaseInfo(grade), [grade]);
  const currentCpStatement = useMemo(() => aiGradeCp || getSubjectCp(subject, grade), [aiGradeCp, subject, grade]);

  const CORE_SUBJECTS: Subject[] = ['IPA', 'Matematika', 'Bahasa Indonesia', 'Pendidikan Pancasila', 'Pengetahuan Umum'];
  const isCoreSubject = CORE_SUBJECTS.includes(subject);

  // Prompt Teks Siap Pakai
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

  // Handler Salin Prompt
  const handleCopyPrompt = async () => {
    playClick();
    try {
      await navigator.clipboard.writeText(generatedPromptText);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      // ignore
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
      }
    };

    reader.onerror = () => {
      setErrorMessage('Gagal membaca berkas. Pastikan format berkas valid.');
    };

    reader.readAsText(file);
  };

  // Eksekusi AI Direct (Lokal / Groq / Gemini) -> Langsung Buka Studio Bank Soal
  const handleExecuteAiDirect = async () => {
    playClick();
    setErrorMessage(null);

    if (!topic.trim()) {
      setErrorMessage('Mohon lengkapi judul atau topik kuis terlebih dahulu.');
      onStageChange(2);
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

      // Langsung buka Studio Bank Soal
      onGenerated({
        questions: result.questions,
        topic: topic.trim(),
        subject,
        grade,
        questionCount: result.questions.length,
        coverEmoji: EMOJI_BY_SUBJECT[subject] || '🌟',
        badgeTitle: 'Bintang Pintar',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat meracik soal AI.';
      setErrorMessage(msg);
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
      setErrorMessage('Mohon tempelkan teks hasil dari AI atau unggah berkas soal terlebih dahulu.');
      return;
    }

    try {
      const parsed = parseRawQuestionsText(trimmed);
      const validQuestions = parsed.filter((p) => p.valid).map((p) => p.question);

      if (validQuestions.length === 0) {
        setErrorMessage('Format soal tidak dapat dikenali. Pastikan teks berisi pertanyaan, opsi pilihan, dan kunci jawaban.');
        return;
      }

      onGenerated({
        questions: validQuestions,
        topic: topic.trim() || `Kuis ${subject} Kelas ${grade}`,
        subject,
        grade,
        questionCount: validQuestions.length,
        coverEmoji: EMOJI_BY_SUBJECT[subject] || '🌟',
        badgeTitle: 'Bintang Pintar',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal mengurai teks soal.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 xs:px-4 sm:px-8 lg:px-12 py-3 sm:py-4 animate-fade-in space-y-6">
      
      {/* Error Message Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-3 text-xs sm:text-sm animate-shake">
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
      {/* TAHAP 1: MATA PELAJARAN & TINGKAT KELAS SD */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* TAHAP 1: MATA PELAJARAN & TINGKAT KELAS SD */}
      {/* ========================================================================= */}
      {stage === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 sm:space-y-8 animate-fade-in">
          
          {/* Pilihan Mata Pelajaran (6 Kotak: 5 Utama + 1 Lainnya dengan Modal) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                Pilih Mata Pelajaran <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
                Kurikulum Merdeka SD
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
              {/* 5 Mapel Inti Terpopuler */}
              {CORE_SUBJECTS.map((subj) => {
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
                        Kurikulum Merdeka
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
                    {!isCoreSubject ? 'Ganti mapel ▾' : 'PJOK, Seni, Agama...'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Pilihan Tingkat Kelas SD (Pengelompokan Fase Kurikulum Merdeka) */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                Pilih Tingkat Kelas SD <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
                Terstruktur menurut Fase Kurikulum Merdeka SD
              </span>
            </div>

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
                    Capaian Pembelajaran (CP) Spesifik Kelas {grade} SD
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
          
          {/* Pill Ringkasan Mapel & Kelas */}
          <div className="flex items-center justify-between gap-2.5 flex-wrap p-3.5 sm:p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 text-xs sm:text-sm font-black flex-wrap min-w-0 flex-1">
              <span className="text-xl sm:text-2xl shrink-0">{EMOJI_BY_SUBJECT[subject]}</span>
              <span className="shrink-0">{subject}</span>
              <span className="text-blue-400 shrink-0">•</span>
              <span className="shrink-0">Kelas {grade} SD</span>
            </div>
            <button
              type="button"
              onClick={() => {
                playClick();
                onStageChange(1);
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline px-2.5 py-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 shrink-0"
            >
              Ubah Mapel & Kelas ✏️
            </button>
          </div>

          {/* 2-Kolom: Topik & Saran Cerdas (Kiri) vs Catatan & Tips (Kanan) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* Kolom Kiri: Input Topik & Rekomendasi Cerdas */}
            <div className="lg:col-span-6 space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-2">
                  Topik atau Materi Pembahasan Kuis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => onTopicChange(e.target.value)}
                  placeholder="Contoh: Organ Pernapasan Manusia, Pecahan Senilai, Pengamalan Sila Pancasila..."
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 font-semibold text-sm focus:border-blue-500 focus:outline-none min-h-[50px] shadow-xs"
                />
              </div>

              {/* Rekomendasi Topik Cerdas */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Rekomendasi Topik {subject} Kelas {grade}
                    {activeTopicRecommendations.isAi && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 animate-fade-in">
                        AI Brainstorm ✨
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    disabled={isBrainstormingAi}
                    onClick={handleBrainstormTopics}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 font-bold min-h-[32px] px-2.5 py-1 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 btn-press disabled:opacity-60 transition-all"
                  >
                    {isBrainstormingAi ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>Meracik Ide AI...</span>
                      </>
                    ) : (
                      <>
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>Acak Ide AI</span>
                      </>
                    )}
                  </button>
                </div>

                {isBrainstormingAi ? (
                  <div className="py-4 flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-bold animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Sedang mengeksplorasi ide topik kontekstual via AI...</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {activeTopicRecommendations.list.map((rec) => (
                      <button
                        key={rec.topic}
                        type="button"
                        onClick={() => {
                          playClick();
                          onTopicChange(rec.topic);
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
                )}
              </div>
            </div>

            {/* Kolom Kanan: Catatan Khusus & Panduan Guru */}
            <div className="lg:col-span-6 space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-2">
                  Catatan / Bahan Pertimbangan Khusus <span className="text-slate-400 font-normal">(Opsional)</span>
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
                  <span>Tips Instruksional untuk Guru SD:</span>
                </div>
                <ul className="text-[11px] sm:text-xs text-indigo-800 dark:text-indigo-300/90 space-y-1 pl-6 list-disc leading-relaxed">
                  <li>Tentukan fokus sub-materi tertentu agar butir soal kuis padat dan terarah.</li>
                  <li>Konteks akan membantu AI menyesuaikan gaya kalimat dengan psikologi siswa Kelas {grade} SD.</li>
                  <li>Anda tetap dapat mengedit atau merevisi butir soal secara leluasa di Studio Bank Soal.</li>
                </ul>
              </div>
            </div>

          </div>

          {/* Navigasi Tahap 2 */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                onStageChange(1);
              }}
              className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 min-h-[48px] flex items-center gap-2 btn-press transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Mapel & Kelas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                if (!topic.trim()) {
                  setErrorMessage('Mohon tentukan materi atau topik pembahasan kuis terlebih dahulu.');
                  return;
                }
                setErrorMessage(null);
                onStageChange(3);
              }}
              className="px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 min-h-[48px] btn-press transition-all"
            >
              <span>Lanjut ke Format & Jumlah Soal</span>
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
          
          {/* Pill Ringkasan Materi & Topik */}
          <div className="flex items-center justify-between gap-2.5 flex-wrap p-3.5 sm:p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 text-xs sm:text-sm font-black flex-wrap min-w-0 flex-1">
              <span className="text-xl sm:text-2xl shrink-0">{EMOJI_BY_SUBJECT[subject]}</span>
              <span className="shrink-0">{subject}</span>
              <span className="text-blue-400 shrink-0">•</span>
              <span className="shrink-0">Kelas {grade} SD</span>
              <span className="text-blue-400 shrink-0">•</span>
              <span className="truncate max-w-[160px] xs:max-w-[220px] sm:max-w-md font-semibold">"{topic}"</span>
            </div>
            <button
              type="button"
              onClick={() => {
                playClick();
                onStageChange(2);
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline px-2.5 py-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 shrink-0"
            >
              Ubah Topik ✏️
            </button>
          </div>

          {/* Pilihan Jumlah Butir Soal */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                Jumlah Butir Soal <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Pilih opsi cepat atau ketik kustom (1 - 50 butir)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
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

          {/* Mode Format Tipe Soal & Proporsi */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  Format Tipe Soal & Proporsi
                </label>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Tentukan bagaimana variasi tipe soal akan dibagikan.
                </p>
              </div>

              {/* Mode Switcher */}
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
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-700/60 text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Distribusi Otomatis Berimbang:
                  </span>
                  <span>
                    AI secara proporsional meracik <strong>Pilihan Ganda (~50%)</strong>, <strong>Benar/Salah (~20%)</strong>, <strong>Isian Singkat (~20%)</strong>, dan <strong>Menjodohkan (~10%)</strong> sesuai kebutuhan kompetensi dasar siswa Kelas {grade} SD.
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
                    <span>Total alokasi ({sumCustomProportions}) harus sama dengan total butir kuis ({currentTotalQuestions}).</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Kotak Sertakan Gambar AI */}
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
                  Menyertakan gambar edukasi visual yang relevan untuk merangsang imajinasi dan ketertarikan belajar siswa SD.
                </span>
              </div>
            </label>
          </div>

          {/* Navigasi Tahap 3 */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                onStageChange(2);
              }}
              className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 min-h-[48px] flex items-center gap-2 btn-press transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Topik Materi</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                if (proportionMode === 'custom' && sumCustomProportions !== currentTotalQuestions) {
                  setErrorMessage(`Total butir soal (${sumCustomProportions}) belum sama dengan target kuis (${currentTotalQuestions}).`);
                  return;
                }
                setErrorMessage(null);
                onStageChange(4);
              }}
              className="px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 min-h-[48px] btn-press transition-all"
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
          
          {/* Pill Ringkasan Konfigurasi Lengkap */}
          <div className="flex items-center justify-between gap-2.5 flex-wrap p-3.5 sm:p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 text-xs sm:text-sm font-black flex-wrap min-w-0 flex-1">
              <span className="text-xl sm:text-2xl shrink-0">{EMOJI_BY_SUBJECT[subject]}</span>
              <span className="shrink-0">{subject}</span>
              <span className="text-blue-400 shrink-0">•</span>
              <span className="shrink-0">Kelas {grade} SD</span>
              <span className="text-blue-400 shrink-0">•</span>
              <span className="truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs font-semibold">"{topic}"</span>
              <span className="text-blue-400 shrink-0">•</span>
              <span className="shrink-0 font-bold">{currentTotalQuestions} Soal</span>
              {includeAiImages && (
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-bold">
                  + Gambar AI
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                playClick();
                onStageChange(3);
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline px-2.5 py-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 shrink-0"
            >
              Ubah Pengaturan ✏️
            </button>
          </div>

          {/* Pilihan Mesin Pembuat Soal */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  Pilih Mesin Pembuat Soal
                </label>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Gunakan pembuat otomatis langsung, atau gunakan fitur salin prompt / unggah berkas.
                </p>
              </div>

              {isCheckingCloudAi && (
                <span className="text-[11px] text-blue-500 font-bold flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memeriksa Status Cloud...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
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
                      Mandiri / Cepat
                    </span>
                  </div>
                  <span className="font-black text-sm sm:text-base block">Kurikulum SD Lokal</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Pembuat soal cepat materi Kurikulum Merdeka tanpa ketergantungan kuota API.
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
                    Komputasi LPU Llama 3.3 70B super kilat (&lt;1 detik) dengan pemahaman kurikulum presisi.
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
                        Cerdas & Kontekstual
                      </span>
                    )}
                  </div>
                  <span className="font-black text-sm sm:text-base block">Google Gemini AI</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Penalaran edukatif mendalam dengan variasi pertanyaan kontekstual ramah anak SD.
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  {selectedEngine === 'gemini' ? '✓ Sedang Dipilih' : 'Klik untuk Memilih'}
                </div>
              </button>

              {/* Option 4: Salin Prompt / Berkas Dokumen */}
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
                      Salin / Impor
                    </span>
                  </div>
                  <span className="font-black text-sm sm:text-base block">Salin Prompt / Berkas</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Salin teks prompt ke ChatGPT/Claude, atau unggah tabel Excel/CSV/JSON/Teks kuis Anda.
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  {selectedEngine === 'prompt' ? '✓ Sedang Dipilih' : 'Klik untuk Memilih'}
                </div>
              </button>

            </div>
          </div>

          {/* Area Interaktif Khusus jika Salin Prompt / Berkas Dipilih */}
          {selectedEngine === 'prompt' && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 animate-fade-in space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Kolom Kiri: Teks Prompt Siap Pakai */}
                <div className="lg:col-span-6 flex flex-col justify-between p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                        <span>1.</span> Teks Prompt Edukasi Kurikulum Merdeka
                      </span>

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

                    <textarea
                      readOnly
                      rows={10}
                      value={generatedPromptText}
                      className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none select-all leading-relaxed"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-indigo-100/70 dark:bg-indigo-900/40 text-[11px] sm:text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed font-medium">
                    💡 <strong>Cara Pakai:</strong> Salin prompt di atas → tempel ke ChatGPT, Claude, atau Gemini → salin respons AI dan tempelkan pada kotak di sebelah kanan.
                  </div>
                </div>

                {/* Kolom Kanan: Input Hasil Soal / Unggah Berkas */}
                <div className="lg:col-span-6 flex flex-col justify-between p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>2.</span> Masukkan Hasil Soal atau Berkas
                      </span>

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
                          📝 Tempel Teks
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
                          rows={10}
                          value={rawInputText}
                          onChange={(e) => setRawInputText(e.target.value)}
                          placeholder="Tempelkan teks respons JSON dari AI atau teks daftar soal bernomor (1. Pertanyaan... A. Opsi... B. Opsi... Kunci: ...) di sini..."
                          className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 font-mono text-xs sm:text-sm focus:border-blue-500 focus:outline-none leading-relaxed shadow-xs"
                        />
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                          <span>Mendukung format JSON Array maupun teks soal bernomor.</span>
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
                            Mendukung file spreadsheet CSV, Excel, atau berkas teks.
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={handleDownloadCsvTemplate}
                            className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1.5 min-h-[36px]"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Unduh Contoh Format Template CSV
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    ⚡ Seluruh butir soal akan otomatis diekstrak dan siap diperiksa di Studio Bank Soal.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* Action Footer Tahap 4 */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                playClick();
                onStageChange(3);
              }}
              className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 min-h-[48px] flex items-center gap-2 btn-press transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Format Soal</span>
            </button>

            {selectedEngine === 'prompt' ? (
              <button
                type="button"
                onClick={handleParseAndOpenStudio}
                className="px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 min-h-[48px] btn-press transition-all"
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
                className="px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 flex items-center gap-2 min-h-[48px] btn-press transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sedang Meracik Butir Soal SD...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>Buat Kuis Sekarang & Buka Bank Soal</span>
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
                    Kurikulum Merdeka SD (Standar & Terstruktur)
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
              <span>Kurikulum Merdeka SD (Terstruktur)</span>
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

    </div>
  );
};
