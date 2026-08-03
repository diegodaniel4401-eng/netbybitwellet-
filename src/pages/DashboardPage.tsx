import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASSET_METADATA, SupportedAsset, Transaction } from '../types';
import { CryptoIcon } from '../components/CryptoIcon';
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
  Headphones,
  MessageSquare,
  CreditCard,
} from 'lucide-react';
import { BuyCryptoModal } from '../components/BuyCryptoModal';
import {
  SkeletonAreaChart,
  SkeletonDonutChart,
  SkeletonHeroBalance,
  SkeletonAssetCard,
} from '../components/SkeletonLoaders';

export const DashboardPage: React.FC = () => {
  const { user, prices, pricesLoading, refreshPrices, calculateTotalUsdBalance, setActivePage } = useAuth();
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([]);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      api.getTransactions()
        .then((txs) => setRecentTxs(txs.slice(0, 5)))
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

  // Generate historical performance curve based on totalUsd
  const historicalData = [
    { name: '00:00', usd: Math.round(totalUsd * 0.94) },
    { name: '04:00', usd: Math.round(totalUsd * 0.96) },
    { name: '08:00', usd: Math.round(totalUsd * 0.92) },
    { name: '12:00', usd: Math.round(totalUsd * 0.98) },
    { name: '16:00', usd: Math.round(totalUsd * 0.97) },
    { name: '20:00', usd: Math.round(totalUsd * 1.01) },
    { name: 'Now', usd: totalUsd },
  ];

  // Allocation donut data
  const allocationData = Object.values(ASSET_METADATA).map((asset) => {
    const amount = user.balances[asset.id] || 0;
    const price = prices.find((p) => p.id === asset.id)?.price || 0;
    const usdVal = amount * price;
    return {
      name: asset.symbol,
      value: Number(usdVal.toFixed(2)),
      color: asset.accentColor,
    };
  }).filter((item) => item.value >= 0);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Total Balance Hero */}
      {showSkeletons ? (
        <SkeletonHeroBalance />
      ) : (
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>NETBYBIT Custody • Live Portfolio Valuation</span>
                <button
                  onClick={handleRefreshMarketData}
                  disabled={showSkeletons}
                  className="ml-auto md:ml-2 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-md text-[11px] font-semibold flex items-center space-x-1 transition-all"
                  title="Refresh Live Market Data"
                >
                  <RefreshCw className={`w-3 h-3 ${showSkeletons ? 'animate-spin text-amber-400' : ''}`} />
                  <span>Refresh Prices</span>
                </button>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold font-mono text-neutral-100 tracking-tight">
                ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs font-normal text-neutral-400 ml-2 font-sans">USD Total Portfolio</span>
              </h1>

              <p className="text-xs text-neutral-400 mt-2 flex items-center space-x-2">
                <span>Account Holder: <strong className="text-amber-300">{user.name}</strong></span>
                <span>•</span>
                <span className="capitalize text-amber-400 font-mono">Role: {user.role}</span>
              </p>

              {user.connectedWallet && (
                <div className="mt-3 inline-flex items-center space-x-2 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-lg">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Connected Web3 Wallet:</span>
                  <span className="font-mono text-[11px] font-bold">
                    {user.connectedWallet.address.substring(0, 6)}...{user.connectedWallet.address.slice(-4)}
                  </span>
                </div>
              )}
            </div>

            {/* Action Quick Launchers */}
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
              <button
                onClick={() => setIsBuyModalOpen(true)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all space-y-1 col-span-2 sm:col-span-1"
              >
                <CreditCard className="w-4 h-4 text-neutral-950" />
                <span>Buy Crypto</span>
              </button>
              <button
                onClick={() => setActivePage('deposit')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all space-y-1"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Deposit</span>
              </button>
              <button
                onClick={() => setActivePage('withdraw')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-950 border border-amber-500/30 text-amber-400 hover:bg-neutral-850 font-bold text-xs transition-all space-y-1"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Withdraw</span>
              </button>
              <button
                onClick={() => setActivePage('send')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:border-amber-500/40 hover:text-amber-400 font-bold text-xs transition-all space-y-1"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
              <button
                onClick={() => setActivePage('receive')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:border-amber-500/40 hover:text-amber-400 font-bold text-xs transition-all space-y-1"
              >
                <QrCode className="w-4 h-4" />
                <span>Receive</span>
              </button>
              <button
                onClick={() => setActivePage('swap')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:border-amber-500/40 hover:text-amber-400 font-bold text-xs transition-all space-y-1"
              >
                <Repeat className="w-4 h-4" />
                <span>Swap</span>
              </button>
              <button
                onClick={() => setActivePage('support')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-amber-500/20 to-neutral-950 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-bold text-xs transition-all space-y-1 col-span-2 sm:col-span-1 shadow-md shadow-amber-500/10"
              >
                <LifeBuoy className="w-4 h-4 text-amber-400" />
                <span>Support</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Asset Cards Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-neutral-100">Wallet Assets & Holdings</h2>
            <p className="text-xs text-neutral-400">6 Supported Multi-Chain Custody Networks</p>
          </div>
          <button
            onClick={() => setIsBuyModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center space-x-2 transition-all shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            <span>Buy Crypto with Card / Fiat</span>
          </button>
        </div>

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
          ) : (
            Object.values(ASSET_METADATA).map((asset) => {
              const balance = user.balances[asset.id] || 0;
              const priceObj = prices.find((p) => p.id === asset.id);
              const price = priceObj?.price || 0;
              const usdValue = balance * price;

              return (
                <div
                  key={asset.id}
                  className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 transition-all space-y-4 shadow-lg group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <CryptoIcon asset={asset.id} size="lg" showNetworkBadge />
                      <div>
                        <h3 className="text-sm font-bold text-neutral-100 group-hover:text-amber-400 transition-colors">
                          {asset.name}
                        </h3>
                        <span className="text-[10px] text-neutral-400 font-mono">{asset.network}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 font-mono">
                      ${price.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-end pt-2 border-t border-neutral-950">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Balance</span>
                      <p className="text-base font-bold font-mono text-neutral-100">
                        {balance.toFixed(4)} <span className="text-xs text-amber-400">{asset.symbol}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">USD Value</span>
                      <p className="text-sm font-bold font-mono text-amber-400">
                        ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={() => setActivePage('deposit')}
                      className="flex-1 py-1.5 text-center text-[11px] font-semibold bg-neutral-950 hover:bg-neutral-800 text-amber-400 rounded-lg border border-amber-500/20"
                    >
                      Deposit
                    </button>
                    <button
                      onClick={() => setActivePage('withdraw')}
                      className="flex-1 py-1.5 text-center text-[11px] font-semibold bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded-lg border border-neutral-800"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Analytics & Asset Allocation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {showSkeletons ? (
          <>
            <div className="lg:col-span-8">
              <SkeletonAreaChart title="Portfolio Analytics (24h Trend)" />
            </div>
            <div className="lg:col-span-4">
              <SkeletonDonutChart />
            </div>
          </>
        ) : (
          <>
            {/* Portfolio Area Chart */}
            <div className="lg:col-span-8 p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-neutral-100">Portfolio Analytics (24h Trend)</h3>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Monitoring</span>
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData}>
                    <defs>
                      <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#525252" tick={{ fill: '#a3a3a3', fontSize: 11 }} />
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
                    <Area type="monotone" dataKey="usd" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorUsd)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Asset Allocation Donut Chart */}
            <div className="lg:col-span-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                <div className="flex items-center space-x-2">
                  <PieIcon className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-neutral-100">Asset Allocation</h3>
                </div>
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                {totalUsd === 0 ? (
                  <p className="text-xs text-neutral-500 text-center">No active crypto balance allocated</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
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

              <div className="space-y-1.5 pt-2 border-t border-neutral-950">
                {allocationData.map((item) => (
                  <div key={item.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-neutral-300 font-medium">{item.name}</span>
                    </div>
                    <span className="font-mono text-neutral-400">${item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Activity Table */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-neutral-100">Recent Transactions</h3>
          </div>
          <button
            onClick={() => setActivePage('history')}
            className="text-xs text-amber-400 hover:underline font-semibold"
          >
            View Full History →
          </button>
        </div>

        {recentTxs.length === 0 ? (
          <div className="text-center py-8 space-y-2">
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
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-950 text-xs text-neutral-200">
                {recentTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-950/60">
                    <td className="py-3 px-3 capitalize font-bold text-amber-400">{tx.type}</td>
                    <td className="py-3 px-3 font-mono">
                      <div className="flex items-center space-x-2">
                        <CryptoIcon asset={tx.asset} size="xs" />
                        <span>{tx.asset}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      {tx.amount} {tx.asset}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                          tx.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : tx.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {tx.status === 'pending' ? 'Pending Approval' : tx.status === 'completed' ? 'Successful' : 'Declined'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-neutral-400 text-[11px]">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BuyCryptoModal isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} />
    </div>
  );
};
