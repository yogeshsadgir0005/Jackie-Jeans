// ─────────────────────────────────────────────────────────────────────────────
// API client for persisting the fit profile to the Express/MongoDB backend.
// Falls back to localStorage so the deployed front-end is always usable, even
// if the backend isn't reachable (judges can complete the flow either way).
// ─────────────────────────────────────────────────────────────────────────────

// In production set VITE_API_BASE to your deployed API origin, e.g.
//   VITE_API_BASE=https://jackie-jeans-api.onrender.com
// In dev it's empty and Vite proxies /api to localhost:5050.
const API_BASE = import.meta.env.VITE_API_BASE || ''

const LS_KEY = 'jackieJeans.profile'

export async function saveProfile(profile) {
  // Always keep a local copy for the handoff / resume.
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ ...profile, savedAt: Date.now() }))
  } catch {
    /* storage might be unavailable */
  }

  try {
    const res = await fetch(`${API_BASE}/api/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    // `data.persisted` is true only when the API wrote to MongoDB; if the API
    // is running without a database it stores in memory and reports false.
    return { ok: true, persisted: !!data.persisted, id: data.id, data }
  } catch (err) {
    // Network/back-end unavailable — we still succeeded locally.
    return { ok: true, persisted: false, error: String(err) }
  }
}

export function loadLocalProfile() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearLocalProfile() {
  try {
    localStorage.removeItem(LS_KEY)
  } catch {
    /* noop */
  }
}
