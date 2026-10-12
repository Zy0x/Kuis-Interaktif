import type { Quiz } from '../types/quiz';

export const AVATAR_LIST = [
  { id: 'lion', emoji: '🦁', name: 'Singa Berani', color: 'bg-amber-100 border-amber-400' },
  { id: 'rabbit', emoji: '🐰', name: 'Kelinci Cerdik', color: 'bg-pink-100 border-pink-400' },
  { id: 'owl', emoji: '🦉', name: 'Burung Hantu Bijak', color: 'bg-purple-100 border-purple-400' },
  { id: 'fox', emoji: '🦊', name: 'Rubah Lincah', color: 'bg-orange-100 border-orange-400' },
  { id: 'bear', emoji: '🐻', name: 'Beruang Hebat', color: 'bg-emerald-100 border-emerald-400' },
  { id: 'panda', emoji: '🐼', name: 'Panda Ceria', color: 'bg-slate-100 border-slate-400' },
  { id: 'tiger', emoji: '🐯', name: 'Harimau Juara', color: 'bg-yellow-100 border-yellow-400' },
  { id: 'koala', emoji: '🐨', name: 'Koala Pintar', color: 'bg-cyan-100 border-cyan-400' },
];

export const AVATAR_MAP: Record<string, string> = Object.fromEntries(
  AVATAR_LIST.map((a) => [a.id, a.emoji])
);

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'sd1-mtk-hitung',
    title: 'Petualangan Berhitung Ceria',
    description: 'Ayo berhitung buah-buahan dan benda di sekitar kita dengan riang gembira!',
    subject: 'Matematika',
    grade: 1,
    educationLevel: 'SD',
    durationPerQuestionSec: 25,
    coverEmoji: '🍎',
    themeColor: 'from-amber-400 to-orange-500',
    badgeTitle: 'Bintang Berhitung',
    questions: [
      {
        id: 'q1-1',
        text: 'Berapa jumlah apel merah pada gambar di bawah ini?',
        type: 'image_guess',
        imageCaption: '🍎 🍎 🍎 + 🍎 🍎',
        options: ['3 Apel', '4 Apel', '5 Apel', '6 Apel'],
        correctIndex: 2,
        explanation: '3 apel ditambah 2 apel sama dengan 5 apel (3 + 2 = 5).'
      },
      {
        id: 'q1-2',
        text: 'Bentuk benda apakah uang koin logam lima ratus rupiah?',
        type: 'multiple_choice',
        imageCaption: '🪙 Koin Logam',
        options: ['Segitiga', 'Lingkaran', 'Persegi', 'Bintang'],
        correctIndex: 1,
        explanation: 'Uang koin logam berbentuk lingkaran bulat sempurna.'
      },
      {
        id: 'q1-3',
        text: 'Angka 7 lebih BESAR daripada angka 3.',
        type: 'true_false',
        options: ['Benar', 'Salah'],
        correctIndex: 0,
        explanation: 'Benar! Angka 7 memiliki nilai yang lebih banyak daripada angka 3.'
      },
      {
        id: 'q1-4',
        text: 'Ibu membeli 6 pensil warna. Adik meminjam 2 pensil. Berapa sisa pensil Ibu?',
        type: 'multiple_choice',
        imageCaption: '✏️ ✏️ ✏️ ✏️ ✏️ ✏️',
        options: ['2 Pensil', '3 Pensil', '4 Pensil', '8 Pensil'],
        correctIndex: 2,
        explanation: '6 dikurangi 2 sama dengan 4 (6 - 2 = 4).'
      }
    ]
  },
  {
    id: 'sd2-ipa-hewan',
    title: 'Mengenal Hewan & Tempat Tinggalnya',
    description: 'Mari jelajahi dunia binatang yang seru, ada yang di darat, air, dan udara!',
    subject: 'IPA',
    grade: 2,
    educationLevel: 'SD',
    durationPerQuestionSec: 25,
    coverEmoji: '🐸',
    themeColor: 'from-emerald-400 to-teal-600',
    badgeTitle: 'Sahabat Satwa',
    questions: [
      {
        id: 'q2-1',
        text: 'Hewan apakah yang bernapas menggunakan insang dan berenang di dalam air?',
        type: 'multiple_choice',
        imageCaption: '🌊 Berenang di air',
        options: ['Kucing', 'Ikan Mas', 'Ayam', 'Kelinci'],
        correctIndex: 1,
        explanation: 'Ikan hidup di dalam air dan bernapas dengan organ khusus bernama insang.'
      },
      {
        id: 'q2-2',
        text: 'Katak adalah hewan amfibi yang bisa hidup di dua alam (darat dan air).',
        type: 'true_false',
        imageCaption: '🐸 Katak Hijau',
        options: ['Benar', 'Salah'],
        correctIndex: 0,
        explanation: 'Benar! Katak termasuk jenis hewan amfibi yang dapat hidup di air dan darat.'
      },
      {
        id: 'q2-3',
        text: 'Hewan yang memakan rumput dan menghasilkan susu segar untuk kita adalah...',
        type: 'multiple_choice',
        imageCaption: '🥛 Menghasilkan susu',
        options: ['Sapi', 'Harimau', 'Elang', 'Serigala'],
        correctIndex: 0,
        explanation: 'Sapi adalah hewan herbivora pemakan rumput yang menghasilkan susu kaya kalsium.'
      },
      {
        id: 'q2-4',
        text: 'Hewan apakah yang memiliki belalai panjang dan telinga lebar?',
        type: 'multiple_choice',
        imageCaption: '🐘 Berbadan besar',
        options: ['Jerapah', 'Gajah', 'Kuda', 'Badak'],
        correctIndex: 1,
        explanation: 'Gajah adalah mamalia darat terbesar dengan belalai serbaguna dan daun telinga lebar.'
      }
    ]
  },
  {
    id: 'sd3-ipa-tumbuhan',
    title: 'Bagian Tumbuhan & Fungsinya',
    description: 'Pelajari akar, batang, daun, dan bunga yang membantu pohon tumbuh subur!',
    subject: 'IPA',
    grade: 3,
    educationLevel: 'SD',
    durationPerQuestionSec: 30,
    coverEmoji: '🌱',
    themeColor: 'from-green-500 to-emerald-700',
    badgeTitle: 'Peneliti Cilik',
    questions: [
      {
        id: 'q3-1',
        text: 'Bagian tumbuhan manakah yang bertugas menyerap air dan zat hara dari dalam tanah?',
        type: 'multiple_choice',
        imageCaption: '🪴 Tersembunyi di dalam tanah',
        options: ['Daun', 'Akar', 'Bunga', 'Buah'],
        correctIndex: 1,
        explanation: 'Akar berfungsi mencengkeram tanah dan menyerap air serta mineral penting.'
      },
      {
        id: 'q3-2',
        text: 'Proses pembuatan makanan pada tumbuhan hijau dengan bantuan sinar matahari disebut...',
        type: 'multiple_choice',
        imageCaption: '☀️ Sinar Matahari + Daun Hijau',
        options: ['Metamorfosis', 'Fotosintesis', 'Perkecambahan', 'Penyerbukan'],
        correctIndex: 1,
        explanation: 'Fotosintesis terjadi di daun berkat klorofil dan energi dari cahaya matahari.'
      },
      {
        id: 'q3-3',
        text: 'Zat hijau daun yang berperan dalam fotosintesis dinamakan klorofil.',
        type: 'true_false',
        options: ['Benar', 'Salah'],
        correctIndex: 0,
        explanation: 'Benar! Klorofil memberi warna hijau pada daun dan menangkap sinar matahari.'
      },
      {
        id: 'q3-4',
        text: 'Bagian tumbuhan yang berkembang menjadi cikal bakal tumbuhan baru melalui biji adalah...',
        type: 'multiple_choice',
        imageCaption: '🌸 Tempat terjadinya penyerbukan',
        options: ['Akar', 'Batang', 'Bunga & Buah', 'Duri'],
        correctIndex: 2,
        explanation: 'Bunga adalah organ perkembangbiakan yang menghasilkan biji di dalam buah.'
      }
    ]
  },
  {
    id: 'sd4-mtk-pecahan',
    title: 'Tantangan Pecahan & Bangun Datar',
    description: 'Uji keahlianmu mengenai luas, keliling, dan pecahan sederhana yang asyik!',
    subject: 'Matematika',
    grade: 4,
    educationLevel: 'SD',
    durationPerQuestionSec: 30,
    coverEmoji: '📐',
    themeColor: 'from-blue-500 to-indigo-600',
    badgeTitle: 'Master Geometri',
    questions: [
      {
        id: 'q4-1',
        text: 'Sebuah pizza dipotong menjadi 4 bagian sama besar. Budi memakan 1 potong. Berapa bagian pizza yang dimakan Budi?',
        type: 'multiple_choice',
        imageCaption: '🍕 1 dari 4 bagian',
        options: ['1/2 bagian', '1/4 bagian', '3/4 bagian', '2/4 bagian'],
        correctIndex: 1,
        explanation: '1 potong dari total 4 bagian sama bernilai pecahan 1/4 (satu per empat).'
      },
      {
        id: 'q4-2',
        text: 'Sebuah persegi memiliki panjang sisi 6 cm. Berapakah keliling persegi tersebut?',
        type: 'multiple_choice',
        imageCaption: '⏹️ Persegi sisi = 6 cm',
        options: ['12 cm', '18 cm', '24 cm', '36 cm'],
        correctIndex: 2,
        customDurationSec: 45,
        explanation: 'Keliling persegi = 4 x sisi = 4 x 6 cm = 24 cm.'
      },
      {
        id: 'q4-3',
        text: 'Pecahan 2/4 nilainya SAMA BESAR dengan pecahan 1/2.',
        type: 'true_false',
        options: ['Benar', 'Salah'],
        correctIndex: 0,
        explanation: 'Benar! Jika pembilang dan penyebut 2/4 sama-sama dibagi 2, hasilnya adalah 1/2.'
      },
      {
        id: 'q4-4',
        text: 'Bangun datar yang memiliki 3 buah sisi dan 3 sudut adalah...',
        type: 'multiple_choice',
        imageCaption: '🔺 Memiliki 3 sisi',
        options: ['Segitiga', 'Persegi Panjang', 'Trapesium', 'Lingkaran'],
        correctIndex: 0,
        explanation: 'Segitiga adalah bangun datar dengan 3 sisi dan 3 titik sudut.'
      }
    ]
  },
  {
    id: 'sd5-ipa-tubuh',
    title: 'Sistem Peredaran Darah & Organ Tubuh',
    description: 'Pelajari bagaimana jantung memompa darah dan paru-paru menghirup udara segar!',
    subject: 'IPA',
    grade: 5,
    educationLevel: 'SD',
    durationPerQuestionSec: 30,
    coverEmoji: '🫀',
    themeColor: 'from-rose-500 to-red-600',
    badgeTitle: 'Dokter Cilik',
    questions: [
      {
        id: 'q5-1',
        text: 'Organ tubuh manusia yang berfungsi utama memompa darah ke seluruh tubuh adalah...',
        type: 'multiple_choice',
        imageCaption: '❤️ Berdetak sepanjang waktu',
        options: ['Paru-paru', 'Jantung', 'Lambung', 'Hati'],
        correctIndex: 1,
        explanation: 'Jantung berdenyut sekitar 60-100 kali per menit untuk mengalirkan darah beroksigen.'
      },
      {
        id: 'q5-2',
        text: 'Gas yang kita hirup saat menarik napas untuk menyuplai energi tubuh adalah...',
        type: 'multiple_choice',
        imageCaption: '🌬️ Menghirup udara bersih',
        options: ['Karbon Dioksida', 'Oksigen (O2)', 'Nitrogen', 'Metana'],
        correctIndex: 1,
        explanation: 'Manusia menghirup Oksigen (O2) dan menghembuskan Karbon Dioksida (CO2).'
      },
      {
        id: 'q5-3',
        text: 'Pembuluh darah yang membawa darah bersih kaya oksigen KELUAR dari jantung disebut pembuluh nadi (arteri).',
        type: 'true_false',
        options: ['Benar', 'Salah'],
        correctIndex: 0,
        explanation: 'Benar! Pembuluh nadi (arteri) mengalirkan darah bertekanan tinggi dari jantung.'
      },
      {
        id: 'q5-4',
        text: 'Organ pernapasan utama manusia yang berfungsi sebagai tempat pertukaran oksigen dan karbon dioksida adalah...',
        type: 'short_answer',
        imageCaption: '🫁 Organ pernapasan',
        options: ['Paru-paru'],
        acceptableAnswers: ['paru-paru', 'paru paru', 'pulmo'],
        correctIndex: 0,
        explanation: 'Paru-paru adalah organ tempat darah melepaskan karbon dioksida dan mengikat oksigen segar melalui alveolus.'
      },
      {
        id: 'q5-5',
        text: 'Jodohkanlah organ tubuh berikut dengan fungsi utamanya yang tepat!',
        type: 'matching_pairs',
        options: [
          'Jantung ↔ Memompa darah',
          'Paru-paru ↔ Menghirup oksigen',
          'Lambung ↔ Mencerna makanan',
          'Otak ↔ Pusat kendali tubuh'
        ],
        matchingPairs: [
          { left: 'Jantung', right: 'Memompa darah' },
          { left: 'Paru-paru', right: 'Menghirup oksigen' },
          { left: 'Lambung', right: 'Mencerna makanan' },
          { left: 'Otak', right: 'Pusat kendali tubuh' }
        ],
        correctIndex: 0,
        explanation: 'Setiap organ memiliki tugas khusus yang saling mendukung kerja tubuh kita.'
      }
    ]
  },
  {
    id: 'sd6-pancasila-wawasan',
    title: 'Pancasila & Kebudayaan Nusantara',
    description: 'Kenali lambang burung Garuda, sila Pancasila, dan keberagaman budaya Indonesia!',
    subject: 'Pendidikan Pancasila',
    grade: 6,
    educationLevel: 'SD',
    durationPerQuestionSec: 30,
    coverEmoji: '🦅',
    themeColor: 'from-purple-500 to-indigo-700',
    badgeTitle: 'Garuda Muda',
    questions: [
      {
        id: 'q6-1',
        text: 'Apa semboyan pemersatu bangsa yang tercengkeram pada pita burung Garuda Pancasila?',
        type: 'multiple_choice',
        imageCaption: '🇮🇩 Lambang Negara Indonesia',
        options: [
          'Tut Wuri Handayani',
          'Bhinneka Tunggal Ika',
          'Bersatu Kita Teguh',
          'Ing Ngarso Sung Tulodo'
        ],
        correctIndex: 1,
        explanation: 'Bhinneka Tunggal Ika berarti "Berbeda-beda tetapi tetap satu jua".'
      },
      {
        id: 'q6-2',
        text: 'Simbol Bintang Emas melambangkan sila ke-1 Pancasila: Ketuhanan Yang Maha Esa.',
        type: 'true_false',
        imageCaption: '⭐ Bintang Bersudut Lima',
        options: ['Benar', 'Salah'],
        correctIndex: 0,
        explanation: 'Benar! Sila ke-1 dilambangkan dengan perisai hitam berlogo bintang emas berkilau.'
      },
      {
        id: 'q6-3',
        text: 'Musyawarah untuk mufakat dalam menyelesaikan masalah mencerminkan pengamalan Pancasila sila ke...',
        type: 'multiple_choice',
        options: ['Sila ke-2', 'Sila ke-3', 'Sila ke-4', 'Sila ke-5'],
        correctIndex: 2,
        explanation: 'Sila ke-4 (Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan dalam Permusyawaratan/Perwakilan).'
      }
    ]
  },
  {
    id: 'smp7-ipa-ekosistem',
    title: 'Interaksi Makhluk Hidup dan Lingkungan',
    description: 'Pendalaman materi rantai makanan, jaring-jaring kehidupan, dan dinamika biosfer Fase D SMP.',
    subject: 'IPA Terpadu',
    grade: 7,
    educationLevel: 'SMP',
    durationPerQuestionSec: 30,
    coverEmoji: '🔬',
    themeColor: 'from-teal-500 to-emerald-700',
    badgeTitle: 'Cendekia Sains SMP',
    questions: [
      {
        id: 'qsmp-1',
        text: 'Dalam sebuah ekosistem sawah, jika populasi katak menurun drastis akibat perburuan liar, apakah dampak langsung yang paling mungkin terjadi?',
        type: 'multiple_choice',
        imageCaption: '🌾 Rantai Makanan Sawah',
        options: [
          'Populasi belalang hama meningkat drastis',
          'Populasi ular sawah bertambah banyak',
          'Hasil panen padi melonjak tinggi',
          'Populasi burung elang meningkat'
        ],
        correctIndex: 0,
        explanation: 'Katak adalah predator belalang. Penurunan katak menyebabkan ledakan populasi belalang hama yang merusak padi.'
      },
      {
        id: 'qsmp-2',
        text: 'Hubungan antara lebah madu dengan bunga yang saling menguntungkan merupakan contoh simbiosis...',
        type: 'multiple_choice',
        options: ['Mutualisme', 'Komensalisme', 'Parasitisme', 'Netralisme'],
        correctIndex: 0,
        explanation: 'Simbiosis mutualisme menguntungkan kedua pihak: lebah mendapat nektar dan bunga terbantu penyerbukannya.'
      },
      {
        id: 'qsmp-3',
        text: 'Komponen abiotik seperti sinar matahari, suhu udara, dan kadar air sangat memengaruhi kelangsungan hidup produsen.',
        type: 'true_false',
        options: ['Benar', 'Salah'],
        correctIndex: 0,
        explanation: 'Benar! Faktor abiotik adalah faktor fisik lingkungan yang menjadi penentu utama proses fotosintesis produsen.'
      }
    ]
  },
  {
    id: 'sma10-fisika-gerak',
    title: 'Kinematika Gerak Lurus & Analisis Vektor',
    description: 'Uji pemahaman konsep GLB, GLBB, dan penalaran grafik kecepatan-waktu Fase E SMA.',
    subject: 'Fisika',
    grade: 10,
    educationLevel: 'SMA',
    durationPerQuestionSec: 35,
    coverEmoji: '⚛️',
    themeColor: 'from-blue-600 to-indigo-800',
    badgeTitle: 'Pakar Fisika SMA',
    questions: [
      {
        id: 'qsma-1',
        text: 'Sebuah benda bergerak lurus dengan percepatan konstan 2 m/s² dari keadaan diam. Berapakah kecepatan benda tersebut setelah bergerak selama 5 detik?',
        type: 'multiple_choice',
        imageCaption: '📈 Grafik Kecepatan vs Waktu (GLBB)',
        options: ['5 m/s', '10 m/s', '15 m/s', '20 m/s'],
        correctIndex: 1,
        explanation: 'Gunakan rumus GLBB: vt = v0 + a·t = 0 + (2 m/s² × 5 s) = 10 m/s.'
      },
      {
        id: 'qsma-2',
        text: 'Pada gerak jatuh bebas tanpa gesekan udara, massa benda yang jatuh memengaruhi besarnya percepatan jatuh benda.',
        type: 'true_false',
        options: ['Benar', 'Salah'],
        correctIndex: 1,
        explanation: 'Salah! Dalam medan gravitasi tanpa gesekan udara, semua benda mengalami percepatan gravitasi yang sama (g ≈ 9.8 m/s²) terlepas dari massanya.'
      },
      {
        id: 'qsma-3',
        text: 'Dua buah vektor gaya masing-masing 6 N dan 8 N bekerja pada satu titik tangkap saling tegak lurus (90°). Berapakah resultan kedua gaya tersebut?',
        type: 'multiple_choice',
        options: ['10 N', '12 N', '14 N', '2 N'],
        correctIndex: 0,
        explanation: 'Resultan vektor tegak lurus: R = √(6² + 8²) = √(36 + 64) = √100 = 10 N.'
      }
    ]
  },
  {
    id: 'sd5-pancasila-norma-hak-kewajiban',
    title: 'Latihan Pendidikan Pancasila: Norma, Hak, Kewajiban, dan Tanggung Jawab',
    description: 'Kuis latihan Pendidikan Pancasila Kelas 5 SD berdasarkan materi Pancasila, Norma, Hak, Kewajiban, dan Tanggung Jawab dengan 20 butir soal berjenjang (Tingkat Rendah, Sedang, hingga Tingkat Tinggi/HOTS).',
    subject: 'Pendidikan Pancasila',
    grade: 5,
    educationLevel: 'SD',
    durationPerQuestionSec: 30,
    coverEmoji: '🇮🇩',
    themeColor: 'from-red-600 to-rose-700',
    badgeTitle: 'Pelajar Pancasila',
    pinCode: '5005',
    creatorId: '6b995377-1c3c-4b1f-a91e-e439f923185b',
    creatorName: 'Admin',
    visibility: 'public',
    isPublished: true,
    questions: [
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q01',
        text: 'Dasar negara Indonesia adalah ....',
        type: 'multiple_choice',
        imageCaption: '🦅 Lambang Negara & Ideologi Bangsa',
        options: ['UUD 1945', 'Pancasila', 'Bhinneka Tunggal Ika', 'Proklamasi'],
        correctIndex: 1,
        explanation: 'Pancasila merupakan dasar negara dan ideologi bangsa Indonesia yang menjadi pedoman fundamental dalam kehidupan bermasyarakat, berbangsa, dan bernegara.',
        points: 10,
        customDurationSec: 30
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q02',
        text: 'Bunyi sila pertama Pancasila adalah ....',
        type: 'multiple_choice',
        imageCaption: '⭐ Bintang Emas Sila Pertama',
        options: [
          'Persatuan Indonesia',
          'Kemanusiaan yang Adil dan Beradab',
          'Ketuhanan Yang Maha Esa',
          'Keadilan Sosial bagi Seluruh Rakyat Indonesia'
        ],
        correctIndex: 2,
        explanation: 'Sila pertama Pancasila berbunyi "Ketuhanan Yang Maha Esa" yang dilambangkan dengan bintang emas berlatar perisai hitam, menegaskan pengakuan atas nilai ketuhanan.',
        points: 10,
        customDurationSec: 30
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q03',
        text: 'Aturan yang mengatur perilaku manusia dalam kehidupan sehari-hari disebut ....',
        type: 'multiple_choice',
        imageCaption: '📜 Kaidah dan Pedoman Perilaku',
        options: ['hak', 'kewajiban', 'norma', 'tanggung jawab'],
        correctIndex: 2,
        explanation: 'Norma adalah kaidah atau aturan yang disepakati dan berlaku di tengah masyarakat guna mengatur tingkah laku manusia agar tercipta ketertiban dan ketenteraman.',
        points: 10,
        customDurationSec: 30
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q04',
        text: 'Contoh hak seorang murid di sekolah adalah ....',
        type: 'multiple_choice',
        imageCaption: '🏫 Suasana Pembelajaran di Kelas',
        options: [
          'menjaga kebersihan kelas',
          'mendapatkan pembelajaran',
          'mengerjakan tugas',
          'menaati tata tertib'
        ],
        correctIndex: 1,
        explanation: 'Mendapatkan bimbingan dan pembelajaran yang berkualitas dari guru merupakan hak murid. Sedangkan membersihkan kelas, mengerjakan tugas, dan menaati tata tertib adalah kewajiban.',
        points: 10,
        customDurationSec: 30
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q05',
        text: 'Sesuatu yang harus dilakukan dengan penuh kesadaran disebut ....',
        type: 'multiple_choice',
        imageCaption: '🤝 Pelaksanaan Tugas dengan Sadar',
        options: ['hak', 'kewajiban', 'hadiah', 'keinginan'],
        correctIndex: 1,
        explanation: 'Kewajiban adalah segala sesuatu yang wajib dilaksanakan atau dikerjakan oleh seseorang dengan penuh kesadaran diri dan rasa tanggung jawab.',
        points: 10,
        customDurationSec: 30
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q06',
        text: 'Contoh kewajiban murid di sekolah adalah ....',
        type: 'multiple_choice',
        imageCaption: '🎒 Kedisiplinan Murid Sekolah Dasar',
        options: [
          'mendapatkan nilai',
          'menggunakan fasilitas sekolah',
          'menaati tata tertib sekolah',
          'mendapatkan perlindungan'
        ],
        correctIndex: 2,
        explanation: 'Menaati tata tertib dan aturan sekolah adalah kewajiban mutlak setiap murid. Memperoleh nilai, fasilitas, dan perlindungan merupakan hak.',
        points: 10,
        customDurationSec: 30
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q07',
        text: 'Sikap bertanggung jawab ditunjukkan dengan ....',
        type: 'multiple_choice',
        imageCaption: '✨ Komitmen Menyelesaikan Tugas',
        options: [
          'menyalahkan orang lain',
          'menghindari tugas',
          'melaksanakan tugas dengan sungguh-sungguh',
          'meninggalkan tugas yang diberikan'
        ],
        correctIndex: 2,
        explanation: 'Sikap tanggung jawab tercermin dari kesungguhan hati dalam menyelesaikan setiap tugas yang diamanahkan dan berani menanggung segala konsekuensinya.',
        points: 10,
        customDurationSec: 30
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q08',
        text: 'Rani melihat temannya membuang sampah sembarangan. Sikap yang sebaiknya dilakukan Rani adalah ....',
        type: 'multiple_choice',
        imageCaption: '🌱 Menjaga Kebersihan Lingkungan Sekolah',
        options: [
          'membiarkannya',
          'ikut membuang sampah sembarangan',
          'menegur dengan sopan dan mengajak membuang sampah pada tempatnya',
          'memarahi temannya di depan semua orang'
        ],
        correctIndex: 2,
        explanation: 'Menegur dengan bahasa yang sopan dan santun serta mengajak teman membuang sampah pada tempatnya mencerminkan kepedulian lingkungan yang mendidik tanpa mempermalukan orang lain.',
        points: 10,
        customDurationSec: 30
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q09',
        text: 'Ketika sedang berdiskusi, setiap anggota kelompok memiliki pendapat yang berbeda. Sikap yang sesuai dengan nilai Pancasila adalah ....',
        type: 'multiple_choice',
        imageCaption: '👥 Musyawarah Kelompok Belajar',
        options: [
          'memaksakan pendapat sendiri',
          'menghargai pendapat anggota kelompok',
          'meninggalkan diskusi',
          'memilih pendapat teman yang paling dekat'
        ],
        correctIndex: 1,
        explanation: 'Menghargai keragaman pendapat saat bermusyawarah adalah nilai luhur Pancasila (sila keempat), di mana keputusan diambil untuk kepentingan bersama secara mufakat.',
        points: 10,
        customDurationSec: 30
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q10',
        text: 'Contoh penerapan sila ketiga Pancasila di sekolah adalah ....',
        type: 'multiple_choice',
        imageCaption: '🌳 Pohon Beringin Sila Persatuan Indonesia',
        options: [
          'berdoa sebelum belajar',
          'membantu teman yang kesulitan',
          'menjaga persatuan meskipun berbeda',
          'melaksanakan musyawarah'
        ],
        correctIndex: 2,
        explanation: 'Sila ketiga "Persatuan Indonesia" di sekolah diwujudkan dengan menjaga kerukunan, bermain dan belajar bersama tanpa membedakan suku, agama, dan latar belakang.',
        points: 10,
        customDurationSec: 30
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q11',
        text: 'Edo mendapatkan hak menggunakan fasilitas perpustakaan. Agar hak tersebut digunakan dengan baik, Edo seharusnya ....',
        type: 'multiple_choice',
        imageCaption: '📚 Fasilitas Perpustakaan Sekolah',
        options: [
          'mencoret-coret buku',
          'mengembalikan buku tepat waktu',
          'membawa semua buku pulang',
          'merusak buku yang dipinjam'
        ],
        correctIndex: 1,
        explanation: 'Penggunaan hak membaca di perpustakaan harus disertai kewajiban memelihara keutuhan buku dan mengembalikannya tepat waktu agar teman lain dapat memanfaatkannya.',
        points: 10,
        customDurationSec: 30
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q12',
        text: 'Setiap murid memiliki hak untuk belajar dengan nyaman. Agar hak tersebut terpenuhi, murid juga memiliki kewajiban untuk ....',
        type: 'multiple_choice',
        imageCaption: '📖 Suasana Belajar yang Nyaman dan Tenang',
        options: [
          'membuat keributan',
          'mengganggu teman',
          'menjaga ketertiban kelas',
          'bermain saat pembelajaran'
        ],
        correctIndex: 2,
        explanation: 'Kenyamanan belajar bersama di ruang kelas dapat tercapai apabila seluruh murid tertib, tenang, dan fokus mendengarkan penjelasan saat pembelajaran berlangsung.',
        points: 10,
        customDurationSec: 30
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q13',
        text: 'Dika tidak sengaja memecahkan pot bunga di sekolah. Sikap yang menunjukkan tanggung jawab adalah ....',
        type: 'multiple_choice',
        imageCaption: '🪴 Kejujuran dan Keberanian Berbuat Tanggung Jawab',
        options: [
          'bersembunyi agar tidak diketahui',
          'menyalahkan temannya',
          'mengakui kesalahan dan bersedia memperbaikinya',
          'pura-pura tidak mengetahui kejadian tersebut'
        ],
        correctIndex: 2,
        explanation: 'Mengakui kelalaian secara jujur serta berinisiatif mengganti atau memperbaiki kerusakan merupakan perwujudan karakter murid yang bertanggung jawab dan kesatria.',
        points: 10,
        customDurationSec: 30
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q14',
        text: 'Norma dibuat dan diterapkan dalam kehidupan masyarakat dengan tujuan ....',
        type: 'multiple_choice',
        imageCaption: '⚖️ Ketertiban dan Keteraturan Masyarakat',
        options: [
          'membuat orang takut',
          'menciptakan kehidupan yang tertib dan teratur',
          'membatasi semua kegiatan manusia',
          'memberikan hukuman kepada semua orang'
        ],
        correctIndex: 1,
        explanation: 'Tujuan utama diterapkannya norma adalah memelihara keharmonisan sosial, mencegah perselisihan, dan mewujudkan keteraturan dalam interaksi antarmanusia.',
        points: 10,
        customDurationSec: 30
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q15',
        text: 'Dalam kerja kelompok, Andi selalu ingin menentukan semua keputusan sendiri. Akibatnya, anggota kelompok lain merasa tidak dihargai. Apa yang sebaiknya dilakukan kelompok tersebut?',
        type: 'multiple_choice',
        imageCaption: '🤝 Musyawarah Mengambil Keputusan Bersama',
        options: [
          'Membiarkan Andi mengambil semua keputusan.',
          'Membubarkan kelompok.',
          'Melakukan musyawarah dan memberikan kesempatan kepada semua anggota untuk menyampaikan pendapat.',
          'Mengikuti pendapat anggota yang paling banyak bicara.'
        ],
        correctIndex: 2,
        explanation: 'Kerja kelompok didasari semangat gotong royong dan musyawarah. Seluruh anggota berhak didengar pendapatnya agar tercapai keputusan bersama yang adil dan dihargai.',
        points: 10,
        customDurationSec: 35
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q16',
        text: 'Di kelas terdapat aturan bahwa setiap murid harus menjaga kebersihan. Setelah kegiatan belajar, beberapa murid meninggalkan sampah di lantai. Mengapa menaati aturan tersebut merupakan bentuk tanggung jawab?',
        type: 'multiple_choice',
        imageCaption: '🧹 Kebersihan Kelas Tanggung Jawab Bersama',
        options: [
          'Karena takut mendapatkan hukuman.',
          'Karena kebersihan hanya tugas petugas kebersihan.',
          'Karena setiap murid memiliki peran dalam menjaga lingkungan bersama.',
          'Karena guru akan selalu mengawasi kelas.'
        ],
        correctIndex: 2,
        explanation: 'Kebersihan lingkungan kelas adalah kepentingan bersama. Menaati aturan kebersihan mencerminkan pemahaman bahwa kenyamanan belajar merupakan amanah setiap murid.',
        points: 10,
        customDurationSec: 35
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q17',
        text: 'Perhatikan kegiatan berikut!\n1. Menghormati teman yang berbeda agama.\n2. Memaksakan agama kepada orang lain.\n3. Memberikan kesempatan teman beribadah.\n4. Mengganggu teman ketika beribadah.\n\nKegiatan yang sesuai dengan nilai sila pertama Pancasila ditunjukkan oleh nomor ....',
        type: 'multiple_choice',
        imageCaption: '🕊️ Toleransi Antarumat Beragama',
        options: ['1 dan 2', '1 dan 3', '2 dan 4', '3 dan 4'],
        correctIndex: 1,
        explanation: 'Sila pertama menjamin kemerdekaan beragama dan toleransi. Kegiatan 1 (menghormati teman beda agama) dan 3 (memberi kesempatan beribadah) adalah sikap yang benar.',
        points: 10,
        customDurationSec: 35
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q18',
        text: 'Setiap murid ingin mendapatkan hak untuk menggunakan fasilitas sekolah. Namun, fasilitas tersebut sering rusak karena digunakan sembarangan. Apa hubungan antara hak dan kewajiban dalam keadaan tersebut?',
        type: 'multiple_choice',
        imageCaption: '⚖️ Keseimbangan Hak dan Kewajiban',
        options: [
          'Hak dapat diperoleh tanpa melaksanakan kewajiban.',
          'Kewajiban hanya berlaku bagi guru.',
          'Hak perlu diimbangi dengan kewajiban untuk menjaga fasilitas.',
          'Fasilitas sekolah tidak boleh digunakan oleh murid.'
        ],
        correctIndex: 2,
        explanation: 'Hak dan kewajiban saling bertautan secara erat. Hak menikmati fasilitas sekolah hanya dapat berlanjut secara baik jika seluruh murid memenuhi kewajiban merawat fasilitas tersebut.',
        points: 10,
        customDurationSec: 35
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q19',
        text: 'Bayangkan kamu menjadi ketua kelas. Ada beberapa murid yang tidak menjalankan piket sehingga kelas menjadi kotor. Tindakan yang paling tepat adalah ....',
        type: 'multiple_choice',
        imageCaption: '👥 Kepemimpinan dan Tanggung Jawab Regu Piket',
        options: [
          'memberikan hukuman tanpa mendengarkan alasan mereka',
          'membiarkan keadaan tersebut',
          'mengajak berdiskusi dan mengingatkan pentingnya menjalankan kewajiban piket',
          'meminta murid lain mengerjakan semua tugas piket'
        ],
        correctIndex: 2,
        explanation: 'Pemimpin yang bijak mengedepankan komunikasi persuasif dan dialog. Mengajak berdiskusi serta mengingatkan tanggung jawab piket menumbuhkan kedisiplinan tanpa otoriter.',
        points: 10,
        customDurationSec: 35
      },
      {
        id: 'sd5-pancasila-norma-hak-kewajiban-q20',
        text: 'Perhatikan pernyataan berikut!\n"Setiap orang memiliki hak untuk dihormati, tetapi ia juga harus menghormati orang lain."\n\nMengapa pernyataan tersebut penting dalam kehidupan sehari-hari?',
        type: 'multiple_choice',
        imageCaption: '🌟 Saling Menghargai dalam Masyarakat',
        options: [
          'Karena hak lebih penting daripada kewajiban.',
          'Karena kehidupan akan menjadi lebih tertib jika setiap orang menghargai hak dan melaksanakan kewajibannya.',
          'Karena kewajiban hanya perlu dilakukan ketika diperintah.',
          'Karena setiap orang boleh melakukan apa saja yang diinginkannya.'
        ],
        correctIndex: 1,
        explanation: 'Keseimbangan antara menuntut hak dan menghormati hak sesama melalui pemenuhan kewajiban merupakan fondasi utama terciptanya tatanan hidup rukun, tertib, dan harmonis.',
        points: 10,
        customDurationSec: 35
      }
    ]
  }
];
