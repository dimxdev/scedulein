export type MascotMood = 'happy' | 'proud' | 'sad';

interface MascotProps {
  isNight?: boolean;
  className?: string;
  /** Kelas ukuran Tailwind, boleh responsif (mis. "w-20 h-20 sm:w-40 sm:h-40"). */
  sizeClass?: string;
  /** Ekspresi kucing mengikuti progress hari ini. */
  mood?: MascotMood;
  /** Mahkota untuk streak panjang. */
  crown?: boolean;
}

const DAY_LABELS: Record<MascotMood, string> = {
  happy: 'Maskot kucing ceria bersama matahari',
  proud: 'Maskot kucing melompat gembira karena semua jadwal selesai',
  sad: 'Maskot kucing sedih karena ada jadwal yang terlewat',
};

function Crown({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="0,14 0,3 6,8 12,0 18,8 24,3 24,14" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="1.8" fill="#F43F5E" />
    </g>
  );
}

export default function MascotCat({
  isNight = false,
  className = '',
  sizeClass = 'w-[120px] h-[120px]',
  mood = 'happy',
  crown = false,
}: MascotProps) {

  if (isNight) {
    // Night Mode: Sleepy cat curled on a crescent moon with nightcap
    return (
      <div
        role="img"
        aria-label="Maskot kucing tidur di atas bulan"
        className={`relative inline-flex items-center justify-center select-none ${className}`}
      >
        <svg viewBox="0 0 160 160" fill="none" className={`anim-bob drop-shadow-lg ${sizeClass}`}>
          {/* Glowing Crescent Moon */}
          <path
            d="M95 20C65 20 40 45 40 75C40 105 65 130 95 130C105 130 114 127 122 122C100 120 82 102 82 78C82 54 100 36 122 34C114 25 105 20 95 20Z"
            fill="url(#moonGrad)"
          />

          {/* Sleeping Cat Body Curled */}
          <ellipse className="anim-breathe" cx="80" cy="105" rx="34" ry="24" fill="#FB923C" />
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

          {crown && <Crown x={64} y={50} />}

          {/* Tail Wrapped Around */}
          <path
            d="M110 110 C120 100 115 85 106 82"
            stroke="#EA580C"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Floating Zzz */}
          <text className="anim-zzz" x="40" y="65" fill="#C7D2FE" fontSize="14" fontWeight="bold" aria-hidden="true">
            z
          </text>
          <text
            className="anim-zzz"
            style={{ animationDelay: '0.9s' }}
            x="28"
            y="50"
            fill="#C7D2FE"
            fontSize="18"
            fontWeight="bold"
            aria-hidden="true"
          >
            Z
          </text>

          <defs>
            <linearGradient id="moonGrad" x1="40" y1="20" x2="120" y2="130" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE68A" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // Day Mode: Cheerful Orange Cat with glowing friendly Sun
  return (
    <div
      role="img"
      aria-label={DAY_LABELS[mood]}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
    >
      <svg viewBox="0 0 160 160" fill="none" className={`${mood === 'proud' ? 'anim-hop' : 'anim-bob'} drop-shadow-lg ${sizeClass}`}>
        {/* Smiling Sun in Background */}
        <g className="anim-spin-slow">
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
        </g>

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
        {mood === 'sad' ? (
          <>
            {/* Alis cemas + mata bulat + air mata */}
            <path d="M62 73 L71 70" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
            <path d="M90 73 L81 70" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
            <circle cx="68" cy="78" r="2.6" fill="#7C2D12" />
            <circle cx="84" cy="78" r="2.6" fill="#7C2D12" />
            <ellipse cx="65" cy="85" rx="1.8" ry="2.8" fill="#7DD3FC" />
          </>
        ) : (
          <>
            <path d="M64 78 C67 74 71 74 74 78" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M78 78 C81 74 85 74 88 78" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}

        {/* Nose & Smile */}
        <polygon points="73,83 77,83 75,85" fill="#BE185D" />
        {mood === 'sad' ? (
          <path d="M71 90 C73 87 77 87 79 90" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
        ) : mood === 'proud' ? (
          <path d="M70 87 C72 92 78 92 80 87 Z" fill="#7C2D12" stroke="#7C2D12" strokeWidth="1.5" strokeLinejoin="round" />
        ) : (
          <path d="M71 87 C73 89 75 88 75 85 C75 88 77 89 79 87" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* Rosy Cheeks */}
        <circle cx="62" cy="84" r="4" fill="#FB7185" fillOpacity="0.6" />
        <circle cx="88" cy="84" r="4" fill="#FB7185" fillOpacity="0.6" />

        {/* Whiskers */}
        <line x1="50" y1="82" x2="60" y2="83" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="51" y1="86" x2="60" y2="85" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="100" y1="82" x2="90" y2="83" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="99" y1="86" x2="90" y2="85" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" />

        {crown && <Crown x={63} y={44} />}

        {mood === 'proud' && (
          <g fill="#FBBF24" aria-hidden="true">
            <path className="anim-twinkle" d="M36 56 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" />
            <path className="anim-twinkle" style={{ animationDelay: '1.1s' }} d="M124 92 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 z" />
            <path className="anim-twinkle" style={{ animationDelay: '0.5s' }} d="M44 108 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 z" />
          </g>
        )}

        {/* Tail Wagging */}
        <path className="anim-sway" d="M102 120 C118 115 125 98 120 85" stroke="#EA580C" strokeWidth="7" strokeLinecap="round" />
      </svg>
    </div>
  );
}
