import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  Settings,
  Shield,
  Key,
  Bell,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Smartphone,
  Lock,
  RefreshCw,
  X,
  ShieldCheck,
  QrCode,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, calculateTotalUsdBalance } = useAuth();

  // 2FA state
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);
  const [loading2FA, setLoading2FA] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Disable 2FA state
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState<string | null>(null);

  if (!user) return null;

  const totalUsdBalance = calculateTotalUsdBalance();
  const is2FAEnabled = !!user.twoFactorEnabled;

  // Step 1: Start 2FA Setup (Fetch QR Code URI & Secret)
  const handleStart2FASetup = async () => {
    setLoading2FA(true);
    setSetupError(null);
    setSetupSuccess(null);
    try {
      const data = await api.setup2FA();
      setSetupData(data);
      setIsSettingUp2FA(true);
    } catch (err: any) {
      setSetupError(err.message || 'Failed to initialize 2FA setup');
    } finally {
      setLoading2FA(false);
    }
  };

  // Step 2: Confirm 2FA Setup with 6-digit code
  const handleConfirm2FAEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);
    setSetupSuccess(null);

    const cleanCode = verificationCode.trim().replace(/\s+/g, '');
    if (!cleanCode || cleanCode.length !== 6) {
      setSetupError('Please enter a valid 6-digit code from your authenticator app.');
      return;
    }

    setLoading2FA(true);
    try {
      const res = await api.enable2FA(cleanCode);
      setSetupSuccess(res.message || 'Two-Factor Authentication enabled successfully!');
      await refreshUser();
      setTimeout(() => {
        setIsSettingUp2FA(false);
        setSetupData(null);
        setVerificationCode('');
      }, 1500);
    } catch (err: any) {
      setSetupError(err.message || 'Invalid 2FA code. Please try again.');
    } finally {
      setLoading2FA(false);
    }
  };

  // Disable 2FA
  const handleConfirm2FADisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableError(null);

    const cleanCode = disableCode.trim().replace(/\s+/g, '');
    if (!cleanCode) {
      setDisableError('Please enter your current 6-digit 2FA code.');
      return;
    }

    setLoading2FA(true);
    try {
      await api.disable2FA(cleanCode);
      await refreshUser();
      setShowDisableModal(false);
      setDisableCode('');
      setIsSettingUp2FA(false);
    } catch (err: any) {
      setDisableError(err.message || 'Failed to disable 2FA');
    } finally {
      setLoading2FA(false);
    }
  };

  // Copy secret key
  const handleCopySecretKey = () => {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex items-center space-x-3 border-b border-neutral-800 pb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
          <Settings className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-100">Security & Preferences</h1>
          <p className="text-xs text-neutral-400">NETBYBIT Custody Platform Security & Settings</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* TWO-FACTOR AUTHENTICATION CARD */}
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl border ${is2FAEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
                  <span>Two-Factor Authentication (2FA TOTP)</span>
                  {is2FAEnabled ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="text-[10px] bg-neutral-800 text-neutral-400 border border-neutral-700 px-2 py-0.5 rounded-full font-bold">
                      DISABLED
                    </span>
                  )}
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Secure your account using Google Authenticator, Authy, or 1Password TOTP.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => {
                if (is2FAEnabled) {
                  setShowDisableModal(true);
                } else if (!isSettingUp2FA) {
                  handleStart2FASetup();
                } else {
                  setIsSettingUp2FA(false);
                }
              }}
              disabled={loading2FA}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                is2FAEnabled ? 'bg-emerald-500' : isSettingUp2FA ? 'bg-amber-500' : 'bg-neutral-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-950 shadow ring-0 transition duration-200 ease-in-out ${
                  is2FAEnabled || isSettingUp2FA ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* ACTIVE 2FA STATUS DISPLAY */}
          {is2FAEnabled && !showDisableModal && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>2FA TOTP Protection Active</span>
                </div>
                <button
                  onClick={() => setShowDisableModal(true)}
                  className="text-[11px] text-red-400 hover:text-red-300 underline font-semibold"
                >
                  Disable 2FA
                </button>
              </div>
              <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                Your account logins and withdrawals require a 6-digit TOTP code generated by your authenticator app.
              </p>
            </div>
          )}

          {/* 2FA SETUP WIZARD (QR CODE & SECRET KEY) */}
          {!is2FAEnabled && isSettingUp2FA && setupData && (
            <div className="pt-4 border-t border-neutral-800 space-y-6">
              {setupSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{setupSuccess}</span>
                </div>
              )}

              {setupError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{setupError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                  <QrCode className="w-4 h-4" />
                  <span>Step 1: Scan QR Code with Authenticator App</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                  {/* QR CODE DISPLAY */}
                  <div className="p-3 bg-white rounded-xl shadow-lg border border-neutral-200 shrink-0">
                    <QRCodeSVG
                      value={setupData.otpauthUrl}
                      size={160}
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  <div className="space-y-3 text-xs text-neutral-300">
                    <p className="leading-relaxed">
                      1. Open <strong>Google Authenticator</strong>, <strong>Authy</strong>, or <strong>1Password</strong> on your phone.
                    </p>
                    <p className="leading-relaxed">
                      2. Choose <strong>"Scan a QR Code"</strong> and frame the barcode.
                    </p>
                    <div className="pt-1">
                      <p className="text-[11px] text-neutral-400 mb-1 font-semibold">Or enter Secret Key manually:</p>
                      <div className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-lg font-mono text-amber-400 font-bold text-xs select-all">
                        <span className="truncate">{setupData.secret}</span>
                        <button
                          type="button"
                          onClick={handleCopySecretKey}
                          className="p-1 text-neutral-400 hover:text-amber-400 transition-colors"
                          title="Copy Secret Key"
                        >
                          {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {copiedKey && <span className="text-[10px] text-emerald-400 font-bold mt-1 block">Secret Key Copied!</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2: VERIFY CODE */}
              <form onSubmit={handleConfirm2FAEnable} className="space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                  <Smartphone className="w-4 h-4" />
                  <span>Step 2: Enter 6-Digit Code from Authenticator</span>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] font-mono text-amber-400 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading2FA || verificationCode.length !== 6}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-bold text-xs hover:from-amber-400 hover:to-yellow-300 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {loading2FA ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Enable 2FA</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSettingUp2FA(false)}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-semibold text-xs hover:bg-neutral-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SETUP PROMPT BUTTON WHEN 2FA IS OFF AND NOT SETTING UP */}
          {!is2FAEnabled && !isSettingUp2FA && (
            <div className="pt-2 flex items-center justify-between border-t border-neutral-800/80">
              <span className="text-xs text-neutral-400">
                Enhance your account protection against unauthorized logins.
              </span>
              <button
                type="button"
                onClick={handleStart2FASetup}
                disabled={loading2FA}
                className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-xs hover:bg-amber-500/20 transition-all flex items-center space-x-2"
              >
                {loading2FA ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Set Up 2FA Authenticator</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* DISABLE 2FA MODAL */}
        {showDisableModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Disable Two-Factor Authentication</span>
                </div>
                <button
                  onClick={() => setShowDisableModal(false)}
                  className="text-neutral-500 hover:text-neutral-300 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Enter the current 6-digit TOTP code from your authenticator app to confirm turning off 2FA protection.
              </p>

              {disableError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{disableError}</span>
                </div>
              )}

              <form onSubmit={handleConfirm2FADisable} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">6-Digit 2FA Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-center font-mono text-amber-400 text-lg tracking-[0.4em] focus:outline-none focus:border-red-500/50"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading2FA || disableCode.length !== 6}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors disabled:opacity-50"
                  >
                    {loading2FA ? 'Disabling...' : 'Confirm Disable 2FA'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisableModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-semibold text-xs hover:bg-neutral-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EMAIL NOTIFICATION CARD */}
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

        {/* PLATFORM METADATA */}
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <Key className="w-4 h-4" />
            <span>Platform Metadata</span>
          </div>
          <div className="text-xs text-neutral-400 space-y-1 font-mono">
            <p>Custody Domain: https://netbybit.web.app</p>
            <p>Account Type: {user.role.toUpperCase()} TRADER</p>
            <p>System Encryption: AES-256 + TOTP RFC 6238 + JWT Bearer Validation</p>
          </div>
        </div>

        {/* Account & Login Preservation */}
        <div className="p-6 bg-neutral-900/90 border border-emerald-500/30 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <Shield className="w-4 h-4" />
            <span>Account & Login Permanent Preservation</span>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            All user accounts, login histories, and transaction records are permanently saved and protected on the NETBYBIT platform. Account deletion is strictly disabled to maintain complete security and audit trail integrity for all registered users.
          </p>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1">
            <div className="flex items-center space-x-2 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Permanent Account Protection Active</span>
            </div>
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              Your login credentials, account balances, and security activity are permanently saved. No user account can be deleted or removed from system databases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
