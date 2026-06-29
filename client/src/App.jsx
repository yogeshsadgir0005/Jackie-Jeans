import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Landing from './components/Landing.jsx'
import ManualFlow from './components/ManualFlow.jsx'
import VoiceFlow from './components/VoiceFlow.jsx'
import Complete from './components/Complete.jsx'

// Screens: 'landing' → 'manual' | 'voice' → 'complete'
export default function App() {
  const [screen, setScreen] = useState('landing')
  const [mode, setMode] = useState(null)
  const [answers, setAnswers] = useState({})

  const pick = (m) => {
    setMode(m)
    setScreen(m)
  }

  const complete = () => setScreen('complete')
  const reset = () => {
    setScreen('landing')
    setMode(null)
  }

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -5 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', willChange: 'opacity, transform' }}
        >
          {screen === 'landing' && <Landing onPick={pick} />}

          {screen === 'manual' && (
            <ManualFlow
              answers={answers}
              setAnswers={setAnswers}
              onComplete={complete}
              onExit={reset}
            />
          )}

          {screen === 'voice' && (
            <VoiceFlow
              answers={answers}
              setAnswers={setAnswers}
              onComplete={complete}
              onExit={reset}
            />
          )}

          {screen === 'complete' && (
            <Complete
              answers={answers}
              mode={mode}
              onEdit={() => setScreen(mode === 'voice' ? 'manual' : 'manual')}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
