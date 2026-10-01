import { memo } from 'react';
import { useThemeStore } from '../store/themeStore';

const STARS = [
  { top: '12%', left: '15%', size: 3, delay: 0 },
  { top: '22%', left: '45%', size: 2, delay: 1.2 },
  { top: '18%', left: '78%', size: 4, delay: 0.5 },
  { top: '35%', left: '85%', size: 2.5, delay: 2 },
  { top: '55%', left: '10%', size: 3.5, delay: 1.7 },
  { top: '70%', left: '60%', size: 2, delay: 0.8 },
  { top: '80%', left: '25%', size: 3, delay: 2.4 },
  { top: '40%', left: '30%', size: 2.5, delay: 1.5 },
];

/**
 * Latar langit. Orb cahaya sengaja dibuat statis: elemen blur besar yang terus
 * dianimasikan memaksa GPU menggambar ulang blur setiap frame (boros baterai di HP).
 */
function SkyBackground() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
      {/* Gradien dasar */}
      <div
        className={`absolute inset-0 ${
          isDarkMode
            ? 'bg-gradient-to-b from-[#090D1A] via-[#0E1528] to-[#141C33]'
            : 'bg-gradient-to-b from-[#E0F2FE] via-[#F0F9FF] to-[#FEF3C7]/40'
        }`}
      />

      {/* Orb cahaya ambient (statis) */}
      <div
        className={`absolute -top-24 -right-16 w-96 h-96 rounded-full blur-3xl opacity-50 ${
          isDarkMode ? 'bg-indigo-600/30' : 'bg-amber-300/50'
        }`}
      />
      <div
        className={`absolute top-1/3 -left-20 w-80 h-80 rounded-full blur-3xl opacity-40 ${
          isDarkMode ? 'bg-purple-700/25' : 'bg-sky-300/50'
        }`}
      />
      <div
        className={`absolute -bottom-20 right-1/4 w-96 h-72 rounded-full blur-3xl opacity-30 ${
          isDarkMode ? 'bg-blue-900/30' : 'bg-orange-200/40'
        }`}
      />

      {!isDarkMode ? (
        // Siang: awan bergerak pelan (hanya transform → murah)
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-16 left-12 anim-drift">
            <svg width="120" height="45" viewBox="0 0 120 45" fill="none" className="text-white">
              <path
                d="M20 35H100C108 35 115 28 115 20C115 12 108 5 100 5C98 5 96 5.5 94 6.5C90 1.5 83 0 76 0C68 0 61 4 58 10C55 8 51 7 47 7C38 7 30 14 30 23C27 23 20 25 20 35Z"
                fill="currentColor"
                fillOpacity="0.8"
              />
            </svg>
          </div>
          <div className="absolute top-36 right-20 anim-drift" style={{ animationDuration: '32s', animationDirection: 'reverse' }}>
            <svg width="150" height="55" viewBox="0 0 150 55" fill="none" className="text-white">
              <path
                d="M25 45H125C135 45 145 37 145 26C145 16 136 8 126 8C123 8 121 9 118 10C113 3 104 0 95 0C85 0 76 5 72 13C68 10 63 9 58 9C47 9 38 18 38 29C34 29 25 32 25 45Z"
                fill="currentColor"
                fillOpacity="0.75"
              />
            </svg>
          </div>
        </div>
      ) : (
        // Malam: bintang berkelip
        <div className="absolute inset-0">
          {STARS.map((star, idx) => (
            <div
              key={idx}
              style={{
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                animationDelay: `${star.delay}s`,
              }}
              className="absolute bg-amber-200 rounded-full shadow-[0_0_8px_#fde68a] anim-twinkle"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(SkyBackground);
