import React from 'react';

export default function StatusIndicator({ phase, errorMessage }: { phase?: string; errorMessage?: string | null }) {
  const label = phase ?? 'idle';
  return (
    <div className="hs-card">
      <div className={`hs-status hs-status--${label}`}>Status: {label}</div>
      {(phase === 'error' || phase === 'timeout') && errorMessage && (
        <div className="hs-error" style={{ marginTop: 10, fontSize: 13 }}>
          {errorMessage}
        </div>
      )}
    </div>
  );
}
