import React, { useState } from 'react';
import { Classroom, Teacher, Workload, TimeConfig, LockedSlot, DayOfWeek } from '../types';
import { 
  Plus, Trash2, Search, BookOpen, AlertCircle, Sparkles, User, 
  Clock, Lock, Unlock, X, BarChart3, GraduationCap, ArrowRight, Settings2, Info,
  Users, CheckCircle
} from 'lucide-react';

interface ClassroomDirectoryProps {
  classrooms: Classroom[];
  teachers: Teacher[];
  workloads: Workload[];
  timeConfig: TimeConfig;
  onAdd: (classroom: Omit<Classroom, 'id'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (classroom: Classroom) => void;
  onUpdateTimeConfig: (newConfig: TimeConfig) => void;
}

const ALL_DAYS: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function ClassroomDirectory({ 
  classrooms, 
  teachers, 
  workloads, 
  timeConfig, 
  onAdd, 
  onDelete, 
  onUpdate,
  onUpdateTimeConfig
}: ClassroomDirectoryProps) {
  
  // Selected classroom for detailed modal (Wali Kelas, Workloads, and interactive Lock Grid)
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'info' | 'workloads' | 'locks'>('info');

  // Form State
  const [classNameInput, setClassNameInput] = useState('');
  const [selectedWaliKelasId, setSelectedWaliKelasId] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Bulk copy state
  const [isBulkCopyOpen, setIsBulkCopyOpen] = useState(false);
  const [selectedTargetClassrooms, setSelectedTargetClassrooms] = useState<string[]>([]);
  const [bulkSearchQuery, setBulkSearchQuery] = useState('');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  const isDuplicate = (name: string) => {
    return classrooms.some(c => c.name.toUpperCase().trim() === name.toUpperCase().trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = classNameInput.trim();
    if (!cleanName) {
      setError('Nama kelas tidak boleh kosong.');
      return;
    }

    if (isDuplicate(cleanName)) {
      setError(`Kelas "${cleanName}" sudah ada dalam daftar.`);
      return;
    }

    onAdd({ 
      name: cleanName,
      waliKelasId: selectedWaliKelasId || undefined
    });

    setClassNameInput('');
    setSelectedWaliKelasId('');
  };

  // Preset generator for rapid entries
  const handleAddPresets = (grade: string, count: number) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
    let addedCount = 0;
    
    for (let i = 0; i < count; i++) {
      const name = `${grade} ${letters[i]}`;
      if (!isDuplicate(name)) {
        onAdd({ name });
        addedCount++;
      }
    }
  };

  const filteredClassrooms = classrooms.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics calculations
  const totalClassroomsCount = classrooms.length;
  const classesWithWaliKelasCount = classrooms.filter(c => c.waliKelasId).length;
  const totalWorkloadsJp = workloads.reduce((sum, w) => sum + w.weeklyJp, 0);

  const getTeacherName = (id?: string) => {
    if (!id) return 'Belum ditunjuk';
    const t = teachers.find(teacher => teacher.id === id);
    return t ? t.name : 'Belum ditunjuk';
  };

  // Get classroom specific details
  const getClassroomWorkloads = (classId: string) => {
    return workloads.filter(w => w.classroomId === classId);
  };

  const getClassroomTotalJp = (classId: string) => {
    return getClassroomWorkloads(classId).reduce((sum, w) => sum + w.weeklyJp, 0);
  };

  // Calculate maximum capacity for a classroom: Active days * periods - global locks
  const getClassroomCapacity = (classId: string) => {
    const activeDays = timeConfig.days;
    const periodsPerDay = timeConfig.periodsPerDay;
    let totalSlots = activeDays.length * periodsPerDay;
    
    // Count active locks affecting this classroom
    const lockCount = timeConfig.lockedSlots.filter(s => {
      // Must be on an active day
      if (!activeDays.includes(s.day)) return false;
      // Must be within periods bounds
      if (s.period >= periodsPerDay) return false;
      // Must be global lock OR classroom-specific lock for this class
      return !s.targetClassroomIds || s.targetClassroomIds.length === 0 || s.targetClassroomIds.includes(classId);
    }).length;

    return Math.max(0, totalSlots - lockCount);
  };

  return (
    <div id="classroom-directory-section" className="space-y-6">
      
      {/* Visual Statistics Board */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Rombel</p>
            <p className="text-2xl font-black text-gray-900 font-mono mt-0.5">{totalClassroomsCount} <span className="text-xs text-gray-400 font-normal">Kelas</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600 shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Wali Kelas Terisi</p>
            <p className="text-2xl font-black text-gray-900 font-mono mt-0.5">
              {classesWithWaliKelasCount} <span className="text-xs text-gray-400 font-normal">/ {totalClassroomsCount} Kelas</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100/50 flex items-center justify-center text-amber-600 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Beban Mengajar</p>
            <p className="text-2xl font-black text-gray-900 font-mono mt-0.5">{totalWorkloadsJp} <span className="text-xs text-gray-400 font-normal">JP / Minggu</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Panel */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-indigo-600" />
              Tambah Kelas Baru
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span className="text-xs text-red-800 leading-normal">{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="classroom-name" className="text-xs font-semibold text-gray-700">
                  Nama Kelas / Rombel
                </label>
                <input
                  id="classroom-name"
                  type="text"
                  required
                  placeholder="Contoh: VII A, VIII B, IX F"
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold text-gray-800 uppercase placeholder-gray-400 placeholder:normal-case"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="wali-kelas-select" className="text-xs font-semibold text-gray-700">
                  Wali Kelas (Opsional)
                </label>
                <select
                  id="wali-kelas-select"
                  value={selectedWaliKelasId}
                  onChange={(e) => setSelectedWaliKelasId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-gray-700 bg-white"
                >
                  <option value="">-- Pilih Wali Kelas --</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.code})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500">Membantu KBM Kewalikelasan otomatis dikunci di hari Senin.</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Simpan Kelas
              </button>
            </form>
          </div>

          {/* Rapid Generation Presets */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
              Generator Cepat Kelas
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              Tambahkan serangkaian kelas paralel secara otomatis untuk menghemat waktu Anda.
            </p>

            <div className="space-y-2">
              {[
                { grade: 'VII', count: 11 },
                { grade: 'VIII', count: 11 },
                { grade: 'IX', count: 11 }
              ].map((preset) => (
                <button
                  key={preset.grade}
                  type="button"
                  onClick={() => handleAddPresets(preset.grade, preset.count)}
                  className="w-full py-2.5 px-3.5 text-xs font-semibold border border-gray-100 rounded-xl hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all text-gray-700 text-left flex justify-between items-center cursor-pointer group"
                >
                  <span>Generasikan {preset.grade} A sampai {preset.grade} K</span>
                  <span className="text-[10px] bg-gray-100 text-gray-500 py-0.5 px-2 rounded-full font-bold group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
                    +11 Kelas
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Listing Panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Daftar Kelas Aktif ({classrooms.length})
            </h3>
            
            {/* Search bar */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Cari kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50"
              />
            </div>
          </div>

          {filteredClassrooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-200 rounded-2xl bg-gray-50/30 flex-1">
              <BookOpen className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-500">Tidak ada data kelas</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs text-center leading-normal">
                {searchQuery ? 'Ganti kata kunci pencarian Anda' : 'Gunakan formulir atau generator cepat di samping kiri untuk menginput kelas.'}
              </p>
            </div>
          ) : (
            /* Elegant Grid of Classes with rich info and progress bars */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[560px] pr-1">
              {filteredClassrooms.map((room) => {
                const totalJp = getClassroomTotalJp(room.id);
                const capacity = getClassroomCapacity(room.id);
                const isOverloaded = totalJp > capacity;
                const fillPercent = capacity > 0 ? Math.min(100, (totalJp / capacity) * 100) : 0;
                
                // Color formatting for class filling capacity
                let progressColor = 'bg-indigo-600';
                let progressBg = 'bg-indigo-50';
                let textColor = 'text-indigo-700';
                let borderStyle = 'border-gray-200/80';
                
                if (isOverloaded) {
                  progressColor = 'bg-red-500';
                  progressBg = 'bg-red-50';
                  textColor = 'text-red-700';
                  borderStyle = 'border-red-200 bg-red-50/5';
                } else if (fillPercent >= 90) {
                  progressColor = 'bg-emerald-500';
                  progressBg = 'bg-emerald-50';
                  textColor = 'text-emerald-700';
                } else if (fillPercent < 60 && totalJp > 0) {
                  progressColor = 'bg-amber-500';
                  progressBg = 'bg-amber-50';
                  textColor = 'text-amber-700';
                }

                return (
                  <div 
                    key={room.id}
                    className={`border ${borderStyle} p-4 rounded-2xl flex flex-col justify-between transition-all group relative hover:border-indigo-200 hover:shadow-xs`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-3 h-3 rounded-full ${progressColor} group-hover:scale-110 transition-transform`}></span>
                          <span className="font-extrabold text-gray-800 font-mono text-base uppercase">
                            {room.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClassroom(room);
                              setActiveModalTab('info');
                            }}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                          >
                            Detail &amp; Batasan
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(room.id)}
                            title={`Hapus Kelas ${room.name}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Wali kelas badge */}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">Wali: <strong className="text-gray-700">{getTeacherName(room.waliKelasId)}</strong></span>
                      </div>
                    </div>

                    {/* Capacity Indicator Gauge */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center text-[10px] font-semibold text-gray-400 mb-1 font-mono">
                        <span>Beban KBM</span>
                        <span className={`font-bold ${textColor}`}>
                          {totalJp} / {capacity} JP
                        </span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${progressBg} overflow-hidden border border-gray-100/50`}>
                        <div 
                          className={`h-full ${progressColor} transition-all duration-500`}
                          style={{ width: `${fillPercent}%` }}
                        ></div>
                      </div>
                      {isOverloaded && (
                        <p className="text-[9px] text-red-600 font-bold mt-1 flex items-center gap-1 font-mono">
                          <AlertCircle className="w-3 h-3 shrink-0" /> Overload! Kapasitas terlewati.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Classroom Detailed slide-over or modal */}
      {selectedClassroom && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-150 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-indigo-600" />
                  Kelas {selectedClassroom.name} — Detail &amp; Aturan
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Atur Wali kelas, inspect beban mengajar, dan kunci slot jam pelajaran khusus untuk kelas ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedClassroom(null);
                  setIsBulkCopyOpen(false);
                  setSelectedTargetClassrooms([]);
                  setBulkSearchQuery('');
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-gray-200 mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveModalTab('info')}
                className={`py-2 px-4 border-b-2 transition-all cursor-pointer ${
                  activeModalTab === 'info'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                Pengaturan Umum
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('workloads')}
                className={`py-2 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'workloads'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>Daftar Pelajaran / KBM</span>
                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-mono text-[10px]">
                  {getClassroomWorkloads(selectedClassroom.id).length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('locks')}
                className={`py-2 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'locks'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>Kunci Jam Khusus Kelas</span>
                <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-mono text-[10px] border border-amber-200">
                  {
                    timeConfig.lockedSlots.filter(
                      s => s.targetClassroomIds?.includes(selectedClassroom.id)
                    ).length
                  }
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 pr-1 min-h-[300px] max-h-[55vh]">
              
              {/* TAB 1: General Info & Settings */}
              {activeModalTab === 'info' && (
                <div className="space-y-6 py-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-indigo-50/30 border border-indigo-150/40 p-4 rounded-xl">
                        <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block mb-1">Status Ketersediaan Kelas</span>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Kelas ini aktif dalam program kurikulum mingguan. Anda dapat merubah nama atau wali kelas untuk mengidentifikasi rombongan belajar di laporan cetak.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="modal-room-name" className="text-xs font-semibold text-gray-700">Nama Rombel / Kelas</label>
                        <input
                          id="modal-room-name"
                          type="text"
                          required
                          value={selectedClassroom.name}
                          onChange={(e) => {
                            const updated = { ...selectedClassroom, name: e.target.value };
                            setSelectedClassroom(updated);
                            onUpdate(updated);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold text-gray-800 uppercase"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="modal-wali-kelas" className="text-xs font-semibold text-gray-700">Wali Kelas</label>
                        <select
                          id="modal-wali-kelas"
                          value={selectedClassroom.waliKelasId || ''}
                          onChange={(e) => {
                            const updated = { ...selectedClassroom, waliKelasId: e.target.value || undefined };
                            setSelectedClassroom(updated);
                            onUpdate(updated);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-gray-700 bg-white"
                        >
                          <option value="">-- Belum Ditunjuk / Kosong --</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl h-fit space-y-4">
                      <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-gray-400" /> Status Analitis
                      </h4>
                      
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-gray-200/50">
                          <span className="text-gray-500">Mata Pelajaran Aktif</span>
                          <span className="font-bold text-gray-800">{getClassroomWorkloads(selectedClassroom.id).length} Mapel</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-gray-200/50">
                          <span className="text-gray-500">Total KBM Terdaftar</span>
                          <span className="font-bold text-gray-800">{getClassroomTotalJp(selectedClassroom.id)} JP / Minggu</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-gray-200/50">
                          <span className="text-gray-500">Kapasitas Maks Belajar</span>
                          <span className="font-bold text-gray-800">{getClassroomCapacity(selectedClassroom.id)} JP</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-gray-500">Kepadatan Belajar</span>
                          <span className={`font-bold ${getClassroomTotalJp(selectedClassroom.id) > getClassroomCapacity(selectedClassroom.id) ? 'text-red-600' : 'text-indigo-600'}`}>
                            {getClassroomCapacity(selectedClassroom.id) > 0 
                              ? Math.round((getClassroomTotalJp(selectedClassroom.id) / getClassroomCapacity(selectedClassroom.id)) * 100) 
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Workloads List for the Class */}
              {activeModalTab === 'workloads' && (
                <div className="space-y-4 py-2">
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-150/50">
                    <span className="text-xs text-gray-500 font-semibold">Berikut adalah daftar kontrak beban belajar KBM yang terjadwal di kelas ini:</span>
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      Total: {getClassroomTotalJp(selectedClassroom.id)} JP / Minggu
                    </span>
                  </div>

                  {getClassroomWorkloads(selectedClassroom.id).length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl bg-gray-50/20">
                      <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-gray-500">Belum ada Mapel di kelas ini</p>
                      <p className="text-[10px] text-gray-400 mt-1">Silakan tambahkan kontrak belajar untuk kelas ini melalui tab &quot;Beban Mengajar (Workloads)&quot;.</p>
                    </div>
                  ) : (
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600">
                            <th className="p-3">Mata Pelajaran</th>
                            <th className="p-3">Guru Pengampu</th>
                            <th className="p-3 text-center">Beban (JP / Minggu)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                          {getClassroomWorkloads(selectedClassroom.id).map((w) => {
                            const teacher = teachers.find(t => t.id === w.teacherId);
                            return (
                              <tr key={w.id} className="hover:bg-gray-50/50">
                                <td className="p-3 font-bold text-slate-800">{w.subject}</td>
                                <td className="p-3 text-gray-600">
                                  {teacher ? teacher.name : 'Unknown'}
                                  {teacher && <span className="ml-1.5 text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">{teacher.code}</span>}
                                </td>
                                <td className="p-3 text-center font-bold font-mono text-gray-700">{w.weeklyJp} JP</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Interactive Constraint / Lock Grid specific to this classroom */}
              {activeModalTab === 'locks' && (
                <div className="space-y-4 py-2">
                  <div className="bg-amber-50/50 border border-amber-200/50 p-3.5 rounded-xl text-xs text-amber-900 leading-normal space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      Aturan Penguncian Waktu Khusus Kelas {selectedClassroom.name}
                    </div>
                    <p className="text-amber-800/90">
                      Anda dapat melarang kegiatan KBM diposisikan pada jam tertentu khusus untuk kelas ini (misal karena lab terpakai atau jadwal eksternal).
                      Slot yang <strong>Terkunci Global</strong> (seperti Upacara/Istirahat) dikonfigurasi di tab &quot;Konfigurasi Waktu&quot; dan otomatis tidak dapat digunakan.
                    </p>
                  </div>

                  {/* Legend & Quick Helpers */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-600"></span>
                        <span className="font-semibold text-slate-700">Tersedia KBM</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded bg-red-500 border border-red-600 flex items-center justify-center text-white text-[8px]">
                          <Lock className="w-2.5 h-2.5" />
                        </span>
                        <span className="font-semibold text-slate-700">Dilarang / Terkunci Kelas</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300"></span>
                        <span className="font-semibold text-slate-400">Terkunci Global</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          // Unlock all custom locked slots for this classroom
                          const remaining = timeConfig.lockedSlots.filter(
                            s => !(s.targetClassroomIds?.includes(selectedClassroom.id))
                          );
                          onUpdateTimeConfig({ ...timeConfig, lockedSlots: remaining });
                        }}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-gray-200 rounded text-[10px] font-bold text-slate-600 cursor-pointer transition-all"
                      >
                        Reset Sedia Semua
                      </button>
                    </div>
                  </div>

                  {/* Lock Grid Table */}
                  <div className="overflow-x-auto border border-gray-200 rounded-xl max-h-[350px]">
                    <table className="w-full text-center border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-100 font-bold text-gray-600 border-b border-gray-200 sticky top-0 z-10">
                          <th className="p-2 border-r border-gray-200 w-20">HARI</th>
                          {Array.from({ length: timeConfig.periodsPerDay }).map((_, i) => (
                            <th key={i} className="p-2 border-r border-gray-250">
                              JP {i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeConfig.days.map((day) => (
                          <tr key={day} className="border-b border-gray-150 hover:bg-slate-50/50">
                            <td className="p-2 font-bold text-slate-700 bg-slate-50 border-r border-gray-200">
                              {day}
                            </td>
                            {Array.from({ length: timeConfig.periodsPerDay }).map((_, pIndex) => {
                              
                              // Check if global lock (no targets or empty)
                              const globalLock = timeConfig.lockedSlots.find(
                                s => s.day === day && s.period === pIndex && (!s.targetClassroomIds || s.targetClassroomIds.length === 0)
                              );

                              if (globalLock) {
                                return (
                                  <td 
                                    key={pIndex} 
                                    className="p-1 border-r border-gray-200 bg-slate-100 text-[10px] text-slate-400 align-middle select-none font-mono"
                                    title={`Kunci Global: ${globalLock.reason}`}
                                  >
                                    <div className="line-clamp-1 max-w-[55px] mx-auto leading-tight font-semibold">
                                      {globalLock.reason}
                                    </div>
                                  </td>
                                );
                              }

                              // Check if custom locked slot for this specific classroom
                              const isClassLocked = timeConfig.lockedSlots.some(
                                s => s.day === day && s.period === pIndex && s.targetClassroomIds?.includes(selectedClassroom.id)
                              );

                              return (
                                <td key={pIndex} className="p-1.5 border-r border-gray-150">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      let updatedLockedSlots;
                                      
                                      if (isClassLocked) {
                                        // Remove this classroom from the lock
                                        updatedLockedSlots = timeConfig.lockedSlots.map(s => {
                                          if (s.day === day && s.period === pIndex && s.targetClassroomIds?.includes(selectedClassroom.id)) {
                                            const filteredTargets = s.targetClassroomIds.filter(id => id !== selectedClassroom.id);
                                            return { ...s, targetClassroomIds: filteredTargets };
                                          }
                                          return s;
                                        }).filter(s => !s.targetClassroomIds || s.targetClassroomIds.length > 0 || s.reason !== 'KBM Terkunci'); // Clean up empty locks
                                      } else {
                                        // Check if a lock already exists for this slot but doesn't include our classroom
                                        const existingLockIndex = timeConfig.lockedSlots.findIndex(
                                          s => s.day === day && s.period === pIndex && s.targetClassroomIds && s.targetClassroomIds.length > 0
                                        );

                                        if (existingLockIndex !== -1) {
                                          updatedLockedSlots = [...timeConfig.lockedSlots];
                                          const prevTargets = updatedLockedSlots[existingLockIndex].targetClassroomIds || [];
                                          updatedLockedSlots[existingLockIndex] = {
                                            ...updatedLockedSlots[existingLockIndex],
                                            targetClassroomIds: [...prevTargets, selectedClassroom.id]
                                          };
                                        } else {
                                          // Create brand new class-specific lock
                                          const newLock: LockedSlot = {
                                            day,
                                            period: pIndex,
                                            reason: 'KBM Terkunci',
                                            targetClassroomIds: [selectedClassroom.id]
                                          };
                                          updatedLockedSlots = [...timeConfig.lockedSlots, newLock];
                                        }
                                      }

                                      onUpdateTimeConfig({
                                        ...timeConfig,
                                        lockedSlots: updatedLockedSlots
                                      });
                                    }}
                                    className={`w-full py-2 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                                      isClassLocked
                                        ? 'bg-red-500 hover:bg-red-600 text-white border-red-600 shadow-2xs'
                                        : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                    }`}
                                    title={isClassLocked ? 'Klik untuk bersedia mengajar' : 'Klik untuk mengunci jam ini khusus kelas ini'}
                                  >
                                    {isClassLocked ? (
                                      <Lock className="w-3.5 h-3.5" />
                                    ) : (
                                      <span className="font-extrabold text-[10px]">✓</span>
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bulk Copy Section */}
                  <div className="mt-4 border-t border-gray-150 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsBulkCopyOpen(!isBulkCopyOpen);
                        setSelectedTargetClassrooms([]);
                        setBulkSearchQuery('');
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        {isBulkCopyOpen ? 'Sembunyikan Menu Salin Cepat' : 'Terapkan Aturan Kunci ini ke Kelas Lain (Salin Cepat)...'}
                      </span>
                      <span className="text-[10px] bg-white border border-indigo-200 px-2 py-0.5 rounded-full font-mono font-bold">
                        {isBulkCopyOpen ? 'TUTUP' : 'BUKA'}
                      </span>
                    </button>

                    {isBulkCopyOpen && (
                      <div className="mt-3 bg-slate-50 border border-gray-150 rounded-xl p-3.5 space-y-3 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <p className="text-[11px] font-bold text-gray-700">Pilih Kelas yang Ingin Disamakan Kuncinya:</p>
                            <p className="text-[10px] text-gray-500">Menyalin persis seluruh slot kunci khusus kelas {selectedClassroom.name} ke kelas terpilih.</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => {
                                const otherClassIds = classrooms.filter(c => c.id !== selectedClassroom.id).map(c => c.id);
                                setSelectedTargetClassrooms(otherClassIds);
                              }}
                              className="px-2 py-1 bg-white border border-gray-200 hover:bg-gray-100 text-[10px] font-bold text-gray-600 rounded-md cursor-pointer transition-all"
                            >
                              Pilih Semua
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedTargetClassrooms([])}
                              className="px-2 py-1 bg-white border border-gray-200 hover:bg-gray-100 text-[10px] font-bold text-gray-600 rounded-md cursor-pointer transition-all"
                            >
                              Hapus Pilihan
                            </button>
                          </div>
                        </div>

                        {/* Search bar inside bulk copy */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Cari kelas..."
                            value={bulkSearchQuery}
                            onChange={(e) => setBulkSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-800 placeholder-gray-400"
                          />
                        </div>

                        {/* Classrooms grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto pr-1">
                          {classrooms
                            .filter(c => c.id !== selectedClassroom.id)
                            .filter(c => c.name.toLowerCase().includes(bulkSearchQuery.toLowerCase()))
                            .map(c => {
                              const isChecked = selectedTargetClassrooms.includes(c.id);
                              return (
                                <label
                                  key={c.id}
                                  className={`flex items-center gap-2 p-2 border rounded-lg text-xs cursor-pointer select-none transition-all ${
                                    isChecked
                                      ? 'bg-indigo-50/50 border-indigo-200 font-bold text-indigo-950'
                                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
                                  }`}
                                >
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
                                    className="rounded-sm text-indigo-600 focus:ring-indigo-500/20 w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <span className="font-mono bg-indigo-50 text-[10px] font-bold text-indigo-700 px-1.5 py-0.2 rounded shrink-0">KLS</span>
                                  <span className="truncate">{c.name}</span>
                                </label>
                              );
                            })}
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            disabled={selectedTargetClassrooms.length === 0}
                            onClick={() => {
                              // Execute Classroom copy
                              // 1. Get source classroom locks
                              const sourceLockedSlots = timeConfig.lockedSlots.filter(
                                s => s.targetClassroomIds?.includes(selectedClassroom.id)
                              );

                              // 2. Clear all custom classroom locks for targetClassrooms
                              let updatedLockedSlots = timeConfig.lockedSlots.map(s => {
                                if (s.targetClassroomIds) {
                                  return {
                                    ...s,
                                    targetClassroomIds: s.targetClassroomIds.filter(id => !selectedTargetClassrooms.includes(id))
                                  };
                                }
                                return s;
                              }).filter(s => !s.targetClassroomIds || s.targetClassroomIds.length > 0 || s.reason !== 'KBM Terkunci');

                              // 3. Re-apply locks from source to all selected targetClassrooms
                              sourceLockedSlots.forEach(sourceLock => {
                                const existingIndex = updatedLockedSlots.findIndex(
                                  s => s.day === sourceLock.day && s.period === sourceLock.period && s.targetClassroomIds && s.targetClassroomIds.length > 0
                                );

                                if (existingIndex !== -1) {
                                  const prevTargets = updatedLockedSlots[existingIndex].targetClassroomIds || [];
                                  const uniqueTargets = Array.from(new Set([...prevTargets, ...selectedTargetClassrooms]));
                                  updatedLockedSlots[existingIndex] = {
                                    ...updatedLockedSlots[existingIndex],
                                    targetClassroomIds: uniqueTargets
                                  };
                                } else {
                                  updatedLockedSlots.push({
                                    day: sourceLock.day,
                                    period: sourceLock.period,
                                    reason: sourceLock.reason || 'KBM Terkunci',
                                    targetClassroomIds: [...selectedTargetClassrooms]
                                  });
                                }
                              });

                              onUpdateTimeConfig({
                                ...timeConfig,
                                lockedSlots: updatedLockedSlots
                              });

                              setSelectedTargetClassrooms([]);
                              setIsBulkCopyOpen(false);
                            }}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                              selectedTargetClassrooms.length > 0
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            Salin Kunci ke {selectedTargetClassrooms.length} Kelas Terpilih
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-gray-150 pt-4 mt-4 text-xs">
              <span className="text-gray-400 font-semibold flex items-center gap-1">
                <Info className="w-4 h-4 text-gray-300" />
                Data otomatis terintegrasi ke dalam AI Solver.
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedClassroom(null);
                  setIsBulkCopyOpen(false);
                  setSelectedTargetClassrooms([]);
                  setBulkSearchQuery('');
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Selesai &amp; Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
