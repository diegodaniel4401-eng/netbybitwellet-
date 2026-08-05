import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'netbybit_jwt_secret_key_2026_secure';

// Initialize Firebase Firestore for cloud persistence
let firestoreDb: any = null;
try {
  const firebaseApp = initializeApp(firebaseConfig);
  firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || 'ai-studio-netbybit-876ebbdd-93d6-4799-aae2-351a33e22480');
  console.log('[FIRESTORE] Connected to database:', firebaseConfig.firestoreDatabaseId);
} catch (e) {
  console.error('[FIRESTORE INIT ERROR]:', e);
}


// ----------------------------------------------------
// Standard TOTP (RFC 6238) Implementation for 2FA
// ----------------------------------------------------
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateBase32Secret(length = 16): string {
  let secret = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    secret += BASE32_ALPHABET[randomBytes[i] % 32];
  }
  return secret;
}

function base32ToBuffer(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  const bits: number[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (val === -1) continue;
    for (let b = 4; b >= 0; b--) {
      bits.push((val >> b) & 1);
    }
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bits[i + b];
    }
    bytes.push(byte);
  }
  return Buffer.from(bytes);
}

function generateTOTPCodes(secretBase32: string, timeStep = 30, window = 1): string[] {
  if (!secretBase32) return [];
  try {
    const key = base32ToBuffer(secretBase32);
    const now = Math.floor(Date.now() / 1000);
    const currentStep = Math.floor(now / timeStep);

    const codes: string[] = [];
    for (let w = -window; w <= window; w++) {
      const step = currentStep + w;
      const buffer = Buffer.alloc(8);
      buffer.writeUInt32BE(0, 0);
      buffer.writeUInt32BE(step, 4);

      const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
      const offset = hmac[hmac.length - 1] & 0xf;
      const codeNum =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);

      const code = (codeNum % 1000000).toString().padStart(6, '0');
      codes.push(code);
    }
    return codes;
  } catch (err) {
    console.error('TOTP calculation error:', err);
    return [];
  }
}

function verifyTOTP(token: string, secretBase32: string, window = 1): boolean {
  if (!token || !secretBase32) return false;
  const cleanToken = token.toString().trim().replace(/\s+/g, '');
  if (cleanToken.length !== 6) return false;
  const validCodes = generateTOTPCodes(secretBase32, 30, window);
  return validCodes.includes(cleanToken);
}

// Gemini API Client Lazy Initialization
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    try {
      genAIClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.error('[GEMINI CLIENT INIT ERROR]:', err);
    }
  }
  return genAIClient;
}

// Multilingual Customer Support Real-Time Translation Service
async function translateSupportMessage(
  text: string,
  targetLanguage = 'English'
): Promise<{
  translatedText: string;
  detectedLanguage: string;
  isTranslated: boolean;
}> {
  if (!text || !text.trim()) {
    return { translatedText: text, detectedLanguage: 'English', isTranslated: false };
  }

  const ai = getGeminiClient();
  if (!ai) {
    return { translatedText: text, detectedLanguage: 'English', isTranslated: false };
  }

  try {
    const prompt = `You are a real-time multilingual customer support translation service for NETBYBIT Vault.
Analyze the following message:
"${text.replace(/"/g, '\\"')}"

Perform the following:
1. Detect the primary language of the input message (e.g., "English", "French", "Spanish", "German", "Arabic", "Chinese", "Japanese", "Portuguese", "Russian", "Hindi", "Turkish", "Italian", "Dutch", "Swahili", "Yoruba", "Hausa", "Amharic", "Zulu", etc.).
2. Translate the message accurately into ${targetLanguage}. Keep cryptocurrency terms (e.g. BTC, USDT, ETH, TxHash, Wallet) intact.
3. If the detected language is already ${targetLanguage}, translatedText should match the original input text.

Return strictly valid JSON:
{
  "detectedLanguage": "Name of detected language in English",
  "translatedText": "Translated text in ${targetLanguage}",
  "isTranslated": boolean
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonStr = response.text?.trim();
    if (jsonStr) {
      const parsed = JSON.parse(jsonStr);
      const detectedLanguage = parsed.detectedLanguage || 'English';
      const translatedText = parsed.translatedText || text;
      const isTranslated = Boolean(
        parsed.isTranslated &&
          detectedLanguage.toLowerCase() !== targetLanguage.toLowerCase() &&
          translatedText.trim().toLowerCase() !== text.trim().toLowerCase()
      );
      return {
        translatedText,
        detectedLanguage,
        isTranslated,
      };
    }
  } catch (err) {
    console.error('[GEMINI TRANSLATION ERROR]:', err);
  }

  return { translatedText: text, detectedLanguage: 'English', isTranslated: false };
}

// SMTP Email Transport Configuration
let smtpTransporter: nodemailer.Transporter | null = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  try {
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log(`[SMTP TRANSPORTER] Connected to host ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
  } catch (err) {
    console.error('[SMTP TRANSPORTER] Initialization error:', err);
  }
}

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

// Load Firestore database state on incoming API requests
app.use('/api', async (req, res, next) => {
  try {
    await ensureDbLoadedFromFirestore();
  } catch (e) {
    console.error('Error hydrating DB from Firestore:', e);
  }
  next();
});

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const DB_BACKUP_FILE = path.join(DATA_DIR, 'db_backup.json');
const USERS_PERMANENT_FILE = path.join(DATA_DIR, 'users_permanent_store.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial DB schema
const DEFAULT_DEPOSIT_ADDRESSES = {
  BTC: '1Fy9Up78qVeawXCLnAqcnRJrvjiXLJF21d',
  ETH: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
  BNB: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
  SOL: '7XwK3nJ5pM4q2yZ8vW9R1t6Y3u0I2o8P4s5D6f7G8h9J',
  TRX: 'TYKh3ktyqwNMUYoo89UrMbdqjV3CUKWQ8M',
  USDT_ERC20: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
  USDT_TRC20: 'TYKh3ktyqwNMUYoo89UrMbdqjV3CUKWQ8M',
};

const SENDER_EMAIL = process.env.SENDER_EMAIL || 'netbybitsupport@gmail.com';
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'netbybitsupport@gmail.com';

const DEFAULT_ADMIN_PASSWORD = 'Mmadu51366414$$&&@@';
const DEFAULT_ADMIN_HASH = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10);

interface DBData {
  users: any[];
  depositAddresses: Record<string, string>;
  transactions: any[];
  supportTickets: any[];
  notifications: any[];
  auditLogs: any[];
  emailLogs?: any[];
  smsLogs?: any[];
  authLogs?: any[];
}

