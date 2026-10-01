export default function PageLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400 ${
        fullScreen ? 'min-h-screen' : 'py-20'
      }`}
    >
      <span className="text-3xl animate-bounce" aria-hidden="true">
        🐾
      </span>
      <span className="text-sm font-semibold">Memuat...</span>
    </div>
  );
}
