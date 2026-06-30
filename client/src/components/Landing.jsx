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
    transition: { delay: 0.3 + 0.08 * i, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
}

const wordVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.9, rotate: -3 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
}

const titleVariant = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.35 } },
}

// Brands we calibrate against — doubles as the marquee content.
const TICKER = [
  "Levi's",
  'Madewell',
  'AGOLDE',
  'Wrangler',
  'Re/Done',
  'Mother',
  'Citizens of Humanity',
  'Good American',
  'Frame',
  'Lee',
]

// A rotating circular "stamp" seal — curved text on an SVG path.
function Seal() {
  return (
    <svg className="seal-svg" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <path
          id="sealArc"
          d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"
        />
      </defs>
      <text className="seal-text">
        <textPath href="#sealArc" startOffset="0">
          PERFECT&nbsp;FIT&nbsp;·&nbsp;NO&nbsp;MORE&nbsp;RETURNS&nbsp;·&nbsp;
        </textPath>
      </text>
    </svg>
  )
}

export default function Landing({ onPick }) {
  const voiceOk = speechSupported()
  return (
    <div className="shell landing-shell">
      <TopBar
       
      />

      <div className="landing">
        <div className="landing-hero">
       

          <div className="hero-headline-wrap">
            <motion.h1
              variants={titleVariant}
              initial="hidden"
              animate="show"
              className="hero-title"
            >
              <motion.span variants={wordVariant} className="w">
                Jeans&nbsp;
              </motion.span>
              <motion.span variants={wordVariant} className="w">
                that
              </motion.span>
              <br />
              <motion.em variants={wordVariant} className="w hero-em">
                actually
              </motion.em>
              <br />
              <motion.span variants={wordVariant} className="w">
                fit&nbsp;
              </motion.span>
              <motion.span variants={wordVariant} className="w">
                you.
              </motion.span>
            </motion.h1>

            <motion.div
              className="seal-badge"
              initial={{ opacity: 0, scale: 0.4, rotate: -40 }}
              animate={{ opacity: 1, scale: 1, rotate: -12 }}
              transition={{ delay: 0.95, type: 'spring', stiffness: 150, damping: 11 }}
            >
              <Seal />
              <span className="seal-center">
                <b>98%</b>
                <small>FIT MATCH</small>
              </span>
            </motion.div>
          </div>

          <motion.p
            className="sub"
            variants={fade}
            initial="hidden"
            animate="show"
            custom={2}
          >
            One short quiz finds your exact size, rise and cut — calibrated
            against the brands you already own.
          </motion.p>

          <motion.div
            className="meta"
            variants={fade}
            initial="hidden"
            animate="show"
            custom={3}
          >
            <div>
              <Sparkle size={15} /> <b>10</b> questions
            </div>
            <span className="meta-stitch" />
            <div>
              <Clock size={15} /> <b>~90</b> sec
            </div>
            <span className="meta-stitch" />
            <div>
              <Lock size={15} /> Private
            </div>
          </motion.div>
        </div>

        <motion.div
          className="ticker"
          variants={fade}
          initial="hidden"
          animate="show"
          custom={4}
        >
          <span className="ticker-label">Calibrated&nbsp;on</span>
          <div className="ticker-window">
            <div className="ticker-track">
              {[...TICKER, ...TICKER].map((b, i) => (
                <span className="ticker-item" key={i}>
                  {b}
                  <span className="ticker-star">✦</span>
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="mode-cards">
          <motion.button
            className="mode-card voice"
            variants={fade}
            initial="hidden"
            animate="show"
            custom={5}
            onClick={() => onPick('voice')}
          >
            <span className="rivet rivet-tl" />
            <span className="rivet rivet-br" />
            <div className="mc-icon">
              <span className="mc-icon-pulse" />
              <Mic />
            </div>
            <div className="mc-body">
              <div className="mc-title">
                <span className="mc-titletext">Talk it through</span>
                <span className="pill">AI Voice</span>
              </div>
              <div className="mc-sub">
                Speak naturally — Jackie asks, listens and fills it in.
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
            custom={6}
            onClick={() => onPick('manual')}
          >
            <div className="mc-icon">
              <Pencil />
            </div>
            <div className="mc-body">
              <div className="mc-title">
                <span className="mc-titletext">Tap it in</span>
              </div>
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
            Tip: voice works best in Chrome, Edge or Android Chrome. The manual
            flow works everywhere.
          </p>
        )}
      </div>
    </div>
  )
}
