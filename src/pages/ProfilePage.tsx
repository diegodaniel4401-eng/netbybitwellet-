import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASSET_METADATA, SupportedAsset } from '../types';
import { api } from '../lib/api';
import { User, Shield, KeyRound, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [withdrawalAddresses, setWithdrawalAddresses] = useState<Record<SupportedAsset, string>>(
    user?.withdrawalAddresses || {
      BTC: '',
      ETH: '',
      BNB: '',
      TRX: '',
      USDT_ERC20: '',
      USDT_TRC20: '',
    }
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.updateProfile({ name, username });
      await api.updateWithdrawalAddresses(withdrawalAddresses);
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile details and withdrawal addresses updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Profile update failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <User className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-neutral-100">User Account Profile</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Manage personal credentials, identity, and registered withdrawal addresses
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-gradient-to-r from-neutral-900 to-neutral-950 px-3.5 py-1.5 rounded-xl border border-amber-500/30 shadow-md">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center font-extrabold text-[11px] text-neutral-950 font-mono shadow-sm">
            N
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 font-mono tracking-wide">NETBYBIT</span>
            <span className="text-[10px] text-neutral-400 block font-sans">Official Custody Account</span>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
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

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Registered Email Address</label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full bg-neutral-950/60 border border-neutral-800/80 rounded-xl px-3 py-2.5 text-xs text-neutral-400 font-mono cursor-not-allowed"
            />
            <span className="text-[10px] text-neutral-500 mt-1 block">
              Primary email used for account updates and official security notifications
            </span>
          </div>

          {/* Registered Withdrawal Addresses */}
          <div className="pt-4 border-t border-neutral-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Registered Withdrawal Destination Addresses</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Configure your default destination wallet addresses for rapid withdrawals
              </p>
            </div>

            <div className="space-y-3">
              {Object.values(ASSET_METADATA).map((asset) => (
                <div key={asset.id} className="space-y-1">
                  <label className="block text-[11px] font-mono text-amber-400">
                    {asset.symbol} Destination Address ({asset.network})
                  </label>
                  <input
                    type="text"
                    value={withdrawalAddresses[asset.id] || ''}
                    onChange={(e) =>
                      setWithdrawalAddresses({
                        ...withdrawalAddresses,
                        [asset.id]: e.target.value,
                      })
                    }
                    placeholder={`Enter your ${asset.symbol} address`}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
