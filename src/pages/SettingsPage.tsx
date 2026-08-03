import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Settings, Shield, Key, Bell, Trash2, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout, calculateTotalUsdBalance } = useAuth();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!user) return null;

  const totalUsdBalance = calculateTotalUsdBalance();
  const rawBalances = user.balances || {};
  const activeBalancesList = Object.entries(rawBalances)
    .filter(([_, amt]: [string, any]) => (Number(amt) || 0) > 0)
    .map(([asset, amt]) => `${amt} ${asset}`);

  const hasBalance = activeBalancesList.length > 0 || totalUsdBalance > 0.01;

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await api.deleteAccount();
      logout();
      window.location.reload();
    } catch (err: any) {
      setDeleteError(err.message || 'Account deletion failed');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex items-center space-x-3 border-b border-neutral-800 pb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
          <Settings className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-100">Security & Preferences</h1>
          <p className="text-xs text-neutral-400">NETBYBIT Custody Platform Configuration</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <Shield className="w-4 h-4" />
            <span>Two-Factor Authentication (2FA)</span>
          </div>
          <p className="text-xs text-neutral-400">
            Enforce hardware key or TOTP authenticator app verification on all withdrawals and security changes.
          </p>
          <span className="inline-block text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded font-bold">
            Status: Active & Protected
          </span>
        </div>

        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <Bell className="w-4 h-4" />
            <span>Email Notification Dispatch</span>
          </div>
          <p className="text-xs text-neutral-400">
            Automatic email dispatch to registered user address ({user.email}) whenever account balances are credited by administrators or transaction receipts are generated.
          </p>
          <span className="inline-block text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded font-bold">
            Status: Email Dispatch Enabled
          </span>
        </div>

        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <Key className="w-4 h-4" />
            <span>Platform Metadata</span>
          </div>
          <div className="text-xs text-neutral-400 space-y-1 font-mono">
            <p>Custody Domain: https://netbybit.web.app</p>
            <p>Account Type: {user.role.toUpperCase()} TRADER</p>
            <p>System Encryption: AES-256 + JWT Bearer Validation</p>
          </div>
        </div>

        {/* Account Deletion & Danger Zone */}
        <div className="p-6 bg-neutral-900/90 border border-red-500/30 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
            <Trash2 className="w-4 h-4" />
            <span>Danger Zone: Account Termination</span>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Permanently delete your NETBYBIT account and all associated profile details. In accordance with custody rules, account deletion is strictly blocked if your wallet contains any active cryptocurrency balances.
          </p>

          {hasBalance ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-xs">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Account Deletion Blocked (Active Wallet Balance Detected)</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                Your wallet currently holds an active balance ({activeBalancesList.join(', ') || `$${totalUsdBalance.toFixed(2)} USD`}). You must withdraw or transfer all remaining cryptocurrency funds to zero before account deletion can be authorized.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Zero Wallet Balance Verified — Account Deletion Eligible</span>
              </div>

              {deleteError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              {!showConfirmDelete ? (
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-bold text-xs transition-all flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Request Account Deletion</span>
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 space-y-3">
                  <p className="text-xs text-red-200 font-bold">
                    Are you absolutely sure you want to permanently delete your account? This action cannot be undone.
                  </p>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-lg"
                    >
                      {isDeleting ? 'Deleting Account...' : 'Yes, Delete My Account Now'}
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-bold text-xs hover:bg-neutral-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
