import { Teacher, Classroom, Workload } from '../types';

export const DEMO_TEACHERS: Teacher[] = [
  { id: 't_elis_n', name: 'Elis N', nip: '-', code: 'ELN', maxJpPerDay: 8 },
  { id: 't_imas', name: 'Imas', nip: '-', code: 'IMS', maxJpPerDay: 8 },
  { id: 't_hana', name: 'Hana', nip: '-', code: 'HAN', maxJpPerDay: 8 },
  { id: 't_nendah', name: 'Nendah', nip: '-', code: 'NDH', maxJpPerDay: 8 },
  { id: 't_noneng', name: 'Noneng', nip: '-', code: 'NNG', maxJpPerDay: 8 },
  { id: 't_h_yadi', name: 'H. Yadi', nip: '-', code: 'YAD', maxJpPerDay: 8 },
  { id: 't_hj_ika', name: 'Hj. Ika', nip: '-', code: 'IKA', maxJpPerDay: 8 },
  { id: 't_hj_nina', name: 'Hj. Nina', nip: '-', code: 'NIN', maxJpPerDay: 8 },
  { id: 't_elis_m', name: 'Elis M', nip: '-', code: 'ELM', maxJpPerDay: 8 },
  { id: 't_ayi', name: 'Ayi', nip: '-', code: 'AYI', maxJpPerDay: 8 },
  { id: 't_yulia', name: 'Yulia', nip: '-', code: 'YUL', maxJpPerDay: 8 },
  { id: 't_tati', name: 'Tati', nip: '-', code: 'TAT', maxJpPerDay: 8 },
  { id: 't_dadang', name: 'Dadang', nip: '-', code: 'DDG', maxJpPerDay: 8 },
  { id: 't_lisa', name: 'Lisa', nip: '-', code: 'LIS', maxJpPerDay: 8 },
  { id: 't_lina', name: 'Lina', nip: '-', code: 'LIN', maxJpPerDay: 8 },
  { id: 't_rafli', name: 'Rafli', nip: '-', code: 'RFL', maxJpPerDay: 8 },
  { id: 't_m_iqbal', name: 'M Iqbal', nip: '-', code: 'IQB', maxJpPerDay: 8 },
  { id: 't_hilda', name: 'Hilda', nip: '-', code: 'HLD', maxJpPerDay: 8 },
  { id: 't_sindi', name: 'Sindi', nip: '-', code: 'SND', maxJpPerDay: 8 },
  { id: 't_bahtiar', name: 'Bahtiar', nip: '-', code: 'BHT', maxJpPerDay: 8 },
  { id: 't_nurul', name: 'Nurul', nip: '-', code: 'NRL', maxJpPerDay: 8 },
  { id: 't_yani', name: 'Yani', nip: '-', code: 'YNI', maxJpPerDay: 8 },
  { id: 't_tata', name: 'Tata', nip: '-', code: 'TTA', maxJpPerDay: 8 },
  { id: 't_n_tenta', name: 'N. Tenta', nip: '-', code: 'TTN', maxJpPerDay: 8 },
  { id: 't_ikeu', name: 'Ikeu', nip: '-', code: 'IKU', maxJpPerDay: 8 },
  { id: 't_rita', name: 'Rita', nip: '-', code: 'RTA', maxJpPerDay: 8 },
  { id: 't_nida', name: 'Nida', nip: '-', code: 'NDA', maxJpPerDay: 8 },
  { id: 't_eni', name: 'Eni', nip: '-', code: 'ENI', maxJpPerDay: 8 },
  { id: 't_hermawati', name: 'Hermawati', nip: '-', code: 'HRM', maxJpPerDay: 8 },
  { id: 't_feri', name: 'Feri', nip: '-', code: 'FER', maxJpPerDay: 8 },
  { id: 't_h_usep', name: 'H. Usep', nip: '-', code: 'USP', maxJpPerDay: 8 },
  { id: 't_dewi', name: 'Dewi', nip: '-', code: 'DWI', maxJpPerDay: 8 },
  { id: 't_idik', name: 'Idik', nip: '-', code: 'IDK', maxJpPerDay: 8 },
  { id: 't_n_dede', name: 'N. Dede', nip: '-', code: 'DDE', maxJpPerDay: 8 },
  { id: 't_ali', name: 'Ali', nip: '-', code: 'ALI', maxJpPerDay: 8 },
  { id: 't_yuni', name: 'Yuni', nip: '-', code: 'YUN', maxJpPerDay: 8 },
  { id: 't_lenie', name: 'Lenie', nip: '-', code: 'LEN', maxJpPerDay: 8 },
  { id: 't_komariah', name: 'Komariah', nip: '-', code: 'KMR', maxJpPerDay: 8 },
  { id: 't_hj_ida', name: 'Hj Ida', nip: '-', code: 'IDA', maxJpPerDay: 8 },
  { id: 't_yeni', name: 'Yeni', nip: '-', code: 'YEN', maxJpPerDay: 8 },
  { id: 't_deden', name: 'Deden', nip: '-', code: 'DDN', maxJpPerDay: 8 },
  { id: 't_mira', name: 'Mira', nip: '-', code: 'MIR', maxJpPerDay: 8 },
  { id: 't_asep', name: 'Asep', nip: '-', code: 'ASP', maxJpPerDay: 8 },
  {
    id: 't_dita',
    name: 'Dita',
    nip: '-',
    code: 'DIT',
    maxJpPerDay: 8,
    unavailableSlots: [
      { day: 'Senin', period: 9 }, // JP 10
      { day: 'Kamis', period: 9 }, // JP 10
      { day: 'Jumat', period: 5 }, // JP 6
      { day: 'Jumat', period: 6 }, // JP 7
      { day: 'Jumat', period: 7 }, // JP 8
      { day: 'Jumat', period: 8 }, // JP 9
      { day: 'Jumat', period: 9 }  // JP 10
    ]
  },
  { id: 't_aris', name: 'Aris', nip: '-', code: 'ARS', maxJpPerDay: 8 },
  { id: 't_dian', name: 'Dian', nip: '-', code: 'DIN', maxJpPerDay: 8 },
  { id: 't_h_didi', name: 'H. Didi', nip: '-', code: 'DID', maxJpPerDay: 8 },
  { id: 't_engkos', name: 'Engkos', nip: '-', code: 'EGK', maxJpPerDay: 8 },
  { id: 't_jono', name: 'Jono', nip: '-', code: 'JON', maxJpPerDay: 8 },
  { id: 't_soni', name: 'Soni', nip: '-', code: 'SNI', maxJpPerDay: 8 }
];

