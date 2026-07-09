import React, { useState } from 'react';
import { Teacher, TimeConfig } from '../types';
import { Plus, Minus, Trash2, Search, Users, AlertTriangle, CheckCircle, ShieldAlert, Clock, Lock, X } from 'lucide-react';

interface TeacherDirectoryProps {
  teachers: Teacher[];
  timeConfig: TimeConfig;
  onAdd: (teacher: Omit<Teacher, 'id'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (teacher: Teacher) => void;
}

export default function TeacherDirectory({ teachers, timeConfig, onAdd, onDelete, onUpdate }: TeacherDirectoryProps) {
  // Modal for teacher schedule constraints
  const [selectedTeacherForRest, setSelectedTeacherForRest] = useState<Teacher | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [code, setCode] = useState('');
  const [maxJpPerDay, setMaxJpPerDay] = useState(10);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  
  // Error states
  const [error, setError] = useState<string | null>(null);

  // Check if teacher code already exists
  const isCodeDuplicate = (checkedCode: string) => {
    return teachers.some(t => t.code.toUpperCase().trim() === checkedCode.toUpperCase().trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanNip = nip.trim() || '-';
    const cleanCode = code.trim().toUpperCase();

    if (!cleanName) {
      setError('Nama guru tidak boleh kosong.');
      return;
    }
    if (!cleanCode) {
      setError('Kode unik guru wajib diisi.');
      return;
    }
    if (isCodeDuplicate(cleanCode)) {
      setError(`Kode unik guru "${cleanCode}" sudah digunakan oleh guru lain.`);
      return;
    }
    if (maxJpPerDay < 1 || maxJpPerDay > 14) {
      setError('Batas maksimal mengajar harus antara 1 sampai 14 JP per hari.');
      return;
    }

    onAdd({
      name: cleanName,
      nip: cleanNip,
      code: cleanCode,
      maxJpPerDay
    });

    // Reset form
    setName('');
    setNip('');
    setCode('');
    setMaxJpPerDay(10);
    setError(null);
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.nip.includes(searchQuery) ||
    t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="teacher-directory-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Input Form */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs h-fit">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-indigo-600" />
          Tambah Guru Baru
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <span className="text-xs text-red-800 leading-normal">{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="teacher-name" className="text-xs font-semibold text-gray-700">Nama Lengkap Guru</label>
            <input
              id="teacher-name"
              type="text"
              required
              placeholder="Contoh: Drs. H. Ahmad Sudrajat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-gray-800 placeholder-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="teacher-code" className="text-xs font-semibold text-gray-700">Kode Unik Guru</label>
              <input
                id="teacher-code"
                type="text"
                required
                placeholder="Contoh: 02, AS"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-hidden text-sm font-semibold uppercase ${
                  code && isCodeDuplicate(code)
                    ? 'border-red-300 bg-red-50/20 focus:ring-red-500/10'
                    : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
              />
              {code && isCodeDuplicate(code) && (
                <p className="text-[10px] text-red-600 mt-1 font-semibold">Kode sudah terpakai!</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="teacher-nip" className="text-xs font-semibold text-gray-700">NIP (Opsional)</label>
              <input
                id="teacher-nip"
                type="text"
                placeholder="Contoh: 198203..."
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-gray-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="max-jp" className="text-xs font-semibold text-gray-700">Batas Maks mengajar per Hari</label>
            <div className="flex items-center gap-3">
              <input
                id="max-jp"
                type="number"
                min="1"
                max="14"
                value={maxJpPerDay}
                onChange={(e) => setMaxJpPerDay(parseInt(e.target.value) || 0)}
                className="w-24 px-3 py-2 rounded-xl border border-gray-200 text-center font-bold text-gray-800 text-sm focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="text-xs text-gray-500 font-medium">Jam Pelajaran (JP) / hari</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              Penting demi kesehatan fisik guru agar tidak mengajar terlalu padat dalam sehari.
            </p>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Simpan Data Guru
          </button>
        </form>
      </div>

      {/* Right Columns: Directory List */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Daftar Guru Terdaftar ({teachers.length})
          </h3>
          
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Cari guru, kode, NIP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50"
            />
          </div>
        </div>

        {filteredTeachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
            <Users className="w-10 h-10 text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-500">Tidak ada data guru</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">
              {searchQuery ? 'Ganti kata kunci pencarian Anda' : 'Gunakan formulir di samping kiri untuk menginput guru.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Card List */}
            <div className="block md:hidden space-y-3">
              {filteredTeachers.map((teacher) => (
                <div key={teacher.id} className="bg-slate-50 border border-gray-150 p-4 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-mono font-black text-indigo-700 shrink-0">
                      {teacher.code}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-gray-900 truncate">{teacher.name}</h4>
                      <p className="text-[10px] text-gray-500 font-mono">NIP: {teacher.nip}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <div className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 rounded-lg px-1 py-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (teacher.maxJpPerDay > 1) {
                                onUpdate({ ...teacher, maxJpPerDay: teacher.maxJpPerDay - 1 });
                              }
                            }}
                            className="p-0.5 rounded-md hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                            title="Kurangi"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-[10px] font-bold text-indigo-900 font-mono min-w-[52px] text-center">
                            Maks {teacher.maxJpPerDay} JP
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdate({ ...teacher, maxJpPerDay: teacher.maxJpPerDay + 1 });
                            }}
                            className="p-0.5 rounded-md hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                            title="Tambah"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedTeacherForRest(teacher)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                            teacher.unavailableSlots && teacher.unavailableSlots.length > 0
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          <span>
                            {teacher.unavailableSlots && teacher.unavailableSlots.length > 0
                              ? `${teacher.unavailableSlots.length} Libur`
                              : 'Atur Libur'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(teacher.id)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 flex items-center justify-center border border-red-100/50"
                    title="Hapus Guru"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-600 border-b border-gray-200">
                    <th className="p-4 w-20 text-center border-r border-gray-200">KODE</th>
                    <th className="p-4">NAMA GURU</th>
                    <th className="p-4">NIP</th>
                    <th className="p-4 text-center">BATAS MAX (JP/HARI)</th>
                    <th className="p-4 text-center">BATASAN JADWAL (aSc)</th>
                    <th className="p-4 w-16 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-center font-mono font-bold text-xs text-indigo-700 bg-indigo-50/20 border-r border-gray-100">
                        {teacher.code}
                      </td>
                      <td className="p-4 font-semibold text-gray-800">
                        {teacher.name}
                      </td>
                      <td className="p-4 text-xs font-mono text-gray-500">
                        {teacher.nip}
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 justify-center mx-auto w-fit">
                          <button
                            type="button"
                            onClick={() => {
                              if (teacher.maxJpPerDay > 1) {
                                onUpdate({ ...teacher, maxJpPerDay: teacher.maxJpPerDay - 1 });
                              }
                            }}
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            title="Kurangi Batas JP"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-12 text-center text-xs font-bold text-gray-800 font-mono">
                            {teacher.maxJpPerDay} JP
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdate({ ...teacher, maxJpPerDay: teacher.maxJpPerDay + 1 });
                            }}
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            title="Tambah Batas JP"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedTeacherForRest(teacher)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            teacher.unavailableSlots && teacher.unavailableSlots.length > 0
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {teacher.unavailableSlots && teacher.unavailableSlots.length > 0
                              ? `${teacher.unavailableSlots.length} JP Libur`
                              : 'Atur Berhalangan'}
                          </span>
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => onDelete(teacher.id)}
                          title="Hapus Guru"
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* aSc TimeTables-style Interactive Unavailable Slots Modal */}
      {selectedTeacherForRest && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Batasan Libur / Berhalangan Mengajar
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Atur jam berhalangan untuk guru <strong className="text-indigo-600">{selectedTeacherForRest.name}</strong> (Kode: {selectedTeacherForRest.code}).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTeacherForRest(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Legend and Helpers */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl mb-4 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 border border-emerald-600"></span>
                  <span className="font-semibold text-slate-700">Sedia / Bisa Mengajar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-red-500 border border-red-600 flex items-center justify-center text-[8px] text-white">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                  <span className="font-semibold text-slate-700">Libur / Berhalangan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-slate-200 border border-slate-300"></span>
                  <span className="font-semibold text-slate-400">Terkunci Global</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...selectedTeacherForRest, unavailableSlots: [] };
                    setSelectedTeacherForRest(updated);
                    onUpdate(updated);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-gray-200 rounded-lg text-[10px] font-bold text-slate-600 cursor-pointer"
                >
                  Sedia Semua
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allSlots: { day: string; period: number }[] = [];
                    timeConfig.days.forEach(day => {
                      for (let p = 0; p < timeConfig.periodsPerDay; p++) {
                        const isGlobalLock = timeConfig.lockedSlots.some(s => s.day === day && s.period === p && (!s.targetClassroomIds || s.targetClassroomIds.length === 0));
                        if (!isGlobalLock) {
                          allSlots.push({ day, period: p });
                        }
                      }
                    });
                    const updated = { ...selectedTeacherForRest, unavailableSlots: allSlots };
                    setSelectedTeacherForRest(updated);
                    onUpdate(updated);
                  }}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg text-[10px] font-bold text-rose-700 cursor-pointer"
                >
                  Liburkan Semua
                </button>
              </div>
            </div>

            {/* Grid Interactive Table */}
            <div className="overflow-auto border border-gray-200 rounded-xl flex-1 max-h-[50vh]">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-[10px] font-bold text-gray-600 border-b border-gray-200 sticky top-0 z-10">
                    <th className="p-2 border-r border-gray-200 w-20">HARI</th>
                    {Array.from({ length: timeConfig.periodsPerDay }).map((_, i) => (
                      <th key={i} className="p-2 border-r border-gray-200">
                        JP {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeConfig.days.map((day) => (
                    <tr key={day} className="border-b border-gray-150 hover:bg-slate-50/50">
                      <td className="p-2 text-xs font-bold text-slate-700 bg-slate-50 border-r border-gray-200">
                        {day}
                      </td>
                      {Array.from({ length: timeConfig.periodsPerDay }).map((_, pIndex) => {
                        // Check if global lock (no targets or empty)
                        const globalLock = timeConfig.lockedSlots.find(
                          (s) => s.day === day && s.period === pIndex && (!s.targetClassroomIds || s.targetClassroomIds.length === 0)
                        );
                        
                        if (globalLock) {
                          return (
                            <td
                              key={pIndex}
                              className="p-1 border-r border-gray-150 bg-slate-100 text-[9px] text-slate-400 font-mono align-middle select-none"
                              title={`Global: ${globalLock.reason}`}
                            >
                              <div className="line-clamp-1 max-w-[50px] mx-auto text-slate-400 leading-tight">
                                {globalLock.reason}
                              </div>
                            </td>
                          );
                        }

                        // Check if teacher unavailable
                        const isUnavailable = (selectedTeacherForRest.unavailableSlots || []).some(
                          (s) => s.day === day && s.period === pIndex
                        );

                        return (
                          <td key={pIndex} className="p-1.5 border-r border-gray-150">
                            <button
                              type="button"
                              onClick={() => {
                                const currentSlots = selectedTeacherForRest.unavailableSlots || [];
                                const isLocked = currentSlots.some(s => s.day === day && s.period === pIndex);
                                let updatedSlots;
                                if (isLocked) {
                                  updatedSlots = currentSlots.filter(s => !(s.day === day && s.period === pIndex));
                                } else {
                                  updatedSlots = [...currentSlots, { day, period: pIndex }];
                                }
                                const updated = { ...selectedTeacherForRest, unavailableSlots: updatedSlots };
                                setSelectedTeacherForRest(updated);
                                onUpdate(updated);
                              }}
                              className={`w-full py-2 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                                isUnavailable
                                  ? 'bg-red-500 hover:bg-red-600 text-white border-red-600'
                                  : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600'
                              }`}
                              title={isUnavailable ? 'Klik untuk bersedia' : 'Klik untuk jadwalkan berhalangan'}
                            >
                              {isUnavailable ? (
                                <Lock className="w-3.5 h-3.5" />
                              ) : (
                                <span className="text-[10px] font-black">✓</span>
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

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
              <span className="text-[11px] text-gray-500 font-medium">
                Sistem secara otomatis menyimpan perubahan ke database lokal.
              </span>
              <button
                type="button"
                onClick={() => setSelectedTeacherForRest(null)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
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
