import { useThemeStore } from '../store/themeStore';
import { motion } from 'framer-motion';

export default function SkyBackground() {
  const { isDarkMode } = useThemeStore();

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 transition-colors duration-700">
      {/* Dynamic Base Gradient */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          isDarkMode
            ? 'opacity-100 bg-gradient-to-b from-[#090D1A] via-[#0E1528] to-[#141C33]'
            : 'opacity-100 bg-gradient-to-b from-[#E0F2FE] via-[#F0F9FF] to-[#FEF3C7]/40'
        }`}
      />

      {/* Ambient Lighting Orbs */}
      <div className="absolute inset-0">
        {/* Sun / Moon Primary Glow */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            x: isDarkMode ? [0, 10, 0] : [0, -10, 0],
            y: [0, 8, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute -top-24 -right-16 w-96 h-96 rounded-full blur-3xl opacity-50 transition-colors duration-700 ${
            isDarkMode ? 'bg-indigo-600/30' : 'bg-amber-300/50'
          }`}
        />

        {/* Secondary Ambient Glow */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            x: [0, 15, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className={`absolute top-1/3 -left-20 w-80 h-80 rounded-full blur-3xl opacity-40 transition-colors duration-700 ${
            isDarkMode ? 'bg-purple-700/25' : 'bg-sky-300/50'
          }`}
        />

        {/* Subtle Bottom Accent Glow */}
        <div
          className={`absolute -bottom-20 right-1/4 w-96 h-72 rounded-full blur-3xl opacity-30 transition-colors duration-700 ${
            isDarkMode ? 'bg-blue-900/30' : 'bg-orange-200/40'
          }`}
        />
      </div>

      {/* Decorative Sky Objects */}
      {!isDarkMode ? (
        // Day mode: Subtle floating fluffy clouds
        <div className="absolute inset-0 opacity-40">
          {/* Cloud 1 */}
          <motion.div
            animate={{ x: [-20, 30, -20] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-16 left-12"
          >
            <svg width="120" height="45" viewBox="0 0 120 45" fill="none" className="text-white drop-shadow-sm">
              <path
                d="M20 35H100C108 35 115 28 115 20C115 12 108 5 100 5C98 5 96 5.5 94 6.5C90 1.5 83 0 76 0C68 0 61 4 58 10C55 8 51 7 47 7C38 7 30 14 30 23C27 23 20 25 20 35Z"
                fill="currentColor"
                fillOpacity="0.8"
              />
            </svg>
          </motion.div>

          {/* Cloud 2 */}
          <motion.div
            animate={{ x: [30, -25, 30] }}
            transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-36 right-20"
          >
            <svg width="150" height="55" viewBox="0 0 150 55" fill="none" className="text-white drop-shadow-sm">
              <path
                d="M25 45H125C135 45 145 37 145 26C145 16 136 8 126 8C123 8 121 9 118 10C113 3 104 0 95 0C85 0 76 5 72 13C68 10 63 9 58 9C47 9 38 18 38 29C34 29 25 32 25 45Z"
                fill="currentColor"
                fillOpacity="0.75"
              />
            </svg>
          </motion.div>
        </div>
      ) : (
        // Night mode: Sparkling stars
        <div className="absolute inset-0">
          {[
            { top: '12%', left: '15%', size: 3, delay: 0 },
            { top: '22%', left: '45%', size: 2, delay: 1.2 },
            { top: '18%', left: '78%', size: 4, delay: 0.5 },
            { top: '35%', left: '85%', size: 2.5, delay: 2 },
            { top: '55%', left: '10%', size: 3.5, delay: 1.7 },
            { top: '70%', left: '60%', size: 2, delay: 0.8 },
            { top: '80%', left: '25%', size: 3, delay: 2.4 },
            { top: '40%', left: '30%', size: 2.5, delay: 1.5 },
          ].map((star, idx) => (
            <motion.div
              key={idx}
              style={{ top: star.top, left: star.left, width: star.size, height: star.size }}
              animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 3.5, repeat: Infinity, delay: star.delay, ease: 'easeInOut' }}
              className="absolute bg-amber-200 rounded-full shadow-[0_0_8px_#fde68a]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
