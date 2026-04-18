import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import DilemmaInput from './components/DilemmaInput';
import Sidebar from './components/Sidebar';
import ResultsDisplay from './components/ResultsDisplay';
import Login from './components/Login';
import SettingsModal from './components/SettingsModal';
import AccountModal from './components/AccountModal';

function App() {
  // ==========================================
  // STATE MANAGEMENT (Unchanged)
  // ==========================================
  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem('advisorHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loadingStep, setLoadingStep] = useState(0);
  const loadingMessages = [
    "Parsing dilemma context...",
    "Applying Utilitarian framework...",
    "Evaluating Deontological duties...",
    "Consulting Virtue Ethics...",
    "Finalizing recommendations..."
  ];
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const handleDeleteAccount = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('advisorHistory');
    setUser(null);
    setHistory([]);
    setResponse(null);
    setPrompt('');
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [prompt, setPrompt] = useState(() => {
    return localStorage.getItem('currentPrompt') || '';
  });
  const [response, setResponse] = useState(() => {
    const savedResponse = localStorage.getItem('currentResponse');
    return savedResponse ? JSON.parse(savedResponse) : null;
  });
  const [isAnalyzingMain, setIsAnalyzingMain] = useState(false);
  const [isFollowingUp, setIsFollowingUp] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);

  // Abort controllers for stop-generation
  const mainAbortRef = useRef(null);
  const followUpAbortRef = useRef(null);

  // Active nav tracking for animation
  const [activeNav, setActiveNav] = useState('home');
  const [navClickTarget, setNavClickTarget] = useState(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('appTheme') || user?.theme || 'dark';
    document.documentElement.className = savedTheme;
  }, [user]);

  // ==========================================
  // LOGIC & HANDLERS (Unchanged)
  // ==========================================
  useEffect(() => {
    localStorage.setItem('advisorHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (response) {
      localStorage.setItem('currentResponse', JSON.stringify(response));
      localStorage.setItem('currentPrompt', prompt);
    } else {
      localStorage.removeItem('currentResponse');
      localStorage.removeItem('currentPrompt');
    }
  }, [response, prompt]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => setUser(null);

  const handleStopMain = () => {
    if (mainAbortRef.current) {
      mainAbortRef.current.abort();
    }
  };

  const handleStopFollowUp = () => {
    if (followUpAbortRef.current) {
      followUpAbortRef.current.abort();
    }
  };

  const handleAnalyze = async (text) => {
    setPrompt(text);
    setIsAnalyzingMain(true);
    setLoadingStep(0);
    setResponse(null);
    setSuggestedQuestions([]);

    const abortController = new AbortController();
    mainAbortRef.current = abortController;

    try {
      const systemPrompt = `You are the Enterprise Ethics Advisor. 
Analyze the dilemma using Utilitarian, Deontological, and Virtue Ethics.
You MUST respond with ONLY a valid JSON object in this exact format. Do not use markdown code blocks to wrap the JSON:
{
  "title": "A brief, 4-to-5 word summary of the dilemma",
  "enterpriseAnalysis": "An overall philosophical overview and summary of the situation.",
  "confidenceScore": <a number between 0 and 100 representing how confident you are in your analysis>,
  "ethicalRisk": <a number between 0 and 100 representing the ethical risk level of the dilemma, where 0 is no ethical risk (completely safe and ethical) and 100 is extreme ethical risk (severely unethical or harmful)>,
  "utilitarian": "Detailed Utilitarian analysis.",
  "deontological": "Detailed Deontological analysis.",
  "virtue": "Detailed Virtue Ethics analysis.",
  "recommended": "Your final recommended course of action.",
  "suggestedQuestions": ["Follow up question 1?", "Follow up question 2?", "Follow up question 3?"]
}

DILEMMA:
${text}`;

      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          model: 'my-enterprise-advisor',
          prompt: systemPrompt,
          stream: true,
          format: 'json'
        }),
      });

      if (!res.ok) throw new Error("Ollama model failed to respond.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedJSONString = "";
      let chunkCounter = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);
        for (const line of lines) {
          const parsedChunk = JSON.parse(line);
          accumulatedJSONString += parsedChunk.response;
          chunkCounter++;
          const calculatedStep = Math.min(
            Math.floor(chunkCounter / 25),
            loadingMessages.length - 1
          );
          setLoadingStep(calculatedStep);
        }
      }

      const finalData = JSON.parse(accumulatedJSONString);
      const formattedData = {
        enterpriseAnalysis: finalData.enterpriseAnalysis || "Analysis missing.",
        confidenceScore: finalData.confidenceScore || 0,
        ethicalRisk: finalData.ethicalRisk ?? 50,
        utilitarian: finalData.utilitarian || "Data missing.",
        deontological: finalData.deontological || "Data missing.",
        virtue: finalData.virtue || "Data missing.",
        recommended: finalData.recommended || "Data missing.",
        suggestedQuestions: finalData.suggestedQuestions || [],
        chatHistory: []
      };

      setResponse(formattedData);

      const newHistoryItem = {
        id: Date.now().toString(),
        title: finalData.title || "Ethical Dilemma",
        prompt: text,
        result: formattedData,
      };

      const updatedHistory = [newHistoryItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('advisorHistory', JSON.stringify(updatedHistory));

    } catch (error) {
      if (error.name === 'AbortError') {
        // Generation was stopped by user — go back to home/input screen cleanly
        setResponse(null);
        setPrompt('');
      } else {
        console.error("Error parsing model output:", error);
        setResponse({ error: "Failed to connect to model or parse output." });
      }
    } finally {
      setIsAnalyzingMain(false);
      mainAbortRef.current = null;
    }
  };

  const handleReset = () => {
    setPrompt('');
    setResponse(null);
    setActiveNav('home');
  };

  const handleLoadHistory = (historyItem) => {
    setPrompt(historyItem.prompt);
    setResponse(historyItem.result);
    setIsSidebarOpen(false);
  };

  const handleDeleteHistory = (id, e) => {
    e.stopPropagation();
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('advisorHistory', JSON.stringify(updatedHistory));
    if (response && response.id === id) {
      setResponse(null);
      setPrompt('');
    }
  };

  const handleFollowUp = async (followUpText) => {
    setIsFollowingUp(true);
    setResponse(prev => ({ ...prev, suggestedQuestions: [] }));

    const abortController = new AbortController();
    followUpAbortRef.current = abortController;

    try {
      const followUpPrompt = `You are the Enterprise Ethics Advisor.
CONTEXT OF ORIGINAL DILEMMA: "${prompt}"
USER FOLLOW-UP QUESTION: "${followUpText}"

Respond directly to the user's follow-up question. Return ONLY a valid JSON object in this exact format:
{
  "response": "Your detailed answer to the follow up question. Use plain text only. Do not use Markdown or asterisks.",
  "suggestedQuestions": ["New context-aware question 1?", "New context-aware question 2?", "New context-aware question 3?"]
}`;

      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          model: 'my-enterprise-advisor',
          prompt: followUpPrompt,
          stream: false,
          format: 'json'
        }),
      });

      const data = await res.json();
      const parsedData = JSON.parse(data.response);

      setResponse(prev => ({
        ...prev,
        chatHistory: [
          ...(prev.chatHistory || []),
          { user: followUpText, ai: parsedData.response }
        ],
        suggestedQuestions: parsedData.suggestedQuestions || []
      }));

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Error with follow up:", error);
      }
    } finally {
      setIsFollowingUp(false);
      followUpAbortRef.current = null;
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex min-h-screen bg-background text-on-surface font-body overflow-x-hidden">

      {/* Ambient background blobs */}
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />

      {/* DESKTOP SIDEBAR NAV */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-20 flex-col items-center py-8 z-40"
        style={{ background: 'var(--surface-container-lowest)', borderRight: '1px solid var(--outline-variant)' }}>

        {/* Avatar / Logo */}
        <button
          onClick={() => { setIsAccountOpen(true); setActiveNav('account'); }}
          className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-lg mb-10 shadow-lg transition-all duration-300 hover:scale-110 hover:rounded-xl active:scale-90 group"
          style={{ background: 'var(--primary)', boxShadow: '0 6px 20px var(--primary-glow)' }}
          title="Account"
        >
          <span className="transition-all duration-300 group-hover:opacity-0 absolute">{user.name.charAt(0).toUpperCase()}</span>
          <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 absolute transition-all duration-300">manage_accounts</span>
        </button>

        <nav className="flex flex-col gap-2 w-full px-2 flex-1">
          {/* New Chat */}
          <button
            onClick={() => { handleReset(); setActiveNav('home'); }}
            className="nav-btn flex flex-col items-center py-3 px-1 w-full group"
            title="New Chat"
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rounded-xl group-active:scale-90"
              style={{ background: 'var(--primary)', boxShadow: '0 4px 14px var(--primary-glow)' }}>
              <span className="material-symbols-outlined text-xl text-white transition-transform duration-300 group-hover:rotate-90">add</span>
            </div>
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider" style={{ color: 'var(--primary)' }}>New</span>
          </button>

          {/* Home */}
          <button
            onClick={() => { handleReset(); setActiveNav('home'); }}
            className={`nav-btn flex flex-col items-center py-3 px-1 w-full ${activeNav === 'home' ? 'active' : ''}`}
            title="Home"
          >
            <span className="material-symbols-outlined text-2xl nav-icon" style={{ color: activeNav === 'home' ? 'var(--primary)' : 'var(--on-surface-variant)' }}>dashboard</span>
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider" style={{ color: activeNav === 'home' ? 'var(--primary)' : 'var(--on-surface-variant)' }}>Home</span>
          </button>

          {/* Archive */}
          <button
            onClick={() => { setIsSidebarOpen(true); setActiveNav('history'); }}
            className={`nav-btn flex flex-col items-center py-3 px-1 w-full ${activeNav === 'history' ? 'active' : ''}`}
            title="Archive"
          >
            <span className="material-symbols-outlined text-2xl nav-icon" style={{ color: activeNav === 'history' ? 'var(--primary)' : 'var(--on-surface-variant)' }}>history</span>
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider" style={{ color: activeNav === 'history' ? 'var(--primary)' : 'var(--on-surface-variant)' }}>Archive</span>
          </button>
        </nav>

        {/* Settings at bottom */}
        <button
          onClick={() => { setIsSettingsOpen(true); setActiveNav('settings'); }}
          className={`nav-btn flex flex-col items-center py-3 px-1 w-full px-2 ${activeNav === 'settings' ? 'active' : ''}`}
          title="Settings"
        >
          <span className="material-symbols-outlined text-2xl nav-icon" style={{ color: activeNav === 'settings' ? 'var(--primary)' : 'var(--on-surface-variant)', transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), color 0.25s' }}>settings</span>
          <span className="text-[9px] font-bold mt-1 uppercase tracking-wider" style={{ color: activeNav === 'settings' ? 'var(--primary)' : 'var(--on-surface-variant)' }}>Config</span>
        </button>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full px-6 py-3 flex justify-between items-center z-50"
        style={{ background: 'rgba(var(--surface-container-lowest-rgb, 19,19,31), 0.92)', backdropFilter: 'blur(16px)', borderTop: '1px solid var(--outline-variant)' }}>
        <button onClick={() => { handleReset(); }} className="nav-btn flex flex-col items-center" style={{ color: 'var(--primary)' }}>
          <span className="material-symbols-outlined nav-icon">dashboard</span>
          <span className="text-[9px] font-bold mt-0.5 uppercase tracking-wide">Home</span>
        </button>

        <div className="relative -top-7">
          <button
            onClick={handleReset}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl active:scale-90 transition-all duration-300 hover:scale-110"
            style={{ background: 'var(--primary)', boxShadow: '0 6px 24px var(--primary-glow)' }}
          >
            <span className="material-symbols-outlined text-3xl" style={{ transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>add</span>
          </button>
        </div>

        <button onClick={() => setIsSidebarOpen(true)} className="nav-btn flex flex-col items-center" style={{ color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined nav-icon">history</span>
          <span className="text-[9px] font-bold mt-0.5 uppercase tracking-wide">Archive</span>
        </button>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-20 relative min-h-screen pb-28 md:pb-0" style={{ zIndex: 1 }}>
        <div className="grain-overlay" />

        {/* Top Header Bar */}
        <header className="w-full px-6 md:px-12 py-5 flex justify-between items-center relative z-20">
          <div className="md:hidden">
            <h1 className="text-xl font-headline font-bold" style={{ color: 'var(--on-surface)' }}>
              Ethos<span style={{ color: 'var(--primary)' }}>Intelligence</span>
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-3 flex-1">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--primary)' }} />
            <span className="text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
              Ethics Advisor v2
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-semibold flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 group"
            style={{ color: 'var(--on-surface-variant)', border: '1px solid var(--outline-variant)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.borderColor = 'var(--error)'; e.currentTarget.style.background = 'var(--error-container)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--on-surface-variant)'; e.currentTarget.style.borderColor = 'var(--outline-variant)'; e.currentTarget.style.background = 'transparent'; }}
          >
            Sign Out
            <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:translate-x-1">logout</span>
          </button>
        </header>

        {/* Central content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-2 pb-12 relative z-10">

          {/* STATE A: INPUT */}
          {!response && !isAnalyzingMain && (
            <div style={{ animation: 'slideUpFade 0.45s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <div className="mb-10">
                <p className="text-sm font-mono font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>
                  {getGreeting()}, {user.name.split(' ')[0]}
                </p>
                <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tight mb-3" style={{ color: 'var(--on-surface)', lineHeight: 1.1 }}>
                  What ethical dilemma<br />
                  <em style={{ color: 'var(--primary)' }}>requires analysis</em>?
                </h2>
                <p className="text-base" style={{ color: 'var(--on-surface-variant)' }}>
                  Present your situation in full detail — stakeholders, constraints, consequences.
                </p>
              </div>
              <DilemmaInput onAnalyze={handleAnalyze} />
            </div>
          )}

          {/* STATE B: LOADING */}
          {isAnalyzingMain && (
            <div className="flex flex-col items-center justify-center py-24" style={{ animation: 'scaleIn 0.4s ease-out' }}>
              {/* Orbital loader */}
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 rounded-full border-2 border-transparent"
                  style={{ borderTopColor: 'var(--primary)', animation: 'orbitSpin 1.4s linear infinite' }} />
                <div className="absolute inset-3 rounded-full border-2 border-transparent"
                  style={{ borderTopColor: 'var(--accent, #e879f9)', animation: 'orbitSpin 2s linear infinite reverse' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--primary)', boxShadow: '0 0 30px var(--primary-glow)' }}>
                    <span className="material-symbols-outlined text-white text-lg">psychology</span>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-headline font-bold mb-3" style={{ color: 'var(--on-surface)' }}>
                Curating Insights
              </h3>

              <p className="font-mono text-sm font-semibold h-7 transition-all duration-500" style={{ color: 'var(--primary)' }}>
                {loadingMessages[loadingStep]}
              </p>

              <div className="w-full max-w-sm mt-5">
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  {loadingMessages.map((_, i) => (
                    <div key={i}
                      className="w-2 h-2 rounded-full transition-all duration-500"
                      style={{
                        background: i <= loadingStep ? 'var(--primary)' : 'var(--outline-variant)',
                        transform: i === loadingStep ? 'scale(1.4)' : 'scale(1)'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Stop generating button */}
              <button
                onClick={handleStopMain}
                className="mt-8 flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-95 group"
                style={{
                  border: '1px solid var(--error)',
                  color: 'var(--error)',
                  background: 'transparent',
                  animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.6s both',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--error-container)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:scale-110">stop_circle</span>
                Stop Generating
              </button>
            </div>
          )}

          {/* STATE C: RESULTS */}
          {response && !isAnalyzingMain && (
            <div style={{ animation: 'slideUpFade 0.45s cubic-bezier(0.34,1.56,0.64,1)' }}>
              {response?.dilemmaSummary && (
                <div className="mb-8 pb-6" style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                  <h2 className="text-3xl md:text-4xl font-headline font-bold mb-2" style={{ color: 'var(--on-surface)' }}>
                    {response.dilemmaSummary}
                  </h2>
                  <p className="text-base italic opacity-70" style={{ color: 'var(--on-surface-variant)' }}>
                    "{prompt}"
                  </p>
                </div>
              )}
              <ResultsDisplay
                response={response}
                onReset={handleReset}
                onFollowUp={handleFollowUp}
                onStopFollowUp={handleStopFollowUp}
                isLoading={isFollowingUp}
              />
            </div>
          )}

        </div>
      </main>

      {/* OVERLAYS */}
      {isSidebarOpen && (
        <Sidebar
          history={history}
          onClose={() => { setIsSidebarOpen(false); setActiveNav('home'); }}
          onSelect={handleLoadHistory}
          onDelete={handleDeleteHistory}
        />
      )}
      {isSettingsOpen && (
        <SettingsModal
          user={user}
          onSave={setUser}
          onClose={() => { setIsSettingsOpen(false); setActiveNav('home'); }}
        />
      )}
      {isAccountOpen && (
        <AccountModal
          user={user}
          onUpdate={setUser}
          onDeleteAccount={handleDeleteAccount}
          onClose={() => { setIsAccountOpen(false); setActiveNav('home'); }}
        />
      )}
    </div>
  );
}

export default App;
