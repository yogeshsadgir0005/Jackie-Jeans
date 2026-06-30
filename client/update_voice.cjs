const fs = require('fs')

let code = fs.readFileSync('src/components/VoiceFlow.jsx', 'utf-8')

// 1. Add states
const statesToAdd = `
  const [navIndex, setNavIndex] = useState(0)
  const [isReviewing, setIsReviewing] = useState(false)
  const isReviewingRef = useRef(false)
  const furthestIndexRef = useRef(0)
  const reviewResolveRef = useRef(null)

  function goBack() {
    if (manualResolveRef.current) manualResolveRef.current('', 'back')
    else if (reviewResolveRef.current) reviewResolveRef.current('back')
  }
  function goForward() {
    if (manualResolveRef.current) manualResolveRef.current('', 'forward')
    else if (reviewResolveRef.current) reviewResolveRef.current('forward')
  }
  function resubmitAnswer() {
    if (reviewResolveRef.current) reviewResolveRef.current('resubmit')
  }
`
code = code.replace("const [skippable, setSkippable] = useState(false)", "const [skippable, setSkippable] = useState(false)\n" + statesToAdd)

// 2. Replace runEngine
const oldRunEngineRegex = /async function runEngine\(\) \{[\s\S]*?onComplete\(\)\n  \}/
const newRunEngine = `async function runEngine() {
    await say(
      "Wonderful. Let's find your perfect fit. " + QUESTIONS[0].voicePrompt
    )
    let i = 0
    while (i < QUESTIONS.length) {
      const q = QUESTIONS[i]
      if (cancelledRef.current) return

      setProgress(q.index)

      if (isReviewingRef.current) {
        setIsReviewing(true)
        setBubble("Reviewing: " + q.voicePrompt)
        setStatus('idle')
        const action = await new Promise(r => { reviewResolveRef.current = r })
        setIsReviewing(false)
        reviewResolveRef.current = null
        if (cancelledRef.current) return
        
        if (action === 'back') {
          i = Math.max(0, i - 1)
          isReviewingRef.current = true
          continue
        } else if (action === 'forward') {
          i = Math.min(furthestIndexRef.current, i + 1)
          isReviewingRef.current = i < furthestIndexRef.current
          continue
        }
        
        // If resubmit, say the prompt and let it fall through to handle function
        await say(q.voicePrompt)
      } else {
        if (i > 0 && q.id !== 'sizes') {
          await say(q.voicePrompt)
        }
      }

      let result
      if (q.id === 'brands') {
        result = await handleBrands(q)
      } else if (q.id === 'sizes') {
        result = await handleSizes(q)
      } else {
        result = await handleStandard(q)
      }

      if (result === 'back') {
        i = Math.max(0, i - 1)
        isReviewingRef.current = true
        continue
      }
      if (result === 'forward') {
        i = Math.min(furthestIndexRef.current, i + 1)
        isReviewingRef.current = i < furthestIndexRef.current
        continue
      }

      i++
      furthestIndexRef.current = Math.max(furthestIndexRef.current, i)
      setNavIndex(furthestIndexRef.current)
    }

    if (cancelledRef.current) return
    setAnswers({ ...dataRef.current })
    await say(
      "Amazing — that's everything I need. Give me a moment to pull together your fit…"
    )
    if (cancelledRef.current) return
    onComplete()
  }`
code = code.replace(oldRunEngineRegex, newRunEngine)

// 3. Inject back/forward into handlers
code = code.replace(
  /const \{ text, source \} = await getAnswer\(\{ optional: q\.optional \}\)\n      if \(cancelledRef\.current\) return/g,
  `const { text, source } = await getAnswer({ optional: q.optional })\n      if (cancelledRef.current) return\n      if (source === 'back') return 'back'\n      if (source === 'forward') return 'forward'`
)

code = code.replace(
  /const \{ text, source \} = await getAnswer\(\{ optional: true \}\)\n        if \(cancelledRef\.current\) return/g,
  `const { text, source } = await getAnswer({ optional: true })\n        if (cancelledRef.current) return\n        if (source === 'back') return 'back'\n        if (source === 'forward') return 'forward'`
)

code = code.replace(
  /const \{ text, source \} = await getAnswer\(\{ optional: true \}\)\n      if \(cancelledRef\.current\) return/g,
  `const { text, source } = await getAnswer({ optional: true })\n      if (cancelledRef.current) return\n      if (source === 'back') return 'back'\n      if (source === 'forward') return 'forward'`
)

// 4. Update UI Buttons
// Replace `<Refresh size={16} /> Repeat` block to include Back/Forward
const oldVoiceRow = `{started && (
            <div className="voice-row">
              <button className="btn btn-text" onClick={repeat}>
                <Refresh size={16} /> Repeat
              </button>
              <button
                className="btn btn-text"
                onClick={() => setTyping((t) => !t)}
              >
                <Keyboard size={16} /> Type instead
              </button>`

const newVoiceRow = `{started && (
            <div className="voice-row">
              <button className="btn btn-text" onClick={goBack} disabled={progress <= 1}>
                <ArrowLeft size={16} /> Back
              </button>
              {furthestIndexRef.current > progress - 1 && (
                <button className="btn btn-text" onClick={goForward}>
                   Forward <ArrowRight size={16} />
                </button>
              )}
              <button className="btn btn-text" onClick={repeat}>
                <Refresh size={16} /> Repeat
              </button>
              <button
                className="btn btn-text"
                onClick={() => setTyping((t) => !t)}
              >
                <Keyboard size={16} /> Type instead
              </button>`

code = code.replace(oldVoiceRow, newVoiceRow)

// 5. Replace footer Mic button with Resubmit when isReviewing is true
const oldFooterMic = `<button
            className={\`mic-btn \${status === 'listening' ? 'recording' : ''}\`}
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
          </button>`

const newFooterMic = `isReviewing ? (
          <button className="mic-btn recording" style={{ flex: 1, background: 'var(--indigo)' }} onClick={resubmitAnswer}>
            <Refresh /> Resubmit answer
          </button>
        ) : (
          <button
            className={\`mic-btn \${status === 'listening' ? 'recording' : ''}\`}
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
        )`

code = code.replace(oldFooterMic, newFooterMic)

fs.writeFileSync('src/components/VoiceFlow.jsx', code, 'utf-8')
console.log('VoiceFlow updated!')
