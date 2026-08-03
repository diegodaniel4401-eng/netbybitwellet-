import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASSET_METADATA, SupportedAsset } from '../types';
import { api } from '../lib/api';
import { Send, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

export const SendPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset>('USDT_ERC20');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const assetInfo = ASSET_METADATA[selectedAsset];
  const currentBalance = user.balances[selectedAsset] || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    if (parsedAmount > currentBalance) {
      setMessage({ type: 'error', text: `Insufficient balance (${currentBalance} ${selectedAsset})` });
      return;
    }

    if (!recipient.trim()) {
      setMessage({ type: 'error', text: 'Please enter recipient email or wallet address' });
      return;
    }

    // Network Fee Validation
    if (selectedAsset === 'USDT_ERC20' && (user.balances['ETH'] || 0) <= 0) {
      setMessage({
        type: 'error',
        text: 'Transaction Failed. You do not have enough ETH to pay the Ethereum network (gas) fee. Please top up your ETH balance and try again.',
      });
      return;
    }

    if (selectedAsset === 'USDT_TRC20' && (user.balances['TRX'] || 0) <= 0) {
      setMessage({
        type: 'error',
        text: 'Transaction Failed. You do not have enough TRX to pay the TRON network fee. Please top up your TRX balance and try again.',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await api.createTransaction({
        type: 'send',
        asset: selectedAsset,
        amount: parsedAmount,
        destinationAddress: recipient.trim(),
      });

      await refreshUser();
      setMessage({
        type: 'success',
        text: `Sent ${parsedAmount} ${selectedAsset} to ${recipient}. Transfer confirmed!`,
      });
      setAmount('');
      setRecipient('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Send transaction failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Send className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-neutral-100">Send Crypto Instant</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Transfer assets to any email address or blockchain wallet
          </p>
        </div>
      </div>

      <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
        {message && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Select Asset</label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value as SupportedAsset)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/50 font-mono"
            >
              {Object.values(ASSET_METADATA).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.symbol} ({a.name}) - Bal: {(user.balances[a.id] || 0).toFixed(4)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Recipient Address / Email</label>
            <input
              type="text"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="user@example.com or 0x... / T..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-neutral-300">Amount</label>
              <span className="text-[11px] text-neutral-400 font-mono">
                Avail: {currentBalance.toFixed(4)} {assetInfo.symbol}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="button"
                onClick={() => setAmount(currentBalance.toString())}
                className="absolute right-3 top-2 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold"
              >
                MAX
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Sending...' : 'Confirm Transfer'}</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
