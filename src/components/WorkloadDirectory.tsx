import React, { useState } from 'react';
import { Teacher, Classroom, Workload, DayOfWeek } from '../types';
import { Plus, Trash2, Search, Briefcase, AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface WorkloadDirectoryProps {
  workloads: Workload[];
  teachers: Teacher[];
  classrooms: Classroom[];
  activeSchoolDaysCount: number; // e.g. 5
  onAdd: (workload: Omit<Workload, 'id'>) => void;
  onDelete: (id: string) => void;
}

const COMMON_SUBJECTS = [
  'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPA (Sains)', 
  'IPS (Sosial)', 'Pendidikan Agama', 'PPKn', 'Seni Budaya', 
  'PJOK (Olahraga)', 'Informatika', 'Prakarya', 'Bahasa Daerah'
];

export default function WorkloadDirectory({
  workloads,
  teachers,
  classrooms,
  activeSchoolDaysCount,
  onAdd,
  onDelete
}: WorkloadDirectoryProps) {
  // Form States
  const [teacherId, setTeacherId] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [subject, setSubject] = useState('');
  const [weeklyJp, setWeeklyJp] = useState(4);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubjectSelect = (subj: string) => {
    setSubject(subj);
  };

  const getTeacherById = (id: string) => teachers.find(t => t.id === id);
  const getClassroomById = (id: string) => classrooms.find(c => c.id === id);

  // Calculate teacher stats
  const getTeacherWeeklyLimit = (teacher: Teacher) => {
    return teacher.maxJpPerDay * activeSchoolDaysCount;
  };

  const getTeacherCurrentTotalJp = (tId: string) => {
    return workloads
      .filter(w => w.teacherId === tId)
      .reduce((sum, w) => sum + w.weeklyJp, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!teacherId) {
      setError('Harap pilih guru terlebih dahulu.');
      return;
    }
    if (!classroomId) {
      setError('Harap pilih kelas/rombel.');
      return;
    }
    if (!subject.trim()) {
      setError('Harap isi mata pelajaran.');
      return;
    }
    if (weeklyJp < 1 || weeklyJp > 12) {
      setError('Jumlah JP mingguan harus antara 1 sampai 12 JP.');
      return;
    }

    // Check if this teacher is already teaching this exact subject in this exact class
    const isDuplicate = workloads.some(
      w => w.teacherId === teacherId && 
           w.classroomId === classroomId && 
           w.subject.toUpperCase().trim() === subject.toUpperCase().trim()
    );

    if (isDuplicate) {
      setError('Kontrak beban mengajar untuk guru, kelas, dan mapel ini sudah terdaftar.');
      return;
    }

    onAdd({
      teacherId,
      classroomId,
      subject: subject.trim(),
      weeklyJp
    });

    // Reset some form items
    // Keep teacher selected for fast rapid entry if they teach multiple classes
    setSubject('');
    setWeeklyJp(4);
    setError(null);
  };

  // Filtered workloads based on search query
  const filteredWorkloads = workloads.filter(w => {
    const teacher = getTeacherById(w.teacherId);
    const classroom = getClassroomById(w.classroomId);
    
    const query = searchQuery.toLowerCase();
    const teacherName = teacher ? teacher.name.toLowerCase() : '';
    const teacherCode = teacher ? teacher.code.toLowerCase() : '';
    const className = classroom ? classroom.name.toLowerCase() : '';
    const subName = w.subject.toLowerCase();

    return teacherName.includes(query) || 
           teacherCode.includes(query) || 
           className.includes(query) || 
           subName.includes(query);
  });

  // Calculate total workloads allocated
  const totalWorkloadJp = workloads.reduce((sum, w) => sum + w.weeklyJp, 0);

  // Group workloads for warnings
  const teacherWarningList = teachers.map(teacher => {
    const current = getTeacherCurrentTotalJp(teacher.id);
    const maxAllowed = getTeacherWeeklyLimit(teacher);
    return {
      teacher,
      current,
      maxAllowed,
      exceeded: current > maxAllowed
    };
  }).filter(item => item.exceeded);

  return (
    <div id="workload-directory-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Form Panel */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            Alokasi Beban Mengajar (Kontrak)
          </h3>

          {teachers.length === 0 || classrooms.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4.5 h-4.5 text-amber-600" />
                Data Master Belum Lengkap!
              </div>
              <p className="leading-relaxed">
                Anda harus mengisi minimal <strong>1 Data Guru</strong> dan <strong>1 Data Kelas</strong> sebelum membuat kontrak kerja mengajar.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span className="text-xs text-red-800 leading-normal">{error}</span>
                </div>
              )}

              {/* Teacher Selector */}
              <div className="space-y-1">
                <label htmlFor="select-teacher" className="text-xs font-semibold text-gray-700">Pilih Guru</label>
                <select
                  id="select-teacher"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-gray-800"
                >
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map((t) => {
                    const currentTotal = getTeacherCurrentTotalJp(t.id);
                    const weeklyLimit = getTeacherWeeklyLimit(t);
                    return (
                      <option key={t.id} value={t.id}>
                        [{t.code}] {t.name} (Tersisa: {weeklyLimit - currentTotal} / {weeklyLimit} JP)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Classroom Selector */}
              <div className="space-y-1">
                <label htmlFor="select-classroom" className="text-xs font-semibold text-gray-700">Pilih Kelas / Rombel</label>
                <select
                  id="select-classroom"
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-gray-800"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classrooms.map((c) => {
                    // Calculate total classroom JP
                    const classJp = workloads.filter(w => w.classroomId === c.id).reduce((sum, w) => sum + w.weeklyJp, 0);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} (Terisi: {classJp} JP)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Subject Input */}
              <div className="space-y-1">
                <label htmlFor="input-subject" className="text-xs font-semibold text-gray-700">Mata Pelajaran</label>
                <input
                  id="input-subject"
                  type="text"
                  required
                  placeholder="Ketik mata pelajaran..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold text-gray-800 placeholder-gray-400"
                />
                
                {/* Auto-suggest badges */}
                <div className="mt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Rekomendasi Cepat:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {COMMON_SUBJECTS.map((subj) => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => handleSubjectSelect(subj)}
                        className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                          subject === subj
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Weekly JP Count */}
              <div className="space-y-1">
                <label htmlFor="input-weekly-jp" className="text-xs font-semibold text-gray-700">Jumlah JP Mingguan</label>
                <div className="flex items-center gap-3">
                  <input
                    id="input-weekly-jp"
                    type="number"
                    min="1"
                    max="12"
                    value={weeklyJp}
                    onChange={(e) => setWeeklyJp(parseInt(e.target.value) || 1)}
                    className="w-24 px-3 py-2 rounded-xl border border-gray-200 text-center font-bold text-gray-800 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="text-xs text-gray-500 font-medium">JP per Minggu</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Berapa jam pelajaran dalam seminggu guru mengajar mapel ini di kelas ini.
                </p>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambahkan Kontrak Kerja
              </button>
            </form>
          )}
        </div>

        {/* Live warnings / overload notifications */}
        {teacherWarningList.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Peringatan Kelebihan Beban!
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {teacherWarningList.map(({ teacher, current, maxAllowed }) => (
                <div key={teacher.id} className="text-xs text-amber-900 bg-white/70 p-2.5 rounded-lg border border-amber-100">
                  Guru <strong>[{teacher.code}] {teacher.name}</strong> ditugaskan mengajar <strong>{current} JP</strong> seminggu, melebihi kapasitas kerja logis maksimalnya (<strong>{maxAllowed} JP</strong>).
                  <p className="text-[10px] text-amber-700 mt-1">
                    Kalkulasi: {teacher.maxJpPerDay} JP/hari × {activeSchoolDaysCount} hari aktif = {maxAllowed} JP.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right List Panel */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Daftar Beban Mengajar ({workloads.length})
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Total Alokasi Pembelajaran Terdaftar: <strong className="text-indigo-600 font-mono">{totalWorkloadJp} JP</strong>
            </p>
          </div>
          
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Cari guru, kelas, mapel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50"
            />
          </div>
        </div>

        {filteredWorkloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/30 flex-1">
            <Briefcase className="w-10 h-10 text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-500">Tidak ada data kontrak mengajar</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">
              {searchQuery ? 'Ganti kata kunci pencarian Anda' : 'Gunakan formulir di sebelah kiri untuk menjodohkan guru dengan kelas.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Workload Card List */}
            <div className="block md:hidden space-y-3">
              {filteredWorkloads.map((wl) => {
                const teacher = getTeacherById(wl.teacherId);
                const classroom = getClassroomById(wl.classroomId);
                return (
                  <div key={wl.id} className="bg-slate-50 border border-gray-150 p-4 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-mono font-black text-indigo-700 shrink-0">
                        {teacher ? teacher.code : '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-mono">
                            {classroom ? classroom.name : 'Kelas terhapus'}
                          </span>
                          <span className="font-bold text-xs text-gray-900 truncate">
                            {wl.subject}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {teacher ? teacher.name : 'Guru terhapus'}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono">
                          {wl.weeklyJp} JP / Minggu
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(wl.id)}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 flex items-center justify-center border border-red-100/50"
                      title="Hapus Kontrak Mengajar"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-600 border-b border-gray-200">
                    <th className="p-4 w-20 text-center border-r border-gray-200">KODE</th>
                    <th className="p-4">NAMA GURU</th>
                    <th className="p-4">MAPEL</th>
                    <th className="p-4">KELAS</th>
                    <th className="p-4 text-center">MINGGUAN (JP)</th>
                    <th className="p-4 w-16 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredWorkloads.map((wl) => {
                    const teacher = getTeacherById(wl.teacherId);
                    const classroom = getClassroomById(wl.classroomId);
                    return (
                      <tr key={wl.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 text-center font-mono font-bold text-xs text-indigo-700 bg-indigo-50/20 border-r border-gray-100">
                          {teacher ? teacher.code : '?'}
                        </td>
                        <td className="p-4 font-semibold text-gray-800">
                          {teacher ? teacher.name : 'Guru terhapus'}
                        </td>
                        <td className="p-4 text-gray-700 font-medium">
                          {wl.subject}
                        </td>
                        <td className="p-4 font-bold text-gray-700 font-mono">
                          {classroom ? classroom.name : 'Kelas terhapus'}
                        </td>
                        <td className="p-4 text-center font-mono">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {wl.weeklyJp} JP
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => onDelete(wl.id)}
                            title="Hapus Kontrak Mengajar"
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
