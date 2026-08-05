import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getAuthToken, removeAuthToken, setAuthToken } from '../lib/api';
import { CryptoPrice, DepositAddresses, Notification, User } from '../types';
import { fetchLiveFiatRates, formatFiatValue, convertUsdToFiat, SUPPORTED_FIAT_CURRENCIES } from '../lib/currencies';

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
  // Currency Switcher & Value Conversion
  selectedCurrency: string;
  setSelectedCurrency: (curr: string) => Promise<void>;
  fiatRates: Record<string, number>;
  hideBalances: boolean;
  setHideBalances: React.Dispatch<React.SetStateAction<boolean>>;
  formatFiat: (usdAmount: number) => { formatted: string; amount: number; symbol: string; code: string };
  // Auth Operations
  login: (email: string, pass: string) => Promise<{ requires2FA?: boolean; tempToken?: string; user?: User }>;
  verify2FA: (tempToken: string, code: string) => Promise<User>;
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
  SOL: '7XwK3nJ5pM4q2yZ8vW9R1t6Y3u0I2o8P4s5D6f7G8h9J',
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
  const [activePage, setActivePageState] = useState<string>(() => {
    return localStorage.getItem('netbybit_active_page') || 'home';
  });

  const setActivePage = (page: string) => {
    setActivePageState(page);
    localStorage.setItem('netbybit_active_page', page);
  };

  // Fiat & Privacy State
  const [selectedCurrency, setSelectedCurrencyState] = useState<string>(() => {
    return localStorage.getItem('netbybit_preferred_currency') || 'USD';
  });
  const [fiatRates, setFiatRates] = useState<Record<string, number>>({});
  const [hideBalances, setHideBalances] = useState<boolean>(() => {
    return localStorage.getItem('netbybit_hide_balances') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('netbybit_hide_balances', String(hideBalances));
  }, [hideBalances]);

  // Load Fiat Exchange Rates
  const refreshFiatRates = async () => {
    const rates = await fetchLiveFiatRates();
    setFiatRates(rates);
  };

  const refreshPrices = async () => {
    setPricesLoading(true);
    try {
      const data = await api.getPrices();
      setPrices(data);
    } catch (err) {
      console.error('Failed to load crypto prices', err);
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
      if (u.preferredCurrency) {
        setSelectedCurrencyState(u.preferredCurrency);
        localStorage.setItem('netbybit_preferred_currency', u.preferredCurrency);
      }
      const savedPage = localStorage.getItem('netbybit_active_page');
      if (!savedPage || savedPage === 'login' || savedPage === 'register') {
        const targetPage = u.role === 'admin' ? 'admin' : 'dashboard';
        setActivePage(targetPage);
      }
    } catch (err) {
      console.error('Session expired or invalid token', err);
      removeAuthToken();
      setUser(null);
      setActivePage('home');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPrices();
    refreshFiatRates();
    refreshDepositAddresses();
    refreshUser();

    // Poll live prices every 15s
    const priceInterval = setInterval(refreshPrices, 15000);
    // Refresh fiat rates every 5 mins
    const fiatInterval = setInterval(refreshFiatRates, 300000);
    return () => {
      clearInterval(priceInterval);
      clearInterval(fiatInterval);
    };
  }, []);

  useEffect(() => {
    if (user) {
      refreshNotifications();
      if (user.preferredCurrency && user.preferredCurrency !== selectedCurrency) {
        setSelectedCurrencyState(user.preferredCurrency);
        localStorage.setItem('netbybit_preferred_currency', user.preferredCurrency);
      }
    }
  }, [user]);

  const setSelectedCurrency = async (curr: string) => {
    const cleanCurr = curr.toUpperCase();
    setSelectedCurrencyState(cleanCurr);
    localStorage.setItem('netbybit_preferred_currency', cleanCurr);

    if (user) {
      try {
        const updatedUser = await api.updateProfile({ preferredCurrency: cleanCurr });
        setUser(updatedUser);
      } catch (e) {
        console.error('Failed to persist currency to backend', e);
      }
    }
  };

  const formatFiat = (usdAmount: number) => {
    return formatFiatValue(usdAmount, selectedCurrency, fiatRates);
  };

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    if (res.requires2FA && res.tempToken) {
      return { requires2FA: true, tempToken: res.tempToken };
    }
    if (res.token && res.user) {
      setAuthToken(res.token);
      setUser(res.user);
      if (res.user.preferredCurrency) {
        setSelectedCurrencyState(res.user.preferredCurrency);
        localStorage.setItem('netbybit_preferred_currency', res.user.preferredCurrency);
      }
      if (res.user.role === 'admin') {
        setActivePage('admin');
      } else {
        setActivePage('dashboard');
      }
      return { user: res.user };
    }
    throw new Error('Invalid login response');
  };

  const verify2FA = async (tempToken: string, code: string) => {
    const res = await api.verify2FA({ tempToken, code });
    setAuthToken(res.token);
    setUser(res.user);
    if (res.user.preferredCurrency) {
      setSelectedCurrencyState(res.user.preferredCurrency);
      localStorage.setItem('netbybit_preferred_currency', res.user.preferredCurrency);
    }
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
        selectedCurrency,
        setSelectedCurrency,
        fiatRates,
        hideBalances,
        setHideBalances,
        formatFiat,
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
