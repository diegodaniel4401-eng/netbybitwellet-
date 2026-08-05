import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ASSET_METADATA } from '../types';
import { CryptoIcon } from '../components/CryptoIcon';
import { SkeletonMarketList } from '../components/SkeletonLoaders';
import { NetbybitLogo } from '../components/NetbybitLogo';
import {
  Shield,
  ArrowRight,
  Globe,
  CheckCircle2,
  BarChart3,
  LifeBuoy,
  Lock,
  Zap,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, prices, pricesLoading, setActivePage } = useAuth();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 px-4 sm:px-6 lg:px-8 rounded-3xl border border-amber-500/20 bg-gradient-to-b from-neutral-900/90 via-neutral-950 to-neutral-950/90 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/30 rounded-full px-4 py-1.5 text-xs text-amber-300 font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Official Multi-Asset Custodial Wallet Vault</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-neutral-100 tracking-tight leading-tight">
              Institutional Asset Custody & Wallet Power with{' '}
              <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                NETBYBIT
              </span>
            </h1>

            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-2xl">
              Next-generation multi-network digital wallet designed for institutional asset holders, high-frequency traders, and everyday crypto investors. Securely deposit, withdraw, swap, and monitor your crypto portfolio with real-time settlement.
            </p>

            {/* Primary Navigation Launchers */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {user ? (
                <button
                  onClick={() => setActivePage('dashboard')}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-black text-sm shadow-xl shadow-amber-500/25 hover:from-amber-400 hover:to-yellow-300 transition-all transform hover:-translate-y-0.5 flex items-center space-x-2.5"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setActivePage('register')}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-black text-sm shadow-xl shadow-amber-500/25 hover:from-amber-400 hover:to-yellow-300 transition-all transform hover:-translate-y-0.5 flex items-center space-x-2.5"
                  >
                    <span>Create Wallet Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActivePage('login')}
                    className="px-6 py-3.5 rounded-2xl bg-neutral-900/90 border border-amber-500/30 text-amber-300 hover:bg-neutral-800 font-bold text-sm transition-all flex items-center space-x-2"
                  >
                    <span>Sign In</span>
                  </button>
                </>
              )}
            </div>

            {/* Platform Badges */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-neutral-800/80 text-xs text-neutral-300">
              <div className="flex items-center space-x-2 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Gas Fee Internal Swaps</span>
              </div>
              <div className="flex items-center space-x-2 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dynamic Deposit Routing</span>
              </div>
              <div className="flex items-center space-x-2 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>24/7 Custodial Support Desk</span>
              </div>
            </div>
          </div>

          {/* Hero Live Widget / Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-neutral-900/80 border border-amber-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div className="flex items-center space-x-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                    Live Crypto Market Prices
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Live Feed
                </span>
              </div>

              {pricesLoading || prices.length === 0 ? (
                <SkeletonMarketList />
              ) : (
                <div className="space-y-3">
                  {prices.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between hover:border-amber-500/40 transition-all shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <CryptoIcon asset={p.id} size="md" showNetworkBadge />
                        <div>
                          <p className="text-xs font-bold text-neutral-100">{p.name}</p>
                          <p className="text-[10px] text-neutral-400 font-mono">{p.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold font-mono text-neutral-100">${p.price.toLocaleString()}</p>
                        <span
                          className={`text-[10px] font-bold ${
                            p.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {p.change24h >= 0 ? '+' : ''}
                          {p.change24h}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 text-center border-t border-neutral-800">
                <button
                  onClick={() => setActivePage('dashboard')}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center space-x-1.5 transition-colors"
                >
                  <span>Open Full Wallet Portfolio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-xs font-extrabold text-amber-400 uppercase tracking-widest">Platform Security & Infrastructure</h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-neutral-100">
            Engineered for High Reliability & Cold Storage Safety
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 hover:border-amber-500/40 transition-all space-y-4 backdrop-blur-md shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-100">Dynamic Institutional Vault</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Deposit wallet addresses are backed by a live institutional vault structure. Updates propagate seamlessly to all user deposit screens without application restarts.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 hover:border-amber-500/40 transition-all space-y-4 backdrop-blur-md shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-100">Portfolio Analytics</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Monitor total portfolio value across BTC, ETH, BNB, TRX, and USDT. Interactive charts deliver complete visibility over balance trends.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 hover:border-amber-500/40 transition-all space-y-4 backdrop-blur-md shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-100">Integrated Support Desk</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Submit support requests directly to our team. Our support desk reviews, replies, and updates ticket statuses with instant notifications.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Assets List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end border-b border-neutral-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-neutral-100">Supported Cryptocurrencies</h3>
            <p className="text-xs text-neutral-400">Multi-network vault compatibility for leading digital assets</p>
          </div>
          <span className="text-xs text-amber-400 font-mono font-bold">NETBYBIT Vault</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(ASSET_METADATA).map((asset) => {
            const priceObj = prices.find((p) => p.id === asset.id);
            return (
              <div
                key={asset.id}
                className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 flex items-center justify-between hover:border-amber-500/40 transition-all shadow-md"
              >
                <div className="flex items-center space-x-3">
                  <CryptoIcon asset={asset.id} size="lg" showNetworkBadge />
                  <div>
                    <h4 className="text-sm font-bold text-neutral-100">{asset.name}</h4>
                    <span className="text-[10px] text-amber-400/90 font-mono font-semibold">{asset.network}</span>
                  </div>
                </div>
                {priceObj && (
                  <div className="text-right">
                    <p className="text-xs font-bold font-mono text-neutral-100">
                      ${priceObj.price.toLocaleString()}
                    </p>
                    <span
                      className={`text-[10px] font-bold ${
                        priceObj.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {priceObj.change24h >= 0 ? '+' : ''}
                      {priceObj.change24h}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

