import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import EthicalRiskMeter from './EthicalRiskMeter';

const ResultsDisplay = ({ response, onReset, onFollowUp, onStopFollowUp, isLoading }) => {
  const [followUpText, setFollowUpText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response?.chatHistory, isLoading]);

  if (!response) return null;

  if (response.error) {
    return (
      <div className="rounded-3xl p-8 text-center" style={{
        background: 'var(--error-container)',
        border: '1px solid var(--error)',
        animation: 'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)'
      }}>
        <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color: 'var(--error)' }}>error</span>
        <p className="font-bold" style={{ color: 'var(--on-error-container)' }}>{response.error}</p>
      </div>
    );
  }

  const handleFollowUpSubmit = (e) => {
    e.preventDefault();
    if (followUpText.trim() && !isLoading) {
      onFollowUp(followUpText);
      setFollowUpText('');
    }
  };

  const handleSuggestionClick = (question) => {
    if (isLoading) return;
    setFollowUpText(question);
    if (inputRef.current) inputRef.current.focus();
  };

  const frameworks = [
    { key: 'utilitarian', label: 'Utilitarian', icon: 'group', text: response.utilitarian },
    { key: 'deontological', label: 'Deontological', icon: 'gavel', text: response.deontological },
    { key: 'virtue', label: 'Virtue Ethics', icon: 'self_improvement', text: response.virtue },
  ];

  return (
    <div className="flex flex-col gap-7 w-full max-w-4xl mx-auto pb-20">

      {/* Row 1: Overview + Risk Meter + Confidence */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 card-stagger-1">

        {/* Overview */}
        <div className="md:col-span-2 p-7 rounded-3xl framework-card"
          style={{
            background: 'var(--surface-container-lowest)',
            border: '1px solid var(--outline-variant)',
          }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-base card-icon" style={{ color: 'var(--primary)' }}>analytics</span>
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
              Philosophical Analysis
            </h3>
          </div>
          <p className="text-base leading-relaxed" style={{ color: 'var(--on-surface)' }}>
            {response.enterpriseAnalysis}
          </p>
        </div>

        {/* Ethical Risk Meter */}
        <EthicalRiskMeter risk={response.ethicalRisk ?? 50} />

        {/* Confidence Badge */}
        <div className="confidence-badge">
          <div className="confidence-label">Confidence</div>
          <div className="confidence-value">{response.confidenceScore}%</div>
          <div className="mt-3 w-full">
            <div className="progress-bar" style={{ height: '4px' }}>
              <div className="progress-bar-fill" style={{ width: `${response.confidenceScore}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Framework Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {frameworks.map((fw, i) => (
          <div
            key={fw.key}
            className={`p-6 rounded-2xl framework-card card-stagger-${i + 2}`}
            style={{
              background: 'var(--surface-container-low)',
              border: '1px solid var(--outline-variant)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-xl card-icon" style={{ color: 'var(--primary)' }}>
                {fw.icon}
              </span>
              <h4 className="font-bold text-sm" style={{ color: 'var(--on-surface)' }}>{fw.label}</h4>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>{fw.text}</p>
          </div>
        ))}
      </div>

      {/* Row 3: Recommended */}
      <div className="p-7 rounded-3xl recommended-card card-stagger-5"
        style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-base card-icon" style={{ color: 'var(--primary)' }}>assistant_direction</span>
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
            Recommended Course of Action
          </h3>
        </div>
        <p className="text-base font-semibold leading-relaxed" style={{ color: 'var(--on-surface)' }}>
          {response.recommended}
        </p>
      </div>

      {/* Chat history */}
      <div className="mt-4" style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '28px' }}>

        {response.chatHistory && response.chatHistory.map((pair, index) => {
          if (!pair) return null;
          return (
            <React.Fragment key={index}>
              {pair.user && (
                <div className="mb-5 flex justify-end chat-bubble-user">
                  <div className="px-5 py-3 max-w-[85%] rounded-2xl rounded-br-sm text-sm font-medium"
                    style={{ background: 'var(--primary)', color: 'white', boxShadow: '0 4px 16px var(--primary-glow)' }}>
                    {pair.user}
                  </div>
                </div>
              )}
              {pair.ai && (
                <div className="mb-5 flex justify-start chat-bubble-ai">
                  <div className="px-5 py-4 max-w-[85%] rounded-2xl rounded-bl-sm text-sm"
                    style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-sm" style={{ color: 'var(--primary)' }}>psychology</span>
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Advisor Insight</span>
                    </div>
                    <div className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--on-surface)' }}>
                      <ReactMarkdown>{pair.ai}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex flex-col items-start gap-3 mb-5">
            <div className="flex justify-start" style={{ animation: 'chatBubbleIn 0.3s ease-out' }}>
              <div className="px-5 py-4 rounded-2xl rounded-bl-sm flex items-center gap-3"
                style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)' }}>
                <span className="material-symbols-outlined text-sm" style={{ color: 'var(--primary)', animation: 'orbitSpin 1s linear infinite' }}>sync</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--on-surface-variant)' }}>Processing</span>
                <div className="flex gap-1 ml-1">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
            {/* Stop follow-up button */}
            <button
              onClick={onStopFollowUp}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 hover:scale-105 active:scale-95 group"
              style={{
                border: '1px solid var(--error)',
                color: 'var(--error)',
                background: 'transparent',
                animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.25s both',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--error-container)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:scale-110">stop_circle</span>
              Stop Responding
            </button>
          </div>
        )}
        <div ref={chatEndRef} />

        {/* Suggested questions */}
        {response.suggestedQuestions && response.suggestedQuestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {response.suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(q)}
                className="suggestion-pill text-xs font-semibold px-4 py-2 rounded-full"
                style={{
                  background: 'var(--surface-container-lowest)',
                  border: '1px solid var(--outline-variant)',
                  color: 'var(--primary)',
                  animationDelay: `${idx * 0.08}s`,
                }}
              >
                <span style={{ position: 'relative', zIndex: 1 }}>{q}</span>
              </button>
            ))}
          </div>
        )}

        {/* Follow-up input */}
        <form onSubmit={handleFollowUpSubmit}>
          <div className="flex gap-3 items-center p-2 rounded-2xl transition-all duration-300"
            style={{
              background: 'var(--surface-container-low)',
              border: `1px solid ${inputFocused ? 'var(--primary)' : 'var(--outline-variant)'}`,
              boxShadow: inputFocused ? '0 0 0 3px var(--primary-glow)' : 'none',
            }}>
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none"
              style={{ color: 'var(--on-surface)', fontFamily: 'inherit' }}
              placeholder="Ask a follow-up question..."
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!followUpText.trim() || isLoading}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 disabled:opacity-40 hover:scale-110 active:scale-90"
              style={{ background: 'var(--primary)', color: 'white', boxShadow: '0 4px 12px var(--primary-glow)' }}
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </div>
        </form>

        {/* New analysis button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 group"
            style={{ color: 'var(--on-surface-variant)', border: '1px solid var(--outline-variant)' }}
          >
            <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:-rotate-90">refresh</span>
            New Analysis
          </button>
        </div>
      </div>

    </div>
  );
};

export default ResultsDisplay;
