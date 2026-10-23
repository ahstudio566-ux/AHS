import React from 'react';

const HeroBanner: React.FC = () => {
  return (
    <svg
      viewBox="0 0 800 300"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      aria-labelledby="hero-title hero-desc"
      role="img"
      preserveAspectRatio="xMidYMid slice"
    >
      <title id="hero-title">DA NANG GREEN</title>
      <desc id="hero-desc">Banner của DA NANG GREEN với hình minh họa cây cối và thành phố xanh, cùng đường cong lượn sóng ở phía dưới.</desc>
      
      {/* Bầu trời */}
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ccfbf1', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#99f6e4', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Hình nền gợn sóng */}
      <path d="M 0 0 L 800 0 L 800 270 Q 400 310 0 270 Z" fill="url(#skyGradient)" />

      {/* Đồi xa */}
      <path d="M -10 270 C 150 200, 250 220, 400 250 L 400 270 Q 200 300 -10 270 Z" fill="#2dd4bf" opacity="0.2" />
      <path d="M 350 270 C 500 210, 650 220, 810 190 L 810 270 Q 600 300 350 270 Z" fill="#2dd4bf" opacity="0.3" />

      {/* Cảnh quan thành phố cách điệu */}
      <g fill="#ffffff" opacity="0.9">
          <rect x="250" y="150" width="20" height="120" rx="2"/>
          <rect x="280" y="120" width="30" height="150" rx="2"/>
          <rect x="320" y="160" width="25" height="110" rx="2"/>
          <rect x="355" y="130" width="20" height="140" rx="2"/>
          <rect x="450" y="140" width="30" height="130" rx="2"/>
          <rect x="490" y="110" width="25" height="160" rx="2"/>
          <rect x="525" y="165" width="20" height="105" rx="2"/>
      </g>
      
      {/* Đồi gần / Mặt đất */}
      <path d="M -10 280 C 200 240, 600 240, 810 270 L 810 280 Q 400 320 -10 280 Z" fill="#14b8a6" opacity="0.3" />
      <path d="M -10 300 C 150 260, 650 260, 810 280 L 810 300 L -10 300 Z" fill="#0d9488" opacity="0.2" />

      {/* Cây cối */}
      <g>
        {/* Cây 1 */}
        <rect x="80" y="210" width="10" height="40" fill="#a1887f" rx="3" />
        <circle cx="85" cy="195" r="25" fill="#34d399" />
        <circle cx="70" cy="205" r="20" fill="#6ee7b7" />
        <circle cx="100" cy="205" r="20" fill="#6ee7b7" />

        {/* Cây 2 */}
        <rect x="180" y="200" width="12" height="50" fill="#a1887f" rx="3"/>
        <circle cx="186" cy="180" r="30" fill="#34d399" />
        <circle cx="170" cy="195" r="22" fill="#6ee7b7" />
        <circle cx="202" cy="195" r="22" fill="#6ee7b7" />

        {/* Cây 3 */}
        <rect x="650" y="215" width="10" height="35" fill="#a1887f" rx="3"/>
        <circle cx="655" cy="200" r="25" fill="#34d399" />
        <circle cx="640" cy="210" r="20" fill="#6ee7b7" />
        <circle cx="670" cy="210" r="20" fill="#6ee7b7" />
          
         {/* Cây 4 */}
        <rect x="720" y="205" width="12" height="45" fill="#a1887f" rx="3"/>
        <circle cx="726" cy="185" r="30" fill="#34d399" />
        <circle cx="710" cy="200" r="22" fill="#6ee7b7" />
        <circle cx="742" cy="200" r="22" fill="#6ee7b7" />
      </g>

      {/* Văn bản */}
      <text
        x="400"
        y="100"
        fontFamily="'Be Vietnam Pro', sans-serif"
        fontSize="60"
        fontWeight="bold"
        fill="#0f766e"
        textAnchor="middle"
        style={{textShadow: "1px 1px 3px rgba(255,255,255,0.3)"}}
      >
        DA NANG GREEN
      </text>
      <text
        x="400"
        y="140"
        fontFamily="'Be Vietnam Pro', sans-serif"
        fontSize="22"
        fontWeight="500"
        fill="#115e59"
        textAnchor="middle"
        style={{textShadow: "1px 1px 2px rgba(255,255,255,0.2)"}}
      >
        VÌ MỘT TƯƠNG LAI BỀN VỮNG
      </text>
    </svg>
  );
};

export default HeroBanner;