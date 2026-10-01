import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
  duration: number;
}

type ToastInput = Partial<Omit<ToastItem, 'id' | 'message'>>;

interface ToastState {
  toasts: ToastItem[];
  show: (message: string, options?: ToastInput) => number;
  dismiss: (id: number) => void;
}

const MAX_TOASTS = 3;
let nextId = 1;
const timers = new Map<number, number>();

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show: (message, options = {}) => {
    const id = nextId++;
    const item: ToastItem = {
      id,
      message,
      tone: options.tone ?? 'info',
      actionLabel: options.actionLabel,
      onAction: options.onAction,
      duration: options.duration ?? (options.actionLabel ? 6000 : 3500),
    };
    const next = [...get().toasts, item];
    next.slice(0, Math.max(0, next.length - MAX_TOASTS)).forEach((t) => get().dismiss(t.id));
    set((state) => ({ toasts: [...state.toasts, item] }));
    timers.set(id, window.setTimeout(() => get().dismiss(id), item.duration));
    return id;
  },

  dismiss: (id) => {
    window.clearTimeout(timers.get(id));
    timers.delete(id);
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export const toast = {
  info: (message: string, options?: ToastInput) => useToastStore.getState().show(message, { ...options, tone: 'info' }),
  success: (message: string, options?: ToastInput) =>
    useToastStore.getState().show(message, { ...options, tone: 'success' }),
  error: (message: string, options?: ToastInput) =>
    useToastStore.getState().show(message, { duration: 6000, ...options, tone: 'error' }),
};
