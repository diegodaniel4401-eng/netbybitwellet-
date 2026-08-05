import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASSET_METADATA, SupportedAsset, Transaction } from '../types';
import { CryptoIcon } from '../components/CryptoIcon';
import { CurrencySwitcher } from '../components/CurrencySwitcher';
import { api } from '../lib/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  QrCode,
  Repeat,
  TrendingUp,
  PieChart as PieIcon,
  ShieldCheck,
  History,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  RefreshCw,
  LifeBuoy,
  CreditCard,
  Eye,
  EyeOff,
  Search,
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  ListFilter,
  BarChart3,
  Globe,
  ArrowRight,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { BuyCryptoModal } from '../components/BuyCryptoModal';
import {
  SkeletonAreaChart,
  SkeletonDonutChart,
  SkeletonHeroBalance,
  SkeletonAssetCard,
  SkeletonMarketList,
} from '../components/SkeletonLoaders';

export const DashboardPage: React.FC = () => {
  const {
    user,
    prices,
    pricesLoading,
    refreshPrices,
    calculateTotalUsdBalance,
    setActivePage,
    selectedCurrency,
    formatFiat,
    hideBalances,
    setHideBalances,
  } = useAuth();

  const [recentTxs, setRecentTxs] = useState<Transaction[]>([]);
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'assets' | 'analytics' | 'market' | 'history'>('assets');
  const [assetSearchQuery, setAssetSearchQuery] = useState<string>('');
  const [hideZeroBalances, setHideZeroBalances] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    if (user) {
      api
        .getTransactions()
        .then((txs) => setRecentTxs(txs))
        .catch((err) => console.error(err));
    }
  }, [user]);

  if (!user) return null;

  const handleRefreshMarketData = async () => {
    setIsManualRefreshing(true);
    await refreshPrices();
    setTimeout(() => {
      setIsManualRefreshing(false);
    }, 800);
  };

  const showSkeletons = pricesLoading || prices.length === 0 || isManualRefreshing;

  const totalUsd = calculateTotalUsdBalance();
  const formattedTotalFiat = formatFiat(totalUsd);

  // Estimate BTC valuation
  const btcPriceObj = prices.find((p) => p.id === 'BTC');
  const btcPrice = btcPriceObj?.price || 68450;
  const btcValuation = btcPrice > 0 ? (totalUsd / btcPrice).toFixed(4) : '0.0000';

  // 24h PnL estimate (e.g., +2.4%)
  const pnlUsd = totalUsd * 0.024;
  const formattedPnlFiat = formatFiat(pnlUsd);

  // Historical performance curve in selected fiat currency
  const historicalData = [
    { time: '00:00', value: formatFiat(totalUsd * 0.94).amount },
    { time: '04:00', value: formatFiat(totalUsd * 0.96).amount },
    { time: '08:00', value: formatFiat(totalUsd * 0.92).amount },
    { time: '12:00', value: formatFiat(totalUsd * 0.98).amount },
    { time: '16:00', value: formatFiat(totalUsd * 0.97).amount },
    { time: '20:00', value: formatFiat(totalUsd * 1.01).amount },
    { time: 'Now', value: formattedTotalFiat.amount },
  ];

  // Allocation donut data
  const allocationData = Object.values(ASSET_METADATA)
    .map((asset) => {
      const amount = user.balances[asset.id] || 0;
      const price = prices.find((p) => p.id === asset.id)?.price || 0;
      const usdVal = amount * price;
      const fiatVal = formatFiat(usdVal).amount;
      return {
        name: asset.symbol,
        value: Number(fiatVal.toFixed(2)),
        color: asset.accentColor,
        usdValue: usdVal,
      };
    })
    .filter((item) => item.value >= 0);

  // Asset list filtering
  const allAssets = Object.values(ASSET_METADATA);
  const filteredAssets = allAssets.filter((asset) => {
    const balance = user.balances[asset.id] || 0;
    if (hideZeroBalances && balance <= 0) return false;
    if (!assetSearchQuery.trim()) return true;
    const query = assetSearchQuery.toLowerCase();
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.symbol.toLowerCase().includes(query) ||
      asset.network.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner / Total Balance Hero - Bybit Web3 Style */}
      {showSkeletons ? (
        <SkeletonHeroBalance />
      ) : (
        <div className="bg-gradient-to-br from-[#121318] via-[#161822] to-[#0c0d12] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Ambient Glowing Orb Effects */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            {/* Left Balance Display */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>NETBYBIT Custody Vault</span>
                </span>

                <button
                  onClick={() => setHideBalances((prev) => !prev)}
                  className="p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-amber-400 transition-all flex items-center space-x-1"
                  title={hideBalances ? 'Show Balances' : 'Hide Balances'}
                >
                  {hideBalances ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[11px] font-mono">{hideBalances ? 'Hidden' : 'Visible'}</span>
                </button>

                <button
                  onClick={handleRefreshMarketData}
                  disabled={showSkeletons}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-[11px] font-semibold flex items-center space-x-1.5 transition-all"
                  title="Refresh Live Exchange Rates"
                >
                  <RefreshCw className={`w-3 h-3 ${showSkeletons ? 'animate-spin text-amber-400' : ''}`} />
                  <span>Refresh Rates</span>
                </button>
              </div>

              {/* Balance & Currency Switcher Row */}
              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="text-3xl sm:text-5xl font-black font-mono text-neutral-100 tracking-tight flex items-center space-x-2">
                  <span>{hideBalances ? '••••••••' : formattedTotalFiat.formatted}</span>
                </h1>

                {/* Interactive Currency Switcher */}
                <CurrencySwitcher variant="hero" />
              </div>

              {/* Sub-estimates: BTC & 24h PnL */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400 pt-1">
                <div className="flex items-center space-x-1.5 bg-neutral-900/60 px-2.5 py-1 rounded-md border border-neutral-800">
                  <span className="text-neutral-500">BTC Est:</span>
                  <span className="text-amber-300 font-bold">{hideBalances ? '••••' : `≈ ${btcValuation} BTC`}</span>
                </div>

                <div className="flex items-center space-x-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>24h PnL:</span>
                  <span className="font-bold">
                    {hideBalances ? '••••' : `+${formattedPnlFiat.formatted} (+2.40%)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Launcher Actions - Bybit Modern Style */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 lg:pt-0">
              <button
                onClick={() => setIsBuyModalOpen(true)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.03] transition-all space-y-1 col-span-2 sm:col-span-1"
              >
                <CreditCard className="w-4 h-4 text-neutral-950" />
                <span>Buy Crypto</span>
              </button>

              <button
                onClick={() => setActivePage('deposit')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-500 text-neutral-950 hover:bg-amber-400 font-extrabold text-xs shadow-md transition-all space-y-1"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Deposit</span>
              </button>

              <button
                onClick={() => setActivePage('withdraw')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-900 border border-amber-500/30 text-amber-300 hover:bg-neutral-800 font-bold text-xs transition-all space-y-1"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Withdraw</span>
              </button>

              <button
                onClick={() => setActivePage('send')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500/40 hover:text-amber-400 font-bold text-xs transition-all space-y-1"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>

              <button
                onClick={() => setActivePage('receive')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500/40 hover:text-amber-400 font-bold text-xs transition-all space-y-1"
              >
                <QrCode className="w-4 h-4" />
                <span>Receive</span>
              </button>

              <button
                onClick={() => setActivePage('swap')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500/40 hover:text-amber-400 font-bold text-xs transition-all space-y-1"
              >
                <Repeat className="w-4 h-4" />
                <span>Swap</span>
              </button>

              <button
                onClick={() => setActivePage('support')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-amber-500/20 to-neutral-900 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-bold text-xs transition-all space-y-1 col-span-2 sm:col-span-1 shadow-md shadow-amber-500/10"
              >
                <LifeBuoy className="w-4 h-4 text-amber-400" />
                <span>Support</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800 pb-3 gap-4">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('assets')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'assets'
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Asset Holdings ({allAssets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Portfolio Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('market')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'market'
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Market Trends</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Recent Activity ({recentTxs.length})</span>
          </button>
        </div>

        {/* Display Currency Quick Status Badge */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[11px] text-neutral-400">Display Currency:</span>
          <CurrencySwitcher variant="compact" />
        </div>
      </div>

      {/* TAB 1: ASSET HOLDINGS */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search asset or network (e.g. BTC, Solana, USDT)..."
                value={assetSearchQuery}
                onChange={(e) => setAssetSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Filter Switches & View Toggle */}
            <div className="flex items-center space-x-4 text-xs text-neutral-300">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hideZeroBalances}
                  onChange={(e) => setHideZeroBalances(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-800 text-amber-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span className="text-[11px] font-medium">Hide Zero Balances</span>
              </label>

              <div className="h-4 w-px bg-neutral-800" />

              <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'table' ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="List View"
                >
                  <ListFilter className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid View Mode */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {showSkeletons ? (
                <>
                  <SkeletonAssetCard />
                  <SkeletonAssetCard />
                  <SkeletonAssetCard />
                  <SkeletonAssetCard />
                  <SkeletonAssetCard />
                  <SkeletonAssetCard />
                </>
              ) : filteredAssets.length === 0 ? (
                <div className="col-span-full py-12 text-center space-y-2 bg-neutral-900/40 rounded-2xl border border-neutral-800">
                  <p className="text-xs text-neutral-400">No crypto assets match your criteria</p>
                  <button
                    onClick={() => {
                      setAssetSearchQuery('');
                      setHideZeroBalances(false);
                    }}
                    className="text-xs text-amber-400 font-bold hover:underline"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                filteredAssets.map((asset) => {
                  const balance = user.balances[asset.id] || 0;
                  const priceObj = prices.find((p) => p.id === asset.id);
                  const priceUsd = priceObj?.price || 0;
                  const change24h = priceObj?.change24h || 0;

                  const balanceUsd = balance * priceUsd;
                  const balanceFiat = formatFiat(balanceUsd);
                  const priceFiat = formatFiat(priceUsd);

                  return (
                    <div
                      key={asset.id}
                      className="p-5 rounded-2xl bg-[#121318] border border-neutral-800/80 hover:border-amber-500/40 transition-all space-y-4 shadow-xl group relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <CryptoIcon asset={asset.id} size="lg" showNetworkBadge />
                          <div>
                            <h3 className="text-sm font-bold text-neutral-100 group-hover:text-amber-400 transition-colors flex items-center space-x-1.5">
                              <span>{asset.name}</span>
                              <span className="text-xs text-neutral-500 font-mono">({asset.symbol})</span>
                            </h3>
                            <span className="text-[10px] text-neutral-400 font-mono block">{asset.network}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-neutral-200 block">
                            {priceFiat.formatted}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border inline-block mt-0.5 ${
                              change24h >= 0
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}
                          >
                            {change24h >= 0 ? '+' : ''}
                            {change24h.toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      {/* Balances Box */}
                      <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-850 space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-neutral-500 text-[11px]">Crypto Balance:</span>
                          <span className="font-mono font-extrabold text-neutral-100">
                            {hideBalances ? '••••••••' : `${balance.toFixed(4)} ${asset.symbol}`}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs pt-1.5 border-t border-neutral-900">
                          <span className="text-neutral-500 text-[11px]">Estimated Fiat Value:</span>
                          <span className="font-mono font-extrabold text-amber-400">
                            {hideBalances ? '••••••••' : balanceFiat.formatted}
                          </span>
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex space-x-2 pt-1">
                        <button
                          onClick={() => setActivePage('deposit')}
                          className="flex-1 py-1.5 text-center text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 transition-all"
                        >
                          Deposit
                        </button>
                        <button
                          onClick={() => setActivePage('withdraw')}
                          className="flex-1 py-1.5 text-center text-[11px] font-bold bg-neutral-950 hover:bg-neutral-850 text-neutral-300 rounded-xl border border-neutral-800 transition-all"
                        >
                          Withdraw
                        </button>
                        <button
                          onClick={() => setActivePage('swap')}
                          className="px-2.5 py-1.5 text-center text-[11px] font-bold bg-neutral-950 hover:bg-neutral-850 text-amber-400 rounded-xl border border-neutral-800 transition-all"
                          title="Swap"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Table View Mode */}
          {viewMode === 'table' && (
            <div className="bg-[#121318] rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/60 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Asset</th>
                      <th className="py-3.5 px-4">Network</th>
                      <th className="py-3.5 px-4">Price ({selectedCurrency})</th>
                      <th className="py-3.5 px-4">24h Change</th>
                      <th className="py-3.5 px-4">Balance</th>
                      <th className="py-3.5 px-4">Fiat Value ({selectedCurrency})</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900 text-xs text-neutral-200 font-mono">
                    {filteredAssets.map((asset) => {
                      const balance = user.balances[asset.id] || 0;
                      const priceObj = prices.find((p) => p.id === asset.id);
                      const priceUsd = priceObj?.price || 0;
                      const change24h = priceObj?.change24h || 0;

                      const balanceUsd = balance * priceUsd;
                      const balanceFiat = formatFiat(balanceUsd);
                      const priceFiat = formatFiat(priceUsd);

                      return (
                        <tr key={asset.id} className="hover:bg-neutral-950/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold font-sans">
                            <div className="flex items-center space-x-2.5">
                              <CryptoIcon asset={asset.id} size="sm" />
                              <div>
                                <span className="text-neutral-100">{asset.name}</span>
                                <span className="text-[10px] text-neutral-500 ml-1.5 font-mono">
                                  {asset.symbol}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-400 text-[11px] font-sans">
                            {asset.network}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-neutral-200">
                            {priceFiat.formatted}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                change24h >= 0
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              {change24h >= 0 ? '+' : ''}
                              {change24h.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-neutral-100">
                            {hideBalances ? '••••••••' : `${balance.toFixed(4)} ${asset.symbol}`}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-amber-400">
                            {hideBalances ? '••••••••' : balanceFiat.formatted}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2 font-sans">
                            <button
                              onClick={() => setActivePage('deposit')}
                              className="px-2.5 py-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg"
                            >
                              Deposit
                            </button>
                            <button
                              onClick={() => setActivePage('withdraw')}
                              className="px-2.5 py-1 text-[11px] font-bold text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg"
                            >
                              Withdraw
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PORTFOLIO ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {showSkeletons ? (
            <>
              <div className="lg:col-span-8">
                <SkeletonAreaChart title={`Portfolio Performance (${selectedCurrency})`} />
              </div>
              <div className="lg:col-span-4">
                <SkeletonDonutChart />
              </div>
            </>
          ) : (
            <>
              {/* Performance Curve */}
              <div className="lg:col-span-8 p-6 rounded-3xl bg-[#121318] border border-neutral-800 space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <span>Portfolio Valuation Curve ({selectedCurrency})</span>
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Converted in real-time to {selectedCurrency}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>24h Trend Monitoring</span>
                  </span>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#525252" tick={{ fill: '#a3a3a3', fontSize: 11 }} />
                      <YAxis stroke="#525252" tick={{ fill: '#a3a3a3', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0a0a0a',
                          borderColor: '#f59e0b33',
                          borderRadius: '0.75rem',
                          color: '#f59e0b',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorVal)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Asset Allocation Donut */}
              <div className="lg:col-span-4 p-6 rounded-3xl bg-[#121318] border border-neutral-800 space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                  <h3 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
                    <PieIcon className="w-4 h-4 text-amber-400" />
                    <span>Asset Distribution</span>
                  </h3>
                </div>

                <div className="h-48 w-full flex items-center justify-center">
                  {totalUsd === 0 ? (
                    <p className="text-xs text-neutral-500 text-center">No active crypto holdings</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={72}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {allocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0a0a0a',
                            borderColor: '#404040',
                            borderRadius: '0.5rem',
                            fontSize: '11px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-900 custom-scrollbar max-h-40 overflow-y-auto pr-1">
                  {allocationData.map((item) => (
                    <div key={item.name} className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-neutral-300 font-bold">{item.name}</span>
                      </div>
                      <span className="font-mono text-neutral-300">
                        {formatFiat(item.usdValue).formatted}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: MARKET TRENDS */}
      {activeTab === 'market' && (
        <div className="p-6 rounded-3xl bg-[#121318] border border-neutral-800 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Live Crypto Market Index</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Real-time market rates formatted in {selectedCurrency}
              </p>
            </div>
            <button
              onClick={handleRefreshMarketData}
              className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span>Refresh Markets</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prices.map((p) => {
              const priceFiat = formatFiat(p.price);
              const highFiat = formatFiat(p.high24h);
              const lowFiat = formatFiat(p.low24h);

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-850 hover:border-amber-500/40 transition-all space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <CryptoIcon asset={p.id} size="md" />
                      <div>
                        <h4 className="text-xs font-bold text-neutral-100">{p.name}</h4>
                        <span className="text-[10px] text-neutral-500 font-mono">{p.symbol}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                        p.change24h >= 0
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {p.change24h >= 0 ? '+' : ''}
                      {p.change24h.toFixed(2)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                      Current Price ({selectedCurrency})
                    </span>
                    <p className="text-lg font-black font-mono text-neutral-100">
                      {priceFiat.formatted}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400 pt-2 border-t border-neutral-900">
                    <div>
                      <span className="text-neutral-500 block">24h High:</span>
                      <span className="text-neutral-200 font-bold">{highFiat.formatted}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">24h Low:</span>
                      <span className="text-neutral-200 font-bold">{lowFiat.formatted}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsBuyModalOpen(true)}
                    className="w-full py-1.5 text-center text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Buy {p.symbol}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: RECENT TRANSACTIONS */}
      {activeTab === 'history' && (
        <div className="p-6 rounded-3xl bg-[#121318] border border-neutral-800 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-neutral-100">Full Transaction Activity</h3>
            </div>
            <button
              onClick={() => setActivePage('history')}
              className="text-xs text-amber-400 hover:underline font-bold"
            >
              Open History Module →
            </button>
          </div>

          {recentTxs.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-xs text-neutral-500">No transactions recorded yet</p>
              <button
                onClick={() => setActivePage('deposit')}
                className="text-xs text-amber-400 font-bold hover:underline"
              >
                Make your first deposit
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Asset</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Est. Fiat Value ({selectedCurrency})</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 text-xs text-neutral-200 font-mono">
                  {recentTxs.map((tx) => {
                    const priceObj = prices.find((p) => p.id === tx.asset);
                    const priceUsd = priceObj?.price || 1;
                    const fiatVal = formatFiat(tx.amount * priceUsd);

                    return (
                      <tr key={tx.id} className="hover:bg-neutral-950/60 transition-colors">
                        <td className="py-3 px-3 capitalize font-bold text-amber-400">{tx.type}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-2">
                            <CryptoIcon asset={tx.asset} size="xs" />
                            <span>{tx.asset}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-bold">
                          {tx.amount} {tx.asset}
                        </td>
                        <td className="py-3 px-3 text-neutral-300 font-bold">
                          {fiatVal.formatted}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              tx.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : tx.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}
                          >
                            {tx.status === 'pending'
                              ? 'Pending'
                              : tx.status === 'completed'
                              ? 'Completed'
                              : 'Failed'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-neutral-400 text-[11px] font-sans">
                          {new Date(tx.date).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Buy Crypto Modal */}
      <BuyCryptoModal isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} />
    </div>
  );
};
