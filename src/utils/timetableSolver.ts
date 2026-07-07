import { DayOfWeek, TimeConfig, Teacher, Classroom, Workload, TimetableResult, TimetableCell, DEFAULT_OFFICIAL_SCHEDULE } from '../types';

interface BlockToSchedule {
  workload: Workload;
  size: number;
}

export function splitWeeklyJpToBlocks(
  weeklyJp: number,
  relax: boolean = false,
  rule: 'ideal' | 'classic' = 'ideal'
): number[] {
  if (weeklyJp <= 0) return [];
  if (relax) {
    // Relaxed mode: just split into single JPs (or 1s and 2s if requested, but all 1s is most relaxed)
    return Array(weeklyJp).fill(1);
  }

  if (rule === 'ideal') {
    // Aturan Pecah JP (Splitting Rules) Ideal yang diusulkan oleh User (Data Engineer)
    if (weeklyJp === 1) return [1];
    if (weeklyJp === 2) return [2];
    if (weeklyJp === 3) return [3];
    if (weeklyJp === 4) return [2, 2];
    if (weeklyJp === 5) return [3, 2];
    if (weeklyJp === 6) return [2, 2, 2];

    const blocks: number[] = [];
    let remaining = weeklyJp;
    while (remaining > 0) {
      if (remaining >= 3) {
        blocks.push(3);
        remaining -= 3;
      } else if (remaining >= 2) {
        blocks.push(2);
        remaining -= 2;
      } else {
        blocks.push(1);
        remaining -= 1;
      }
    }
    return blocks;
  } else {
    // Pola Pecah Klasik (Maksimal 2 JP berturut-turut)
    if (weeklyJp === 1) return [1];
    if (weeklyJp === 2) return [2];
    if (weeklyJp === 3) return [2, 1];
    if (weeklyJp === 4) return [2, 2];
    if (weeklyJp === 5) return [2, 2, 1];
    if (weeklyJp === 6) return [2, 2, 2];

    const blocks: number[] = [];
    let remaining = weeklyJp;
    while (remaining > 0) {
      if (remaining >= 2) {
        blocks.push(2);
        remaining -= 2;
      } else {
        blocks.push(1);
        remaining -= 1;
      }
    }
    return blocks;
  }
}

