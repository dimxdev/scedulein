import { useMemo, useRef, useState } from 'react';
import { CalendarDays, Copy, Pencil, Pin, Plus, Settings2 } from 'lucide-react';
import type { ScheduleItem } from '../lib/dataService';
import { addDays, DAYS, dayName, dayOfWeek, parseDateStr, toDateStr } from '../lib/date';
import { useDataStore } from '../store/dataStore';
import { useNow } from '../lib/useNow';
import { toast } from '../store/toastStore';
import CustomManagerModal from '../components/CustomManagerModal';
import CopyDayModal from '../components/CopyDayModal';
import Modal from '../components/Modal';
import ScheduleForm from '../components/ScheduleForm';
import ScheduleRow from '../components/ScheduleRow';
import PageLoader from '../components/PageLoader';

function relativeDateLabel(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return 'Hari ini';
  if (dateStr === toDateStr(addDays(parseDateStr(todayStr), 1))) return 'Besok';
  return parseDateStr(dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function ManageSchedule() {
  const { schedules, categories, status, deleteSchedule } = useDataStore();
  const loading = status === 'idle' || status === 'loading';

  const now = useNow();
  const todayDay = dayOfWeek(now);
  const todayStr = toDateStr(now);
  const [activeTab, setActiveTab] = useState(() => dayOfWeek(new Date()));
  const [formDays, setFormDays] = useState<number[]>(() => [dayOfWeek(new Date())]);
  const [manageTab, setManageTab] = useState<'presets' | 'categories' | null>(null);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [copying, setCopying] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const weekly = useMemo(() => schedules.filter((s) => !s.date), [schedules]);
  const activeDaySchedules = weekly.filter((s) => s.day_of_week === activeTab);
  const upcomingOnce = useMemo(
    () =>
      schedules
        .filter((s) => s.date && s.date >= todayStr)
        .sort((a, b) => a.date!.localeCompare(b.date!) || a.time.localeCompare(b.time)),
    [schedules, todayStr]
  );

  const selectDay = (day: number) => {
    setActiveTab(day);
    setFormDays([day]); // form tambah ikut hari yang sedang dilihat
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    formRef.current?.querySelector<HTMLInputElement>('input[type="text"]')?.focus({ preventScroll: true });
  };

  const handleDelete = async (schedule: ScheduleItem) => {
    const undo = await deleteSchedule(schedule.id);
    if (undo) {
      toast.info(`"${schedule.title}" dihapus`, { actionLabel: 'Urungkan', onAction: () => void undo() });
    }
  };

  return (
    <div className="space-y-6">
      {/* Judul */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-slate-800 dark:text-white">
            Atur Jadwal Mingguan 🗓️
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Pilih hari untuk melihat, menambah, atau mengubah rutinitasmu.
          </p>
        </div>
        <button
          onClick={() => setManageTab('presets')}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 shadow-sm text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
        >
          <Settings2 className="w-4 h-4 text-sky-500" />
          Preset & Kategori
        </button>
      </div>

      {/* Tab hari */}
      <div
        role="tablist"
        aria-label="Pilih hari"
        className="bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 rounded-3xl p-2 shadow-glass dark:shadow-glass-dark"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {DAYS.map((day) => {
            const count = weekly.filter((s) => s.day_of_week === day.id).length;
            const isActive = activeTab === day.id;
            const isToday = day.id === todayDay;
            return (
              <button
                key={day.id}
                role="tab"
                aria-selected={isActive}
                aria-label={`${day.name}${isToday ? ' (hari ini)' : ''}, ${count} jadwal`}
                onClick={() => selectDay(day.id)}
                className={`relative flex-1 min-w-[42px] sm:min-w-[72px] py-2.5 sm:py-3 px-1 sm:px-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-center transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-amber-400 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="text-[11px] sm:text-xs font-bold hidden sm:inline">{day.name}</span>
                <span className="text-[11px] font-bold sm:hidden">{day.short}</span>
                <span
                  className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 rounded-full ${
                    isActive ? 'bg-white/30 text-white' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
                {isToday && (
                  <span
                    className={`absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-amber-400'}`}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Daftar jadwal */}
        <div className="lg:col-span-3 space-y-6">
          <section className="space-y-3" aria-labelledby="day-list-title">
            <div className="flex items-center justify-between gap-2 px-1">
              <h2 id="day-list-title" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-sky-500" />
                Rutinitas {dayName(activeTab)}
                <span className="text-xs text-slate-400 font-semibold">· {activeDaySchedules.length} jadwal</span>
              </h2>
              <div className="flex items-center gap-3">
                {activeDaySchedules.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCopying(true)}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Salin ke hari lain
                  </button>
                )}
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="lg:hidden text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah
                </button>
              </div>
            </div>

            {loading ? (
              <PageLoader />
            ) : activeDaySchedules.length === 0 ? (
              <div className="text-center py-10 px-4 bg-white/60 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300/80 dark:border-slate-700">
                <span className="text-3xl inline-block mb-1">🌤️</span>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada jadwal untuk {dayName(activeTab)}</p>
                <p className="text-xs text-slate-400 mt-1">Isi form di <span className="hidden lg:inline">samping</span><span className="lg:hidden">bawah</span> untuk menambah rutinitas.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeDaySchedules.map((schedule) => (
                  <ScheduleRow
                    key={schedule.id}
                    schedule={schedule}
                    categories={categories}
                    onEdit={setEditing}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Tugas sekali jalan */}
          {!loading && upcomingOnce.length > 0 && (
            <section className="space-y-3" aria-labelledby="once-list-title">
              <h2 id="once-list-title" className="px-1 text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Pin className="w-4 h-4 text-amber-500" />
                Tugas Sekali Jalan
                <span className="text-xs text-slate-400 font-semibold">· {upcomingOnce.length} mendatang</span>
              </h2>
              <div className="space-y-2.5">
                {upcomingOnce.map((schedule) => (
                  <ScheduleRow
                    key={schedule.id}
                    schedule={schedule}
                    categories={categories}
                    label={relativeDateLabel(schedule.date!, todayStr)}
                    onEdit={setEditing}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Form tambah */}
        <div ref={formRef} className="lg:col-span-2 lg:sticky lg:top-28 scroll-mt-28">
          <section
            aria-labelledby="add-form-title"
            className="bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-glass dark:shadow-glass-dark"
          >
            <h2 id="add-form-title" className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-sky-500" />
              Tambah Jadwal
            </h2>
            <ScheduleForm mode="add" days={formDays} onDaysChange={setFormDays} onManage={setManageTab} />
          </section>
        </div>
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title="Edit Jadwal" icon={<Pencil className="w-4 h-4" />}>
          <ScheduleForm mode="edit" initial={editing} onManage={setManageTab} />
        </Modal>
      )}

      {copying && <CopyDayModal fromDay={activeTab} onClose={() => setCopying(false)} />}

      {manageTab && <CustomManagerModal initialTab={manageTab} onClose={() => setManageTab(null)} />}
    </div>
  );
}
