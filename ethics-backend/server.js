'use strict';
require('dotenv').config();

const express      = require('express');
const sqlite3      = require('sqlite3').verbose();
const cors         = require('cors');
const bcrypt       = require('bcrypt');
const jwt          = require('jsonwebtoken');

// ─── Optional security packages ──────────────────────────────────────────────
// If not installed yet, run:  npm install express-rate-limit helmet
let rateLimit, helmet;
try { rateLimit = require('express-rate-limit'); } catch (_) { rateLimit = null; }
try { helmet = require('helmet'); } catch (_) { helmet = null; }

const app  = express();
const PORT = process.env.PORT || 5000;

// ──────────────────────────────────────────────────────────────────────────────
// SECRET KEY  — read from environment variable, never hardcoded
// Set it once:  export JWT_SECRET="some-long-random-string"
// ──────────────────────────────────────────────────────────────────────────────
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}

// ──────────────────────────────────────────────────────────────────────────────
// SECURITY MIDDLEWARE
// ──────────────────────────────────────────────────────────────────────────────

// 1. Helmet — sets safe HTTP headers (XSS protection, content-type sniffing, etc.)
if (helmet) {
  app.use(helmet());
} else {
  console.warn('helmet not installed — run `npm install helmet` for extra HTTP header protection.');
}

// 2. CORS — restrict to only your frontend origin
const ALLOWED_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// 3. Body size limit — prevents large-payload DoS attacks
app.use(express.json({ limit: '16kb' }));

// 4. Rate limiting — limits how often any single IP can call auth endpoints
const authLimiter = rateLimit
  ? rateLimit({
      windowMs: 15 * 60 * 1000,  // 15 minutes
      max: 20,                    // max 20 login/signup attempts per window
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests from this IP. Please try again later.' },
    })
  : (req, res, next) => next();  // no-op if package missing

const generalLimiter = rateLimit
  ? rateLimit({
      windowMs: 60 * 1000,       // 1 minute
      max: 60,                    // 60 requests per minute per IP
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests. Please slow down.' },
    })
  : (req, res, next) => next();

if (!rateLimit) {
  console.warn('express-rate-limit not installed — run `npm install express-rate-limit` for rate limiting.');
}

app.use(generalLimiter);

// ──────────────────────────────────────────────────────────────────────────────
// INPUT VALIDATION HELPERS
// ──────────────────────────────────────────────────────────────────────────────

const EMAIL_RE   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME   = 100;
const MAX_EMAIL  = 254;   // RFC 5321
const MIN_PASS   = 8;
const MAX_PASS   = 128;

function validateEmail(email) {
  return typeof email === 'string'
    && email.length <= MAX_EMAIL
    && EMAIL_RE.test(email.trim());
}

function validatePassword(password) {
  return typeof password === 'string'
    && password.length >= MIN_PASS
    && password.length <= MAX_PASS;
}

function validateName(name) {
  return typeof name === 'string'
    && name.trim().length > 0
    && name.trim().length <= MAX_NAME;
}

function sanitizeTheme(theme) {
  const allowed = ['light', 'dark', 'sepia'];
  return allowed.includes(theme) ? theme : 'dark';
}

// ──────────────────────────────────────────────────────────────────────────────
// JWT MIDDLEWARE — verifies Bearer token on protected routes
// ──────────────────────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const token = authHeader.slice(7);
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (_) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// DATABASE
// All queries use parameterised statements — zero risk of SQL injection
// ──────────────────────────────────────────────────────────────────────────────
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) { console.error('Database connection error:', err.message); process.exit(1); }
  console.log('Connected to SQLite database.');
});

// Enable WAL mode for better concurrency and performance
db.run('PRAGMA journal_mode = WAL;');
// Enforce foreign key constraints
db.run('PRAGMA foreign_keys = ON;');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL,
    email    TEXT    UNIQUE NOT NULL,
    password TEXT    NOT NULL,
    theme    TEXT    NOT NULL DEFAULT 'dark'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS chats (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_email TEXT     NOT NULL,
    prompt     TEXT     NOT NULL,
    response   TEXT     NOT NULL,
    confidence INTEGER  NOT NULL DEFAULT 0,
    timestamp  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  // Index so chat lookups by email are fast
  db.run(`CREATE INDEX IF NOT EXISTS idx_chats_email ON chats(user_email)`);
});

