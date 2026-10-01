import { useState } from 'react';
import { Plus, Trash2, Sparkles, Tag, Clock, Settings2 } from 'lucide-react';
import { COLOR_PALETTES, type CategoryColor } from '../lib/dataService';
import { useDataStore } from '../store/dataStore';
import { toast } from '../store/toastStore';
import Modal from './Modal';
import CategoryBadge from './CategoryBadge';

interface CustomManagerModalProps {
  onClose: () => void;
  initialTab?: 'presets' | 'categories';
}

const EMOJI_SUGGESTIONS = ['💼', '🏃', '☕', '📚', '✨', '🎮', '🕌', '🎨', '🌿', '🐾', '🎸', '💻', '🧘', '🍕', '💤'];

const COLOR_NAMES: Record<CategoryColor, string> = {
  blue: 'Biru',
  emerald: 'Hijau',
  amber: 'Kuning',
  purple: 'Ungu',
  rose: 'Merah muda',
  pink: 'Pink',
  cyan: 'Toska',
  indigo: 'Nila',
};

const fieldClass =
  'px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none';

export default function CustomManagerModal({ onClose, initialTab = 'presets' }: CustomManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'categories'>(initialTab);
  const { categories, presets, addPreset, deletePreset, addCategory, deleteCategory } = useDataStore();

  // Form preset baru
  const [presetTitle, setPresetTitle] = useState('');
  const [presetTime, setPresetTime] = useState('08:00');
  const [presetCategory, setPresetCategory] = useState('');

  // Form kategori baru
  const [categoryLabel, setCategoryLabel] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('✨');
  const [categoryColor, setCategoryColor] = useState<CategoryColor>('purple');

  const selectedPresetCategory = categories.some((c) => c.id === presetCategory)
    ? presetCategory
    : (categories[0]?.id ?? 'routine');

  const handleAddPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetTitle.trim()) return;
    const ok = await addPreset({ title: presetTitle.trim(), time: presetTime, category: selectedPresetCategory });
    if (ok) {
      setPresetTitle('');
      toast.success('Preset tersimpan!');
    }
  };

  const handleDeletePreset = async (id: string, title: string) => {
    const undo = await deletePreset(id);
    if (undo) toast.info(`Preset "${title}" dihapus`, { actionLabel: 'Urungkan', onAction: () => void undo() });
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = categoryLabel.trim();
    if (!label) return;
    if (categories.some((c) => c.label.toLowerCase() === label.toLowerCase())) {
      toast.error(`Kategori "${label}" sudah ada.`);
      return;
    }
    const created = await addCategory({ label, icon: categoryIcon.trim() || '✨', color: categoryColor });
    if (created) {
      setCategoryLabel('');
      toast.success('Kategori tersimpan!');
    }
  };

  const handleDeleteCategory = async (id: string, label: string) => {
    const undo = await deleteCategory(id);
    if (undo) toast.info(`Kategori "${label}" dihapus`, { actionLabel: 'Urungkan', onAction: () => void undo() });
  };

  const tabClass = (active: boolean) =>
    `flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
      active
        ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm'
        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
    }`;

  return (
    <Modal onClose={onClose} title="Preset & Kategori" icon={<Settings2 className="w-4 h-4" />}>
      <div className="space-y-5">
        <div
          role="tablist"
          aria-label="Pilih yang ingin dikelola"
          className="flex items-center p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50"
        >
          <button role="tab" aria-selected={activeTab === 'presets'} onClick={() => setActiveTab('presets')} className={tabClass(activeTab === 'presets')}>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Preset Cepat ({presets.length})</span>
          </button>
          <button role="tab" aria-selected={activeTab === 'categories'} onClick={() => setActiveTab('categories')} className={tabClass(activeTab === 'categories')}>
            <Tag className="w-3.5 h-3.5 text-purple-500" />
            <span>Kategori ({categories.length})</span>
          </button>
        </div>

        {activeTab === 'presets' ? (
          <div role="tabpanel" className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Preset muncul sebagai tombol cepat di form jadwal. Klik sekali, nama/jam/kategori langsung terisi.
            </p>
            <form
              onSubmit={handleAddPreset}
              className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 space-y-3"
            >
              <input
                type="text"
                placeholder="Judul (misal: Minum Vitamin 💊)"
                aria-label="Judul preset"
                maxLength={120}
                value={presetTitle}
                onChange={(e) => setPresetTitle(e.target.value)}
                required
                className={`${fieldClass} w-full focus:ring-2 focus:ring-sky-400`}
              />
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="time"
                  aria-label="Jam preset"
                  value={presetTime}
                  onChange={(e) => setPresetTime(e.target.value)}
                  required
                  className={`${fieldClass} focus:ring-2 focus:ring-sky-400`}
                />
                <select
                  aria-label="Kategori preset"
                  value={selectedPresetCategory}
                  onChange={(e) => setPresetCategory(e.target.value)}
                  className={`${fieldClass} min-w-0 focus:ring-2 focus:ring-sky-400`}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-sky-500 to-amber-500 hover:from-sky-400 hover:to-amber-600 text-white shadow-sm active:scale-[0.99] transition-transform flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                Tambah Preset
              </button>
            </form>

            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Preset tersimpan</p>
              {presets.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada preset.</p>
              ) : (
                presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{preset.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                          <Clock className="w-2.5 h-2.5" />
                          {preset.time}
                        </span>
                        <CategoryBadge categories={categories} categoryId={preset.category} />
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePreset(preset.id, preset.title)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      aria-label={`Hapus preset ${preset.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div role="tabpanel" className="space-y-4">
            <form
              onSubmit={handleAddCategory}
              className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 space-y-3"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={categoryIcon}
                  onChange={(e) => setCategoryIcon(e.target.value)}
                  aria-label="Ikon kategori (emoji)"
                  className={`${fieldClass} w-14 text-center flex-shrink-0 focus:ring-2 focus:ring-purple-400`}
                />
                <input
                  type="text"
                  placeholder="Nama kategori (misal: Ibadah)"
                  aria-label="Nama kategori"
                  maxLength={30}
                  value={categoryLabel}
                  onChange={(e) => setCategoryLabel(e.target.value)}
                  required
                  className={`${fieldClass} flex-1 min-w-0 focus:ring-2 focus:ring-purple-400`}
                />
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">Ikon cepat</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {EMOJI_SUGGESTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCategoryIcon(emoji)}
                      aria-label={`Pilih ikon ${emoji}`}
                      aria-pressed={categoryIcon === emoji}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${
                        categoryIcon === emoji
                          ? 'bg-purple-100 dark:bg-purple-900/60 ring-1 ring-purple-400'
                          : 'hover:bg-white dark:hover:bg-slate-700/60'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                  Warna: <span className="text-purple-600 dark:text-purple-400">{COLOR_NAMES[categoryColor]}</span>
                </span>
                <div role="radiogroup" aria-label="Warna badge" className="flex items-center gap-2 flex-wrap">
                  {(Object.keys(COLOR_PALETTES) as CategoryColor[]).map((col) => (
                    <button
                      key={col}
                      type="button"
                      role="radio"
                      aria-checked={categoryColor === col}
                      onClick={() => setCategoryColor(col)}
                      aria-label={`Warna ${COLOR_NAMES[col]}`}
                      className={`w-7 h-7 rounded-full ${COLOR_PALETTES[col].dot} flex items-center justify-center transition-transform ${
                        categoryColor === col
                          ? 'scale-110 ring-2 ring-purple-500 ring-offset-2 ring-offset-purple-50 dark:ring-offset-slate-900'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {categoryColor === col && <span className="text-white text-[10px] font-black">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Pratinjau:</span>
                <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md ${COLOR_PALETTES[categoryColor].bg}`}>
                  {categoryIcon || '✨'} {categoryLabel || 'Nama kategori'}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-sm active:scale-[0.99] transition-transform flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                Tambah Kategori
              </button>
            </form>

            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kategori aktif</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                  >
                    <CategoryBadge categories={categories} categoryId={cat.id} className="text-xs" />
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.label)}
                      disabled={categories.length <= 1}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      aria-label={`Hapus kategori ${cat.label}`}
                      title={categories.length <= 1 ? 'Minimal harus ada 1 kategori' : undefined}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
