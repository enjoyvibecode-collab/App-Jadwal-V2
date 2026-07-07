import React, { useState } from 'react';
import { TimeConfig, Teacher, Classroom, Workload, TimetableResult } from '../types';
import { Printer, Calendar, Users, BookOpen, Clock, Lock, FileText, Check, Info } from 'lucide-react';

interface PrintReportsProps {
  timeConfig: TimeConfig;
  teachers: Teacher[];
  classrooms: Classroom[];
  workloads: Workload[];
  timetableResult: TimetableResult | null;
}

export default function PrintReports({
  timeConfig,
  teachers,
  classrooms,
  workloads,
  timetableResult
}: PrintReportsProps) {
  // Printing settings state
  const [printType, setPrintType] = useState<'master' | 'class' | 'teacher'>('class');
  const [scope, setScope] = useState<'single' | 'all'>('single');
  const [selectedClassId, setSelectedClassId] = useState<string>(classrooms[0]?.id || '');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [dateStr, setDateStr] = useState<string>('5 Juli 2026');

  // Custom Logo and KOP Text states
  const [logoKiri, setLogoKiri] = useState<string>(() => localStorage.getItem('print_logo_kiri') || '');
  const [logoKanan, setLogoKanan] = useState<string>(() => localStorage.getItem('print_logo_kanan') || '');
  
  const [kopPemerintah, setKopPemerintah] = useState<string>(() => localStorage.getItem('print_kop_pemerintah') || 'PEMERINTAH DAERAH KABUPATEN TASIKMALAYA');
  const [kopDinas, setKopDinas] = useState<string>(() => localStorage.getItem('print_kop_dinas') || 'DINAS PENDIDIKAN DAN KEBUDAYAAN');
  const [kopSekolah, setKopSekolah] = useState<string>(() => localStorage.getItem('print_kop_sekolah') || 'SMP NEGERI 1 MANONJAYA');
  const [kopAlamat, setKopAlamat] = useState<string>(() => localStorage.getItem('print_kop_alamat') || 'Jalan K.H.A. Ahmad Dahlan No. 1 Manonjaya, Tasikmalaya, Jawa Barat, Pos 46191');
  const [kopKontak, setKopKontak] = useState<string>(() => localStorage.getItem('print_kop_kontak') || 'E-Mail: mail@smpn1manonjaya-tsm.sch.id | Website: www.smpn1manonjaya-tsm.sch.id');

  // Custom Signatures states
  const [kepsekNama, setKepsekNama] = useState<string>(() => localStorage.getItem('print_kepsek_nama') || 'ASEP NURULLOH, S.Pd, M.M.');
  const [kepsekNip, setKepsekNip] = useState<string>(() => localStorage.getItem('print_kepsek_nip') || '19780112 200801 1003');
  const [kepsekJabatan, setKepsekJabatan] = useState<string>(() => localStorage.getItem('print_kepsek_jabatan') || 'Kepala Sekolah SMPN 1 Manonjaya');
  const [wakasekNama, setWakasekNama] = useState<string>(() => localStorage.getItem('print_wakasek_nama') || 'NURUL AMALIAH, S.E, M.Pd.');
  const [wakasekNip, setWakasekNip] = useState<string>(() => localStorage.getItem('print_wakasek_nip') || '19770321 200801 2005');
  const [wakasekJabatan, setWakasekJabatan] = useState<string>(() => localStorage.getItem('print_wakasek_jabatan') || 'Wakasek Bidang Kurikulum');

  const [showKopSettings, setShowKopSettings] = useState<boolean>(false);

  const handleLogoKiriChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoKiri(base64);
        localStorage.setItem('print_logo_kiri', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoKananChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoKanan(base64);
        localStorage.setItem('print_logo_kanan', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveKopText = (field: string, value: string) => {
    localStorage.setItem(`print_kop_${field}`, value);
  };

  const handleSaveSignature = (field: string, value: string) => {
    localStorage.setItem(`print_${field}`, value);
  };

  const handleResetKop = () => {
    setLogoKiri('');
    setLogoKanan('');
    setKopPemerintah('PEMERINTAH DAERAH KABUPATEN TASIKMALAYA');
    setKopDinas('DINAS PENDIDIKAN DAN KEBUDAYAAN');
    setKopSekolah('SMP NEGERI 1 MANONJAYA');
    setKopAlamat('Jalan K.H.A. Ahmad Dahlan No. 1 Manonjaya, Tasikmalaya, Jawa Barat, Pos 46191');
    setKopKontak('E-Mail: mail@smpn1manonjaya-tsm.sch.id | Website: www.smpn1manonjaya-tsm.sch.id');

    setKepsekNama('ASEP NURULLOH, S.Pd, M.M.');
    setKepsekNip('19780112 200801 1003');
    setKepsekJabatan('Kepala Sekolah SMPN 1 Manonjaya');
    setWakasekNama('NURUL AMALIAH, S.E, M.Pd.');
    setWakasekNip('19770321 200801 2005');
    setWakasekJabatan('Wakasek Bidang Kurikulum');

    localStorage.removeItem('print_logo_kiri');
    localStorage.removeItem('print_logo_kanan');
    localStorage.removeItem('print_kop_pemerintah');
    localStorage.removeItem('print_kop_dinas');
    localStorage.removeItem('print_kop_sekolah');
    localStorage.removeItem('print_kop_alamat');
    localStorage.removeItem('print_kop_kontak');

    localStorage.removeItem('print_kepsek_nama');
    localStorage.removeItem('print_kepsek_nip');
    localStorage.removeItem('print_kepsek_jabatan');
    localStorage.removeItem('print_wakasek_nama');
    localStorage.removeItem('print_wakasek_nip');
    localStorage.removeItem('print_wakasek_jabatan');
  };

  const getTeacherById = (id: string) => teachers.find(t => t.id === id);
  const getClassroomById = (id: string) => classrooms.find(c => c.id === id);

  const handlePrint = () => {
    const originalTitle = document.title;
    let customTitle = 'Jadwal_Laporan';

    if (printType === 'master') {
      customTitle = 'Jadwal_Induk_Lengkap_SMPN_1_Manonjaya';
    } else if (printType === 'class') {
      if (scope === 'single') {
        const cls = getClassroomById(selectedClassId);
        const className = cls ? cls.name : 'Kelas';
        // Clean up any non-alphanumeric/hyphen/underscore characters for safe filenames
        const cleanName = className.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        customTitle = `Jadwal_Kelas_${cleanName}`;
      } else {
        customTitle = 'Jadwal_Seluruh_Kelas_SMPN_1_Manonjaya';
      }
    } else if (printType === 'teacher') {
      if (scope === 'single') {
        const teacher = getTeacherById(selectedTeacherId);
        const teacherName = teacher ? teacher.name : 'Guru';
        const teacherCode = teacher ? teacher.code : '';
        const cleanName = teacherName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        const suffix = teacherCode ? `_Kode_${teacherCode}` : '';
        customTitle = `Jadwal_Guru_${cleanName}${suffix}`;
      } else {
        customTitle = 'Jadwal_Seluruh_Guru_SMPN_1_Manonjaya';
      }
    }

    // Temporarily change document.title so PDF save name matches
    document.title = customTitle;
    window.print();

    // Revert back to original title after print window finishes drawing
    setTimeout(() => {
      document.title = originalTitle;
    }, 200);
  };

  if (!timetableResult) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xs text-center space-y-4">
        <Printer className="w-12 h-12 text-gray-300 mx-auto" />
        <h3 className="text-lg font-bold text-gray-700">Jadwal Pelajaran Belum Digenerasikan</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Silakan masuk ke tab <strong>"Mesin Generator (AI Solver)"</strong> terlebih dahulu dan jalankan penyusunan jadwal otomatis sebelum mencetak laporan resmi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration controls panel (Hidden during browser printing) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4 print:hidden">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Printer className="w-5.5 h-5.5 text-indigo-600" />
            Format Cetak Laporan Resmi (A4 Ready)
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Konfigurasikan tata letak, kop surat, dan tanda tangan resmi lembaga sebelum mencetak jadwal ke dokumen fisik atau PDF.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Format Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Format Laporan</label>
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200 gap-1">
              <button
                type="button"
                onClick={() => {
                  setPrintType('master');
                  setScope('single');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                  printType === 'master'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Jadwal Induk
              </button>
              <button
                type="button"
                onClick={() => setPrintType('class')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                  printType === 'class'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Per Kelas
              </button>
              <button
                type="button"
                onClick={() => setPrintType('teacher')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                  printType === 'teacher'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Per Guru
              </button>
            </div>
          </div>

          {/* Scope Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Cakupan Dokumen</label>
            {printType === 'master' ? (
              <div className="px-3 py-2 bg-gray-50 border border-gray-200/50 rounded-xl text-xs text-gray-500 font-bold h-[34px] flex items-center justify-center">
                Matriks Tunggal
              </div>
            ) : (
              <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setScope('single')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    scope === 'single'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Satu Lembar
                </button>
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    scope === 'all'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Semua Sekaligus
                </button>
              </div>
            )}
          </div>

          {/* Filter Dropdown (Only if single scope) */}
          {scope === 'single' && printType !== 'master' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                {printType === 'class' ? 'Pilih Rombel / Kelas' : 'Pilih Guru'}
              </label>
              {printType === 'class' ? (
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>[{t.code}] {t.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Date Picker Input */}
          <div className="space-y-1">
            <label htmlFor="print-date" className="text-xs font-semibold text-gray-700">Titimangsa Tanggal Cetak</label>
            <input
              id="print-date"
              type="text"
              placeholder="Contoh: 5 Juli 2026"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Expandable settings accordion for Kop and Logos customization */}
        <div className="border border-gray-200/80 rounded-2xl overflow-hidden bg-slate-50/40">
          <button
            type="button"
            onClick={() => setShowKopSettings(!showKopSettings)}
            className="w-full flex items-center justify-between p-4 text-xs font-bold text-gray-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">⚙️</span>
              <span>Kustomisasi Kop Surat & Logo Laporan</span>
            </div>
            <span className="text-indigo-600 font-semibold text-[10px]">
              {showKopSettings ? 'Sembunyikan Pengaturan ▲' : 'Kustomisasi KOP & Logo ▼'}
            </span>
          </button>

          {showKopSettings && (
            <div className="p-4 border-t border-gray-200/80 bg-white space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Logo Kiri */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-gray-700 block">Logo Kiri (Pemerintah Daerah / KOP Kiri)</label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                      {logoKiri ? (
                        <img src={logoKiri} alt="Kiri Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="text-[10px] text-gray-400 font-bold">Bawaan</div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoKiriChange}
                        className="block w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />
                      <p className="text-[9px] text-gray-400">Unggah file gambar (PNG, JPG, SVG)</p>
                    </div>
                  </div>
                </div>

                {/* Logo Kanan */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-gray-700 block">Logo Kanan (Sekolah / KOP Kanan)</label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                      {logoKanan ? (
                        <img src={logoKanan} alt="Kanan Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="text-[10px] text-gray-400 font-bold">Bawaan</div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoKananChange}
                        className="block w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />
                      <p className="text-[9px] text-gray-400">Unggah file gambar (PNG, JPG, SVG)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-gray-100">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block">Kop Baris 1 (Pemerintah)</label>
                  <input
                    type="text"
                    value={kopPemerintah}
                    onChange={(e) => {
                      setKopPemerintah(e.target.value);
                      handleSaveKopText('pemerintah', e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-800"
                    placeholder="Contoh: PEMERINTAH DAERAH KABUPATEN TASIKMALAYA"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block">Kop Baris 2 (Dinas)</label>
                  <input
                    type="text"
                    value={kopDinas}
                    onChange={(e) => {
                      setKopDinas(e.target.value);
                      handleSaveKopText('dinas', e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-800"
                    placeholder="Contoh: DINAS PENDIDIKAN DAN KEBUDAYAAN"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block">Kop Baris 3 (Nama Lembaga)</label>
                  <input
                    type="text"
                    value={kopSekolah}
                    onChange={(e) => {
                      setKopSekolah(e.target.value);
                      handleSaveKopText('sekolah', e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800"
                    placeholder="Contoh: SMP NEGERI 1 MANONJAYA"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block">Kop Baris 4 (Alamat Lengkap)</label>
                  <input
                    type="text"
                    value={kopAlamat}
                    onChange={(e) => {
                      setKopAlamat(e.target.value);
                      handleSaveKopText('alamat', e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-800"
                    placeholder="Contoh: Jalan K.H.A. Ahmad Dahlan No. 1 Manonjaya..."
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-semibold text-gray-700 block">Kop Baris 5 (Kontak / E-Mail / Website)</label>
                  <input
                    type="text"
                    value={kopKontak}
                    onChange={(e) => {
                      setKopKontak(e.target.value);
                      handleSaveKopText('kontak', e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-800"
                    placeholder="Contoh: E-Mail: mail@smpn1manonjaya-tsm.sch.id | Website: www.smpn1manonjaya-tsm.sch.id"
                  />
                </div>
              </div>

              {/* Tanda Tangan Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3.5 border-t border-gray-100">
                <div className="md:col-span-2">
                  <h4 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <span>✍️</span> Kustomisasi Pejabat Tanda Tangan (Laporan)
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Atur nama, NIP, serta jabatan Kepala Sekolah dan Wakasek Kurikulum untuk dicetak di bagian bawah laporan.</p>
                </div>

                {/* Kepala Sekolah */}
                <div className="p-3 bg-slate-50/50 rounded-xl border border-gray-100 space-y-2">
                  <div className="font-bold text-[10px] text-indigo-950 uppercase tracking-wide">Pihak Kiri (Kepala Sekolah)</div>
                  <div className="space-y-2">
                    <div>
                      <label className="font-semibold text-gray-500 block text-[10px]">Jabatan Kepala Sekolah</label>
                      <input
                        type="text"
                        value={kepsekJabatan}
                        onChange={(e) => {
                          setKepsekJabatan(e.target.value);
                          handleSaveSignature('kepsek_jabatan', e.target.value);
                        }}
                        className="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-800 bg-white"
                        placeholder="Contoh: Kepala Sekolah SMPN 1 Manonjaya"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-500 block text-[10px]">Nama Kepala Sekolah</label>
                      <input
                        type="text"
                        value={kepsekNama}
                        onChange={(e) => {
                          setKepsekNama(e.target.value);
                          handleSaveSignature('kepsek_nama', e.target.value);
                        }}
                        className="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-800 bg-white"
                        placeholder="Contoh: ASEP NURULLOH, S.Pd, M.M."
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-500 block text-[10px]">NIP Kepala Sekolah</label>
                      <input
                        type="text"
                        value={kepsekNip}
                        onChange={(e) => {
                          setKepsekNip(e.target.value);
                          handleSaveSignature('kepsek_nip', e.target.value);
                        }}
                        className="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-800 bg-white font-mono"
                        placeholder="Contoh: 19780112 200801 1003"
                      />
                    </div>
                  </div>
                </div>

                {/* Wakasek Kurikulum */}
                <div className="p-3 bg-slate-50/50 rounded-xl border border-gray-100 space-y-2">
                  <div className="font-bold text-[10px] text-indigo-950 uppercase tracking-wide">Pihak Kanan (Wakasek Kurikulum / Pembuat)</div>
                  <div className="space-y-2">
                    <div>
                      <label className="font-semibold text-gray-500 block text-[10px]">Jabatan Wakasek</label>
                      <input
                        type="text"
                        value={wakasekJabatan}
                        onChange={(e) => {
                          setWakasekJabatan(e.target.value);
                          handleSaveSignature('wakasek_jabatan', e.target.value);
                        }}
                        className="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-800 bg-white"
                        placeholder="Contoh: Wakasek Bidang Kurikulum"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-500 block text-[10px]">Nama Wakasek</label>
                      <input
                        type="text"
                        value={wakasekNama}
                        onChange={(e) => {
                          setWakasekNama(e.target.value);
                          handleSaveSignature('wakasek_nama', e.target.value);
                        }}
                        className="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-800 bg-white"
                        placeholder="Contoh: NURUL AMALIAH, S.E, M.Pd."
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-500 block text-[10px]">NIP Wakasek</label>
                      <input
                        type="text"
                        value={wakasekNip}
                        onChange={(e) => {
                          setWakasekNip(e.target.value);
                          handleSaveSignature('wakasek_nip', e.target.value);
                        }}
                        className="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-800 bg-white font-mono"
                        placeholder="Contoh: 19770321 200801 2005"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetKop}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                >
                  Reset ke Default (Bawaan Sekolah)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-200/80">
          <div className="flex gap-2 text-xs text-gray-500 items-start">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              {printType === 'master'
                ? 'Mencetak Lembar Jadwal Induk Rekapitulasi (Disarankan memilih orientasi Kertas Landscape pada setelan cetak Printer/PDF Anda).'
                : scope === 'all' 
                  ? `Mencetak seluruh ${printType === 'class' ? classrooms.length : teachers.length} halaman secara otomatis dipisahkan per lembar kertas A4.` 
                  : 'Mencetak pratinjau lembar tunggal yang ditampilkan di bawah.'}
            </span>
          </div>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            CETAK JADWAL SEKARANG
          </button>
        </div>
      </div>

      {/* Official CSS injection for custom printer styling */}
      <style>{`
        @media print {
          @page {
            size: ${printType === 'master' ? 'A4 landscape' : 'A4 portrait'};
            margin: ${printType === 'master' ? '0.4cm' : '0.5cm 0.6cm'};
          }
          
          /* Force exact backgrounds and colors on all print engines */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            color: black !important;
          }
          
          /* Hide all non-printable shell layouts */
          header, aside, footer, .print\\:hidden, nav, button, input, select, .no-print {
            display: none !important;
          }

          /* Reset viewport spacing, padding, background */
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
          }

          /* Force layout container elements to fluid block structures */
          .max-w-7xl, .lg\\:grid-cols-4, main, .lg\\:col-span-3 {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            gap: 0 !important;
          }

          /* Page break formatting for elegant pages */
          .print-page {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            background: white !important;
            color: black !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
          
          .print-page:last-child {
            page-break-after: avoid !important;
          }

          /* Force two-column layout grid to remain side-by-side during print */
          .print-grid-two {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 16px !important;
          }

          /* Tighten vertical spacing inside print page */
          .print-page > * + * {
            margin-top: 0.5rem !important;
          }

          /* Elegant tables styling for physical layouts */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          
          th, td {
            border: 1px solid black !important;
            color: black !important;
          }

          /* Avoid breaking signature lines across pages */
          .break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Print Preview Container (Styled with white sheet look) */}
      <div className="space-y-8 print:space-y-0">
        {/* Render Single or Multi pages based on state */}
        {printType === 'master' ? (
          <MasterPrintSheet 
            timeConfig={timeConfig}
            timetableResult={timetableResult}
            classrooms={classrooms}
            teachers={teachers}
            workloads={workloads}
            dateStr={dateStr}
            logoKiri={logoKiri}
            logoKanan={logoKanan}
            kopPemerintah={kopPemerintah}
            kopDinas={kopDinas}
            kopSekolah={kopSekolah}
            kopAlamat={kopAlamat}
            kopKontak={kopKontak}
            kepsekNama={kepsekNama}
            kepsekNip={kepsekNip}
            kepsekJabatan={kepsekJabatan}
            wakasekNama={wakasekNama}
            wakasekNip={wakasekNip}
            wakasekJabatan={wakasekJabatan}
          />
        ) : printType === 'class' ? (
          // CLASSROOM REPORTS
          scope === 'single' ? (
            classrooms.filter(c => c.id === selectedClassId).map(c => (
              <ClassroomPrintSheet 
                key={c.id}
                classroom={c}
                timeConfig={timeConfig}
                timetableResult={timetableResult}
                teachers={teachers}
                dateStr={dateStr}
                logoKiri={logoKiri}
                logoKanan={logoKanan}
                kopPemerintah={kopPemerintah}
                kopDinas={kopDinas}
                kopSekolah={kopSekolah}
                kopAlamat={kopAlamat}
                kopKontak={kopKontak}
                kepsekNama={kepsekNama}
                kepsekNip={kepsekNip}
                kepsekJabatan={kepsekJabatan}
                wakasekNama={wakasekNama}
                wakasekNip={wakasekNip}
                wakasekJabatan={wakasekJabatan}
              />
            ))
          ) : (
            classrooms.map(c => (
              <ClassroomPrintSheet 
                key={c.id}
                classroom={c}
                timeConfig={timeConfig}
                timetableResult={timetableResult}
                teachers={teachers}
                dateStr={dateStr}
                logoKiri={logoKiri}
                logoKanan={logoKanan}
                kopPemerintah={kopPemerintah}
                kopDinas={kopDinas}
                kopSekolah={kopSekolah}
                kopAlamat={kopAlamat}
                kopKontak={kopKontak}
                kepsekNama={kepsekNama}
                kepsekNip={kepsekNip}
                kepsekJabatan={kepsekJabatan}
                wakasekNama={wakasekNama}
                wakasekNip={wakasekNip}
                wakasekJabatan={wakasekJabatan}
              />
            ))
          )
        ) : (
          // TEACHER REPORTS
          scope === 'single' ? (
            teachers.filter(t => t.id === selectedTeacherId).map(t => (
              <TeacherPrintSheet 
                key={t.id}
                teacher={t}
                timeConfig={timeConfig}
                timetableResult={timetableResult}
                classrooms={classrooms}
                dateStr={dateStr}
                logoKiri={logoKiri}
                logoKanan={logoKanan}
                kopPemerintah={kopPemerintah}
                kopDinas={kopDinas}
                kopSekolah={kopSekolah}
                kopAlamat={kopAlamat}
                kopKontak={kopKontak}
                kepsekNama={kepsekNama}
                kepsekNip={kepsekNip}
                kepsekJabatan={kepsekJabatan}
                wakasekNama={wakasekNama}
                wakasekNip={wakasekNip}
                wakasekJabatan={wakasekJabatan}
              />
            ))
          ) : (
            teachers.map(t => (
              <TeacherPrintSheet 
                key={t.id}
                teacher={t}
                timeConfig={timeConfig}
                timetableResult={timetableResult}
                classrooms={classrooms}
                dateStr={dateStr}
                logoKiri={logoKiri}
                logoKanan={logoKanan}
                kopPemerintah={kopPemerintah}
                kopDinas={kopDinas}
                kopSekolah={kopSekolah}
                kopAlamat={kopAlamat}
                kopKontak={kopKontak}
                kepsekNama={kepsekNama}
                kepsekNip={kepsekNip}
                kepsekJabatan={kepsekJabatan}
                wakasekNama={wakasekNama}
                wakasekNip={wakasekNip}
                wakasekJabatan={wakasekJabatan}
              />
            ))
          )
        )}
      </div>

    </div>
  );
}

/* ========================================================================= */
/* OFFICIAL ALOKASI WAKTU SCHEDULE DEFINITION                                */
/* ========================================================================= */
interface ScheduleRow {
  isSpecial: boolean;
  label?: string;
  periodIndex?: number;
  jpLabel?: string;
  time: string;
}

const OFFICIAL_SCHEDULE: Record<string, ScheduleRow[]> = {
  'Senin': [
    { isSpecial: true, label: 'PPK & UPACARA', time: '06.50 - 08.10' },
    { isSpecial: false, periodIndex: 0, jpLabel: '1', time: '08.10 - 08.50' },
    { isSpecial: false, periodIndex: 1, jpLabel: '2', time: '08.50 - 09.30' },
    { isSpecial: false, periodIndex: 2, jpLabel: '3', time: '09.30 - 10.10' },
    { isSpecial: true, label: 'ISTIRAHAT', time: '10.10 - 10.40' },
    { isSpecial: false, periodIndex: 3, jpLabel: '4', time: '10.40 - 11.20' },
    { isSpecial: false, periodIndex: 4, jpLabel: '5', time: '11.20 - 12.00' },
    { isSpecial: true, label: 'ISTIRAHAT', time: '12.00 - 12.30' },
    { isSpecial: false, periodIndex: 5, jpLabel: '6', time: '12.30 - 13.10' },
    { isSpecial: false, periodIndex: 6, jpLabel: '7', time: '13.10 - 13.50' },
    { isSpecial: false, periodIndex: 7, jpLabel: '8', time: '13.50 - 14.30' },
    { isSpecial: false, periodIndex: 8, jpLabel: '9', time: '14.30 - 15.10' },
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
    { isSpecial: true, label: 'ISTIRAHAT', time: '12.00 - 12.30' },
    { isSpecial: false, periodIndex: 6, jpLabel: '7', time: '12.30 - 13.10' },
    { isSpecial: false, periodIndex: 7, jpLabel: '8', time: '13.10 - 13.50' },
    { isSpecial: false, periodIndex: 8, jpLabel: '9', time: '13.50 - 14.30' },
    { isSpecial: false, periodIndex: 9, jpLabel: '10', time: '14.30 - 15.10' },
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
    { isSpecial: true, label: 'ISTIRAHAT', time: '12.00 - 12.30' },
    { isSpecial: false, periodIndex: 6, jpLabel: '7', time: '12.30 - 13.10' },
    { isSpecial: false, periodIndex: 7, jpLabel: '8', time: '13.10 - 13.50' },
    { isSpecial: false, periodIndex: 8, jpLabel: '9', time: '13.50 - 14.30' },
    { isSpecial: false, periodIndex: 9, jpLabel: '10', time: '14.30 - 15.10' },
  ],
  'Kamis': [
    { isSpecial: true, label: 'PPK / LITERASI', time: '06.50 - 08.20' },
    { isSpecial: false, periodIndex: 0, jpLabel: '1', time: '08.20 - 09.00' },
    { isSpecial: false, periodIndex: 1, jpLabel: '2', time: '09.00 - 09.40' },
    { isSpecial: false, periodIndex: 2, jpLabel: '3', time: '09.40 - 10.20' },
    { isSpecial: true, label: 'ISTIRAHAT', time: '10.20 - 10.40' },
    { isSpecial: false, periodIndex: 3, jpLabel: '4', time: '10.40 - 11.20' },
    { isSpecial: false, periodIndex: 4, jpLabel: '5', time: '11.20 - 12.00' },
    { isSpecial: true, label: 'ISTIRAHAT', time: '12.00 - 12.30' },
    { isSpecial: false, periodIndex: 5, jpLabel: '6', time: '12.30 - 13.10' },
    { isSpecial: false, periodIndex: 6, jpLabel: '7', time: '13.10 - 13.50' },
    { isSpecial: false, periodIndex: 7, jpLabel: '8', time: '13.50 - 14.30' },
    { isSpecial: false, periodIndex: 8, jpLabel: '9', time: '14.30 - 15.10' },
    { isSpecial: true, label: 'EXTRA PRAMUKA', time: '15.10 - 15.50' },
  ],
  'Jumat': [
    { isSpecial: true, label: 'PPK / AMS', time: '06.50 - 07.50' },
    { isSpecial: false, periodIndex: 0, jpLabel: '1', time: '07.50 - 08.30' },
    { isSpecial: false, periodIndex: 1, jpLabel: '2', time: '08.30 - 09.10' },
    { isSpecial: true, label: 'ISTIRAHAT', time: '09.10 - 09.25' },
    { isSpecial: false, periodIndex: 2, jpLabel: '3', time: '09.25 - 10.05' },
    { isSpecial: false, periodIndex: 3, jpLabel: '4', time: '10.05 - 10.45' },
    { isSpecial: false, periodIndex: 4, jpLabel: '5', time: '10.50 - 11.30' },
    { isSpecial: true, label: 'SHALAT JUM\'AT', time: '11.30 - 13.00' },
    { isSpecial: false, periodIndex: 5, jpLabel: '6', time: '13.00 - 13.40' },
    { isSpecial: false, periodIndex: 6, jpLabel: '7', time: '13.40 - 14.20' },
  ]
};

function getDayRows(day: string, timeConfig: TimeConfig): ScheduleRow[] {
  const custom = timeConfig.customSchedules?.[day];
  if (custom && custom.length > 0) {
    return custom;
  }
  const official = OFFICIAL_SCHEDULE[day];
  if (official) {
    return official;
  }
  // Safe Fallback for custom day setups
  const rows: ScheduleRow[] = [];
  for (let p = 0; p < timeConfig.periodsPerDay; p++) {
    rows.push({
      isSpecial: false,
      periodIndex: p,
      jpLabel: `${p + 1}`,
      time: `JP ${p + 1}`
    });
  }
  return rows;
}

/* ========================================================================= */
/* VECTOR SVG LOGO COMPONENTS                                                */
/* ========================================================================= */
function LogoKabTasikmalaya() {
  return (
    <svg className="w-14 h-14 shrink-0 text-black hidden sm:block print:block" viewBox="0 0 100 100" fill="none">
      <path d="M50 5 C75 5, 85 20, 85 55 C85 80, 50 95, 50 95 C50 95, 15 80, 15 55 C15 20, 25 5, 50 5 Z" fill="#ffffff" stroke="#000000" strokeWidth="2" />
      <path d="M50 9 C72 9, 81 22, 81 53 C81 76, 50 90, 50 90 C50 90, 19 76, 19 53 C19 22, 28 9, 50 9 Z" fill="#e2f0d9" />
      <path d="M50 30 L25 65 L75 65 Z" fill="#385723" stroke="#1e3512" strokeWidth="1" />
      <polygon points="50,13 53,20 60,20 55,24 57,31 50,27 43,31 45,24 40,20 47,20" fill="#ffc000" stroke="#b28900" strokeWidth="0.5" />
      <path d="M25 65 Q37.5 60 50 65 T75 65 L75 75 Q62.5 80 50 75 T25 75 Z" fill="#2f5597" stroke="#1b365d" strokeWidth="1" />
      <circle cx="50" cy="50" r="10" fill="#ffc000" stroke="#000000" strokeWidth="1" />
      <text x="50" y="53" textAnchor="middle" fontSize="9" fontWeight="900" fill="#000000" fontFamily="sans-serif">G</text>
    </svg>
  );
}

function LogoSmpN1Manonjaya() {
  return (
    <svg className="w-14 h-14 shrink-0 text-black hidden sm:block print:block" viewBox="0 0 100 100" fill="none">
      <polygon points="50,5 90,25 78,85 50,96 22,85 10,25" fill="#2f5597" stroke="#000000" strokeWidth="2" />
      <polygon points="50,10 84,28 73,81 50,91 27,81 16,28" fill="#1b365d" />
      <path d="M50,65 L32,55 L32,38 Q50,47 50,47 Q50,47 50,47 Q50,47 68,38 L68,55 Z" fill="#ffffff" stroke="#ffc000" strokeWidth="1.5" />
      <path d="M50,18 Q44,32 50,44 Q56,32 50,18 Z" fill="#ff0000" />
      <path d="M50,23 Q46,32 50,40 Q54,32 50,23 Z" fill="#ffc000" />
      <path d="M22,35 Q26,62 50,77 Q74,62 78,35" stroke="#ffc000" strokeWidth="2.5" strokeLinecap="round" />
      <text x="50" y="77" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#ffffff" fontFamily="sans-serif" letterSpacing="0.5">SMPN 1</text>
    </svg>
  );
}

/* ========================================================================= */
/* CLASSROOM SHEET COMPONENT WITH OFFICIAL HEADERS AND SIGNATURES            */
/* ========================================================================= */
interface ClassroomPrintSheetProps {
  key?: string;
  classroom: Classroom;
  timeConfig: TimeConfig;
  timetableResult: TimetableResult;
  teachers: Teacher[];
  dateStr: string;
  logoKiri?: string;
  logoKanan?: string;
  kopPemerintah?: string;
  kopDinas?: string;
  kopSekolah?: string;
  kopAlamat?: string;
  kopKontak?: string;
  kepsekNama?: string;
  kepsekNip?: string;
  kepsekJabatan?: string;
  wakasekNama?: string;
  wakasekNip?: string;
  wakasekJabatan?: string;
}

function ClassroomPrintSheet({
  classroom,
  timeConfig,
  timetableResult,
  teachers,
  dateStr,
  logoKiri,
  logoKanan,
  kopPemerintah,
  kopDinas,
  kopSekolah,
  kopAlamat,
  kopKontak,
  kepsekNama,
  kepsekNip,
  kepsekJabatan,
  wakasekNama,
  wakasekNip,
  wakasekJabatan
}: ClassroomPrintSheetProps) {
  const getTeacherName = (id: string) => {
    return teachers.find(t => t.id === id)?.name || '';
  };

  const allDays = timeConfig.days;
  const midIndex = Math.ceil(allDays.length / 2);
  const leftDays = allDays.slice(0, midIndex);
  const rightDays = allDays.slice(midIndex);

  return (
    <div className="print-page bg-white p-8 rounded-2xl border border-gray-200 shadow-xs max-w-5xl mx-auto space-y-3.5 print:space-y-2.5">
      {/* Official Government Header (KOP) */}
      <div className="text-center border-b-4 border-double border-black pb-3 flex items-center justify-between gap-6">
        {logoKiri ? (
          <img src={logoKiri} alt="Logo Kiri" className="w-14 h-14 object-contain shrink-0" referrerPolicy="no-referrer" />
        ) : (
          <LogoKabTasikmalaya />
        )}
        <div className="space-y-0.5 text-center flex-1">
          <h2 className="text-xs font-bold tracking-wide uppercase text-black">{kopPemerintah || 'PEMERINTAH DAERAH KABUPATEN TASIKMALAYA'}</h2>
          <h2 className="text-xs font-bold tracking-wide uppercase text-black">{kopDinas || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}</h2>
          <h1 className="text-base font-black tracking-widest uppercase text-black">{kopSekolah || 'SMP NEGERI 1 MANONJAYA'}</h1>
          <p className="text-[9px] text-gray-800 font-bold font-sans">{kopAlamat || 'Jalan K.H.A. Ahmad Dahlan No. 1 Manonjaya, Tasikmalaya, Jawa Barat, Pos 46191'}</p>
          <p className="text-[8px] text-gray-600 font-mono">{kopKontak || 'E-Mail: mail@smpn1manonjaya-tsm.sch.id | Website: www.smpn1manonjaya-tsm.sch.id'}</p>
        </div>
        {logoKanan ? (
          <img src={logoKanan} alt="Logo Kanan" className="w-14 h-14 object-contain shrink-0" referrerPolicy="no-referrer" />
        ) : (
          <LogoSmpN1Manonjaya />
        )}
      </div>

      {/* Sub Title & Meta Section */}
      <div className="flex justify-between items-end border-b border-gray-300 pb-2">
        <div className="space-y-0.5">
          <h3 className="text-xs font-extrabold uppercase text-gray-900 tracking-wider">
            JADWAL PELAJARAN SEMESTER GENAP
          </h3>
          <p className="text-[10px] text-gray-500 font-medium">Tahun Ajaran 2026/2027 • Sistem Anti-Bentrok Digital</p>
        </div>
        <div className="text-right">
          <span className="px-3 py-1 bg-gray-100 border border-black font-extrabold text-[10px] uppercase text-black rounded">
            KELAS : {classroom.name}
          </span>
        </div>
      </div>

      {/* Two Column Layout for portrait fit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black print-grid-two">
        {/* Left Column (Monday - Wednesday) */}
        <div className="border border-black rounded-lg overflow-hidden">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gray-100 text-[10px] font-bold border-b border-black">
                <th className="p-1.5 border-r border-black w-[15%]">HARI</th>
                <th className="p-1.5 border-r border-black w-[10%]">JAM</th>
                <th className="p-1.5 border-r border-black w-[25%]">WAKTU</th>
                <th className="p-1.5 border-r border-black w-[50%]">MATA PELAJARAN / GURU</th>
              </tr>
            </thead>
            <tbody className="text-[9px] font-semibold text-black">
              {leftDays.map(day => {
                const rows = getDayRows(day, timeConfig);
                return rows.map((row, idx) => {
                  const cell = !row.isSpecial && row.periodIndex !== undefined
                    ? timetableResult[classroom.id]?.[day]?.[row.periodIndex]
                    : null;
                  return (
                    <tr key={`${day}-${idx}`} className="border-b border-black last:border-b-0 h-[27px]">
                      {idx === 0 && (
                        <td
                          rowSpan={rows.length}
                          className="border-r border-black font-extrabold uppercase bg-gray-50 text-[10px] p-1 align-middle text-center w-[15%] text-slate-800"
                          style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', minWidth: '30px' }}
                        >
                          {day}
                        </td>
                      )}
                      <td className="p-1 border-r border-black font-bold bg-gray-50/30 text-gray-800 w-[10%]">
                        {row.isSpecial ? '-' : row.jpLabel}
                      </td>
                      <td className="p-1 border-r border-black font-medium text-gray-700 w-[25%] text-center text-[8.5px]">
                        {row.time}
                      </td>
                      {row.isSpecial ? (
                        <td className="p-1 font-bold uppercase tracking-wide text-[8px] bg-amber-50/40 text-amber-950 text-center">
                          {row.label}
                        </td>
                      ) : cell ? (
                        <td className="p-1 text-left leading-tight">
                          <div className="font-bold text-black text-[9.5px] truncate max-w-[170px]">{cell.subject}</div>
                          <div className="text-[8px] text-indigo-900 font-bold tracking-tight mt-0.5 truncate max-w-[170px]">
                            [{cell.teacherCode}] {getTeacherName(cell.teacherId)}
                          </div>
                        </td>
                      ) : (
                        <td className="p-1 text-gray-400 italic font-normal text-center">
                          -
                        </td>
                      )}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>

        {/* Right Column (Thursday - Friday) */}
        <div className="border border-black rounded-lg overflow-hidden">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gray-100 text-[10px] font-bold border-b border-black">
                <th className="p-1.5 border-r border-black w-[15%]">HARI</th>
                <th className="p-1.5 border-r border-black w-[10%]">JAM</th>
                <th className="p-1.5 border-r border-black w-[25%]">WAKTU</th>
                <th className="p-1.5 border-r border-black w-[50%]">MATA PELAJARAN / GURU</th>
              </tr>
            </thead>
            <tbody className="text-[9px] font-semibold text-black">
              {rightDays.map(day => {
                const rows = getDayRows(day, timeConfig);
                return rows.map((row, idx) => {
                  const cell = !row.isSpecial && row.periodIndex !== undefined
                    ? timetableResult[classroom.id]?.[day]?.[row.periodIndex]
                    : null;
                  return (
                    <tr key={`${day}-${idx}`} className="border-b border-black last:border-b-0 h-[27px]">
                      {idx === 0 && (
                        <td
                          rowSpan={rows.length}
                          className="border-r border-black font-extrabold uppercase bg-gray-50 text-[10px] p-1 align-middle text-center w-[15%] text-slate-800"
                          style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', minWidth: '30px' }}
                        >
                          {day}
                        </td>
                      )}
                      <td className="p-1 border-r border-black font-bold bg-gray-50/30 text-gray-800 w-[10%]">
                        {row.isSpecial ? '-' : row.jpLabel}
                      </td>
                      <td className="p-1 border-r border-black font-medium text-gray-700 w-[25%] text-center text-[8.5px]">
                        {row.time}
                      </td>
                      {row.isSpecial ? (
                        <td className="p-1 font-bold uppercase tracking-wide text-[8px] bg-amber-50/40 text-amber-950 text-center">
                          {row.label}
                        </td>
                      ) : cell ? (
                        <td className="p-1 text-left leading-tight">
                          <div className="font-bold text-black text-[9.5px] truncate max-w-[170px]">{cell.subject}</div>
                          <div className="text-[8px] text-indigo-900 font-bold tracking-tight mt-0.5 truncate max-w-[170px]">
                            [{cell.teacherCode}] {getTeacherName(cell.teacherId)}
                          </div>
                        </td>
                      ) : (
                        <td className="p-1 text-gray-400 italic font-normal text-center">
                          -
                        </td>
                      )}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Signatures Footer (Admin & Principal) */}
      <div className="pt-2 grid grid-cols-2 text-[11px] leading-relaxed text-black font-sans break-inside-avoid print-grid-two">
        <div className="space-y-12">
          <div className="space-y-0.5">
            <p>Mengetahui,</p>
            <p className="font-semibold">{kepsekJabatan || 'Kepala Sekolah SMPN 1 Manonjaya'}</p>
          </div>
          <div className="space-y-0.5">
            <p className="font-bold underline text-xs">{kepsekNama || 'ASEP NURULLOH, S.Pd, M.M.'}</p>
            <p className="text-[9px] text-gray-600 font-mono">
              {kepsekNip ? (kepsekNip.toUpperCase().startsWith('NIP') ? kepsekNip : `NIP. ${kepsekNip}`) : 'NIP. 19780112 200801 1003'}
            </p>
          </div>
        </div>

        <div className="space-y-12 text-right">
          <div className="space-y-0.5">
            <p>Tasikmalaya, {dateStr}</p>
            <p className="font-semibold">{wakasekJabatan || 'Wakasek Bidang Kurikulum'}</p>
          </div>
          <div className="space-y-0.5">
            <p className="font-bold underline text-xs">{wakasekNama || 'NURUL AMALIAH, S.E, M.Pd.'}</p>
            <p className="text-[9px] text-gray-600 font-mono">
              {wakasekNip ? (wakasekNip.toUpperCase().startsWith('NIP') ? wakasekNip : `NIP. ${wakasekNip}`) : 'NIP. 19770321 200801 2005'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* TEACHER SHEET COMPONENT WITH OFFICIAL HEADERS AND SIGNATURES              */
/* ========================================================================= */
interface TeacherPrintSheetProps {
  key?: string;
  teacher: Teacher;
  timeConfig: TimeConfig;
  timetableResult: TimetableResult;
  classrooms: Classroom[];
  dateStr: string;
  logoKiri?: string;
  logoKanan?: string;
  kopPemerintah?: string;
  kopDinas?: string;
  kopSekolah?: string;
  kopAlamat?: string;
  kopKontak?: string;
  kepsekNama?: string;
  kepsekNip?: string;
  kepsekJabatan?: string;
  wakasekNama?: string;
  wakasekNip?: string;
  wakasekJabatan?: string;
}

function TeacherPrintSheet({
  teacher,
  timeConfig,
  timetableResult,
  classrooms,
  dateStr,
  logoKiri,
  logoKanan,
  kopPemerintah,
  kopDinas,
  kopSekolah,
  kopAlamat,
  kopKontak,
  kepsekNama,
  kepsekNip,
  kepsekJabatan,
  wakasekNama,
  wakasekNip,
  wakasekJabatan
}: TeacherPrintSheetProps) {
  // Calculate total workload hours allocated
  const totalHours = Object.values(timetableResult).reduce((acc, dayConfig) => {
    if (!dayConfig) return acc;
    Object.values(dayConfig).forEach(periodConfig => {
      if (!periodConfig) return;
      Object.values(periodConfig).forEach(cell => {
        if (cell && cell.teacherId === teacher.id) {
          acc++;
        }
      });
    });
    return acc;
  }, 0);

  const allDays = timeConfig.days;
  const midIndex = Math.ceil(allDays.length / 2);
  const leftDays = allDays.slice(0, midIndex);
  const rightDays = allDays.slice(midIndex);

  return (
    <div className="print-page bg-white p-8 rounded-2xl border border-gray-200 shadow-xs max-w-5xl mx-auto space-y-3.5 print:space-y-2.5">
      {/* Official Government Header (KOP) */}
      <div className="text-center border-b-4 border-double border-black pb-3 flex items-center justify-between gap-6">
        {logoKiri ? (
          <img src={logoKiri} alt="Logo Kiri" className="w-14 h-14 object-contain shrink-0" referrerPolicy="no-referrer" />
        ) : (
          <LogoKabTasikmalaya />
        )}
        <div className="space-y-0.5 text-center flex-1">
          <h2 className="text-xs font-bold tracking-wide uppercase text-black">{kopPemerintah || 'PEMERINTAH DAERAH KABUPATEN TASIKMALAYA'}</h2>
          <h2 className="text-xs font-bold tracking-wide uppercase text-black">{kopDinas || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}</h2>
          <h1 className="text-base font-black tracking-widest uppercase text-black">{kopSekolah || 'SMP NEGERI 1 MANONJAYA'}</h1>
          <p className="text-[9px] text-gray-800 font-bold font-sans">{kopAlamat || 'Jalan K.H.A. Ahmad Dahlan No. 1 Manonjaya, Tasikmalaya, Jawa Barat, Pos 46191'}</p>
          <p className="text-[8px] text-gray-600 font-mono">{kopKontak || 'E-Mail: mail@smpn1manonjaya-tsm.sch.id | Website: www.smpn1manonjaya-tsm.sch.id'}</p>
        </div>
        {logoKanan ? (
          <img src={logoKanan} alt="Logo Kanan" className="w-14 h-14 object-contain shrink-0" referrerPolicy="no-referrer" />
        ) : (
          <LogoSmpN1Manonjaya />
        )}
      </div>

      {/* Meta Profile Section */}
      <div className="grid grid-cols-3 gap-4 border border-black p-2.5 rounded-lg bg-gray-50/50 text-[10px] font-bold text-black">
        <div>KODE GURU : {teacher.code}</div>
        <div className="text-center truncate">NAMA GURU : {teacher.name}</div>
        <div className="text-right">JUMLAH BEBAN : {totalHours} JP</div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black print-grid-two">
        {/* Left Column (Monday - Wednesday) */}
        <div className="border border-black rounded-lg overflow-hidden">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gray-100 text-[10px] font-bold border-b border-black">
                <th className="p-1.5 border-r border-black w-[15%]">HARI</th>
                <th className="p-1.5 border-r border-black w-[10%]">JAM</th>
                <th className="p-1.5 border-r border-black w-[25%]">WAKTU</th>
                <th className="p-1.5 border-r border-black w-[50%]">MATA PELAJARAN / KELAS</th>
              </tr>
            </thead>
            <tbody className="text-[9px] font-semibold text-black">
              {leftDays.map(day => {
                const rows = getDayRows(day, timeConfig);
                return rows.map((row, idx) => {
                  // Find classroom being taught
                  let teachingCell: any = null;
                  if (!row.isSpecial && row.periodIndex !== undefined) {
                    Object.keys(timetableResult).forEach(classId => {
                      const cell = timetableResult[classId]?.[day]?.[row.periodIndex!];
                      if (cell && cell.teacherId === teacher.id) {
                        teachingCell = {
                          ...cell,
                          className: classrooms.find(c => c.id === classId)?.name || 'Unknown'
                        };
                      }
                    });
                  }

                  return (
                    <tr key={`${day}-${idx}`} className="border-b border-black last:border-b-0 h-[27px]">
                      {idx === 0 && (
                        <td
                          rowSpan={rows.length}
                          className="border-r border-black font-extrabold uppercase bg-gray-50 text-[10px] p-1 align-middle text-center w-[15%] text-slate-800"
                          style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', minWidth: '30px' }}
                        >
                          {day}
                        </td>
                      )}
                      <td className="p-1 border-r border-black font-bold bg-gray-50/30 text-gray-800 w-[10%]">
                        {row.isSpecial ? '-' : row.jpLabel}
                      </td>
                      <td className="p-1 border-r border-black font-medium text-gray-700 w-[25%] text-center text-[8.5px]">
                        {row.time}
                      </td>
                      {row.isSpecial ? (
                        <td className="p-1 font-bold uppercase tracking-wide text-[8px] bg-amber-50/40 text-amber-950 text-center">
                          {row.label}
                        </td>
                      ) : teachingCell ? (
                        <td className="p-1 text-left leading-tight">
                          <div className="font-bold text-black text-[9.5px] truncate max-w-[170px]">{teachingCell.subject}</div>
                          <div className="text-[8px] text-emerald-900 font-bold tracking-tight mt-0.5 font-sans bg-emerald-50 px-1.5 py-0.5 rounded-sm inline-block">
                            KELAS {teachingCell.className}
                          </div>
                        </td>
                      ) : (
                        <td className="p-1 text-gray-400 italic font-normal text-center">
                          -
                        </td>
                      )}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>

        {/* Right Column (Thursday - Friday) */}
        <div className="border border-black rounded-lg overflow-hidden">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gray-100 text-[10px] font-bold border-b border-black">
                <th className="p-1.5 border-r border-black w-[15%]">HARI</th>
                <th className="p-1.5 border-r border-black w-[10%]">JAM</th>
                <th className="p-1.5 border-r border-black w-[25%]">WAKTU</th>
                <th className="p-1.5 border-r border-black w-[50%]">MATA PELAJARAN / KELAS</th>
              </tr>
            </thead>
            <tbody className="text-[9px] font-semibold text-black">
              {rightDays.map(day => {
                const rows = getDayRows(day, timeConfig);
                return rows.map((row, idx) => {
                  // Find classroom being taught
                  let teachingCell: any = null;
                  if (!row.isSpecial && row.periodIndex !== undefined) {
                    Object.keys(timetableResult).forEach(classId => {
                      const cell = timetableResult[classId]?.[day]?.[row.periodIndex!];
                      if (cell && cell.teacherId === teacher.id) {
                        teachingCell = {
                          ...cell,
                          className: classrooms.find(c => c.id === classId)?.name || 'Unknown'
                        };
                      }
                    });
                  }

                  return (
                    <tr key={`${day}-${idx}`} className="border-b border-black last:border-b-0 h-[27px]">
                      {idx === 0 && (
                        <td
                          rowSpan={rows.length}
                          className="border-r border-black font-extrabold uppercase bg-gray-50 text-[10px] p-1 align-middle text-center w-[15%] text-slate-800"
                          style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', minWidth: '30px' }}
                        >
                          {day}
                        </td>
                      )}
                      <td className="p-1 border-r border-black font-bold bg-gray-50/30 text-gray-800 w-[10%]">
                        {row.isSpecial ? '-' : row.jpLabel}
                      </td>
                      <td className="p-1 border-r border-black font-medium text-gray-700 w-[25%] text-center text-[8.5px]">
                        {row.time}
                      </td>
                      {row.isSpecial ? (
                        <td className="p-1 font-bold uppercase tracking-wide text-[8px] bg-amber-50/40 text-amber-950 text-center">
                          {row.label}
                        </td>
                      ) : teachingCell ? (
                        <td className="p-1 text-left leading-tight">
                          <div className="font-bold text-black text-[9.5px] truncate max-w-[170px]">{teachingCell.subject}</div>
                          <div className="text-[8px] text-emerald-900 font-bold tracking-tight mt-0.5 font-sans bg-emerald-50 px-1.5 py-0.5 rounded-sm inline-block">
                            KELAS {teachingCell.className}
                          </div>
                        </td>
                      ) : (
                        <td className="p-1 text-gray-400 italic font-normal text-center">
                          -
                        </td>
                      )}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Signatures Footer (Admin & Principal) */}
      <div className="pt-2 grid grid-cols-2 text-[11px] leading-relaxed text-black font-sans break-inside-avoid print-grid-two">
        <div className="space-y-12">
          <div className="space-y-0.5">
            <p>Mengetahui,</p>
            <p className="font-semibold">{kepsekJabatan || 'Kepala Sekolah SMPN 1 Manonjaya'}</p>
          </div>
          <div className="space-y-0.5">
            <p className="font-bold underline text-xs">{kepsekNama || 'ASEP NURULLOH, S.Pd, M.M.'}</p>
            <p className="text-[9px] text-gray-600 font-mono">
              {kepsekNip ? (kepsekNip.toUpperCase().startsWith('NIP') ? kepsekNip : `NIP. ${kepsekNip}`) : 'NIP. 19780112 200801 1003'}
            </p>
          </div>
        </div>

        <div className="space-y-12 text-right">
          <div className="space-y-0.5">
            <p>Tasikmalaya, {dateStr}</p>
            <p className="font-semibold">{wakasekJabatan || 'Wakasek Bidang Kurikulum'}</p>
          </div>
          <div className="space-y-0.5">
            <p className="font-bold underline text-xs">{wakasekNama || 'NURUL AMALIAH, S.E, M.Pd.'}</p>
            <p className="text-[9px] text-gray-600 font-mono">
              {wakasekNip ? (wakasekNip.toUpperCase().startsWith('NIP') ? wakasekNip : `NIP. ${wakasekNip}`) : 'NIP. 19770321 200801 2005'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* MASTER SCHEDULE REKAPITULASI SHEET COMPONENT                              */
/* ========================================================================= */
interface MasterPrintSheetProps {
  timeConfig: TimeConfig;
  timetableResult: TimetableResult;
  classrooms: Classroom[];
  teachers: Teacher[];
  workloads: Workload[];
  dateStr: string;
  logoKiri?: string;
  logoKanan?: string;
  kopPemerintah?: string;
  kopDinas?: string;
  kopSekolah?: string;
  kopAlamat?: string;
  kopKontak?: string;
  kepsekNama?: string;
  kepsekNip?: string;
  kepsekJabatan?: string;
  wakasekNama?: string;
  wakasekNip?: string;
  wakasekJabatan?: string;
}

function MasterPrintSheet({
  timeConfig,
  timetableResult,
  classrooms,
  teachers,
  workloads,
  dateStr,
  logoKiri,
  logoKanan,
  kopPemerintah,
  kopDinas,
  kopSekolah,
  kopAlamat,
  kopKontak,
  kepsekNama,
  kepsekNip,
  kepsekJabatan,
  wakasekNama,
  wakasekNip,
  wakasekJabatan
}: MasterPrintSheetProps) {
  // Sort classrooms alphabetically so they are grouped naturally
  const sortedClassrooms = [...classrooms].sort((a, b) => 
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );

  // Dynamic Grade Grouping for table dual-tier headers
  interface GradeGroup {
    name: string;
    count: number;
  }
  const gradeGroups: GradeGroup[] = [];
  sortedClassrooms.forEach(c => {
    let grade = "LAINNYA";
    if (c.name.startsWith("VIII")) grade = "KELAS VIII";
    else if (c.name.startsWith("VII")) grade = "KELAS VII";
    else if (c.name.startsWith("IX")) grade = "KELAS IX";
    else {
      const match = c.name.match(/^(\d+)/);
      if (match) {
        grade = `KELAS ${match[1]}`;
      }
    }

    const lastGroup = gradeGroups[gradeGroups.length - 1];
    if (lastGroup && lastGroup.name === grade) {
      lastGroup.count++;
    } else {
      gradeGroups.push({ name: grade, count: 1 });
    }
  });

  return (
    <div className="print-page bg-white p-6 rounded-2xl border border-gray-200 shadow-xs max-w-7xl mx-auto space-y-5">
      {/* Official Government Header (KOP) */}
      <div className="text-center border-b-4 border-double border-black pb-3 flex items-center justify-between gap-6">
        {logoKiri ? (
          <img src={logoKiri} alt="Logo Kiri" className="w-14 h-14 object-contain shrink-0" referrerPolicy="no-referrer" />
        ) : (
          <LogoKabTasikmalaya />
        )}
        <div className="space-y-0.5 text-center flex-1">
          <h2 className="text-xs font-bold tracking-wide uppercase text-black">{kopPemerintah || 'PEMERINTAH DAERAH KABUPATEN TASIKMALAYA'}</h2>
          <h2 className="text-xs font-bold tracking-wide uppercase text-black">{kopDinas || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}</h2>
          <h1 className="text-base font-black tracking-widest uppercase text-black">{kopSekolah || 'SMP NEGERI 1 MANONJAYA'}</h1>
          <p className="text-[9px] text-gray-800 font-bold font-sans">{kopAlamat || 'Jalan K.H.A. Ahmad Dahlan No. 1 Manonjaya, Tasikmalaya, Jawa Barat, Pos 46191'}</p>
          <p className="text-[8px] text-gray-600 font-mono">{kopKontak || 'E-Mail: mail@smpn1manonjaya-tsm.sch.id | Website: www.smpn1manonjaya-tsm.sch.id'}</p>
        </div>
        {logoKanan ? (
          <img src={logoKanan} alt="Logo Kanan" className="w-14 h-14 object-contain shrink-0" referrerPolicy="no-referrer" />
        ) : (
          <LogoSmpN1Manonjaya />
        )}
      </div>

      {/* Title */}
      <div className="text-center space-y-0.5">
        <h3 className="text-xs font-black uppercase text-gray-900 tracking-widest">
          JADWAL INDUK REKAPITULASI PELAJARAN UMUM (MATRIKS REKAP GURU)
        </h3>
        <p className="text-[10px] text-gray-500 font-medium">Tahun Ajaran 2026/2027 • Sistem Anti-Bentrok Digital • Kertas Landscape</p>
      </div>

      {/* Main Side-by-Side Flex Layout (Matrix left, Teacher Reference list right) */}
      <div className="flex flex-col lg:flex-row gap-4 print:flex-row items-start text-black">
        {/* Left: Dynamic Matrix Table */}
        <div className="flex-1 w-full overflow-x-auto border border-black rounded-lg">
          <table className="w-full text-center border-collapse">
            <thead>
              {/* Top Tier: Grade Grouping */}
              <tr className="bg-gray-100 text-black border-b border-black text-[9.5px] font-bold">
                <th className="p-1.5 border-r border-black" colSpan={3}>ALOKASI WAKTU</th>
                {gradeGroups.map((g, i) => (
                  <th key={i} colSpan={g.count} className="p-1.5 border-r border-black last:border-r-0 text-center uppercase tracking-wider bg-gray-50">
                    {g.name}
                  </th>
                ))}
              </tr>
              {/* Second Tier: Class names */}
              <tr className="bg-gray-100 text-black border-b border-black text-[9px] font-bold">
                <th className="p-1.5 border-r border-black w-14">HARI</th>
                <th className="p-1.5 border-r border-black w-8">JAM</th>
                <th className="p-1.5 border-r border-black w-18">WAKTU</th>
                {sortedClassrooms.map(c => {
                  // Only display suffix letter to fit columns extremely tightly
                  const shortName = c.name.replace(/^(VII|VIII|IX|\d+)\s*/i, '');
                  return (
                    <th key={c.id} className="p-1.5 border-r border-black last:border-r-0 text-center text-[9px] font-extrabold bg-indigo-50/20">
                      {shortName || c.name}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="text-[8.5px] font-semibold text-black">
              {timeConfig.days.map(day => {
                const rows = getDayRows(day, timeConfig);
                return (
                  <React.Fragment key={day}>
                    {rows.map((row, idx) => {
                      return (
                        <tr key={`${day}-${idx}`} className="border-b border-black last:border-b-0 text-center h-[26px]">
                          {idx === 0 && (
                            <td 
                              rowSpan={rows.length} 
                              className="p-1.5 bg-gray-50 border-r border-black font-black uppercase tracking-wider align-middle w-14 text-slate-800 text-[10px]"
                              style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                            >
                              {day}
                            </td>
                          )}

                          <td className="p-1 border-r border-black bg-gray-50/50 font-bold w-8">
                            {row.isSpecial ? '-' : row.jpLabel}
                          </td>

                          <td className="p-1 border-r border-black text-gray-700 w-18 font-mono text-[8px]">
                            {row.time}
                          </td>

                          {row.isSpecial ? (
                            <td 
                              colSpan={sortedClassrooms.length} 
                              className="p-1 bg-amber-50/30 text-amber-950 font-bold uppercase tracking-widest text-[8px]"
                            >
                              {row.label}
                            </td>
                          ) : (
                            sortedClassrooms.map(c => {
                              const cell = row.periodIndex !== undefined
                                ? timetableResult[c.id]?.[day]?.[row.periodIndex]
                                : null;

                              if (cell) {
                                return (
                                  <td key={c.id} className="p-1 border-r border-black last:border-r-0 bg-indigo-50/5 text-center leading-none">
                                    {/* Numeric Teacher Code is highlighted exactly like the screenshot */}
                                    <span className="block font-black text-indigo-900 text-[9.5px]">{cell.teacherCode}</span>
                                    {/* Subject name is printed in tiny font beneath */}
                                    <span className="block text-[6.5px] text-gray-500 font-sans tracking-tight mt-0.5 truncate max-w-[50px] mx-auto">{cell.subject}</span>
                                  </td>
                                );
                              }

                              return (
                                <td key={c.id} className="p-1 border-r border-black last:border-r-0 text-gray-300 font-normal italic">
                                  -
                                </td>
                              );
                            })
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right: Highly polished Sidebar Teacher Reference list */}
        <div className="w-full lg:w-[260px] print:w-[220px] shrink-0 border border-black rounded-lg overflow-hidden text-[8px] self-stretch flex flex-col bg-slate-50/20">
          <div className="bg-gray-100 border-b border-black p-1.5 text-center font-extrabold uppercase tracking-wide text-gray-900">
            Daftar Singkatan & Kode Guru
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-black text-left text-gray-700 font-extrabold text-[8px]">
                  <th className="p-1 border-r border-black text-center w-8 bg-indigo-50/30 text-indigo-950">KODE</th>
                  <th className="p-1 border-r border-black">NAMA LENGKAP</th>
                  <th className="p-1">MATA PELAJARAN DIAMPUL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 font-medium">
                {teachers.map(t => {
                  const teacherSubjects = Array.from(
                    new Set(workloads.filter(w => w.teacherId === t.id).map(w => w.subject))
                  );
                  return (
                    <tr key={t.id} className="hover:bg-indigo-50/10">
                      <td className="p-1 border-r border-black text-center font-black text-indigo-950 bg-indigo-50/20">{t.code}</td>
                      <td className="p-1 border-r border-black font-bold text-gray-900 truncate max-w-[100px]" title={t.name}>{t.name}</td>
                      <td className="p-1 text-gray-600 truncate max-w-[80px]" title={teacherSubjects.join(', ')}>{teacherSubjects.length > 0 ? teacherSubjects.join(', ') : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Official Signatures Footer (Admin & Principal) */}
      <div className="pt-4 grid grid-cols-2 text-[11px] leading-relaxed text-black font-sans break-inside-avoid">
        <div className="space-y-12">
          <div className="space-y-0.5">
            <p>Mengetahui,</p>
            <p className="font-semibold">{kepsekJabatan || 'Kepala Sekolah SMPN 1 Manonjaya'}</p>
          </div>
          <div className="space-y-0.5">
            <p className="font-bold underline text-xs">{kepsekNama || 'ASEP NURULLOH, S.Pd, M.M.'}</p>
            <p className="text-[9px] text-gray-600 font-mono">
              {kepsekNip ? (kepsekNip.toUpperCase().startsWith('NIP') ? kepsekNip : `NIP. ${kepsekNip}`) : 'NIP. 19780112 200801 1003'}
            </p>
          </div>
        </div>

        <div className="space-y-12 text-right">
          <div className="space-y-0.5">
            <p>Tasikmalaya, {dateStr}</p>
            <p className="font-semibold">{wakasekJabatan || 'Wakasek Bidang Kurikulum'}</p>
          </div>
          <div className="space-y-0.5">
            <p className="font-bold underline text-xs">{wakasekNama || 'NURUL AMALIAH, S.E, M.Pd.'}</p>
            <p className="text-[9px] text-gray-600 font-mono">
              {wakasekNip ? (wakasekNip.toUpperCase().startsWith('NIP') ? wakasekNip : `NIP. ${wakasekNip}`) : 'NIP. 19770321 200801 2005'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

