import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Flame, Plus, Trophy, TrendingUp } from 'lucide-react';
import { COLOR_PALETTES } from '../lib/dataService';
import { addDays, DAYS, dayOfWeek, parseDateStr, toDateStr } from '../lib/date';
import { categoryStats, computeStreaks, dailyStats, SUCCESS_RATIO, type DayStat } from '../lib/stats';
import { useNow } from '../lib/useNow';
import { LOG_WINDOW_DAYS, useDataStore } from '../store/dataStore';
import PageLoader from '../components/PageLoader';

const HEATMAP_WEEKS = 12;
const CATEGORY_WINDOW_DAYS = 30;

const pct = (d: Pick<DayStat, 'scheduled' | 'completed'>) =>
  d.scheduled > 0 ? Math.round((d.completed / d.scheduled) * 100) : null;

const shortDate = (dateStr: string) =>
  parseDateStr(dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

/** Satu hue (sky) terang→gelap; mode gelap punya langkahnya sendiri (makin terang = makin banyak). */
function heatClass(d: DayStat | null): string {
  if (!d) return 'bg-transparent';
  if (d.scheduled === 0) return 'bg-slate-100 dark:bg-slate-800/60';
  const r = d.completed / d.scheduled;
  if (r === 0) return 'bg-sky-50 dark:bg-slate-700 ring-1 ring-inset ring-sky-100 dark:ring-slate-600';
  if (r < 0.34) return 'bg-sky-200 dark:bg-sky-900';
  if (r < 0.67) return 'bg-sky-400 dark:bg-sky-700';
  if (r < 1) return 'bg-sky-500 dark:bg-sky-500';
  return 'bg-sky-700 dark:bg-sky-300';
}

function StatTile({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 rounded-3xl p-4 shadow-glass dark:shadow-glass-dark">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </div>
      <p className="mt-1.5 text-2xl font-display font-extrabold text-slate-800 dark:text-white">{value}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

export default function Stats() {
  const { schedules, categories, done, status } = useDataStore();
  const loading = status === 'idle' || status === 'loading';
  const now = useNow(60_000);
  const todayStr = toDateStr(now);
  const [hovered, setHovered] = useState<DayStat | null>(null);

  const all = useMemo(
    () => dailyStats(schedules, done, parseDateStr(todayStr), LOG_WINDOW_DAYS),
    [schedules, done, todayStr]
  );
  const streak = useMemo(() => computeStreaks(all), [all]);
  const last7 = all.slice(-7);
  const week = last7.reduce((acc, d) => ({ scheduled: acc.scheduled + d.scheduled, completed: acc.completed + d.completed }), {
    scheduled: 0,
    completed: 0,
  });
  const completed30 = all.slice(-30).reduce((n, d) => n + d.completed, 0);
  const perCategory = useMemo(
    () => categoryStats(schedules, categories, done, parseDateStr(todayStr), CATEGORY_WINDOW_DAYS),
    [schedules, categories, done, todayStr]
  );

  // Heatmap: kolom = minggu (Senin–Minggu), kolom terakhir = minggu ini
  const heatmap = useMemo(() => {
    const today = parseDateStr(todayStr);
    const firstMonday = addDays(today, -(dayOfWeek(today) - 1) - (HEATMAP_WEEKS - 1) * 7);
    const byDate = new Map(all.map((d) => [d.date, d]));
    return Array.from({ length: HEATMAP_WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const dateStr = toDateStr(addDays(firstMonday, w * 7 + d));
        return dateStr > todayStr ? null : (byDate.get(dateStr) ?? { date: dateStr, scheduled: 0, completed: 0 });
      })
    );
  }, [all, todayStr]);

  if (loading) return <PageLoader />;

  if (schedules.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-white/80 dark:bg-slate-900/70 rounded-3xl border border-white/60 dark:border-white/10 space-y-3">
        <div className="text-4xl">📊</div>
        <p className="font-bold text-slate-800 dark:text-white">Belum ada data untuk statistik</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Tambahkan jadwal dan centang yang selesai — grafikmu akan tumbuh di sini.</p>
        <Link to="/manage" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-sky-500 text-white text-xs font-bold">
          <Plus className="w-4 h-4" /> Tambah jadwal
        </Link>
      </div>
    );
  }

  const weekPct = pct(week);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-extrabold text-slate-800 dark:text-white">Statistik & Streak 📊</h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Hari dihitung berhasil kalau minimal {Math.round(SUCCESS_RATIO * 100)}% jadwalnya selesai. Hari tanpa jadwal tidak memutus streak.
        </p>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile icon={<Flame className="w-4 h-4 text-orange-500" />} label="Streak sekarang" value={`${streak.current} hari`} hint={streak.current >= 7 ? 'Kucing pakai mahkota! 👑' : streak.current > 0 ? 'Pertahankan!' : 'Mulai hari ini!'} />
        <StatTile icon={<Trophy className="w-4 h-4 text-amber-500" />} label="Streak terbaik" value={`${streak.best} hari`} hint="Dalam 1 tahun terakhir" />
        <StatTile icon={<TrendingUp className="w-4 h-4 text-sky-500" />} label="7 hari terakhir" value={weekPct === null ? '–' : `${weekPct}%`} hint={`${week.completed} dari ${week.scheduled} selesai`} />
        <StatTile icon={<CalendarCheck className="w-4 h-4 text-emerald-500" />} label="Selesai 30 hari" value={`${completed30}`} hint="kegiatan dicentang" />
      </div>

      {/* 7 hari terakhir */}
      <section className="overflow-x-clip bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 rounded-3xl p-5 shadow-glass dark:shadow-glass-dark">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Penyelesaian 7 hari terakhir</h2>
        <div className="relative mt-4 h-44" role="list" aria-label="Persentase jadwal selesai per hari">
          {/* Garis bantu 50% & 100% */}
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-slate-200 dark:border-slate-700" aria-hidden="true" />
          <div className="absolute inset-x-0 top-[calc((100%-2.5rem)/2)] border-t border-dashed border-slate-200 dark:border-slate-700" aria-hidden="true" />
          <span className="absolute -top-2 right-0 text-[10px] text-slate-400 bg-white/80 dark:bg-slate-900/80 px-1" aria-hidden="true">100%</span>

          <div className="absolute inset-0 flex items-end gap-2 sm:gap-4">
            {last7.map((d, idx) => {
              const p = pct(d);
              // Tooltip di tepi kiri/kanan ditempel ke tepi supaya tidak keluar layar
              const tipPosition =
                idx === 0 ? 'left-0' : idx === last7.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2';
              const isToday = d.date === todayStr;
              const label = `${shortDate(d.date)}: ${p === null ? 'tidak ada jadwal' : `${d.completed} dari ${d.scheduled} selesai (${p}%)`}`;
              return (
                <div key={d.date} role="listitem" className="group relative flex-1 h-full flex flex-col items-center justify-end">
                  <div
                    tabIndex={0}
                    aria-label={label}
                    className="relative w-full flex-1 flex items-end justify-center outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-md"
                  >
                    {/* Tooltip */}
                    <span className={`pointer-events-none absolute -top-1 ${tipPosition} -translate-y-full whitespace-nowrap rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-semibold px-2 py-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10`}>
                      {label}
                    </span>
                    {p === null ? (
                      <span className="mb-1 text-xs text-slate-300 dark:text-slate-600">–</span>
                    ) : (
                      <div
                        className={`w-full max-w-[2.5rem] rounded-t-[4px] transition-[height] duration-500 ${
                          isToday ? 'bg-sky-500 dark:bg-sky-400' : 'bg-sky-300 dark:bg-sky-700'
                        }`}
                        style={{ height: `${Math.max(p, 2)}%` }}
                      />
                    )}
                  </div>
                  <div className="h-10 pt-1.5 text-center leading-tight">
                    <span className={`block text-[11px] font-bold ${isToday ? 'text-sky-600 dark:text-sky-300' : 'text-slate-500 dark:text-slate-400'}`}>
                      {isToday ? 'Hari ini' : DAYS[dayOfWeek(parseDateStr(d.date)) - 1].short}
                    </span>
                    <span className="block text-[10px] text-slate-400">{isToday && p !== null ? `${p}%` : parseDateStr(d.date).getDate()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Heatmap */}
      <section className="bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 rounded-3xl p-5 shadow-glass dark:shadow-glass-dark">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Konsistensi {HEATMAP_WEEKS} minggu terakhir</h2>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <div className="grid grid-rows-7 gap-[3px] text-[10px] text-slate-400 pr-1" aria-hidden="true">
            {DAYS.map((d) => (
              <span key={d.id} className="h-4 leading-4">
                {d.id % 2 === 1 ? d.short : ''}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]" onMouseLeave={() => setHovered(null)} aria-hidden="true">
            {heatmap.map((weekDays, w) => (
              <div key={w} className="grid grid-rows-7 gap-[3px]">
                {weekDays.map((d, i) => (
                  <div
                    key={i}
                    onMouseEnter={() => setHovered(d)}
                    className={`w-4 h-4 rounded-[4px] ${heatClass(d)} ${d?.date === todayStr ? 'outline outline-2 outline-offset-1 outline-amber-400' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="min-h-[1rem]" aria-live="polite">
            {hovered
              ? `${shortDate(hovered.date)}: ${hovered.scheduled ? `${hovered.completed}/${hovered.scheduled} selesai` : 'tidak ada jadwal'}`
              : 'Arahkan kursor ke kotak untuk melihat detail'}
          </span>
          <span className="flex items-center gap-1" aria-hidden="true">
            Sedikit
            {[0, 0.2, 0.5, 0.8, 1].map((r) => (
              <span key={r} className={`w-3 h-3 rounded-[3px] ${heatClass({ date: '', scheduled: 10, completed: r * 10 })}`} />
            ))}
            Penuh
          </span>
        </div>
        <details className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          <summary className="cursor-pointer font-semibold select-none">Lihat sebagai tabel (14 hari terakhir)</summary>
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="text-slate-400">
                <th className="py-1 font-semibold">Tanggal</th>
                <th className="py-1 font-semibold">Selesai</th>
                <th className="py-1 font-semibold">Persen</th>
              </tr>
            </thead>
            <tbody>
              {all
                .slice(-14)
                .reverse()
                .map((d) => (
                  <tr key={d.date} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-1">{shortDate(d.date)}</td>
                    <td className="py-1">{d.scheduled ? `${d.completed}/${d.scheduled}` : '–'}</td>
                    <td className="py-1">{pct(d) === null ? '–' : `${pct(d)}%`}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      </section>

      {/* Per kategori */}
      <section className="bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 rounded-3xl p-5 shadow-glass dark:shadow-glass-dark">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Per kategori ({CATEGORY_WINDOW_DAYS} hari terakhir)</h2>
        {perCategory.length === 0 ? (
          <p className="text-xs text-slate-400 mt-3">Belum ada data.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {perCategory.map((c) => {
              const p = pct(c) ?? 0;
              const dot = c.category ? COLOR_PALETTES[c.category.color]?.dot : 'bg-slate-400';
              return (
                <li key={c.categoryId}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      <span aria-hidden="true">{c.category?.icon ?? '🏷️'}</span> {c.category?.label ?? 'Tanpa kategori'}
                    </span>
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      {c.completed}/{c.scheduled} · {p}%
                    </span>
                  </div>
                  <div
                    className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
                    role="progressbar"
                    aria-label={`${c.category?.label ?? 'Tanpa kategori'}: ${p}% selesai`}
                    aria-valuenow={p}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className={`h-full rounded-full ${dot}`} style={{ width: `${p}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
