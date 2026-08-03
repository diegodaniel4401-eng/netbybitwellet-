import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Transaction } from '../types';
import { CryptoIcon } from '../components/CryptoIcon';
import { api } from '../lib/api';
import { History, Search, ArrowDownLeft, ArrowUpRight, Send, QrCode, Repeat, ExternalLink } from 'lucide-react';

export const TransactionHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.getTransactions()
        .then((txs) => setTransactions(txs))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const filtered = transactions.filter((t) => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSearch =
      t.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.destinationAddress && t.destinationAddress.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'withdraw':
        return <ArrowUpRight className="w-4 h-4 text-amber-400" />;
      case 'send':
        return <Send className="w-4 h-4 text-blue-400" />;
      case 'swap':
        return <Repeat className="w-4 h-4 text-purple-400" />;
      default:
        return <QrCode className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <History className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-neutral-100">Transaction History</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Complete audit trail of deposits, withdrawals, transfers, and swaps
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by asset or TX hash..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1.5 bg-neutral-900 p-1 border border-neutral-800 rounded-xl overflow-x-auto w-full sm:w-auto">
          {['all', 'deposit', 'withdraw', 'send', 'swap'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize font-bold transition-all ${
                filterType === type
                  ? 'bg-amber-500 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="text-center py-12 text-xs text-neutral-400">Loading transaction record...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-xs text-neutral-500">No transactions match search filter</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/60 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Transaction</th>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Hash / Address</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-950 text-xs text-neutral-200 font-mono">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-950/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 shrink-0">
                        {getIcon(tx.type)}
                      </div>
                      <span className="capitalize font-bold text-amber-300">{tx.type}</span>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center space-x-2">
                        <CryptoIcon asset={tx.asset} size="xs" />
                        <span className="font-mono">{tx.asset}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-neutral-100">
                      {tx.amount} {tx.asset}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-neutral-400">
                      <div className="truncate max-w-[140px]" title={tx.txHash}>
                        {tx.txHash}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
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
                    <td className="py-3.5 px-4 text-neutral-400 text-[11px] font-sans">
                      {new Date(tx.date).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
