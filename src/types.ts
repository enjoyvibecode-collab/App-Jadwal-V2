export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';

export interface LockedSlot {
  day: DayOfWeek;
  period: number; // 0-indexed or 1-indexed period number
  reason: string; // e.g. 'Upacara', 'Istirahat', 'Ibadah'
  targetClassroomIds?: string[]; // Jika kosong, mengunci untuk semua kelas. Jika terisi, hanya mengunci kelas terpilih.
}

export interface ScheduleRow {
  isSpecial: boolean;
  label?: string;
  periodIndex?: number;
  jpLabel?: string;
  time: string;
}

export interface TimeConfig {
  days: DayOfWeek[];
  periodsPerDay: number; // e.g., 8 or 10 periods (JP)
  lockedSlots: LockedSlot[];
  customSchedules?: Record<string, ScheduleRow[]>;
  splittingRule?: 'ideal' | 'classic';
  ignoreLockedSlots?: boolean;
}

export const DEFAULT_OFFICIAL_SCHEDULE: Record<string, ScheduleRow[]> = {
  'Senin': [
    { isSpecial: true, label: 'PPK & UPACARA', time: '06.50 - 08.10' },
    { isSpecial: false, periodIndex: 0, jpLabel: '1', time: '08.10 - 08.50' },
    { isSpecial: false, periodIndex: 1, jpLabel: '2', time: '08.50 - 09.30' },
    { isSpecial: false, periodIndex: 2, jpLabel: '3', time: '09.30 - 10.10' },
    { isSpecial: true, label: 'ISTIRAHAT', time: '10.10 - 10.40' },
    { isSpecial: false, periodIndex: 3, jpLabel: '4', time: '10.40 - 11.20' },
    { isSpecial: false, periodIndex: 4, jpLabel: '5', time: '11.20 - 12.00' },
    { isSpecial: true, label: 'ISTIRAHAT', time: '12.00 - 12.35' },
    { isSpecial: false, periodIndex: 5, jpLabel: '6', time: '12.35 - 13.15' },
    { isSpecial: false, periodIndex: 6, jpLabel: '7', time: '13.15 - 13.55' },
    { isSpecial: false, periodIndex: 7, jpLabel: '8', time: '13.55 - 14.35' },
    { isSpecial: false, periodIndex: 8, jpLabel: '9', time: '14.35 - 15.15' },
  ],
  'Selasa': [
    { isSpecial: true, label: 'PPK (KEAGAMAAN)', time: '06.50 - 07.30' },
    { isSpecial: false, periodIndex: 0, jpLabel: '1', time: '07.30 - 08.10' },
    { isSpecial: false, periodIndex: 1, jpLabel: '2', time: '08.10 - 08.50' },
    { isSpecial: false, periodIndex: 2, jpLabel: '3', time: '08.50 - 09.30' },
    { isSpecial: false, periodIndex: 3, jpLabel: '4', time: '09.30 - 10.10' },
    { isSpecial: true, label: 'ISTIRAHAT', time: '10.10 - 10.40' },
    { isSpecial: false, periodIndex: 4, jpLabel: '5', time: '10.40 - 11.20' },
    { isSpecial: false, periodIndex: 5, jpLabel: '6', time: '11.20 - 12.00' },
    { isSpecial: true, label: 'ISTIRAHAT', time: '12.00 - 12.35' },
    { isSpecial: false, periodIndex: 6, jpLabel: '7', time: '12.35 - 13.15' },
    { isSpecial: false, periodIndex: 7, jpLabel: '8', time: '13.15 - 13.55' },
    { isSpecial: false, periodIndex: 8, jpLabel: '9', time: '13.55 - 14.35' },
    { isSpecial: false, periodIndex: 9, jpLabel: '10', time: '14.35 - 15.15' },
  ],
  'Rabu': [
    { isSpecial: true, label: 'PPK (KEAGAMAAN)', time: '06.50 - 07.30' },
    { isSpecial: false, periodIndex: 0, jpLabel: '1', time: '07.30 - 08.10' },
    { isSpecial: false, periodIndex: 1, jpLabel: '2', time: '08.10 - 08.50' },
    { isSpecial: false, periodIndex: 2, jpLabel: '3', time: '08.50 - 09.30' },
    { isSpecial: false, periodIndex: 3, jpLabel: '4', time: '09.30 - 10.10' },
    { isSpecial: true, label: 'ISTIRAHAT', time: '10.10 - 10.40' },
    { isSpecial: false, periodIndex: 4, jpLabel: '5', time: '10.40 - 11.20' },
    { isSpecial: false, periodIndex: 5, jpLabel: '6', time: '11.20 - 12.00' },
    { isSpecial: true, label: 'ISTIRAHAT', time: '12.00 - 12.35' },
    { isSpecial: false, periodIndex: 6, jpLabel: '7', time: '12.35 - 13.15' },
    { isSpecial: false, periodIndex: 7, jpLabel: '8', time: '13.15 - 13.55' },
    { isSpecial: false, periodIndex: 8, jpLabel: '9', time: '13.55 - 14.35' },
    { isSpecial: false, periodIndex: 9, jpLabel: '10', time: '14.35 - 15.15' },
  ],
  'Kamis': [
    { isSpecial: true, label: 'PPK / LITERASI', time: '06.50 - 08.20' },
    { isSpecial: false, periodIndex: 0, jpLabel: '1', time: '08.20 - 09.00' },
    { isSpecial: false, periodIndex: 1, jpLabel: '2', time: '09.00 - 09.40' },
    { isSpecial: false, periodIndex: 2, jpLabel: '3', time: '09.40 - 10.20' },
    { isSpecial: true, label: 'ISTIRAHAT', time: '10.20 - 10.40' },
    { isSpecial: false, periodIndex: 3, jpLabel: '4', time: '10.40 - 11.20' },
    { isSpecial: false, periodIndex: 4, jpLabel: '5', time: '11.20 - 12.00' },
    { isSpecial: true, label: 'ISTIRAHAT', time: '12.00 - 12.35' },
    { isSpecial: false, periodIndex: 5, jpLabel: '6', time: '12.35 - 13.15' },
    { isSpecial: false, periodIndex: 6, jpLabel: '7', time: '13.15 - 13.55' },
    { isSpecial: false, periodIndex: 7, jpLabel: '8', time: '13.55 - 14.35' },
    { isSpecial: false, periodIndex: 8, jpLabel: '9', time: '14.35 - 15.15' },
    { isSpecial: true, label: 'EXTRA PRAMUKA', time: '15.15 - 15.55' },
  ],
  'Jumat': [
    { isSpecial: true, label: 'PPK / AMS', time: '06.50 - 07.50' },
    { isSpecial: false, periodIndex: 0, jpLabel: '1', time: '07.50 - 08.25' },
    { isSpecial: false, periodIndex: 1, jpLabel: '2', time: '08.25 - 09.00' },
    { isSpecial: true, label: 'ISTIRAHAT', time: '09.00 - 09.15' },
    { isSpecial: false, periodIndex: 2, jpLabel: '3', time: '09.15 - 09.50' },
    { isSpecial: false, periodIndex: 3, jpLabel: '4', time: '09.50 - 10.25' },
    { isSpecial: false, periodIndex: 4, jpLabel: '5', time: '10.25 - 11.00' },
    { isSpecial: true, label: 'SHALAT JUM\'AT', time: '11.00 - 13.00' },
    { isSpecial: true, label: 'TIM PELATIH EKSTRA', time: '13.00 - 14.10' },
  ],
  'Sabtu': [
    { isSpecial: false, periodIndex: 0, jpLabel: '1', time: '07.30 - 08.10' },
    { isSpecial: false, periodIndex: 1, jpLabel: '2', time: '08.10 - 08.50' },
    { isSpecial: false, periodIndex: 2, jpLabel: '3', time: '08.50 - 09.30' },
    { isSpecial: true, label: 'ISTIRAHAT', time: '09.30 - 10.00' },
    { isSpecial: false, periodIndex: 3, jpLabel: '4', time: '10.00 - 10.40' },
    { isSpecial: false, periodIndex: 4, jpLabel: '5', time: '10.40 - 11.20' },
    { isSpecial: false, periodIndex: 5, jpLabel: '6', time: '11.20 - 12.00' },
  ],
  'Minggu': []
};

export interface Teacher {
  id: string; // auto-generated UUID or timestamp
  name: string;
  nip: string;
  code: string; // Unique teacher code, e.g., 'G01', '02'
  maxJpPerDay: number; // Maximum teaching hours (JP) per day
  unavailableSlots?: { day: DayOfWeek; period: number }[]; // aSc-style teacher time-off constraints
}

export interface Classroom {
  id: string; // auto-generated
  name: string; // e.g., 'VII A', 'IX F'
}

export interface Workload {
  id: string;
  teacherId: string; // references Teacher.id
  classroomId: string; // references Classroom.id
  subject: string; // e.g., 'Matematika', 'IPS'
  weeklyJp: number; // e.g., 4 JP
}

export interface TimetableCell {
  workloadId: string;
  teacherId: string;
  teacherCode: string;
  subject: string;
  classroomId: string;
}

export interface TimetableResult {
  [classroomId: string]: {
    [day: string]: (TimetableCell | null)[]; // index matches period index
  };
}

export interface SolverLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

