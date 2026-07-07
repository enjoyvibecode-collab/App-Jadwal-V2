import React, { useState } from 'react';
import { Classroom } from '../types';
import { Plus, Trash2, Search, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

interface ClassroomDirectoryProps {
  classrooms: Classroom[];
  onAdd: (classroom: Omit<Classroom, 'id'>) => void;
  onDelete: (id: string) => void;
}

export default function ClassroomDirectory({ classrooms, onAdd, onDelete }: ClassroomDirectoryProps) {
  // Form State
  const [classNameInput, setClassNameInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  
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

    onAdd({ name: cleanName });
    setClassNameInput('');
  };

  // Preset generator for rapid entries
  const handleAddPresets = (grade: string, count: number) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
    const added: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const name = `${grade} ${letters[i]}`;
      if (!isDuplicate(name)) {
        onAdd({ name });
        added.push(name);
      }
    }
  };

  const filteredClassrooms = classrooms.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="classroom-directory-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Form Panel */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
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
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Generator Cepat Kelas
          </h4>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            Tambahkan serangkaian kelas paralel secara otomatis untuk menghemat waktu Anda.
          </p>

          <div className="space-y-2.5">
            {[
              { grade: 'VII', count: 11 },
              { grade: 'VIII', count: 11 },
              { grade: 'IX', count: 11 }
            ].map((preset) => (
              <button
                key={preset.grade}
                type="button"
                onClick={() => handleAddPresets(preset.grade, preset.count)}
                className="w-full py-2 px-3 text-xs font-semibold border border-gray-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all text-gray-700 text-left flex justify-between items-center cursor-pointer"
              >
                <span>Generasikan {preset.grade} A sampai {preset.grade} K</span>
                <span className="text-[10px] bg-gray-100 text-gray-500 py-0.5 px-2 rounded-full font-bold group-hover:bg-indigo-100">
                  +11 Kelas
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Listing Panel */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col">
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
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/30 flex-1">
            <BookOpen className="w-10 h-10 text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-500">Tidak ada data kelas</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">
              {searchQuery ? 'Ganti kata kunci pencarian Anda' : 'Gunakan formulir atau generator cepat di samping kiri untuk menginput kelas.'}
            </p>
          </div>
        ) : (
          /* Grid of Classes to look awesome instead of a giant blank table */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto max-h-[480px] pr-1">
            {filteredClassrooms.map((room) => (
              <div 
                key={room.id}
                className="bg-gray-50 hover:bg-indigo-50/35 border border-gray-200/80 hover:border-indigo-200 p-3 rounded-xl flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 group-hover:scale-110 transition-transform"></span>
                  <span className="font-bold text-gray-800 font-mono text-sm uppercase">
                    {room.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(room.id)}
                  title={`Hapus Kelas ${room.name}`}
                  className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-white transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
