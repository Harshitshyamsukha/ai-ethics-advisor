import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password || (isSignUp && !name)) {
      setError("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    const endpoint = isSignUp ? 'http://localhost:5000/api/signup' : 'http://localhost:5000/api/login';
    const payload = isSignUp ? { name, email, password } : { email, password };
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Authentication failed. Please verify your clearance.");
        setIsSubmitting(false);
        return;
      }
      if (onLogin) onLogin(data.user || data);
    } catch (err) {
      console.error("Network Error:", err);
      setError("Cannot connect to the identity server. Is your backend running?");
      setIsSubmitting(false);
    }
  };

  const fieldStyle = (field) => ({
    width: '100%',
    background: 'var(--surface-container-low)',
    border: `1px solid ${focusedField === field ? 'var(--primary)' : 'var(--outline-variant)'}`,
    borderRadius: '12px',
    padding: '12px 14px 12px 44px',
    color: 'var(--on-surface)',
    fontFamily: 'inherit',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxShadow: focusedField === field ? '0 0 0 3px var(--primary-glow)' : 'none',
    transform: focusedField === field ? 'translateY(-1px)' : 'translateY(0)',
  });

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 relative overflow-hidden"
      style={{ background: 'var(--background)' }}>
      <div className="grain-overlay" />

      {/* Ambient blobs */}
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />

      {/* Logo & title */}
      <div className="relative z-10 text-center mb-8" style={{ animation: 'slideUpFade 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4 mx-auto"
          style={{
            background: 'var(--primary)',
            boxShadow: '0 8px 32px var(--primary-glow)',
            animation: 'scaleInBounce 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both'
          }}>
          <span className="material-symbols-outlined text-3xl text-white">balance</span>
        </div>
        <h1 className="text-4xl font-headline font-bold mb-1" style={{ color: 'var(--on-surface)' }}>
          Ethos<span style={{ color: 'var(--primary)' }}>Intelligence</span>
        </h1>
        <p className="text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
          Secure Access Portal
        </p>
      </div>

      {/* Card */}
      <div className="relative z-10 mx-auto w-full max-w-[440px]">
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'var(--surface-container-lowest)',
            border: '1px solid var(--outline-variant)',
            boxShadow: '0 20px 80px -20px var(--primary-glow), 0 4px 32px rgba(0,0,0,0.12)',
            animation: 'modalBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s both',
          }}
        >
          {/* Mode toggle tab */}
          <div className="flex" style={{ borderBottom: '1px solid var(--outline-variant)' }}>
            {['Sign In', 'Sign Up'].map((tab, i) => (
              <button
                key={tab}
                onClick={() => { setIsSignUp(i === 1); setError(''); }}
                className="flex-1 py-4 text-sm font-bold transition-all duration-300 relative"
                style={{
                  color: (isSignUp ? i === 1 : i === 0) ? 'var(--primary)' : 'var(--on-surface-variant)',
                  background: (isSignUp ? i === 1 : i === 0) ? 'var(--surface-container-low)' : 'transparent',
                }}
              >
                {tab}
                {(isSignUp ? i === 1 : i === 0) && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: 'var(--primary)', animation: 'scaleInBounce 0.3s ease-out' }} />
                )}
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* Error */}
            {error && (
              <div className="mb-5 p-3 rounded-xl text-sm font-medium flex items-center gap-2"
                style={{ background: 'var(--error-container)', color: 'var(--error)', border: '1px solid var(--error)', animation: 'popIn 0.3s ease-out' }}>
                <span className="material-symbols-outlined text-sm">warning</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Name (sign up only) */}
              {isSignUp && (
                <div style={{ animation: 'slideDownFade 0.3s ease-out' }}>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--on-surface-variant)', fontFamily: '"JetBrains Mono", monospace' }}>
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-3 text-lg pointer-events-none"
                      style={{ color: focusedField === 'name' ? 'var(--primary)' : 'var(--on-surface-variant)', transition: 'color 0.3s' }}>
                      person
                    </span>
                    <input
                      type="text" value={name} onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                      style={fieldStyle('name')} placeholder="Jane Doe"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--on-surface-variant)', fontFamily: '"JetBrains Mono", monospace' }}>
                  Clearance ID
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-lg pointer-events-none"
                    style={{ color: focusedField === 'email' ? 'var(--primary)' : 'var(--on-surface-variant)', transition: 'color 0.3s' }}>
                    badge
                  </span>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                    style={fieldStyle('email')} placeholder="identifier@ethos.network"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)', fontFamily: '"JetBrains Mono", monospace' }}>
                    Security Key
                  </label>
                  {!isSignUp && (
                    <a href="#" className="text-xs font-semibold transition-colors hover:underline" style={{ color: 'var(--primary)' }}>
                      Recover Key?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-lg pointer-events-none"
                    style={{ color: focusedField === 'password' ? 'var(--primary)' : 'var(--on-surface-variant)', transition: 'color 0.3s' }}>
                    key
                  </span>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                    style={fieldStyle('password')} placeholder="••••••••••••"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 mt-1 disabled:opacity-60"
                style={{ fontSize: '15px' }}
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-lg" style={{ animation: 'orbitSpin 1s linear infinite' }}>sync</span>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">{isSignUp ? 'how_to_reg' : 'lock_open'}</span>
                    <span>{isSignUp ? 'Establish Identity' : 'Authenticate'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs mt-5" style={{ color: 'var(--on-surface-variant)', animation: 'fadeIn 0.5s ease 0.5s both' }}>
          Secured by enterprise-grade ethical frameworks
        </p>
      </div>
    </div>
  );
};

export default Login;
