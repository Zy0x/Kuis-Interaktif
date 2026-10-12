import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY
);

const ADMIN_TEACHER_ID = '6b995377-1c3c-4b1f-a91e-e439f923185b';
const ADMIN_NAME = 'Admin';
const QUIZ_ID = 'sd5-pancasila-norma-hak-kewajiban';
const PIN_CODE = '5005';

const quizData = {
  id: QUIZ_ID,
  creator_id: ADMIN_TEACHER_ID,
  creator_name: ADMIN_NAME,
  pin_code: PIN_CODE,
  title: 'Latihan Pendidikan Pancasila: Norma, Hak, Kewajiban, dan Tanggung Jawab',
  description: 'Kuis latihan Pendidikan Pancasila Kelas 5 SD berdasarkan dokumen resmi materi Pancasila, Norma, Hak, Kewajiban, dan Tanggung Jawab. Dilengkapi 20 butir soal berjenjang (Tingkat Rendah, Sedang, hingga Tingkat Tinggi/HOTS) dengan kunci jawaban dan pembahasan komprehensif.',
  subject: 'Pendidikan Pancasila',
  target_grade: 5,
  duration_per_question_sec: 30,
  cover_emoji: '🇮🇩',
  theme_color: 'from-red-600 to-rose-700',
  badge_title: 'Pelajar Pancasila',
  visibility: 'public',
  default_game_mode: 'standard',
  shuffle_questions: false,
  shuffle_options: false,
  is_published: true,
  is_archived: false,
};

