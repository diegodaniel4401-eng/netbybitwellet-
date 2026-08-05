import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, KeyRound, ArrowRight, AlertCircle, CheckCircle2, ShieldQuestion, Key, ShieldCheck, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, verify2FA, forgotPassword, resetPassword, setActivePage } = useAuth();
  
  // View modes: 'login' | 'forgot' | 'reset' | '2fa'
  const [view, setView] = useState<'login' | 'forgot' | 'reset' | '2fa'>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 2FA login state
  const [twoFactorTempToken, setTwoFactorTempToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');

  // Reset fields
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanInput = email.trim();
    const cleanPassword = password;

    if (!cleanInput || !cleanPassword) {
      setError('Please enter both your email address (or username) and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(cleanInput, cleanPassword);
      if (res.requires2FA && res.tempToken) {
        setTwoFactorTempToken(res.tempToken);
        setView('2fa');
        setSuccessMsg('Two-Factor Authentication required. Please enter your 6-digit TOTP code.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email/username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanCode = totpCode.trim().replace(/\s+/g, '');
    if (!twoFactorTempToken || !cleanCode || cleanCode.length !== 6) {
      setError('Please enter a valid 6-digit code from your authenticator app.');
      return;
    }

    setLoading(true);
    try {
      await verify2FA(twoFactorTempToken, cleanCode);
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA code. Please check your authenticator app.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccessMsg(`A password reset security link and code have been sent to ${email}.`);
      setView('reset');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch password reset request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !newPassword) {
      setError('Please enter your email and your new password.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, resetCode, newPassword);
      setSuccessMsg('Your password has been successfully updated! You can now sign in.');
      setView('login');
      setPassword(newPassword);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please check your reset code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl text-neutral-100 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 mx-auto shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
              {view === 'login' && <KeyRound className="w-6 h-6 text-amber-400" />}
              {view === '2fa' && <ShieldCheck className="w-6 h-6 text-amber-400" />}
              {view === 'forgot' && <ShieldQuestion className="w-6 h-6 text-amber-400" />}
              {view === 'reset' && <Key className="w-6 h-6 text-amber-400" />}
            </div>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-neutral-100">
            {view === 'login' && 'Sign In to Account'}
            {view === '2fa' && '2FA Security Verification'}
            {view === 'forgot' && 'Reset Password'}
            {view === 'reset' && 'Create New Password'}
          </h2>
          <p className="text-xs text-neutral-400">
            {view === 'login' && 'Enter your registered email and password to log in'}
            {view === '2fa' && 'Enter the 6-digit TOTP code from your authenticator app'}
            {view === 'forgot' && 'Enter your email to receive a secure password reset link'}
            {view === 'reset' && 'Enter the reset code sent to your email and your new password'}
          </p>
          <span className="inline-block text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
            NETBYBIT Official Portal
          </span>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && !error && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {view === 'login' && (
          <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-neutral-300 mb-1">Email Address or Username</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  id="login-email"
                  name="email"
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address or username"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="block text-xs font-medium text-neutral-300">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMsg(null);
                    setView('forgot');
                  }}
                  className="text-xs text-amber-400 hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : 'Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* QUICK DEMO USER LOGIN */}
            <div className="pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={async () => {
                  setEmail('trader@netbybit.com');
                  setPassword('password123');
                  setError(null);
                  setLoading(true);
                  try {
                    await login('trader@netbybit.com', 'password123');
                  } catch (err: any) {
                    setError(err.message || 'Failed to login as Demo Trader.');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full p-2.5 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-amber-500/30 rounded-xl text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-xs">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Demo Trader Quick Sign In</span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">trader@netbybit.com</div>
                </div>
                <span className="text-[10px] text-amber-400 font-semibold group-hover:underline">Click to Login →</span>
              </button>
            </div>

            {/* USER REGISTRATION PROMPT */}
            <div className="pt-3 text-center border-t border-neutral-800 space-y-2">
              <p className="text-xs text-neutral-400">Don't have an account?</p>
              <button
                type="button"
                onClick={() => setActivePage('register')}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold transition-colors border border-neutral-700/50"
              >
                Create New User Account
              </button>
            </div>

            {/* DEDICATED SEPARATE ADMIN PORTAL LINK */}
            <div className="pt-3 border-t border-neutral-800/80 text-center">
              <button
                type="button"
                onClick={() => setActivePage('admin-login')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center justify-center space-x-1.5 mx-auto hover:underline"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>System Administrator? Access Admin Security Portal →</span>
              </button>
            </div>
          </form>
        )}

        {/* 2FA VERIFICATION FORM */}
        {view === '2fa' && (
          <form onSubmit={handle2FAVerifySubmit} noValidate className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-center">
              <ShieldCheck className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-xs font-bold text-amber-300">Two-Factor Authenticator Code</h3>
              <p className="text-[11px] text-neutral-300">
                Open Google Authenticator, Authy, or 1Password and enter your 6-digit code.
              </p>
            </div>

            <div>
              <label htmlFor="totp-code" className="block text-xs font-medium text-neutral-300 mb-1">6-Digit TOTP Code</label>
              <input
                id="totp-code"
                type="text"
                maxLength={6}
                required
                autoFocus
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] font-mono text-amber-400 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Verifying Code...' : 'Verify & Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setTwoFactorTempToken(null);
                  setTotpCode('');
                  setError(null);
                }}
                className="text-neutral-400 hover:text-neutral-200"
              >
                ← Cancel and Return to Login
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Registered Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Sending Reset Link...' : 'Send Password Reset Link'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex justify-between items-center text-xs pt-2">
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-neutral-400 hover:text-neutral-200"
              >
                ← Back to Login
              </button>
              <button
                type="button"
                onClick={() => setView('reset')}
                className="text-amber-400 hover:underline"
              >
                Already have code?
              </button>
            </div>
          </form>
        )}

        {/* RESET PASSWORD FORM */}
        {view === 'reset' && (
          <form onSubmit={handleResetPasswordSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Security Reset Code (Optional)</label>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="Enter 6-digit code from email"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Resetting Password...' : 'Save New Password & Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-xs pt-2">
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-neutral-400 hover:text-neutral-200"
              >
                ← Return to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
