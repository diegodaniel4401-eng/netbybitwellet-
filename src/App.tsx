import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ConnectWalletModal } from './components/ConnectWalletModal';
import { LiveSupportChatWidget } from './components/LiveSupportChatWidget';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DepositPage } from './pages/DepositPage';
import { WithdrawPage } from './pages/WithdrawPage';
import { SendPage } from './pages/SendPage';
import { ReceivePage } from './pages/ReceivePage';
import { SwapPage } from './pages/SwapPage';
import { TransactionHistoryPage } from './pages/TransactionHistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { CustomerSupportPage } from './pages/CustomerSupportPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

const AppContent: React.FC = () => {
  const { user, activePage } = useAuth();
  const [connectWalletOpen, setConnectWalletOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage />;
      case 'login':
        return <LoginPage />;
      case 'admin-login':
        return user?.role === 'admin' ? <AdminPanelPage /> : <AdminLoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'deposit':
        return <DepositPage />;
      case 'withdraw':
        return <WithdrawPage />;
      case 'send':
        return <SendPage />;
      case 'receive':
        return <ReceivePage />;
      case 'swap':
        return <SwapPage />;
      case 'history':
        return <TransactionHistoryPage />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPage />;
      case 'support':
        return <CustomerSupportPage />;
      case 'admin':
        return user?.role === 'admin' ? <AdminPanelPage /> : (user ? <DashboardPage /> : <HomePage />);
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950 relative overflow-x-hidden">
      {/* Background Ambient Cyber Lighting Effects */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none animate-ambient z-0" />
      <div className="fixed bottom-1/3 right-10 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed top-1/2 left-10 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <Navbar
        onOpenConnectWallet={() => setConnectWalletOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 relative z-10">
        {renderPage()}
      </main>

      <Footer />

      <ConnectWalletModal
        isOpen={connectWalletOpen}
        onClose={() => setConnectWalletOpen(false)}
      />

      {/* Global Live Customer Support Chat Widget (Available to all visitors logged in or logged out) */}
      <LiveSupportChatWidget />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
