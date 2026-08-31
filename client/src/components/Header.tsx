import React from 'react';

export default function Header() {
  return (
    <header className="hs-header">
      <div>
        <h1>HeatSafe</h1>
        <p className="hs-header-sub">Urban heat intelligence powered by FortyGuard</p>
      </div>
      <div className="hs-legend-bar" style={{ width: 140, margin: 0 }} title="Cool → Hot" />
    </header>
  );
}
