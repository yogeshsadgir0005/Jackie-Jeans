import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { TopBar } from './Chrome.jsx'
import { Check, ArrowRight } from './Icons.jsx'
import { SITE_URL } from '../quiz/config.js'
import { buildRecommendation } from '../lib/recommend.js'
import { saveProfile } from '../lib/api.js'

const REDIRECT_SECONDS = 6

// Animate a number from 0 → target with an ease-out curve.
function useCountUp(target, duration = 1100, delay = 400) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf
    let start
    const timer = setTimeout(() => {
      const step = (ts) => {
        if (!start) start = ts
        const p = Math.min(1, (ts - start) / duration)
        const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
        setVal(Math.round(target * eased))
        if (p < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, delay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [target, duration, delay])
  return val
}

export default function Complete({ answers, mode, onEdit }) {
  const rec = useMemo(() => buildRecommendation(answers), [answers])
  const confidence = useCountUp(rec.confidence)
  const [persisted, setPersisted] = useState(null) // null | true | false
  const [count, setCount] = useState(REDIRECT_SECONDS)
  const [paused, setPaused] = useState(false)
  const savedRef = useRef(false)

  // Persist the profile once (MongoDB via API, with localStorage fallback).
  useEffect(() => {
    if (savedRef.current) return
    savedRef.current = true
    saveProfile({
      ...answers,
      recommendation: rec,
      source: mode,
      completedAt: new Date().toISOString(),
    }).then((r) => setPersisted(r.persisted))
  }, [answers, rec, mode])

  // Auto-redirect countdown to the main store. Carries the profile in the URL.
  useEffect(() => {
    if (paused) return
    if (count <= 0) {
      handoff()
      return
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, paused])

  function handoff() {
    const params = new URLSearchParams({
      fitSize: rec.size,
      cut: rec.cut,
      rise: rec.rise,
      leg: rec.leg,
      from: 'fit-quiz',
    })
    window.location.href = `${SITE_URL}?${params.toString()}`
  }

  return (
    <div className="shell">
      <TopBar />
      <div className="complete">
        <motion.div
          className="badge-check"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        >
          <Check size={34} />
        </motion.div>
        <span className="eyebrow" style={{ textAlign: 'center' }}>
          Your fit profile
        </span>
        <h1>You’re all set.</h1>

        <motion.div
          className="reccard"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="rc-eyebrow">Recommended starting size</div>
          <motion.div
            className="rc-size"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.32, type: 'spring', stiffness: 200, damping: 13 }}
          >
            {rec.size}
          </motion.div>

          <div className="rc-grid">
            <div>
              <div className="k">Cut</div>
              <div className="v">{rec.cut}</div>
            </div>
            <div>
              <div className="k">Rise</div>
              <div className="v">{rec.rise}</div>
            </div>
            <div>
              <div className="k">Leg</div>
              <div className="v">{rec.leg}</div>
            </div>
            <div>
              <div className="k">Confidence</div>
              <div className="v">{confidence}%</div>
            </div>
          </div>

          <div className="confidence">
            <div className="track">
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: `${rec.confidence}%` }}
                transition={{ delay: 0.4, duration: 0.8 }}
              />
            </div>
            <b>{confidence}%</b>
          </div>

          <p className="rc-note">{rec.note}</p>
        </motion.div>

        <button className="btn btn-accent btn-block" onClick={handoff}>
          Shop my fit at Jackie Jeans <ArrowRight />
        </button>

        <button
          className="btn btn-text"
          onClick={() => setPaused(true) || onEdit()}
          style={{ marginTop: 6 }}
        >
          Review my answers
        </button>

        <p className="redirect-note">
          {paused
            ? 'Redirect paused.'
            : `Taking you to the store in ${count}s…`}
          {' '}
          {!paused && (
            <button
              className="btn-text"
              style={{ padding: 0, minHeight: 0, textDecoration: 'underline' }}
              onClick={() => setPaused(true)}
            >
              stay here
            </button>
          )}
        </p>

        <span className="persist-note">
          {persisted == null ? (
            <>● Saving your profile…</>
          ) : persisted ? (
            <>
              <span className="dotgood">●</span> Profile saved to your account
            </>
          ) : (
            <>
              <span className="dotwarn">●</span> Saved on this device
            </>
          )}
        </span>
      </div>
    </div>
  )
}