export function generateTimetable(
  timeConfig: TimeConfig,
  teachers: Teacher[],
  classrooms: Classroom[],
  workloads: Workload[],
  onLog: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void
): { success: boolean; result: TimetableResult | null } {
  const startTime = Date.now();
  onLog('Memulai inisialisasi AI Solver Engine...', 'info');

  const classroomIds = new Set(classrooms.map(c => c.id));
  const teacherIds = new Set(teachers.map(t => t.id));
  const validWorkloads = workloads.filter(w => classroomIds.has(w.classroomId) && teacherIds.has(w.teacherId));

  if (classrooms.length === 0) {
    onLog('Gagal: Tidak ada kelas yang terdaftar.', 'error');
    return { success: false, result: null };
  }
  if (teachers.length === 0) {
    onLog('Gagal: Tidak ada guru yang terdaftar.', 'error');
    return { success: false, result: null };
  }
  if (validWorkloads.length === 0) {
    onLog('Gagal: Tidak ada alokasi beban mengajar (kontrak) yang valid.', 'error');
    return { success: false, result: null };
  }

  // Check total classroom capacity vs workloads
  const activeDaysCount = timeConfig.days.length;
  const periodsPerDay = timeConfig.periodsPerDay;
  const lockedCount = timeConfig.lockedSlots.length;
  // Maximum capacity per classroom
  const maxClassroomCapacity = (activeDaysCount * periodsPerDay) - (lockedCount / classrooms.length); // rough estimation
  
  onLog(`Konfigurasi Waktu: ${activeDaysCount} hari aktif, ${periodsPerDay} JP per hari.`, 'info');
  onLog(`Ditemukan ${teachers.length} guru, ${classrooms.length} kelas, dan ${validWorkloads.length} kontrak kerja valid.`, 'info');

  // Fast lookup for teacher details
  const teacherMap = new Map<string, Teacher>();
  teachers.forEach(t => teacherMap.set(t.id, t));

  // Fast lookup for locked slots
  const globalLockedSet = new Set<string>();
  const classroomLockedSet = new Set<string>(); // key: `${classroomId}-${day}-${period}`

  timeConfig.lockedSlots.forEach(slot => {
    if (slot.targetClassroomIds && slot.targetClassroomIds.length > 0) {
      slot.targetClassroomIds.forEach(cId => {
        classroomLockedSet.add(`${cId}-${slot.day}-${slot.period}`);
      });
    } else {
      globalLockedSet.add(`${slot.day}-${slot.period}`);
    }
  });

  // Automatically lock periods that exceed the day's custom schedule capacity
  timeConfig.days.forEach(day => {
    const customSched = timeConfig.customSchedules?.[day] || DEFAULT_OFFICIAL_SCHEDULE[day] || [];
    const kbmCount = customSched.filter(r => !r.isSpecial).length;
    for (let p = kbmCount; p < periodsPerDay; p++) {
      globalLockedSet.add(`${day}-${p}`);
    }
  });

  // Calculate exact set of active, schedulable periods for pre-checks
  const activeSlots: { day: DayOfWeek; period: number }[] = [];
  timeConfig.days.forEach(day => {
    for (let p = 0; p < periodsPerDay; p++) {
      if (!globalLockedSet.has(`${day}-${p}`)) {
        activeSlots.push({ day, period: p });
      }
    }
  });
  const totalActiveSlotsCount = activeSlots.length;

  onLog(`Dihitung secara presisi: Tersedia ${totalActiveSlotsCount} slot waktu pelajaran aktif utama di luar jam istirahat/kegiatan khusus harian.`, 'info');

  // --- PRE-CHECK 1: CLASSROOM WORKLOAD BOUNDS ---
  for (const classroom of classrooms) {
    let classActiveSlotsCount = 0;
    timeConfig.days.forEach(day => {
      for (let p = 0; p < periodsPerDay; p++) {
        const isGlobalLocked = globalLockedSet.has(`${day}-${p}`);
        const isClassroomLocked = classroomLockedSet.has(`${classroom.id}-${day}-${p}`);
        if (!isGlobalLocked && !isClassroomLocked) {
          classActiveSlotsCount++;
        }
      }
    });

    const roomWorkloads = validWorkloads.filter(w => w.classroomId === classroom.id);
    const totalClassJp = roomWorkloads.reduce((sum, w) => sum + w.weeklyJp, 0);
    if (totalClassJp > classActiveSlotsCount) {
      onLog(`[PRE-CHECK ERROR] Gagal: Kelas ${classroom.name} membutuhkan ${totalClassJp} JP pelajaran, tetapi hanya tersedia ${classActiveSlotsCount} slot waktu aktif seminggu setelah dikurangi slot terkunci untuk kelas ini.`, 'error');
      onLog(`Rekomendasi: Kurangi beban pelajaran di kelas ${classroom.name} agar muat dalam ${classActiveSlotsCount} JP, atau sesuaikan slot istirahat/kegiatan khusus agar tidak terlalu banyak mengunci jam belajar aktif.`, 'warning');
      return { success: false, result: null };
    }
  }

  // --- PRE-CHECK 2: TEACHER WORKLOAD AND AVAILABILITY BOUNDS ---
  for (const teacher of teachers) {
    const isTeamTeacher = ['t_tim_guru_wustha', 't_tim_ekstra', 't_wali_kelas'].includes(teacher.id);
    if (isTeamTeacher) continue;

    const teacherWorkloads = validWorkloads.filter(w => w.teacherId === teacher.id);
    const totalTeacherJp = teacherWorkloads.reduce((sum, w) => sum + w.weeklyJp, 0);

    if (totalTeacherJp === 0) continue;

    // Check weekly capacity based on maxJpPerDay
    const maxPossibleWeeklyJp = teacher.maxJpPerDay * activeDaysCount;
    if (totalTeacherJp > maxPossibleWeeklyJp) {
      onLog(`[PRE-CHECK ERROR] Gagal: Guru ${teacher.name} (${teacher.code}) memiliki total beban mengajar ${totalTeacherJp} JP, tetapi batas mengajar harian guru tersebut diatur maksimal ${teacher.maxJpPerDay} JP/hari (Maksimal ${maxPossibleWeeklyJp} JP dalam ${activeDaysCount} hari aktif).`, 'error');
      onLog(`Rekomendasi: Naikkan "Batas Maksimal Mengajar" per hari untuk guru ${teacher.name} di tab Manajemen Guru, atau kurangi beban mata pelajaran yang diampu oleh beliau.`, 'warning');
      return { success: false, result: null };
    }

    // Check available active slots where the teacher is NOT unavailable
    let teacherAvailableSlotsCount = 0;
    activeSlots.forEach(slot => {
      const isUnavailable = teacher.unavailableSlots?.some(un => un.day === slot.day && un.period === slot.period);
      if (!isUnavailable) {
        teacherAvailableSlotsCount++;
      }
    });

    if (totalTeacherJp > teacherAvailableSlotsCount) {
      onLog(`[PRE-CHECK ERROR] Gagal: Guru ${teacher.name} (${teacher.code}) memiliki total beban mengajar ${totalTeacherJp} JP, tetapi hanya tersedia ${teacherAvailableSlotsCount} slot waktu aktif mengajar bagi beliau setelah dikurangi jadwal berhalangan tetap (unavailable).`, 'error');
      onLog(`Rekomendasi: Hapus beberapa slot berhalangan (unavailable) untuk ${teacher.name} di tab Manajemen Guru, atau kurangi jam mengajarnya.`, 'warning');
      return { success: false, result: null };
    }
  }

  onLog('Semua Pre-Check awal lolos! Tidak ditemukan kontradiksi beban yang mustahil secara matematis.', 'success');

  // Define Multi-level Progressive Solver configuration
  interface SolverConfig {
    name: string;
    relaxBlocks: boolean;              // Split into 1 JP blocks
    relaxSubjectSameDay: boolean;      // Allow same subject on the same day
    maxJpPerDayOffset: number;         // Add to teacher's maxJpPerDay
    relaxUnavailableSlots: boolean;    // Allow scheduling on teacher's unavailable slots if needed
  }

  const levels: SolverConfig[] = [
    {
      name: 'Optimal (Blok 2 JP Berpasangan, Batasan Ketat)',
      relaxBlocks: false,
      relaxSubjectSameDay: false,
      maxJpPerDayOffset: 0,
      relaxUnavailableSlots: false
    },
    {
      name: 'Semi-Rileks (Satu JP Terpisah, Batasan Ketat)',
      relaxBlocks: true,
      relaxSubjectSameDay: false,
      maxJpPerDayOffset: 0,
      relaxUnavailableSlots: false
    },
    {
      name: 'Rileks (Satu JP Terpisah, Subjek Boleh Berulang di Hari Sama)',
      relaxBlocks: true,
      relaxSubjectSameDay: true,
      maxJpPerDayOffset: 0,
      relaxUnavailableSlots: false
    },
    {
      name: 'Sangat Rileks (Batas Mengajar Harian Guru Dilonggarkan +2)',
      relaxBlocks: true,
      relaxSubjectSameDay: true,
      maxJpPerDayOffset: 2,
      relaxUnavailableSlots: false
    },
    {
      name: 'Super Rileks (Tanpa Batasan Maksimal Jam Mengajar Guru Harian)',
      relaxBlocks: true,
      relaxSubjectSameDay: true,
      maxJpPerDayOffset: 99,
      relaxUnavailableSlots: false
    },
    {
      name: 'Ultra Rileks (Mengabaikan Jadwal Berhalangan/Unavailable Guru)',
      relaxBlocks: true,
      relaxSubjectSameDay: true,
      maxJpPerDayOffset: 99,
      relaxUnavailableSlots: true
    }
  ];

  // Solve function using specific SolverConfig
  const runSolver = (config: SolverConfig): { success: boolean; result: TimetableResult | null } => {
    // Helper to find the first non-special (KBM) period of a day
    const getFirstKbmPeriodIndex = (day: DayOfWeek): number => {
      const sched = timeConfig.customSchedules?.[day] || DEFAULT_OFFICIAL_SCHEDULE[day] || [];
      const firstKbm = sched.find(r => !r.isSpecial);
      if (firstKbm && firstKbm.periodIndex !== undefined) {
        return firstKbm.periodIndex;
      }
      return 0; // fallback
    };

    // Helper to find the first non-special (KBM) period right after the second Istirahat of a day
    const getPeriodIndexAfterSecondRecess = (day: DayOfWeek): number => {
      const sched = timeConfig.customSchedules?.[day] || DEFAULT_OFFICIAL_SCHEDULE[day] || [];
      const recessIndices = sched
        .map((r, idx) => (r.isSpecial && r.label?.toUpperCase().includes('ISTIRAHAT')) ? idx : -1)
        .filter(idx => idx !== -1);
      
      // We want the SECOND recess index
      const secondRecessIndex = recessIndices[1] !== undefined ? recessIndices[1] : recessIndices[0];
      
      if (secondRecessIndex !== undefined && secondRecessIndex !== -1) {
        const nextKbm = sched.slice(secondRecessIndex + 1).find(r => !r.isSpecial);
        if (nextKbm && nextKbm.periodIndex !== undefined) {
          return nextKbm.periodIndex;
        }
      }
      return day === 'Senin' ? 5 : 6; // fallbacks
    };

    // Create list of blocks to schedule
    const blocks: BlockToSchedule[] = [];
    const rule = timeConfig.splittingRule || 'ideal';
    for (const wl of validWorkloads) {
      const splitSizes = splitWeeklyJpToBlocks(wl.weeklyJp, config.relaxBlocks, rule);
      for (const size of splitSizes) {
        blocks.push({ workload: wl, size });
      }
    }

    const teacherWeeklyJpMap = new Map<string, number>();
    validWorkloads.forEach(wl => {
      teacherWeeklyJpMap.set(wl.teacherId, (teacherWeeklyJpMap.get(wl.teacherId) || 0) + wl.weeklyJp);
    });

    onLog(`Memecah beban mengajar menjadi ${blocks.length} kartu jadwal dengan pola "${rule === 'ideal' ? 'Pecah Ideal (3+3, 3+2)' : 'Klasik (Maksimal 2 JP)'}" untuk level "${config.name}".`, 'info');

    // Preprocess teacher unavailable slots for O(1) checks
    const teacherUnavailableSet = new Set<string>();
    teachers.forEach(t => {
      if (t.unavailableSlots) {
        t.unavailableSlots.forEach(slot => {
          teacherUnavailableSet.add(`${t.id}-${slot.day}-${slot.period}`);
        });
      }
    });

    // 1. Define candidate slots by block size
    const candidateSlotsByBlockSize: { [size: number]: { day: DayOfWeek; period: number }[] } = {};
    [1, 2, 3].forEach(size => {
      const slots: { day: DayOfWeek; period: number }[] = [];
      timeConfig.days.forEach(day => {
        for (let p = 0; p <= periodsPerDay - size; p++) {
          slots.push({ day, period: p });
        }
      });
      candidateSlotsByBlockSize[size] = slots;
    });

    // Shuffle helper (Knuth-Fisher-Yates)
    const shuffle = <T>(array: T[]): T[] => {
      const copy = [...array];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
      }
      return copy;
    };

    // Initialize timetables & containers outside the restarts loop
    const result: TimetableResult = {};
    classrooms.forEach(c => {
      result[c.id] = {};
      timeConfig.days.forEach(day => {
        result[c.id][day] = Array(periodsPerDay).fill(null);
      });
    });

    const allTeacherIds = new Set(teachers.map(t => t.id));
    validWorkloads.forEach(wl => {
      if (wl.teacherId) {
        allTeacherIds.add(wl.teacherId);
      }
    });

    const teacherSchedule: { [teacherId: string]: { [day: string]: boolean[] } } = {};
    allTeacherIds.forEach(tId => {
      teacherSchedule[tId] = {};
      timeConfig.days.forEach(day => {
        teacherSchedule[tId][day] = Array(periodsPerDay).fill(false);
      });
    });

    const teacherDailyCounts: { [teacherId: string]: { [day: string]: number } } = {};
    allTeacherIds.forEach(tId => {
      teacherDailyCounts[tId] = {};
      timeConfig.days.forEach(day => {
        teacherDailyCounts[tId][day] = 0;
      });
    });

    const classroomSubjectDailyJp: { [classroomId: string]: { [day: string]: { [subject: string]: number } } } = {};
    classrooms.forEach(c => {
      classroomSubjectDailyJp[c.id] = {};
      timeConfig.days.forEach(day => {
        classroomSubjectDailyJp[c.id][day] = {};
      });
    });

    // Helper to check if a block can be scheduled
    const canPlaceBlock = (
      block: BlockToSchedule,
      day: DayOfWeek,
      startPeriod: number
    ): boolean => {
      const wl = block.workload;
      const t = teacherMap.get(wl.teacherId);
      if (!t) return false;

      // 1. Check end bounds
      if (startPeriod + block.size > periodsPerDay) return false;

      const isTeamTeacher = ['t_tim_guru_wustha', 't_tim_ekstra', 't_wali_kelas'].includes(wl.teacherId) || wl.subject === 'Wustho';

      // 2. Check teacher daily JP limit (with offset relaxation)
      if (!isTeamTeacher) {
        const allowedMax = config.maxJpPerDayOffset >= 99 ? periodsPerDay : t.maxJpPerDay + config.maxJpPerDayOffset;
        if (teacherDailyCounts[wl.teacherId][day] + block.size > allowedMax) return false;
      }

      // Check each slot in the span
      for (let p = startPeriod; p < startPeriod + block.size; p++) {
        const slotKey = `${day}-${p}`;
        
        // 3. Check locked slots
        if (globalLockedSet.has(slotKey)) return false;
        if (classroomLockedSet.has(`${wl.classroomId}-${day}-${p}`)) return false;

        // 3.5 Check teacher's own unavailable / restricted slots (unless relaxed)
        if (!config.relaxUnavailableSlots) {
          if (teacherUnavailableSet.has(`${wl.teacherId}-${day}-${p}`)) return false;
        }

        // 4. Check classroom conflict
        if (result[wl.classroomId][day][p] !== null) return false;

        // 5. Check teacher conflict
        if (!isTeamTeacher && teacherSchedule[wl.teacherId][day][p]) return false;
      }

      // 6. Max 3 JP per subject per class per day constraint
      const currentDailyJp = classroomSubjectDailyJp[wl.classroomId][day][wl.subject] || 0;
      if (currentDailyJp + block.size > 3) return false;

      // Check soft constraint: avoid scheduling the same subject multiple times on the same day if possible
      if (!config.relaxSubjectSameDay) {
        if (currentDailyJp > 0) return false;
      }

      return true;
    };

    // Place block on timetable
    const placeBlock = (
      block: BlockToSchedule,
      day: DayOfWeek,
      startPeriod: number
    ) => {
      const wl = block.workload;
      const t = teacherMap.get(wl.teacherId);
      const cell: TimetableCell = {
        workloadId: wl.id,
        teacherId: wl.teacherId,
        teacherCode: t ? t.code : '?',
        subject: wl.subject,
        classroomId: wl.classroomId
      };

      for (let p = startPeriod; p < startPeriod + block.size; p++) {
        result[wl.classroomId][day][p] = cell;
        teacherSchedule[wl.teacherId][day][p] = true;
      }
      teacherDailyCounts[wl.teacherId][day] += block.size;
      classroomSubjectDailyJp[wl.classroomId][day][wl.subject] = (classroomSubjectDailyJp[wl.classroomId][day][wl.subject] || 0) + block.size;
    };

    // Remove block from timetable
    const removeBlock = (
      block: BlockToSchedule,
      day: DayOfWeek,
      startPeriod: number
    ) => {
      const wl = block.workload;
      for (let p = startPeriod; p < startPeriod + block.size; p++) {
        result[wl.classroomId][day][p] = null;
        teacherSchedule[wl.teacherId][day][p] = false;
      }
      teacherDailyCounts[wl.teacherId][day] -= block.size;
      classroomSubjectDailyJp[wl.classroomId][day][wl.subject] = (classroomSubjectDailyJp[wl.classroomId][day][wl.subject] || 0) - block.size;
    };

    const maxRestarts = 40;
    const maxStepsPerRestart = 15000;
    let totalSteps = 0;
    let finalSuccess = false;
    let bestScheduledCount = -1;
    let bestResultCopy: TimetableResult | null = null;

    // Outer randomized restart loop
    for (let restart = 1; restart <= maxRestarts; restart++) {
      // 1. Reset state
      classrooms.forEach(c => {
        timeConfig.days.forEach(day => {
          result[c.id][day].fill(null);
        });
      });
      allTeacherIds.forEach(tId => {
        timeConfig.days.forEach(day => {
          teacherSchedule[tId][day].fill(false);
          teacherDailyCounts[tId][day] = 0;
        });
      });
      classrooms.forEach(c => {
        timeConfig.days.forEach(day => {
          classroomSubjectDailyJp[c.id][day] = {};
        });
      });

      // 2. Pre-assign Kewalikelasan and Wustho
      let preassignedWkCount = 0;
      let preassignedWusthoCount = 0;
      const finalBlocksToSchedule: BlockToSchedule[] = [];

      blocks.forEach(block => {
        const wl = block.workload;
        const subject = wl.subject;
        let preassigned = false;

        if (subject === 'Kewalikelasan') {
          const day = 'Senin';
          const p = getFirstKbmPeriodIndex(day);
          
          if (timeConfig.days.includes(day) && p < periodsPerDay) {
            result[wl.classroomId][day][p] = {
              workloadId: wl.id,
              teacherId: wl.teacherId,
              teacherCode: teacherMap.get(wl.teacherId)?.code || 'WK',
              subject: wl.subject,
              classroomId: wl.classroomId
            };
            teacherSchedule[wl.teacherId][day][p] = true;
            teacherDailyCounts[wl.teacherId][day] += block.size;
            classroomSubjectDailyJp[wl.classroomId][day][wl.subject] = (classroomSubjectDailyJp[wl.classroomId][day][wl.subject] || 0) + block.size;
            preassigned = true;
            preassignedWkCount++;
          }
        } else if (subject === 'Wustho') {
          const className = classrooms.find(c => c.id === wl.classroomId)?.name || '';
          const grade = className.trim().charAt(0);
          let targetDay: DayOfWeek | null = null;
          if (grade === '7') targetDay = 'Senin';
          else if (grade === '8') targetDay = 'Selasa';
          else if (grade === '9') targetDay = 'Rabu';

          if (targetDay) {
            const p = getPeriodIndexAfterSecondRecess(targetDay);
            if (timeConfig.days.includes(targetDay) && p < periodsPerDay) {
              result[wl.classroomId][targetDay][p] = {
                workloadId: wl.id,
                teacherId: wl.teacherId,
                teacherCode: teacherMap.get(wl.teacherId)?.code || 'TGW',
                subject: wl.subject,
                classroomId: wl.classroomId
              };
              teacherSchedule[wl.teacherId][targetDay][p] = true;
              teacherDailyCounts[wl.teacherId][targetDay] += block.size;
              classroomSubjectDailyJp[wl.classroomId][targetDay][wl.subject] = (classroomSubjectDailyJp[wl.classroomId][targetDay][wl.subject] || 0) + block.size;
              preassigned = true;
              preassignedWusthoCount++;
            }
          }
        }

        if (!preassigned) {
          finalBlocksToSchedule.push(block);
        }
      });

      // 3. Shuffle blocks of the same size to diversify search paths
      const sizeGroups: { [size: number]: BlockToSchedule[] } = {};
      finalBlocksToSchedule.forEach(b => {
        if (!sizeGroups[b.size]) sizeGroups[b.size] = [];
        sizeGroups[b.size].push(b);
      });
      const sortedSizes = Object.keys(sizeGroups).map(Number).sort((x, y) => y - x);
      const randomizedBlocks = sortedSizes.reduce<BlockToSchedule[]>((acc, size) => {
        return acc.concat(shuffle(sizeGroups[size]));
      }, []);

      let steps = 0;

      // The main recursive backtracking search
      const backtrack = (blockIndex: number): boolean => {
        steps++;
        totalSteps++;
        if (steps > maxStepsPerRestart) {
          return false; // force restart
        }

        if (blockIndex > bestScheduledCount) {
          bestScheduledCount = blockIndex;
          bestResultCopy = JSON.parse(JSON.stringify(result));
        }

        if (blockIndex === randomizedBlocks.length) {
          return true; // Scheduled everything successfully!
        }

        const block = randomizedBlocks[blockIndex];

        // Search candidate slots in randomized cyclic order
        const slots = candidateSlotsByBlockSize[block.size];
        if (!slots || slots.length === 0) return false;
        
        const len = slots.length;
        const startIndex = Math.floor(Math.random() * len);

        for (let i = 0; i < len; i++) {
          const slot = slots[(startIndex + i) % len];
          if (canPlaceBlock(block, slot.day, slot.period)) {
            placeBlock(block, slot.day, slot.period);

            if (backtrack(blockIndex + 1)) {
              return true;
            }

            removeBlock(block, slot.day, slot.period);
          }
        }

        return false; // Dead end
      };

      if (backtrack(0)) {
        onLog(`[AI Solver] SUKSES pada Percobaan Ke-${restart} setelah ${steps} iterasi (Total akumulasi langkah: ${totalSteps}).`, 'success');
        finalSuccess = true;
        break;
      } else {
        if (totalSteps > 500000) {
          onLog(`[AI Solver] Membatasi pencarian akumulasi untuk level ini agar tidak mengunci tab peramban. Mencoba tahap berikutnya...`, 'warning');
          break;
        }
      }
    }

    if (finalSuccess) {
      return { success: true, result };
    }
    return { success: false, result: bestResultCopy };
  };

  // Run the progressive multi-level solver
  let finalResult: { success: boolean; result: TimetableResult | null } = { success: false, result: null };
  let solvedLevelName = '';

  for (let i = 0; i < levels.length; i++) {
    const config = levels[i];
    onLog(`[Mulai Tahap ${i + 1}] Menjalankan solver dengan parameter: ${config.name}...`, 'info');
    finalResult = runSolver(config);
    if (finalResult.success) {
      solvedLevelName = config.name;
      break;
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  if (finalResult.success) {
    onLog(`Selamat! Penjadwalan berhasil diselesaikan dalam ${duration} detik menggunakan level "${solvedLevelName}".`, 'success');
    return { success: true, result: finalResult.result };
  } else {
    onLog(`AI Solver menyerah setelah mencari di seluruh kemungkinan kombinasi tingkat lanjut selama ${duration} detik.`, 'error');
    onLog('Rekomendasi pemecahan masalah tambahan:', 'warning');
    onLog('1. Pastikan Anda tidak memiliki terlalu banyak slot KBM yang terkunci.', 'info');
    onLog('2. Kurangi beban pelajaran mingguan pada kelas-kelas yang terlalu padat.', 'info');
    onLog('3. Tingkatkan batas maksimal mengajar harian guru di Manajemen Guru.', 'info');
    return { success: false, result: finalResult.result };
  }
}
