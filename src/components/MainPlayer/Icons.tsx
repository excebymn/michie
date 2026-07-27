// ---- Icon untuk WindowControls (radial menu) ----

export const IconWindowDots = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <circle cx="8" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="11" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="14" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);

export const IconMinimize = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="19" x2="19" y2="19" />
  </svg>
);

export const IconMaximize = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <rect x="5" y="5" width="14" height="14" rx="1.5" />
  </svg>
);

export const IconRestore = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <path d="M8 5h9a2 2 0 0 1 2 2v9" />
    <rect x="5" y="8" width="11" height="11" rx="1.5" />
  </svg>
);

export const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
);

export const IconPin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 17v5" />
    <path d="M8 3h8l-1 6 3 3H6l3-3-1-6z" />
  </svg>
);

export const IconFullscreen = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {active ? (
      <>
        <polyline points="9 15 3 15 3 21" />
        <polyline points="21 3 21 9 15 9" />
        <line x1="3" y1="21" x2="9" y2="15" />
        <line x1="21" y1="3" x2="15" y2="9" />
      </>
    ) : (
      <>
        <polyline points="15 3 21 3 21 9" />
        <polyline points="3 21 3 15 9 15" />
        <line x1="21" y1="3" x2="15" y2="9" />
        <line x1="3" y1="21" x2="9" y2="15" />
      </>
    )}
  </svg>
);

export const IconCompactMode = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="9" width="16" height="6" rx="1.5" opacity={active ? 1 : 0.4} />
    <line x1="2" y1="4" x2="2" y2="20" opacity={active ? 0 : 1} />
    <line x1="22" y1="4" x2="22" y2="20" opacity={active ? 0 : 1} />
  </svg>
);

export const IconMiniPlayer = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="14" rx="1.5" opacity="0.35" />
    <rect x="12" y="10" width="9" height="7" rx="1.2" />
    <polygon points="15.5,12 15.5,15 18,13.5" fill="currentColor" stroke="none" />
  </svg>
);