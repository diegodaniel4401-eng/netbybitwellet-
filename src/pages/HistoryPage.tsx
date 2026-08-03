import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Transaction, TransactionType } from '../types';
import { api } from '../lib/api';
import { History, Search, Filter, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 8;

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  // Filtering
  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.destinationAddress && t.destinationAddress.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || t.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
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
        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
          https://netbybit.web.app
        </span>
      </div>

      <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-6 text-neutral-100">
        {/* Controls Bar: Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search txHash, asset, address..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-amber-400 shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50 capitalize"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdraw">Withdrawals</option>
              <option value="send">Sends</option>
              <option value="receive">Receives</option>
              <option value="swap">Swaps</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-500">Loading history records...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            No transactions match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Asset</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Tx Hash</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-950 text-xs text-neutral-200 font-mono">
                {paginated.map((tx) => {
                  const dateObj = new Date(tx.date);
                  return (
                    <tr key={tx.id} className="hover:bg-neutral-950/70">
                      <td className="py-3 px-3 text-neutral-400 text-[11px] font-sans">
                        <div>{dateObj.toLocaleDateString()}</div>
                        <div className="text-[10px] text-neutral-500">{dateObj.toLocaleTimeString()}</div>
                      </td>
                      <td className="py-3 px-3 font-bold capitalize text-amber-400 font-sans">
                        {tx.type}
                      </td>
                      <td className="py-3 px-3 font-bold">{tx.asset}</td>
                      <td className="py-3 px-3">
                        {tx.type === 'withdraw' || tx.type === 'send' ? '-' : '+'}
                        {tx.amount} {tx.asset}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-neutral-400">
                        {tx.txHash ? `${tx.txHash.substring(0, 10)}...` : 'N/A'}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            tx.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : tx.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex justify-between items-center border-t border-neutral-800 pt-4 text-xs text-neutral-400">
          <span>
            Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filtered.length} items)
          </span>
          <div className="flex space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 disabled:opacity-40 hover:border-amber-500/40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 disabled:opacity-40 hover:border-amber-500/40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
