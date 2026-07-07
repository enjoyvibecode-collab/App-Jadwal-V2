import React, { useState, useEffect } from 'react';
import { DayOfWeek, TimeConfig, Teacher, Classroom, Workload, TimetableResult, DEFAULT_OFFICIAL_SCHEDULE, ScheduleRow } from './types';
import TimeSettings from './components/TimeSettings';
import TeacherDirectory from './components/TeacherDirectory';
import ClassroomDirectory from './components/ClassroomDirectory';
import WorkloadDirectory from './components/WorkloadDirectory';
import SolverDashboard from './components/SolverDashboard';
import PrintReports from './components/PrintReports';
import { DEMO_TEACHERS, DEMO_CLASSROOMS, DEMO_WORKLOADS } from './utils/demoData';
import * as XLSX from 'xlsx';
import { 
  Calendar, 
  Users, 
  BookOpen, 
  Briefcase, 
  Settings, 
  Download, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Lock, 
  RefreshCw, 
  Database,
  BarChart2,
  Trash2,
  Sparkles,
  Cpu,
  Printer,
  MoreHorizontal,
  Home
} from 'lucide-react';

const DEFAULT_TIME_CONFIG: TimeConfig = {
  days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
  periodsPerDay: 10,
  lockedSlots: [],
  customSchedules: DEFAULT_OFFICIAL_SCHEDULE,
  splittingRule: 'ideal'
};

