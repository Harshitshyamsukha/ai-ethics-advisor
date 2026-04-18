import React, { useState } from 'react';

const AccountModal = ({ user, onClose, onUpdate, onDeleteAccount }) => {
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsUpdating(true);

    try {
      const payload = {
        oldEmail: user?.email,
        newEmail: email,
      };
      // Only include password fields if the user actually typed a new one
      if (password) {
        payload.newPassword = password;
      }

      const response = await fetch('http://localhost:5000/api/update-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update account. Is your backend running?");
        setIsUpdating(false);
        return;
      }

      // Update frontend state with new email
      if (onUpdate) onUpdate({ ...user, email });

      setSuccess(password ? "Email and password updated!" : "Email updated successfully!");
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => onClose(), 1600);

    } catch (err) {
      // Backend not running — update email locally only, can't update password without backend
      console.warn("Backend unavailable, updating email locally only:", err);
      if (password) {
        setError("Cannot update password — backend is not reachable. Email updated locally.");
      } else {
        if (onUpdate) onUpdate({ ...user, email });
        setSuccess("Email updated locally.");
        setTimeout(() => onClose(), 1600);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      await fetch('http://localhost:5000/api/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email }),
      }).catch(() => {}); // swallow network error — wipe locally regardless
      if (onDeleteAccount) onDeleteAccount();
      onClose();
    } catch (err) {
      setError("Failed to delete account.");
      setIsUpdating(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    background: 'var(--surface-container-low)',
    border: `1px solid ${focusedField === field ? 'var(--primary)' : 'var(--outline-variant)'}`,
    borderRadius: '10px',
    padding: '11px 14px',
    color: 'var(--on-surface)',
    fontFamily: 'inherit',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
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
              <span className="material-symbols-outlined text-white text-base">manage_accounts</span>
            </div>
            <h2 className="text-base font-headline font-bold" style={{ color: 'var(--on-surface)' }}>Account Security</h2>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90 hover:rotate-90"
            style={{ color: 'var(--on-surface-variant)', border: '1px solid var(--outline-variant)' }}>
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave}>
          <div className="p-6 flex flex-col gap-5">

            {error && (
              <div className="p-3 rounded-xl text-sm font-medium flex items-center gap-2"
                style={{ background: 'var(--error-container)', color: 'var(--error)', border: '1px solid var(--error)', animation: 'popIn 0.3s ease-out' }}>
                <span className="material-symbols-outlined text-sm">warning</span>
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-xl text-sm font-medium flex items-center gap-2"
                style={{ background: 'rgba(34,197,94,0.1)', color: 'rgb(34,197,94)', border: '1px solid rgba(34,197,94,0.3)', animation: 'popIn 0.3s ease-out' }}>
                <span className="material-symbols-outlined text-sm">check_circle</span>
                {success}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: 'var(--on-surface-variant)', fontFamily: '"JetBrains Mono",monospace' }}>
                Account Email
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                style={inputStyle('email')}
              />
            </div>

            {/* Password section */}
            <div className="pt-4 flex flex-col gap-4" style={{ borderTop: '1px solid var(--outline-variant)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--on-surface-variant)' }}>
                Leave password fields blank to keep your current password.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--on-surface-variant)', fontFamily: '"JetBrains Mono",monospace' }}>
                  New Password
                </label>
                <input
                  type="password" placeholder="Min. 6 characters"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                  style={inputStyle('password')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--on-surface-variant)', fontFamily: '"JetBrains Mono",monospace' }}>
                  Confirm Password
                </label>
                <input
                  type="password" placeholder="Re-enter new password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirm')} onBlur={() => setFocusedField(null)}
                  style={inputStyle('confirm')}
                />
                {/* Live match indicator */}
                {password && confirmPassword && (
                  <p className="text-xs mt-2 flex items-center gap-1 font-semibold"
                    style={{
                      color: password === confirmPassword ? 'rgb(34,197,94)' : 'var(--error)',
                      animation: 'fadeIn 0.2s ease-out',
                    }}>
                    <span className="material-symbols-outlined text-sm">
                      {password === confirmPassword ? 'check_circle' : 'cancel'}
                    </span>
                    {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>
            </div>

            {/* Delete confirm zone */}
            {showDeleteConfirm && (
              <div className="p-4 rounded-2xl"
                style={{ background: 'var(--error-container)', border: '1px solid var(--error)', animation: 'scaleIn 0.3s ease-out' }}>
                <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--error)' }}>
                  <span className="material-symbols-outlined text-base">warning</span>
                  This permanently deletes all your data. Continue?
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{ border: '1px solid var(--outline-variant)', color: 'var(--on-surface-variant)' }}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleDelete} disabled={isUpdating}
                    className="flex-1 py-2 rounded-full text-sm font-bold text-white transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-60"
                    style={{ background: 'var(--error)' }}>
                    Yes, Delete
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-5 flex justify-between items-center"
            style={{ borderTop: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)' }}>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isUpdating || showDeleteConfirm}
              className="text-sm font-bold flex items-center gap-1 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 group"
              style={{ color: 'var(--error)' }}
            >
              <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:rotate-12">delete_forever</span>
              Delete Account
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
                style={{ color: 'var(--on-surface-variant)', border: '1px solid var(--outline-variant)' }}>
                Cancel
              </button>
              <button type="submit" disabled={isUpdating}
                className="btn-primary px-6 py-2 text-sm flex items-center gap-2 disabled:opacity-60">
                {isUpdating ? (
                  <>
                    <span className="material-symbols-outlined text-sm" style={{ animation: 'orbitSpin 1s linear infinite' }}>sync</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">save</span>
                    Update
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountModal;
