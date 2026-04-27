# AI Ethics Advisor

## Overview

**AI Ethics Advisor** is a comprehensive ethical analysis platform that leverages local AI models to provide multi-framework ethical evaluations of real-world dilemmas. Built with a security-hardened architecture, it empowers users to analyze complex ethical scenarios using Utilitarian, Deontological, and Virtue Ethics frameworks.

The application combines a sleek, modern React frontend with a robust Node.js backend, featuring enterprise-grade security measures including bcrypt password hashing, JWT authentication with 7-day expiry, rate limiting, helmet security headers, and SQL injection protection.

---

## What It Does

### Core Capabilities

1. **Multi-Framework Ethical Analysis**
   - **Utilitarian Analysis**: Evaluates outcomes based on greatest good for the greatest number
   - **Deontological Analysis**: Assesses duties, rules, and moral obligations
   - **Virtue Ethics Analysis**: Examines character and moral virtue in decision-making

2. **Intelligent Risk Assessment**
   - Calculates ethical risk scores (0-100 scale)
   - Provides confidence scoring for recommendations
   - Visual risk meters with color-coded severity levels

3. **Interactive Dashboard**
   - Risk distribution pie charts
   - Ethical drift timeline tracking
   - Framework coverage radar charts
   - Activity heatmaps for usage patterns
   - Recent analyses with quick access

4. **Follow-Up Conversations**
   - Context-aware follow-up questions
   - Suggested questions for deeper exploration
   - Chat-style interaction with the AI advisor

5. **User Management**
   - Secure account creation and authentication
   - Profile customization (name, email, theme)
   - Account deletion with data cleanup
   - Theme preferences (Dark, Light, Sepia)

6. **History & Persistence**
   - Local storage for analysis history
   - SQLite database for chat persistence
   - Searchable archive of past dilemmas

---

## Tech Stack

### Frontend (ethics-ui/)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^19.2.5 | UI component library |
| **Vite** | ^8.0.1 | Build tool and dev server |
| **Tailwind CSS** | ^4.2.2 | Utility-first styling |
| **Framer Motion** | ^12.38.0 | Animations and transitions |
| **Recharts** | ^3.8.1 | Data visualization charts |
| **React Markdown** | ^10.1.0 | Markdown rendering |
| **Material Symbols** | Latest | Icon library |
| **Manrope/DM Serif/Syne** | Google Fonts | Typography |

### Backend (ethics-backend/)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | Latest | Runtime environment |
| **Express** | ^5.2.1 | Web framework |
| **SQLite3** | ^6.0.1 | Database engine |
| **bcrypt** | ^6.0.0 | Password hashing (cost factor 12) |
| **jsonwebtoken** | ^9.0.3 | JWT authentication |
| **express-rate-limit** | ^7.4.1 | Rate limiting |
| **helmet** | ^8.0.0 | Security headers |
| **cors** | ^2.8.6 | Cross-origin requests |
| **dotenv** | ^17.4.2 | Environment variables |

### AI Model Integration

- **Ollama** - Local LLM inference server
- **Custom Model** - Fine-tuned ethics advisor (my-enterprise-advisor)
- **Streaming Response** - Real-time token generation
- **JSON Format** - Structured response parsing

---

## Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Ollama (for local AI model)
- Git (optional)

### Step 1: Clone or Navigate to Project

```bash
cd "AI ETHICS ADVISOR"
```

### Step 2: Install Backend Dependencies

```bash
cd ethics-backend
npm install
```

### Step 3: Configure Backend Environment

```bash
# Create .env file
cp .env.example .env

# Edit .env and set your JWT secret
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
FRONTEND_ORIGIN="http://localhost:5173"
PORT=5000
```

**Important**: Use a strong, random JWT secret (minimum 32 characters).

### Step 4: Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

The backend will start on `http://127.0.0.1:5000`

### Step 5: Install Frontend Dependencies

```bash
cd ../ethics-ui
npm install
```

### Step 6: Configure Ollama (Required for AI Features)

