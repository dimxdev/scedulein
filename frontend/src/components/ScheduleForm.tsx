import { useId, useRef, useState } from 'react';
import { Check, Clock, NotebookPen, Plus, Repeat, Save, Settings2, Sparkles, CalendarDays } from 'lucide-react';
import { COLOR_PALETTES, type ScheduleItem } from '../lib/dataService';
import { DAYS, dayName, dayOfWeek, parseDateStr, toDateStr } from '../lib/date';
import { useDataStore, type NewSchedule } from '../store/dataStore';
import { toast } from '../store/toastStore';
import { useModalClose } from './modalContext';

type Kind = 'weekly' | 'once';

interface ScheduleFormProps {
  mode: 'add' | 'edit';
  /** Jadwal yang diedit (mode edit). */
  initial?: ScheduleItem;
  /** Hari terpilih — dikontrol parent di mode tambah supaya ikut tab hari yang aktif. */
  days?: number[];
  onDaysChange?: (days: number[]) => void;
  onManage: (tab: 'presets' | 'categories') => void;
}

const DAY_SHORTCUTS = [
  { label: 'Sen–Jum', days: [1, 2, 3, 4, 5] },
  { label: 'Sab–Min', days: [6, 7] },
  { label: 'Setiap hari', days: [1, 2, 3, 4, 5, 6, 7] },
];

const inputClass =
  'w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium transition-all';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5';

