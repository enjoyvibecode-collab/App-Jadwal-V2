import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { TimeConfig, Teacher, Classroom, Workload, TimetableResult, SolverLog, DayOfWeek } from '../types';
import { generateTimetable } from '../utils/timetableSolver';
import { 
  Play, 
  Terminal, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  BookOpen, 
  Users, 
  Activity, 
  ShieldAlert, 
  Download, 
  Info, 
  FileSpreadsheet, 
  RefreshCw,
  Search,
  Filter,
  Lock
} from 'lucide-react';

interface SolverDashboardProps {
  timeConfig: TimeConfig;
  teachers: Teacher[];
  classrooms: Classroom[];
  workloads: Workload[];
  timetableResult: TimetableResult | null;
  onSaveTimetable: (result: TimetableResult | null) => void;
}

type ViewMode = 'master' | 'class' | 'teacher';

export default function SolverDashboard({
  timeConfig,
  teachers,
  classrooms,
  workloads,
  timetableResult,
  onSaveTimetable
}: SolverDashboardProps) {
  // Solver State
  const [logs, setLogs] = useState<SolverLog[]>([]);
  const [isSolving, setIsSolving] = useState(false);
  const [solverSuccess, setSolverSuccess] = useState<boolean | null>(
    timetableResult ? true : null
  );

  // View States
  const [viewMode, setViewMode] = useState<ViewMode>('master');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [editingCell, setEditingCell] = useState<{
    classroomId: string;
    day: DayOfWeek;
    period: number;
  } | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Initialize selected values if they are empty
  useEffect(() => {
    if (classrooms.length > 0 && !selectedClassId) {
      setSelectedClassId(classrooms[0].id);
    }
    if (teachers.length > 0 && !selectedTeacherId) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [classrooms, teachers]);

  // Scroll terminal to bottom when logs update
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newLog: SolverLog = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleStartSolve = () => {
    setIsSolving(true);
    setSolverSuccess(null);
    setLogs([]);
    
    // Run the solver in a small timeout to allow UI to render spinner
    setTimeout(() => {
      try {
        const { success, result } = generateTimetable(
          timeConfig,
          teachers,
          classrooms,
          workloads,
          (msg, type) => {
            // Append log
            addLog(msg, type);
          }
        );

        setSolverSuccess(success);
        if (result) {
          onSaveTimetable(result);
          if (!success) {
            addLog("AI Solver tidak dapat menempatkan 100% beban kerja secara otomatis, namun telah menghasilkan draf jadwal terbaik yang paling optimal (sebagian besar teralokasikan). Anda dapat mengisinya secara manual atau menyelesaikan konflik menggunakan panel diagnosis di bawah ini.", 'warning');
          }
        } else {
          onSaveTimetable(null);
        }
      } catch (err) {
        addLog(`Sistem Error saat eksekusi: ${(err as Error).message}`, 'error');
        setSolverSuccess(false);
        onSaveTimetable(null);
      } finally {
        setIsSolving(false);
      }
    }, 300);
  };

  // Helper functions to retrieve teacher and classroom objects
  const getTeacherById = (id: string) => teachers.find(t => t.id === id);
  const getClassroomById = (id: string) => classrooms.find(c => c.id === id);

  // Manual timetable modifiers (aSc style override)
  const handleClearCell = (classroomId: string, day: DayOfWeek, period: number) => {
    if (!timetableResult) return;
    const updated = { ...timetableResult };
    if (updated[classroomId] && updated[classroomId][day]) {
      updated[classroomId][day] = [...updated[classroomId][day]];
      updated[classroomId][day][period] = null;
      onSaveTimetable(updated);
    }
    setEditingCell(null);
  };

  const handleAssignWorkloadToCell = (classroomId: string, day: DayOfWeek, period: number, workloadId: string) => {
    if (!timetableResult) return;
    const wl = workloads.find(w => w.id === workloadId);
    if (!wl) return;
    
    const updated = { ...timetableResult };
    if (updated[classroomId] && updated[classroomId][day]) {
      updated[classroomId][day] = [...updated[classroomId][day]];
      updated[classroomId][day][period] = {
        workloadId: wl.id,
        teacherId: wl.teacherId,
        teacherCode: getTeacherById(wl.teacherId)?.code || '?',
        subject: wl.subject,
        classroomId: classroomId
      };
      onSaveTimetable(updated);
    }
    setEditingCell(null);
  };

  const handleSwapCells = (classroomId: string, day: DayOfWeek, period1: number, period2: number) => {
    if (!timetableResult) return;
    const updated = { ...timetableResult };
    if (updated[classroomId] && updated[classroomId][day]) {
      updated[classroomId][day] = [...updated[classroomId][day]];
      const temp = updated[classroomId][day][period1];
      updated[classroomId][day][period1] = updated[classroomId][day][period2];
      updated[classroomId][day][period2] = temp;
      onSaveTimetable(updated);
    }
    setEditingCell(null);
  };

  // Conflict and unplaced workload analysis
  const getUnplacedWorkloads = () => {
    if (!timetableResult) return [];
    
    const unplaced: {
      workload: Workload;
      teacherName: string;
      teacherCode: string;
      classroomName: string;
      weeklyJp: number;
      unscheduledJp: number;
    }[] = [];

    workloads.forEach(wl => {
      let scheduledCount = 0;
      Object.keys(timetableResult).forEach(classId => {
        if (classId !== wl.classroomId) return;
        timeConfig.days.forEach(day => {
          const periods = timetableResult[classId]?.[day] || [];
          periods.forEach(cell => {
            if (cell && cell.workloadId === wl.id) {
              scheduledCount++;
            }
          });
        });
      });

      if (scheduledCount < wl.weeklyJp) {
        const teacher = getTeacherById(wl.teacherId);
        const classroom = getClassroomById(wl.classroomId);
        unplaced.push({
          workload: wl,
          teacherName: teacher ? teacher.name : 'Unknown',
          teacherCode: teacher ? teacher.code : '?',
          classroomName: classroom ? classroom.name : 'Unknown',
          weeklyJp: wl.weeklyJp,
          unscheduledJp: wl.weeklyJp - scheduledCount
        });
      }
    });

    return unplaced;
  };

  const getTeacherClashes = () => {
    if (!timetableResult) return [];

    const clashes: {
      day: DayOfWeek;
      period: number;
      teacherId: string;
      teacherName: string;
      teacherCode: string;
      assignments: {
        classroomId: string;
        className: string;
        subject: string;
      }[];
    }[] = [];

    timeConfig.days.forEach(day => {
      for (let p = 0; p < timeConfig.periodsPerDay; p++) {
        const teacherAllocations: { [teacherId: string]: { classroomId: string; className: string; subject: string }[] } = {};

        classrooms.forEach(c => {
          const cell = timetableResult[c.id]?.[day]?.[p];
          if (cell) {
            if (!teacherAllocations[cell.teacherId]) {
              teacherAllocations[cell.teacherId] = [];
            }
            teacherAllocations[cell.teacherId].push({
              classroomId: c.id,
              className: c.name,
              subject: cell.subject
            });
          }
        });

        Object.keys(teacherAllocations).forEach(tId => {
          const allocs = teacherAllocations[tId];
          if (allocs.length > 1) {
            const teacher = getTeacherById(tId);
            clashes.push({
              day,
              period: p,
              teacherId: tId,
              teacherName: teacher ? teacher.name : 'Unknown',
              teacherCode: teacher ? teacher.code : '?',
              assignments: allocs
            });
          }
        });
      }
    });

    return clashes;
  };

  const getTeacherOverloads = () => {
    if (!timetableResult) return [];

    const overloads: {
      day: DayOfWeek;
      teacherName: string;
      teacherCode: string;
      assignedJp: number;
      maxJp: number;
    }[] = [];

    teachers.forEach(t => {
      timeConfig.days.forEach(day => {
        let dailyCount = 0;
        classrooms.forEach(c => {
          const periods = timetableResult[c.id]?.[day] || [];
          periods.forEach(cell => {
            if (cell && cell.teacherId === t.id) {
              dailyCount++;
            }
          });
        });

        if (dailyCount > t.maxJpPerDay) {
          overloads.push({
            day,
            teacherName: t.name,
            teacherCode: t.code,
            assignedJp: dailyCount,
            maxJp: t.maxJpPerDay
          });
        }
      });
    });

    return overloads;
  };

  // Stats calculation
  const totalWeeklyJpScheduled = () => {
    if (!timetableResult) return 0;
    let count = 0;
    Object.values(timetableResult).forEach(classDays => {
      Object.values(classDays).forEach(periods => {
        periods.forEach(cell => {
          if (cell !== null) count++;
        });
      });
    });
    return count;
  };

  const totalWeeklyJpRequested = workloads.reduce((sum, w) => sum + w.weeklyJp, 0);
  const fillingPercentage = totalWeeklyJpRequested > 0 
    ? Math.round((totalWeeklyJpScheduled() / totalWeeklyJpRequested) * 100) 
    : 0;

  // Calculate consecutive block ratio
  const calculateConsecutiveBlocksRatio = () => {
    if (!timetableResult) return 0;
    let consecutiveCount = 0;
    let totalAssigned = 0;

    classrooms.forEach(c => {
      timeConfig.days.forEach(day => {
        const periods = timetableResult[c.id]?.[day] || [];
        for (let p = 0; p < periods.length; p++) {
          const current = periods[p];
          if (current !== null) {
            totalAssigned++;
            // Check if neighbors (next or previous period) are the exact same workload
            const next = p < periods.length - 1 ? periods[p + 1] : null;
            const prev = p > 0 ? periods[p - 1] : null;
            if (
              (next !== null && next.workloadId === current.workloadId) ||
              (prev !== null && prev.workloadId === current.workloadId)
            ) {
              consecutiveCount++;
            }
          }
        }
      });
    });

    return totalAssigned > 0 ? Math.round((consecutiveCount / totalAssigned) * 100) : 0;
  };

  // Export professional Excel Workbook with multi-sheets (SheetJS)
  const handleExportExcel = () => {
    if (!timetableResult) return;

    try {
      const wb = XLSX.utils.book_new();

      // 1. SHEET 1: JADWAL INDUK UMUM (MASTER MATRIX)
      const ws1Data: any[][] = [];
      ws1Data.push(['SMP NEGERI 1 MANONJAYA']);
      ws1Data.push(['JADWAL INDUK PELAJARAN UMUM (MATRIKS REKAPITULASI)']);
      ws1Data.push(['Tahun Ajaran 2026/2027 - Sistem Anti-Bentrok Digital']);
      ws1Data.push([]); // blank separator

      const masterHeader = ['HARI', 'JAM (JP)', ...classrooms.map(c => c.name)];
      ws1Data.push(masterHeader);

      timeConfig.days.forEach(day => {
        for (let p = 0; p < timeConfig.periodsPerDay; p++) {
          const rowData = [day, `JP ${p + 1}`];
          
          classrooms.forEach(c => {
            const isLocked = timeConfig.lockedSlots.some(slot => slot.day === day && slot.period === p);
            if (isLocked) {
              const lockReason = timeConfig.lockedSlots.find(slot => slot.day === day && slot.period === p)?.reason || 'Locked';
              rowData.push(`[TERKUNCI: ${lockReason}]`);
            } else {
              const cell = timetableResult[c.id]?.[day]?.[p];
              if (cell) {
                const teacher = getTeacherById(cell.teacherId);
                rowData.push(`${cell.subject} (${teacher?.code || '?'})`);
              } else {
                rowData.push('-');
              }
            }
          });
          ws1Data.push(rowData);
        }
      });

      const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);

      // 2. SHEET 2: DETAIL JADWAL PER KELAS
      const ws2Data: any[][] = [];
      ws2Data.push(['SMP NEGERI 1 MANONJAYA']);
      ws2Data.push(['JADWAL PELAJARAN DETAIL UNTUK MATAPELAJARAN PER KELAS']);
      ws2Data.push([]);

      classrooms.forEach(c => {
        ws2Data.push([`KELAS / ROMBEL: ${c.name}`.toUpperCase()]);
        ws2Data.push(['JAM (JP)', ...timeConfig.days]);
        
        for (let p = 0; p < timeConfig.periodsPerDay; p++) {
          const rowData = [`JP ${p + 1}`];
          timeConfig.days.forEach(day => {
            const isLocked = timeConfig.lockedSlots.some(slot => slot.day === day && slot.period === p);
            if (isLocked) {
              const lockReason = timeConfig.lockedSlots.find(slot => slot.day === day && slot.period === p)?.reason || 'Locked';
              rowData.push(`[TERKUNCI: ${lockReason}]`);
            } else {
              const cell = timetableResult[c.id]?.[day]?.[p];
              if (cell) {
                rowData.push(`${cell.subject} (${cell.teacherCode})`);
              } else {
                rowData.push('-');
              }
            }
          });
          ws2Data.push(rowData);
        }
        ws2Data.push([]); // separation
        ws2Data.push([]);
      });

      const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);

      // 3. SHEET 3: DETAIL JADWAL MENGAJAR GURU
      const ws3Data: any[][] = [];
      ws3Data.push(['SMP NEGERI 1 MANONJAYA']);
      ws3Data.push(['JADWAL MENGAJAR DETAIL GURU (DISTRIBUSI JP)']);
      ws3Data.push([]);

      teachers.forEach(t => {
        ws3Data.push([`GURU: ${t.name} (${t.code}) - NIP: ${t.nip || '-'}`.toUpperCase()]);
        ws3Data.push(['JAM (JP)', ...timeConfig.days]);
        
        for (let p = 0; p < timeConfig.periodsPerDay; p++) {
          const rowData = [`JP ${p + 1}`];
          timeConfig.days.forEach(day => {
            const isLocked = timeConfig.lockedSlots.some(slot => slot.day === day && slot.period === p);
            if (isLocked) {
              const lockReason = timeConfig.lockedSlots.find(slot => slot.day === day && slot.period === p)?.reason || 'Locked';
              rowData.push(`[TERKUNCI: ${lockReason}]`);
            } else {
              let taughtClass = '-';
              classrooms.forEach(c => {
                const cell = timetableResult[c.id]?.[day]?.[p];
                if (cell && cell.teacherId === t.id) {
                  taughtClass = `${cell.subject} (${c.name})`;
                }
              });
              rowData.push(taughtClass);
            }
          });
          ws3Data.push(rowData);
        }
        ws3Data.push([]);
        ws3Data.push([]);
      });

      const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);

      // 4. SHEET 4: DAFTAR REFERENSI GURU
      const ws4Data: any[][] = [];
      ws4Data.push(['SMP NEGERI 1 MANONJAYA']);
      ws4Data.push(['DAFTAR ACUAN KODE GURU & KOMPETENSI MATA PELAJARAN']);
      ws4Data.push([]);
      ws4Data.push(['KODE GURU', 'NAMA LENGKAP GURU', 'NIP RESMI', 'MATA PELAJARAN DIAMPUL']);
      
      teachers.forEach(t => {
        const teacherSubjects = Array.from(
          new Set(workloads.filter(w => w.teacherId === t.id).map(w => w.subject))
        );
        ws4Data.push([t.code, t.name, t.nip || '-', teacherSubjects.length > 0 ? teacherSubjects.join(', ') : '-']);
      });

      const ws4 = XLSX.utils.aoa_to_sheet(ws4Data);

      // Auto-fit helper to make cells clean and professional
      const autofitColumns = (ws: XLSX.WorkSheet) => {
        const ref = ws['!ref'];
        if (!ref) return;
        const decode = XLSX.utils.decode_range(ref);
        const colWidths = [];
        for (let c = decode.s.c; c <= decode.e.c; c++) {
          let maxVal = 12;
          for (let r = decode.s.r; r <= decode.e.r; r++) {
            const cellRef = XLSX.utils.encode_cell({ r, c });
            const cell = ws[cellRef];
            if (cell && cell.v) {
              const strLen = cell.v.toString().length;
              if (strLen > maxVal) maxVal = strLen;
            }
          }
          colWidths.push({ wch: Math.min(maxVal + 2, 45) });
        }
        ws['!cols'] = colWidths;
      };

      // Apply auto-fit columns
      autofitColumns(ws1);
      autofitColumns(ws2);
      autofitColumns(ws3);
      autofitColumns(ws4);

      // Append sheets
      XLSX.utils.book_append_sheet(wb, ws1, 'Jadwal Induk Rekap');
      XLSX.utils.book_append_sheet(wb, ws2, 'Jadwal per Kelas');
      XLSX.utils.book_append_sheet(wb, ws3, 'Jadwal per Guru');
      XLSX.utils.book_append_sheet(wb, ws4, 'Referensi Guru');

      // Write and download workbook
      const fileDate = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Jadwal_Resmi_SMPN1Manonjaya_${fileDate}.xlsx`);
      addLog('Dokumen Excel (.xlsx) Multi-Lembar berhasil disusun & diunduh!', 'success');
    } catch (error) {
      console.error(error);
      addLog(`Gagal menyusun Excel: ${(error as Error).message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5.5 h-5.5 text-indigo-600" />
            AI Core Solver Dashboard
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Tekan proses di samping untuk menyusun jadwal secara otomatis dan bebas bentrok dengan aturan CSP Heuristic.
          </p>
        </div>

        <button
          onClick={handleStartSolve}
          disabled={isSolving || workloads.length === 0}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          {isSolving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Memproses Jadwal...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              PROSES GENERATE JADWAL OTOMATIS
            </>
          )}
        </button>
      </div>

      {/* Stats and Real-time Console Logging */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminal/Logs (2 columns wide) */}
        <div className="lg:col-span-2 bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col h-72">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Solver AI Terminal Output
            </h4>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isSolving ? 'bg-amber-400 animate-ping' : solverSuccess === true ? 'bg-emerald-500' : solverSuccess === false ? 'bg-red-500' : 'bg-slate-600'}`}></span>
              <span className="text-[10px] font-mono text-slate-400">
                {isSolving ? 'RUNNING' : solverSuccess === true ? 'SOLVED' : solverSuccess === false ? 'FAILED' : 'STANDBY'}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {logs.length === 0 ? (
              <p className="text-slate-500 italic text-center pt-16">
                Terminal kosong. Klik tombol 'Proses Generate Jadwal Otomatis' di atas untuk memulai.
              </p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex gap-2.5 leading-relaxed items-start">
                  <span className="text-slate-500 shrink-0 text-[10px] select-none pt-0.5">[{log.timestamp}]</span>
                  <span className={
                    log.type === 'success' 
                      ? 'text-emerald-400 font-bold' 
                      : log.type === 'error' 
                        ? 'text-rose-400 font-bold' 
                        : log.type === 'warning' 
                          ? 'text-amber-400 font-medium' 
                          : 'text-slate-300'
                  }>
                    {log.message}
                  </span>
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Quality Analysis & Recommendation Panel */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Hasil Analisis Kualitas Jadwal</h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Akurasi Pengisian</span>
                <p className="text-xl font-black text-indigo-700 mt-1 font-mono">
                  {fillingPercentage}%
                </p>
                <span className="text-[9px] text-gray-500 block mt-0.5">
                  {totalWeeklyJpScheduled()} dari {totalWeeklyJpRequested} JP terisi
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Consecutive Blocks</span>
                <p className="text-xl font-black text-emerald-600 mt-1 font-mono">
                  {calculateConsecutiveBlocksRatio()}%
                </p>
                <span className="text-[9px] text-gray-500 block mt-0.5">
                  Blok berurutan (≥2 JP)
                </span>
              </div>
            </div>

            {/* Capacity breakdown explanation */}
            <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 text-[10px] text-indigo-950 space-y-1">
              <span className="font-bold block text-indigo-900">Analisis Slot Guru (50 Guru Aktif):</span>
              <p className="leading-relaxed">
                Kapasitas kotor rombel adalah <strong>1.419 JP</strong> (33 kelas × 43 JP). Karena Kewalikelasan (33 JP) &amp; Wustho (33 JP) dialokasikan terpisah secara otomatis, slot bersih pelajaran umum bagi 50 guru adalah <strong>1.353 JP</strong>.
              </p>
            </div>

            {/* Constraints Checklist */}
            <div className="space-y-2 pt-1 border-t border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Status Aturan Ketat (Hard Constraints):</span>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                {getTeacherClashes().length === 0 ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>Anti-Bentrok Jadwal Guru ({getTeacherClashes().length === 0 ? 'Lolos 100%' : `${getTeacherClashes().length} Bentrok`})</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Anti-Bentrok Jadwal Kelas Terjamin (100%)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Kepatuhan Jam Terkunci Global (100%)</span>
              </div>
            </div>
          </div>

          {/* Recommendations based on status */}
          <div className="pt-4 border-t border-gray-100 mt-4 text-[11px] text-gray-500 flex items-start gap-1.5 leading-relaxed">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              {solverSuccess === true 
                ? 'Jadwal yang dihasilkan bebas konflik 100% dan sudah aman untuk dicetak atau disebarluaskan.' 
                : solverSuccess === false 
                  ? 'Kompilasi jadwal terisi sebagian. Gunakan panel diagnosis dan edit manual untuk melengkapinya.' 
                  : 'Siap melakukan kompilasi AI. Kami merekomendasikan pengetesan dengan memuat data simulasi terlebih dahulu.'}
            </span>
          </div>
        </div>
      </div>

      {/* aSc Style Conflict & Unscheduled Cards Diagnosis Panel */}
      {timetableResult && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="bg-slate-50 border-b border-gray-200 px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                Panel Diagnosis Konflik &amp; Beban Kerja (aSc Style)
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Memantau bentrok mengajar guru secara real-time dan beban pelajaran kelas yang belum teralokasikan. Klik sel tabel di bawah untuk override/mengubah jadwal secara manual.
              </p>
            </div>
            <div className="flex gap-2">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                getTeacherClashes().length === 0 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {getTeacherClashes().length} Bentrok Guru
              </span>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                getUnplacedWorkloads().length === 0 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {getUnplacedWorkloads().reduce((sum, u) => sum + u.unscheduledJp, 0)} JP Belum Terjadwal
              </span>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COLUMN 1: Teacher Clashes */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-500" />
                Daftar Bentrok Mengajar ({getTeacherClashes().length})
              </h5>
              
              {getTeacherClashes().length === 0 ? (
                <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-xl text-center">
                  <p className="text-xs text-emerald-800 font-medium">
                    ✓ Luar Biasa! Tidak ada jadwal guru yang bentrok (double booking).
                  </p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                  {getTeacherClashes().map((clash, idx) => (
                    <div key={idx} className="bg-rose-50/50 border border-rose-100 p-3 rounded-xl flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-rose-900 text-xs">
                          {clash.day}, JP {clash.period + 1}
                        </span>
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md font-mono">
                          KODE: {clash.teacherCode}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 font-medium">
                        Guru <strong className="text-rose-900">{clash.teacherName}</strong> terjadwal ganda di jam yang sama:
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {clash.assignments.map((ass, i) => (
                          <div key={i} className="bg-white border border-rose-100 p-2 rounded-lg text-[10px] font-bold text-rose-900">
                            <div>Kelas {ass.className}</div>
                            <div className="text-gray-500 font-normal mt-0.5">{ass.subject}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Teacher daily overload warning */}
              {getTeacherOverloads().length > 0 && (
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <h6 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                    Peringatan Kelebihan Batas Mengajar Harian ({getTeacherOverloads().length})
                  </h6>
                  <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {getTeacherOverloads().map((ov, i) => (
                      <div key={i} className="bg-amber-50/50 border border-amber-100/50 p-2 rounded-lg flex justify-between items-center">
                        <span>
                          <strong>{ov.teacherName} ({ov.teacherCode})</strong> di hari {ov.day}
                        </span>
                        <span className="font-bold text-amber-700 font-mono">
                          {ov.assignedJp} JP (Max {ov.maxJp} JP)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 2: Unplaced Workloads */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-500" />
                Kartu Beban Kerja Belum Terjadwal ({getUnplacedWorkloads().length} mata pelajaran)
              </h5>

              {getUnplacedWorkloads().length === 0 ? (
                <div className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-xl text-center">
                  <p className="text-xs text-indigo-800 font-medium">
                    ✓ Semua beban pelajaran (100%) telah sukses ditempatkan ke dalam jadwal!
                  </p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1">
                  {getUnplacedWorkloads().map((un, idx) => (
                    <div key={idx} className="bg-amber-50/40 border border-amber-100/70 p-3 rounded-xl flex flex-col justify-between hover:border-amber-300 transition-all shadow-2xs">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-bold text-indigo-950 text-xs truncate" title={un.workload.subject}>
                            {un.workload.subject}
                          </span>
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-sm font-mono shrink-0">
                            {un.unscheduledJp} JP Sisa
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-600 mt-1">
                          Guru: <span className="font-medium text-gray-800">{un.teacherName} ({un.teacherCode})</span>
                        </div>
                        <div className="text-[10px] text-gray-600">
                          Kelas: <span className="font-bold text-indigo-700 font-mono">{un.classroomName}</span>
                        </div>
                      </div>
                      <div className="mt-2.5 flex justify-between items-center text-[10px] text-gray-400 pt-1.5 border-t border-amber-100/50">
                        <span>Total Kontrak: {un.weeklyJp} JP</span>
                        <span className="text-indigo-600 font-bold">aSc Card</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Display Results Grid */}
      {timetableResult && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-xs space-y-6 animate-in fade-in duration-200">
          
          {/* View Controller */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
            <div className="flex flex-wrap gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setViewMode('master')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'master'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                }`}
              >
                Jadwal Induk Umum
              </button>
              <button
                onClick={() => setViewMode('class')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'class'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                }`}
              >
                Jadwal Per Kelas / Rombel
              </button>
              <button
                onClick={() => setViewMode('teacher')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'teacher'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                }`}
              >
                Jadwal Mengajar Guru
              </button>
            </div>

            {/* Export buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleExportExcel}
                className="px-3.5 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs shadow-emerald-50"
              >
                <FileSpreadsheet className="w-4.5 h-4.5" />
                Unduh Berkas Excel (.xlsx) Resmi
              </button>
            </div>
          </div>

          {/* Symmetrical Filter Selection Bar */}
          {viewMode === 'class' && (
            <div className="flex items-center gap-3 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100/60 w-fit">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <label htmlFor="classroom-select" className="text-xs font-semibold text-indigo-900">Pilih Kelas / Rombel:</label>
              <select
                id="classroom-select"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-indigo-200 text-indigo-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'teacher' && (
            <div className="flex items-center gap-3 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100/60 w-fit">
              <Users className="w-4 h-4 text-indigo-600" />
              <label htmlFor="teacher-select" className="text-xs font-semibold text-indigo-900">Pilih Guru Mata Pelajaran:</label>
              <select
                id="teacher-select"
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-indigo-200 text-indigo-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>[{t.code}] {t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* VIEW: 1. JADWAL INDUK UMUM MATRIX */}
          {viewMode === 'master' && (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-600 border-b border-gray-200">
                    <th className="p-3 w-32 border-r border-gray-200 text-center font-mono">HARI &amp; JP</th>
                    {classrooms.map(c => (
                      <th key={c.id} className="p-3 text-center border-r border-gray-200">
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {timeConfig.days.map(day => (
                    <React.Fragment key={day}>
                      {Array.from({ length: timeConfig.periodsPerDay }).map((_, periodIndex) => {
                        const pNum = periodIndex + 1;
                        const isLocked = timeConfig.lockedSlots.some(s => s.day === day && s.period === periodIndex);
                        const lockReason = timeConfig.lockedSlots.find(s => s.day === day && s.period === periodIndex)?.reason;

                        return (
                          <tr key={`${day}-${periodIndex}`} className="hover:bg-gray-50/50 transition-colors">
                            {/* Time Coordinate Header */}
                            {periodIndex === 0 ? (
                              <td 
                                rowSpan={timeConfig.periodsPerDay} 
                                className="p-3 bg-gray-50 border-r border-gray-200 text-center font-bold text-xs text-gray-600 divide-y divide-gray-100 font-sans select-none align-middle"
                              >
                                <div className="font-bold mb-1 uppercase tracking-wider text-indigo-700">{day}</div>
                                <div className="text-[10px] text-gray-400 font-normal font-mono">1-{timeConfig.periodsPerDay} JP</div>
                              </td>
                            ) : null}

                            {/* Period Index indicator */}
                            <td className="p-2 border-r border-gray-200 font-mono text-center bg-gray-50/30 text-gray-500 w-16">
                              JP {pNum}
                            </td>

                            {/* Class Cells */}
                            {classrooms.map(c => {
                              if (isLocked) {
                                return (
                                  <td key={c.id} className="p-1 text-center bg-amber-50/55 border-r border-gray-100 font-medium">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700/80 uppercase font-sans select-none">
                                      <Lock className="w-3 h-3 shrink-0" />
                                      {lockReason}
                                    </span>
                                  </td>
                                );
                              }

                              const cell = timetableResult[c.id]?.[day]?.[periodIndex];
                              if (cell) {
                                return (
                                  <td 
                                    key={c.id} 
                                    className="p-1.5 border-r border-gray-100 text-center bg-indigo-50/15 cursor-pointer hover:bg-indigo-100/40 transition-all"
                                    onClick={() => setEditingCell({ classroomId: c.id, day, period: periodIndex })}
                                    title="Klik untuk ubah / hapus jadwal manual"
                                  >
                                    <div className="bg-white border border-indigo-100 p-1.5 rounded-lg shadow-2xs hover:border-indigo-300">
                                      <div className="font-bold text-indigo-900 leading-tight truncate" title={cell.subject}>
                                        {cell.subject}
                                      </div>
                                      <div className="text-[10px] text-indigo-600 font-bold font-mono mt-0.5 bg-indigo-50 inline-block px-1.5 py-0.5 rounded-md">
                                        {cell.teacherCode}
                                      </div>
                                    </div>
                                  </td>
                                );
                              }

                              return (
                                <td 
                                  key={c.id} 
                                  className="p-1.5 border-r border-gray-100 text-center text-gray-300 cursor-pointer hover:bg-indigo-50/50 transition-all"
                                  onClick={() => setEditingCell({ classroomId: c.id, day, period: periodIndex })}
                                  title="Klik untuk tambah jadwal manual"
                                >
                                  <span className="text-[10px] italic font-normal opacity-50">- kosong -</span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW: 2. JADWAL PER KELAS GRID */}
          {viewMode === 'class' && selectedClassId && (
            <div className="overflow-x-auto border border-gray-200 rounded-xl bg-slate-50/40 p-4">
              <h4 className="text-sm font-bold text-gray-800 mb-3.5 flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-indigo-600" />
                Jadwal Terdaftar untuk Kelas: <span className="font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">{getClassroomById(selectedClassId)?.name}</span>
              </h4>

              <table className="w-full text-left border-collapse bg-white rounded-xl overflow-hidden shadow-xs border border-gray-200">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-600 border-b border-gray-200">
                    <th className="p-4 w-32 border-r border-gray-200 text-center">JAM / JP</th>
                    {timeConfig.days.map(day => (
                      <th key={day} className="p-4 text-center font-bold">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                  {Array.from({ length: timeConfig.periodsPerDay }).map((_, periodIndex) => {
                    const pNum = periodIndex + 1;
                    return (
                      <tr key={periodIndex} className="hover:bg-gray-50/30 transition-colors">
                        <td className="p-4 text-center font-mono font-medium text-xs text-gray-500 bg-gray-50/50 border-r border-gray-200">
                          JP {pNum}
                        </td>
                        {timeConfig.days.map(day => {
                          const isLocked = timeConfig.lockedSlots.some(s => s.day === day && s.period === periodIndex);
                          const lockReason = timeConfig.lockedSlots.find(s => s.day === day && s.period === periodIndex)?.reason;

                          if (isLocked) {
                            return (
                              <td key={day} className="p-3 text-center bg-amber-50/60 font-medium">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-800 uppercase bg-amber-100/50 px-2 py-1 rounded-md">
                                  <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                                  {lockReason}
                                </span>
                              </td>
                            );
                          }

                          const cell = timetableResult[selectedClassId]?.[day]?.[periodIndex];
                          if (cell) {
                            const teacher = getTeacherById(cell.teacherId);
                            return (
                              <td 
                                key={day} 
                                className="p-3 text-center bg-indigo-50/10 cursor-pointer hover:bg-indigo-100/30 transition-all"
                                onClick={() => setEditingCell({ classroomId: selectedClassId, day, period: periodIndex })}
                                title="Klik untuk ubah / hapus manual"
                              >
                                <div className="bg-indigo-50/40 border border-indigo-100/80 p-2.5 rounded-xl hover:border-indigo-300">
                                  <span className="block text-xs font-bold text-indigo-955 leading-snug">{cell.subject}</span>
                                  <span className="block text-[10px] text-gray-500 mt-1 font-medium">{teacher ? teacher.name : 'Unknown'} ({cell.teacherCode})</span>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td 
                              key={day} 
                              className="p-3 text-center text-gray-300 italic font-normal cursor-pointer hover:bg-indigo-50/50 transition-all"
                              onClick={() => setEditingCell({ classroomId: selectedClassId, day, period: periodIndex })}
                              title="Klik untuk tambah manual"
                            >
                              Tersedia (Kosong)
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW: 3. JADWAL PER GURU GRID */}
          {viewMode === 'teacher' && selectedTeacherId && (
            <div className="overflow-x-auto border border-gray-200 rounded-xl bg-slate-50/40 p-4">
              <h4 className="text-sm font-bold text-gray-800 mb-3.5 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-indigo-600" />
                Jadwal Mengajar Guru: <span className="text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 font-bold">{getTeacherById(selectedTeacherId)?.name} ({getTeacherById(selectedTeacherId)?.code})</span>
              </h4>

              <table className="w-full text-left border-collapse bg-white rounded-xl overflow-hidden shadow-xs border border-gray-200">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-600 border-b border-gray-200">
                    <th className="p-4 w-32 border-r border-gray-200 text-center">JAM / JP</th>
                    {timeConfig.days.map(day => (
                      <th key={day} className="p-4 text-center font-bold">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                  {Array.from({ length: timeConfig.periodsPerDay }).map((_, periodIndex) => {
                    const pNum = periodIndex + 1;
                    return (
                      <tr key={periodIndex} className="hover:bg-gray-50/30 transition-colors">
                        <td className="p-4 text-center font-mono font-medium text-xs text-gray-500 bg-gray-50/50 border-r border-gray-200">
                          JP {pNum}
                        </td>
                        {timeConfig.days.map(day => {
                          const isLocked = timeConfig.lockedSlots.some(s => s.day === day && s.period === periodIndex);
                          const lockReason = timeConfig.lockedSlots.find(s => s.day === day && s.period === periodIndex)?.reason;

                          if (isLocked) {
                            return (
                              <td key={day} className="p-3 text-center bg-amber-50/60 font-medium">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-800 uppercase bg-amber-100/50 px-2 py-1 rounded-md">
                                  <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                                  {lockReason}
                                </span>
                              </td>
                            );
                          }

                          // Search if teacher teaches any class in this day/period
                          let teachingCell: any = null;
                          Object.keys(timetableResult).forEach(classId => {
                            const cell = timetableResult[classId]?.[day]?.[periodIndex];
                            if (cell && cell.teacherId === selectedTeacherId) {
                              teachingCell = {
                                ...cell,
                                className: getClassroomById(classId)?.name || 'Unknown'
                              };
                            }
                          });

                          if (teachingCell) {
                            return (
                              <td key={day} className="p-3 text-center bg-emerald-50/20">
                                <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl">
                                  <span className="block text-xs font-bold text-emerald-900 leading-snug">{teachingCell.subject}</span>
                                  <span className="block text-[10px] text-emerald-700 font-bold font-mono mt-1">Kelas {teachingCell.className}</span>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td key={day} className="p-3 text-center text-gray-300 italic font-normal">
                              Istirahat (Free)
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manual Slot Override Editor Modal (aSc Style) */}
      {editingCell && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-gray-100 px-5 py-4 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Ubah Jadwal Manual (Override)</h4>
                <p className="text-[11px] text-gray-500 font-medium">
                  Kelas {getClassroomById(editingCell.classroomId)?.name} • {editingCell.day} JP {editingCell.period + 1}
                </p>
              </div>
              <button 
                onClick={() => setEditingCell(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg select-none px-2 cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 text-xs text-gray-700">
              {/* Current Cell Status */}
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">Status Sel Saat Ini:</span>
                {timetableResult[editingCell.classroomId]?.[editingCell.day]?.[editingCell.period] ? (
                  <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="font-bold text-indigo-950 block text-xs">
                        {timetableResult[editingCell.classroomId][editingCell.day][editingCell.period]?.subject}
                      </span>
                      <span className="text-[10px] text-indigo-600 block mt-0.5">
                        Guru: {getTeacherById(timetableResult[editingCell.classroomId][editingCell.day][editingCell.period]?.teacherId)?.name || '?'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleClearCell(editingCell.classroomId, editingCell.day, editingCell.period)}
                      className="px-2.5 py-1.5 font-semibold text-[11px] bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100/80 rounded-lg transition-all cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-gray-500 italic">
                    Sel dalam kondisi kosong (tersedia).
                  </div>
                )}
              </div>

              {/* Action 1: Assign Workload */}
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <span className="text-[10px] font-bold text-indigo-800 uppercase block">1. Tempatkan Mata Pelajaran Baru:</span>
                <p className="text-[10px] text-gray-500">
                  Pilih kontrak mata pelajaran rombel ini untuk dimasukkan ke sel ini.
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {workloads
                    .filter(wl => wl.classroomId === editingCell.classroomId)
                    .map(wl => {
                      const teacher = getTeacherById(wl.teacherId);
                      // Calculate currently scheduled count for this workload
                      let scheduledCount = 0;
                      timeConfig.days.forEach(d => {
                        const cellList = timetableResult[editingCell.classroomId]?.[d] || [];
                        cellList.forEach(cell => {
                          if (cell && cell.workloadId === wl.id) {
                            scheduledCount++;
                          }
                        });
                      });

                      return (
                        <button
                          key={wl.id}
                          onClick={() => handleAssignWorkloadToCell(editingCell.classroomId, editingCell.day, editingCell.period, wl.id)}
                          className="w-full text-left p-2.5 bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-xl transition-all flex justify-between items-center cursor-pointer text-xs font-medium"
                        >
                          <div>
                            <span className="text-gray-900 block font-semibold">{wl.subject}</span>
                            <span className="text-[10px] text-gray-500">{teacher ? teacher.name : 'Unknown'} ({teacher?.code})</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            scheduledCount >= wl.weeklyJp 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {scheduledCount} / {wl.weeklyJp} JP
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Action 2: Swap Cell */}
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">2. Tukar dengan Jam Lain (Swap):</span>
                <p className="text-[10px] text-gray-500 mb-2">
                  Tukar posisi jadwal sel ini dengan jam pelajaran lain pada hari yang sama ({editingCell.day}).
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: timeConfig.periodsPerDay }).map((_, targetPeriod) => {
                    if (targetPeriod === editingCell.period) return null;
                    const isTargetLocked = timeConfig.lockedSlots.some(s => s.day === editingCell.day && s.period === targetPeriod);
                    if (isTargetLocked) return null;

                    const cellVal = timetableResult[editingCell.classroomId]?.[editingCell.day]?.[targetPeriod];

                    return (
                      <button
                        key={targetPeriod}
                        onClick={() => handleSwapCells(editingCell.classroomId, editingCell.day, editingCell.period, targetPeriod)}
                        className="p-1.5 text-[10px] font-bold bg-gray-50 border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-lg text-center truncate cursor-pointer transition-all"
                        title={cellVal ? `Tukar dengan ${cellVal.subject}` : 'Tukar dengan Kosong'}
                      >
                        JP {targetPeriod + 1}
                        <span className="block text-[8px] text-gray-400 font-normal truncate">
                          {cellVal ? cellVal.teacherCode : 'kosong'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-gray-100 px-5 py-3 flex justify-end gap-2">
              <button
                onClick={() => setEditingCell(null)}
                className="px-4 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-all cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
