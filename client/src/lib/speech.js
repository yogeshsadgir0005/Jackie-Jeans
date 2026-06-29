// ─────────────────────────────────────────────────────────────────────────────
// Thin promise-based wrapper around the Web Speech API.
//  - speak(text): text-to-speech, resolves when finished
//  - createRecognizer(): start/stop speech-to-text with callbacks
// Web Speech is used because it needs no API keys and works instantly in
// Chrome / Edge / Android Chrome — so the deployed demo is usable immediately.
// ─────────────────────────────────────────────────────────────────────────────

export const speechSupported = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  return !!SR && 'speechSynthesis' in window
}

let cachedVoice = null

function pickVoice() {
  if (cachedVoice) return cachedVoice
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  // Prefer a natural-sounding English female voice (stylist persona).
  const prefer = [
    'Google UK English Female',
    'Samantha',
    'Google US English',
    'Microsoft Aria Online (Natural) - English (United States)',
    'Microsoft Jenny Online (Natural) - English (United States)',
  ]
  for (const name of prefer) {
    const v = voices.find((x) => x.name === name)
    if (v) return (cachedVoice = v)
  }
  const en = voices.find((v) => v.lang && v.lang.startsWith('en'))
  return (cachedVoice = en || voices[0])
}

// Make sure voices are loaded (they load async in some browsers).
export function warmUpVoices() {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null
    pickVoice()
  }
}

// Keep references to utterances so they aren't garbage collected
const utterances = new Set()

export function speak(text, { onWord } = {}) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve()
    let settled = false
    let u = null
    const done = () => {
      if (settled) return
      settled = true
      clearTimeout(watchdog)
      if (u) utterances.delete(u)
      resolve()
    }
    // Safety net: if onend never fires
    const estMs = Math.min(16000, Math.max(1800, text.length * 75 + 1400))
    const watchdog = setTimeout(done, estMs)

    try {
      window.speechSynthesis.cancel()
      u = new SpeechSynthesisUtterance(text)
      utterances.add(u)
      const v = pickVoice()
      if (v) u.voice = v
      u.rate = 1.02
      u.pitch = 1.0
      u.lang = (v && v.lang) || 'en-US'
      if (onWord) {
        u.onboundary = (e) => {
          if (e.name === 'word' || e.charIndex != null) onWord(e.charIndex)
        }
      }
      u.onend = done
      u.onerror = done
      window.speechSynthesis.speak(u)
    } catch {
      done()
    }
  })
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

// Returns a recognizer controller. Each `listen()` resolves with a transcript.
export function createRecognizer() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return null

  let recognition = null
  let active = false

  function listen({ onPartial, onState } = {}) {
    return new Promise((resolve, reject) => {
      recognition = new SR()
      recognition.lang = 'en-US'
      recognition.interimResults = true
      recognition.continuous = false
      recognition.maxAlternatives = 1

      let finalText = ''
      let settled = false

      const done = (val) => {
        if (settled) return
        settled = true
        active = false
        onState && onState('idle')
        resolve(val)
      }

      recognition.onstart = () => {
        if (settled) return
        active = true
        onState && onState('listening')
      }
      recognition.onresult = (e) => {
        if (settled) return
        let interim = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i]
          if (r.isFinal) finalText += r[0].transcript
          else interim += r[0].transcript
        }
        onPartial && onPartial((finalText + ' ' + interim).trim())
      }
      recognition.onerror = (e) => {
        if (settled) return
        settled = true
        active = false
        onState && onState('idle')
        if (e.error === 'no-speech' || e.error === 'aborted') resolve('')
        else reject(e)
      }
      recognition.onend = () => done(finalText.trim())

      try {
        recognition.start()
      } catch {
        reject(new Error('start-failed'))
      }
    })
  }

  function stop() {
    if (recognition && active) {
      try {
        recognition.stop()
      } catch {
        /* noop */
      }
    }
  }

  function abort() {
    if (recognition) {
      try {
        recognition.abort()
      } catch {
        /* noop */
      }
    }
  }

  return { listen, stop, abort }
}
