import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASSET_METADATA, SupportedAsset } from '../types';
import { CryptoIcon } from '../components/CryptoIcon';
import { BuyCryptoModal } from '../components/BuyCryptoModal';
import { api } from '../lib/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowDownLeft,
  Copy,
  Check,
  ShieldCheck,
  Info,
  CheckCircle2,
  AlertCircle,
  CreditCard,
} from 'lucide-react';

export const DepositPage: React.FC = () => {
  const { user, depositAddresses, refreshUser } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset>('BTC');
  const [copied, setCopied] = useState(false);
  const [simulatedAmount, setSimulatedAmount] = useState('0.05');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  const assetInfo = ASSET_METADATA[selectedAsset];
  const currentAddress = depositAddresses[selectedAsset] || assetInfo.defaultAddress;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(simulatedAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid deposit amount' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await api.createTransaction({
        type: 'deposit',
        asset: selectedAsset,
        amount: parsed,
      });

      // Update user balances in backend DB by admin logic or direct simulation response
      await refreshUser();
      setMessage({
        type: 'success',
        text: `Deposit notification for ${parsed} ${selectedAsset} broadcast to blockchain. Status: Pending.`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Deposit submission failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-neutral-100">Deposit & Buy Cryptographic Assets</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Deposit crypto directly or purchase instantly using fiat on-ramps
          </p>
        </div>
        <button
          onClick={() => setIsBuyModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center justify-center space-x-2 shrink-0 transform hover:-translate-y-0.5"
        >
          <CreditCard className="w-4 h-4 text-neutral-950" />
          <span>Buy Crypto with Card / Fiat</span>
        </button>
      </div>

      {/* Asset Selection Tabs */}
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">
          Select Asset & Network
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {Object.values(ASSET_METADATA).map((asset) => {
            const isSelected = selectedAsset === asset.id;
            return (
              <button
                key={asset.id}
                onClick={() => {
                  setSelectedAsset(asset.id);
                  setMessage(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center space-x-2.5 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <CryptoIcon asset={asset.id} size="sm" />
                <div className="overflow-hidden">
                  <span className="font-bold text-xs block truncate">{asset.symbol}</span>
                  <span className="text-[9px] opacity-75 truncate block">{asset.network}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Deposit Address & QR Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-neutral-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* QR Code Column */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
          <div className="p-4 bg-white rounded-2xl shadow-xl">
            <QRCodeSVG value={currentAddress} size={170} level="H" />
          </div>
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-neutral-200 block">{assetInfo.name}</span>
            <span className="text-[10px] text-amber-400 font-mono block">{assetInfo.network}</span>
            <p className="text-[10px] text-neutral-500 max-w-[200px]">
              Scan QR code with your hardware or software mobile wallet
            </p>
          </div>
        </div>

        {/* Address Details Column */}
        <div className="md:col-span-7 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Official Custody Deposit Address
            </span>
            <div className="flex items-center space-x-3 pt-1">
              <CryptoIcon asset={assetInfo.id} size="lg" showNetworkBadge />
              <div>
                <h3 className="text-lg font-bold text-neutral-100">{assetInfo.name} ({assetInfo.symbol})</h3>
                <span className="text-xs text-neutral-400 font-mono">{assetInfo.network}</span>
              </div>
            </div>
            <p className="text-xs text-neutral-400 pt-1">
              Only send <strong className="text-neutral-200">{assetInfo.symbol}</strong> via the{' '}
              <strong className="text-amber-300">{assetInfo.network}</strong> network to this exact address.
            </p>
          </div>

          {/* Copyable Address Container */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Configured Deposit Address</label>
            <div className="flex items-center space-x-2 bg-neutral-950 border border-amber-500/40 rounded-xl p-3 font-mono text-xs text-neutral-100 break-all">
              <span className="flex-1 text-amber-300 font-bold select-all">{currentAddress}</span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center space-x-1 shrink-0 transition-all shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <Info className="w-4 h-4 shrink-0" />
              <span>Important Deposit Instructions</span>
            </div>
            <ul className="list-disc list-inside text-neutral-400 space-y-1 text-[11px] leading-relaxed">
              <li>Minimum deposit: 0.0001 {assetInfo.symbol}</li>
              <li>Required network confirmations: 2 block confirmations</li>
              <li>Addresses are generated dynamically by system administrators.</li>
            </ul>
          </div>

          {/* Deposit Simulation Form */}
          <form onSubmit={handleSimulateDeposit} className="pt-2 border-t border-neutral-800 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-neutral-200">Broadcast Transfer (Simulated Confirmation)</label>
              <span className="text-[10px] text-neutral-500">Auto-credits wallet upon block verification</span>
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message.text}</span>
              </div>
            )}

            <div className="flex space-x-2">
              <input
                type="number"
                step="any"
                value={simulatedAmount}
                onChange={(e) => setSimulatedAmount(e.target.value)}
                placeholder="Enter deposit amount"
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all shrink-0"
              >
                {loading ? 'Confirming...' : 'I Have Transferred'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <BuyCryptoModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        defaultAsset={selectedAsset}
      />
    </div>
  );
};
