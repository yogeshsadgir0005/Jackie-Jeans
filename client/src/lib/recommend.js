// ─────────────────────────────────────────────────────────────────────────────
// A small, transparent rule-based fit recommendation. Not meant to be a real
// sizing model — it exists so the quiz pays off with a confident, personalised
// summary before handing the user to the main store.
// ─────────────────────────────────────────────────────────────────────────────

function inchesNum(v) {
  if (!v) return null
  const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10)
  return Number.isFinite(n) ? n : null
}

export function buildRecommendation(answers) {
  const waist = inchesNum(answers.waist)
  const hip = inchesNum(answers.hip)

  // Recommended denim size ≈ waist, nudged by desired waist fit.
  let size = waist
  if (waist) {
    if (answers.waistFit === 'Slightly relaxed') size = waist + 1
    if (answers.waistFit === 'Relaxed') size = waist + 2
    if (answers.waistFit === 'Snug') size = waist // true to measurement
  }

  // Hip-to-waist drop suggests how curvy the cut should be.
  let cut = 'Straight'
  if (waist && hip) {
    const drop = hip - waist
    if (drop >= 12) cut = 'Curve / Hourglass'
    else if (drop >= 9) cut = 'Relaxed straight'
    else if (drop <= 6) cut = 'Slim straight'
  }

  // Rise carries straight through.
  const rise = answers.rise || 'Mid rise'

  // Leg shape from thigh preference.
  const leg =
    answers.thighFit === 'Fitted'
      ? 'Skinny / Slim'
      : answers.thighFit === 'Loose'
        ? 'Relaxed / Wide'
        : 'Straight'

  // A friendly explanation tuned to their stated frustration.
  const frustrationNote = {
    'Waist gap': 'We prioritised a contoured waistband so you won’t get that back gap.',
    'Hip tightness': 'We weighted your hip measurement heavily so it sits comfortably through the seat.',
    'Wrong length': 'We’ll match the inseam to your height so the break lands right.',
    'Thigh fit': 'We picked a leg shape with the right room through the thigh.',
    Rise: `We locked in your preferred ${rise.toLowerCase()} so it sits exactly where you want.`,
    Other: 'We balanced every measurement for an all-round confident fit.',
  }[answers.frustration] || 'We balanced every measurement for an all-round confident fit.'

  const confidence = computeConfidence(answers)

  return {
    size: size ? `W${size}` : '—',
    cut,
    rise,
    leg,
    confidence,
    note: frustrationNote,
  }
}

function computeConfidence(answers) {
  // More data → higher confidence. Brands/sizes add real calibration.
  let score = 60
  if (answers.height) score += 6
  if (answers.waist) score += 10
  if (answers.hip) score += 10
  if (answers.weight) score += 4
  if (answers.brands && answers.brands.length) score += 6
  if (answers.sizes && Object.keys(answers.sizes).length) score += 4
  return Math.min(97, score)
}
