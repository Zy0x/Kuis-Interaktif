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

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'sd1-mtk-hitung',
    title: 'Petualangan Berhitung Ceria',
    description: 'Ayo berhitung buah-buahan dan benda di sekitar kita dengan riang gembira!',
    subject: 'Matematika',
    grade: 1,
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
      }
    ]
  },
  {
    id: 'sd6-pancasila-wawasan',
    title: 'Pancasila & Kebudayaan Nusantara',
    description: 'Kenali lambang burung Garuda, sila Pancasila, dan keberagaman budaya Indonesia!',
    subject: 'Pendidikan Pancasila',
    grade: 6,
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
  }
];
