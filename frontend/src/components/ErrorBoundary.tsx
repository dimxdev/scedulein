import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

const isChunkError = (error: Error) =>
  /dynamically imported module|Importing a module script failed|Failed to fetch|ChunkLoadError/i.test(error.message);

/** Halaman cadangan yang ramah kalau ada error tak terduga saat render. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Schedulin error:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    // Setelah deploy baru, file chunk lama sudah tidak ada → cukup muat ulang
    const chunk = isChunkError(error);

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-sky-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="max-w-md w-full text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200/60 dark:border-slate-800">
          <div className="text-5xl" aria-hidden="true">
            {chunk ? '🔄' : '🙀'}
          </div>
          <h1 className="text-xl font-extrabold">{chunk ? 'Ada versi baru Schedulin!' : 'Ups, ada yang tidak beres'}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {chunk
              ? 'Muat ulang halaman untuk memakai versi terbaru.'
              : 'Kucing kami tersandung. Data kamu aman — coba muat ulang halaman.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-sky-500 to-amber-400 text-white shadow-md"
          >
            Muat ulang
          </button>
          {!chunk && (
            <details className="text-left text-xs text-slate-400">
              <summary className="cursor-pointer select-none">Detail teknis</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words max-h-40 overflow-auto">{error.message}</pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
