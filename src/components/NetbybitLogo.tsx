import React from 'react';

interface NetbybitLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export const NetbybitLogo: React.FC<NetbybitLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
}) => {
  let iconDimensions = 'w-9 h-9';
  let titleSize = 'text-xl';
  let subtitleSize = 'text-[9px]';

  switch (size) {
    case 'sm':
      iconDimensions = 'w-7 h-7';
      titleSize = 'text-base';
      subtitleSize = 'text-[8px]';
      break;
    case 'md':
      iconDimensions = 'w-9 h-9';
      titleSize = 'text-xl';
      subtitleSize = 'text-[9px]';
      break;
    case 'lg':
      iconDimensions = 'w-11 h-11';
      titleSize = 'text-2xl';
      subtitleSize = 'text-[10px]';
      break;
    case 'xl':
      iconDimensions = 'w-14 h-14';
      titleSize = 'text-3xl';
      subtitleSize = 'text-[11px]';
      break;
  }

  return (
    <div className={`inline-flex items-center space-x-3 select-none ${className}`}>
      {/* 3D Geometric Hexagon Gold Vault Logo Icon */}
      <div className={`relative ${iconDimensions} shrink-0`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300 rounded-xl blur-sm opacity-60 animate-pulse" />
        <div className="relative w-full h-full rounded-xl bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-950 p-[1.5px] border border-amber-500/40 shadow-xl">
          <div className="w-full h-full rounded-[10.5px] bg-neutral-950 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-4/5 h-4/5">
              <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="50%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <linearGradient id="darkGoldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#78350F" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>

              {/* Hexagonal Outer Frame */}
              <polygon
                points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
                fill="none"
                stroke="url(#goldGrad)"
                strokeWidth="7"
                strokeLinejoin="round"
              />

              {/* Styled N & Vault Geometric Struts */}
              <path
                d="M 30 70 L 30 30 L 70 70 L 70 30"
                fill="none"
                stroke="url(#goldGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="50" cy="50" r="6" fill="#FEF3C7" />
            </svg>
          </div>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-black tracking-wider uppercase bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-500 bg-clip-text text-transparent ${titleSize} ${textClassName}`}
          >
            NETBYBIT
          </span>
          <span className={`tracking-widest text-amber-500/80 font-mono font-semibold uppercase ${subtitleSize}`}>
            INSTITUTIONAL CRYPTO CUSTODY
          </span>
        </div>
      )}
    </div>
  );
};
