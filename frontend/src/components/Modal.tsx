import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { ModalCloseContext } from './modalContext';

interface ModalProps {
  /** Dipanggil setelah animasi tutup selesai — parent cukup meng-unmount Modal. */
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}

const CLOSE_ANIMATION_MS = 160;

/**
 * Modal berbasis <dialog> native: fokus otomatis terkunci di dalam modal
 * (konten lain jadi inert), tombol Esc menutup, dan fokus kembali ke tombol
 * pemicu setelah ditutup. Render secara kondisional: {open && <Modal …/>}.
 */
export default function Modal({ onClose, title, icon, children, maxWidth = 'max-w-lg' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const titleId = useId();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const closingRef = useRef(false);
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(() => {
      dialogRef.current?.close();
      onClose();
    }, CLOSE_ANIMATION_MS);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault(); // tangani Esc sendiri supaya animasi tutup tetap jalan
        requestClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose(); // klik di luar panel
      }}
      className={`fixed inset-0 m-0 h-full w-full max-h-none max-w-none bg-transparent p-0 sm:p-4 open:flex items-end sm:items-center justify-center backdrop:bg-slate-900/60 ${
        closing ? 'backdrop:animate-[fadeIn_0.16s_ease-in_reverse_both]' : 'backdrop:animate-fade-in'
      }`}
    >
      <div
        className={`relative w-full ${maxWidth} max-h-[92vh] overflow-y-auto overflow-x-hidden bg-white dark:bg-slate-900 border border-white/60 dark:border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-800 dark:text-slate-100 ${
          closing ? 'animate-modal-out' : 'animate-modal-in'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <div className="w-8 h-8 flex-shrink-0 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
                {icon}
              </div>
            )}
            <h2 id={titleId} className="text-lg font-display font-extrabold truncate">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <ModalCloseContext.Provider value={requestClose}>{children}</ModalCloseContext.Provider>
      </div>
    </dialog>
  );
}
