import React, { useState, useEffect } from 'react';

const SettingsModal = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [initialTheme] = useState(() => localStorage.getItem('appTheme') || user?.theme || 'dark');
  const [theme, setTheme] = useState(initialTheme);
  const [isUpdating, setIsUpdating] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const handleSave = async () => {
    setIsUpdating(true);
    if (onSave) onSave({ ...user, name, email, theme });
    localStorage.setItem('appTheme', theme);
    document.documentElement.className = theme;
    try {
      await fetch('http://localhost:5000/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, newName: name, newEmail: email, theme })
      });
    } catch (err) {
      console.log("Backend profile update skipped.");
    } finally {
      setIsUpdating(false);
      onClose();
    }
  };

  const handleCancel = () => {
    document.documentElement.className = initialTheme;
    onClose();
  };

  const themes = [
    { key: 'light', label: 'Light', icon: 'light_mode', bg: '#f0f2ff', color: '#3730a3' },
    { key: 'dark',  label: 'Dark',  icon: 'dark_mode',  bg: '#0a0a14', color: '#818cf8' },
    { key: 'sepia', label: 'Archival', icon: 'history_edu', bg: '#ede4d3', color: '#7c4a1e' },
  ];

  const inputStyle = (field) => ({
    width: '100%', background: 'var(--surface-container-low)',
    border: `1px solid ${focusedField === field ? 'var(--primary)' : 'var(--outline-variant)'}`,
    borderRadius: '10px', padding: '11px 14px',
    color: 'var(--on-surface)', fontFamily: 'inherit', fontSize: '14px',
    outline: 'none', transition: 'all 0.3s ease',
    boxShadow: focusedField === field ? '0 0 0 3px var(--primary-glow)' : 'none',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden modal-card"
        style={{
          background: 'var(--surface-container-lowest)',
          border: '1px solid var(--outline-variant)',
          boxShadow: '0 24px 80px -16px rgba(0,0,0,0.3)',
        }}>

        {/* Header */}
        <div className="px-6 py-5 flex justify-between items-center"
          style={{ borderBottom: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--primary)', boxShadow: '0 4px 12px var(--primary-glow)' }}>
              <span className="material-symbols-outlined text-white text-base">settings</span>
            </div>
            <h2 className="text-base font-headline font-bold" style={{ color: 'var(--on-surface)' }}>Preferences</h2>
          </div>
          <button onClick={handleCancel}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90 hover:rotate-90"
            style={{ color: 'var(--on-surface-variant)', border: '1px solid var(--outline-variant)' }}>
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: 'var(--on-surface-variant)', fontFamily: '"JetBrains Mono",monospace' }}>
              Display Name
            </label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
              style={inputStyle('name')}
            />
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'var(--on-surface-variant)', fontFamily: '"JetBrains Mono",monospace' }}>
              Interface Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              {themes.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key)}
                  className={`theme-btn py-4 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold ${theme === t.key ? 'active' : ''}`}
                  style={{
                    background: t.bg,
                    border: `2px solid ${theme === t.key ? t.color : 'transparent'}`,
                    color: t.color,
                    boxShadow: theme === t.key ? `0 6px 20px ${t.color}40` : 'none',
                  }}
                >
                  <span className="material-symbols-outlined text-xl" style={{ color: t.color }}>{t.icon}</span>
                  {t.label}
                  {theme === t.key && (
                    <span className="material-symbols-outlined text-sm" style={{ animation: 'popIn 0.3s ease-out' }}>check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 flex justify-end gap-3"
          style={{ borderTop: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)' }}>
          <button onClick={handleCancel}
            className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ color: 'var(--on-surface-variant)', border: '1px solid var(--outline-variant)' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={isUpdating}
            className="btn-primary px-6 py-2 text-sm flex items-center gap-2 disabled:opacity-60">
            {isUpdating ? (
              <>
                <span className="material-symbols-outlined text-sm" style={{ animation: 'orbitSpin 1s linear infinite' }}>sync</span>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
