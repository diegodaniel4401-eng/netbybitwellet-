import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { login, setActivePage } = useAuth();

  const [email, setEmail] = useState('netbybitsupport@gmail.com');
  const [password, setPassword] = useState('Mmadu51366414$$&&@@');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanInput = email.trim();
    const cleanPassword = password;

    if (!cleanInput || !cleanPassword) {
      setError('Please enter your Admin Email/Username and Password.');
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login(cleanInput, cleanPassword);
      if (loggedInUser.role !== 'admin') {
        setError('Access Denied: Account is not an authorized Administrator.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid Admin credentials. Please verify master password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setEmail('netbybitsupport@gmail.com');
    setPassword('Mmadu51366414$$&&@@');
    setError(null);
    setLoading(true);
    try {
      await login('netbybitsupport@gmail.com', 'Mmadu51366414$$&&@@');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate Admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl text-neutral-100 space-y-6">
        {/* Admin Portal Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-400 p-0.5 mx-auto shadow-xl shadow-amber-500/20">
            <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
              <Shield className="w-7 h-7 text-amber-400 animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-neutral-100">
            NETBYBIT Admin Portal
          </h2>
          <p className="text-xs text-neutral-400">
            Restricted Security Access Gate for Platform Administrators
          </p>
          <span className="inline-block text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30">
            ADMINISTRATOR SECURITY CONTROL
          </span>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Admin One-Click Authenticate Button */}
        <div className="p-4 bg-neutral-950 border border-amber-500/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Default Master Admin Credentials
            </span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
              READY
            </span>
          </div>
          <div className="text-[11px] font-mono text-neutral-300 space-y-0.5">
            <div><span className="text-neutral-500">Email:</span> netbybitsupport@gmail.com</div>
            <div><span className="text-neutral-500">Pass:</span> Mmadu51366414$$&&@@</div>
          </div>
          <button
            type="button"
            onClick={handleQuickAdminLogin}
            disabled={loading}
            className="w-full mt-2 py-2.5 px-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center space-x-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{loading ? 'Authenticating...' : 'One-Click Admin Login'}</span>
          </button>
        </div>

        {/* Manual Admin Form */}
        <form onSubmit={handleAdminLoginSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-medium text-neutral-300 mb-1">
              Admin Email or Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                id="admin-email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="netbybitsupport@gmail.com"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-medium text-neutral-300 mb-1">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-bold text-xs border border-amber-500/30 transition-all flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating Admin...' : 'Sign In to Admin Panel'}</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </form>

        <div className="pt-4 border-t border-neutral-800 text-center">
          <button
            type="button"
            onClick={() => setActivePage('login')}
            className="text-xs text-neutral-400 hover:text-amber-400 transition-colors font-medium"
          >
            ← Return to User Login Portal
          </button>
        </div>
      </div>
    </div>
  );
};
