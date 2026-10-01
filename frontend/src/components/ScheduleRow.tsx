import { Pencil, Trash2 } from 'lucide-react';
import type { CategoryItem, ScheduleItem } from '../lib/dataService';
import CategoryBadge from './CategoryBadge';

interface ScheduleRowProps {
  schedule: ScheduleItem;
  categories: CategoryItem[];
  onEdit: (schedule: ScheduleItem) => void;
  onDelete: (schedule: ScheduleItem) => void;
  /** Label tambahan di atas judul, mis. tanggal untuk tugas sekali jalan. */
  label?: string;
}

export default function ScheduleRow({ schedule, categories, onEdit, onDelete, label }: ScheduleRowProps) {
  return (
    <div className="animate-fade-in-up bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
      <div className="w-14 flex-shrink-0 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900/30 text-sky-700 dark:text-sky-300 py-1.5 text-center leading-tight">
        <span className="block text-xs font-extrabold">{schedule.time}</span>
        {schedule.end_time && <span className="block text-[10px] font-semibold opacity-70">{schedule.end_time}</span>}
      </div>

      <div className="flex-1 min-w-0">
        {label && <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">{label}</p>}
        <p className="font-bold text-sm text-slate-800 dark:text-slate-100 break-words line-clamp-2">{schedule.title}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <CategoryBadge categories={categories} categoryId={schedule.category} />
          {schedule.note && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[14rem]">📝 {schedule.note}</span>
          )}
        </div>
      </div>

      <div className="flex items-center flex-shrink-0">
        <button
          type="button"
          onClick={() => onEdit(schedule)}
          className="p-2.5 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
          aria-label={`Edit jadwal ${schedule.title}`}
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(schedule)}
          className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          aria-label={`Hapus jadwal ${schedule.title}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
