import { COLOR_PALETTES, type CategoryItem } from '../lib/dataService';

const FALLBACK_STYLE = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

interface CategoryBadgeProps {
  categories: CategoryItem[];
  categoryId: string | undefined;
  className?: string;
}

export default function CategoryBadge({ categories, categoryId, className = '' }: CategoryBadgeProps) {
  const category = categories.find((c) => c.id === categoryId);
  const style = category ? COLOR_PALETTES[category.color]?.bg ?? FALLBACK_STYLE : FALLBACK_STYLE;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${style} ${className}`}>
      <span aria-hidden="true">{category?.icon ?? '🏷️'}</span>
      <span>{category?.label ?? 'Tanpa kategori'}</span>
    </span>
  );
}
