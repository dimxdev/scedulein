import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore, type ToastTone } from '../store/toastStore';

const TONE_STYLES: Record<ToastTone, { box: string; icon: typeof Info }> = {
  info: { box: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900', icon: Info },
  success: { box: 'bg-emerald-600 text-white', icon: CheckCircle2 },
  error: { box: 'bg-rose-600 text-white', icon: XCircle },
};

export default function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div
      className="fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6"
      aria-live="polite"
      role="status"
    >
      {toasts.map((t) => {
        const { box, icon: Icon } = TONE_STYLES[t.tone];
        return (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : undefined}
            className={`pointer-events-auto w-full max-w-md flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl text-sm font-semibold animate-toast-in ${box}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="flex-1 min-w-0">{t.message}</span>
            {t.actionLabel && t.onAction && (
              <button
                type="button"
                onClick={() => {
                  t.onAction?.();
                  dismiss(t.id);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 font-bold text-xs uppercase tracking-wide"
              >
                {t.actionLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="p-1 rounded-lg opacity-70 hover:opacity-100"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
