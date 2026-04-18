# Ethics Backend — Security Notes

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and set JWT_SECRET to a long random string
export JWT_SECRET="your-secret-here"
node server.js
```

## What was hardened

| Issue | Fix |
|---|---|
| Hardcoded JWT secret | Reads from `JWT_SECRET` env var — exits if not set |
| Plaintext passwords | bcrypt with cost factor 12 (was 10) |
| SQL injection | All queries use parameterised `?` placeholders — always were, now documented |
| No password validation on account update | `/api/update-account` hashes new password properly |
| User enumeration via timing | Login always runs bcrypt.compare even for unknown emails |
| No auth on protected routes | `requireAuth` middleware checks Bearer token on all data routes |
| Email exposed in URL | `GET /api/chats` reads email from JWT, not from `req.params` |
| Wildcard CORS | Restricted to `FRONTEND_ORIGIN` env var |
| No request size limit | `express.json({ limit: '16kb' })` |
| No rate limiting | `express-rate-limit` — 20 auth attempts / 15 min, 60 general / 1 min |
| Missing security headers | `helmet` sets X-Frame-Options, CSP, X-Content-Type-Options, etc. |
| No JWT expiry | Tokens now expire in 7 days |
| Theme not validated | `sanitizeTheme()` whitelists only light/dark/sepia |
| No input length limits | Email ≤254, name ≤100, password 8–128 chars enforced |
| Server listens on 0.0.0.0 | Now binds to 127.0.0.1 only (localhost only) |
| No 404 handler | Added catch-all 404 route |
