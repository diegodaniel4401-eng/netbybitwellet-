import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, User as UserIcon, ArrowRight, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register, setActivePage } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    const cleanName = name.trim();
    const cleanUsername = username.trim();

    if (!cleanEmail || !password || !cleanName) {
      setError('Please fill out all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(cleanEmail, password, cleanName, cleanUsername);
      setActivePage('dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-neutral-100">Create Account</h2>
          <p className="text-xs text-neutral-400">
            Sign up for your secure NETBYBIT cryptocurrency wallet
          </p>
          <span className="inline-block text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
            NETBYBIT Secure Portal
          </span>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-xs font-medium text-neutral-300 mb-1">Full Name *</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                id="reg-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Satoshi Nakamoto"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-username" className="block text-xs font-medium text-neutral-300 mb-1">Username (Optional)</label>
            <input
              id="reg-username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="satoshi_2026"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-xs font-medium text-neutral-300 mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-xs font-medium text-neutral-300 mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                id="reg-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-confirm-password" className="block text-xs font-medium text-neutral-300 mb-1">Confirm Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                id="reg-confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            <span>{loading ? 'Creating Wallet...' : 'Register & Open Wallet'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-neutral-800">
          <p className="text-xs text-neutral-400">
            Already have an account?{' '}
            <button
              onClick={() => setActivePage('login')}
              className="text-amber-400 hover:underline font-semibold"
            >
              Sign In Here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
