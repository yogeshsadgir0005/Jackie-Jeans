import { ArrowLeft } from './Icons.jsx'

export function TopBar({ onBack, right, onLogoClick }) {
  return (
    <div className="topbar">
      {onBack ? (
        <button className="iconbtn" onClick={onBack} aria-label="Back">
          <ArrowLeft />
        </button>
      ) : (
        <div 
          className="brandmark" 
          onClick={onLogoClick}
          style={onLogoClick ? { cursor: 'pointer' } : {}}
          title={onLogoClick ? "Go back to landing page" : ""}
        >
          <span className="dot" />
          Jackie Jeans
        </div>
      )}
      <div className="spacer" />
      {right}
    </div>
  )
}

export function Progress({ current, total }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="progress-wrap">
      <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-label">
        {current}/{total}
      </span>
    </div>
  )
}
