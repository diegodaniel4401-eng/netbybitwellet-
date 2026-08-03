import React from 'react';
import { SupportedAsset } from '../types';

interface CryptoIconProps {
  asset: SupportedAsset | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showNetworkBadge?: boolean;
}

export const CryptoIcon: React.FC<CryptoIconProps> = ({
  asset,
  size = 'md',
  className = '',
  showNetworkBadge = false,
}) => {
  // Map size prop to dimension string if string or style object if number
  let dimClass = 'w-8 h-8';
  let badgeSize = 'text-[9px] px-1 py-0.2';

  if (typeof size === 'string') {
    switch (size) {
      case 'xs':
        dimClass = 'w-5 h-5';
        badgeSize = 'text-[7px] px-0.5';
        break;
      case 'sm':
        dimClass = 'w-6 h-6';
        badgeSize = 'text-[8px] px-1';
        break;
      case 'md':
        dimClass = 'w-8 h-8';
        badgeSize = 'text-[9px] px-1';
        break;
      case 'lg':
        dimClass = 'w-10 h-10';
        badgeSize = 'text-[10px] px-1.5 py-0.5';
        break;
      case 'xl':
        dimClass = 'w-12 h-12';
        badgeSize = 'text-[11px] px-1.5 py-0.5';
        break;
    }
  }

  const assetKey = asset.toUpperCase();

  const renderSvgContent = () => {
    switch (assetKey) {
      case 'BTC':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-full shadow-sm">
            <circle cx="16" cy="16" r="16" fill="#F7931A" />
            <path
              d="M22.68 13.06c.32-2.15-1.31-3.3-3.55-4.08l.72-2.9-1.77-.44-.7 2.82c-.47-.12-.95-.23-1.42-.34l.71-2.84-1.77-.44-.72 2.9c-.39-.09-.77-.18-1.14-.27l-2.44-.61-.47 1.89s1.31.3 1.28.32c.72.18.85.65.83 1.03l-.83 3.33c.05.01.11.03.18.06l-.18-.04-1.16 4.66c-.09.22-.31.55-.82.42c.02.03-1.28-.32-1.28-.32l-.88 2.03 2.3.57c.43.11.85.22 1.27.32l-.73 2.94 1.77.44.72-2.89c.48.13.95.25 1.41.36l-.71 2.86 1.77.44.73-2.92c3.02.57 5.29.34 6.25-2.39.77-2.19-.04-3.46-1.62-4.28 1.15-.27 2.02-1.03 2.25-2.61zm-4.03 5.7c-.55 2.2-4.26 1.01-5.46.71l.97-3.91c1.2.3 5.06.9 4.49 3.2zm.55-5.74c-.5 2.01-3.59.99-4.59.74l.88-3.54c1 .25 4.22.72 3.71 2.8z"
              fill="#FFFFFF"
            />
          </svg>
        );

      case 'ETH':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-full shadow-sm">
            <circle cx="16" cy="16" r="16" fill="#627EEA" />
            <g fill="#FFFFFF">
              <path d="M16 4L9.5 15.5L16 19.5L22.5 15.5L16 4Z" fillOpacity="0.8" />
              <path d="M16 4L16 19.5L22.5 15.5L16 4Z" fillOpacity="1" />
              <path d="M16 21L9.5 17L16 28L22.5 17L16 21Z" fillOpacity="0.8" />
              <path d="M16 21L16 28L22.5 17L16 21Z" fillOpacity="1" />
              <path d="M16 19.5L9.5 15.5L16 12.5L22.5 15.5L16 19.5Z" fillOpacity="0.45" />
              <path d="M9.5 15.5L16 4L16 12.5L9.5 15.5Z" fillOpacity="0.65" />
            </g>
          </svg>
        );

      case 'BNB':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-full shadow-sm">
            <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
            <g fill="#FFFFFF">
              <path d="M16 7L12.8 10.2L16 13.4L19.2 10.2L16 7Z" />
              <path d="M7 16L10.2 12.8L13.4 16L10.2 19.2L7 16Z" />
              <path d="M16 25L12.8 21.8L16 18.6L19.2 21.8L16 25Z" />
              <path d="M25 16L21.8 12.8L18.6 16L21.8 19.2L25 16Z" />
              <path d="M16 12.2L19.8 16L16 19.8L12.2 16L16 12.2Z" />
              <path d="M10.2 8.6L6 12.8L7.4 14.2L10.2 11.4L13 14.2L14.4 12.8L10.2 8.6Z" />
              <path d="M21.8 8.6L17.6 12.8L19 14.2L21.8 11.4L24.6 14.2L26 12.8L21.8 8.6Z" />
              <path d="M10.2 23.4L6 19.2L7.4 17.8L10.2 20.6L13 17.8L14.4 19.2L10.2 23.4Z" />
              <path d="M21.8 23.4L17.6 19.2L19 17.8L21.8 20.6L24.6 17.8L26 19.2L21.8 23.4Z" />
            </g>
          </svg>
        );

      case 'TRX':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-full shadow-sm">
            <circle cx="16" cy="16" r="16" fill="#EB0029" />
            <g fill="#FFFFFF">
              <path d="M24.5 8.5L6.5 7L18.5 26.5L24.5 8.5Z" fillOpacity="0.95" />
              <path d="M6.5 7L14.8 15.5L18.5 26.5L6.5 7Z" fillOpacity="0.75" />
              <path d="M6.5 7L14.8 15.5L24.5 8.5L6.5 7Z" fillOpacity="1" />
            </g>
          </svg>
        );

      case 'USDT_ERC20':
      case 'USDT-ERC20':
      case 'USDT (ERC-20)':
        return (
          <div className="relative w-full h-full">
            <svg viewBox="0 0 32 32" className="w-full h-full rounded-full shadow-sm">
              <circle cx="16" cy="16" r="16" fill="#26A17B" />
              <g fill="#FFFFFF">
                <path d="M17.9 14.2V12h5.8V8H8.3v4h5.8v2.2C9.5 14.5 6 15.4 6 16.5s3.5 2 8.1 2.3v5.2h3.8v-5.2c4.6-.3 8.1-1.2 8.1-2.3s-3.5-2-8.1-2.3zm0 3.3c-3.4.2-6.1-.4-6.1-1 0-.6 2.7-1.2 6.1-1s6.1.4 6.1 1c0 .6-2.7 1.2-6.1 1z" />
              </g>
            </svg>
            {showNetworkBadge && (
              <span className={`absolute -bottom-1 -right-1 bg-indigo-600 text-white font-mono font-bold rounded-md border border-indigo-400/40 shadow-sm ${badgeSize}`}>
                ERC20
              </span>
            )}
          </div>
        );

      case 'USDT_TRC20':
      case 'USDT-TRC20':
      case 'USDT (TRC-20)':
        return (
          <div className="relative w-full h-full">
            <svg viewBox="0 0 32 32" className="w-full h-full rounded-full shadow-sm">
              <circle cx="16" cy="16" r="16" fill="#009375" />
              <g fill="#FFFFFF">
                <path d="M17.9 14.2V12h5.8V8H8.3v4h5.8v2.2C9.5 14.5 6 15.4 6 16.5s3.5 2 8.1 2.3v5.2h3.8v-5.2c4.6-.3 8.1-1.2 8.1-2.3s-3.5-2-8.1-2.3zm0 3.3c-3.4.2-6.1-.4-6.1-1 0-.6 2.7-1.2 6.1-1s6.1.4 6.1 1c0 .6-2.7 1.2-6.1 1z" />
              </g>
            </svg>
            {showNetworkBadge && (
              <span className={`absolute -bottom-1 -right-1 bg-red-600 text-white font-mono font-bold rounded-md border border-red-400/40 shadow-sm ${badgeSize}`}>
                TRC20
              </span>
            )}
          </div>
        );

      case 'USDT':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-full shadow-sm">
            <circle cx="16" cy="16" r="16" fill="#26A17B" />
            <g fill="#FFFFFF">
              <path d="M17.9 14.2V12h5.8V8H8.3v4h5.8v2.2C9.5 14.5 6 15.4 6 16.5s3.5 2 8.1 2.3v5.2h3.8v-5.2c4.6-.3 8.1-1.2 8.1-2.3s-3.5-2-8.1-2.3zm0 3.3c-3.4.2-6.1-.4-6.1-1 0-.6 2.7-1.2 6.1-1s6.1.4 6.1 1c0 .6-2.7 1.2-6.1 1z" />
            </g>
          </svg>
        );

      default:
        return (
          <div className="w-full h-full rounded-full bg-neutral-800 border border-neutral-700 text-amber-400 flex items-center justify-center font-bold text-xs">
            {assetKey.substring(0, 3)}
          </div>
        );
    }
  };

  const styleObj = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${dimClass} ${className}`}
      style={styleObj}
    >
      {renderSvgContent()}
    </div>
  );
};
