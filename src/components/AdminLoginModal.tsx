import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Shield, KeyRound, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const { login, setActivePage } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAutofillDefaultAdmin = () => {
    setEmail('netbybitsupport@gmail.com');
    setPassword('Mmadu51366414$$&&@@');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      setActivePage('admin');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Admin authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-neutral-100">
        <div className="flex justify-between items-center p-5 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-400">NETBYBIT Admin Portal</h3>
              <p className="text-xs text-neutral-400">Restricted Administrator Authentication</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} method="POST" action="#" className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="admin-email" className="block text-xs font-medium text-neutral-300 mb-1">Admin Email</label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="netbybitsupport@gmail.com"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-medium text-neutral-300 mb-1">Admin Password</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
            />
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
              className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center justify-center space-x-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{loading ? 'Authenticating...' : 'Enter Admin Panel'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
