import { motion } from 'framer-motion';

interface MascotProps {
  isNight?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function MascotCat({ isNight = false, className = '', size = 'md' }: MascotProps) {
  const dimension = size === 'sm' ? 80 : size === 'lg' ? 160 : 120;

  if (isNight) {
    // Night Mode: Sleepy cat curled on a crescent moon with nightcap
    return (
      <div
        role="img"
        aria-label="Maskot kucing tidur di atas bulan"
        className={`relative inline-flex items-center justify-center select-none ${className}`}
      >
        <motion.svg
          width={dimension}
          height={dimension}
          viewBox="0 0 160 160"
          fill="none"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="drop-shadow-lg"
        >
          {/* Glowing Crescent Moon */}
          <path
            d="M95 20C65 20 40 45 40 75C40 105 65 130 95 130C105 130 114 127 122 122C100 120 82 102 82 78C82 54 100 36 122 34C114 25 105 20 95 20Z"
            fill="url(#moonGrad)"
          />

          {/* Sleeping Cat Body Curled */}
          <motion.ellipse
            cx="80"
            cy="105"
            rx="34"
            ry="24"
            fill="#FB923C"
            animate={{ scaleY: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Cat Belly highlight */}
          <ellipse cx="78" cy="108" rx="20" ry="14" fill="#FED7AA" />

          {/* Cat Head */}
          <circle cx="56" cy="92" r="18" fill="#FB923C" />
          {/* Cat Ears */}
          <polygon points="43,84 48,70 56,80" fill="#FB923C" />
          <polygon points="46,82 49,74 54,80" fill="#FDA4AF" />
          <polygon points="56,79 66,71 68,84" fill="#FB923C" />
          <polygon points="59,79 64,74 66,83" fill="#FDA4AF" />

          {/* Sleeping Eyes (curved lines) */}
          <path d="M47 92C49 95 53 95 55 92" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
          <path d="M59 92C61 95 65 95 67 92" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
          {/* Nose & Mouth */}
          <circle cx="57" cy="96" r="1.5" fill="#BE185D" />
          <path d="M55 98C56 99 58 99 59 98" stroke="#7C2D12" strokeWidth="1.5" strokeLinecap="round" />

          {/* Blush */}
          <circle cx="45" cy="96" r="3.5" fill="#FDA4AF" fillOpacity="0.7" />
          <circle cx="68" cy="96" r="3.5" fill="#FDA4AF" fillOpacity="0.7" />

          {/* Nightcap / Sleeping Hat */}
          <path d="M48 78 Q55 60 78 68 Q68 76 60 82 Z" fill="#818CF8" />
          <circle cx="80" cy="69" r="4" fill="#FDE047" />

          {/* Tail Wrapped Around */}
          <path
            d="M110 110 C120 100 115 85 106 82"
            stroke="#EA580C"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Floating Zzz */}
          <motion.text
            x="40"
            y="65"
            fill="#C7D2FE"
            fontSize="14"
            fontWeight="bold"
            aria-hidden="true"
            animate={{ opacity: [0, 1, 0], y: [65, 52, 45], x: [40, 36, 32] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut' }}
          >
            z
          </motion.text>
          <motion.text
            x="28"
            y="50"
            fill="#C7D2FE"
            fontSize="18"
            fontWeight="bold"
            aria-hidden="true"
            animate={{ opacity: [0, 1, 0], y: [50, 35, 25], x: [28, 22, 16] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: 0.9, ease: 'easeOut' }}
          >
            Z
          </motion.text>

          <defs>
            <linearGradient id="moonGrad" x1="40" y1="20" x2="120" y2="130" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE68A" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </motion.svg>
      </div>
    );
  }

  // Day Mode: Cheerful Orange Cat with glowing friendly Sun
  return (
    <div
      role="img"
      aria-label="Maskot kucing ceria bersama matahari"
      className={`relative inline-flex items-center justify-center select-none ${className}`}
    >
      <motion.svg
        width={dimension}
        height={dimension}
        viewBox="0 0 160 160"
        fill="none"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="drop-shadow-lg"
      >
        {/* Smiling Sun in Background */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '115px', originY: '45px' }}
        >
          <circle cx="115" cy="45" r="22" fill="#FBBF24" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 115 + Math.cos(rad) * 26;
            const y1 = 45 + Math.sin(rad) * 26;
            const x2 = 115 + Math.cos(rad) * 31;
            const y2 = 45 + Math.sin(rad) * 31;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#F59E0B"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            );
          })}
        </motion.g>

        {/* Sun cute smile */}
        <circle cx="109" cy="42" r="2" fill="#78350F" />
        <circle cx="121" cy="42" r="2" fill="#78350F" />
        <path d="M112 47 C115 50 118 50 120 47" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />

        {/* Happy Cat Body */}
        <ellipse cx="75" cy="115" rx="30" ry="26" fill="#FB923C" />
        <ellipse cx="75" cy="118" rx="18" ry="17" fill="#FED7AA" />

        {/* Cat Head */}
        <circle cx="75" cy="80" r="22" fill="#FB923C" />

        {/* Cat Ears */}
        <polygon points="56,70 60,50 72,64" fill="#FB923C" />
        <polygon points="60,68 63,56 70,64" fill="#FDA4AF" />
        <polygon points="94,70 90,50 78,64" fill="#FB923C" />
        <polygon points="90,68 87,56 80,64" fill="#FDA4AF" />

        {/* Cat Paws Resting */}
        <ellipse cx="62" cy="128" rx="8" ry="5" fill="#FED7AA" />
        <ellipse cx="88" cy="128" rx="8" ry="5" fill="#FED7AA" />

        {/* Happy Curved Eyes */}
        <path d="M64 78 C67 74 71 74 74 78" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M78 78 C81 74 85 74 88 78" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round" />

        {/* Nose & Smile */}
        <polygon points="73,83 77,83 75,85" fill="#BE185D" />
        <path d="M71 87 C73 89 75 88 75 85 C75 88 77 89 79 87" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />

        {/* Rosy Cheeks */}
        <circle cx="62" cy="84" r="4" fill="#FB7185" fillOpacity="0.6" />
        <circle cx="88" cy="84" r="4" fill="#FB7185" fillOpacity="0.6" />

        {/* Whiskers */}
        <line x1="50" y1="82" x2="60" y2="83" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="51" y1="86" x2="60" y2="85" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="100" y1="82" x2="90" y2="83" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="99" y1="86" x2="90" y2="85" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" />

        {/* Tail Wagging */}
        <motion.path
          d="M102 120 C118 115 125 98 120 85"
          stroke="#EA580C"
          strokeWidth="7"
          strokeLinecap="round"
          animate={{ rotate: [-5, 6, -5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '102px', originY: '120px' }}
        />
      </motion.svg>
    </div>
  );
}
