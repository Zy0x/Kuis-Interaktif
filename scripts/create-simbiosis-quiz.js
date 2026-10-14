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
const QUIZ_ID = 'sd5-ipas-simbiosis';
const PIN_CODE = '5015';

const quizData = {
  id: QUIZ_ID,
  creator_id: ADMIN_TEACHER_ID,
  creator_name: ADMIN_NAME,
  pin_code: PIN_CODE,
  title: 'Soal Pilihan Ganda IPAS - Simbiosis',
  description: 'Kuis interaktif IPAS Kelas 5 SD topik Simbiosis. Dilengkapi 15 butir soal pilihan ganda tentang hubungan antarmakhluk hidup (Mutualisme, Komensalisme, Parasitisme) beserta kunci jawaban dan penjelasan lengkap.',
  subject: 'IPAS',
  target_grade: 5,
  duration_per_question_sec: 30,
  cover_emoji: '🌿',
  theme_color: 'from-emerald-500 to-teal-700',
  badge_title: 'Pakar Simbiosis',
  visibility: 'public',
  default_game_mode: 'standard',
  shuffle_questions: false,
  shuffle_options: false,
  is_published: true,
  is_archived: false,
};

const questionsData = [
  {
    id: `${QUIZ_ID}-q01`,
    quiz_id: QUIZ_ID,
    question_text: 'Hubungan yang terjadi antara dua makhluk hidup yang hidup bersama disebut ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🔍 Interaksi Dua Makhluk Hidup',
    options: ['habitat', 'simbiosis', 'ekosistem', 'populasi'],
    correct_index: 1,
    explanation: 'Simbiosis adalah hubungan atau interaksi timbal balik yang erat dan khas antara dua organisme atau makhluk hidup berbeda yang hidup berdampingan.',
    order_number: 1,
    acceptable_answers: ['B', 'simbiosis'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q02`,
    quiz_id: QUIZ_ID,
    question_text: 'Simbiosis yang menguntungkan kedua makhluk hidup disebut ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🤝 Interaksi Saling Menguntungkan',
    options: ['parasitisme', 'komensalisme', 'mutualisme', 'kompetisi'],
    correct_index: 2,
    explanation: 'Simbiosis mutualisme adalah bentuk interaksi antara dua makhluk hidup yang saling memberikan keuntungan bagi kedua belah pihak tanpa ada yang dirugikan.',
    order_number: 2,
    acceptable_answers: ['C', 'mutualisme'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q03`,
    quiz_id: QUIZ_ID,
    question_text: 'Contoh simbiosis mutualisme adalah hubungan antara ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🐝 Lebah dan Bunga Mekar',
    options: ['benalu dan pohon mangga', 'kucing dan tikus', 'lebah dan bunga', 'ikan hiu dan ikan kecil'],
    correct_index: 2,
    explanation: 'Hubungan lebah dan bunga adalah mutualisme karena lebah memperoleh nektar manis sebagai makanan, sedangkan bunga terbantu dalam proses penyerbukannya.',
    order_number: 3,
    acceptable_answers: ['C', 'lebah dan bunga'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q04`,
    quiz_id: QUIZ_ID,
    question_text: 'Dalam hubungan lebah dan bunga, lebah mendapatkan ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🍯 Lebah Mengisap Nektar Bunga',
    options: ['tempat berlindung', 'nektar sebagai makanan', 'air', 'daun'],
    correct_index: 1,
    explanation: 'Lebah hinggap pada bunga untuk mengisap nektar atau cairan manis sebagai sumber makanan utamanya dalam memproduksi madu.',
    order_number: 4,
    acceptable_answers: ['B', 'nektar sebagai makanan'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q05`,
    quiz_id: QUIZ_ID,
    question_text: 'Hubungan antara benalu dan pohon yang ditumpanginya merupakan simbiosis ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🌿 Benalu Menempel pada Batang Pohon',
    options: ['mutualisme', 'komensalisme', 'parasitisme', 'netralisme'],
    correct_index: 2,
    explanation: 'Benalu menyerap air dan mineral langsung dari pohon inang sehingga pohon inang kekurangan nutrisi dan dapat mati. Ini merupakan contoh simbiosis parasitisme.',
    order_number: 5,
    acceptable_answers: ['C', 'parasitisme'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q06`,
    quiz_id: QUIZ_ID,
    question_text: 'Pada simbiosis parasitisme, salah satu makhluk hidup ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '⚠️ Satu Pihak Diuntungkan, Pihak Lain Dirugikan',
    options: [
      'diuntungkan dan yang lain dirugikan',
      'diuntungkan dan yang lain tidak terpengaruh',
      'keduanya diuntungkan',
      'keduanya dirugikan'
    ],
    correct_index: 0,
    explanation: 'Parasitisme adalah hubungan di mana parasit mendapatkan keuntungan (makanan/tempat), sedangkan organisme inang (host) mengalami kerugian bahkan kerusakan fisik.',
    order_number: 6,
    acceptable_answers: ['A', 'diuntungkan dan yang lain dirugikan'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q07`,
    quiz_id: QUIZ_ID,
    question_text: 'Contoh lain simbiosis parasitisme adalah hubungan antara ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🐱 Kutu Menempel pada Tubuh Kucing',
    options: ['kupu-kupu dan bunga', 'kutu dan kucing', 'kerbau dan burung jalak', 'ikan badut dan anemon laut'],
    correct_index: 1,
    explanation: 'Kutu mengisap darah kucing dan menyebabkan gatal serta penyakit kulit (kucing dirugikan, kutu diuntungkan). Ini merupakan contoh parasitisme.',
    order_number: 7,
    acceptable_answers: ['B', 'kutu dan kucing'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q08`,
    quiz_id: QUIZ_ID,
    question_text: 'Kutu yang hidup pada tubuh kucing mendapatkan keuntungan berupa ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🔍 Kutu Mengambil Makanan dan Perlindungan',
    options: ['makanan', 'cahaya matahari', 'tempat berteduh dan makanan', 'nektar bunga'],
    correct_index: 2,
    explanation: 'Kutu memanfaatkan tubuh kucing sebagai tempat berteduh/berlindung yang hangat sekaligus mendapatkan makanan berupa darah kucing.',
    order_number: 8,
    acceptable_answers: ['C', 'tempat berteduh dan makanan'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q09`,
    quiz_id: QUIZ_ID,
    question_text: 'Simbiosis komensalisme adalah hubungan yang menyebabkan ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🌸 Satu Untung, Pihak Lain Netral',
    options: [
      'kedua makhluk hidup dirugikan',
      'kedua makhluk hidup diuntungkan',
      'satu makhluk hidup diuntungkan, sedangkan yang lain tidak dirugikan',
      'satu makhluk hidup dirugikan, sedangkan yang lain tidak mendapatkan keuntungan'
    ],
    correct_index: 2,
    explanation: 'Komensalisme adalah hubungan di mana satu pihak mendapatkan keuntungan, sedangkan pihak lain tidak merasa dirugikan dan juga tidak diuntungkan (netral).',
    order_number: 9,
    acceptable_answers: ['C'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q10`,
    quiz_id: QUIZ_ID,
    question_text: 'Contoh simbiosis komensalisme adalah hubungan antara ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🌺 Anggrek Tumbuh Menempel di Batang Pohon',
    options: ['anggrek dan pohon', 'benalu dan pohon', 'kutu dan kucing', 'lebah dan bunga'],
    correct_index: 0,
    explanation: 'Tanaman anggrek yang menempel pada batang pohon mendapatkan tempat hidup dan cahaya matahari tanpa menyerap nutrisi pohon inang (inang tidak dirugikan).',
    order_number: 10,
    acceptable_answers: ['A', 'anggrek dan pohon'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q11`,
    quiz_id: QUIZ_ID,
    question_text: 'Pada hubungan anggrek dan pohon yang ditumpanginya, anggrek mendapatkan ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '☀️ Anggrek Mendapatkan Paparan Cahaya Matahari',
    options: [
      'makanan dari pohon',
      'tempat untuk hidup dan mendapatkan cahaya',
      'darah dari pohon',
      'nektar dari pohon'
    ],
    correct_index: 1,
    explanation: 'Anggrek adalah tumbuhan epifit yang hanya menumpang tempat hidup di tempat yang lebih tinggi agar memperoleh sinar matahari untuk fotosintesis mandiri.',
    order_number: 11,
    acceptable_answers: ['B', 'tempat untuk hidup dan mendapatkan cahaya'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q12`,
    quiz_id: QUIZ_ID,
    question_text: 'Hubungan kerbau dan burung jalak termasuk simbiosis ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🐃 Burung Jalak Bertengger di Punggung Kerbau',
    options: ['parasitisme', 'komensalisme', 'mutualisme', 'kompetisi'],
    correct_index: 2,
    explanation: 'Hubungan kerbau dan burung jalak adalah mutualisme: burung jalak kenyang memakan kutu, dan kerbau terbebas dari rasa gatal akibat kutu di tubuhnya.',
    order_number: 12,
    acceptable_answers: ['C', 'mutualisme'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q13`,
    quiz_id: QUIZ_ID,
    question_text: 'Dalam hubungan kerbau dan burung jalak, burung jalak mendapatkan makanan berupa ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '🐦 Burung Jalak Memakan Kutu Kerbau',
    options: ['rumput', 'kutu yang ada pada tubuh kerbau', 'daun pohon', 'nektar bunga'],
    correct_index: 1,
    explanation: 'Burung jalak mematuk dan memakan kutu-kutu yang hinggap serta mengisap darah di permukaan kulit kerbau.',
    order_number: 13,
    acceptable_answers: ['B', 'kutu yang ada pada tubuh kerbau'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q14`,
    quiz_id: QUIZ_ID,
    question_text: 'Persamaan hubungan lebah dan bunga dengan kerbau dan burung jalak adalah ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '✨ Prinsip Saling Menguntungkan (Mutualisme)',
    options: [
      'salah satu pihak dirugikan',
      'salah satu pihak tidak mendapatkan keuntungan',
      'kedua makhluk hidup mendapatkan keuntungan',
      'kedua makhluk hidup saling merugikan'
    ],
    correct_index: 2,
    explanation: 'Keduanya sama-sama tergolong simbiosis mutualisme, di mana kedua makhluk hidup yang terlibat saling memberi dan menerima keuntungan.',
    order_number: 14,
    acceptable_answers: ['C', 'kedua makhluk hidup mendapatkan keuntungan'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
  {
    id: `${QUIZ_ID}-q15`,
    quiz_id: QUIZ_ID,
    question_text: 'Perhatikan pasangan berikut: (1) Benalu dan pohon mangga, (2) Lebah dan bunga, (3) Kutu dan kucing, (4) Anggrek dan pohon. Pasangan yang menunjukkan simbiosis komensalisme adalah ....',
    question_type: 'multiple_choice',
    image_url: null,
    image_caption: '📊 Analisis Pola Interaksi Simbiosis',
    options: ['1', '2', '3', '4'],
    correct_index: 3,
    explanation: 'Pasangan (1) Benalu dan pohon mangga = Parasitisme. Pasangan (2) Lebah dan bunga = Mutualisme. Pasangan (3) Kutu dan kucing = Parasitisme. Pasangan (4) Anggrek dan pohon = Komensalisme. Jadi pasangan yang menunjukkan komensalisme adalah nomor 4.',
    order_number: 15,
    acceptable_answers: ['D', '4'],
    matching_pairs: [],
    custom_duration_sec: 30,
    points: 10,
  },
];

async function run() {
  console.log('🚀 Memasukkan kuis IPAS - Simbiosis ke Supabase...');

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
  console.log('🎉 Selesai! Kuis Simbiosis telah aktif dan terhubung ke akun Admin.');
}

run();
