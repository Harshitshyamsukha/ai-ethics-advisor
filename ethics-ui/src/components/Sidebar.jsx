import React, { useEffect, useState } from 'react';

const Sidebar = ({ history = [], onClose, onSelect, onDelete }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 370);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 cursor-pointer sidebar-backdrop"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-screen w-full md:w-[400px] z-50 flex flex-col"
        style={{
          background: 'var(--surface-container-lowest)',
          borderLeft: '1px solid var(--outline-variant)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.25)',
          transform: visible ? 'translateX(0)' : 'translateX(110%)',
          transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex justify-between items-center flex-shrink-0"
          style={{ borderBottom: '1px solid var(--outline-variant)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--primary)', boxShadow: '0 4px 12px var(--primary-glow)' }}>
              <span className="material-symbols-outlined text-white text-base">history</span>
            </div>
            <div>
              <h2 className="text-sm font-headline font-bold" style={{ color: 'var(--on-surface)' }}>Archive</h2>
              <p className="text-[10px] font-mono" style={{ color: 'var(--on-surface-variant)' }}>{history.length} records</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90 hover:rotate-90"
            style={{ color: 'var(--on-surface-variant)', border: '1px solid var(--outline-variant)' }}
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* History list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 py-16"
              style={{ animation: 'scaleIn 0.4s ease-out' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--surface-container-low)' }}>
                <span className="material-symbols-outlined text-3xl" style={{ color: 'var(--outline-variant)' }}>auto_stories</span>
              </div>
              <p className="text-sm text-center" style={{ color: 'var(--on-surface-variant)' }}>
                No archival records yet.<br />
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Analyze your first dilemma.</span>
              </p>
            </div>
          ) : (
            history.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => { onSelect(item); handleClose(); }}
                className="history-item group p-4 rounded-2xl cursor-pointer relative"
                style={{
                  background: 'var(--surface-container-low)',
                  border: '1px solid var(--outline-variant)',
                  animationDelay: `${idx * 0.04}s`,
                  animation: 'slideUpFade 0.3s ease-out both',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest mb-1"
                      style={{ color: 'var(--primary)' }}>
                      #{String(history.length - idx).padStart(3, '0')} · {item.date || 'PREV'}
                    </p>
                    <h4 className="text-sm font-semibold line-clamp-2" style={{ color: 'var(--on-surface)' }}>
                      {item.title || item.prompt}
                    </h4>
                    <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--on-surface-variant)' }}>
                      {item.prompt}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id, e); }}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-300 w-8 h-8 rounded-lg flex items-center justify-center hover:scale-110 active:scale-90 flex-shrink-0"
                    style={{ color: 'var(--error)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--error-container)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
