import React from 'react';
import { TrendingUp, PieChart as PieIcon, RefreshCw, BarChart2 } from 'lucide-react';

export const SkeletonAreaChart: React.FC<{ title?: string }> = ({
  title = 'Portfolio Analytics (24h Trend)',
}) => {
  return (
    <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center border-b border-neutral-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-amber-500/50" />
          <div className="h-4 w-44 bg-neutral-800 rounded-md" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-500/40 animate-ping" />
          <div className="h-4 w-24 bg-neutral-800/80 rounded border border-neutral-800" />
        </div>
      </div>

      {/* Main Area Chart Skeleton Stage */}
      <div className="h-64 w-full relative bg-neutral-950/50 rounded-xl p-4 overflow-hidden border border-neutral-800/40 flex flex-col justify-between">
        {/* Mock Y-Axis grid lines */}
        <div className="space-y-6">
          <div className="w-full border-b border-neutral-800/30 flex justify-between items-center">
            <div className="h-2 w-8 bg-neutral-850 rounded" />
          </div>
          <div className="w-full border-b border-neutral-800/30 flex justify-between items-center">
            <div className="h-2 w-8 bg-neutral-850 rounded" />
          </div>
          <div className="w-full border-b border-neutral-800/30 flex justify-between items-center">
            <div className="h-2 w-8 bg-neutral-850 rounded" />
          </div>
          <div className="w-full border-b border-neutral-800/30 flex justify-between items-center">
            <div className="h-2 w-8 bg-neutral-850 rounded" />
          </div>
        </div>

        {/* Animated Wave Silhouette SVG */}
        <div className="absolute inset-x-0 bottom-6 top-10 flex items-end px-4">
          <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
            <defs>
              <linearGradient id="skeletonGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M0,120 Q60,40 120,80 T240,50 T360,90 T500,30 L500,150 L0,150 Z"
              fill="url(#skeletonGrad)"
            />
            <path
              d="M0,120 Q60,40 120,80 T240,50 T360,90 T500,30"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeOpacity="0.4"
              strokeDasharray="6 4"
            />
          </svg>
        </div>

        {/* Mock X-Axis Labels */}
        <div className="flex justify-between items-center pt-2 px-2 z-10">
          <div className="h-2.5 w-8 bg-neutral-800 rounded" />
          <div className="h-2.5 w-8 bg-neutral-800 rounded" />
          <div className="h-2.5 w-8 bg-neutral-800 rounded" />
          <div className="h-2.5 w-8 bg-neutral-800 rounded" />
          <div className="h-2.5 w-8 bg-neutral-800 rounded" />
          <div className="h-2.5 w-8 bg-neutral-800 rounded" />
          <div className="h-2.5 w-8 bg-neutral-800 rounded" />
        </div>

        {/* Loading overlay badge */}
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/40 backdrop-blur-[1px]">
          <div className="px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold flex items-center space-x-2 shadow-xl">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Fetching Live Market Trends...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonDonutChart: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center border-b border-neutral-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <PieIcon className="w-4 h-4 text-amber-500/50" />
          <div className="h-4 w-32 bg-neutral-800 rounded-md" />
        </div>
      </div>

      {/* Donut SVG Ring Skeleton */}
      <div className="h-44 w-full flex items-center justify-center relative">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="#262626"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="#f59e0b"
            strokeWidth="10"
            strokeDasharray="238.7"
            strokeDashoffset="140"
            strokeOpacity="0.4"
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center Loading Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="h-3 w-12 bg-neutral-800 rounded mb-1" />
          <div className="h-2 w-8 bg-neutral-850 rounded" />
        </div>
      </div>

      {/* Legend Rows Skeleton */}
      <div className="space-y-2 pt-2 border-t border-neutral-950">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between items-center text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
              <div className="h-3 w-14 bg-neutral-800 rounded" />
            </div>
            <div className="h-3 w-16 bg-neutral-800/80 rounded font-mono" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonHeroBalance: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400/50 animate-ping" />
            <div className="h-3.5 w-48 bg-neutral-800 rounded" />
          </div>

          <div className="h-9 w-64 bg-neutral-800 rounded-lg" />

          <div className="h-3 w-56 bg-neutral-850 rounded" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-20 bg-neutral-950 rounded-xl border border-neutral-800" />
          ))}
        </div>
      </div>
    </div>
  );
};

export const SkeletonAssetCard: React.FC = () => {
  return (
    <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-lg animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-750" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-20 bg-neutral-800 rounded" />
            <div className="h-2.5 w-12 bg-neutral-850 rounded" />
          </div>
        </div>
        <div className="h-5 w-16 bg-neutral-800 rounded border border-neutral-800" />
      </div>

      <div className="flex justify-between items-end pt-2 border-t border-neutral-950">
        <div className="space-y-1">
          <div className="h-2 w-10 bg-neutral-850 rounded" />
          <div className="h-4 w-24 bg-neutral-800 rounded" />
        </div>
        <div className="space-y-1">
          <div className="h-2 w-12 bg-neutral-850 rounded" />
          <div className="h-4 w-20 bg-neutral-800/90 rounded" />
        </div>
      </div>

      <div className="flex space-x-2 pt-1">
        <div className="flex-1 h-7 bg-neutral-950 rounded-lg border border-neutral-800" />
        <div className="flex-1 h-7 bg-neutral-950 rounded-lg border border-neutral-800" />
      </div>
    </div>
  );
};

export const SkeletonMarketList: React.FC = () => {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-800" />
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-neutral-800 rounded" />
              <div className="h-2 w-10 bg-neutral-850 rounded" />
            </div>
          </div>
          <div className="text-right space-y-1.5">
            <div className="h-3 w-16 bg-neutral-800 rounded ml-auto" />
            <div className="h-2 w-10 bg-neutral-850 rounded ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
};