export default function ScheduleForm({ mode, initial, days, onDaysChange, onManage }: ScheduleFormProps) {
  const { categories, presets, addSchedules, updateSchedule } = useDataStore();
  const closeModal = useModalClose();
  const uid = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [todayStr] = useState(() => toDateStr(new Date()));

  const [kind, setKind] = useState<Kind>(initial?.date ? 'once' : 'weekly');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [time, setTime] = useState(initial?.time ?? '08:00');
  const [endTime, setEndTime] = useState(initial?.end_time ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [showNote, setShowNote] = useState(Boolean(initial?.note));
  const [date, setDate] = useState(initial?.date ?? todayStr);
  const [ownDays, setOwnDays] = useState<number[]>(() => (initial ? [initial.day_of_week] : [dayOfWeek(new Date())]));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedDays = days ?? ownDays;
  const setSelectedDays = (next: number[]) => (onDaysChange ? onDaysChange(next) : setOwnDays(next));
  const selectedCategory = categories.some((c) => c.id === category) ? category : (categories[0]?.id ?? 'routine');

  const toggleDay = (id: number) => {
    if (mode === 'edit') {
      setSelectedDays([id]); // satu jadwal = satu hari
      return;
    }
    setSelectedDays(
      selectedDays.includes(id) ? selectedDays.filter((d) => d !== id) : [...selectedDays, id].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanTitle = title.trim();
    if (!cleanTitle) return setError('Nama kegiatan wajib diisi.');
    if (endTime && endTime <= time) return setError('Jam selesai harus setelah jam mulai.');
    if (kind === 'weekly' && selectedDays.length === 0) return setError('Pilih minimal satu hari.');
    if (kind === 'once' && !date) return setError('Pilih tanggal untuk tugas ini.');

    const base = {
      time,
      end_time: endTime || null,
      title: cleanTitle,
      category: selectedCategory,
      note: note.trim() || null,
    };

    setSubmitting(true);
    if (mode === 'edit' && initial) {
      const patch =
        kind === 'once'
          ? { ...base, date, day_of_week: dayOfWeek(parseDateStr(date)) }
          : { ...base, date: null, day_of_week: selectedDays[0] ?? initial.day_of_week };
      const ok = await updateSchedule(initial.id, patch);
      setSubmitting(false);
      if (ok) {
        toast.success('Perubahan jadwal tersimpan!');
        closeModal();
      }
      return;
    }

    const items: NewSchedule[] =
      kind === 'once'
        ? [{ ...base, date, day_of_week: dayOfWeek(parseDateStr(date)) }]
        : selectedDays.map((d) => ({ ...base, date: null, day_of_week: d }));
    const ok = await addSchedules(items);
    setSubmitting(false);
    if (ok) {
      toast.success(
        kind === 'once'
          ? 'Tugas tersimpan!'
          : selectedDays.length > 1
            ? `Jadwal tersimpan di ${selectedDays.length} hari!`
            : `Jadwal ${dayName(selectedDays[0])} tersimpan!`
      );
      setTitle('');
      setNote('');
      setShowNote(false);
      titleRef.current?.focus(); // siap mengetik jadwal berikutnya
    }
  };

  const submitLabel =
    mode === 'edit'
      ? 'Simpan Perubahan'
      : kind === 'once'
        ? 'Simpan Tugas'
        : selectedDays.length > 1
          ? `Simpan di ${selectedDays.length} Hari`
          : 'Simpan Jadwal';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Jenis jadwal */}
      <div role="radiogroup" aria-label="Jenis jadwal" className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50">
        {(
          [
            { id: 'weekly', label: 'Rutin mingguan', icon: Repeat },
            { id: 'once', label: 'Sekali jalan', icon: CalendarDays },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={kind === opt.id}
            onClick={() => setKind(opt.id)}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              kind === opt.id
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <opt.icon className="w-3.5 h-3.5" />
            {opt.label}
          </button>
        ))}
      </div>

      {/* Preset cepat (mode tambah) */}
      {mode === 'add' && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className={labelClass + ' mb-0'}>Preset cepat</span>
            <button
              type="button"
              onClick={() => onManage('presets')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Kelola
            </button>
          </div>
          {presets.length === 0 ? (
            <p className="text-xs text-slate-400">Belum ada preset. Buat lewat tombol Kelola.</p>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs -mx-1 px-1">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setTitle(p.title);
                    setTime(p.time);
                    setCategory(p.category);
                    setError('');
                  }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/70 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 transition-colors font-medium flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{p.title}</span>
                  <span className="text-[10px] text-slate-400">{p.time}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nama */}
      <div>
        <label htmlFor={`${uid}-title`} className={labelClass}>
          Nama kegiatan
        </label>
        <input
          ref={titleRef}
          id={`${uid}-title`}
          type="text"
          maxLength={120}
          placeholder="Misal: Review PR di GitHub / Lari pagi 3km"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Jam */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${uid}-time`} className={labelClass}>
            Jam mulai
          </label>
          <div className="relative">
            <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id={`${uid}-time`}
              type="time"
              className={inputClass + ' pl-10 pr-3'}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor={`${uid}-end`} className={labelClass}>
            Selesai <span className="normal-case font-semibold tracking-normal">(opsional)</span>
          </label>
          <input
            id={`${uid}-end`}
            type="time"
            className={inputClass + ' px-3'}
            value={endTime}
            min={time}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      {/* Hari / tanggal */}
      {kind === 'weekly' ? (
        <fieldset>
          <legend className={labelClass}>{mode === 'edit' ? 'Hari' : 'Ulangi setiap'}</legend>
          <div role={mode === 'edit' ? 'radiogroup' : 'group'} aria-label="Hari" className="flex flex-wrap gap-1.5">
            {DAYS.map((d) => {
              const active = selectedDays.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  role={mode === 'edit' ? 'radio' : 'checkbox'}
                  aria-checked={active}
                  aria-label={d.name}
                  onClick={() => toggleDay(d.id)}
                  className={`w-11 py-2 rounded-xl text-xs font-bold transition-colors ${
                    active
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'bg-slate-100/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
                  }`}
                >
                  {d.short}
                </button>
              );
            })}
          </div>
          {mode === 'add' && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {DAY_SHORTCUTS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setSelectedDays(s.days)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </fieldset>
      ) : (
        <div>
          <label htmlFor={`${uid}-date`} className={labelClass}>
            Tanggal
          </label>
          <input
            id={`${uid}-date`}
            type="date"
            className={inputClass}
            value={date}
            min={mode === 'add' ? todayStr : undefined}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      )}

      {/* Kategori */}
      <fieldset>
        <div className="flex items-center justify-between mb-1.5">
          <legend className={labelClass + ' mb-0'}>Kategori</legend>
          <button
            type="button"
            onClick={() => onManage('categories')}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Kelola
          </button>
        </div>
        <div role="radiogroup" aria-label="Kategori" className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const style = COLOR_PALETTES[cat.color] ?? COLOR_PALETTES.purple;
            return (
              <button
                key={cat.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? `${style.bg} ring-2 ring-sky-400 shadow-sm`
                    : 'bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <span aria-hidden="true">{cat.icon}</span>
                <span>{cat.label}</span>
                {isSelected && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Catatan */}
      {showNote ? (
        <div>
          <label htmlFor={`${uid}-note`} className={labelClass}>
            Catatan
          </label>
          <textarea
            id={`${uid}-note`}
            rows={2}
            maxLength={300}
            placeholder="Detail kecil, link, atau pengingat untuk dirimu"
            className={inputClass + ' resize-none'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNote(true)}
          className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1.5"
        >
          <NotebookPen className="w-3.5 h-3.5" />
          Tambah catatan
        </button>
      )}

      {error && (
        <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-sky-500 to-amber-400 hover:from-sky-400 hover:to-amber-500 text-white shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
      >
        {mode === 'edit' ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[3]" />}
        <span>{submitting ? 'Menyimpan...' : submitLabel}</span>
      </button>
    </form>
  );
}
