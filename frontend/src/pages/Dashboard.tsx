import { useEffect, useState } from 'react';
import { dataService, COLOR_PALETTES, type ScheduleItem, type CategoryItem } from '../lib/dataService';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import MascotCat from '../components/MascotCat';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Sparkles, Plus, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(() => dataService.getCategories());
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Current Day info
  const dateObj = new Date();
  const todayIndex = dateObj.getDay(); // 0 is Sunday
  const currentDayOfWeek = todayIndex === 0 ? 7 : todayIndex; // 1 = Monday, 7 = Sunday
  const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayName = daysIndo[todayIndex];
  const dateFormatted = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const todayStr = dateObj.toISOString().split('T')[0];

  // Dynamic Greeting based on hour
  const hour = dateObj.getHours();
  const timeGreeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 19 ? 'Selamat Sore' : 'Selamat Malam';

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [scheduleList, completedList] = await Promise.all([
      dataService.getSchedules(currentDayOfWeek),
      dataService.getCompletedLogs(todayStr),
    ]);
    setSchedules(scheduleList);
    setCategories(dataService.getCategories());
    setCompletedIds(completedList);
    setLoading(false);
  };

  const handleToggle = async (scheduleId: string) => {
    const isCompleted = completedIds.includes(scheduleId);

    // Optimistic UI update
    setCompletedIds((prev) =>
      isCompleted ? prev.filter((id) => id !== scheduleId) : [...prev, scheduleId]
    );

    // Save to persistent storage / database
    await dataService.toggleLog(scheduleId, todayStr, isCompleted, user?.id);
  };

  const totalCount = schedules.length;
  const completedCount = completedIds.filter((id) => schedules.some((s) => s.id === id)).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="space-y-6">
      {/* Hero Widget Card */}
      <div className="relative overflow-hidden backdrop-blur-xl bg-white/75 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-glass dark:shadow-glass-dark">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/80 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold">
              <Calendar className="w-3.5 h-3.5" />
              <span>{dayName}, {dateFormatted}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-display font-extrabold text-slate-800 dark:text-white">
              {timeGreeting}, {user?.isGuest ? 'Kawan' : user?.email?.split('@')[0]}! ✨
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md">
              {isAllDone
                ? 'Luar biasa! Semua jadwal hari ini sudah tuntas. Kucing bangga padamu! 🐱🎉'
                : `Yuk selesaikan target rutinitasmu hari ini dengan penuh semangat!`}
            </p>

            {/* Progress Section */}
            {totalCount > 0 && (
              <div className="pt-3 max-w-md space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Progress Hari Ini</span>
                  <span className="text-sky-600 dark:text-sky-400">
                    {completedCount} dari {totalCount} Selesai ({progressPercent}%)
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Progress rutinitas hari ini"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50"
                >
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Animated Mascot in Hero */}
          <div className="flex items-center justify-center md:pr-4">
            <div className="relative p-2 rounded-3xl bg-gradient-to-br from-amber-100/50 to-sky-100/50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-white/50 dark:border-white/5">
              <MascotCat isNight={isDarkMode} size="sm" className="sm:hidden" />
              <MascotCat isNight={isDarkMode} size="lg" className="hidden sm:inline-flex" />
              {isAllDone && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 text-[11px] font-black shadow-md flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Juara!
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Checklist Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>Jadwal Khusus Hari {dayName}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {totalCount} Kegiatan
              </span>
            </h2>
          </div>

          <Link
            to="/manage"
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Jadwal</span>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16 backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-white/60 dark:border-white/10">
            <span className="text-2xl animate-bounce inline-block mb-2">🐾</span>
            <p className="text-sm font-semibold text-slate-500">Mempersiapkan jadwal harianmu...</p>
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-12 px-6 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-3xl border border-white/60 dark:border-white/10 shadow-glass dark:shadow-glass-dark space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-amber-100 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center mx-auto text-2xl">
              🐱
            </div>
            <div>
              <p className="font-bold text-base text-slate-800 dark:text-white">Hari {dayName} Masih Santai!</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Belum ada jadwal yang kamu atur untuk hari ini. Mau menambahkan rutinitas baru?
              </p>
            </div>
            <Link
              to="/manage"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-amber-400 hover:from-sky-400 hover:to-amber-500 text-white font-bold text-xs shadow-md hover:scale-105 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Atur Jadwal {dayName} Sekarang</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {schedules.map((schedule) => {
                const isChecked = completedIds.includes(schedule.id);
                const catObj = categories.find((c) => c.id === schedule.category) || categories[0];
                const catStyle = catObj ? COLOR_PALETTES[catObj.color] : COLOR_PALETTES.blue;

                return (
                  <motion.div
                    key={schedule.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleToggle(schedule.id)}
                    className={`group relative p-4 md:p-5 rounded-3xl backdrop-blur-xl border transition-all shadow-sm cursor-pointer select-none ${
                      isChecked
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/30 opacity-75'
                        : 'bg-white/80 dark:bg-slate-900/80 border-white/80 dark:border-white/10 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Tactile Animated Checkbox Button */}
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={isChecked}
                        aria-label={`Tandai ${schedule.title} sebagai ${isChecked ? 'belum selesai' : 'selesai'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(schedule.id);
                        }}
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 rotate-0'
                            : 'bg-slate-100 dark:bg-slate-800 text-transparent border-2 border-slate-300/80 dark:border-slate-700 hover:border-sky-400 group-hover:scale-105'
                        }`}
                        title={isChecked ? 'Tandai belum selesai' : 'Tandai selesai'}
                      >
                        <Check className={`w-5 h-5 stroke-[2.5] transition-transform ${isChecked ? 'scale-100' : 'scale-0'}`} />
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {catObj && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${catStyle.bg}`}>
                              {catObj.icon} {catObj.label}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            <Clock className="w-3 h-3 text-sky-500" />
                            {schedule.time ? schedule.time.slice(0, 5) : ''}
                          </span>
                        </div>

                        <p
                          className={`font-bold text-sm md:text-base leading-snug transition-all ${
                            isChecked
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {schedule.title}
                          {isChecked && <span className="sr-only"> (Sudah selesai)</span>}
                        </p>
                      </div>

                      {/* Completion Badge */}
                      {isChecked && (
                        <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 pr-2">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Selesai!</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
