import { motion } from 'framer-motion'
import { TopBar } from './Chrome.jsx'
import { Mic, Pencil, ArrowRight, Sparkle, Clock, Lock } from './Icons.jsx'
import { speechSupported } from '../lib/speech.js'

const fade = {
  hidden: { opacity: 0, y: 25, scale: 0.96 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: 0.3 + (0.08 * i), duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
}

const wordVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
}

const titleVariant = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.35 }
  }
}

export default function Landing({ onPick }) {
  const voiceOk = speechSupported()
  return (
    <div className="shell">
      <TopBar />
      <div className="landing">
        <div className="landing-hero">
          <motion.div variants={fade} initial="hidden" animate="show" custom={0}>
            <span className="eyebrow">The Fit Quiz</span>
          </motion.div>
          <motion.h1 variants={titleVariant} initial="hidden" animate="show" className="title-stagger">
            <motion.span variants={wordVariant} style={{ display: 'inline-block' }}>Jeans&nbsp;</motion.span>
            <motion.span variants={wordVariant} style={{ display: 'inline-block' }}>that&nbsp;</motion.span>
            <motion.em variants={wordVariant} style={{ display: 'inline-block' }}>actually&nbsp;</motion.em>
            <motion.span variants={wordVariant} style={{ display: 'inline-block' }}>fit&nbsp;</motion.span>
            <motion.span variants={wordVariant} style={{ display: 'inline-block' }}>you.</motion.span>
          </motion.h1>
          <motion.p
            className="sub"
            variants={fade}
            initial="hidden"
            animate="show"
            custom={2}
          >
            Answer a few quick questions and we’ll find your size, rise and cut
            with confidence — no more guessing, no more returns.
          </motion.p>
          <motion.div
            className="meta"
            variants={fade}
            initial="hidden"
            animate="show"
            custom={3}
          >
            <div>
              <Sparkle size={16} /> <b>10</b> questions
            </div>
            <div>
              <Clock size={16} /> <b>~90</b> seconds
            </div>
            <div>
              <Lock size={16} /> Private
            </div>
          </motion.div>
        </div>

        <div className="mode-cards">
          <motion.button
            className="mode-card voice"
            variants={fade}
            initial="hidden"
            animate="show"
            custom={4}
            onClick={() => onPick('voice')}
          >
            <div className="mc-icon">
              <Mic />
            </div>
            <div>
              <div className="mc-title">
                Talk it through <span className="pill">AI Voice Assistant</span>
              </div>
              <div className="mc-sub">
                Speak naturally — our stylist asks, listens and fills it in.
              </div>
            </div>
            <div className="mc-arrow">
              <ArrowRight />
            </div>
          </motion.button>

          <motion.button
            className="mode-card manual"
            variants={fade}
            initial="hidden"
            animate="show"
            custom={5}
            onClick={() => onPick('manual')}
          >
            <div className="mc-icon">
              <Pencil />
            </div>
            <div>
              <div className="mc-title">Tap it in</div>
              <div className="mc-sub">
                A calm, guided form — one question at a time.
              </div>
            </div>
            <div className="mc-arrow">
              <ArrowRight />
            </div>
          </motion.button>
        </div>

        {!voiceOk && (
          <p className="hint">
            Tip: the voice experience works best in Chrome, Edge or Android
            Chrome. The manual flow works everywhere.
          </p>
        )}
      </div>
    </div>
  )
}
