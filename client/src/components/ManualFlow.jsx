import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { QUESTIONS } from '../quiz/config.js'
import { TopBar, Progress } from './Chrome.jsx'
import { ArrowRight, ArrowLeft } from './Icons.jsx'
import {
  ChoiceInput,
  SelectInput,
  NumberInput,
  MultiSelectInput,
  PerBrandSizeInput,
} from './inputs.jsx'

const slide = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
}

export default function ManualFlow({ answers, setAnswers, onComplete, onExit }) {
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)

  // Skip the per-brand size question entirely if no brands were selected.
  const steps = useMemo(() => {
    return QUESTIONS.filter((q) => {
      if (q.id === 'sizes') return (answers.brands || []).length > 0
      return true
    })
  }, [answers.brands])

  const q = steps[step]
  const total = QUESTIONS.length
  const displayIndex = q.index

  const setValue = (id, val) => setAnswers((a) => ({ ...a, [id]: val }))

  const value = answers[q.id]
  const isValid = validate(q, value)

  const go = (delta) => {
    const next = step + delta
    setDir(delta)
    if (next < 0) {
      onExit()
      return
    }
    if (next >= steps.length) {
      onComplete()
      return
    }
    setStep(next)
  }

  return (
    <div className="shell">
      <TopBar onLogoClick={onExit} />
      <Progress current={displayIndex} total={total} />

      <div className="body body-top">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={q.id}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="center-col"
          >
            <div className="q-index">Question {displayIndex} of {total}</div>
            <h1 className="title">{q.label}</h1>
            {q.help && <p className="help">{q.help}</p>}

            <QuestionInput
              question={q}
              answers={answers}
              value={value}
              onChange={(val) => setValue(q.id, val)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="footer">
        <button className="btn btn-back" onClick={() => go(-1)} aria-label="Back">
          <ArrowLeft size={28} />
        </button>
        {q.optional && !isValid ? (
          <button className="btn btn-ghost btn-block" onClick={() => go(1)}>
            Skip
          </button>
        ) : (
          <button
            className="btn btn-primary"
            disabled={!isValid && !q.optional}
            onClick={() => go(1)}
          >
            {step === steps.length - 1 ? 'See my fit' : 'Continue'}
            <ArrowRight />
          </button>
        )}
      </div>
    </div>
  )
}

function QuestionInput({ question, answers, value, onChange }) {
  switch (question.type) {
    case 'choice':
      return <ChoiceInput question={question} value={value} onChange={onChange} />
    case 'select':
      return <SelectInput question={question} value={value} onChange={onChange} />
    case 'number':
      return <NumberInput question={question} value={value} onChange={onChange} />
    case 'multiselect':
      return (
        <MultiSelectInput question={question} value={value} onChange={onChange} />
      )
    case 'perBrandSize':
      return (
        <PerBrandSizeInput
          brands={answers.brands || []}
          value={value || {}}
          onChange={onChange}
        />
      )
    default:
      return null
  }
}

function validate(q, value) {
  switch (q.type) {
    case 'number':
      return value !== '' && value != null && !Number.isNaN(value)
    case 'multiselect':
      return Array.isArray(value) && value.length > 0
    case 'perBrandSize':
      return true // sizes are best-effort; user can leave blanks
    default:
      return value != null && value !== ''
  }
}
