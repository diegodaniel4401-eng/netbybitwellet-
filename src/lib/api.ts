import {
  CryptoPrice,
  DepositAddresses,
  Notification,
  SupportTicket,
  Transaction,
  User,
  AdminStats,
  SupportedAsset,
  AuditLogEntry,
  EmailNotificationPreview,
  EmailLogRecord,
} from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('netbybit_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('netbybit_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('netbybit_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'An unexpected error occurred');
  }
  return data as T;
}

export const api = {
  // Public
  getPrices: () => request<CryptoPrice[]>('/prices'),
  getDepositAddresses: () => request<DepositAddresses>('/deposit-addresses'),

  // Auth
  register: (body: { email: string; password: string; name: string; username?: string }) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  forgotPassword: (body: { email: string }) =>
    request<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  resetPassword: (body: { email: string; code?: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMe: () => request<User>('/auth/me'),

  // User features
  updateProfile: (body: { name?: string; username?: string; avatar?: string }) =>
    request<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  updateWithdrawalAddresses: (withdrawalAddresses: Record<SupportedAsset, string>) =>
    request<User>('/user/withdrawal-addresses', {
      method: 'PUT',
      body: JSON.stringify({ withdrawalAddresses }),
    }),

  deleteAccount: () =>
    request<{ success: boolean; message: string }>('/user/delete-account', {
      method: 'DELETE',
    }),

  connectWallet: (body: { address: string; network?: string; provider?: string }) =>
    request<{ success: boolean; wallet: any }>('/user/connect-wallet', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getTransactions: () => request<Transaction[]>('/user/transactions'),

  createTransaction: (body: {
    type: 'deposit' | 'withdraw' | 'send' | 'receive' | 'swap';
    asset: SupportedAsset;
    amount: number;
    usdtEquivalent?: number;
    destinationAddress?: string;
    fromAsset?: SupportedAsset;
    toAsset?: SupportedAsset;
  }) =>
    request<{ success: boolean; transaction: Transaction; balances: Record<SupportedAsset, number> }>(
      '/user/transactions',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    ),

  getNotifications: () => request<Notification[]>('/user/notifications'),

  getSupportTickets: () => request<SupportTicket[]>('/support/tickets'),

  createSupportTicket: async (body: { subject: string; category?: string; priority?: string; message: string }) => {
    const res = await request<{ success: boolean; ticket: SupportTicket; message: string }>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return res.ticket;
  },

  // Admin features
  getAdminStats: () => request<AdminStats>('/admin/stats'),

  updateDepositAddresses: (depositAddresses: DepositAddresses) =>
    request<{ success: boolean; depositAddresses: DepositAddresses; message: string }>(
      '/admin/deposit-addresses',
      {
        method: 'POST',
        body: JSON.stringify({ depositAddresses }),
      }
    ),

  getAdminUsers: () => request<User[]>('/admin/users'),

  getAdminTransactions: () => request<Transaction[]>('/admin/transactions'),

  getAdminSupportTickets: () => request<SupportTicket[]>('/admin/tickets'),
  getAdminTickets: () => request<SupportTicket[]>('/admin/tickets'),
  getAuditLogs: () => request<AuditLogEntry[]>('/admin/audit-logs'),

  creditUserBalance: (body: { email: string; asset: SupportedAsset; amount: number }) =>
    request<{
      success: boolean;
      user: User;
      auditEntry: AuditLogEntry;
      emailNotification: EmailNotificationPreview;
      message: string;
    }>('/admin/adjust-user-balance', {
      method: 'POST',
      body: JSON.stringify({ ...body, action: 'add' }),
    }),

  adjustUserBalance: (body: {
    email: string;
    asset: SupportedAsset;
    action: 'add' | 'deduct';
    amount: number;
    reason?: string;
  }) =>
    request<{
      success: boolean;
      user: User;
      auditEntry: AuditLogEntry;
      emailNotification: EmailNotificationPreview;
      message: string;
    }>('/admin/adjust-user-balance', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateUserBalance: async (userId: string, asset: SupportedAsset, amount: number, action: 'add' | 'subtract') => {
    const res = await request<{ success: boolean; user: User; message: string }>(`/admin/users/${userId}/balance`, {
      method: 'PUT',
      body: JSON.stringify({ asset, amount, action }),
    });
    return res.user;
  },

  adminUpdateUserWithdrawalAddress: async (userId: string, asset: SupportedAsset, address: string) => {
    const res = await request<{ success: boolean; user: User; message: string }>(`/admin/users/${userId}/withdrawal-address`, {
      method: 'PUT',
      body: JSON.stringify({ asset, address }),
    });
    return res.user;
  },

  updateTransactionStatus: (txId: string, status: 'completed' | 'pending' | 'failed') =>
    request<{
      success: boolean;
      transaction: Transaction;
      auditEntry?: AuditLogEntry;
      emailNotification?: EmailNotificationPreview;
      message?: string;
    }>(`/admin/transactions/${txId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  replySupportTicket: async (ticketId: string, message: string) => {
    const res = await request<{ success: boolean; ticket: SupportTicket }>(`/support/tickets/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return res.ticket;
  },

  updateTicketStatus: (ticketId: string, status: 'Open' | 'In Progress' | 'Closed') =>
    request<{ success: boolean; ticket: SupportTicket }>(`/admin/tickets/${ticketId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getEmailLogs: () => request<EmailLogRecord[]>('/admin/email-logs'),

  deleteTicket: (ticketId: string) =>
    request<{ success: boolean; message: string }>(`/admin/tickets/${ticketId}`, {
      method: 'DELETE',
    }),
};
