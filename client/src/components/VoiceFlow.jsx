import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { QUESTIONS } from '../quiz/config.js'
import { TopBar, Progress } from './Chrome.jsx'
import { Mic, Volume, ArrowRight, ArrowLeft, Check, Refresh, Keyboard } from './Icons.jsx'
import {
  speechSupported,
  speak,
  stopSpeaking,
  createRecognizer,
} from '../lib/speech.js'
import { runParser } from '../lib/parse.js'

const SHORT = {
  height: 'Height',
  weight: 'Weight',
  waist: 'Waist',
  hip: 'Hip',
  waistFit: 'Waist fit',
  rise: 'Rise',
  thighFit: 'Thighs',
  brands: 'Brands',
  sizes: 'Sizes',
  frustration: 'Frustration',
}

export default function VoiceFlow({ answers, setAnswers, onComplete, onExit }) {
  const supported = speechSupported()

  const [started, setStarted] = useState(false)
  const [status, setStatus] = useState('idle') // idle | speaking | listening
  const [bubble, setBubble] = useState(
    "Hi! I'm Jackie — your fit stylist. I'll ask a few quick questions, just answer out loud. Ready when you are."
  )
  const [userSaid, setUserSaid] = useState('')
  const [log, setLog] = useState([])
  const [progress, setProgress] = useState(0)
  const [typing, setTyping] = useState(false)
  const [typeVal, setTypeVal] = useState('')
  const [skippable, setSkippable] = useState(false)

  const recognizerRef = useRef(null)
  const manualResolveRef = useRef(null) // resolves the current listen turn
  const cancelledRef = useRef(false)
  const engineStartedRef = useRef(false)
  const dataRef = useRef({ ...answers })
  const lastPromptRef = useRef('')

  useEffect(() => {
    if (supported) recognizerRef.current = createRecognizer()
    return () => {
      cancelledRef.current = true
      stopSpeaking()
      try {
        recognizerRef.current && recognizerRef.current.abort()
      } catch {
        /* noop */
      }
    }
  }, [supported])

  // ── primitives ──────────────────────────────────────────────────────────
  async function say(text) {
    if (cancelledRef.current) return
    lastPromptRef.current = text
    setStatus('speaking')
    setBubble(text)
    setUserSaid('')
    await speak(text)
    if (cancelledRef.current) return
    setStatus('idle')
  }

  // Resolves with { text, source } from voice, typed input, or a control.
  function getAnswer({ optional }) {
    setSkippable(!!optional)
    return new Promise((resolve) => {
      let done = false
      const finish = (text, source) => {
        if (done) return
        done = true
        manualResolveRef.current = null
        setSkippable(false)
        try {
          recognizerRef.current && recognizerRef.current.abort()
        } catch {
          /* noop */
        }
        resolve({ text: (text || '').trim(), source })
      }
      manualResolveRef.current = finish

      if (recognizerRef.current) {
        setStatus('listening')
        recognizerRef.current
          .listen({
            onPartial: (p) => setUserSaid(p),
            onState: (s) => {
              if (s === 'listening') setStatus('listening')
            },
          })
          .then((t) => finish(t, 'voice'))
          .catch(() => {
            // Mic blocked/unavailable — fall back to typing, keep waiting.
            setStatus('idle')
            setTyping(true)
          })
      } else {
        // No speech recognition: typed answers only.
        setStatus('listening')
        setTyping(true)
      }
    })
  }

  // ── conversation engine ──────────────────────────────────────────────────
  async function runEngine() {
    await say(
      "Wonderful. Let's find your perfect fit. " + QUESTIONS[0].voicePrompt
    )
    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i]
      if (cancelledRef.current) return

      // The sizes step speaks its own per-brand prompts (its voicePrompt is a
      // "{brand}" template), so skip the generic question read for it.
      if (i > 0 && q.id !== 'sizes') await say(q.voicePrompt)

      if (q.id === 'brands') {
        await handleBrands(q)
      } else if (q.id === 'sizes') {
        await handleSizes(q)
      } else {
        await handleStandard(q)
      }
      setProgress(q.index)
    }

    if (cancelledRef.current) return
    setAnswers({ ...dataRef.current })
    await say(
      "Amazing — that's everything I need. Give me a moment to pull together your fit…"
    )
    if (cancelledRef.current) return
    onComplete()
  }

  async function handleStandard(q) {
    let attempts = 0
    while (!cancelledRef.current) {
      const { text, source } = await getAnswer({ optional: q.optional })
      if (cancelledRef.current) return
      if (source === 'repeat') {
        await say(q.voicePrompt)
        continue
      }
      if (source === 'skip' && q.optional) {
        await say('No problem at all — we’ll skip that one.')
        pushLog(q, 'Skipped')
        return
      }
      if (!text) {
        attempts++
        await say(
          attempts >= 2
            ? `No rush — you can also tap “Type instead”. ${q.voiceExamples || q.voicePrompt}`
            : `Sorry, I didn’t catch that. ${q.voiceExamples || ''}`.trim()
        )
        continue
      }

      const parsed = runParser(q.parser, text, q)

      // weight returns an object or null
      if (q.parser === 'weightOrSkip') {
        if (!parsed) {
          attempts++
          await say(`Hmm, I didn’t get that. ${q.voiceExamples || ''}`.trim())
          continue
        }
        if (parsed.skip) {
          await say('Sure — we’ll skip your weight.')
          pushLog(q, 'Skipped')
          return
        }
        dataRef.current.weight = parsed.value
        pushLog(q, `${parsed.value} lbs`)
        await say(`Got it — ${parsed.value} pounds.`)
        return
      }

      if (parsed == null || parsed === '') {
        attempts++
        await say(
          attempts >= 2
            ? `Let me re-ask. ${q.voicePrompt}`
            : `I didn’t quite get a valid answer. ${q.voiceExamples || q.voicePrompt}`
        )
        continue
      }

      dataRef.current[q.id] = parsed
      pushLog(q, String(parsed))
      await say(confirmFor(q, parsed))
      return
    }
  }

  async function handleBrands(q) {
    let attempts = 0
    while (!cancelledRef.current) {
      const { text, source } = await getAnswer({ optional: true })
      if (cancelledRef.current) return
      if (source === 'repeat') {
        await say(q.voicePrompt)
        continue
      }
      if (source === 'skip') {
        dataRef.current.brands = []
        pushLog(q, 'None')
        await say('No worries — we’ll calibrate from your measurements.')
        return
      }
      if (!text) {
        attempts++
        await say(
          attempts >= 2
            ? 'You can name brands like Levi’s, Madewell or Zara — or say “none”.'
            : 'Sorry, which brands did you mean?'
        )
        continue
      }

      const list = runParser('brands', text, q)
      const saidNone = /\b(none|nothing|skip|can'?t|don'?t)\b/i.test(text)

      if (!list.length && !saidNone && attempts < 2) {
        attempts++
        await say(
          'I didn’t recognise those — try names like Levi’s, Wrangler, Gap or Madewell, or say “none”.'
        )
        continue
      }

      dataRef.current.brands = list
      pushLog(q, list.length ? list.join(', ') : 'None')
      await say(
        list.length
          ? `Nice — ${naturalList(list)}.`
          : 'All good, we’ll work from your measurements.'
      )
      return
    }
  }

  async function handleSizes(q) {
    const brands = dataRef.current.brands || []
    if (!brands.length) return
    const sizes = {}
    await say(
      `Great — and what size did you usually buy? I’ll go through them one by one.`
    )
    for (const brand of brands) {
      if (cancelledRef.current) return
      let attempts = 0
      await say(`What size in ${brand}?`)
      while (!cancelledRef.current) {
        const { text, source } = await getAnswer({ optional: true })
        if (cancelledRef.current) return
        if (source === 'repeat') {
          await say(`What size in ${brand}?`)
          continue
        }
        if (source === 'skip' || (!text && attempts >= 1)) {
          break
        }
        if (!text) {
          attempts++
          await say(`Sorry — what size in ${brand}? You can say a number or a letter size.`)
          continue
        }
        const size = runParser('size', text, q)
        if (!size) {
          attempts++
          if (attempts >= 2) break
          await say(`Hmm, what size in ${brand}? For example, a 30, or medium.`)
          continue
        }
        sizes[brand] = size
        await say('Got it.')
        break
      }
    }
    dataRef.current.sizes = sizes
    const summary = Object.entries(sizes)
      .map(([b, s]) => `${b} ${s}`)
      .join(', ')
    if (summary) pushLog(q, summary)
  }

  function pushLog(q, value) {
    setLog((l) => [...l, { id: q.id, label: SHORT[q.id] || q.label, value }])
  }

  // ── UI actions ────────────────────────────────────────────────────────────
  const begin = async () => {
    if (engineStartedRef.current) return
    engineStartedRef.current = true
    setStarted(true)
    cancelledRef.current = false
    // prime the speech engine within the user gesture
    try {
      await runEngine()
    } catch {
      /* swallow — controls remain for retry */
    }
  }

  const stopAndSubmit = () => {
    try {
      recognizerRef.current && recognizerRef.current.stop()
    } catch {
      /* noop */
    }
  }

  const repeat = () => {
    stopSpeaking()
    if (manualResolveRef.current) manualResolveRef.current('', 'repeat')
    else say(lastPromptRef.current)
  }

  const skip = () => {
    if (manualResolveRef.current) manualResolveRef.current('', 'skip')
  }

  const submitTyped = (e) => {
    e && e.preventDefault()
    const v = typeVal.trim()
    if (!v) return
    setUserSaid(v)
    setTyping(false)
    setTypeVal('')
    if (manualResolveRef.current) manualResolveRef.current(v, 'typed')
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="shell">
      <TopBar onLogoClick={onExit} />
      <Progress current={progress} total={QUESTIONS.length} />

      <div className="voice">
        <div className="voice-stage">
          <div className={`orb ${status === 'speaking' ? 'speaking' : ''} ${status === 'listening' ? 'listening' : ''}`}>
            <span className="orb-ring" />
            <span className="orb-ring" />
            <span className="orb-ring" />
            <div className="orb-core">
              {status === 'listening' ? (
                <div className="bars">
                  <span /><span /><span /><span /><span />
                </div>
              ) : status === 'speaking' ? (
                <Volume size={30} />
              ) : (
                <Mic size={30} />
              )}
            </div>
          </div>

          <div className={`voice-status ${status === 'listening' ? 'live' : ''}`}>
            {status === 'speaking'
              ? 'Jackie is speaking…'
              : status === 'listening'
                ? '● Listening'
                : started
                  ? 'One sec…'
                  : 'Tap start to begin'}
          </div>

          <motion.div
            key={bubble}
            className="bubble"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {bubble}
          </motion.div>

          <div className="transcript">
            {userSaid && (
              <span>
                <span className="you">You:</span> “{userSaid}”
              </span>
            )}
          </div>

          {log.length > 0 && (
            <div className="chiplog">
              {log.slice(-4).map((item, i) => (
                <span className="c" key={i}>
                  {item.label}: {trim(item.value)}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="voice-controls">
          {!supported && !started && (
            <div className="unsupported">
              Your browser doesn’t support live voice. You can still complete the
              quiz by typing your answers here, or use the manual flow. For full
              voice, open this in Chrome, Edge, or Android Chrome.
            </div>
          )}

          {started && (
            <div className="voice-row">
              <button className="btn btn-text" onClick={repeat}>
                <Refresh size={16} /> Repeat
              </button>
              <button
                className="btn btn-text"
                onClick={() => setTyping((t) => !t)}
              >
                <Keyboard size={16} /> Type instead
              </button>
              {skippable && (
                <button className="btn btn-text" onClick={skip}>
                  Skip ›
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="footer">
        <button className="btn btn-back" onClick={onExit} aria-label="Back">
          <ArrowLeft size={28} />
        </button>

        {!started ? (
          <button className="mic-btn" style={{ flex: 1 }} onClick={begin}>
            <Mic /> Start the conversation
          </button>
        ) : typing ? (
          <form className="numwrap" onSubmit={submitTyped} style={{ gap: 10, flex: 1, margin: 0, minHeight: 58 }}>
            <input
              autoFocus
              type="text"
              placeholder="Type your answer…"
              value={typeVal}
              onChange={(e) => setTypeVal(e.target.value)}
              style={{ fontSize: 18, fontWeight: 600, width: '100%' }}
            />
            <button type="submit" className="iconbtn" aria-label="Send">
              <ArrowRight />
            </button>
          </form>
        ) : (
          <button
            className={`mic-btn ${status === 'listening' ? 'recording' : ''}`}
            style={{ flex: 1 }}
            onClick={stopAndSubmit}
            disabled={status !== 'listening'}
          >
            {status === 'listening' ? (
              <>
                <Check /> Tap when you’re done
              </>
            ) : (
              <>
                <Volume /> Jackie is speaking…
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ── helpers ──────────────────────────────────────────────────────────────────
function confirmFor(q, value) {
  switch (q.id) {
    case 'height':
      return `Lovely — ${value}.`
    case 'waist':
      return `Great — waist ${value.replace('"', '')} inches.`
    case 'hip':
      return `Perfect — hips ${value.replace('"', '')} inches.`
    case 'waistFit':
      return `Got it — ${String(value).toLowerCase()} at the waist.`
    case 'rise':
      return `${value} it is.`
    case 'thighFit':
      return `Noted — ${String(value).toLowerCase()} through the thigh.`
    case 'frustration':
      return `Understood — we’ll keep an eye on ${String(value).toLowerCase()}.`
    default:
      return `Got it — ${value}.`
  }
}

function naturalList(arr) {
  if (arr.length === 1) return arr[0]
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`
  return `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`
}

function trim(v) {
  const s = String(v)
  return s.length > 22 ? s.slice(0, 21) + '…' : s
}
