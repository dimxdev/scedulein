import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Check, Clock, Pin, Plus, Sparkles } from 'lucide-react';
import type { ScheduleItem } from '../lib/dataService';
import { dayName as getDayName, dayOfWeek, formatLongDate, parseDateStr, timeToMinutes, toDateStr } from '../lib/date';
import { useNow } from '../lib/useNow';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { doneKey, LOG_WINDOW_DAYS, useDataStore } from '../store/dataStore';
import { computeStreaks, dailyStats } from '../lib/stats';
import MascotCat, { type MascotMood } from '../components/MascotCat';
import CategoryBadge from '../components/CategoryBadge';
import PageLoader from '../components/PageLoader';

type ItemState = 'done' | 'now' | 'next' | 'missed' | 'upcoming';

/** Tanpa jam selesai, kegiatan dianggap berlangsung 60 menit. */
const DEFAULT_DURATION_MIN = 60;

function formatCountdown(minutes: number): string {
  if (minutes < 60) return `${minutes} mnt lagi`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} j ${m} mnt lagi` : `${h} jam lagi`;
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const { schedules: allSchedules, categories, done, status, toggle } = useDataStore();
  const loading = status === 'idle' || status === 'loading';

  // Ikut diperbarui tiap 30 detik → hari & sorotan "sekarang" selalu akurat
  const now = useNow();
  const todayStr = toDateStr(now);
  const currentDay = dayOfWeek(now);
  const dayName = getDayName(currentDay);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const hour = now.getHours();
  const timeGreeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 19 ? 'Selamat Sore' : 'Selamat Malam';

  const schedules = useMemo(
    () => allSchedules.filter((s) => (s.date ? s.date === todayStr : s.day_of_week === currentDay)),
    [allSchedules, todayStr, currentDay]
  );

  const { states, nextItem } = useMemo(() => {
    const result = new Map<string, ItemState>();
    let next: ScheduleItem | null = null;
    for (const s of schedules) {
      const start = timeToMinutes(s.time);
      const end = s.end_time ? timeToMinutes(s.end_time) : start + DEFAULT_DURATION_MIN;
      let state: ItemState;
      if (done.has(doneKey(todayStr, s.id))) state = 'done';
      else if (start <= nowMin && nowMin < end) state = 'now';
      else if (end <= nowMin) state = 'missed';
      else if (!next) {
        next = s;
        state = 'next';
      } else state = 'upcoming';
      result.set(s.id, state);
    }
    return { states: result, nextItem: next as ScheduleItem | null };
  }, [schedules, done, todayStr, nowMin]);

  const totalCount = schedules.length;
  const completedCount = schedules.filter((s) => states.get(s.id) === 'done').length;
  const missedCount = schedules.filter((s) => states.get(s.id) === 'missed').length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  // Streak dihitung ulang hanya saat data/tanggal berubah, bukan tiap tick jam
  const streak = useMemo(
    () => computeStreaks(dailyStats(allSchedules, done, parseDateStr(todayStr), LOG_WINDOW_DAYS)),
    [allSchedules, done, todayStr]
  );

  const mood: MascotMood = isAllDone ? 'proud' : missedCount >= 2 ? 'sad' : 'happy';
  const mascotMessage =
    mood === 'proud'
      ? 'Meow! Semua beres hari ini 🎉'
      : mood === 'sad'
        ? `Ada ${missedCount} jadwal terlewat… yuk kejar satu-satu! 🐾`
        : streak.current >= 2
          ? `🔥 ${streak.current} hari beruntun! Pertahankan ya!`
          : totalCount > 0
            ? 'Semangat! Aku temani kamu hari ini 🐾'
            : 'Hari santai? Aku mau tidur siang dulu 😺';

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-glass dark:shadow-glass-dark">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/80 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {dayName}, {formatLongDate(now)}
                </span>
              </div>
              {streak.current > 0 && (
                <Link
                  to="/stats"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100/90 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 text-xs font-bold hover:underline"
                  title="Lihat statistik"
                >
                  🔥 {streak.current} hari beruntun
                </Link>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-display font-extrabold text-slate-800 dark:text-white break-words">
              {timeGreeting}, {user?.name}! ✨
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md">
              {isAllDone
                ? 'Luar biasa! Semua jadwal hari ini sudah tuntas. Kucing bangga padamu! 🐱🎉'
                : nextItem
                  ? (
                    <>
                      Berikutnya: <strong className="text-slate-800 dark:text-white">{nextItem.title}</strong> jam{' '}
                      {nextItem.time}
                    </>
                  )
                  : totalCount > 0
                    ? 'Yuk selesaikan sisa rutinitasmu hari ini!'
                    : 'Belum ada jadwal hari ini. Santai dulu, atau tambah rutinitas baru.'}
            </p>

            {totalCount > 0 && (
              <div className="pt-3 max-w-md space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Progress Hari Ini</span>
                  <span className="text-sky-600 dark:text-sky-400">
                    {completedCount} dari {totalCount} selesai ({progressPercent}%)
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
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-400 transition-[width] duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex md:flex-col items-center justify-center gap-3 md:pr-4">
            <div className="relative p-2 rounded-3xl bg-gradient-to-br from-amber-100/50 to-sky-100/50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-white/50 dark:border-white/5">
              <MascotCat
                isNight={isDarkMode}
                mood={mood}
                crown={streak.current >= 7}
                sizeClass="w-20 h-20 sm:w-40 sm:h-40"
              />
              {isAllDone && (
                <div className="animate-pop-in absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 text-[11px] font-black shadow-md flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Juara!
                </div>
              )}
            </div>
            {!loading && (
              <p
                aria-live="polite"
                className="relative max-w-[13rem] px-3 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm"
              >
                {mascotMessage}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Checklist */}
      <section className="space-y-4" aria-labelledby="today-list-title">
        <div className="flex items-center justify-between px-1">
          <h2 id="today-list-title" className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Jadwal Hari {dayName}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {totalCount} kegiatan
            </span>
          </h2>
          <Link
            to="/manage"
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah
          </Link>
        </div>

        {loading ? (
          <PageLoader />
        ) : totalCount === 0 ? (
          <div className="text-center py-12 px-6 bg-white/80 dark:bg-slate-900/70 rounded-3xl border border-white/60 dark:border-white/10 shadow-glass dark:shadow-glass-dark space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center mx-auto text-2xl">🐱</div>
            <div>
              <p className="font-bold text-base text-slate-800 dark:text-white">Hari {dayName} Masih Santai!</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Belum ada jadwal untuk hari ini. Mau menambahkan rutinitas baru?
              </p>
            </div>
            <Link
              to="/manage"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-amber-400 hover:from-sky-400 hover:to-amber-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Atur Jadwal {dayName}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {schedules.map((schedule) => {
              const state = states.get(schedule.id) ?? 'upcoming';
              const isChecked = state === 'done';
              return (
                <li key={schedule.id} className="animate-fade-in-up">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    onClick={() => toggle(schedule.id, todayStr)}
                    className={`w-full text-left group relative p-4 md:p-5 rounded-3xl border transition-all shadow-sm select-none ${
                      isChecked
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/30'
                        : state === 'now'
                          ? 'bg-white dark:bg-slate-900 border-sky-300 dark:border-sky-700 ring-2 ring-sky-400/40 shadow-md'
                          : 'bg-white/80 dark:bg-slate-900/80 border-white/80 dark:border-white/10 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        aria-hidden="true"
                        className={`w-9 h-9 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-transparent border-2 border-slate-300/80 dark:border-slate-700 group-hover:border-sky-400'
                        }`}
                      >
                        <Check className={`w-5 h-5 stroke-[2.5] transition-transform ${isChecked ? 'scale-100' : 'scale-0'}`} />
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            <Clock className="w-3 h-3 text-sky-500" />
                            {schedule.time}
                            {schedule.end_time && `–${schedule.end_time}`}
                          </span>
                          <CategoryBadge categories={categories} categoryId={schedule.category} />
                          {schedule.date && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              <Pin className="w-2.5 h-2.5" />
                              Sekali
                            </span>
                          )}
                          {state === 'now' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500 text-white">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              Sedang berlangsung
                            </span>
                          )}
                          {state === 'next' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                              Berikutnya · {formatCountdown(timeToMinutes(schedule.time) - nowMin)}
                            </span>
                          )}
                          {state === 'missed' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                              Terlewat
                            </span>
                          )}
                        </div>

                        <p
                          className={`font-bold text-sm md:text-base leading-snug break-words ${
                            isChecked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {schedule.title}
                        </p>
                        {schedule.note && !isChecked && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">📝 {schedule.note}</p>
                        )}
                      </div>

                      {isChecked && (
                        <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 pr-2">
                          <Sparkles className="w-3.5 h-3.5" />
                          Selesai!
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