export const DEMO_CLASSROOMS: Classroom[] = [
  // Kelas 7
  { id: 'c_7a', name: '7A' }, { id: 'c_7b', name: '7B' }, { id: 'c_7c', name: '7C' },
  { id: 'c_7d', name: '7D' }, { id: 'c_7e', name: '7E' }, { id: 'c_7f', name: '7F' },
  { id: 'c_7g', name: '7G' }, { id: 'c_7h', name: '7H' }, { id: 'c_7i', name: '7I' },
  { id: 'c_7j', name: '7J' }, { id: 'c_7k', name: '7K' },
  // Kelas 8
  { id: 'c_8a', name: '8A' }, { id: 'c_8b', name: '8B' }, { id: 'c_8c', name: '8C' },
  { id: 'c_8d', name: '8D' }, { id: 'c_8e', name: '8E' }, { id: 'c_8f', name: '8F' },
  { id: 'c_8g', name: '8G' }, { id: 'c_8h', name: '8H' }, { id: 'c_8i', name: '8I' },
  { id: 'c_8j', name: '8J' }, { id: 'c_8k', name: '8K' },
  // Kelas 9
  { id: 'c_9a', name: '9A' }, { id: 'c_9b', name: '9B' }, { id: 'c_9c', name: '9C' },
  { id: 'c_9d', name: '9D' }, { id: 'c_9e', name: '9E' }, { id: 'c_9f', name: '9F' },
  { id: 'c_9g', name: '9G' }, { id: 'c_9h', name: '9H' }, { id: 'c_9i', name: '9I' },
  { id: 'c_9j', name: '9J' }, { id: 'c_9k', name: '9K' }
];

