import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NetbybitLogo } from './NetbybitLogo';
import {
  Shield,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  QrCode,
  Repeat,
  History,
  LifeBuoy,
  Settings,
  User as UserIcon,
  LogOut,
  Bell,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';

interface NavbarProps {
  onOpenConnectWallet: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenConnectWallet }) => {
  const { user, activePage, setActivePage, logout, unreadCount, notifications } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', public: true },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, public: false },
    { id: 'deposit', label: 'Deposit', icon: ArrowDownLeft, public: false },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight, public: false },
    { id: 'send', label: 'Send', icon: Send, public: false },
    { id: 'receive', label: 'Receive', icon: QrCode, public: false },
    { id: 'swap', label: 'Swap', icon: Repeat, public: false },
    { id: 'history', label: 'History', icon: History, public: false },
    { id: 'support', label: 'Support', icon: LifeBuoy, public: true },
    { id: 'settings', label: 'Settings', icon: Settings, public: false },
  ];

  const handleNavClick = (pageId: string) => {
    setActivePage(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-neutral-950/85 backdrop-blur-xl border-b border-amber-500/20 text-neutral-100 shadow-2xl">
      {/* Top mini-bar displaying status & quick admin toggle */}
      <div className="bg-neutral-950/90 border-b border-neutral-800/80 px-4 py-1.5 text-xs text-neutral-400 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-emerald-400 font-semibold text-[11px]">NETBYBIT VAULT ACTIVE</span>
          <span className="hidden sm:inline text-neutral-700">|</span>
          <span className="hidden sm:inline text-neutral-400 text-[11px]">Institutional Multi-Network Cold Storage</span>
        </div>
        {user?.role === 'admin' && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleNavClick('admin')}
              className="flex items-center space-x-1.5 text-amber-300 hover:text-amber-200 font-bold text-xs bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1 rounded-full border border-amber-500/40 transition-all shadow-sm"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Dashboard</span>
            </button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="cursor-pointer" onClick={() => handleNavClick('home')}>
            <NetbybitLogo size="md" />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              if (!item.public && !user) return null;
              const isActive = activePage === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10'
                      : 'text-neutral-300 hover:text-amber-300 hover:bg-neutral-900/80 border border-transparent'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 opacity-80" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
            {user?.role === 'admin' && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activePage === 'admin'
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-400'
                    : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            {user ? (
              <>
                {/* Connect Wallet Button */}
                <button
                  onClick={onOpenConnectWallet}
                  className="flex items-center space-x-2 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 hover:from-neutral-800 hover:to-neutral-850 text-amber-300 border border-amber-500/30 transition-all shadow-md hover:border-amber-400"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>{user.connectedWallet ? 'Wallet Connected' : 'Connect Web3'}</span>
                </button>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-amber-400 hover:border-amber-500/30 transition-all relative"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-black text-[10px] flex items-center justify-center animate-pulse shadow-md">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-neutral-950/95 backdrop-blur-2xl border border-amber-500/30 rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn">
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-neutral-800">
                        <span className="text-xs font-bold text-amber-400">Account Notifications</span>
                        <span className="text-[10px] text-neutral-400 font-mono">{notifications.length} Total</span>
                      </div>
                      {notifications.length === 0 ? (
                        <p className="text-xs text-neutral-500 py-4 text-center">No new notifications</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {notifications.map((n) => (
                            <div key={n.id} className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs hover:border-amber-500/30 transition-colors">
                              <p className="font-bold text-amber-300">{n.title}</p>
                              <p className="text-neutral-300 mt-1 text-[11px] leading-relaxed">{n.message}</p>
                              <span className="text-[9px] text-neutral-500 block mt-1.5 font-mono">
                                {new Date(n.createdAt).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2.5 p-1.5 pl-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-amber-500/30 transition-all shadow-sm"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-600 to-yellow-400 text-neutral-950 flex items-center justify-center font-black text-xs uppercase shadow-sm">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-neutral-200 max-w-[100px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-neutral-950/95 backdrop-blur-2xl border border-amber-500/30 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn">
                      <div className="px-3 py-2.5 border-b border-neutral-800">
                        <p className="text-xs font-extrabold text-amber-300">{user.name}</p>
                        <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1.5 text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase font-mono">
                          Role: {user.role}
                        </span>
                      </div>
                      <div className="py-1.5 space-y-0.5">
                        <button
                          onClick={() => {
                            handleNavClick('profile');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-900 hover:text-amber-300 rounded-xl flex items-center space-x-2 transition-colors font-medium"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>My Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            handleNavClick('settings');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-900 hover:text-amber-300 rounded-xl flex items-center space-x-2 transition-colors font-medium"
                        >
                          <Settings className="w-3.5 h-3.5 text-amber-400" />
                          <span>Account Settings</span>
                        </button>
                      </div>
                      <div className="border-t border-neutral-800 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl flex items-center space-x-2 font-bold transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5 text-red-400" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleNavClick('login')}
                  className="px-4 py-2 text-xs font-bold text-neutral-200 hover:text-amber-400 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavClick('register')}
                  className="px-4.5 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex sm:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-neutral-950/95 border-b border-amber-500/20 px-4 pt-2 pb-4 space-y-2">
          {navItems.map((item) => {
            if (!item.public && !user) return null;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                  activePage === item.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-neutral-300 hover:bg-neutral-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          {user ? (
            <div className="border-t border-neutral-800 pt-3 space-y-2">
              <button
                onClick={onOpenConnectWallet}
                className="w-full text-center py-2 text-xs font-bold rounded-xl bg-neutral-900 text-amber-400 border border-amber-500/30"
              >
                {user.connectedWallet ? 'Wallet Connected' : 'Connect Web3'}
              </button>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-400 font-bold flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="border-t border-neutral-800 pt-3 flex space-x-2">
              <button
                onClick={() => handleNavClick('login')}
                className="flex-1 py-2 text-xs font-bold bg-neutral-900 text-neutral-200 rounded-xl text-center"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNavClick('register')}
                className="flex-1 py-2 text-xs font-extrabold bg-amber-500 text-neutral-950 rounded-xl text-center"
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