function logAuthDiagnostic(
  db: DBData,
  details: {
    event: 'REGISTER_FAILED' | 'REGISTER_SUCCESS' | 'LOGIN_FAILED' | 'LOGIN_SUCCESS' | 'FORGOT_PASSWORD_REQUEST' | 'RESET_PASSWORD_FAILED' | 'RESET_PASSWORD_SUCCESS';
    email: string;
    reason: string;
    ip?: string;
  }
) {
  if (!db.authLogs) {
    db.authLogs = [];
  }
  const logEntry = {
    id: 'authlog_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    event: details.event,
    email: details.email,
    reason: details.reason,
    ip: details.ip || '127.0.0.1',
  };
  db.authLogs.unshift(logEntry);
  if (db.authLogs.length > 1000) {
    db.authLogs = db.authLogs.slice(0, 1000);
  }

  // Also mirror to auditLogs for administrator visibility in audit logs dashboard
  if (!db.auditLogs) {
    db.auditLogs = [];
  }
  db.auditLogs.unshift({
    id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    date: new Date().toISOString(),
    action: `AUTH: ${details.event}`,
    adminEmail: 'SYSTEM_AUTH',
    userEmail: details.email,
    asset: 'SECURITY',
    amount: 0,
    status: details.event.includes('FAILED') ? 'failed' : 'completed',
    details: details.reason,
  });
  if (db.auditLogs.length > 1000) {
    db.auditLogs = db.auditLogs.slice(0, 1000);
  }
}

let cachedDbState: DBData | null = null;

async function syncToFirestore(data: DBData) {
  if (!firestoreDb) return;
  try {
    const docRef = doc(firestoreDb, 'app_data', 'main_db');
    const sanitized = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    console.error('[FIRESTORE SAVE ERROR]:', err);
  }
}

async function ensureDbLoadedFromFirestore() {
  if (!firestoreDb) return;
  try {
    const docRef = doc(firestoreDb, 'app_data', 'main_db');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const fsData = docSnap.data() as DBData;
      if (fsData && Array.isArray(fsData.users)) {
        if (!cachedDbState) {
          cachedDbState = loadDB();
        }
        const userMap = new Map<string, any>();
        (cachedDbState.users || []).forEach((u) => {
          if (u && u.email) userMap.set(u.email.toLowerCase(), u);
        });
        fsData.users.forEach((u) => {
          if (u && u.email) userMap.set(u.email.toLowerCase(), u);
        });
        cachedDbState.users = Array.from(userMap.values());

        if (Array.isArray(fsData.transactions) && fsData.transactions.length > 0) {
          const txMap = new Map<string, any>();
          (cachedDbState.transactions || []).forEach((t) => { if (t && t.id) txMap.set(t.id, t); });
          fsData.transactions.forEach((t) => { if (t && t.id) txMap.set(t.id, t); });
          cachedDbState.transactions = Array.from(txMap.values());
        }

        if (fsData.depositAddresses && Object.keys(fsData.depositAddresses).length > 0) {
          cachedDbState.depositAddresses = { ...cachedDbState.depositAddresses, ...fsData.depositAddresses };
        }

        if (Array.isArray(fsData.supportTickets) && fsData.supportTickets.length > 0) {
          const ticketMap = new Map<string, any>();
          (cachedDbState.supportTickets || []).forEach((st) => { if (st && st.id) ticketMap.set(st.id, st); });
          fsData.supportTickets.forEach((st) => { if (st && st.id) ticketMap.set(st.id, st); });
          cachedDbState.supportTickets = Array.from(ticketMap.values());
        }
      }
    }
  } catch (err) {
    console.error('[FIRESTORE LOAD ERROR]:', err);
  }
}

function saveDB(data: DBData) {
  cachedDbState = data;
  try {
    const tmpDir = path.join('/tmp', 'netbybit_data');
    if (!fs.existsSync(tmpDir)) {
      try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (e) {}
    }
    const json = JSON.stringify(data, null, 2);
    try {
      if (fs.existsSync(DATA_DIR)) {
        fs.writeFileSync(DB_FILE, json);
        fs.writeFileSync(DB_BACKUP_FILE, json);
        if (data.users && Array.isArray(data.users)) {
          fs.writeFileSync(USERS_PERMANENT_FILE, JSON.stringify(data.users, null, 2));
        }
      }
    } catch (e) {
      // Ignore read-only filesystem errors on Vercel
    }
    try {
      fs.writeFileSync(path.join(tmpDir, 'db.json'), json);
    } catch (e) {}
  } catch (err) {
    console.error('Error writing to database files:', err);
  }

  // Trigger background push to Firestore
  syncToFirestore(data).catch((e) => console.error('Firestore background sync error:', e));
}