// Map of subject configs: name -> JP and a function to resolve teacher
const SUBJECT_CONFIGS: {
  subject: string;
  jp: number;
  getTeacherId: (grade: string, sec: string) => string;
}[] = [
  {
    subject: 'Bahasa Indonesia',
    jp: 6,
    getTeacherId: (grade, sec) => {
      if (grade === '7') return sec <= 'f' ? 't_elis_n' : 't_imas';
      if (grade === '8') {
        if (sec === 'i') return 't_noneng';
        return sec <= 'd' ? 't_hana' : 't_nendah';
      }
      return sec <= 'f' ? 't_h_yadi' : 't_noneng';
    }
  },
  {
    subject: 'Bahasa Inggris',
    jp: 4,
    getTeacherId: (grade, sec) => {
      if (grade === '7') {
        if (sec === 'a' || sec === 'b') return 't_hj_ika';
        if (sec === 'c' || sec === 'e' || sec === 'f') return 't_hj_nina';
        return 't_elis_m';
      }
      if (grade === '8') {
        if (sec <= 'c') return 't_ayi';
        if (sec === 'd' || sec === 'e') return 't_yulia';
        return 't_tati';
      }
      if (sec <= 'd') return 't_hj_ika';
      if (sec >= 'e' && sec <= 'h') return 't_yulia';
      return 't_dadang';
    }
  },
  {
    subject: 'Bahasa Sunda',
    jp: 2,
    getTeacherId: (grade, sec) => {
      if (grade === '7') {
        if (sec <= 'e') return 't_lisa';
        if (sec === 'f') return 't_dadang';
        return 't_hana';
      }
      if (grade === '8') {
        if (sec <= 'c' || sec === 'f' || sec === 'j' || sec === 'k') return 't_yulia';
        return 't_dadang';
      }
      return 't_lisa';
    }
  },
  {
    subject: 'BK',
    jp: 1,
    getTeacherId: (grade, sec) => {
      if (grade === '7') return sec <= 'g' ? 't_lina' : 't_rafli';
      if (grade === '8') {
        if (sec === 'h' || sec === 'j') return 't_hilda';
        if (sec === 'i' || sec === 'k') return 't_rafli';
        return 't_m_iqbal';
      }
      return sec <= 'd' ? 't_hilda' : 't_sindi';
    }
  },
  {
    subject: 'Informatika',
    jp: 3,
    getTeacherId: (grade, sec) => {
      if (grade === '7') {
        if (sec === 'a' || sec === 'd') return 't_bahtiar';
        if (sec === 'b' || sec === 'e' || sec === 'f') return 't_hilda';
        if (sec === 'c' || sec === 'g' || sec === 'i') return 't_rafli';
        return 't_m_iqbal';
      }
      if (grade === '8') {
        if (sec === 'a' || sec === 'b') return 't_nurul';
        if (sec === 'c' || sec === 'e') return 't_bahtiar';
        if (sec === 'd' || sec === 'f') return 't_yani';
        return 't_ayi';
      }
      return 't_tata';
    }
  },
  {
    subject: 'IPA',
    jp: 5,
    getTeacherId: (grade, sec) => {
      if (grade === '7') return sec <= 'e' ? 't_n_tenta' : 't_ikeu';
      if (grade === '8') {
        if (sec <= 'd' || sec === 'i' || sec === 'j') return 't_rita';
        return 't_nida';
      }
      if (sec === 'a' || sec === 'b' || sec === 'e' || sec === 'f' || sec === 'g' || sec === 'i') return 't_eni';
      if (sec === 'c' || sec === 'd') return 't_nida';
      if (sec === 'h' || sec === 'j') return 't_n_tenta';
      return 't_rita';
    }
  },
  {
    subject: 'IPS',
    jp: 4,
    getTeacherId: (grade, sec) => {
      if (grade === '7') {
        if (sec <= 'c') return 't_hermawati';
        if (sec >= 'd' && sec <= 'f') return 't_nurul';
        if (sec >= 'g' && sec <= 'j') return 't_bahtiar';
        return 't_feri';
      }
      if (grade === '8') {
        if (sec === 'd' || sec === 'f' || sec === 'h' || sec === 'i' || sec === 'k') return 't_feri';
        if (sec === 'g') return 't_bahtiar';
        return 't_yani';
      }
      if (sec <= 'c') return 't_h_usep';
      if (sec === 'd' || sec === 'e') return 't_hermawati';
      return 't_dewi';
    }
  },
  {
    subject: 'Matematika',
    jp: 5,
    getTeacherId: (grade, sec) => {
      if (grade === '7') return sec <= 'f' ? 't_idik' : 't_n_dede';
      if (grade === '8') {
        if (sec === 'b' || sec === 'g' || sec === 'h' || sec === 'i' || sec === 'j') return 't_yuni';
        if (sec === 'k') return 't_dadang';
        return 't_ali';
      }
      if (sec <= 'g') return 't_lenie';
      if (sec === 'h' || sec === 'k') return 't_yuni';
      return 't_n_dede';
    }
  },
  {
    subject: 'Pendidikan Agama dan Budi Pekerti',
    jp: 3,
    getTeacherId: (grade, sec) => {
      if (grade === '7') return (sec === 'a' || sec === 'b' || sec === 'k') ? 't_komariah' : 't_hj_ida';
      if (grade === '8') {
        if (sec === 'h') return 't_deden';
        if (sec === 'e' || sec === 'f' || sec === 'g' || sec === 'i' || sec === 'j') return 't_komariah';
        return 't_yeni';
      }
      return sec <= 'h' ? 't_deden' : 't_yeni';
    }
  },
  {
    subject: 'Pendidikan Pancasila',
    jp: 3,
    getTeacherId: (grade, sec) => {
      if (grade === '7') return 't_mira';
      if (grade === '8') return sec === 'k' ? 't_dita' : 't_asep';
      return sec === 'k' ? 't_asep' : 't_dita';
    }
  },
  {
    subject: 'PJOK',
    jp: 3,
    getTeacherId: (grade, sec) => {
      if (grade === '7') return sec <= 'h' ? 't_aris' : 't_dian';
      if (grade === '8') return sec <= 'c' ? 't_dian' : 't_h_didi';
      return sec <= 'h' ? 't_engkos' : 't_dian';
    }
  },
  {
    subject: 'Seni Budaya',
    jp: 2,
    getTeacherId: (grade, sec) => {
      if (grade === '7') return sec <= 'e' ? 't_jono' : 't_soni';
      if (grade === '8') return 't_soni';
      return 't_jono';
    }
  }
];

// Dynamically generate the 396 workloads perfectly aligned with the OCR sheet
const generatedWorkloads: Workload[] = [];
let workloadIdCounter = 1;

DEMO_CLASSROOMS.forEach(classroom => {
  const grade = classroom.name.charAt(0); // '7', '8', '9'
  const sec = classroom.name.substring(1).toLowerCase(); // 'a', 'b', ..., 'k'

  SUBJECT_CONFIGS.forEach(cfg => {
    const teacherId = cfg.getTeacherId(grade, sec);
    generatedWorkloads.push({
      id: `w_demo_${workloadIdCounter++}`,
      teacherId,
      classroomId: classroom.id,
      subject: cfg.subject,
      weeklyJp: cfg.jp
    });
  });
});

export const DEMO_WORKLOADS: Workload[] = generatedWorkloads;
