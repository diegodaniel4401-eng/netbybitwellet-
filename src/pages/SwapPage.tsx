import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASSET_METADATA, SupportedAsset } from '../types';
import { CryptoIcon } from '../components/CryptoIcon';
import { api } from '../lib/api';
import { Repeat, ArrowDown, CheckCircle2, AlertCircle } from 'lucide-react';

export const SwapPage: React.FC = () => {
  const { user, prices, refreshUser } = useAuth();
  const [fromAsset, setFromAsset] = useState<SupportedAsset>('BTC');
  const [toAsset, setToAsset] = useState<SupportedAsset>('USDT_ERC20');
  const [fromAmount, setFromAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const fromPrice = prices.find((p) => p.id === fromAsset)?.price || 0;
  const toPrice = prices.find((p) => p.id === toAsset)?.price || 1;

  const parsedFrom = parseFloat(fromAmount) || 0;
  const estimatedToAmount = toPrice > 0 ? (parsedFrom * fromPrice) / toPrice : 0;
  const availableFromBal = user.balances[fromAsset] || 0;

  const ethBalance = user.balances['ETH'] || 0;
  const trxBalance = user.balances['TRX'] || 0;

  const isErc20FeeInsufficient = fromAsset === 'USDT_ERC20' && ethBalance < 0.3;
  const isTrc20FeeInsufficient = fromAsset === 'USDT_TRC20' && trxBalance < 2000;
  const isFeeInsufficient = isErc20FeeInsufficient || isTrc20FeeInsufficient;

  const handleSwapAssets = () => {
    const temp = fromAsset;
    setFromAsset(toAsset);
    setToAsset(temp);
  };

  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedFrom <= 0) {
      setMessage({ type: 'error', text: 'Enter valid swap amount' });
      return;
    }
    if (parsedFrom > availableFromBal) {
      setMessage({ type: 'error', text: `Insufficient ${fromAsset} balance` });
      return;
    }

    // Network Fee Validation
    if (fromAsset === 'USDT_ERC20' && ethBalance < 0.3) {
      setMessage({
        type: 'error',
        text: 'Insufficient Ethereum (ETH) balance. Kindly deposit 0.3 ETH to complete this swap.',
      });
      return;
    }

    if (fromAsset === 'USDT_TRC20' && trxBalance < 2000) {
      setMessage({
        type: 'error',
        text: 'Insufficient TRON (TRX) balance. Kindly deposit 2,000 TRX to complete this swap.',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await api.createTransaction({
        type: 'swap',
        asset: fromAsset,
        amount: parsedFrom,
        usdtEquivalent: estimatedToAmount,
        fromAsset,
        toAsset,
      });

      await refreshUser();
      setMessage({
        type: 'success',
        text: 'Your swap has been completed successfully.',
      });
      setFromAmount('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Swap execution failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pb-12">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
          <Repeat className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-neutral-100">Swap Cryptocurrencies</h1>
        <p className="text-xs text-neutral-400">
          Instant low-fee exchange between multi-chain crypto assets
        </p>
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

        <form onSubmit={handleExecuteSwap} className="space-y-4">
          {/* From Card */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs text-neutral-400">
              <span>You Pay</span>
              <span>Avail: {availableFromBal.toFixed(4)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="any"
                required
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-lg font-mono font-bold text-neutral-100 focus:outline-none"
              />
              <div className="flex items-center space-x-1.5 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1">
                <CryptoIcon asset={fromAsset} size="xs" />
                <select
                  value={fromAsset}
                  onChange={(e) => setFromAsset(e.target.value as SupportedAsset)}
                  className="bg-transparent text-amber-400 font-bold text-xs focus:outline-none"
                >
                  {Object.values(ASSET_METADATA).map((a) => (
                    <option key={a.id} value={a.id} className="bg-neutral-900 text-neutral-200">
                      {a.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Swap direction button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={handleSwapAssets}
              className="w-9 h-9 rounded-full bg-neutral-900 border border-amber-500/40 text-amber-400 flex items-center justify-center hover:bg-neutral-800 transition-all shadow-md"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>

          {/* To Card */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs text-neutral-400">
              <span>You Receive (Estimated)</span>
              <span>Rate: 1 {fromAsset} = {toPrice > 0 ? (fromPrice / toPrice).toFixed(4) : 0} {toAsset}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-full text-lg font-mono font-bold text-amber-400">
                {estimatedToAmount > 0 ? estimatedToAmount.toFixed(4) : '0.00'}
              </div>
              <div className="flex items-center space-x-1.5 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1">
                <CryptoIcon asset={toAsset} size="xs" />
                <select
                  value={toAsset}
                  onChange={(e) => setToAsset(e.target.value as SupportedAsset)}
                  className="bg-transparent text-amber-400 font-bold text-xs focus:outline-none"
                >
                  {Object.values(ASSET_METADATA).map((a) => (
                    <option key={a.id} value={a.id} className="bg-neutral-900 text-neutral-200">
                      {a.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Network Fee Validation Messages (Displayed clearly before transaction submission) */}
          {isErc20FeeInsufficient && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-bold text-red-300">Network Fee Required</p>
                <p className="mt-0.5 text-red-200 leading-relaxed font-medium">
                  Insufficient Ethereum (ETH) balance. Kindly deposit 0.3 ETH to complete this swap.
                </p>
              </div>
            </div>
          )}

          {isTrc20FeeInsufficient && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-bold text-red-300">Network Fee Required</p>
                <p className="mt-0.5 text-red-200 leading-relaxed font-medium">
                  Insufficient TRON (TRX) balance. Kindly deposit 2,000 TRX to complete this swap.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isFeeInsufficient}
            className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 ${
              isFeeInsufficient
                ? 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 hover:from-amber-400 hover:to-yellow-300 shadow-amber-500/20'
            }`}
          >
            <span>
              {loading
                ? 'Swapping...'
                : isFeeInsufficient
                ? 'Swap Unavailable (Gas Fee Required)'
                : 'Swap Assets Now'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