function loadDB(): DBData {
  if (cachedDbState) {
    return cachedDbState;
  }

  let db: DBData | null = null;
  let dbChanged = false;

  // 1. Read from /tmp if available
  const tmpFile = path.join('/tmp', 'netbybit_data', 'db.json');
  try {
    if (fs.existsSync(tmpFile)) {
      const content = fs.readFileSync(tmpFile, 'utf-8');
      db = JSON.parse(content);
    }
  } catch (e) {}

  // 2. Read primary DB_FILE
  if (!db) {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        db = JSON.parse(content);
      }
    } catch (err) {
      console.error('Error reading db.json:', err);
    }
  }

  // 3. Read DB_BACKUP_FILE if available
  let backupDb: DBData | null = null;
  try {
    if (fs.existsSync(DB_BACKUP_FILE)) {
      const content = fs.readFileSync(DB_BACKUP_FILE, 'utf-8');
      backupDb = JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading db_backup.json:', err);
  }

  // 4. Read USERS_PERMANENT_FILE
  let permanentUsers: any[] = [];
  try {
    if (fs.existsSync(USERS_PERMANENT_FILE)) {
      const content = fs.readFileSync(USERS_PERMANENT_FILE, 'utf-8');
      permanentUsers = JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading users_permanent_store.json:', err);
  }

  if (!db) {
    if (backupDb) {
      db = backupDb;
    } else {
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
    dbChanged = true;
  }

  // Preserve all users across all store copies (reconciliation)
  const userMap = new Map<string, any>();

  if (Array.isArray(permanentUsers)) {
    permanentUsers.forEach((u) => {
      if (u && u.email) {
        userMap.set(u.email.toLowerCase(), u);
      }
    });
  }

  if (backupDb && Array.isArray(backupDb.users)) {
    backupDb.users.forEach((u) => {
      if (u && u.email) {
        const key = u.email.toLowerCase();
        if (!userMap.has(key)) {
          userMap.set(key, u);
        }
      }
    });
  }

  if (db.users && Array.isArray(db.users)) {
    db.users.forEach((u) => {
      if (u && u.email) {
        userMap.set(u.email.toLowerCase(), u);
      }
    });
  }

  const mergedUsers = Array.from(userMap.values());
  if (mergedUsers.length !== db.users.length) {
    db.users = mergedUsers;
    dbChanged = true;
  }

  // Ensure netbybitsupport@gmail.com is the sole administrator account
  let adminUser = db.users.find(
    (u) =>
      u?.email?.toLowerCase() === 'netbybitsupport@gmail.com' ||
      u?.username?.toLowerCase() === 'netbybit_admin' ||
      u?.role === 'admin'
  );

  if (!adminUser) {
    adminUser = {
      id: 'usr_admin_primary',
      email: 'netbybitsupport@gmail.com',
      passwordHash: DEFAULT_ADMIN_HASH,
      name: 'Platform Administrator',
      username: 'netbybit_admin',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      balances: {
        BTC: 1.25,
        ETH: 15.5,
        BNB: 45.0,
        SOL: 85.0,
        TRX: 12500,
        USDT_ERC20: 25000,
        USDT_TRC20: 15000,
      },
      withdrawalAddresses: {
        BTC: '1Fy9Up78qVeawXCLnAqcnRJrvjiXLJF21d',
        ETH: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
        BNB: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
        SOL: '7XwK3nJ5pM4q2yZ8vW9R1t6Y3u0I2o8P4s5D6f7G8h9J',
        TRX: 'TYKh3ktyqwNMUYoo89UrMbdqjV3CUKWQ8M',
        USDT_ERC20: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
        USDT_TRC20: 'TYKh3ktyqwNMUYoo89UrMbdqjV3CUKWQ8M',
      },
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    db.users.push(adminUser);
    dbChanged = true;
  } else {
    if (adminUser.role !== 'admin') {
      adminUser.role = 'admin';
      dbChanged = true;
    }
    if (adminUser.status !== 'active') {
      adminUser.status = 'active';
      dbChanged = true;
    }
    if (adminUser.email.toLowerCase() !== 'netbybitsupport@gmail.com') {
      adminUser.email = 'netbybitsupport@gmail.com';
      dbChanged = true;
    }
    if (!adminUser.username) {
      adminUser.username = 'netbybit_admin';
      dbChanged = true;
    }
    if (!adminUser.passwordHash) {
      adminUser.passwordHash = DEFAULT_ADMIN_HASH;
      dbChanged = true;
    }
  }

  // Ensure default demo trader account exists for quick testing
  let demoUser = db.users.find(
    (u) => u?.email?.toLowerCase() === 'trader@netbybit.com' || u?.username?.toLowerCase() === 'trader'
  );
  if (!demoUser) {
    const demoSalt = bcrypt.genSaltSync(10);
    demoUser = {
      id: 'usr_demo_trader_1',
      email: 'trader@netbybit.com',
      passwordHash: bcrypt.hashSync('password123', demoSalt),
      name: 'Demo Trader',
      username: 'trader',
      role: 'user',
      avatar: '',
      balances: {
        BTC: 0.5,
        ETH: 2.0,
        BNB: 5.0,
        SOL: 10.0,
        TRX: 1000,
        USDT_ERC20: 2500,
        USDT_TRC20: 2500,
      },
      withdrawalAddresses: {
        BTC: '',
        ETH: '',
        BNB: '',
        SOL: '',
        TRX: '',
        USDT_ERC20: '',
        USDT_TRC20: '',
      },
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    db.users.push(demoUser);
    dbChanged = true;
  }

  cachedDbState = db;

  if (dbChanged) {
    saveDB(db);
  }
  return db;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  category: string;
  body: string;
  html?: string;
  actionText?: string;
  actionUrl?: string;
  highlightBox?: string;
  details?: { label: string; value: string }[];
  isAdminAlert?: boolean;
}

function generateHtmlEmail(options: {
  title: string;
  recipientName?: string;
  category: string;
  body: string;
  actionText?: string;
  actionUrl?: string;
  highlightBox?: string;
  details?: { label: string; value: string }[];
}): string {
  const { title, recipientName, category, body, actionText, actionUrl, highlightBox, details } = options;

  const paragraphs = body
    .split('\n\n')
    .map((p) => `<p style="margin-bottom: 16px; line-height: 1.6; color: #d1d5db; font-size: 14px;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  let highlightHtml = '';
  if (highlightBox) {
    highlightHtml = `
      <div style="background-color: #1a1a24; border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af; display: block; margin-bottom: 8px;">SECURITY VERIFICATION / REFERENCE CODE</span>
        <span style="font-family: monospace; font-size: 28px; font-weight: bold; color: #fbbf24; letter-spacing: 4px;">${highlightBox}</span>
      </div>
    `;
  }

  let detailsHtml = '';
  if (details && details.length > 0) {
    const rows = details
      .map(
        (d) => `
        <tr style="border-bottom: 1px solid #27272a;">
          <td style="padding: 10px 14px; font-size: 12px; color: #9ca3af; font-weight: 500;">${d.label}</td>
          <td style="padding: 10px 14px; font-size: 12px; color: #f3f4f6; font-weight: 600; text-align: right; font-family: monospace;">${d.value}</td>
        </tr>
      `
      )
      .join('');

    detailsHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #18181b; border-radius: 8px; overflow: hidden; border: 1px solid #27272a;">
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  let actionBtnHtml = '';
  if (actionText && actionUrl) {
    actionBtnHtml = `
      <div style="text-align: center; margin: 28px 0 16px 0;">
        <a href="${actionUrl}" style="background-color: #f59e0b; color: #000000; font-weight: bold; padding: 14px 28px; text-decoration: none; border-radius: 10px; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
          ${actionText}
        </a>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="background-color: #09090b; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px 10px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #121215; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    
    <!-- Header Banner -->
    <div style="background-color: #0d0d0f; padding: 24px 32px; border-bottom: 1px solid #27272a; text-align: center;">
      <div style="display: inline-flex; align-items: center; justify-content: center;">
        <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">NET<span style="color: #f59e0b;">BYBIT</span></span>
      </div>
      <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #71717a; margin-top: 4px;">Institutional Digital Asset Infrastructure</span>
    </div>

    <!-- Category Header Bar -->
    <div style="background-color: #18181b; padding: 12px 32px; border-bottom: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #f59e0b; background: rgba(245, 158, 11, 0.1); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(245, 158, 11, 0.2);">
        ${category}
      </span>
      <span style="font-size: 11px; color: #71717a;">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
    </div>

    <!-- Body Container -->
    <div style="padding: 32px;">
      <h1 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; line-height: 1.3;">
        ${title}
      </h1>

      ${recipientName ? `<p style="font-size: 14px; font-weight: 600; color: #e5e7eb; margin-bottom: 16px;">Hello ${recipientName},</p>` : ''}

      ${paragraphs}

      ${highlightHtml}

      ${detailsHtml}

      ${actionBtnHtml}

      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #27272a; font-size: 12px; color: #9ca3af; line-height: 1.5;">
        <p style="margin: 0;">If you have any questions or require support regarding your account, please contact customer support at <a href="mailto:netbybitsupport@gmail.com" style="color: #f59e0b; text-decoration: none;">netbybitsupport@gmail.com</a>.</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #09090b; padding: 24px 32px; border-top: 1px solid #27272a; text-align: center; font-size: 11px; color: #6b7280; line-height: 1.6;">
      <p style="margin: 0 0 6px 0; font-weight: 600; color: #9ca3af;">NETBYBIT Digital Asset Management Platform</p>
      <p style="margin: 0 0 10px 0;">Official Site Contact & Admin Inbox: <span style="color: #d1d5db;">netbybitsupport@gmail.com</span></p>
      <p style="margin: 0; font-size: 10px; color: #4b5563;">© 2026 NETBYBIT. All rights reserved. Encrypted SSL 256-bit Security Transport.</p>
    </div>

  </div>
</body>
</html>`;
}

function sendEmailNotification(db: DBData, options: SendEmailOptions) {
  const {
    to,
    subject,
    category,
    body,
    html: customHtml,
    actionText,
    actionUrl,
    highlightBox,
    details,
    isAdminAlert = false,
  } = options;
  const nowISO = new Date().toISOString();
  const recipient = (to || ADMIN_NOTIFICATION_EMAIL).trim();

  const html =
    customHtml ||
    generateHtmlEmail({
      title: subject,
      category,
      body,
      actionText,
      actionUrl,
      highlightBox,
      details,
    });

  let status: 'Delivered' | 'Sent' | 'Failed' = 'Delivered';
  let errorMessage: string | undefined = undefined;

  // Perform async dispatch in background if nodemailer transport is ready
  if (smtpTransporter) {
    smtpTransporter
      .sendMail({
        from: `NETBYBIT Official <${SENDER_EMAIL}>`,
        to: recipient,
        subject,
        text: body,
        html,
      })
      .then((info) => {
        console.log(`[SMTP DISPATCH SUCCESS] MessageId: ${info.messageId} to ${recipient}`);
      })
      .catch((err) => {
        console.error(`[SMTP DISPATCH ERROR] Failed to send email to ${recipient}:`, err?.message || err);
      });
  }

  const emailRecord = {
    id: 'eml_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    from: SENDER_EMAIL,
    to: recipient,
    subject,
    category,
    body,
    html,
    sentAt: nowISO,
    status,
    isAdminAlert,
    errorMessage,
    retryCount: 0,
    actionText,
    actionUrl,
    highlightBox,
  };

  if (!db.emailLogs) {
    db.emailLogs = [];
  }
  db.emailLogs.unshift(emailRecord);

  console.log(`[EMAIL DISPATCH] From: ${SENDER_EMAIL} | To: ${recipient} | Subject: "${subject}" | Category: ${category} | Status: ${status}`);

  return emailRecord;
}

interface SendSmsOptions {
  to: string;
  message: string;
  category: string;
}

async function sendSmsNotification(db: DBData, options: SendSmsOptions) {
  const { to, message, category } = options;
  const nowISO = new Date().toISOString();
  let status: 'Delivered' | 'Sent' | 'Failed' = 'Delivered';
  let provider = 'NETBYBIT Cellular SMS Gateway (Simulated)';
  let errorMsg: string | undefined = undefined;

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioAuthToken && twilioPhone && to && to.startsWith('+')) {
    try {
      provider = 'Twilio Live REST API';
      const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
      const bodyParams = new URLSearchParams();
      bodyParams.append('From', twilioPhone);
      bodyParams.append('To', to);
      bodyParams.append('Body', message);

      const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      if (twilioRes.ok) {
        status = 'Delivered';
        console.log(`[TWILIO SMS SUCCESS] Delivered message to ${to}`);
      } else {
        const errJson: any = await twilioRes.json().catch(() => ({}));
        status = 'Failed';
        errorMsg = errJson.message || `HTTP ${twilioRes.status}`;
        console.error(`[TWILIO SMS ERROR] Failed to send to ${to}:`, errorMsg);
      }
    } catch (err: any) {
      status = 'Failed';
      errorMsg = err.message || String(err);
      console.error(`[TWILIO SMS EXCEPTION]:`, errorMsg);
    }
  } else {
    console.log(`[SMS DISPATCH LOG] (${category}) To: ${to} | Message: "${message}"`);
  }

  const smsRecord = {
    id: 'sms_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    to: to || 'User Phone / Contact',
    message,
    category,
    provider,
    status,
    errorMessage: errorMsg,
    sentAt: nowISO,
  };

  if (!db.smsLogs) {
    db.smsLogs = [];
  }
  db.smsLogs.unshift(smsRecord);
  if (db.smsLogs.length > 1000) {
    db.smsLogs = db.smsLogs.slice(0, 1000);
  }

  return smsRecord;
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
      id: 'SOL',
      symbol: 'SOL',
      name: 'Solana',
      price: jitter(148.50),
      change24h: 4.82,
      high24h: 154.20,
      low24h: 141.00,
      volume24h: 3850120000,
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
  try {
    const { email, password, name, username } = req.body;

    if (!email || !password || !name) {
      const clientEmail = (email || 'unknown').trim().toLowerCase();
      const db = loadDB();
      logAuthDiagnostic(db, {
        event: 'REGISTER_FAILED',
        email: clientEmail,
        reason: 'Missing required registration parameters',
        ip: req.ip,
      });
      saveDB(db);
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = loadDB();

    // Requirement 1 & 2: Validate email uniqueness strictly
    const existingUser = db.users.find(
      (u) => u?.email?.toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      logAuthDiagnostic(db, {
        event: 'REGISTER_FAILED',
        email: normalizedEmail,
        reason: 'Duplicate registration attempt with existing email address',
        ip: req.ip,
      });
      saveDB(db);
      return res.status(400).json({
        error: 'This email is already registered. Please log in or reset your password.',
      });
    }

    // Check username uniqueness if specified
    if (username) {
      const normalizedUsername = username.trim().toLowerCase();
      const existingUsername = db.users.find(
        (u) => u.username && u.username.toLowerCase() === normalizedUsername
      );
      if (existingUsername) {
        logAuthDiagnostic(db, {
          event: 'REGISTER_FAILED',
          email: normalizedEmail,
          reason: `Username '${username}' is already in use by another account`,
          ip: req.ip,
        });
        saveDB(db);
        return res.status(400).json({ error: 'Username is already taken' });
      }
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      email: normalizedEmail,
      passwordHash,
      name: name.trim(),
      username: (username || normalizedEmail.split('@')[0]).trim(),
      role: 'user',
      emailVerified: false,
      verificationCode: verificationCode,
      avatar: '',
      balances: {
        BTC: 0,
        ETH: 0,
        BNB: 0,
        SOL: 0,
        TRX: 0,
        USDT_ERC20: 0,
        USDT_TRC20: 0,
      },
      withdrawalAddresses: {
        BTC: '',
        ETH: '',
        BNB: '',
        SOL: '',
        TRX: '',
        USDT_ERC20: '',
        USDT_TRC20: '',
      },
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    logAuthDiagnostic(db, {
      event: 'REGISTER_SUCCESS',
      email: normalizedEmail,
      reason: `Account successfully created with unique ID ${newUser.id}`,
      ip: req.ip,
    });

    // Dispatch SMS Notification for Registration
    await sendSmsNotification(db, {
      to: newUser.email,
      message: `[NETBYBIT Alert] Welcome ${newUser.name}! Your account (${newUser.email}) has been registered. Verification code: ${verificationCode}`,
      category: 'Registration & Verification',
    });

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
    await syncToFirestore(db);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...safeUser } = newUser;
    res.json({ token, user: safeUser, userWelcomeEmail, adminRegEmail });
  } catch (err: any) {
    console.error('Registration error:', err);
    try {
      const db = loadDB();
      logAuthDiagnostic(db, {
        event: 'REGISTER_FAILED',
        email: req.body?.email || 'unknown',
        reason: `Server exception: ${err?.message || err}`,
        ip: req.ip,
      });
      saveDB(db);
    } catch (e) {}
    res.status(500).json({ error: 'Registration failed due to a server error. Please try again.' });
  }
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const db = loadDB();
      logAuthDiagnostic(db, {
        event: 'LOGIN_FAILED',
        email: (email || 'unknown').trim().toLowerCase(),
        reason: 'Missing email or password in login request',
        ip: req.ip,
      });
      saveDB(db);
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedInput = email.trim().toLowerCase();
    const db = loadDB();

    // Match existing account by email OR username (including admin aliases)
    let user = db.users.find(
      (u) =>
        u?.email?.toLowerCase() === normalizedInput ||
        (u?.username && u.username.toLowerCase() === normalizedInput) ||
        ((normalizedInput === 'admin' || normalizedInput === 'administrator' || normalizedInput === 'netbybit_admin') && u?.role === 'admin')
    );

    if (!user) {
      logAuthDiagnostic(db, {
        event: 'LOGIN_FAILED',
        email: normalizedInput,
        reason: 'User account not found for specified email or username',
        ip: req.ip,
      });
      saveDB(db);
      return res.status(401).json({ error: 'User account not found. Please check your email address/username or create a new account.' });
    }

    if (user.status === 'suspended') {
      logAuthDiagnostic(db, {
        event: 'LOGIN_FAILED',
        email: user.email,
        reason: 'Account is suspended by administrator',
        ip: req.ip,
      });
      saveDB(db);
      return res.status(403).json({ error: 'Account has been suspended by administration. Please contact customer support.' });
    }

    let isMatch = false;
    try {
      if (user.passwordHash) {
        isMatch = bcrypt.compareSync(password, user.passwordHash);
      }
    } catch (e) {
      isMatch = false;
    }

    if (!isMatch) {
      logAuthDiagnostic(db, {
        event: 'LOGIN_FAILED',
        email: user.email,
        reason: 'Incorrect password entered',
        ip: req.ip,
      });
      saveDB(db);
      return res.status(401).json({ error: 'Incorrect password. Please verify your password or use "Forgot Password" to reset it.' });
    }

    logAuthDiagnostic(db, {
      event: 'LOGIN_SUCCESS',
      email: user.email,
      reason: `Successful authentication for user ID ${user.id}`,
      ip: req.ip,
    });

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

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const tempToken = jwt.sign(
        { id: user.id, email: user.email, purpose: '2fa_login' },
        JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({
        requires2FA: true,
        tempToken,
        email: user.email,
        message: 'Two-Factor Authentication required. Please enter your 6-digit code from your authenticator app.',
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, twoFactorSecret: __, pendingTwoFactorSecret: ___, ...safeUser } = user;
    res.json({ token, user: safeUser, loginAlertEmail });
  } catch (err: any) {
    console.error('Login error:', err);
    try {
      const db = loadDB();
      logAuthDiagnostic(db, {
        event: 'LOGIN_FAILED',
        email: req.body?.email || 'unknown',
        reason: `Server exception during login: ${err?.message || err}`,
        ip: req.ip,
      });
      saveDB(db);
    } catch (e) {}
    res.status(500).json({ error: 'Login failed due to a server error. Please try again.' });
  }
});

// Auth: Verify 2FA TOTP Code during login
app.post('/api/auth/verify-2fa', async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({ error: 'Temporary token and 6-digit 2FA code are required.' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: '2FA session expired or invalid. Please log in again.' });
    }

    if (decoded.purpose !== '2fa_login' || !decoded.id) {
      return res.status(401).json({ error: 'Invalid 2FA authentication session.' });
    }

    const db = loadDB();
    const user = db.users.find((u) => u.id === decoded.id);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA is not enabled for this account.' });
    }

    const isValid = verifyTOTP(code, user.twoFactorSecret);
    if (!isValid) {
      logAuthDiagnostic(db, {
        event: 'LOGIN_FAILED',
        email: user.email,
        reason: 'Invalid 2FA TOTP code entered during login',
        ip: req.ip,
      });
      saveDB(db);
      return res.status(400).json({ error: 'Invalid 2FA code. Please check your authenticator app (Google Authenticator, Authy, etc.) and try again.' });
    }

    logAuthDiagnostic(db, {
      event: 'LOGIN_SUCCESS',
      email: user.email,
      reason: `Successful 2FA TOTP verification for user ID ${user.id}`,
      ip: req.ip,
    });
    saveDB(db);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, twoFactorSecret: __, pendingTwoFactorSecret: ___, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  } catch (err: any) {
    console.error('Verify 2FA error:', err);
    return res.status(500).json({ error: '2FA verification failed due to a server error. Please try again.' });
  }
});

// 2FA Setup: Generate TOTP Secret & QR URI
app.post('/api/2fa/setup', authMiddleware, (req: any, res) => {
  try {
    const db = loadDB();
    const userIndex = db.users.findIndex((u) => u.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = db.users[userIndex];
    const secret = generateBase32Secret(16);
    user.pendingTwoFactorSecret = secret;
    saveDB(db);

    const appName = 'NETBYBIT';
    const otpauthUrl = `otpauth://totp/${appName}:${encodeURIComponent(user.email)}?secret=${secret}&issuer=${appName}`;

    res.json({ secret, otpauthUrl });
  } catch (err: any) {
    console.error('2FA setup error:', err);
    res.status(500).json({ error: 'Failed to generate 2FA setup secret' });
  }
});

// 2FA Enable: Verify Code & Activate 2FA
app.post('/api/2fa/enable', authMiddleware, (req: any, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: '6-digit verification code is required' });
    }

    const db = loadDB();
    const userIndex = db.users.findIndex((u) => u.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = db.users[userIndex];
    const secretToVerify = user.pendingTwoFactorSecret || user.twoFactorSecret;
    if (!secretToVerify) {
      return res.status(400).json({ error: 'No 2FA setup in progress. Please generate a new QR code.' });
    }

    const isValid = verifyTOTP(code, secretToVerify);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code. Please check your authenticator app (Google Authenticator, Authy, etc.) and try again.' });
    }

    user.twoFactorEnabled = true;
    user.twoFactorSecret = secretToVerify;
    delete user.pendingTwoFactorSecret;
    saveDB(db);

    const { passwordHash: _, twoFactorSecret: __, pendingTwoFactorSecret: ___, ...safeUser } = user;
    res.json({ success: true, message: 'Two-Factor Authentication enabled successfully!', user: safeUser });
  } catch (err: any) {
    console.error('2FA enable error:', err);
    res.status(500).json({ error: 'Failed to enable Two-Factor Authentication' });
  }
});

