export type SupportedAsset = 'BTC' | 'ETH' | 'BNB' | 'SOL' | 'TRX' | 'USDT_ERC20' | 'USDT_TRC20';

export interface AssetInfo {
  id: SupportedAsset;
  symbol: string;
  name: string;
  network: string;
  decimals: number;
  iconBg: string;
  accentColor: string;
  defaultAddress: string;
}

export const ASSET_METADATA: Record<SupportedAsset, AssetInfo> = {
  BTC: {
    id: 'BTC',
    symbol: 'BTC',
    name: 'Bitcoin',
    network: 'Bitcoin Mainnet',
    decimals: 8,
    iconBg: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    accentColor: '#f7931a',
    defaultAddress: '1Fy9Up78qVeawXCLnAqcnRJrvjiXLJF21d',
  },
  ETH: {
    id: 'ETH',
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'ERC-20 Mainnet',
    decimals: 18,
    iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    accentColor: '#627eea',
    defaultAddress: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
  },
  BNB: {
    id: 'BNB',
    symbol: 'BNB',
    name: 'BNB Smart Chain',
    network: 'BEP-20 (BSC)',
    decimals: 18,
    iconBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    accentColor: '#f3ba2f',
    defaultAddress: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
  },
  SOL: {
    id: 'SOL',
    symbol: 'SOL',
    name: 'Solana',
    network: 'Solana Mainnet',
    decimals: 9,
    iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    accentColor: '#14F195',
    defaultAddress: '7XwK3nJ5pM4q2yZ8vW9R1t6Y3u0I2o8P4s5D6f7G8h9J',
  },
  TRX: {
    id: 'TRX',
    symbol: 'TRX',
    name: 'Tron',
    network: 'TRC-20 Mainnet',
    decimals: 6,
    iconBg: 'bg-red-500/10 text-red-400 border-red-500/30',
    accentColor: '#eb0029',
    defaultAddress: 'TYKh3ktyqwNMUYoo89UrMbdqjV3CUKWQ8M',
  },
  USDT_ERC20: {
    id: 'USDT_ERC20',
    symbol: 'USDT (ERC-20)',
    name: 'Tether USD (ERC-20)',
    network: 'Ethereum (ERC-20)',
    decimals: 6,
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    accentColor: '#26a17b',
    defaultAddress: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
  },
  USDT_TRC20: {
    id: 'USDT_TRC20',
    symbol: 'USDT (TRC-20)',
    name: 'Tether USD (TRC-20)',
    network: 'Tron (TRC-20)',
    decimals: 6,
    iconBg: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    accentColor: '#26a17b',
    defaultAddress: 'TYKh3ktyqwNMUYoo89UrMbdqjV3CUKWQ8M',
  },
};

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar?: string;
  role: 'user' | 'admin';
  balances: Record<SupportedAsset, number>;
  withdrawalAddresses: Record<SupportedAsset, string>;
  status: 'active' | 'suspended';
  createdAt: string;
  connectedWallet?: ConnectedWallet | null;
  preferredCurrency?: string;
  twoFactorEnabled?: boolean;
}

export type DepositAddresses = Record<SupportedAsset, string>;

export type TransactionType = 'deposit' | 'withdraw' | 'send' | 'receive' | 'swap';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  userId: string;
  userEmail?: string;
  type: TransactionType;
  asset: SupportedAsset;
  amount: number;
  usdtEquivalent: number;
  destinationAddress?: string;
  fromAsset?: SupportedAsset;
  toAsset?: SupportedAsset;
  txHash: string;
  status: TransactionStatus;
  date: string;
}

export interface TicketReply {
  id: string;
  sender: 'admin' | 'user';
  senderName: string;
  message: string;
  translatedMessage?: string;
  originalLanguage?: string;
  targetLanguage?: string;
  isTranslated?: boolean;
  createdAt: string;
  status?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  message: string;
  translatedMessage?: string;
  userLanguage?: string;
  status: 'Open' | 'In Progress' | 'Closed';
  createdAt: string;
  replies: TicketReply[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface CryptoPrice {
  id: SupportedAsset;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export interface ConnectedWallet {
  address: string;
  network: string;
  provider: string;
  connectedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalPlatformUsd: number;
  openTickets: number;
  totalTransactions: number;
  activeDepositNetworks: number;
}

export interface AuditLogEntry {
  id: string;
  adminEmail: string;
  userEmail: string;
  userId: string;
  asset: SupportedAsset;
  amount: number;
  newBalance: number;
  date: string;
  action?: string;
  status?: string;
}

export interface EmailNotificationPreview {
  to: string;
  subject: string;
  body: string;
  sentAt: string;
}

export interface EmailLogRecord {
  id: string;
  from: string;
  to: string;
  subject: string;
  category: string;
  body: string;
  html?: string;
  sentAt: string;
  status: 'Sent' | 'Delivered' | 'Failed';
  isAdminAlert?: boolean;
  errorMessage?: string;
  retryCount?: number;
  actionText?: string;
  actionUrl?: string;
  highlightBox?: string;
}

export interface SmsLogRecord {
  id: string;
  to: string;
  message: string;
  category: string;
  provider: string;
  status: 'Delivered' | 'Sent' | 'Failed';
  errorMessage?: string;
  sentAt: string;
}
