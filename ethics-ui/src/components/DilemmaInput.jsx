import React, { useState, useEffect, useRef } from 'react';

const DilemmaInput = ({ onAnalyze, isLoading, prompt }) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (prompt) setText(prompt);
  }, [prompt]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !isLoading) onAnalyze(text);
  };

  const charPercent = Math.min((text.length / 1000) * 100, 100);

  return (
    <div
      className="rounded-3xl overflow-hidden transition-all duration-500"
      style={{
        background: 'var(--surface-container-lowest)',
        border: `1px solid ${isFocused ? 'var(--primary)' : 'var(--outline-variant)'}`,
        boxShadow: isFocused ? '0 0 0 3px var(--primary-glow), 0 20px 60px -16px var(--primary-glow)' : '0 4px 24px -8px rgba(0,0,0,0.08)',
        transform: isFocused ? 'translateY(-2px)' : 'translateY(0)',
        animation: 'slideUpFade 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-4 px-6 pt-6 pb-4">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500"
          style={{
            background: isFocused ? 'var(--primary)' : 'var(--surface-container-low)',
            transform: isFocused ? 'scale(1.1) rotate(-5deg)' : 'scale(1) rotate(0deg)',
            boxShadow: isFocused ? '0 6px 16px var(--primary-glow)' : 'none',
          }}
        >
          <span className="material-symbols-outlined text-xl transition-colors duration-300"
            style={{ color: isFocused ? 'white' : 'var(--primary)' }}>balance</span>
        </div>
        <div>
          <h2 className="text-lg font-headline font-bold" style={{ color: 'var(--on-surface)' }}>Dilemma Context</h2>
          <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
            Provide maximum detail regarding stakeholders and constraints.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Textarea */}
        <div className="px-6 pb-4">
          <textarea
            ref={textareaRef}
            className="w-full p-4 rounded-2xl text-sm leading-relaxed resize-none transition-all duration-300 focus:outline-none"
            style={{
              background: 'var(--surface-container-low)',
              color: 'var(--on-surface)',
              border: '1px solid transparent',
              minHeight: '160px',
              fontFamily: 'inherit',
            }}
            placeholder="e.g., We discovered a subtle bias in our hiring algorithm favoring a specific demographic. Disabling it halts global recruitment for 3 weeks..."
            rows="5"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading}
          />
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between gap-4">
          {/* Char count with animated arc */}
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <svg viewBox="0 0 32 32" className="w-8 h-8 -rotate-90">
                <circle cx="16" cy="16" r="12" fill="none" strokeWidth="2.5"
                  style={{ stroke: 'var(--outline-variant)' }} />
                <circle cx="16" cy="16" r="12" fill="none" strokeWidth="2.5"
                  strokeDasharray={`${2 * Math.PI * 12}`}
                  strokeDashoffset={`${2 * Math.PI * 12 * (1 - charPercent / 100)}`}
                  strokeLinecap="round"
                  style={{
                    stroke: charPercent > 80 ? 'var(--error)' : 'var(--primary)',
                    transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease'
                  }}
                />
              </svg>
            </div>
            <span className="text-xs font-mono font-semibold transition-colors duration-300"
              style={{ color: charPercent > 80 ? 'var(--error)' : 'var(--on-surface-variant)' }}>
              {text.length} chars
            </span>
          </div>

          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className="btn-primary flex items-center gap-2 px-7 py-3 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span>Analyze</span>
            <span className="material-symbols-outlined text-sm btn-icon">arrow_forward</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default DilemmaInput;
