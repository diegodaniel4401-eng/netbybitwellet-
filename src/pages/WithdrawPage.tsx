import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASSET_METADATA, SupportedAsset } from '../types';
import { CryptoIcon } from '../components/CryptoIcon';
import { api } from '../lib/api';
import {
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Wallet,
} from 'lucide-react';

export const WithdrawPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset>('BTC');
  const [amount, setAmount] = useState('');
  const [destinationAddress, setDestinationAddress] = useState(
    user?.withdrawalAddresses?.[selectedAsset] || ''
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const assetInfo = ASSET_METADATA[selectedAsset];
  const currentBalance = user.balances[selectedAsset] || 0;

  const handleAssetChange = (assetId: SupportedAsset) => {
    setSelectedAsset(assetId);
    setDestinationAddress(user.withdrawalAddresses?.[assetId] || '');
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid withdrawal amount' });
      return;
    }

    if (parsedAmount > currentBalance) {
      setMessage({
        type: 'error',
        text: `Insufficient balance. Available balance: ${currentBalance} ${selectedAsset}`,
      });
      return;
    }

    if (!destinationAddress.trim()) {
      setMessage({ type: 'error', text: 'Please enter a destination wallet address' });
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
      // First save destination address to user withdrawal profile
      await api.updateWithdrawalAddresses({
        [selectedAsset]: destinationAddress.trim(),
      } as Record<SupportedAsset, string>);

      // Submit withdrawal transaction
      await api.createTransaction({
        type: 'withdraw',
        asset: selectedAsset,
        amount: parsedAmount,
        destinationAddress: destinationAddress.trim(),
      });

      await refreshUser();
      setMessage({
        type: 'success',
        text: 'Withdrawal request submitted successfully.',
      });
      setAmount('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Withdrawal failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-neutral-100">Withdraw Crypto</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Request asset withdrawal to external Web3 blockchain wallet
          </p>
        </div>
      </div>

      <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl text-neutral-100 space-y-6">
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

        {/* Asset Selector */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-2">Select Asset to Withdraw</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.values(ASSET_METADATA).map((asset) => {
              const isSelected = selectedAsset === asset.id;
              const bal = user.balances[asset.id] || 0;
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleAssetChange(asset.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center space-x-2.5 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <CryptoIcon asset={asset.id} size="sm" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-xs truncate">{asset.symbol}</p>
                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5 truncate">Bal: {bal.toFixed(4)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Balance & Amount Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex justify-between items-center text-xs">
            <div className="flex items-center space-x-3">
              <CryptoIcon asset={selectedAsset} size="md" showNetworkBadge />
              <div>
                <span className="text-neutral-500 block">Available Balance</span>
                <span className="font-bold font-mono text-neutral-100 text-sm">
                  {currentBalance.toFixed(4)} {assetInfo.symbol}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAmount(currentBalance.toString())}
              className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[10px] hover:bg-amber-500/20"
            >
              MAX
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Withdrawal Amount</label>
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
              <span className="absolute right-3 top-2.5 text-xs text-amber-400 font-bold font-mono">
                {assetInfo.symbol}
              </span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-neutral-300">
                Destination Wallet Address ({assetInfo.network})
              </label>
              {user.connectedWallet && (
                <button
                  type="button"
                  onClick={() => setDestinationAddress(user.connectedWallet?.address || '')}
                  className="text-[10px] text-amber-400 hover:underline"
                >
                  Use Connected Wallet
                </button>
              )}
            </div>
            <input
              type="text"
              required
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder={`Enter valid ${assetInfo.network} address`}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 text-[11px] text-neutral-400">
            <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Security Notice</span>
            </div>
            <p>
              Please verify your withdrawal details carefully before submitting your request. Cryptocurrency transactions cannot be reversed once they have been processed.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Processing Withdrawal...' : `Submit Withdrawal of ${amount || '0'} ${assetInfo.symbol}`}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
