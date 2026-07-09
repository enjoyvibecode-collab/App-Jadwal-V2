import React, { useState, useEffect } from 'react';
import { DayOfWeek, TimeConfig, LockedSlot, ScheduleRow, DEFAULT_OFFICIAL_SCHEDULE, Classroom } from '../types';
import { Lock, Unlock, Clock, AlertCircle, Info, Calendar, Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, Sliders, Settings, X, CheckCircle, ShieldAlert } from 'lucide-react';

interface TimeSettingsProps {
  config: TimeConfig;
  onChange: (newConfig: TimeConfig) => void;
  classrooms?: Classroom[];
}

const ALL_DAYS: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const LOCK_PRESETS = ['Upacara Bendera', 'Istirahat', 'Kegiatan Keagamaan', 'Rapat Guru', 'KBM Terkunci', 'Kewalikelasan', 'Wustho'];

export default function TimeSettings({ config, onChange, classrooms = [] }: TimeSettingsProps) {
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(config.days);
  const [periods, setPeriods] = useState<number>(config.periodsPerDay);

  // Keep local periods state in sync with config.periodsPerDay
  useEffect(() => {
    setPeriods(config.periodsPerDay);
  }, [config.periodsPerDay]);

  // Keep local selectedDays in sync with config.days
  useEffect(() => {
    setSelectedDays(config.days);
  }, [config.days]);
  
  // Custom non-blocking notification modal states
  const [showAutoLockSuccessModal, setShowAutoLockSuccessModal] = useState(false);
  const [showAutoLockErrorModal, setShowAutoLockErrorModal] = useState(false);
  
  // States for lock editor modal/popover
  const [activeLockCell, setActiveLockCell] = useState<{ day: DayOfWeek; period: number } | null>(null);
  const [lockReason, setLockReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  const [activeScheduleDay, setActiveScheduleDay] = useState<DayOfWeek>(config.days[0] || 'Senin');

  const activeDayRows = config.customSchedules?.[activeScheduleDay] || DEFAULT_OFFICIAL_SCHEDULE[activeScheduleDay] || [];

  const handleUpdateDayRows = (day: DayOfWeek, updatedRows: ScheduleRow[]) => {
    let kbmIndex = 0;
    const processedRows = updatedRows.map(row => {
      if (row.isSpecial) {
        return {
          ...row,
          periodIndex: undefined,
          jpLabel: undefined
        };
      } else {
        const curIdx = kbmIndex;
        kbmIndex++;
        return {
          ...row,
          periodIndex: curIdx,
          jpLabel: String(curIdx + 1)
        };
      }
    });

    const updatedCustomSchedules = {
      ...(config.customSchedules || DEFAULT_OFFICIAL_SCHEDULE),
      [day]: processedRows
    };

    // Calculate maxPeriods across all active days based on this updated structure
    let maxPeriods = 0;
    selectedDays.forEach(d => {
      const s = updatedCustomSchedules[d] || [];
      const kbmCount = s.filter(r => !r.isSpecial).length;
      if (kbmCount > maxPeriods) {
        maxPeriods = kbmCount;
      }
    });

    // Cleanup lockedSlots for this day if they are now out of bounds
    const newKbmCount = processedRows.filter(r => !r.isSpecial).length;
    const updatedLockedSlots = config.lockedSlots.filter(
      slot => !(slot.day === day && slot.period >= newKbmCount)
    );

    onChange({
      ...config,
      periodsPerDay: maxPeriods > 0 ? maxPeriods : 1,
      lockedSlots: updatedLockedSlots,
      customSchedules: updatedCustomSchedules
    });

    // Sync local periods state
    setPeriods(maxPeriods > 0 ? maxPeriods : 1);
  };

  const handleRowChange = (index: number, field: keyof ScheduleRow, value: any) => {
    const updated = [...activeDayRows];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    handleUpdateDayRows(activeScheduleDay, updated);
  };

  const handleToggleSpecial = (index: number) => {
    const updated = [...activeDayRows];
    const isSpecial = !updated[index].isSpecial;
    updated[index] = {
      ...updated[index],
      isSpecial,
      label: isSpecial ? 'ISTIRAHAT' : undefined
    };
    handleUpdateDayRows(activeScheduleDay, updated);
  };

  const handleMoveRow = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === activeDayRows.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...activeDayRows];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    handleUpdateDayRows(activeScheduleDay, updated);
  };

  const handleDeleteRow = (index: number) => {
    const updated = activeDayRows.filter((_, idx) => idx !== index);
    handleUpdateDayRows(activeScheduleDay, updated);
  };

  const handleAddRow = (isSpecial: boolean) => {
    const lastRow = activeDayRows[activeDayRows.length - 1];
    let defaultTime = '07.30 - 08.10';
    if (lastRow) {
      const match = lastRow.time.match(/-\s*(\d{2})[.:](\d{2})/);
      if (match) {
        const h = parseInt(match[1]);
        const m = parseInt(match[2]);
        const startMins = h * 60 + m;
        const endMins = startMins + 40;
        const formatTime = (mins: number) => {
          const hours = Math.floor(mins / 60) % 24;
          const minutes = mins % 60;
          return `${String(hours).padStart(2, '0')}.${String(minutes).padStart(2, '0')}`;
        };
        defaultTime = `${formatTime(startMins)} - ${formatTime(endMins)}`;
      }
    }
    const newRow: ScheduleRow = {
      isSpecial,
      time: defaultTime,
      label: isSpecial ? 'ISTIRAHAT' : undefined
    };
    handleUpdateDayRows(activeScheduleDay, [...activeDayRows, newRow]);
  };

  const handleResetDaySchedule = () => {
    handleUpdateDayRows(activeScheduleDay, DEFAULT_OFFICIAL_SCHEDULE[activeScheduleDay] || []);
  };

  const handleDayToggle = (day: DayOfWeek) => {
    let updatedDays: DayOfWeek[];
    if (selectedDays.includes(day)) {
      if (selectedDays.length <= 1) return; // Must have at least 1 school day
      updatedDays = selectedDays.filter(d => d !== day);
    } else {
      // Keep chronological sorting
      updatedDays = ALL_DAYS.filter(d => d === day || selectedDays.includes(d));
    }
    setSelectedDays(updatedDays);
    
    // Clean up locked slots for removed days
    const updatedLockedSlots = config.lockedSlots.filter(slot => updatedDays.includes(slot.day));
    onChange({
      ...config,
      days: updatedDays,
      lockedSlots: updatedLockedSlots
    });
  };

  const handlePeriodsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1 || value > 14) return;
    setPeriods(value);
    
    // Clean up locked slots for periods out of bounds
    const updatedLockedSlots = config.lockedSlots.filter(slot => slot.period < value);
    onChange({
      ...config,
      periodsPerDay: value,
      lockedSlots: updatedLockedSlots
    });
  };

  const [selectedClassroomForLock, setSelectedClassroomForLock] = useState<string>('global');
  const [lockTargetType, setLockTargetType] = useState<'global' | 'custom'>('global');
  const [selectedTargetClassrooms, setSelectedTargetClassrooms] = useState<string[]>([]);

  const getLockForCell = (day: DayOfWeek, period: number) => {
    return config.lockedSlots.find(s => {
      if (s.day !== day || s.period !== period) return false;
      if (selectedClassroomForLock === 'global') {
        return !s.targetClassroomIds || s.targetClassroomIds.length === 0;
      } else {
        return !s.targetClassroomIds || s.targetClassroomIds.length === 0 || s.targetClassroomIds.includes(selectedClassroomForLock);
      }
    });
  };

  const openLockModal = (day: DayOfWeek, period: number) => {
    const existing = getLockForCell(day, period);
    setActiveLockCell({ day, period });
    if (existing) {
      if (LOCK_PRESETS.includes(existing.reason)) {
        setLockReason(existing.reason);
        setCustomReason('');
      } else {
        setLockReason('Lainnya');
        setCustomReason(existing.reason);
      }
      setLockTargetType(existing.targetClassroomIds && existing.targetClassroomIds.length > 0 ? 'custom' : 'global');
      setSelectedTargetClassrooms(existing.targetClassroomIds || []);
    } else {
      setLockReason(LOCK_PRESETS[1]); // Default to 'Istirahat'
      setCustomReason('');
      setLockTargetType(selectedClassroomForLock === 'global' ? 'global' : 'custom');
      setSelectedTargetClassrooms(selectedClassroomForLock === 'global' ? [] : [selectedClassroomForLock]);
    }
  };

  const handleSaveLock = () => {
    if (!activeLockCell) return;
    
    const finalReason = lockReason === 'Lainnya' ? customReason.trim() : lockReason;
    if (!finalReason) return;

    // Filter out existing lock for this slot and this specificity
    const otherLocks = config.lockedSlots.filter(
      s => !(s.day === activeLockCell.day && s.period === activeLockCell.period &&
             (lockTargetType === 'global'
               ? (!s.targetClassroomIds || s.targetClassroomIds.length === 0)
               : (s.targetClassroomIds && s.targetClassroomIds.includes(selectedClassroomForLock))
             )
      )
    );

    const newLock: LockedSlot = {
      day: activeLockCell.day,
      period: activeLockCell.period,
      reason: finalReason,
      targetClassroomIds: lockTargetType === 'global' ? undefined : selectedTargetClassrooms
    };

    onChange({
      ...config,
      lockedSlots: [...otherLocks, newLock]
    });
    
    setActiveLockCell(null);
  };

  const handleUnlockCell = () => {
    if (!activeLockCell) return;

    const remainingLocks = config.lockedSlots.filter(
      s => !(s.day === activeLockCell.day && s.period === activeLockCell.period &&
             (lockTargetType === 'global'
               ? (!s.targetClassroomIds || s.targetClassroomIds.length === 0)
               : (s.targetClassroomIds && s.targetClassroomIds.includes(selectedClassroomForLock))
             )
      )
    );

    onChange({
      ...config,
      lockedSlots: remainingLocks
    });

    setActiveLockCell(null);
  };

  return (
    <div id="time-settings-section" className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Konfigurasi Hari & Jam Sekolah
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Day Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Hari Sekolah Aktif</label>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => {
                const isActive = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500">
              Pilih hari-hari yang aktif untuk kegiatan belajar mengajar (KBM).
            </p>
          </div>

          {/* Period Count */}
          <div className="space-y-2">
            <label htmlFor="periods-input" className="text-sm font-medium text-gray-700">
              Jumlah Jam Pelajaran (JP) Maksimum
            </label>
            <div className="flex items-center gap-3">
              <input
                id="periods-input"
                type="number"
                value={periods}
                disabled
                className="w-24 px-3.5 py-2 rounded-xl border border-gray-100 bg-gray-50 text-center font-bold text-indigo-700 cursor-not-allowed"
              />
              <span className="text-sm text-gray-500 font-semibold bg-gray-100 px-2.5 py-1.5 rounded-lg">JP Maksimum</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Dihitung otomatis sebagai nilai terbesar dari alokasi KBM di bawah ({periods} JP).
            </p>
          </div>
        </div>
      </div>

      {/* Aturan Pecah JP (Workload Splitting Rules) Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            Aturan Pecah JP (Workload Splitting Rules)
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Tentukan bagaimana mesin generator (AI Solver) memecah total jam pelajaran (JP) mingguan suatu mapel menjadi kartu jadwal harian yang siap ditempatkan di tabel mingguan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ideal Option */}
          <button
            type="button"
            onClick={() => onChange({ ...config, splittingRule: 'ideal' })}
            className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between h-full ${
              (config.splittingRule || 'ideal') === 'ideal'
                ? 'border-indigo-500 bg-indigo-50/20 ring-2 ring-indigo-500/10'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-900">Pola Pecah Ideal (Usulan Data Engineer)</span>
                <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-800">
                  Ideal Rombel
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Memecah JP besar menjadi pertemuan yang seimbang (2+2+2 atau 3+2 JP) agar siswa tidak cepat bosan dan jadwal di tabel mingguan lebih dinamis serta bervariasi.
              </p>
            </div>
            
            {/* Visual simulation table */}
            <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 space-y-1.5 text-[10px] w-full font-mono">
              <div className="flex justify-between border-b border-gray-200/50 pb-1">
                <span className="text-gray-400">6 JP</span>
                <span className="font-bold text-indigo-700">2 JP + 2 JP + 2 JP <span className="text-gray-400 font-normal">(3 Kartu)</span></span>
              </div>
              <div className="flex justify-between border-b border-gray-200/50 pb-1">
                <span className="text-gray-400">5 JP</span>
                <span className="font-bold text-indigo-700">3 JP + 2 JP <span className="text-gray-400 font-normal">(2 Kartu)</span></span>
              </div>
              <div className="flex justify-between border-b border-gray-200/50 pb-1">
                <span className="text-gray-400">4 JP</span>
                <span className="font-bold text-indigo-700">2 JP + 2 JP <span className="text-gray-400 font-normal">(2 Kartu)</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">3 JP / 2 JP / 1 JP</span>
                <span className="font-bold text-indigo-700">3 JP / 2 JP / 1 JP <span className="text-gray-400 font-normal">(Tetap 1 Kartu)</span></span>
              </div>
            </div>
          </button>

          {/* Classic Option */}
          <button
            type="button"
            onClick={() => onChange({ ...config, splittingRule: 'classic' })}
            className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between h-full ${
              config.splittingRule === 'classic'
                ? 'border-indigo-500 bg-indigo-50/20 ring-2 ring-indigo-500/10'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-900">Pola Pecah Klasik (Maks 2 JP)</span>
                <span className="px-2 py-0.5 text-[9px] font-semibold tracking-wider rounded-md bg-gray-100 text-gray-600">
                  Konservatif
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Memecah JP secara konservatif menjadi blok maksimal 2 JP berturut-turut untuk semua mata pelajaran (misal: 6 JP pecah menjadi 2+2+2 JP di 3 hari berbeda).
              </p>
            </div>

            {/* Visual simulation table */}
            <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 space-y-1.5 text-[10px] w-full font-mono">
              <div className="flex justify-between border-b border-gray-200/50 pb-1">
                <span className="text-gray-400">6 JP</span>
                <span className="font-bold text-slate-700">2 JP + 2 JP + 2 JP <span className="text-gray-400 font-normal">(3 Kartu)</span></span>
              </div>
              <div className="flex justify-between border-b border-gray-200/50 pb-1">
                <span className="text-gray-400">5 JP</span>
                <span className="font-bold text-slate-700">2 JP + 2 JP + 1 JP <span className="text-gray-400 font-normal">(3 Kartu)</span></span>
              </div>
              <div className="flex justify-between border-b border-gray-200/50 pb-1">
                <span className="text-gray-400">4 JP</span>
                <span className="font-bold text-slate-700">2 JP + 2 JP <span className="text-gray-400 font-normal">(2 Kartu)</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">3 JP / 2 JP / 1 JP</span>
                <span className="font-bold text-slate-700">2+1 JP / 2 JP / 1 JP <span className="text-gray-400 font-normal">(Terpecah harian)</span></span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Detailed Daily Schedule Row Editor */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-500" />
            Alokasi Waktu & Durasi JP (Jam Pelajaran)
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Sesuaikan urutan, nama kegiatan, dan durasi waktu KBM (Jam Pelajaran) maupun kegiatan Non-KBM (seperti upacara dan istirahat) untuk masing-masing hari.
          </p>
        </div>

        {/* Day selection tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-gray-200 pb-px">
          {selectedDays.map((day) => {
            const isActive = activeScheduleDay === day;
            const rows = config.customSchedules?.[day] || DEFAULT_OFFICIAL_SCHEDULE[day] || [];
            const kbmCount = rows.filter(r => !r.isSpecial).length;
            return (
              <button
                key={day}
                onClick={() => setActiveScheduleDay(day)}
                type="button"
                className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all relative -mb-px border-b-2 ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                }`}
              >
                {day}
                <span className="ml-1.5 text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                  {kbmCount} JP
                </span>
              </button>
            );
          })}
        </div>

        {/* Schedule list table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500 animate-pulse" />
              <span className="text-sm font-semibold text-gray-700">
                Mengatur Jadwal Hari <span className="text-indigo-600 font-extrabold">{activeScheduleDay}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleAddRow(false)}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Jam Pelajaran (KBM)
              </button>
              <button
                onClick={() => handleAddRow(true)}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
              >
                <Plus className="w-3.5 h-3.5 text-gray-500" />
                Tambah Kegiatan Khusus
              </button>
              <button
                onClick={handleResetDaySchedule}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200/50"
                title="Reset hari ini ke jadwal kurikulum standar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Hari Ini
              </button>
            </div>
          </div>

          {activeDayRows.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              Tidak ada alokasi waktu untuk hari ini. Silakan tambahkan Jam Pelajaran atau Kegiatan Khusus.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-xs">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-600">
                    <th className="p-3 w-12 text-center">No</th>
                    <th className="p-3 w-28">Tipe Slot</th>
                    <th className="p-3">Keterangan / Jam Ke-</th>
                    <th className="p-3 w-56">Waktu (Format: HH.MM - HH.MM)</th>
                    <th className="p-3 w-28 text-center">Urutan & Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {activeDayRows.map((row, idx) => {
                    return (
                      <tr key={idx} className={`hover:bg-gray-50/50 transition-colors ${row.isSpecial ? 'bg-amber-50/20' : ''}`}>
                        {/* 1. Sequential Number */}
                        <td className="p-3 text-center font-mono font-bold text-gray-400">
                          {idx + 1}
                        </td>

                        {/* 2. Type Badging / Toggling */}
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleToggleSpecial(idx)}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase transition-all ${
                              row.isSpecial
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                          >
                            {row.isSpecial ? 'KHUSUS' : 'KBM / JP'}
                          </button>
                        </td>

                        {/* 3. Label / JP description */}
                        <td className="p-3">
                          {row.isSpecial ? (
                            <input
                              type="text"
                              value={row.label || ''}
                              onChange={(e) => handleRowChange(idx, 'label', e.target.value)}
                              placeholder="Nama Kegiatan (Contoh: ISTIRAHAT)"
                              className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-semibold uppercase text-amber-900 bg-amber-50/30"
                            />
                          ) : (
                            <span className="text-gray-800 font-bold flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-mono font-black flex items-center justify-center">
                                {row.jpLabel}
                              </span>
                              Jam Pelajaran ke-{row.jpLabel}
                            </span>
                          )}
                        </td>

                        {/* 4. Time range field */}
                        <td className="p-3">
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={row.time}
                              onChange={(e) => handleRowChange(idx, 'time', e.target.value)}
                              placeholder="Format: 07.30 - 08.10"
                              className="w-full pl-9 pr-3 py-1.5 text-sm font-mono font-medium rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-gray-700"
                            />
                          </div>
                        </td>

                        {/* 5. Actions: Reorder & Delete */}
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleMoveRow(idx, 'up')}
                              disabled={idx === 0}
                              type="button"
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Pindahkan ke atas"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMoveRow(idx, 'down')}
                              disabled={idx === activeDayRows.length - 1}
                              type="button"
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Pindahkan ke bawah"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(idx)}
                              type="button"
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              title="Hapus alokasi waktu ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Grid Lock Feature */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              Slot Waktu Terkunci & Istirahat
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Klik pada sel/slot jadwal di bawah untuk mengunci secara permanen (seperti Upacara atau Istirahat). Mesin tidak akan menaruh jadwal di slot ini.
            </p>
          </div>
          <div className="flex items-center gap-1.5 self-start bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-100">
            <Info className="w-3.5 h-3.5" />
            <span>Interactive Grid</span>
          </div>
        </div>

        {/* Controls Bar for specificity and auto-lock */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-amber-50/30 border border-amber-200/50 p-4 rounded-2xl mb-5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Spesifisitas Tampilan</span>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="lock-classroom-select" className="text-xs text-gray-500 font-medium">Lihat slot terkunci untuk:</label>
              <select
                id="lock-classroom-select"
                value={selectedClassroomForLock}
                onChange={(e) => setSelectedClassroomForLock(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="global">Semua Kelas (Global / Umum)</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>Kelas {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                if (!classrooms || classrooms.length === 0) {
                  setShowAutoLockErrorModal(true);
                  return;
                }

                let updatedLockedSlots = config.lockedSlots.filter(
                  s => s.reason !== 'Kewalikelasan' && s.reason !== 'Wustho'
                );

                // Add Kewalikelasan (global lock for all classes on Monday, Jam ke-1 / periodIndex 0)
                updatedLockedSlots.push({
                  day: 'Senin',
                  period: 0,
                  reason: 'Kewalikelasan',
                  targetClassroomIds: [] // empty means all classrooms
                });

                // Add Wustho for each classroom based on grade
                const class7Ids = classrooms.filter(c => c.name.trim().startsWith('7') || (c.name.trim().toLowerCase().startsWith('vii') && !c.name.trim().toLowerCase().startsWith('viii'))).map(c => c.id);
                const class8Ids = classrooms.filter(c => c.name.trim().startsWith('8') || c.name.trim().toLowerCase().startsWith('viii')).map(c => c.id);
                const class9Ids = classrooms.filter(c => c.name.trim().startsWith('9') || c.name.trim().toLowerCase().startsWith('ix')).map(c => c.id);

                if (class7Ids.length > 0) {
                  updatedLockedSlots.push({
                    day: 'Senin',
                    period: 5, // Pelajaran ke-6
                    reason: 'Wustho',
                    targetClassroomIds: class7Ids
                  });
                }

                if (class8Ids.length > 0) {
                  updatedLockedSlots.push({
                    day: 'Selasa',
                    period: 6, // Pelajaran ke-7
                    reason: 'Wustho',
                    targetClassroomIds: class8Ids
                  });
                }

                if (class9Ids.length > 0) {
                  updatedLockedSlots.push({
                    day: 'Rabu',
                    period: 6, // Pelajaran ke-7
                    reason: 'Wustho',
                    targetClassroomIds: class9Ids
                  });
                }

                onChange({
                  ...config,
                  lockedSlots: updatedLockedSlots
                });

                setShowAutoLockSuccessModal(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Lock className="w-4 h-4 text-amber-700" />
              Kunci Otomatis Kewalikelasan & Wustho
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 items-center mb-5 p-3.5 bg-gray-50 rounded-xl border border-gray-200/60 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-sm bg-white border border-gray-200"></span>
            <span>Slot Kosong (Bisa diisi KBM)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-sm bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Lock className="w-2.5 h-2.5 text-amber-500" />
            </span>
            <span>Slot Terkunci (Upacara, Istirahat, dll.)</span>
          </div>
        </div>

        {/* Scrollable grid container */}
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-600 border-b border-gray-200">
                <th className="p-3 w-32 text-center border-r border-gray-200 font-mono">JAM (JP)</th>
                {selectedDays.map((day) => (
                  <th key={day} className="p-3 text-center font-semibold">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {Array.from({ length: periods }).map((_, periodIndex) => {
                const periodNum = periodIndex + 1;
                return (
                  <tr key={periodIndex} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 text-center font-mono font-medium text-xs text-gray-500 bg-gray-50/50 border-r border-gray-200">
                      JP {periodNum}
                    </td>
                    {selectedDays.map((day) => {
                      const lock = getLockForCell(day, periodIndex);
                      const isGlobal = lock ? (!lock.targetClassroomIds || lock.targetClassroomIds.length === 0) : true;
                      return (
                        <td key={day} className="p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => openLockModal(day, periodIndex)}
                            className={`w-full p-2.5 rounded-lg text-xs font-medium text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[64px] border ${
                              lock
                                ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100/80 shadow-xs'
                                : 'bg-white border-dashed border-gray-200 text-gray-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/10'
                            }`}
                          >
                            {lock ? (
                              <>
                                <Lock className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                                <span className="font-semibold truncate max-w-full text-[11px]">
                                  {lock.reason}
                                </span>
                                <span className="text-[9px] text-amber-600/80 font-mono">
                                  {isGlobal ? 'Semua Kelas' : 'Kelas Khusus'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-4 h-4 text-gray-300 opacity-60 group-hover:opacity-100 shrink-0" />
                                <span className="text-[10px] text-gray-400 font-normal">Tersedia</span>
                              </>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lock/Unlock Dialog */}
      {activeLockCell && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80">
              <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-500" />
                Kunci Slot Jadwal
              </h4>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Hari {activeLockCell.day}, Jam ke-{activeLockCell.period + 1}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Pilih Alasan Penguncian</label>
                <div className="grid grid-cols-2 gap-2">
                  {LOCK_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setLockReason(preset);
                        setCustomReason('');
                      }}
                      className={`p-2.5 rounded-xl text-left text-xs font-medium border transition-all cursor-pointer ${
                        lockReason === preset
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setLockReason('Lainnya')}
                    className={`p-2.5 rounded-xl text-left text-xs font-medium border transition-all cursor-pointer ${
                      lockReason === 'Lainnya'
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Lainnya (Kustom)
                  </button>
                </div>
              </div>

              {lockReason === 'Lainnya' && (
                <div className="space-y-1">
                  <label htmlFor="custom-reason" className="text-xs font-semibold text-gray-700">
                    Alasan Kustom
                  </label>
                  <input
                    id="custom-reason"
                    type="text"
                    required
                    placeholder="Contoh: Sholat Berjamaah"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  />
                </div>
              )}

              {/* Specificity Selection */}
              {classrooms.length > 0 && (
                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <span className="text-xs font-semibold text-gray-700 block">Berlaku Untuk</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="lockTargetType"
                        checked={lockTargetType === 'global'}
                        onChange={() => {
                          setLockTargetType('global');
                          setSelectedTargetClassrooms([]);
                        }}
                        className="text-indigo-600 focus:ring-indigo-500/20"
                      />
                      Semua Kelas (Global)
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="lockTargetType"
                        checked={lockTargetType === 'custom'}
                        onChange={() => {
                          setLockTargetType('custom');
                          if (selectedTargetClassrooms.length === 0) {
                            setSelectedTargetClassrooms(selectedClassroomForLock === 'global' ? [classrooms[0]?.id] : [selectedClassroomForLock]);
                          }
                        }}
                        className="text-indigo-600 focus:ring-indigo-500/20"
                      />
                      Hanya Kelas Tertentu
                    </label>
                  </div>

                  {lockTargetType === 'custom' && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-32 overflow-y-auto grid grid-cols-2 gap-2 mt-2">
                      {classrooms.map((c) => {
                        const isChecked = selectedTargetClassrooms.includes(c.id);
                        return (
                          <label key={c.id} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedTargetClassrooms(selectedTargetClassrooms.filter(id => id !== c.id));
                                } else {
                                  setSelectedTargetClassrooms([...selectedTargetClassrooms, c.id]);
                                }
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/20 w-3.5 h-3.5"
                            />
                            Kelas {c.name}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  {lockTargetType === 'global'
                    ? 'Semua kelas/rombel dan guru tidak akan dijadwalkan mengajar pada hari dan jam pelajaran ini.'
                    : 'Kelas-kelas terpilih di atas tidak akan dijadwalkan menerima pelajaran pada hari dan jam pelajaran ini.'}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-3">
              <div>
                {getLockForCell(activeLockCell.day, activeLockCell.period) && (
                  <button
                    type="button"
                    onClick={handleUnlockCell}
                    className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                  >
                    Hapus Kunci
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveLockCell(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveLock}
                  disabled={lockReason === 'Lainnya' && !customReason.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Simpan Kunci
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Lock Success Modal */}
      {showAutoLockSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">Kunci Otomatis Berhasil Diterapkan!</h3>
                <p className="text-[11px] text-gray-500">Sistem berhasil memblokir jam-jam khusus berikut di jadwal.</p>
              </div>
            </div>

            <div className="space-y-3.5 my-2">
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-gray-200/60">
                <div className="flex items-start gap-2.5 text-xs text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 animate-pulse"></span>
                  <div>
                    <strong className="text-gray-900 font-bold block">1. Kewalikelasan (Sistem Homeroom)</strong>
                    <span className="text-gray-500 text-[11px]">Setiap hari <strong>Senin Jam ke-1</strong> dikunci global untuk semua rombel/kelas aktif.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-700 border-t border-gray-150/60 pt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5"></span>
                  <div>
                    <strong className="text-gray-900 font-bold block">2. Kegiatan Wustho Kelas VII</strong>
                    <span className="text-gray-500 text-[11px]">Setiap hari <strong>Senin Jam ke-6</strong> dikunci khusus untuk seluruh kelas 7.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-700 border-t border-gray-150/60 pt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5"></span>
                  <div>
                    <strong className="text-gray-900 font-bold block">3. Kegiatan Wustho Kelas VIII</strong>
                    <span className="text-gray-500 text-[11px]">Setiap hari <strong>Selasa Jam ke-7</strong> dikunci khusus untuk seluruh kelas 8.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-700 border-t border-gray-150/60 pt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5"></span>
                  <div>
                    <strong className="text-gray-900 font-bold block">4. Kegiatan Wustho Kelas IX</strong>
                    <span className="text-gray-500 text-[11px]">Setiap hari <strong>Rabu Jam ke-7</strong> dikunci khusus untuk seluruh kelas 9.</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-amber-800 bg-amber-50/40 p-3 rounded-xl border border-amber-100 leading-normal font-semibold">
                Mesin generator (AI Solver) secara otomatis akan melarang mata pelajaran umum ditempatkan pada jam-jam khusus ini untuk menjamin kelancaran KBM.
              </p>
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAutoLockSuccessModal(false)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Selesai &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Lock Error Modal */}
      {showAutoLockErrorModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">Gagal Mengunci Otomatis</h3>
                <p className="text-[11px] text-gray-500">Data kelas atau rombel tidak terdeteksi.</p>
              </div>
            </div>

            <div className="space-y-3.5 my-2">
              <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                Mesin tidak dapat menyusun pembagian jam Kewalikelasan &amp; Wustho karena Anda belum menginput satupun Kelas.
              </p>
              <p className="text-xs text-indigo-700 bg-indigo-50/35 p-3 rounded-xl border border-indigo-100/60 leading-normal font-medium">
                Silakan pergi ke tab <strong>&quot;Manajemen Kelas&quot;</strong> terlebih dahulu untuk menambahkan rombel Anda (misalnya VII A, VIII B, dst.), kemudian ulangi kembali proses ini.
              </p>
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAutoLockErrorModal(false)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Mengerti &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