1. Install Ollama from [ollama.com](https://ollama.com)
2. Pull the required model:
   ```bash
   ollama pull phi-3-mini
   ```
3. Create the custom ethics advisor model:
   ```bash
   cd ../enterprise_ethics_advisor
   ollama create my-enterprise-advisor -f Modelfile
   ```

### Step 7: Start Frontend Development Server

```bash
cd ../ethics-ui
npm run dev
```

The frontend will start on `http://localhost:5173`

### Step 8: Access the Application

Open your browser and navigate to `http://localhost:5173`

---

## Security Features

The backend implements comprehensive security hardening:

| Security Measure | Implementation |
|-----------------|----------------|
| **Authentication** | JWT with 7-day expiry, Bearer token pattern |
| **Password Storage** | bcrypt with cost factor 12 |
| **SQL Injection** | Parameterized queries with `?` placeholders |
| **Rate Limiting** | 20 auth attempts / 15 min, 60 requests / 1 min |
| **Security Headers** | Helmet (X-Frame-Options, CSP, X-Content-Type-Options) |
| **CORS** | Restricted to FRONTEND_ORIGIN env var |
| **Request Size** | Limited to 16KB |
| **Timing Attack Prevention** | Constant-time bcrypt comparison |
| **Input Validation** | Email, password, name length limits enforced |
| **Theme Validation** | Whitelist (light/dark/sepia only) |
| **Network Binding** | 127.0.0.1 only (localhost) |

---

## Usage

### Quick Start

1. **Create an Account**: Sign up with your email and password
2. **Login**: Access your secure dashboard
3. **Analyze a Dilemma**: 
   - Navigate to "New" or click the "+" button
   - Describe your ethical dilemma in detail
   - Include stakeholders, constraints, and consequences
4. **Review Analysis**: Examine the multi-framework analysis
5. **Ask Follow-ups**: Use suggested questions or type your own
6. **Track Progress**: View your moral compass dashboard

### Sample Dilemmas

The dashboard includes quick-start scenarios:
- **Corporate Whistleblowing**: Environmental violations vs. retaliation fears
- **AI Bias in Hiring**: Demographic bias in recruitment tools
- **Medical Triage**: Ventilator allocation decisions
- **Data Privacy Trade-off**: Safety vs. privacy in message scanning

---

## Project Structure

```
AI ETHICS ADVISOR/
├── ethics-ui/              # React Frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DilemmaInput.jsx
│   │   │   ├── ResultsDisplay.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── SettingsModal.jsx
│   │   │   ├── AccountModal.jsx
│   │   │   ├── EthicalRiskMeter.jsx
│   │   │   └── Toast.jsx
│   │   ├── App.jsx         # Main application
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Global styles
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── ethics-backend/         # Node.js Backend
│   ├── server.js           # Express server
│   ├── database.sqlite     # SQLite database
│   ├── .env                # Environment variables
│   └── package.json
├── enterprise_ethics_advisor/  # AI Model
│   ├── Modelfile           # Ollama model definition
│   └── phi-3-mini-4k-instruct.Q4_K_M.gguf
├── Start-Advisor.bat       # Windows startup script
└── README.md
```

---

## API Endpoints

### Authentication

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/signup` | POST | Create new account | No |
| `/api/login` | POST | Authenticate user | No |

### User Management

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/update-profile` | POST | Update name/email/theme | Yes |
| `/api/update-account` | POST | Update account (with password) | Yes |
| `/api/delete-account` | DELETE | Delete account and data | Yes |

### Chat History

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/chats` | GET | Retrieve user's chat history | Yes |
| `/api/chats` | POST | Save new chat | Yes |

---

## UI Themes

### Dark Theme (Default)
- **Surface**: #13131f
- **Background**: #0a0a14
- **Primary**: #818cf8 (indigo glow)
- **Accent**: #e879f9 (pink/magenta)

### Light Theme
- **Surface**: #ffffff
- **Background**: #f0f2ff
- **Primary**: #3730a3 (deep indigo)
- **Accent**: #e879f9

### Sepia Theme
- **Surface**: #f5f0e8
- **Background**: #ede4d3
- **Primary**: #7c4a1e (warm brown)
- **Accent**: #b45309

---

## Development

### Frontend Development

```bash
cd ethics-ui
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview production build
```

### Backend Development

```bash
cd ethics-backend
npm run dev        # Watch mode
npm start          # Production mode
```

### Database

The SQLite database is automatically created on first run. Schema:

**Users Table:**
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- email (TEXT UNIQUE)
- password (TEXT)
- theme (TEXT DEFAULT 'dark')

**Chats Table:**
- id (INTEGER PRIMARY KEY)
- user_email (TEXT)
- prompt (TEXT)
- response (TEXT)
- confidence (INTEGER)
- timestamp (DATETIME)

---

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check JWT_SECRET is set in .env
- Ensure port 5000 is available
- Verify node_modules are installed

**AI responses not working:**
- Ensure Ollama is running: `ollama serve`
- Verify model is created: `ollama list`
- Check model name matches: `my-enterprise-advisor`

**CORS errors:**
- Verify FRONTEND_ORIGIN in backend .env
- Ensure frontend URL matches exactly

**Database locked:**
- Stop and restart the backend server
- Check for multiple instances running

---

## License

ISC License

---

## Credits

Built with ❤️ using React, Express, Ollama, and ethical reasoning.
