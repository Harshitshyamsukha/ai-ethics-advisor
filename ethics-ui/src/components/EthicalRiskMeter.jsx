import React, { useEffect, useState, useRef } from 'react';

const EthicalRiskMeter = ({ risk = 0 }) => {
  const [displayRisk, setDisplayRisk] = useState(0);
  const [animatedRisk, setAnimatedRisk] = useState(0);
  const rafRef = useRef(null);

  // Animate the needle from 0 to the actual risk value on mount
  useEffect(() => {
    const duration = 1400;
    const start = performance.now();
    const from = 0;
    const to = Math.max(0, Math.min(100, risk));

    const easeOutElastic = (t) => {
      const c4 = (2 * Math.PI) / 4.5;
      return t === 0 ? 0 : t === 1 ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    };

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutElastic(progress);
      const current = from + (to - from) * eased;
      setAnimatedRisk(current);
      setDisplayRisk(Math.round(current));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    // Small delay so the card entrance animation finishes first
    const timeout = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, 400);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [risk]);

  // SVG gauge geometry
  const W = 220;
  const H = 130;
  const cx = W / 2;       // 110
  const cy = 118;          // center of arc, near bottom
  const R = 90;            // arc radius

  // Arc goes from 180° (left, 0%) to 0° (right, 100%)
  // In SVG coords: left point = (cx - R, cy), right = (cx + R, cy)
  const startAngle = Math.PI;   // 180°
  const endAngle = 0;           // 0°

  const toXY = (angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + R * Math.cos(rad),
      y: cy - R * Math.sin(rad),
    };
  };

  // Arc path — full semicircle background track
  const arcPath = (innerR, outerR, startDeg, endDeg) => {
    const s1 = toXY(startDeg);
    const e1 = toXY(endDeg);
    const s2 = { x: cx + outerR * Math.cos((startDeg * Math.PI) / 180), y: cy - outerR * Math.sin((startDeg * Math.PI) / 180) };
    const e2 = { x: cx + outerR * Math.cos((endDeg * Math.PI) / 180), y: cy - outerR * Math.sin((endDeg * Math.PI) / 180) };
    // inner arc clockwise, outer arc counter
    return `M ${s2.x} ${s2.y} A ${outerR} ${outerR} 0 0 1 ${e2.x} ${e2.y} L ${e1.x} ${e1.y} A ${innerR} ${innerR} 0 0 0 ${s1.x} ${s1.y} Z`;
  };

  // Needle angle: 0 risk = 180° (pointing left), 100 risk = 0° (pointing right)
  const needleAngleDeg = 180 - (animatedRisk / 100) * 180;
  const needleRad = (needleAngleDeg * Math.PI) / 180;
  const needleLen = 72;
  const needleTipX = cx + needleLen * Math.cos(needleRad);
  const needleTipY = cy - needleLen * Math.sin(needleRad);

  // Color zones (degrees): green 180→120, yellow 120→60, orange 60→20, red 20→0
  const zones = [
    { startDeg: 180, endDeg: 120, inner: 62, outer: 88, color: '#22c55e' }, // green
    { startDeg: 120, endDeg:  80, inner: 62, outer: 88, color: '#84cc16' }, // lime
    { startDeg:  80, endDeg:  40, inner: 62, outer: 88, color: '#eab308' }, // yellow
    { startDeg:  40, endDeg:  10, inner: 62, outer: 88, color: '#f97316' }, // orange
    { startDeg:  10, endDeg:   0, inner: 62, outer: 88, color: '#ef4444' }, // red
  ];

  // Needle color based on risk
  const getNeedleColor = (r) => {
    if (r <= 25) return '#22c55e';
    if (r <= 45) return '#84cc16';
    if (r <= 60) return '#eab308';
    if (r <= 80) return '#f97316';
    return '#ef4444';
  };

  const getRiskLabel = (r) => {
    if (r <= 20) return { text: 'Low Risk', color: '#22c55e' };
    if (r <= 45) return { text: 'Moderate', color: '#84cc16' };
    if (r <= 65) return { text: 'Elevated', color: '#eab308' };
    if (r <= 85) return { text: 'High Risk', color: '#f97316' };
    return { text: 'Critical', color: '#ef4444' };
  };

  const needleColor = getNeedleColor(animatedRisk);
  const riskLabel = getRiskLabel(displayRisk);

  // Tick marks
  const ticks = [0, 25, 50, 75, 100];

  return (
    <div
      className="flex flex-col items-center justify-center rounded-3xl p-5 relative overflow-hidden card-stagger-2"
      style={{
        background: 'var(--surface-container-lowest)',
        border: '1px solid var(--outline-variant)',
        transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
        e.currentTarget.style.boxShadow = `0 20px 50px -12px ${needleColor}44`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Glow top strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, #22c55e, #eab308, #ef4444)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 3s ease infinite',
      }} />

      {/* Label */}
      <p style={{
        fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--on-surface-variant)',
        fontFamily: '"JetBrains Mono", monospace', marginBottom: '2px',
      }}>
        Ethical Risk
      </p>

      {/* SVG Gauge */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: '200px', overflow: 'visible' }}
      >
        {/* Background track */}
        <path
          d={arcPath(62, 88, 0, 180)}
          fill="var(--surface-container-high)"
        />

        {/* Color zone segments */}
        {zones.map((z, i) => (
          <path
            key={i}
            d={arcPath(z.inner, z.outer, z.endDeg, z.startDeg)}
            fill={z.color}
            opacity="0.85"
          />
        ))}

        {/* Inner track overlay (cutout effect) */}
        <path
          d={arcPath(62, 66, 0, 180)}
          fill="var(--surface-container-lowest)"
          opacity="0.4"
        />

        {/* Tick marks */}
        {ticks.map((t) => {
          const deg = 180 - (t / 100) * 180;
          const rad = (deg * Math.PI) / 180;
          const inner = 56;
          const outer = 68;
          return (
            <line
              key={t}
              x1={cx + inner * Math.cos(rad)} y1={cy - inner * Math.sin(rad)}
              x2={cx + outer * Math.cos(rad)} y2={cy - outer * Math.sin(rad)}
              stroke="var(--surface-container-lowest)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}

        {/* Needle shadow */}
        <line
          x1={cx} y1={cy}
          x2={needleTipX + 1.5} y2={needleTipY + 1.5}
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={needleTipX} y2={needleTipY}
          stroke={needleColor}
          strokeWidth="3"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${needleColor}88)` }}
        />

        {/* Needle base circle */}
        <circle cx={cx} cy={cy} r="8" fill="var(--surface-container-high)"
          style={{ filter: `drop-shadow(0 0 6px ${needleColor}66)` }} />
        <circle cx={cx} cy={cy} r="5" fill={needleColor} />
        <circle cx={cx} cy={cy} r="2.5" fill="var(--surface-container-lowest)" />

        {/* Min / Max labels */}
        <text x="18" y={cy + 14} fontSize="8" fill="var(--on-surface-variant)"
          fontFamily='"JetBrains Mono", monospace' textAnchor="middle">0</text>
        <text x={W - 18} y={cy + 14} fontSize="8" fill="var(--on-surface-variant)"
          fontFamily='"JetBrains Mono", monospace' textAnchor="middle">100</text>
      </svg>

      {/* Numeric readout */}
      <div style={{ textAlign: 'center', marginTop: '-8px' }}>
        <div style={{
          fontSize: '2.4rem', fontWeight: 800,
          fontFamily: '"DM Serif Display", serif',
          color: needleColor, lineHeight: 1,
          transition: 'color 0.5s ease',
          filter: `drop-shadow(0 0 12px ${needleColor}55)`,
          animation: 'countUp 0.6s ease-out 0.5s both',
        }}>
          {displayRisk}
        </div>
        <div style={{
          fontSize: '0.72rem', fontWeight: 700, marginTop: '2px',
          color: riskLabel.color,
          fontFamily: '"Syne", sans-serif',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          transition: 'color 0.5s ease',
          animation: 'fadeIn 0.4s ease 0.8s both',
        }}>
          {riskLabel.text}
        </div>
      </div>
    </div>
  );
};

export default EthicalRiskMeter;
