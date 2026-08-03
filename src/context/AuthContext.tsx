import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getAuthToken, removeAuthToken, setAuthToken } from '../lib/api';
import { CryptoPrice, DepositAddresses, Notification, User } from '../types';

interface AuthContextType {
  user: User | null;
  depositAddresses: DepositAddresses;
  prices: CryptoPrice[];
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  pricesLoading: boolean;
  activePage: string;
  setActivePage: (page: string) => void;
  login: (email: string, pass: string) => Promise<User>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  register: (email: string, pass: string, name: string, username?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshDepositAddresses: () => Promise<void>;
  refreshPrices: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  calculateTotalUsdBalance: (userBalances?: Record<string, number>) => number;
}

const DEFAULT_DEPOSIT: DepositAddresses = {
  BTC: '1Fy9Up78qVeawXCLnAqcnRJrvjiXLJF21d',
  ETH: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
  BNB: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
  TRX: 'TYKh3ktyqwNMUYoo89UrMbdqjV3CUKWQ8M',
  USDT_ERC20: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
  USDT_TRC20: 'TYKh3ktyqwNMUYoo89UrMbdqjV3CUKWQ8M',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [depositAddresses, setDepositAddresses] = useState<DepositAddresses>(DEFAULT_DEPOSIT);
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [activePage, setActivePage] = useState<string>('home');

  const refreshPrices = async () => {
    setPricesLoading(true);
    try {
      const data = await api.getPrices();
      setPrices(data);
    } catch (err) {
      console.error('Failed to load prices', err);
    } finally {
      setPricesLoading(false);
    }
  };

  const refreshDepositAddresses = async () => {
    try {
      const data = await api.getDepositAddresses();
      if (data && Object.keys(data).length > 0) {
        setDepositAddresses(data);
      }
    } catch (err) {
      console.error('Failed to load deposit addresses', err);
    }
  };

  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await api.getMe();
      setUser(u);
    } catch (err) {
      console.error('Session expired or invalid token', err);
      removeAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPrices();
    refreshDepositAddresses();
    refreshUser();

    // Poll live prices every 15s
    const priceInterval = setInterval(refreshPrices, 15000);
    return () => clearInterval(priceInterval);
  }, []);

  useEffect(() => {
    if (user) {
      refreshNotifications();
    }
  }, [user]);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setAuthToken(res.token);
    setUser(res.user);
    if (res.user.role === 'admin') {
      setActivePage('admin');
    } else {
      setActivePage('dashboard');
    }
    return res.user;
  };

  const forgotPassword = async (email: string) => {
    await api.forgotPassword({ email });
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    await api.resetPassword({ email, code, newPassword });
  };

  const register = async (email: string, pass: string, name: string, username?: string) => {
    const res = await api.register({ email, password: pass, name, username });
    setAuthToken(res.token);
    setUser(res.user);
    setActivePage('dashboard');
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setActivePage('home');
  };

  const calculateTotalUsdBalance = (userBalances?: Record<string, number>): number => {
    const b = userBalances || user?.balances;
    if (!b) return 0;

    let total = 0;
    prices.forEach((p) => {
      const amount = b[p.id] || 0;
      total += amount * p.price;
    });

    return Number(total.toFixed(2));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        depositAddresses,
        prices,
        notifications,
        unreadCount,
        loading,
        pricesLoading,
        activePage,
        setActivePage,
        login,
        forgotPassword,
        resetPassword,
        register,
        logout,
        refreshUser,
        refreshDepositAddresses,
        refreshPrices,
        refreshNotifications,
        calculateTotalUsdBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