type TabType = 'overview' | 'time' | 'teachers' | 'classrooms' | 'workloads' | 'solver' | 'print';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Confirmation Modals State
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // School Data States (initialized immediately from localStorage)
  const [timeConfig, setTimeConfig] = useState<TimeConfig>(() => {
    const saved = localStorage.getItem('school_time_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Heal: remove legacy locked slots that block active lesson periods
        if (parsed.lockedSlots && parsed.lockedSlots.length > 0) {
          parsed.lockedSlots = parsed.lockedSlots.filter((slot: any) => {
            const reason = (slot.reason || '').toLowerCase();
            return !reason.includes('istirahat') && !reason.includes('upacara');
          });
        }
        return parsed;
      } catch (e) {
        return DEFAULT_TIME_CONFIG;
      }
    }
    return DEFAULT_TIME_CONFIG;
  });
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('school_teachers');
    return saved ? JSON.parse(saved) : [];
  });
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    const saved = localStorage.getItem('school_classrooms');
    return saved ? JSON.parse(saved) : [];
  });
  const [workloads, setWorkloads] = useState<Workload[]>(() => {
    const saved = localStorage.getItem('school_workloads');
    return saved ? JSON.parse(saved) : [];
  });
  const [timetableResult, setTimetableResult] = useState<TimetableResult | null>(() => {
    const saved = localStorage.getItem('school_timetable_result');
    return saved ? JSON.parse(saved) : null;
  });

  // Notifications/Toasts
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sync to LocalStorage when states change
  useEffect(() => {
    localStorage.setItem('school_time_config', JSON.stringify(timeConfig));
  }, [timeConfig]);

  useEffect(() => {
    localStorage.setItem('school_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('school_classrooms', JSON.stringify(classrooms));
  }, [classrooms]);

  useEffect(() => {
    localStorage.setItem('school_workloads', JSON.stringify(workloads));
  }, [workloads]);

  useEffect(() => {
    if (timetableResult) {
      localStorage.setItem('school_timetable_result', JSON.stringify(timetableResult));
    } else {
      localStorage.removeItem('school_timetable_result');
    }
  }, [timetableResult]);

  // One-time auto-healing for old cached Seni Budaya data (3 JP -> 2 JP)
  useEffect(() => {
    const saved = localStorage.getItem('school_workloads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Workload[];
        const hasSeniBudaya3Jp = parsed.some(w => w.subject === 'Seni Budaya' && w.weeklyJp === 3);
        if (hasSeniBudaya3Jp) {
          const mapped = parsed.map(w => {
            if (w.subject === 'Seni Budaya' && w.weeklyJp === 3) {
              return { ...w, weeklyJp: 2 };
            }
            return w;
          });
          setWorkloads(mapped);
          localStorage.setItem('school_workloads', JSON.stringify(mapped));
          setTimeout(() => {
            showToast('Sistem mendeteksi & memperbaiki otomatis data Seni Budaya (3 JP → 2 JP). Beban mengajar Pa Jono kini 32 JP & Pa Soni 34 JP, siap dijadwalkan!', 'success');
          }, 1000);
        }
      } catch (e) {
        // ignore parsing error
      }
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Helper additions
  const handleAddTeacher = (newTeacher: Omit<Teacher, 'id'>) => {
    const id = 'teacher_' + Date.now();
    setTeachers([...teachers, { ...newTeacher, id }]);
    showToast(`Guru ${newTeacher.name} berhasil ditambahkan!`);
  };

  const handleDeleteTeacher = (id: string) => {
    const teacher = teachers.find(t => t.id === id);
    setTeachers(teachers.filter(t => t.id !== id));
    // Clean up corresponding workloads
    setWorkloads(workloads.filter(w => w.teacherId !== id));
    showToast(`Guru ${teacher ? teacher.name : ''} dan kontrak bebannya berhasil dihapus.`, 'info');
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    setTeachers(teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));
    showToast(`Data atau batasan berhalangan guru ${updatedTeacher.name} berhasil disimpan.`);
  };

  const handleAddClassroom = (newRoom: Omit<Classroom, 'id'>) => {
    const id = 'classroom_' + Date.now();
    setClassrooms([...classrooms, { ...newRoom, id }]);
    showToast(`Kelas ${newRoom.name} berhasil ditambahkan!`);
  };

  const handleDeleteClassroom = (id: string) => {
    const room = classrooms.find(c => c.id === id);
    setClassrooms(classrooms.filter(c => c.id !== id));
    // Clean up corresponding workloads
    setWorkloads(workloads.filter(w => w.classroomId !== id));
    showToast(`Kelas ${room ? room.name : ''} dan kontrak bebannya berhasil dihapus.`, 'info');
  };

  const handleAddWorkload = (newWorkload: Omit<Workload, 'id'>) => {
    const id = 'workload_' + Date.now();
    setWorkloads([...workloads, { ...newWorkload, id }]);
    showToast(`Kontrak belajar berhasil ditambahkan!`);
  };

  const handleDeleteWorkload = (id: string) => {
    setWorkloads(workloads.filter(w => w.id !== id));
    showToast('Kontrak belajar berhasil dihapus.', 'info');
  };

  // Load Demo Data Actions
  const handleLoadDemoData = () => {
    setShowDemoModal(true);
  };

  const executeLoadDemoData = () => {
    // 1. Direct write to localStorage for durability
    localStorage.setItem('school_time_config', JSON.stringify(DEFAULT_TIME_CONFIG));
    localStorage.setItem('school_teachers', JSON.stringify(DEMO_TEACHERS));
    localStorage.setItem('school_classrooms', JSON.stringify(DEMO_CLASSROOMS));
    localStorage.setItem('school_workloads', JSON.stringify(DEMO_WORKLOADS));
    localStorage.removeItem('school_timetable_result');

    // 2. Direct state updates for instant reactive UI refresh
    setTimeConfig(DEFAULT_TIME_CONFIG);
    setTeachers(DEMO_TEACHERS);
    setClassrooms(DEMO_CLASSROOMS);
    setWorkloads(DEMO_WORKLOADS);
    setTimetableResult(null);

    // 3. Simple visual notification indicator
    showToast('Data Simulasi Berhasil Dimuat!', 'success');
  };

  // Reset all data Actions
  const handleResetData = () => {
    setShowResetModal(true);
  };

  const executeResetData = () => {
    const freshTimeConfig: TimeConfig = {
      days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
      periodsPerDay: 8,
      lockedSlots: [],
      splittingRule: 'ideal'
    };

    localStorage.setItem('school_time_config', JSON.stringify(freshTimeConfig));
    localStorage.setItem('school_teachers', JSON.stringify([]));
    localStorage.setItem('school_classrooms', JSON.stringify([]));
    localStorage.setItem('school_workloads', JSON.stringify([]));
    localStorage.removeItem('school_timetable_result');

    setTimeConfig(freshTimeConfig);
    setTeachers([]);
    setClassrooms([]);
    setWorkloads([]);
    setTimetableResult(null);
    showToast('Seluruh data berhasil di-reset.', 'info');
  };

  // Export Excel file (.xlsx) with all master configuration tables
  const handleExportData = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Sheet "Daftar Guru"
      const guruData = teachers.map(t => ({
        'ID Guru': t.id,
        'Nama Guru': t.name,
        'NIP': t.nip || '-',
        'Kode Inisial': t.code,
        'Maksimal JP Per Hari': t.maxJpPerDay
      }));
      const wsGuru = XLSX.utils.json_to_sheet(guruData);
      XLSX.utils.book_append_sheet(wb, wsGuru, 'Daftar Guru');

      // 2. Sheet "Daftar Kelas"
      const kelasData = classrooms.map(c => ({
        'ID Kelas': c.id,
        'Nama Kelas': c.name
      }));
      const wsKelas = XLSX.utils.json_to_sheet(kelasData);
      XLSX.utils.book_append_sheet(wb, wsKelas, 'Daftar Kelas');

      // 3. Sheet "Beban Mengajar"
      const teacherMapId = new Map(teachers.map(t => [t.id, t.name]));
      const classroomMapId = new Map(classrooms.map(c => [c.id, c.name]));
      const bebanData = workloads.map(w => ({
        'ID Kontrak': w.id,
        'Nama Guru': teacherMapId.get(w.teacherId) || w.teacherId,
        'Mata Pelajaran': w.subject,
        'Nama Kelas': classroomMapId.get(w.classroomId) || w.classroomId,
        'Mingguan JP': w.weeklyJp
      }));
      const wsBeban = XLSX.utils.json_to_sheet(bebanData);
      XLSX.utils.book_append_sheet(wb, wsBeban, 'Beban Mengajar');

      // 4. Sheet "Konfigurasi Umum"
      const configUmum = [
        { 'Parameter': 'Hari Aktif (Koma Separator)', 'Nilai': timeConfig.days.join(',') },
        { 'Parameter': 'Jumlah Sesi JP Per Hari', 'Nilai': String(timeConfig.periodsPerDay) },
        { 'Parameter': 'Aturan Pemecahan JP (ideal / classic)', 'Nilai': timeConfig.splittingRule || 'ideal' }
      ];
      const wsConfig = XLSX.utils.json_to_sheet(configUmum);
      XLSX.utils.book_append_sheet(wb, wsConfig, 'Konfigurasi Umum');

      // 5. Sheet "Jadwal Jam Sesi"
      const jadwalData: any[] = [];
      const activeSchedules = timeConfig.customSchedules || DEFAULT_OFFICIAL_SCHEDULE;
      Object.entries(activeSchedules).forEach(([day, rows]) => {
        if (!timeConfig.days.includes(day as DayOfWeek)) return;
        (rows as ScheduleRow[]).forEach(r => {
          jadwalData.push({
            'Hari': day,
            'Tipe Sesi': r.isSpecial ? 'Khusus (Istirahat/Upacara)' : 'Pelajaran (KBM)',
            'Jam Ke (Bila Pelajaran)': r.periodIndex !== undefined ? r.periodIndex + 1 : '',
            'Label Sesi JP': r.jpLabel || '',
            'Durasi Waktu (e.g. 07.30 - 08.10)': r.time || '',
            'Keterangan / Nama Kegiatan': r.label || ''
          });
        });
      });
      const wsJadwal = XLSX.utils.json_to_sheet(jadwalData);
      XLSX.utils.book_append_sheet(wb, wsJadwal, 'Jadwal Jam Sesi');

      // 6. Sheet "Slot Waktu Terkunci"
      const lockData = timeConfig.lockedSlots.map(s => ({
        'Hari': s.day,
        'Jam Ke (1-indexed)': s.period + 1,
        'Alasan Penguncian': s.reason,
        'Berlaku Khusus Kelas (Pisahkan koma, Kosongkan jika semua)': s.targetClassroomIds && s.targetClassroomIds.length > 0
          ? s.targetClassroomIds.map(id => classroomMapId.get(id) || id).join(',')
          : ''
      }));
      const wsLocks = XLSX.utils.json_to_sheet(lockData);
      XLSX.utils.book_append_sheet(wb, wsLocks, 'Slot Waktu Terkunci');

      // Generate binary and trigger download
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      const s2ab = (s: string) => {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
      };

      const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", url);
      downloadAnchor.setAttribute("download", `BackupData_JadwalSmart_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);

      showToast('Data master berhasil diekspor ke Excel (.xlsx)!', 'success');
    } catch (err) {
      console.error(err);
      showToast(`Gagal mengekspor data: ${(err as Error).message}`, 'error');
    }
  };

  // Import Excel (.xlsx / .xls) file
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const fileReader = new FileReader();

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      fileReader.onload = (event) => {
        try {
          const binaryStr = event.target?.result;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          
          // Let's identify if this is a Multi-Sheet Backup exported from our app
          const hasDaftarGuru = workbook.SheetNames.includes('Daftar Guru');
          const hasDaftarKelas = workbook.SheetNames.includes('Daftar Kelas');
          const hasBebanMengajar = workbook.SheetNames.includes('Beban Mengajar');

          if (hasDaftarGuru && hasDaftarKelas && hasBebanMengajar) {
            // --- PARSE APP BACKUP EXCEL ---
            // 1. Teachers
            const wsGuru = workbook.Sheets['Daftar Guru'];
            const teachersRaw = XLSX.utils.sheet_to_json<any>(wsGuru);
            const importedTeachers: Teacher[] = teachersRaw.map((row: any) => ({
              id: String(row['ID Guru'] || row['ID'] || `t_${String(row['Nama Guru']).toLowerCase().replace(/[^a-z0-9]/g, '_')}`).trim(),
              name: String(row['Nama Guru'] || '').trim(),
              nip: String(row['NIP'] || '-').trim(),
              code: String(row['Kode Inisial'] || row['Kode'] || '').trim().toUpperCase(),
              maxJpPerDay: typeof row['Maksimal JP Per Hari'] === 'number' ? row['Maksimal JP Per Hari'] : 10
            })).filter(t => t.name);

            // 2. Classrooms
            const wsKelas = workbook.Sheets['Daftar Kelas'];
            const kelasRaw = XLSX.utils.sheet_to_json<any>(wsKelas);
            const importedClassrooms: Classroom[] = kelasRaw.map((row: any) => ({
              id: String(row['ID Kelas'] || row['ID'] || `c_${String(row['Nama Kelas']).toLowerCase().replace(/[^a-z0-9]/g, '_')}`).trim(),
              name: String(row['Nama Kelas'] || '').trim()
            })).filter(c => c.name);

            const teacherByNameMap = new Map(importedTeachers.map(t => [t.name.toLowerCase().trim(), t]));
            const classroomByNameMap = new Map(importedClassrooms.map(c => [c.name.toLowerCase().trim(), c]));
            const teacherByIdMap = new Map(importedTeachers.map(t => [t.id, t]));
            const classroomByIdMap = new Map(importedClassrooms.map(c => [c.id, c]));

            // 3. Workloads
            const wsBeban = workbook.Sheets['Beban Mengajar'];
            const bebanRaw = XLSX.utils.sheet_to_json<any>(wsBeban);
            const importedWorkloads: Workload[] = [];
            let workloadIdCounter = 1;

            bebanRaw.forEach((row: any) => {
              const id = row['ID Kontrak'] || row['ID'] || `w_imported_${workloadIdCounter++}`;
              const gName = String(row['Nama Guru'] || '').trim();
              const subject = String(row['Mata Pelajaran'] || '').trim();
              const cName = String(row['Nama Kelas'] || '').trim();
              const jp = typeof row['Mingguan JP'] === 'number' ? row['Mingguan JP'] : 4;

              if (!gName || !subject || !cName) return;

              // Resolve teacher
              let teacher = teacherByNameMap.get(gName.toLowerCase()) || teacherByIdMap.get(gName);
              if (!teacher) {
                const newId = 't_' + gName.toLowerCase().replace(/[^a-z0-9]/g, '_');
                teacher = { id: newId, name: gName, nip: '-', code: gName.substring(0,3).toUpperCase(), maxJpPerDay: 10 };
                importedTeachers.push(teacher);
                teacherByNameMap.set(gName.toLowerCase(), teacher);
                teacherByIdMap.set(newId, teacher);
              }

              // Resolve classroom
              let classroom = classroomByNameMap.get(cName.toLowerCase()) || classroomByIdMap.get(cName);
              if (!classroom) {
                const newId = 'c_' + cName.toLowerCase().replace(/[^a-z0-9]/g, '_');
                classroom = { id: newId, name: cName };
                importedClassrooms.push(classroom);
                classroomByNameMap.set(cName.toLowerCase(), classroom);
                classroomByIdMap.set(newId, classroom);
              }

              importedWorkloads.push({
                id: String(id),
                teacherId: teacher.id,
                classroomId: classroom.id,
                subject,
                weeklyJp: jp
              });
            });

            // 4. Parse TimeConfig Days & Rule
            let importedTimeConfig: TimeConfig = {
              days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
              periodsPerDay: 10,
              lockedSlots: [],
              splittingRule: 'ideal'
            };

            const wsConfig = workbook.Sheets['Konfigurasi Umum'];
            if (wsConfig) {
              const configRaw = XLSX.utils.sheet_to_json<any>(wsConfig);
              configRaw.forEach((row: any) => {
                const param = String(row['Parameter'] || '').trim().toLowerCase();
                const val = String(row['Nilai'] || '').trim();
                if (param.includes('hari aktif') && val) {
                  importedTimeConfig.days = val.split(',').map(s => s.trim() as DayOfWeek);
                } else if (param.includes('sesi jp per hari') && val) {
                  const parsed = parseInt(val, 10);
                  if (!isNaN(parsed)) importedTimeConfig.periodsPerDay = parsed;
                } else if (param.includes('pemecahan jp') && val) {
                  importedTimeConfig.splittingRule = val as 'ideal' | 'classic';
                }
              });
            }

            // 5. Parse Custom Schedules
            const wsJadwal = workbook.Sheets['Jadwal Jam Sesi'];
            if (wsJadwal) {
              const jadwalRaw = XLSX.utils.sheet_to_json<any>(wsJadwal);
              const schedulesByDay: Record<string, ScheduleRow[]> = {};
              importedTimeConfig.days.forEach(day => {
                schedulesByDay[day] = [];
              });

              jadwalRaw.forEach((row: any) => {
                const day = String(row['Hari'] || '').trim() as DayOfWeek;
                const tipeSesi = String(row['Tipe Sesi'] || '').toLowerCase();
                const isSpecial = tipeSesi.includes('khusus') || tipeSesi.includes('istirahat') || tipeSesi.includes('upacara');
                const periodIdxRaw = row['Jam Ke (Bila Pelajaran)'];
                const periodIndex = periodIdxRaw !== undefined && periodIdxRaw !== '' ? parseInt(String(periodIdxRaw), 10) - 1 : undefined;
                const jpLabel = String(row['Label Sesi JP'] || '').trim();
                const timeStr = String(row['Durasi Waktu (e.g. 07.30 - 08.10)'] || '').trim();
                const label = String(row['Keterangan / Nama Kegiatan'] || '').trim();

                if (day && importedTimeConfig.days.includes(day)) {
                  if (!schedulesByDay[day]) schedulesByDay[day] = [];
                  schedulesByDay[day].push({
                    isSpecial,
                    label,
                    periodIndex: isSpecial ? undefined : (periodIndex !== undefined ? periodIndex : schedulesByDay[day].filter(r => !r.isSpecial).length),
                    jpLabel: isSpecial ? undefined : jpLabel,
                    time: timeStr
                  });
                }
              });

              // Ensure correct sorting per day based on periodIndex or order
              Object.keys(schedulesByDay).forEach(day => {
                schedulesByDay[day].sort((a,b) => {
                  if (a.periodIndex !== undefined && b.periodIndex !== undefined) {
                    return a.periodIndex - b.periodIndex;
                  }
                  return 0; // maintain raw order
                });
              });

              importedTimeConfig.customSchedules = schedulesByDay as Record<DayOfWeek, ScheduleRow[]>;
            }

            // 6. Parse Locked Slots
            const wsLocks = workbook.Sheets['Slot Waktu Terkunci'];
            if (wsLocks) {
              const locksRaw = XLSX.utils.sheet_to_json<any>(wsLocks);
              importedTimeConfig.lockedSlots = locksRaw.map((row: any) => {
                const day = String(row['Hari'] || '').trim() as DayOfWeek;
                const periodRaw = row['Jam Ke (1-indexed)'];
                const period = periodRaw !== undefined ? parseInt(String(periodRaw), 10) - 1 : 0;
                const reason = String(row['Alasan Penguncian'] || '').trim();
                const targetRaw = String(row['Berlaku Khusus Kelas (Pisahkan koma, Kosongkan jika semua)'] || '').trim();

                let targetClassroomIds: string[] | undefined = undefined;
                if (targetRaw) {
                  targetClassroomIds = targetRaw.split(',').map(name => {
                    const cleanName = name.trim();
                    const matchedClass = classroomByNameMap.get(cleanName.toLowerCase()) || classroomByIdMap.get(cleanName);
                    return matchedClass ? matchedClass.id : cleanName;
                  });
                }

                return {
                  day,
                  period,
                  reason,
                  targetClassroomIds
                };
              }).filter((s: any) => s.day && !isNaN(s.period));
            }

            // Save to state and storage
            localStorage.setItem('school_time_config', JSON.stringify(importedTimeConfig));
            localStorage.setItem('school_teachers', JSON.stringify(importedTeachers));
            localStorage.setItem('school_classrooms', JSON.stringify(importedClassrooms));
            localStorage.setItem('school_workloads', JSON.stringify(importedWorkloads));
            localStorage.removeItem('school_timetable_result');

            setTimeConfig(importedTimeConfig);
            setTeachers(importedTeachers);
            setClassrooms(importedClassrooms);
            setWorkloads(importedWorkloads);
            setTimetableResult(null);

            showToast(`Excel Backup berhasil dimuat! Terdaftar ${importedTeachers.length} Guru, ${importedClassrooms.length} Kelas, dan ${importedWorkloads.length} Beban Mengajar.`, 'success');

          } else {
            // --- FALLBACK TO SIMPLE RAW WORKLOAD DISTRIBUTION SHEET ---
            let targetSheetName = workbook.SheetNames.find(name => 
              name.toLowerCase().includes('distribusi') || 
              name.toLowerCase().includes('mengajar') || 
              name.toLowerCase().includes('workload') ||
              name.toLowerCase().includes('beban')
            );
            
            if (!targetSheetName) {
              targetSheetName = workbook.SheetNames[0];
            }

            const worksheet = workbook.Sheets[targetSheetName];
            if (!worksheet) {
              showToast('Lembar kerja (Sheet) tidak ditemukan di file Excel.', 'error');
              return;
            }

            const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
            if (rawRows.length === 0) {
              showToast('File Excel kosong.', 'error');
              return;
            }

            // Find header row or guess columns
            let headerIdx = -1;
            let teacherColIdx = -1;
            let codeColIdx = -1;
            let subjectColIdx = -1;
            let classroomColIdx = -1;
            let jpColIdx = -1;

            for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
              const row = rawRows[r];
              if (!row || !Array.isArray(row)) continue;
              const cols = row.map(c => String(c || '').toLowerCase().trim());
              const hasTeacher = cols.some(c => c.includes('guru') || c.includes('nama') || c.includes('teacher') || c.includes('pengajar'));
              const hasSubject = cols.some(c => c.includes('pelajaran') || c.includes('mapel') || c.includes('subject') || c.includes('materi'));
              const hasClassroom = cols.some(c => c.includes('kelas') || c.includes('rombel') || c.includes('classroom') || c.includes('class'));

              if (hasTeacher && (hasSubject || hasClassroom)) {
                headerIdx = r;
                teacherColIdx = cols.findIndex(c => c.includes('guru') || c.includes('nama') || c.includes('teacher') || c.includes('pengajar'));
                codeColIdx = cols.findIndex(c => c.includes('kode') || c.includes('inisial') || c.includes('code'));
                subjectColIdx = cols.findIndex(c => c.includes('pelajaran') || c.includes('mapel') || c.includes('subject') || c.includes('materi'));
                classroomColIdx = cols.findIndex(c => c.includes('kelas') || c.includes('rombel') || c.includes('classroom') || c.includes('class'));
                jpColIdx = cols.findIndex(c => c.includes('jp') || c.includes('jam') || c.includes('volume') || c.includes('weekly') || c.includes('durasi'));
                break;
              }
            }

            if (headerIdx === -1) {
              headerIdx = 0;
              teacherColIdx = 0;
              subjectColIdx = 1;
              classroomColIdx = 2;
              jpColIdx = 3;
            }

            const importedTeachers: Teacher[] = [];
            const importedClassrooms: Classroom[] = [];
            const importedWorkloads: Workload[] = [];
            const teacherMap = new Map<string, Teacher>();
            const classroomMap = new Map<string, Classroom>();
            let workloadCounter = 1;

            for (let r = headerIdx + 1; r < rawRows.length; r++) {
              const row = rawRows[r];
              if (!row || !Array.isArray(row) || row.length === 0) continue;

              const teacherNameRaw = String(row[teacherColIdx] || '').trim();
              const subjectNameRaw = String(row[subjectColIdx] || '').trim();
              const classroomNameRaw = String(row[classroomColIdx] || '').trim();
              const jpRaw = row[jpColIdx];

              if (!teacherNameRaw || !subjectNameRaw || !classroomNameRaw || teacherNameRaw.toLowerCase() === 'null') {
                continue;
              }

              if (teacherNameRaw.startsWith('===') || teacherNameRaw.toLowerCase().includes('total') || teacherNameRaw.toLowerCase().includes('rekap')) {
                continue;
              }

              let teacher = teacherMap.get(teacherNameRaw.toLowerCase());
              if (!teacher) {
                const teacherId = 't_' + teacherNameRaw.toLowerCase().replace(/[^a-z0-9]/g, '_');
                let teacherCode = '';
                if (codeColIdx !== -1 && row[codeColIdx]) {
                  teacherCode = String(row[codeColIdx]).trim().toUpperCase();
                } else {
                  const parts = teacherNameRaw.split(/\s+/).filter(Boolean);
                  if (parts.length >= 2) {
                    teacherCode = (parts[0][0] + parts[1][0]).toUpperCase();
                  } else if (parts.length === 1) {
                    teacherCode = parts[0].substring(0, 3).toUpperCase();
                  } else {
                    teacherCode = 'GUR';
                  }
                }

                let uniqueCode = teacherCode;
                let suffixCounter = 1;
                while (importedTeachers.some(t => t.code === uniqueCode)) {
                  uniqueCode = `${teacherCode}${suffixCounter++}`;
                }

                teacher = {
                  id: teacherId,
                  name: teacherNameRaw,
                  nip: '-',
                  code: uniqueCode,
                  maxJpPerDay: 10
                };
                teacherMap.set(teacherNameRaw.toLowerCase(), teacher);
                importedTeachers.push(teacher);
              }

              let classroom = classroomMap.get(classroomNameRaw.toLowerCase());
              if (!classroom) {
                const classroomId = 'c_' + classroomNameRaw.toLowerCase().replace(/[^a-z0-9]/g, '_');
                classroom = {
                  id: classroomId,
                  name: classroomNameRaw
                };
                classroomMap.set(classroomNameRaw.toLowerCase(), classroom);
                importedClassrooms.push(classroom);
              }

              let weeklyJp = 4;
              if (jpRaw !== undefined && jpRaw !== null && jpRaw !== '') {
                const parsedJp = parseInt(String(jpRaw), 10);
                if (!isNaN(parsedJp) && parsedJp > 0) {
                  weeklyJp = parsedJp;
                }
              }

              importedWorkloads.push({
                id: `w_imported_${workloadCounter++}`,
                teacherId: teacher.id,
                classroomId: classroom.id,
                subject: subjectNameRaw,
                weeklyJp: weeklyJp
              });
            }

            if (importedWorkloads.length === 0) {
              showToast('Tidak ada data mengajar yang valid yang berhasil diuraikan dari file Excel.', 'error');
              return;
            }

            localStorage.setItem('school_teachers', JSON.stringify(importedTeachers));
            localStorage.setItem('school_classrooms', JSON.stringify(importedClassrooms));
            localStorage.setItem('school_workloads', JSON.stringify(importedWorkloads));
            localStorage.removeItem('school_timetable_result');

            setTeachers(importedTeachers);
            setClassrooms(importedClassrooms);
            setWorkloads(importedWorkloads);
            setTimetableResult(null);

            showToast(`Excel berhasil di-import! Berhasil memuat ${importedTeachers.length} Guru, ${importedClassrooms.length} Kelas, dan ${importedWorkloads.length} Alokasi Mengajar.`, 'success');
          }
        } catch (err) {
          console.error(err);
          showToast(`Gagal mengurai file Excel: ${(err as Error).message}`, 'error');
        }
      };
      fileReader.readAsBinaryString(file);
    } else {
      showToast('Harap pilih berkas Excel (.xlsx atau .xls).', 'error');
    }
    
    e.target.value = ''; // clear input
  };

  // Calculating overall summary metrics based on actual schedules
  const getDailyKbmCount = (day: DayOfWeek) => {
    const schedule = timeConfig.customSchedules?.[day] || DEFAULT_OFFICIAL_SCHEDULE[day] || [];
    return schedule.filter(r => !r.isSpecial).length;
  };

  const getDailySpecialCount = (day: DayOfWeek) => {
    const schedule = timeConfig.customSchedules?.[day] || DEFAULT_OFFICIAL_SCHEDULE[day] || [];
    return schedule.filter(r => r.isSpecial).length;
  };

  const trueTotalKbmCapacity = timeConfig.days.reduce((sum, d) => sum + getDailyKbmCount(d), 0);
  const totalSpecialActivities = timeConfig.days.reduce((sum, d) => sum + getDailySpecialCount(d), 0);

  const totalPeriodsInWeek = trueTotalKbmCapacity;
  const lockedCount = timeConfig.lockedSlots.length;
  const availablePeriodsPerClass = trueTotalKbmCapacity - lockedCount;
  const totalWorkloadWeeklyJp = workloads.reduce((sum, w) => sum + w.weeklyJp, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-sm flex items-center gap-2 ${
            toast.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : toast.type === 'error' 
                ? 'bg-red-50 border-red-200 text-red-800' 
                : 'bg-indigo-50 border-indigo-100 text-indigo-800'
          }`}>
            <span className="font-bold">✓</span>
            {toast.message}
          </div>
        </div>
      )}

      {/* Main Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 px-4 py-3 sm:px-6 sm:py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="w-full md:w-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 p-2 rounded-xl text-white shadow-lg shadow-emerald-600/15">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Smart Timetable <span className="text-[10px] text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-lg font-bold border border-emerald-100/60 uppercase tracking-wider">PWA</span>
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium hidden sm:block mt-0.5">
                  Penyusunan Jadwal Pelajaran Sekolah Anti-Bentrok
                </p>
              </div>
            </div>
            
            {/* Reset button always accessible on right of logo for ultra-small screens */}
            <button
              onClick={handleResetData}
              title="Reset Semua Data"
              className="p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 rounded-xl transition-all cursor-pointer md:hidden"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Backup Actions and Fast Simulation Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleLoadDemoData}
              className="px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial shadow-xs"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Muat Demo</span>
            </button>

            <button
              onClick={handleExportData}
              title="Ekspor Backup Excel (.xlsx)"
              className="p-2 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Ekspor</span>
            </button>

            <label className="p-2 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Impor</span>
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                onChange={handleImportData} 
                className="hidden" 
              />
            </label>

            <button
              onClick={handleResetData}
              title="Reset Semua Data"
              className="hidden md:flex p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Primary Grid Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 pb-24 lg:pb-6">
        {/* Navigation Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 space-y-4">
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">Navigasi Input</h2>
            
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15 scale-[1.02]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-4.5 h-4.5" />
              Ringkasan Data Master
            </button>

            <button
              onClick={() => setActiveTab('time')}
              className={`w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'time'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15 scale-[1.02]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4.5 h-4.5" />
              Konfigurasi Waktu Sekolah
            </button>

            <button
              onClick={() => setActiveTab('teachers')}
              className={`w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'teachers'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15 scale-[1.02]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className="w-4.5 h-4.5" />
              Manajemen Data Guru
            </button>

            <button
              onClick={() => setActiveTab('classrooms')}
              className={`w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'classrooms'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15 scale-[1.02]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4.5 h-4.5" />
              Manajemen Data Kelas
            </button>

            <button
              onClick={() => setActiveTab('workloads')}
              className={`w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'workloads'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15 scale-[1.02]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4.5 h-4.5" />
              Kontrak Beban Kerja
            </button>

            <div className="border-t border-slate-100 my-3 pt-3 space-y-1">
              <button
                onClick={() => setActiveTab('solver')}
                className={`w-full px-3 py-2.5 rounded-xl text-left text-sm font-bold flex items-center gap-3 transition-all cursor-pointer ${
                  activeTab === 'solver'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/15 scale-[1.02]'
                    : 'text-teal-700 bg-teal-50/50 hover:bg-teal-100/70 hover:text-teal-800'
                }`}
              >
                <Cpu className="w-4.5 h-4.5 animate-pulse" />
                Mesin Generator (AI Solver)
              </button>

              <button
                onClick={() => setActiveTab('print')}
                className={`w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                  activeTab === 'print'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15 scale-[1.02]'
                    : 'text-slate-700 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <Printer className="w-4.5 h-4.5" />
                Format Cetak Laporan
              </button>
            </div>
          </div>

          {/* Checklist box */}
          <div className="bg-slate-900/95 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
            <h3 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Persyaratan Sistem
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-xs">
                {timeConfig.days.length > 0 ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <span className="text-slate-300 leading-normal">
                  Atur hari belajar aktif dan jam per hari ({timeConfig.days.length} hari teratur).
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-xs">
                {teachers.length > 0 ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <span className="text-slate-300 leading-normal">
                  Input data guru beserta kapasitas JP mengajar ({teachers.length} guru).
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-xs">
                {classrooms.length > 0 ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <span className="text-slate-300 leading-normal">
                  Input daftar kelas &amp; rombel ({classrooms.length} kelas).
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-xs">
                {workloads.length > 0 ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <span className="text-slate-300 leading-normal">
                  Tentukan beban mengajar untuk guru ({workloads.length} kontrak).
                </span>
              </li>
            </ul>
          </div>
        </aside>

        {/* Workspace Display Area */}
        <main className="lg:col-span-3 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-slide-up">
              {/* Statistical Summary Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                  <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Total Guru</p>
                    <p className="text-xl font-extrabold text-slate-800 font-mono">{teachers.length}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                  <div className="bg-teal-50 p-3 rounded-xl text-teal-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Total Kelas</p>
                    <p className="text-xl font-extrabold text-slate-800 font-mono">{classrooms.length}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                  <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Slot Terkunci</p>
                    <p className="text-xl font-extrabold text-slate-800 font-mono">
                      {lockedCount} <span className="text-xs font-semibold text-slate-400">JP</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                  <div className="bg-sky-50 p-3 rounded-xl text-sky-600">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Total Beban</p>
                    <p className="text-xl font-extrabold text-slate-800 font-mono">
                      {totalWorkloadWeeklyJp} <span className="text-xs font-semibold text-slate-400">JP</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile Quick Navigation Shortcuts */}
              <div className="grid grid-cols-3 gap-3 lg:hidden">
                <button
                  onClick={() => setActiveTab('time')}
                  className="bg-white p-3.5 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer hover:bg-emerald-50/30 active:scale-95 transition-all shadow-xs"
                >
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <span className="text-[10px] font-bold text-slate-700">Jam Belajar</span>
                </button>
                <button
                  onClick={() => setActiveTab('classrooms')}
                  className="bg-white p-3.5 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer hover:bg-emerald-50/30 active:scale-95 transition-all shadow-xs"
                >
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span className="text-[10px] font-bold text-slate-700">Daftar Kelas</span>
                </button>
                <button
                  onClick={() => setActiveTab('print')}
                  className="bg-white p-3.5 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer hover:bg-emerald-50/30 active:scale-95 transition-all shadow-xs"
                >
                  <Printer className="w-5 h-5 text-emerald-600" />
                  <span className="text-[10px] font-bold text-slate-700">Cetak Laporan</span>
                </button>
              </div>

              {/* In-depth master overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="w-4.5 h-4.5 text-emerald-600" />
                    Pencatatan Jam Sekolah
                  </h4>
                  <div className="text-xs space-y-2.5 text-slate-600">
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span>Hari Aktif:</span>
                      <strong className="text-slate-800">{timeConfig.days.join(', ')}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span>Jam per Hari:</span>
                      <strong className="text-slate-800">{timeConfig.periodsPerDay} Jam Pelajaran (JP)</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span>Total JP Mingguan / Kelas:</span>
                      <strong className="text-slate-800">{totalPeriodsInWeek} JP</strong>
                    </div>
                    <div className="flex justify-between pb-0.5">
                      <span>Kapasitas Efektif KBM:</span>
                      <strong className="text-emerald-600 font-bold">{availablePeriodsPerClass} JP seminggu</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Lock className="w-4.5 h-4.5 text-amber-500" />
                    Slot Terkunci (Global)
                  </h4>
                  {timeConfig.lockedSlots.length === 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Belum ada slot waktu global tambahan yang dikunci secara manual.
                      </p>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                        <span className="font-bold text-slate-700 block mb-1">Informasi Jadwal Khusus:</span>
                        Terdapat <strong className="text-indigo-600">{totalSpecialActivities} kegiatan non-KBM</strong> (seperti Upacara, Istirahat, dan Shalat Jumat) yang terintegrasi secara dinamis dalam alokasi harian dan otomatis dilompati oleh AI Solver.
                      </div>
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-2 pr-1 text-xs">
                      {timeConfig.lockedSlots.map((lock, i) => (
                        <div key={i} className="flex justify-between items-center bg-amber-50/60 border border-amber-100/60 px-3 py-2 rounded-xl text-amber-900 font-mono">
                          <span className="font-medium">{lock.day} (JP {lock.period + 1})</span>
                          <span className="font-bold text-[10px] bg-amber-100/80 px-2.5 py-1 rounded-md">{lock.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Big state overview diagram */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4.5 h-4.5 text-emerald-600" />
                  Alokasi Beban Belajar per Kelas / Rombel
                </h3>
                {classrooms.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Harap input data kelas terlebih dahulu di menu Manajemen Data Kelas.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {classrooms.map(room => {
                      const roomWorkloads = workloads.filter(w => w.classroomId === room.id);
                      const totalAllocatedJp = roomWorkloads.reduce((sum, w) => sum + w.weeklyJp, 0);
                      const percentage = Math.min(100, (totalAllocatedJp / availablePeriodsPerClass) * 100);

                      return (
                        <div key={room.id} className="bg-slate-50/55 border border-slate-100 p-4 rounded-xl space-y-3 hover:border-emerald-100 transition-all">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800 font-mono text-sm">{room.name}</span>
                            <span className="text-xs text-slate-500 font-bold font-mono">
                              {totalAllocatedJp} / {availablePeriodsPerClass} JP
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                percentage > 100 
                                  ? 'bg-rose-500' 
                                  : percentage === 100 
                                    ? 'bg-emerald-500' 
                                    : 'bg-emerald-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          {/* List workloads */}
                          {roomWorkloads.length === 0 ? (
                            <p className="text-[10px] text-slate-400 italic">Belum ada mata pelajaran dimasukkan</p>
                          ) : (
                            <div className="text-[10px] text-slate-500 space-y-1 pt-1 border-t border-slate-100/50">
                              {roomWorkloads.map(wl => {
                                const teacher = teachers.find(t => t.id === wl.teacherId);
                                return (
                                  <div key={wl.id} className="flex justify-between items-center py-0.5">
                                    <span className="truncate pr-1 text-slate-600 font-medium">{wl.subject} ({teacher ? teacher.code : '?'})</span>
                                    <span className="font-bold font-mono text-slate-700 shrink-0">{wl.weeklyJp} JP</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'time' && (
            <TimeSettings 
              config={timeConfig} 
              onChange={setTimeConfig} 
              classrooms={classrooms}
            />
          )}

          {activeTab === 'teachers' && (
            <TeacherDirectory 
              teachers={teachers} 
              timeConfig={timeConfig}
              onAdd={handleAddTeacher} 
              onDelete={handleDeleteTeacher} 
              onUpdate={handleUpdateTeacher}
            />
          )}

          {activeTab === 'classrooms' && (
            <ClassroomDirectory 
              classrooms={classrooms} 
              onAdd={handleAddClassroom} 
              onDelete={handleDeleteClassroom} 
            />
          )}

          {activeTab === 'workloads' && (
            <WorkloadDirectory 
              workloads={workloads}
              teachers={teachers}
              classrooms={classrooms}
              activeSchoolDaysCount={timeConfig.days.length}
              onAdd={handleAddWorkload}
              onDelete={handleDeleteWorkload}
            />
          )}

          {activeTab === 'solver' && (
            <SolverDashboard
              timeConfig={timeConfig}
              teachers={teachers}
              classrooms={classrooms}
              workloads={workloads}
              timetableResult={timetableResult}
              onSaveTimetable={setTimetableResult}
            />
          )}

          {activeTab === 'print' && (
            <PrintReports
              timeConfig={timeConfig}
              teachers={teachers}
              classrooms={classrooms}
              workloads={workloads}
              timetableResult={timetableResult}
            />
          )}
        </main>
      </div>

      {/* Modern Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400">
          <p>© 2026 Smart Timetable Generator. Dikembangkan secara modular.</p>
          <div className="flex gap-4">
            <span>Sesi Lokal Aktif</span>
            <span>•</span>
            <span>Kepatuhan Validasi Kelebihan Beban Guru</span>
          </div>
        </div>
      </footer>

      {/* Demo Confirmation Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-50 p-3 rounded-full text-indigo-600 shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-950">Muat Data Simulasi?</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Tindakan ini akan menimpa seluruh data input aktif Anda dengan data master demo lengkap SMPN 1 Manonjaya (50 Guru, 33 Kelas/Rombel, dan 396 Kontrak Beban Mengajar).
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowDemoModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowDemoModal(false);
                  executeLoadDemoData();
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs shadow-indigo-100 cursor-pointer"
              >
                Ya, Muat Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-rose-50 p-3 rounded-full text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-950 text-rose-600">Reset Semua Data?</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Tindakan ini akan menghapus semua konfigurasi hari aktif, jam sekolah, data master guru, rombel kelas, kontrak beban mengajar, dan draf jadwal secara permanen.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  executeResetData();
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs shadow-rose-100 cursor-pointer"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Navigation (only visible on mobile/tablet) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] px-2 py-1.5 pb-safe flex justify-around items-center">
        <button
          onClick={() => { setActiveTab('overview'); setShowMoreMenu(false); }}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'overview' ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        <button
          onClick={() => { setActiveTab('teachers'); setShowMoreMenu(false); }}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'teachers' ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Guru</span>
        </button>

        <button
          onClick={() => { setActiveTab('workloads'); setShowMoreMenu(false); }}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'workloads' ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Beban</span>
        </button>

        <button
          onClick={() => { setActiveTab('solver'); setShowMoreMenu(false); }}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'solver' ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Cpu className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Mesin AI</span>
        </button>

        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
            showMoreMenu || ['time', 'classrooms', 'print'].includes(activeTab) ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Lainnya</span>
        </button>
      </nav>

      {/* Floating Action Menu for "Lainnya" */}
      {showMoreMenu && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden" onClick={() => setShowMoreMenu(false)}>
          <div 
            className="absolute bottom-16 left-4 right-4 bg-white rounded-2xl p-4 shadow-2xl border border-slate-100 space-y-3 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-1">Manajemen & Fitur</h4>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => { setActiveTab('classrooms'); setShowMoreMenu(false); }}
                className={`w-full p-3 rounded-xl text-left text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                  activeTab === 'classrooms' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4.5 h-4.5 text-emerald-500" />
                Manajemen Kelas / Rombel
              </button>
              
              <button
                onClick={() => { setActiveTab('time'); setShowMoreMenu(false); }}
                className={`w-full p-3 rounded-xl text-left text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                  activeTab === 'time' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-4.5 h-4.5 text-emerald-500" />
                Konfigurasi Waktu Sekolah
              </button>

              <button
                onClick={() => { setActiveTab('print'); setShowMoreMenu(false); }}
                className={`w-full p-3 rounded-xl text-left text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                  activeTab === 'print' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Printer className="w-4.5 h-4.5 text-emerald-500" />
                Format Cetak Laporan
              </button>
            </div>
            <div className="pt-1 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="text-xs font-semibold text-slate-500 px-3 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
