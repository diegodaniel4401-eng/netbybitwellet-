import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { X, Wallet, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [walletAddress, setWalletAddress] = useState(user?.connectedWallet?.address || '');
  const [network, setNetwork] = useState(user?.connectedWallet?.network || 'Ethereum Mainnet');
  const [provider, setProvider] = useState('MetaMask');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid wallet address or public key' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await api.connectWallet({
        address: walletAddress.trim(),
        network,
        provider,
      });
      await refreshUser();
      setMessage({ type: 'success', text: `Wallet successfully connected to NETBYBIT via ${provider}` });
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to connect wallet' });
    } finally {
      setLoading(false);
    }
  };

  const generateDemoAddress = () => {
    const demo = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setWalletAddress(demo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-400">Connect Web3 Wallet</h3>
              <p className="text-xs text-neutral-400">Synchronize blockchain balance & address</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConnect} className="p-5 space-y-4">
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

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Select Wallet Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {['MetaMask', 'Trust Wallet', 'WalletConnect', 'Coinbase Wallet'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border text-left transition-all ${
                    provider === p
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Network</label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
            >
              <option value="Ethereum Mainnet">Ethereum Mainnet (ERC-20)</option>
              <option value="BNB Smart Chain">BNB Smart Chain (BEP-20)</option>
              <option value="Tron Network">Tron Network (TRC-20)</option>
              <option value="Bitcoin Mainnet">Bitcoin Mainnet</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-neutral-300">Public Wallet Address / Key</label>
              <button
                type="button"
                onClick={generateDemoAddress}
                className="text-[10px] text-amber-400 hover:underline"
              >
                Auto-Fill Sample Address
              </button>
            </div>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="e.g. 0x400773d018e8ad3575458b5e8b11ff..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-200 font-mono focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/80 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              NETBYBIT uses read-only verification to connect to your public key safely. Private keys are never requested or stored.
            </p>
          </div>

          <div className="pt-2 flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect Wallet Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
