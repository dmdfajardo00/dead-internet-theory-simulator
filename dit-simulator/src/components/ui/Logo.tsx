'use client';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 64, className = "" }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Robot head base */}
      <rect 
        x="16" 
        y="16" 
        width="32" 
        height="28" 
        rx="4" 
        fill="#0095f6" 
        stroke="#000000" 
        strokeWidth="2"
      />
      
      {/* Eyes */}
      <circle cx="24" cy="26" r="3" fill="#ffffff" />
      <circle cx="40" cy="26" r="3" fill="#ffffff" />
      <circle cx="24" cy="26" r="1.5" fill="#000000" />
      <circle cx="40" cy="26" r="1.5" fill="#000000" />
      
      {/* Mouth/speaker grille */}
      <rect x="26" y="34" width="12" height="2" rx="1" fill="#ffffff" />
      <rect x="28" y="38" width="8" height="2" rx="1" fill="#ffffff" />
      
      {/* Speech bubble */}
      <path 
        d="M8 8 L28 8 Q32 8 32 12 L32 20 Q32 24 28 24 L16 24 L8 32 L8 12 Q8 8 12 8 Z" 
        fill="#ffffff" 
        stroke="#000000" 
        strokeWidth="2"
      />
      
      {/* Glitch effect lines */}
      <rect x="18" y="20" width="2" height="1" fill="#ed4956" opacity="0.8" />
      <rect x="42" y="30" width="2" height="1" fill="#ed4956" opacity="0.8" />
      <rect x="10" y="14" width="3" height="1" fill="#ed4956" opacity="0.6" />
      
      {/* Antenna/signal indicators */}
      <circle cx="20" cy="12" r="1" fill="#0095f6" />
      <circle cx="44" cy="12" r="1" fill="#0095f6" />
      <line x1="20" y1="13" x2="20" y2="16" stroke="#0095f6" strokeWidth="1" />
      <line x1="44" y1="13" x2="44" y2="16" stroke="#0095f6" strokeWidth="1" />
    </svg>
  );
}