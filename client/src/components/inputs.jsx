import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check, Chevron, X,
  Pinch, ThumbsUp, Relax,
  ArrowUp, ArrowsVertical, ArrowDown,
  LegFitted, Wind,
  GapIcon, Compress, Ruler, MeasureAngle,
  Sparkle,
} from './Icons.jsx'

const ICON_MAP = {
  Snug: Pinch,
  'Slightly relaxed': ThumbsUp,
  Relaxed: Relax,
  'High rise': ArrowUp,
  'Mid rise': ArrowsVertical,
  'Low rise': ArrowDown,
  Fitted: LegFitted,
  Loose: Wind,
  'Waist gap': GapIcon,
  'Hip tightness': Compress,
  'Wrong length': Ruler,
  'Thigh fit': LegFitted,
  Rise: MeasureAngle,
  Other: Sparkle,
}

export function ChoiceInput({ question, value, onChange }) {
  return (
    <div className="choices">
      {question.options.map((opt, i) => {
        const selected = value === opt
        const IconComp = ICON_MAP[opt]
        return (
          <button
            key={opt}
            className={`choice ${selected ? 'selected' : ''}`}
            onClick={() => onChange(opt)}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            {IconComp && (
              <span className="choice-icon">
                <IconComp size={20} />
              </span>
            )}
            <span>{opt}</span>
            <span className="tick">{selected && <Check />}</span>
          </button>
        )
      })}
    </div>
  )
}

export function SelectInput({ question, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleSelect = (opt) => {
    onChange(opt)
    setOpen(false)
  }

  return (
    <div className="custom-select" ref={ref}>
      <button
        className={`custom-select-trigger ${open ? 'open' : ''} ${value ? 'has-value' : ''}`}
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span>{value || question.placeholder}</span>
        <span className={`custom-select-chevron ${open ? 'flipped' : ''}`}>
          <Chevron size={20} />
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="custom-select-options"
            initial={{ opacity: 0, clipPath: 'inset(0% 0% 100% 0% round 18px)' }}
            animate={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 18px)' }}
            exit={{ opacity: 0, clipPath: 'inset(0% 0% 100% 0% round 18px)' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {question.options.map((opt) => (
              <button
                key={opt}
                className={`custom-select-option ${opt === value ? 'active' : ''}`}
                onClick={() => handleSelect(opt)}
                type="button"
              >
                <span>{opt}</span>
                {opt === value && (
                  <span className="custom-select-check">
                    <Check size={14} />
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function NumberInput({ question, value, onChange }) {
  return (
    <div className="numwrap">
      <input
        type="number"
        inputMode="numeric"
        placeholder={question.placeholder}
        value={value ?? ''}
        min={question.min}
        max={question.max}
        onChange={(e) =>
          onChange(e.target.value === '' ? '' : Number(e.target.value))
        }
      />
      {question.unit && <span className="unit">{question.unit}</span>}
    </div>
  )
}

export function MultiSelectInput({ question, value = [], onChange }) {
  const toggle = (opt) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt))
    else onChange([...value, opt])
  }
  return (
    <>
      <div className="chips">
        {question.options.map((opt) => {
          const selected = value.includes(opt)
          return (
            <button
              key={opt}
              className={`chip ${selected ? 'selected' : ''}`}
              onClick={() => toggle(opt)}
            >
              {opt}
              {selected && (
                <span className="x">
                  <X size={12} />
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="selected-count">
        {value.length
          ? `${value.length} selected`
          : 'Optional — pick any you remember'}
      </div>
    </>
  )
}

export function PerBrandSizeInput({ brands = [], value = {}, onChange }) {
  if (!brands.length) {
    return (
      <p className="help" style={{ margin: 0 }}>
        No brands selected — we'll skip this one.
      </p>
    )
  }
  return (
    <div className="sizerows">
      {brands.map((brand) => (
        <div className="sizerow" key={brand}>
          <span className="brand">{brand}</span>
          <input
            type="text"
            inputMode="text"
            placeholder="e.g. 30"
            value={value[brand] || ''}
            onChange={(e) => onChange({ ...value, [brand]: e.target.value })}
          />
        </div>
      ))}
    </div>
  )
}
