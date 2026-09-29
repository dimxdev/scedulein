import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Sparkles, Tag, Clock, AlertCircle } from 'lucide-react';
import {
  dataService,
  COLOR_PALETTES,
  type CategoryItem,
  type PresetItem,
} from '../lib/dataService';

interface CustomManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  initialTab?: 'presets' | 'categories';
}

const EMOJI_SUGGESTIONS = ['💼', '🏃', '☕', '📚', '✨', '🎮', '🕌', '🎨', '🌿', '🐾', '🎸', '💻', '🧘', '🍕', '💤'];

export default function CustomManagerModal({
  isOpen,
  onClose,
  onUpdate,
  initialTab = 'presets',
}: CustomManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'categories'>(initialTab);
  const [errorMessage, setErrorMessage] = useState('');

  // Lists
  const [categories, setCategories] = useState<CategoryItem[]>(() => dataService.getCategories());
  const [presets, setPresets] = useState<PresetItem[]>(() => dataService.getPresets());

  // New Preset Form
  const [presetTitle, setPresetTitle] = useState('');
  const [presetTime, setPresetTime] = useState('08:00');
  const [presetCategory, setPresetCategory] = useState<string>(categories[0]?.id || 'routine');

  // New Category Form
  const [categoryLabel, setCategoryLabel] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('✨');
  const [categoryColor, setCategoryColor] = useState<CategoryItem['color']>('purple');

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const refreshData = () => {
    setCategories(dataService.getCategories());
    setPresets(dataService.getPresets());
    onUpdate();
  };

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetTitle.trim()) return;

    dataService.addPreset({
      title: presetTitle.trim(),
      time: presetTime,
      category: presetCategory,
    });

    setPresetTitle('');
    setErrorMessage('');
    refreshData();
  };

  const handleDeletePreset = (id: string, title: string) => {
    if (window.confirm(`Hapus preset "${title}"?`)) {
      dataService.deletePreset(id);
      refreshData();
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryLabel.trim()) return;

    dataService.addCategory({
      label: categoryLabel.trim(),
      icon: categoryIcon || '✨',
      color: categoryColor,
    });

    setCategoryLabel('');
    setErrorMessage('');
    refreshData();
  };

  const handleDeleteCategory = (id: string, label: string) => {
    if (window.confirm(`Hapus kategori "${label}"?`)) {
      const success = dataService.deleteCategory(id);
      if (!success) {
        setErrorMessage('Minimal harus ada 1 kategori tersisa!');
        return;
      }
      setErrorMessage('');
      refreshData();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-manager-modal-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto overflow-x-hidden backdrop-blur-2xl bg-white/90 dark:bg-slate-900/95 border border-white/60 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center font-bold">
                ⚙️
              </div>
              <h2
                id="custom-manager-modal-title"
                className="text-lg font-display font-extrabold text-slate-800 dark:text-white"
              >
                Kelola Preset & Kategori
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Tutup jendela modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Inline Error Alert */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tab Selector */}
          <div
            role="tablist"
            aria-label="Kategori Tab"
            className="flex items-center p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50"
          >
            <button
              role="tab"
              aria-selected={activeTab === 'presets'}
              onClick={() => {
                setActiveTab('presets');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'presets'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Preset Cepat ({presets.length})</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'categories'}
              onClick={() => {
                setActiveTab('categories');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'categories'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-purple-500" />
              <span>Kategori Kustom ({categories.length})</span>
            </button>
          </div>

          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              {/* Form Add Preset */}
              <form onSubmit={handleAddPreset} className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 space-y-3">
                <p className="text-xs font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Preset Jadwal Baru</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <input
                    type="text"
                    placeholder="Judul (misal: Minum Vitamin 💊)"
                    aria-label="Judul preset jadwal"
                    value={presetTitle}
                    onChange={(e) => setPresetTitle(e.target.value)}
                    required
                    className="sm:col-span-6 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-sky-400 outline-none"
                  />
                  <input
                    type="time"
                    aria-label="Waktu jadwal preset"
                    value={presetTime}
                    onChange={(e) => setPresetTime(e.target.value)}
                    required
                    className="sm:col-span-3 px-2 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-sky-400 outline-none"
                  />
                  <select
                    aria-label="Pilih kategori preset"
                    value={presetCategory}
                    onChange={(e) => setPresetCategory(e.target.value)}
                    className="sm:col-span-3 px-2 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-sky-400 outline-none"
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
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-sky-500 to-amber-500 hover:from-sky-400 hover:to-amber-600 text-white shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-transform flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Simpan ke Daftar Preset</span>
                </button>
              </form>

              {/* List of Existing Presets */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Daftar Preset Tersimpan
                </p>
                {presets.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada preset.</p>
                ) : (
                  presets.map((preset) => {
                    const catObj = categories.find((c) => c.id === preset.category) || categories[0];
                    const catStyle = catObj ? COLOR_PALETTES[catObj.color] : COLOR_PALETTES.blue;
                    return (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                            {preset.title}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                            <Clock className="w-2.5 h-2.5" />
                            {preset.time}
                          </span>
                          {catObj && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${catStyle.bg}`}>
                              {catObj.icon} {catObj.label}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeletePreset(preset.id, preset.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Hapus Preset"
                          aria-label={`Hapus preset ${preset.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              {/* Form Add Category */}
              <form onSubmit={handleAddCategory} className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 space-y-3">
                <p className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Kategori Kustom Baru</span>
                </p>

                {/* Inputs: Icon & Label */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={2}
                    value={categoryIcon}
                    onChange={(e) => setCategoryIcon(e.target.value)}
                    placeholder="Icon"
                    aria-label="Ikon kategori (emoji)"
                    className="w-12 text-center py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-purple-400 outline-none flex-shrink-0 shadow-sm"
                  />
                  <input
                    type="text"
                    placeholder="Nama Kategori (misal: Gaming / Ibadah)"
                    aria-label="Nama kategori"
                    value={categoryLabel}
                    onChange={(e) => setCategoryLabel(e.target.value)}
                    required
                    className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-purple-400 outline-none shadow-sm"
                  />
                </div>

                {/* Color Selector with dedicated wrapped container */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Pilih Warna Badge:</span>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider capitalize">{categoryColor}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap p-2 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                    {(Object.keys(COLOR_PALETTES) as CategoryItem['color'][]).map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setCategoryColor(col)}
                        aria-label={`Warna ${col}`}
                        className={`w-7 h-7 rounded-full ${COLOR_PALETTES[col].dot} flex items-center justify-center transition-all ${
                          categoryColor === col
                            ? 'scale-110 ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-900 shadow-md'
                            : 'opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                        title={col}
                      >
                        {categoryColor === col && <span className="text-white text-[10px] font-black">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Emoji Quick Suggestions */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Pilih Ikon Cepat:</span>
                  <div className="flex items-center gap-1.5 flex-wrap p-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                    {EMOJI_SUGGESTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setCategoryIcon(emoji)}
                        aria-label={`Pilih ikon ${emoji}`}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                          categoryIcon === emoji
                            ? 'bg-purple-100 dark:bg-purple-900/60 scale-110 shadow-sm ring-1 ring-purple-400'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-transform flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Simpan Kategori Baru</span>
                </button>
              </form>

              {/* List of Existing Categories */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Daftar Kategori Aktif
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const style = COLOR_PALETTES[cat.color] || COLOR_PALETTES.purple;
                    return (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs shadow-sm"
                      >
                        <span className={`font-bold px-2 py-0.5 rounded-lg flex items-center gap-1.5 ${style.bg}`}>
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </span>

                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.label)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Hapus Kategori"
                          aria-label={`Hapus kategori ${cat.label}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
