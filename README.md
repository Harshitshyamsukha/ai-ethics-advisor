# 🧠 Enterprise AI Ethics Advisor

An interactive, highly secure web application designed to evaluate complex business and ethical dilemmas through advanced AI frameworks (Utilitarianism, Deontological Ethics, and Virtue Ethics). 

Built with an enterprise-grade security posture and a premium, animated glass-morphic UI, this tool is designed for strict corporate environments where data privacy and analytical rigor are paramount.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Security](https://img.shields.io/badge/Security-Enterprise_Grade-red)

---

## ✨ UI/UX & Frontend Features

The frontend (`ethics-ui/`) is a React single-page application built with Vite and Tailwind CSS, featuring highly polished, interactive components:

- **Animated Ethical Risk Meter:** A dynamic, SVG-based gauge that visually animates to display the calculated "risk score" of your dilemma.
- **Dynamic Theming:** Seamlessly toggle between Light, Dark, and Sepia themes with CSS variables and local persistence.
- **Rich Markdown Rendering:** AI responses are formatted with `react-markdown` for clean, readable analysis.
- **Contextual Follow-ups:** Engage in continuous dialogue with the AI on a specific dilemma without losing previous context.
- **Interactive History Sidebar:** A sliding drawer that remembers past dilemmas, allowing you to instantly reload or delete prior sessions.
- **Account Management:** Full user lifecycle management directly from the UI, including signup, login, profile updates, and secure account deletion.
- **Premium Animations:** Custom keyframe animations (`gradientShift`, `slideUpFade`, `orbitSpin`) provide a tactile, responsive user experience.

---

## 🛡️ Enterprise Security & Backend Hardening

The Node.js backend (`ethics-backend/`) has been heavily hardened against OWASP vulnerabilities and data leaks to support sensitive enterprise operations:

| Vulnerability Addressed | Implementation & Fix |
| :--- | :--- |
| **Plaintext Passwords** | Hashed via `bcrypt` with a high cost factor of 12. |
| **SQL Injection** | 100% of queries use parameterized `?` placeholders. |
| **Timing Attacks** | Login logic runs `bcrypt.compare` even for unknown emails to prevent user enumeration. |
| **Unprotected Routes** | Strict `requireAuth` middleware enforces Bearer token validation on all data routes. |
| **Token Hijacking** | Hardcoded secrets removed; reads from `JWT_SECRET`. Tokens strictly expire in 7 days. |
| **Data Exposure in URLs** | Endpoints (e.g., `GET /api/chats`) strictly read user context from the JWT, never from URL parameters. |
| **DDoS & Brute Force** | Implemented `express-rate-limit` (20 auth attempts / 15 mins; 60 general / 1 min). |
| **Payload Bloat** | Strict request size limit enforced via `express.json({ limit: '16kb' })`. |
| **Malicious Headers / XSS** | Secured via `helmet` to enforce CSP, X-Frame-Options, and X-Content-Type-Options. |
| **Network Exposure** | Server explicitly bound to `127.0.0.1` (localhost only) to prevent external network sniffing. |

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, Tailwind CSS, CSS Custom Properties (Theming)
- **Backend:** Node.js, Express.js, JWT, bcrypt, Helmet
- **Database:** Parameterized SQL (Implementation specific)
- **AI Integration:** Local execution endpoint for generating ethical analyses.

---

## 🚀 Getting Started

### 1. Backend Setup

Open a terminal and navigate to the backend folder:

```bash
cd ethics-backend
npm install

# Setup your environment variables
cp .env.example .env
```
Open the .env file and set your required variables (importantly, provide a long, random string for JWT_SECRET and set FRONTEND_ORIGIN to match your React app's URL).

Start the server:

```bash
node server.js
```

Note: The backend runs securely on port 5000 and is bound to localhost.

2. Frontend Setup
Open a second terminal window and navigate to the UI folder:

```Bash
cd ethics-ui
npm install
npm run dev
```

The frontend application will now be running (typically at http://localhost:5173).

📂 Architecture Overview
```
ai-ethics-advisor/
│
├── ethics-backend/            # Node.js Express API (The Server)
│   ├── .env                   # Environment variables (JWT_SECRET, CORS, etc.)
│   ├── .gitignore             # Git ignore list for backend
│   ├── database.sqlite        # SQLite database for persistence
│   ├── database.sqlite-shm    # SQLite Shared Memory file (Auto-generated)
│   ├── database.sqlite-wal    # SQLite Write-Ahead Log (Auto-generated)
│   ├── package-lock.json      # Exact backend dependency versions
│   ├── package.json           # Backend dependencies & scripts
│   ├── README.md              # Backend-specific documentation & security notes
│   └── server.js              # Main API entry point & security hardening logic
│
└── ethics-ui/                 # React Frontend Application (The Client)
    ├── src/                   # Source code
    │   ├── components/        # Reusable UI modules
    │   │   ├── AccountModal.jsx   # User profile & deletion logic
    │   │   ├── DilemmaInput.jsx   # Interactive prompt input area
    │   │   ├── EthicalRiskMeter.jsx # Animated SVG risk gauge
    │   │   ├── Login.jsx          # Authentication interface
    │   │   ├── ResultsDisplay.jsx # Markdown renderer & follow-ups
    │   │   ├── SettingsModal.jsx  # Theming & preferences
    │   │   └── Sidebar.jsx        # Slide-out history drawer
    │   ├── App.jsx            # Core application state & layout
    │   └── index.css          # Tailwind imports & CSS custom properties
    ├── .gitignore             # Git ignore list for frontend
    ├── index.html             # Main HTML entry point
    ├── package-lock.json      # Exact frontend dependency versions
    ├── package.json           # Frontend dependencies & Vite scripts
    ├── postcss.config.js      # PostCSS configuration for Tailwind
    ├── tailwind.config.js     # Tailwind design system configuration
    └── vite.config.js         # Vite bundler configuration
```
