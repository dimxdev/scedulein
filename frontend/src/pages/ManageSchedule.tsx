import { useEffect, useState } from 'react';
import {
  dataService,
  COLOR_PALETTES,
  type ScheduleItem,
  type CategoryItem,
  type PresetItem,
} from '../lib/dataService';
import { useAuthStore } from '../store/authStore';
import CustomManagerModal from '../components/CustomManagerModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Clock, Sparkles, Check, Calendar, Settings2 } from 'lucide-react';

const DAYS = [
  { id: 1, name: 'Senin', short: 'Sen' },
  { id: 2, name: 'Selasa', short: 'Sel' },
  { id: 3, name: 'Rabu', short: 'Rab' },
  { id: 4, name: 'Kamis', short: 'Kam' },
  { id: 5, name: 'Jumat', short: 'Jum' },
  { id: 6, name: 'Sabtu', short: 'Sab' },
  { id: 7, name: 'Minggu', short: 'Min' },
];

export default function ManageSchedule() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState(1);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(() => dataService.getCategories());
  const [presets, setPresets] = useState<PresetItem[]>(() => dataService.getPresets());
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'presets' | 'categories'>('presets');

  // Form states
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:00');
  const [category, setCategory] = useState<string>(categories[0]?.id || 'routine');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, [user]);

  const fetchSchedules = async () => {
    setLoading(true);
    const data = await dataService.getSchedules();
    setSchedules(data);
    setCategories(dataService.getCategories());
    setPresets(dataService.getPresets());
    setLoading(false);
  };

  const handleRefreshCustoms = () => {
    setCategories(dataService.getCategories());
    setPresets(dataService.getPresets());
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    await dataService.addSchedule({
      day_of_week: activeTab,
      time,
      title: title.trim(),
      category: category || categories[0]?.id || 'routine',
      user_id: user?.id,
    });

    setTitle('');
    await fetchSchedules();
    setIsSubmitting(false);
  };

  const handleUsePreset = (preset: PresetItem) => {
    setTitle(preset.title);
    setTime(preset.time);
    setCategory(preset.category);
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    if (window.confirm(`Hapus jadwal "${itemTitle}"?`)) {
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      await dataService.deleteSchedule(id);
    }
  };

  const activeDaySchedules = schedules.filter((s) => s.day_of_week === activeTab);
  const activeDayName = DAYS.find((d) => d.id === activeTab)?.name;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <span>Atur Jadwal Mingguan</span>
            <span className="text-lg">🗓️</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Pilih hari untuk menambah, melihat, atau memperbarui agenda rutinitasmu.
          </p>
        </div>

        {/* Global Manage Presets & Categories Button */}
        <button
          onClick={() => {
            setModalTab('presets');
            setIsModalOpen(true);
          }}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 shadow-sm text-xs font-bold text-slate-700 dark:text-slate-200 transition-all hover:scale-105"
        >
          <Settings2 className="w-4 h-4 text-sky-500" />
          <span>Kelola Preset & Kategori</span>
        </button>
      </div>

      {/* Modern Day Selector Pill Tabs */}
      <div
        role="tablist"
        aria-label="Pilih Hari"
        className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/75 border border-white/60 dark:border-white/10 rounded-3xl p-2 shadow-glass dark:shadow-glass-dark"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {DAYS.map((day) => {
            const count = schedules.filter((s) => s.day_of_week === day.id).length;
            const isActive = activeTab === day.id;

            return (
              <button
                key={day.id}
                role="tab"
                aria-selected={isActive}
                aria-label={`Hari ${day.name}, ada ${count} jadwal`}
                onClick={() => setActiveTab(day.id)}
                className={`relative flex-1 min-w-[42px] sm:min-w-[72px] py-2.5 sm:py-3 px-1 sm:px-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-center transition-all ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeDayTab"
                    className="absolute inset-0 bg-gradient-to-r from-sky-500 to-amber-400 rounded-2xl -z-10 shadow-md shadow-sky-500/20"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="text-[11px] sm:text-xs font-bold hidden sm:inline">{day.name}</span>
                <span className="text-[11px] font-bold sm:hidden">{day.short}</span>
                <span
                  className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-white/30 text-white'
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Schedule Form Card */}
      <div className="backdrop-blur-xl bg-white/75 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 rounded-3xl p-6 shadow-glass dark:shadow-glass-dark space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-sky-500" />
            <span>Tambah Jadwal untuk Hari {activeDayName}</span>
          </h2>

          <button
            type="button"
            onClick={() => {
              setModalTab('presets');
              setIsModalOpen(true);
            }}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Edit Preset</span>
          </button>
        </div>

        {/* Quick Presets (Dynamic from user customization) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleUsePreset(p)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/70 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 transition-colors font-medium flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{p.title}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleAdd} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Title */}
            <div className="md:col-span-6">
              <label htmlFor="schedule-title-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Nama Kegiatan
              </label>
              <input
                id="schedule-title-input"
                type="text"
                placeholder="Misal: Review PR di GitHub / Lari pagi 3km"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium transition-all"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Time */}
            <div className="md:col-span-3">
              <label htmlFor="schedule-time-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Jam
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="schedule-time-input"
                  type="time"
                  className="w-full pl-10 pr-3 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium transition-all"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-sky-500 to-amber-400 hover:from-sky-400 hover:to-amber-500 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Jadwal'}</span>
              </button>
            </div>
          </div>

          {/* Dynamic Category Selector with Custom Edit Link */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pilih Kategori
              </label>
              <button
                type="button"
                onClick={() => {
                  setModalTab('categories');
                  setIsModalOpen(true);
                }}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
              >
                + Tambah / Edit Kategori
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                const style = COLOR_PALETTES[cat.color] || COLOR_PALETTES.purple;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? `${style.bg} ring-2 ring-sky-400 shadow-sm scale-105`
                        : 'bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </div>

      {/* Schedules List for Active Day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-sky-500" />
            <span>Daftar Rutinitas Hari {activeDayName}</span>
          </h3>
          <span className="text-xs text-slate-400 font-semibold">{activeDaySchedules.length} Jadwal</span>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400 font-medium animate-pulse">
            Memuat daftar kegiatan...
          </div>
        ) : activeDaySchedules.length === 0 ? (
          <div className="text-center py-12 px-4 backdrop-blur-xl bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300/80 dark:border-slate-700">
            <span className="text-3xl inline-block mb-1">🌤️</span>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada jadwal untuk {activeDayName}</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan form di atas untuk mengisi kegiatan rutinitasmu.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence>
              {activeDaySchedules.map((schedule) => {
                const catObj = categories.find((c) => c.id === schedule.category) || categories[0];
                const catStyle = catObj ? COLOR_PALETTES[catObj.color] : COLOR_PALETTES.blue;

                return (
                  <motion.div
                    key={schedule.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="group backdrop-blur-xl bg-white/75 dark:bg-slate-900/75 border border-white/60 dark:border-white/10 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/50 flex flex-col items-center justify-center flex-shrink-0 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30">
                        <Clock className="w-4 h-4" />
                        <span className="text-[10px] font-bold mt-0.5">{schedule.time.slice(0, 5)}</span>
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-100 break-words line-clamp-2">
                          {schedule.title}
                        </p>
                        {catObj && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${catStyle.bg}`}>
                              {catObj.icon} {catObj.label}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(schedule.id, schedule.title)}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Hapus jadwal ini"
                      aria-label={`Hapus jadwal ${schedule.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal for Customizing Presets and Categories */}
      <CustomManagerModal
        isOpen={isModalOpen}
        initialTab={modalTab}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleRefreshCustoms}
      />
    </div>
  );
}
