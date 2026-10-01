import { useState } from 'react';
import { Copy } from 'lucide-react';
import { DAYS, dayName } from '../lib/date';
import { useDataStore, type NewSchedule } from '../store/dataStore';
import { toast } from '../store/toastStore';
import Modal from './Modal';
import { useModalClose } from './modalContext';

interface CopyDayModalProps {
  fromDay: number;
  onClose: () => void;
}

export default function CopyDayModal({ fromDay, onClose }: CopyDayModalProps) {
  return (
    <Modal onClose={onClose} title={`Salin jadwal ${dayName(fromDay)}`} icon={<Copy className="w-4 h-4" />}>
      <CopyDayForm fromDay={fromDay} />
    </Modal>
  );
}

function CopyDayForm({ fromDay }: { fromDay: number }) {
  const { schedules, addSchedules } = useDataStore();
  const close = useModalClose();
  const [targets, setTargets] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const source = schedules.filter((s) => !s.date && s.day_of_week === fromDay);
  const key = (title: string, time: string) => `${title.toLowerCase()}|${time}`;

  const toggle = (id: number) =>
    setTargets((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id].sort((a, b) => a - b)));

  const handleCopy = async () => {
    const items: NewSchedule[] = [];
    let skipped = 0;
    for (const day of targets) {
      const existing = new Set(
        schedules.filter((s) => !s.date && s.day_of_week === day).map((s) => key(s.title, s.time))
      );
      for (const s of source) {
        if (existing.has(key(s.title, s.time))) {
          skipped++;
          continue;
        }
        items.push({
          day_of_week: day,
          time: s.time,
          end_time: s.end_time ?? null,
          title: s.title,
          category: s.category,
          note: s.note ?? null,
          date: null,
        });
      }
    }

    if (items.length === 0) {
      toast.info('Semua jadwal sudah ada di hari tujuan, tidak ada yang disalin.');
      close();
      return;
    }

    setBusy(true);
    const ok = await addSchedules(items);
    setBusy(false);
    if (ok) {
      toast.success(`${items.length} jadwal disalin${skipped ? ` (${skipped} yang sudah ada dilewati)` : ''}.`);
      close();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Salin <strong>{source.length} jadwal</strong> dari hari {dayName(fromDay)} ke:
      </p>
      <div role="group" aria-label="Hari tujuan" className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
        {DAYS.filter((d) => d.id !== fromDay).map((d) => {
          const active = targets.includes(d.id);
          return (
            <button
              key={d.id}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => toggle(d.id)}
              className={`py-2.5 rounded-xl text-xs font-bold transition-colors ${
                active
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-100/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
              }`}
            >
              {d.short}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400">Jadwal dengan nama & jam yang sama di hari tujuan akan dilewati.</p>
      <button
        type="button"
        disabled={busy || targets.length === 0}
        onClick={handleCopy}
        className="w-full py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-sky-500 to-amber-400 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
      >
        <Copy className="w-4 h-4" />
        {busy ? 'Menyalin...' : targets.length ? `Salin ke ${targets.length} hari` : 'Pilih hari tujuan'}
      </button>
    </div>
  );
}