// ──────────────────────────────────────────────────────────────────────────────
// HELPER — uniform error log (don't leak internal details to client)
// ──────────────────────────────────────────────────────────────────────────────
function internalError(res, context, err) {
  console.error(`[${context}]`, err?.message || err);
  return res.status(500).json({ error: 'An internal server error occurred.' });
}

// ──────────────────────────────────────────────────────────────────────────────
// ROUTE 1 — SIGN UP
// POST /api/signup
// ──────────────────────────────────────────────────────────────────────────────
app.post('/api/signup', authLimiter, async (req, res) => {
  const { name, email, password } = req.body;

  if (!validateName(name))     return res.status(400).json({ error: 'Name is required (max 100 chars).' });
  if (!validateEmail(email))   return res.status(400).json({ error: 'A valid email address is required.' });
  if (!validatePassword(password))
    return res.status(400).json({ error: `Password must be ${MIN_PASS}–${MAX_PASS} characters.` });

  try {
    // Cost factor 12 — strong but not brutally slow
    const hashedPassword = await bcrypt.hash(password, 12);

    db.run(
      `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
      [name.trim(), email.trim().toLowerCase(), hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed'))
            return res.status(409).json({ error: 'An account with that email already exists.' });
          return internalError(res, 'signup/db', err);
        }
        const token = jwt.sign(
          { id: this.lastID, email: email.trim().toLowerCase(), name: name.trim() },
          SECRET_KEY,
          { expiresIn: '7d' }
        );
        res.status(201).json({
          message: 'Account created.',
          token,
          user: { name: name.trim(), email: email.trim().toLowerCase() },
        });
      }
    );
  } catch (err) {
    internalError(res, 'signup', err);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// ROUTE 2 — LOGIN
// POST /api/login
// ──────────────────────────────────────────────────────────────────────────────
app.post('/api/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!validateEmail(email) || !validatePassword(password))
    return res.status(400).json({ error: 'Valid email and password are required.' });

  db.get(
    `SELECT id, name, email, password, theme FROM users WHERE email = ?`,
    [email.trim().toLowerCase()],
    async (err, user) => {
      if (err) return internalError(res, 'login/db', err);

      // Use a constant-time comparison path even when user not found
      // (prevents user enumeration via timing attacks)
      const dummyHash = '$2b$12$invalidhashpaddingtomakethiscomp';
      const hashToCompare = user ? user.password : dummyHash;
      const match = await bcrypt.compare(password, hashToCompare);

      if (!user || !match)
        return res.status(401).json({ error: 'Invalid email or password.' });

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        SECRET_KEY,
        { expiresIn: '7d' }
      );
      res.json({
        message: 'Logged in.',
        token,
        user: { name: user.name, email: user.email, theme: user.theme },
      });
    }
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// ROUTE 3 — UPDATE PROFILE (name, email, theme)
// POST /api/update-profile  — protected
// ──────────────────────────────────────────────────────────────────────────────
app.post('/api/update-profile', requireAuth, async (req, res) => {
  const { newName, newEmail, theme } = req.body;
  const currentEmail = req.user.email;

  if (newName  && !validateName(newName))   return res.status(400).json({ error: 'Invalid name.' });
  if (newEmail && !validateEmail(newEmail)) return res.status(400).json({ error: 'Invalid email.' });

  const finalName  = newName  ? newName.trim()                       : req.user.name;
  const finalEmail = newEmail ? newEmail.trim().toLowerCase()        : currentEmail;
  const finalTheme = sanitizeTheme(theme);

  db.run(
    `UPDATE users SET name = ?, email = ?, theme = ? WHERE email = ?`,
    [finalName, finalEmail, finalTheme, currentEmail],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed'))
          return res.status(409).json({ error: 'That email is already taken.' });
        return internalError(res, 'update-profile/db', err);
      }
      if (this.changes === 0)
        return res.status(404).json({ error: 'User not found.' });

      const newToken = jwt.sign(
        { id: req.user.id, email: finalEmail, name: finalName },
        SECRET_KEY,
        { expiresIn: '7d' }
      );
      res.json({
        message: 'Profile updated.',
        token: newToken,
        user: { name: finalName, email: finalEmail, theme: finalTheme },
      });
    }
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// ROUTE 4 — UPDATE ACCOUNT (email + optional password change)
// POST /api/update-account  — protected
// This is the route AccountModal calls
// ──────────────────────────────────────────────────────────────────────────────
app.post('/api/update-account', requireAuth, async (req, res) => {
  const { newEmail, newPassword } = req.body;
  const currentEmail = req.user.email;

  const finalEmail = newEmail && validateEmail(newEmail)
    ? newEmail.trim().toLowerCase()
    : currentEmail;

  if (newEmail && !validateEmail(newEmail))
    return res.status(400).json({ error: 'Invalid email address.' });

  if (newPassword && !validatePassword(newPassword))
    return res.status(400).json({
      error: `Password must be ${MIN_PASS}–${MAX_PASS} characters.`,
    });

  try {
    // If a new password was provided, hash it
    if (newPassword) {
      const hashed = await bcrypt.hash(newPassword, 12);
      db.run(
        `UPDATE users SET email = ?, password = ? WHERE email = ?`,
        [finalEmail, hashed, currentEmail],
        function (err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed'))
              return res.status(409).json({ error: 'That email is already taken.' });
            return internalError(res, 'update-account/password/db', err);
          }
          if (this.changes === 0) return res.status(404).json({ error: 'User not found.' });
          issueUpdatedToken(res, req.user, finalEmail);
        }
      );
    } else {
      // Email-only update
      db.run(
        `UPDATE users SET email = ? WHERE email = ?`,
        [finalEmail, currentEmail],
        function (err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed'))
              return res.status(409).json({ error: 'That email is already taken.' });
            return internalError(res, 'update-account/email/db', err);
          }
          if (this.changes === 0) return res.status(404).json({ error: 'User not found.' });
          issueUpdatedToken(res, req.user, finalEmail);
        }
      );
    }
  } catch (err) {
    internalError(res, 'update-account', err);
  }
});

function issueUpdatedToken(res, user, newEmail) {
  const token = jwt.sign(
    { id: user.id, email: newEmail, name: user.name },
    SECRET_KEY,
    { expiresIn: '7d' }
  );
  res.json({
    message: 'Account updated.',
    token,
    user: { name: user.name, email: newEmail },
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// ROUTE 5 — DELETE ACCOUNT
// DELETE /api/delete-account  — protected
// ──────────────────────────────────────────────────────────────────────────────
app.delete('/api/delete-account', requireAuth, (req, res) => {
  const email = req.user.email;
  db.run(`DELETE FROM chats WHERE user_email = ?`, [email], (err) => {
    if (err) return internalError(res, 'delete-account/chats', err);
    db.run(`DELETE FROM users WHERE email = ?`, [email], function (err2) {
      if (err2) return internalError(res, 'delete-account/user', err2);
      if (this.changes === 0) return res.status(404).json({ error: 'User not found.' });
      res.json({ message: 'Account deleted.' });
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// ROUTE 6 — SAVE CHAT
// POST /api/chats  — protected
// ──────────────────────────────────────────────────────────────────────────────
app.post('/api/chats', requireAuth, (req, res) => {
  const { prompt, response, confidence } = req.body;
  const email = req.user.email;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0)
    return res.status(400).json({ error: 'Prompt is required.' });
  if (!response || typeof response !== 'string')
    return res.status(400).json({ error: 'Response is required.' });

  const conf = Number.isInteger(confidence) && confidence >= 0 && confidence <= 100
    ? confidence : 0;

  db.run(
    `INSERT INTO chats (user_email, prompt, response, confidence) VALUES (?, ?, ?, ?)`,
    [email, prompt.trim().slice(0, 4000), JSON.stringify(response).slice(0, 32000), conf],
    function (err) {
      if (err) return internalError(res, 'save-chat/db', err);
      res.status(201).json({ message: 'Chat saved.', chatId: this.lastID });
    }
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// ROUTE 7 — GET CHATS
// GET /api/chats  — protected (email from token, not URL)
// ──────────────────────────────────────────────────────────────────────────────
app.get('/api/chats', requireAuth, (req, res) => {
  const email = req.user.email;
  db.all(
    `SELECT id, prompt, response, confidence, timestamp
     FROM chats WHERE user_email = ?
     ORDER BY timestamp DESC
     LIMIT 100`,
    [email],
    (err, rows) => {
      if (err) return internalError(res, 'get-chats/db', err);
      res.json(rows);
    }
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// 404 catch-all
// ──────────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ──────────────────────────────────────────────────────────────────────────────
// START
// ──────────────────────────────────────────────────────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend running on http://127.0.0.1:${PORT}`);
});
