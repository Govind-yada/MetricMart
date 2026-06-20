import { useState } from 'react';
import SessionsView from './pages/SessionsView';
import HeatmapView from './pages/HeatmapView';
import './App.css';

const VIEWS = {
  sessions: { label: 'Sessions', icon: SessionsIcon },
  heatmap: { label: 'Heatmap', icon: HeatmapIcon },
};

function SessionsIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="3" width="14" height="3" rx="1" stroke={active ? 'var(--accent)' : 'var(--text-muted)'} strokeWidth="1.4" />
      <rect x="2" y="8" width="14" height="3" rx="1" stroke={active ? 'var(--accent)' : 'var(--text-muted)'} strokeWidth="1.4" />
      <rect x="2" y="13" width="9" height="3" rx="1" stroke={active ? 'var(--accent)' : 'var(--text-muted)'} strokeWidth="1.4" />
    </svg>
  );
}

function HeatmapIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="14" height="14" rx="2" stroke={active ? 'var(--accent)' : 'var(--text-muted)'} strokeWidth="1.4" />
      <circle cx="6.5" cy="6.5" r="1.6" fill={active ? 'var(--accent-2)' : 'var(--text-faint)'} />
      <circle cx="11.5" cy="8" r="2.2" fill={active ? 'var(--accent-2)' : 'var(--text-faint)'} opacity="0.85" />
      <circle cx="8" cy="12" r="1.3" fill={active ? 'var(--accent-2)' : 'var(--text-faint)'} />
    </svg>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState('sessions');

  return (
    <div className="shell">
      <aside className="rail">
        <div className="rail__brand">
          <span className="rail__brand-mark">CF</span>
          <div className="rail__brand-text">
            <span className="rail__brand-name">MetricMart</span>
            <span className="rail__brand-sub">analytics console</span>
          </div>
        </div>

        <nav className="rail__nav">
          {Object.entries(VIEWS).map(([key, view]) => {
            const Icon = view.icon;
            const active = activeView === key;
            return (
              <button
                key={key}
                className={`rail__nav-item ${active ? 'is-active' : ''}`}
                onClick={() => setActiveView(key)}
              >
                <Icon active={active} />
                <span>{view.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="rail__footer">
          <span className="dot dot--live" />
          <span>tracking demo store</span>
        </div>
      </aside>

      <main className="content">
        {activeView === 'sessions' && <SessionsView />}
        {activeView === 'heatmap' && <HeatmapView />}
      </main>
    </div>
  );
}