// 2FA Disable: Turn Off 2FA
app.post('/api/2fa/disable', authMiddleware, (req: any, res) => {
  try {
    const { code, password } = req.body;
    const db = loadDB();
    const userIndex = db.users.findIndex((u) => u.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = db.users[userIndex];

    if (code && user.twoFactorSecret) {
      const isValid = verifyTOTP(code, user.twoFactorSecret);
      if (!isValid && password && user.passwordHash) {
        const isPassValid = bcrypt.compareSync(password, user.passwordHash);
        if (!isPassValid) {
          return res.status(400).json({ error: 'Invalid 2FA verification code or password.' });
        }
      } else if (!isValid) {
        return res.status(400).json({ error: 'Invalid 2FA verification code.' });
      }
    } else if (password && user.passwordHash) {
      const isPassValid = bcrypt.compareSync(password, user.passwordHash);
      if (!isPassValid) {
        return res.status(400).json({ error: 'Incorrect password.' });
      }
    }

    user.twoFactorEnabled = false;
    delete user.twoFactorSecret;
    delete user.pendingTwoFactorSecret;
    saveDB(db);

    const { passwordHash: _, twoFactorSecret: __, pendingTwoFactorSecret: ___, ...safeUser } = user;
    res.json({ success: true, message: 'Two-Factor Authentication disabled successfully.', user: safeUser });
  } catch (err: any) {
    console.error('2FA disable error:', err);
    res.status(500).json({ error: 'Failed to disable Two-Factor Authentication' });
  }
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
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedInput = email.trim().toLowerCase();
    const db = loadDB();

    logAuthDiagnostic(db, {
      event: 'FORGOT_PASSWORD_REQUEST',
      email: normalizedInput,
      reason: 'Password reset code requested',
      ip: req.ip,
    });

    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === normalizedInput ||
        (u.username && u.username.toLowerCase() === normalizedInput)
    );
    if (!user) {
      saveDB(db);
      // Return friendly message to avoid email enumeration
      return res.json({ success: true, message: 'If an account exists for this email, a password reset security code has been dispatched.' });
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
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

// Auth: Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    const normalizedInput = email.trim().toLowerCase();
    const db = loadDB();
    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === normalizedInput ||
        (u.username && u.username.toLowerCase() === normalizedInput)
    );

    if (!user) {
      logAuthDiagnostic(db, {
        event: 'RESET_PASSWORD_FAILED',
        email: normalizedInput,
        reason: 'User account not found during password reset',
        ip: req.ip,
      });
      saveDB(db);
      return res.status(404).json({ error: 'User account not found' });
    }

    if (code && user.resetCode && user.resetCode !== code.trim()) {
      logAuthDiagnostic(db, {
        event: 'RESET_PASSWORD_FAILED',
        email: normalizedInput,
        reason: 'Invalid reset code provided',
        ip: req.ip,
      });
      saveDB(db);
      return res.status(400).json({ error: 'Invalid or expired password reset security code.' });
    }

    const salt = bcrypt.genSaltSync(10);
    user.passwordHash = bcrypt.hashSync(newPassword, salt);
    user.resetCode = null;

    logAuthDiagnostic(db, {
      event: 'RESET_PASSWORD_SUCCESS',
      email: user.email,
      reason: 'Password updated successfully',
      ip: req.ip,
    });

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
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Admin: Get Auth Logs
app.get('/api/admin/auth-logs', adminMiddleware, (req, res) => {
  const db = loadDB();
  res.json(db.authLogs || []);
});

// Admin: Get SMS Dispatched Logs
app.get('/api/admin/sms-logs', adminMiddleware, (req, res) => {
  const db = loadDB();
  res.json(db.smsLogs || []);
});

// SMS: Send Test or Outbound SMS
app.post('/api/sms/send-test', authMiddleware, async (req: any, res) => {
  const { recipient, message, category } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const db = loadDB();
  const targetRecipient = recipient || req.user.email;
  const smsRecord = await sendSmsNotification(db, {
    to: targetRecipient,
    message,
    category: category || 'Test SMS Dispatch',
  });

  saveDB(db);
  res.json({ success: true, smsRecord, message: 'SMS notification dispatched and recorded.' });
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
  const { name, username, avatar, preferredCurrency } = req.body;
  const db = loadDB();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (name) db.users[userIndex].name = name.trim();
  if (username) db.users[userIndex].username = username.trim();
  if (avatar !== undefined) db.users[userIndex].avatar = avatar;
  if (preferredCurrency) db.users[userIndex].preferredCurrency = preferredCurrency.toUpperCase();

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

// User Account Deletion (Disabled - All user accounts and logins are permanently preserved)
app.delete('/api/user/delete-account', authMiddleware, (req: any, res) => {
  return res.status(403).json({
    error: 'Account deletion is permanently disabled. All user accounts, logins, and transaction records are securely preserved on the NETBYBIT platform.',
  });
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

  if (['withdraw', 'send'].includes(type) && user.twoFactorEnabled && user.twoFactorSecret) {
    const { twoFactorCode } = req.body;
    if (!twoFactorCode) {
      return res.status(400).json({ error: '2FA verification code is required for this transaction.' });
    }
    const isValid2FA = verifyTOTP(twoFactorCode, user.twoFactorSecret);
    if (!isValid2FA) {
      return res.status(400).json({ error: 'Invalid 2FA code. Please check your authenticator app.' });
    }
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
    // User SMS Notification
    sendSmsNotification(db, {
      to: user.email,
      message: `[NETBYBIT Alert] Withdrawal request for ${parsedAmount} ${asset} received. Status: Pending Approval. TxID: ${newTx.id}`,
      category: 'Asset Withdrawal',
    });

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
app.post('/api/support/tickets', authMiddleware, async (req: any, res) => {
  const { subject, category, message, userLanguage } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }

  const db = loadDB();
  const user = db.users.find((u) => u.id === req.user.id);

  // Real-Time Language Detection & Translation to English for Admin Dashboard
  const trans = await translateSupportMessage(message.trim(), 'English');
  const detectedLang = userLanguage || trans.detectedLanguage || 'English';

  const newTicket = {
    id: 'TKT-' + Math.floor(100000 + Math.random() * 900000),
    userId: req.user.id,
    userName: user?.name || req.user.name || 'User',
    userEmail: req.user.email,
    subject: subject.trim(),
    category: category || 'General Inquiry',
    message: message.trim(),
    translatedMessage: trans.translatedText,
    userLanguage: detectedLang,
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
    subject: `Support Alert: New Support Chat Started by ${req.user.email} (#${newTicket.id}) [Language: ${detectedLang}]`,
    category: 'Admin Alert',
    isAdminAlert: true,
    body: `New Customer Support Conversation Started!

Ticket / Room ID: #${newTicket.id}
User Email: ${req.user.email}
User Name: ${user?.name || req.user.name}
Language: ${detectedLang}
Category: ${category}
Subject: ${subject}
Original Message: "${message}"
English Translation for Admin: "${trans.translatedText}"
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
app.post('/api/support/tickets/:ticketId/reply', authMiddleware, async (req: any, res) => {
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

  let replyTrans;
  if (isUserSender) {
    // User reply -> translate to English for Admin Dashboard
    replyTrans = await translateSupportMessage(message.trim(), 'English');
    if (replyTrans.detectedLanguage && replyTrans.detectedLanguage !== 'English') {
      ticket.userLanguage = replyTrans.detectedLanguage;
    }
  } else {
    // Admin reply in English -> translate to User's preferred language
    const targetLang = ticket.userLanguage || 'English';
    replyTrans = await translateSupportMessage(message.trim(), targetLang);
  }

  const newReply = {
    id: 'rpl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    sender: senderRole,
    senderName,
    message: message.trim(),
    translatedMessage: replyTrans.translatedText,
    originalLanguage: isUserSender ? (replyTrans.detectedLanguage || ticket.userLanguage || 'English') : 'English',
    targetLanguage: isUserSender ? 'English' : (ticket.userLanguage || 'English'),
    isTranslated: replyTrans.isTranslated,
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
Original Message: "${message.trim()}"
English Translation: "${replyTrans.translatedText}"
Date & Time: ${new Date().toLocaleString()}

Reply directly via the Customer Support / Admin Dashboard.`,
    });
  } else {
    // Staff reply -> Dispatch Email to User & In-App Notification
    const userMessageBody = replyTrans.isTranslated 
      ? `${replyTrans.translatedText}\n\n(Original English: "${message.trim()}")`
      : message.trim();

    sendEmailNotification(db, {
      to: ticket.userEmail,
      subject: `NETBYBIT Support - Response to Ticket #${ticket.id}`,
      category: 'Customer Support Reply',
      body: `Hello ${ticket.userName || 'Valued User'},

The NETBYBIT Customer Support Team has replied to your ticket #${ticket.id} ("${ticket.subject}"):

"${userMessageBody}"

Sender Address: netbybitsupport@gmail.com

You can view full conversation history in your account dashboard.

Thank you,
NETBYBIT Support Team`,
    });

    db.notifications.push({
      id: 'notif_' + Date.now(),
      userId: ticket.userId,
      title: `Support Reply: #${ticket.id}`,
      message: `Customer Support replied: "${userMessageBody.substring(0, 60)}..."`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  saveDB(db);
  res.json({ success: true, ticket });
});

// --- GUEST CUSTOMER SUPPORT CHAT ROUTES (FOR UNAUTHENTICATED VISITORS) ---

// Guest Support Tickets: Create Ticket without login
app.post('/api/support/guest/tickets', async (req, res) => {
  const { name, email, subject, category, message, userLanguage } = req.body;
  if (!email || !message || !message.trim()) {
    return res.status(400).json({ error: 'Email and message content are required to start support chat.' });
  }

  const db = loadDB();
  const guestName = name?.trim() || email.split('@')[0] || 'Guest Visitor';
  const guestEmail = email.trim().toLowerCase();
  const ticketId = 'TKT-GUEST-' + Math.floor(100000 + Math.random() * 900000);
  const nowISO = new Date().toISOString();

  // Translate Guest message to English for Admin
  const trans = await translateSupportMessage(message.trim(), 'English');
  const detectedLang = userLanguage || trans.detectedLanguage || 'English';

  // Translate Bot Greeting to User's language if non-English
  const botGreetingEnglish = `Hello ${guestName}! Thank you for contacting NETBYBIT 24/7 Live Support. Your chat inquiry has been assigned ticket #${ticketId}. A live support representative has been notified and will reply shortly.`;
  let botGreetingTrans = botGreetingEnglish;
  let botIsTrans = false;

  if (detectedLang.toLowerCase() !== 'english') {
    const botTransRes = await translateSupportMessage(botGreetingEnglish, detectedLang);
    botGreetingTrans = botTransRes.translatedText;
    botIsTrans = botTransRes.isTranslated;
  }

  const initialAutoReply = {
    id: 'rpl_auto_' + Date.now(),
    sender: 'admin' as const,
    senderName: 'NETBYBIT Live Support Bot',
    message: botGreetingEnglish,
    translatedMessage: botGreetingTrans,
    originalLanguage: 'English',
    targetLanguage: detectedLang,
    isTranslated: botIsTrans,
    createdAt: nowISO,
    status: 'Delivered',
  };

  const newTicket = {
    id: ticketId,
    userId: 'guest_' + Math.random().toString(36).substring(2, 9),
    userName: guestName + ' (Guest Visitor)',
    userEmail: guestEmail,
    subject: subject?.trim() || 'Guest Live Support Inquiry',
    category: category || 'General Inquiry',
    message: message.trim(),
    translatedMessage: trans.translatedText,
    userLanguage: detectedLang,
    status: 'Open' as const,
    createdAt: nowISO,
    replies: [initialAutoReply],
  };

  if (!db.supportTickets) db.supportTickets = [];
  db.supportTickets.unshift(newTicket);

  // Send User Ticket Confirmation Email
  sendEmailNotification(db, {
    to: guestEmail,
    subject: `NETBYBIT Live Support - Chat Inquiry Received: #${newTicket.id}`,
    category: 'Guest Support Inquiry',
    body: `Hello ${guestName},

Thank you for reaching out to NETBYBIT 24/7 Live Support.

Ticket ID: #${newTicket.id}
Email: ${guestEmail}
Language: ${detectedLang}
Category: ${category || 'General Inquiry'}
Message: "${message.trim()}"

Our support team has been notified. You can continue chatting directly on the site or reply to this email.

Thank you,
NETBYBIT Support Team`,
  });

  // Send Admin Notification Alert
  sendEmailNotification(db, {
    to: 'netbybitsupport@gmail.com',
    subject: `Support Alert: New Guest Support Chat Started by ${guestEmail} (#${newTicket.id}) [Language: ${detectedLang}]`,
    category: 'Admin Alert',
    isAdminAlert: true,
    body: `New Guest Visitor Support Chat Started!

Ticket ID: #${newTicket.id}
Visitor Email: ${guestEmail}
Visitor Name: ${guestName}
Language: ${detectedLang}
Subject: ${subject || 'Guest Support Inquiry'}
Category: ${category || 'General Inquiry'}
Original Message: "${message.trim()}"
English Translation for Admin: "${trans.translatedText}"
Date & Time: ${new Date().toLocaleString()}

Log in to the Admin Panel / Staff Support Console to respond to this visitor.`,
  });

  saveDB(db);

  res.json({
    success: true,
    ticket: newTicket,
    message: 'Guest live support chat initiated successfully.',
  });
});

// Guest Support Tickets: Get Ticket by ID & Email
app.get('/api/support/guest/tickets/:ticketId', (req, res) => {
  const { ticketId } = req.params;
  const emailQuery = (req.query.email as string || '').trim().toLowerCase();
  
  const db = loadDB();
  const ticket = db.supportTickets?.find((t) => t.id === ticketId);

  if (!ticket) {
    return res.status(404).json({ error: 'Guest support chat ticket not found.' });
  }

  // Security check: if email query provided, ensure it matches
  if (emailQuery && ticket.userEmail.toLowerCase() !== emailQuery) {
    return res.status(403).json({ error: 'Unauthorized to view this ticket.' });
  }

  res.json({ success: true, ticket });
});

// Guest Support Tickets: Reply to Ticket as Guest
app.post('/api/support/guest/tickets/:ticketId/reply', async (req, res) => {
  const { ticketId } = req.params;
  const { message, email } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Reply message cannot be empty' });
  }

  const db = loadDB();
  const ticket = db.supportTickets?.find((t) => t.id === ticketId);

  if (!ticket) {
    return res.status(404).json({ error: 'Guest support chat ticket not found.' });
  }

  if (email && ticket.userEmail.toLowerCase() !== email.trim().toLowerCase()) {
    return res.status(403).json({ error: 'Email mismatch for this ticket.' });
  }

  // Guest reply -> translate to English for Admin Dashboard
  const trans = await translateSupportMessage(message.trim(), 'English');
  if (trans.detectedLanguage && trans.detectedLanguage !== 'English') {
    ticket.userLanguage = trans.detectedLanguage;
  }

  const newReply = {
    id: 'rpl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    sender: 'user' as const,
    senderName: ticket.userName || 'Guest Visitor',
    message: message.trim(),
    translatedMessage: trans.translatedText,
    originalLanguage: trans.detectedLanguage || ticket.userLanguage || 'English',
    targetLanguage: 'English',
    isTranslated: trans.isTranslated,
    createdAt: new Date().toISOString(),
    status: 'Delivered',
  };

  ticket.replies.push(newReply);
  if (ticket.status === 'Closed') {
    ticket.status = 'Open';
  }

  // Send Admin Alert Email
  sendEmailNotification(db, {
    to: 'netbybitsupport@gmail.com',
    subject: `Support Alert: New Guest Message from ${ticket.userEmail} (#${ticket.id})`,
    category: 'Guest Support Reply',
    isAdminAlert: true,
    body: `New message received in Guest Support Chat #${ticket.id}:

Visitor: ${ticket.userName} (${ticket.userEmail})
Message: "${message.trim()}"
Date & Time: ${new Date().toLocaleString()}

Log in to Admin Panel to reply to the visitor.`,
  });

  saveDB(db);
  res.json({ success: true, ticket });
});

// Support Tickets: Update ticket user language preference
app.put('/api/support/tickets/:ticketId/language', (req, res) => {
  const { ticketId } = req.params;
  const { userLanguage } = req.body;
  if (!userLanguage || !userLanguage.trim()) {
    return res.status(400).json({ error: 'userLanguage is required' });
  }

  const db = loadDB();
  const ticket = db.supportTickets?.find((t) => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Support ticket not found' });
  }

  ticket.userLanguage = userLanguage.trim();
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

// Admin: Send Custom Email / Broadcast Email to Users
app.post('/api/admin/email/send', adminMiddleware, (req: any, res) => {
  const { recipients, subject, category = 'System Announcement', body, actionText, actionUrl, highlightBox } = req.body;

  if (!recipients || !subject || !body) {
    return res.status(400).json({ error: 'Recipients, subject, and message body are required' });
  }

  const db = loadDB();
  let targetEmails: string[] = [];

  if (recipients === 'all') {
    targetEmails = db.users.map((u) => u.email);
  } else if (Array.isArray(recipients)) {
    targetEmails = recipients;
  } else if (typeof recipients === 'string') {
    targetEmails = [recipients];
  }

  if (targetEmails.length === 0) {
    return res.status(400).json({ error: 'No valid recipient email addresses found' });
  }

  const createdRecords: any[] = [];
  targetEmails.forEach((email) => {
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    const recipientName = user ? user.name : undefined;

    const record = sendEmailNotification(db, {
      to: email.trim(),
      subject: subject.trim(),
      category: category.trim(),
      body: body.trim(),
      actionText,
      actionUrl,
      highlightBox,
    });
    createdRecords.push(record);

    // Also send in-app notification if user exists
    if (user) {
      if (!db.notifications) db.notifications = [];
      db.notifications.unshift({
        id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId: user.id,
        title: subject.trim(),
        message: body.trim().length > 90 ? body.trim().substring(0, 90) + '...' : body.trim(),
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  });

  saveDB(db);

  res.json({
    success: true,
    sentCount: createdRecords.length,
    emailRecords: createdRecords,
    message: `Successfully dispatched custom email to ${createdRecords.length} recipient(s).`,
  });
});

// Admin: Retry Dispatched Email
app.post('/api/admin/email/retry/:emailId', adminMiddleware, (req: any, res) => {
  const { emailId } = req.params;
  const db = loadDB();

  if (!db.emailLogs) {
    return res.status(404).json({ error: 'Email logs empty' });
  }

  const logIndex = db.emailLogs.findIndex((e) => e.id === emailId);
  if (logIndex === -1) {
    return res.status(404).json({ error: 'Email log record not found' });
  }

  const log = db.emailLogs[logIndex];
  log.retryCount = (log.retryCount || 0) + 1;
  log.sentAt = new Date().toISOString();
  log.status = 'Delivered';
  log.errorMessage = undefined;

  // Re-attempt nodemailer dispatch if available
  if (smtpTransporter) {
    smtpTransporter
      .sendMail({
        from: `NETBYBIT Official <${SENDER_EMAIL}>`,
        to: log.to,
        subject: log.subject,
        text: log.body,
        html: log.html || generateHtmlEmail({ title: log.subject, category: log.category, body: log.body }),
      })
      .then((info) => {
        console.log(`[SMTP RETRY SUCCESS] MessageId: ${info.messageId} to ${log.to}`);
      })
      .catch((err) => {
        console.error(`[SMTP RETRY ERROR] Failed resending to ${log.to}:`, err?.message || err);
        log.status = 'Failed';
        log.errorMessage = err?.message || 'SMTP retry failed';
      });
  }

  saveDB(db);
  res.json({
    success: true,
    emailRecord: log,
    message: `Successfully re-sent email to ${log.to}. Delivery status updated.`,
  });
});

// Admin: Delete Email Log Entry
app.delete('/api/admin/email-logs/:emailId', adminMiddleware, (req: any, res) => {
  const { emailId } = req.params;
  const db = loadDB();

  if (!db.emailLogs) {
    return res.status(404).json({ error: 'No email logs found' });
  }

  const initialCount = db.emailLogs.length;
  db.emailLogs = db.emailLogs.filter((e) => e.id !== emailId);

  if (db.emailLogs.length === initialCount) {
    return res.status(404).json({ error: 'Email log entry not found' });
  }

  saveDB(db);
  res.json({ success: true, message: 'Email log entry deleted successfully.' });
});

// Admin: Test SMTP Transport Connection
app.post('/api/admin/email/test-smtp', adminMiddleware, async (req: any, res) => {
  const db = loadDB();
  const testEmail = SENDER_EMAIL || 'netbybitsupport@gmail.com';

  const record = sendEmailNotification(db, {
    to: testEmail,
    subject: 'NETBYBIT SMTP Diagnostic & Connection Test',
    category: 'System Test',
    body: `Hello Admin,

This is a diagnostic test email dispatched from your NETBYBIT server console.

Server Host: Node.js Cloud Environment
Sender Email: ${SENDER_EMAIL}
Admin Target: ${testEmail}
Timestamp: ${new Date().toLocaleString()}

If you received this message, your site email notification engine is operating cleanly.

Thank you,
NETBYBIT Infrastructure System`,
    highlightBox: 'SMTP-TEST-' + Math.floor(100000 + Math.random() * 900000),
  });

  saveDB(db);

  res.json({
    success: true,
    message: `SMTP test notification dispatched to ${testEmail}. Logged in Email History.`,
    details: record,
  });
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
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`NETBYBIT Fullstack Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export { app };
export default app;
