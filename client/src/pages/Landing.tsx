import React from 'react';

export default function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="hs-landing">
      <div className="hs-landing-inner">
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>
          FortyGuard × HeatSafe
        </div>
        <h1>HeatSafe</h1>
        <p>See cooler and hotter streets in one view — then open safer places in Google Maps.</p>
        <button type="button" className="hs-btn hs-btn-primary" onClick={onStart}>
          Start Analysis
        </button>
      </div>
    </div>
  );
}