const questionsData = [
  // A. Tingkat Rendah (1 - 7)
  {
    id: `${QUIZ_ID}-q01`,
    quiz_id: QUIZ_ID,
    question_text: 'Dasar negara Indonesia adalah ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🦅 Lambang Negara & Ideologi Bangsa',
    options: ['UUD 1945', 'Pancasila', 'Bhinneka Tunggal Ika', 'Proklamasi'],
    correct_index: 1,
    explanation: 'Pancasila merupakan dasar negara dan ideologi bangsa Indonesia yang menjadi pedoman fundamental dalam kehidupan bermasyarakat, berbangsa, dan bernegara.',
    order_number: 1,
    acceptable_answers: ['B', 'Pancasila'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q02`,
    quiz_id: QUIZ_ID,
    question_text: 'Bunyi sila pertama Pancasila adalah ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '⭐ Bintang Emas Sila Pertama',
    options: [
      'Persatuan Indonesia',
      'Kemanusiaan yang Adil dan Beradab',
      'Ketuhanan Yang Maha Esa',
      'Keadilan Sosial bagi Seluruh Rakyat Indonesia'
    ],
    correct_index: 2,
    explanation: 'Sila pertama Pancasila berbunyi "Ketuhanan Yang Maha Esa" yang dilambangkan dengan bintang emas berlatar perisai hitam, menegaskan pengakuan atas nilai ketuhanan.',
    order_number: 2,
    acceptable_answers: ['C', 'Ketuhanan Yang Maha Esa'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q03`,
    quiz_id: QUIZ_ID,
    question_text: 'Aturan yang mengatur perilaku manusia dalam kehidupan sehari-hari disebut ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '📜 Kaidah dan Pedoman Perilaku',
    options: ['hak', 'kewajiban', 'norma', 'tanggung jawab'],
    correct_index: 2,
    explanation: 'Norma adalah kaidah atau aturan yang disepakati dan berlaku di tengah masyarakat guna mengatur tingkah laku manusia agar tercipta ketertiban dan ketenteraman.',
    order_number: 3,
    acceptable_answers: ['C', 'norma'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q04`,
    quiz_id: QUIZ_ID,
    question_text: 'Contoh hak seorang murid di sekolah adalah ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🏫 Suasana Pembelajaran di Kelas',
    options: [
      'menjaga kebersihan kelas',
      'mendapatkan pembelajaran',
      'mengerjakan tugas',
      'menaati tata tertib'
    ],
    correct_index: 1,
    explanation: 'Mendapatkan bimbingan dan pembelajaran yang berkualitas dari guru merupakan hak murid. Sedangkan membersihkan kelas, mengerjakan tugas, dan menaati tata tertib adalah kewajiban.',
    order_number: 4,
    acceptable_answers: ['B', 'mendapatkan pembelajaran'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q05`,
    quiz_id: QUIZ_ID,
    question_text: 'Sesuatu yang harus dilakukan dengan penuh kesadaran disebut ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🤝 Pelaksanaan Tugas dengan Sadar',
    options: ['hak', 'kewajiban', 'hadiah', 'keinginan'],
    correct_index: 1,
    explanation: 'Kewajiban adalah segala sesuatu yang wajib dilaksanakan atau dikerjakan oleh seseorang dengan penuh kesadaran diri dan rasa tanggung jawab.',
    order_number: 5,
    acceptable_answers: ['B', 'kewajiban'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q06`,
    quiz_id: QUIZ_ID,
    question_text: 'Contoh kewajiban murid di sekolah adalah ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🎒 Kedisiplinan Murid Sekolah Dasar',
    options: [
      'mendapatkan nilai',
      'menggunakan fasilitas sekolah',
      'menaati tata tertib sekolah',
      'mendapatkan perlindungan'
    ],
    correct_index: 2,
    explanation: 'Menaati tata tertib dan aturan sekolah adalah kewajiban mutlak setiap murid. Memperoleh nilai, fasilitas, dan perlindungan merupakan hak.',
    order_number: 6,
    acceptable_answers: ['C', 'menaati tata tertib sekolah'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q07`,
    quiz_id: QUIZ_ID,
    question_text: 'Sikap bertanggung jawab ditunjukkan dengan ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '✨ Komitmen Menyelesaikan Tugas',
    options: [
      'menyalahkan orang lain',
      'menghindari tugas',
      'melaksanakan tugas dengan sungguh-sungguh',
      'meninggalkan tugas yang diberikan'
    ],
    correct_index: 2,
    explanation: 'Sikap tanggung jawab tercermin dari kesungguhan hati dalam menyelesaikan setiap tugas yang diamanahkan dan berani menanggung segala konsekuensinya.',
    order_number: 7,
    acceptable_answers: ['C', 'melaksanakan tugas dengan sungguh-sungguh'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },

  // B. Tingkat Sedang (8 - 14)
  {
    id: `${QUIZ_ID}-q08`,
    quiz_id: QUIZ_ID,
    question_text: 'Rani melihat temannya membuang sampah sembarangan. Sikap yang sebaiknya dilakukan Rani adalah ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🌱 Menjaga Kebersihan Lingkungan Sekolah',
    options: [
      'membiarkannya',
      'ikut membuang sampah sembarangan',
      'menegur dengan sopan dan mengajak membuang sampah pada tempatnya',
      'memarahi temannya di depan semua orang'
    ],
    correct_index: 2,
    explanation: 'Menegur dengan bahasa yang sopan dan santun serta mengajak teman membuang sampah pada tempatnya mencerminkan kepedulian lingkungan yang mendidik tanpa mempermalukan orang lain.',
    order_number: 8,
    acceptable_answers: ['C'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q09`,
    quiz_id: QUIZ_ID,
    question_text: 'Ketika sedang berdiskusi, setiap anggota kelompok memiliki pendapat yang berbeda. Sikap yang sesuai dengan nilai Pancasila adalah ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '👥 Musyawarah Kelompok Belajar',
    options: [
      'memaksakan pendapat sendiri',
      'menghargai pendapat anggota kelompok',
      'meninggalkan diskusi',
      'memilih pendapat teman yang paling dekat'
    ],
    correct_index: 1,
    explanation: 'Menghargai keragaman pendapat saat bermusyawarah adalah nilai luhur Pancasila (sila keempat), di mana keputusan diambil untuk kepentingan bersama secara mufakat.',
    order_number: 9,
    acceptable_answers: ['B', 'menghargai pendapat anggota kelompok'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q10`,
    quiz_id: QUIZ_ID,
    question_text: 'Contoh penerapan sila ketiga Pancasila di sekolah adalah ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🌳 Pohon Beringin Sila Persatuan Indonesia',
    options: [
      'berdoa sebelum belajar',
      'membantu teman yang kesulitan',
      'menjaga persatuan meskipun berbeda',
      'melaksanakan musyawarah'
    ],
    correct_index: 2,
    explanation: 'Sila ketiga "Persatuan Indonesia" di sekolah diwujudkan dengan menjaga kerukunan, bermain dan belajar bersama tanpa membedakan suku, agama, dan latar belakang.',
    order_number: 10,
    acceptable_answers: ['C', 'menjaga persatuan meskipun berbeda'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q11`,
    quiz_id: QUIZ_ID,
    question_text: 'Edo mendapatkan hak menggunakan fasilitas perpustakaan. Agar hak tersebut digunakan dengan baik, Edo seharusnya ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '📚 Fasilitas Perpustakaan Sekolah',
    options: [
      'mencoret-coret buku',
      'mengembalikan buku tepat waktu',
      'membawa semua buku pulang',
      'merusak buku yang dipinjam'
    ],
    correct_index: 1,
    explanation: 'Penggunaan hak membaca di perpustakaan harus disertai kewajiban memelihara keutuhan buku dan mengembalikannya tepat waktu agar teman lain dapat memanfaatkannya.',
    order_number: 11,
    acceptable_answers: ['B', 'mengembalikan buku tepat waktu'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q12`,
    quiz_id: QUIZ_ID,
    question_text: 'Setiap murid memiliki hak untuk belajar dengan nyaman. Agar hak tersebut terpenuhi, murid juga memiliki kewajiban untuk ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '📖 Suasana Belajar yang Nyaman dan Tenang',
    options: [
      'membuat keributan',
      'mengganggu teman',
      'menjaga ketertiban kelas',
      'bermain saat pembelajaran'
    ],
    correct_index: 2,
    explanation: 'Kenyamanan belajar bersama di ruang kelas dapat tercapai apabila seluruh murid tertib, tenang, dan fokus mendengarkan penjelasan saat pembelajaran berlangsung.',
    order_number: 12,
    acceptable_answers: ['C', 'menjaga ketertiban kelas'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q13`,
    quiz_id: QUIZ_ID,
    question_text: 'Dika tidak sengaja memecahkan pot bunga di sekolah. Sikap yang menunjukkan tanggung jawab adalah ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🪴 Kejujuran dan Keberanian Berbuat Tanggung Jawab',
    options: [
      'bersembunyi agar tidak diketahui',
      'menyalahkan temannya',
      'mengakui kesalahan dan bersedia memperbaikinya',
      'pura-pura tidak mengetahui kejadian tersebut'
    ],
    correct_index: 2,
    explanation: 'Mengakui kelalaian secara jujur serta berinisiatif mengganti atau memperbaiki kerusakan merupakan perwujudan karakter murid yang bertanggung jawab dan kesatria.',
    order_number: 13,
    acceptable_answers: ['C', 'mengakui kesalahan dan bersedia memperbaikinya'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q14`,
    quiz_id: QUIZ_ID,
    question_text: 'Norma dibuat dan diterapkan dalam kehidupan masyarakat dengan tujuan ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '⚖️ Ketertiban dan Keteraturan Masyarakat',
    options: [
      'membuat orang takut',
      'menciptakan kehidupan yang tertib dan teratur',
      'membatasi semua kegiatan manusia',
      'memberikan hukuman kepada semua orang'
    ],
    correct_index: 1,
    explanation: 'Tujuan utama diterapkannya norma adalah memelihara keharmonisan sosial, mencegah perselisihan, dan mewujudkan keteraturan dalam interaksi antarmanusia.',
    order_number: 14,
    acceptable_answers: ['B', 'menciptakan kehidupan yang tertib dan teratur'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },

  // C. Tingkat Tinggi / HOTS (15 - 20)
  {
    id: `${QUIZ_ID}-q15`,
    quiz_id: QUIZ_ID,
    question_text: 'Dalam kerja kelompok, Andi selalu ingin menentukan semua keputusan sendiri. Akibatnya, anggota kelompok lain merasa tidak dihargai. Apa yang sebaiknya dilakukan kelompok tersebut?',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🤝 Musyawarah Mengambil Keputusan Bersama',
    options: [
      'Membiarkan Andi mengambil semua keputusan.',
      'Membubarkan kelompok.',
      'Melakukan musyawarah dan memberikan kesempatan kepada semua anggota untuk menyampaikan pendapat.',
      'Mengikuti pendapat anggota yang paling banyak bicara.'
    ],
    correct_index: 2,
    explanation: 'Kerja kelompok didasari semangat gotong royong dan musyawarah. Seluruh anggota berhak didengar pendapatnya agar tercapai keputusan bersama yang adil dan dihargai.',
    order_number: 15,
    acceptable_answers: ['C'],
    matching_pairs: [],
    custom_duration_sec: 35,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q16`,
    quiz_id: QUIZ_ID,
    question_text: 'Di kelas terdapat aturan bahwa setiap murid harus menjaga kebersihan. Setelah kegiatan belajar, beberapa murid meninggalkan sampah di lantai. Mengapa menaati aturan tersebut merupakan bentuk tanggung jawab?',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🧹 Kebersihan Kelas Tanggung Jawab Bersama',
    options: [
      'Karena takut mendapatkan hukuman.',
      'Karena kebersihan hanya tugas petugas kebersihan.',
      'Karena setiap murid memiliki peran dalam menjaga lingkungan bersama.',
      'Karena guru akan selalu mengawasi kelas.'
    ],
    correct_index: 2,
    explanation: 'Kebersihan lingkungan kelas adalah kepentingan bersama. Menaati aturan kebersihan mencerminkan pemahaman bahwa kenyamanan belajar merupakan amanah setiap murid.',
    order_number: 16,
    acceptable_answers: ['C'],
    matching_pairs: [],
    custom_duration_sec: 35,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q17`,
    quiz_id: QUIZ_ID,
    question_text: 'Perhatikan kegiatan berikut!\n1. Menghormati teman yang berbeda agama.\n2. Memaksakan agama kepada orang lain.\n3. Memberikan kesempatan teman beribadah.\n4. Mengganggu teman ketika beribadah.\n\nKegiatan yang sesuai dengan nilai sila pertama Pancasila ditunjukkan oleh nomor ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🕊️ Toleransi Antarumat Beragama',
    options: ['1 dan 2', '1 dan 3', '2 dan 4', '3 dan 4'],
    correct_index: 1,
    explanation: 'Sila pertama menjamin kemerdekaan beragama dan toleransi. Kegiatan 1 (menghormati teman beda agama) dan 3 (memberi kesempatan beribadah) adalah sikap yang benar.',
    order_number: 17,
    acceptable_answers: ['B', '1 dan 3'],
    matching_pairs: [],
    custom_duration_sec: 35,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q18`,
    quiz_id: QUIZ_ID,
    question_text: 'Setiap murid ingin mendapatkan hak untuk menggunakan fasilitas sekolah. Namun, fasilitas tersebut sering rusak karena digunakan sembarangan. Apa hubungan antara hak dan kewajiban dalam keadaan tersebut?',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '⚖️ Keseimbangan Hak dan Kewajiban',
    options: [
      'Hak dapat diperoleh tanpa melaksanakan kewajiban.',
      'Kewajiban hanya berlaku bagi guru.',
      'Hak perlu diimbangi dengan kewajiban untuk menjaga fasilitas.',
      'Fasilitas sekolah tidak boleh digunakan oleh murid.'
    ],
    correct_index: 2,
    explanation: 'Hak dan kewajiban saling bertautan secara erat. Hak menikmati fasilitas sekolah hanya dapat berlanjut secara baik jika seluruh murid memenuhi kewajiban merawat fasilitas tersebut.',
    order_number: 18,
    acceptable_answers: ['C'],
    matching_pairs: [],
    custom_duration_sec: 35,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q19`,
    quiz_id: QUIZ_ID,
    question_text: 'Bayangkan kamu menjadi ketua kelas. Ada beberapa murid yang tidak menjalankan piket sehingga kelas menjadi kotor. Tindakan yang paling tepat adalah ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '👥 Kepemimpinan dan Tanggung Jawab Regu Piket',
    options: [
      'memberikan hukuman tanpa mendengarkan alasan mereka',
      'membiarkan keadaan tersebut',
      'mengajak berdiskusi dan mengingatkan pentingnya menjalankan kewajiban piket',
      'meminta murid lain mengerjakan semua tugas piket'
    ],
    correct_index: 2,
    explanation: 'Pemimpin yang bijak mengedepankan komunikasi persuasif dan dialog. Mengajak berdiskusi serta mengingatkan tanggung jawab piket menumbuhkan kedisiplinan tanpa otoriter.',
    order_number: 19,
    acceptable_answers: ['C'],
    matching_pairs: [],
    custom_duration_sec: 35,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q20`,
    quiz_id: QUIZ_ID,
    question_text: 'Perhatikan pernyataan berikut!\n"Setiap orang memiliki hak untuk dihormati, tetapi ia juga harus menghormati orang lain."\n\nMengapa pernyataan tersebut penting dalam kehidupan sehari-hari?',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🌟 Saling Menghargai dalam Masyarakat',
    options: [
      'Karena hak lebih penting daripada kewajiban.',
      'Karena kehidupan akan menjadi lebih tertib jika setiap orang menghargai hak dan melaksanakan kewajibannya.',
      'Karena kewajiban hanya perlu dilakukan ketika diperintah.',
      'Karena setiap orang boleh melakukan apa saja yang diinginkannya.'
    ],
    correct_index: 1,
    explanation: 'Keseimbangan antara menuntut hak dan menghormati hak sesama melalui pemenuhan kewajiban merupakan fondasi utama terciptanya tatanan hidup rukun, tertib, dan harmonis.',
    order_number: 20,
    acceptable_answers: ['B'],
    matching_pairs: [],
    custom_duration_sec: 35,
    points: 10,
  },
];

async function run() {
  console.log('🚀 Memasukkan kuis Pendidikan Pancasila ke Supabase...');

  // 1. Upsert Quiz
  const { data: quizRes, error: quizErr } = await supabase
    .from('quizzes')
    .upsert(quizData)
    .select()
    .single();

  if (quizErr) {
    console.error('❌ Gagal menyimpan kuis:', quizErr);
    process.exit(1);
  }
  console.log('✅ Kuis berhasil disimpan:', quizRes.title, `[ID: ${quizRes.id}, PIN: ${quizRes.pin_code}]`);

  // 2. Hapus pertanyaan lama jika ada lalu insert pertanyaan baru
  const { error: delErr } = await supabase
    .from('quiz_questions')
    .delete()
    .eq('quiz_id', QUIZ_ID);

  if (delErr) {
    console.warn('Notice saat reset pertanyaan:', delErr);
  }

  const { data: qRes, error: qErr } = await supabase
    .from('quiz_questions')
    .insert(questionsData)
    .select();

  if (qErr) {
    console.error('❌ Gagal menyimpan pertanyaan:', qErr);
    process.exit(1);
  }

  console.log(`✅ Berhasil menyimpan seluruh ${qRes.length} butir pertanyaan ke database Supabase!`);
  console.log('🎉 Selesai! Kuis telah aktif dan terhubung ke akun Admin.');
}

run();
