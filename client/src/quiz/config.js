// ─────────────────────────────────────────────────────────────────────────────
// Jackie Jeans — Fit Quiz definition (single source of truth)
// Both the Manual flow and the Voice flow are generated from this config so the
// two experiences can never drift out of sync.
// ─────────────────────────────────────────────────────────────────────────────

// Build the height options from 4'10" to 6'2" (inclusive).
function buildHeights() {
  const out = []
  for (let feet = 4; feet <= 6; feet++) {
    for (let inch = 0; inch <= 11; inch++) {
      const totalInches = feet * 12 + inch
      if (totalInches < 4 * 12 + 10) continue // start at 4'10"
      if (totalInches > 6 * 12 + 2) break // stop at 6'2"
      out.push(`${feet}'${inch}"`)
    }
  }
  return out
}

// Numeric inch range helper, e.g. 24"–52".
function buildInches(from, to) {
  const out = []
  for (let i = from; i <= to; i++) out.push(`${i}"`)
  return out
}

export const HEIGHTS = buildHeights()
export const WAISTS = buildInches(24, 52)
export const HIPS = buildInches(32, 60)

export const BRANDS = [
  "Levi's",
  'Wrangler',
  'Lee',
  'Calvin Klein',
  'Gap',
  'American Eagle',
  'Madewell',
  'AGOLDE',
  'Re/Done',
  'Mother',
  'Citizens of Humanity',
  'Frame',
  'Good American',
  'Abercrombie & Fitch',
  'Zara',
  'H&M',
  'Uniqlo',
  'Diesel',
  'True Religion',
  'Lucky Brand',
]

// Each question carries everything BOTH flows need:
//  - manual rendering (type, options)
//  - voice behaviour (prompt, examples, parser hints)
export const QUESTIONS = [
  {
    id: 'height',
    index: 1,
    type: 'select',
    label: 'What is your height?',
    help: 'This drives the inseam and length we recommend.',
    options: HEIGHTS,
    placeholder: 'Select your height',
    voicePrompt: "First up — what's your height?",
    voiceExamples: 'You can say something like "five foot six."',
    parser: 'height',
  },
  {
    id: 'weight',
    index: 2,
    type: 'number',
    optional: true,
    label: 'What is your weight?',
    help: 'Optional — it helps calibrate proportional fit. Feel free to skip.',
    unit: 'lbs',
    min: 70,
    max: 400,
    placeholder: 'e.g. 150',
    voicePrompt:
      "What's your weight in pounds? This one's optional — just say \"skip\" if you'd rather not.",
    voiceExamples: 'For example, "one fifty," or simply "skip."',
    parser: 'weightOrSkip',
  },
  {
    id: 'waist',
    index: 3,
    type: 'select',
    label: 'Waist measurement',
    help: 'Measure around the narrowest point of your waist, in inches.',
    options: WAISTS,
    placeholder: 'Select waist (inches)',
    voicePrompt:
      'Now your waist measurement, in inches — measured at the narrowest point.',
    voiceExamples: 'Such as "about thirty inches."',
    parser: 'inches',
    range: [24, 52],
  },
  {
    id: 'hip',
    index: 4,
    type: 'select',
    label: 'Hip measurement',
    help: 'Measure around the fullest point of your hips, in inches.',
    options: HIPS,
    placeholder: 'Select hip (inches)',
    voicePrompt: 'And your hip measurement, in inches, at the fullest point?',
    voiceExamples: 'Like "forty inches."',
    parser: 'inches',
    range: [32, 60],
  },
  {
    id: 'waistFit',
    index: 5,
    type: 'choice',
    label: 'How do you like jeans to fit at the waist?',
    help: 'Same measurements can feel very different depending on this.',
    options: ['Snug', 'Slightly relaxed', 'Relaxed'],
    voicePrompt:
      'How do you like jeans to fit at the waist — snug, slightly relaxed, or relaxed?',
    parser: 'choice',
  },
  {
    id: 'rise',
    index: 6,
    type: 'choice',
    label: 'Where should the waistband sit?',
    help: 'This narrows the styles we suggest.',
    options: ['High rise', 'Mid rise', 'Low rise'],
    voicePrompt:
      'Where should the waistband sit — high rise, mid rise, or low rise?',
    parser: 'choice',
  },
  {
    id: 'thighFit',
    index: 7,
    type: 'choice',
    label: 'How should jeans fit through the thighs?',
    help: "It's the second most common fit complaint after the waist.",
    options: ['Fitted', 'Relaxed', 'Loose'],
    voicePrompt:
      'Through the thighs, how should they fit — fitted, relaxed, or loose?',
    parser: 'choice',
  },
  {
    id: 'brands',
    index: 8,
    type: 'multiselect',
    label: 'Which denim brands have you bought before?',
    help: 'Pick any you can remember — it helps us calibrate sizing.',
    options: BRANDS,
    optional: true,
    voicePrompt:
      "Which denim brands have you bought before? Name as many as you like — or say \"none\" if you can't recall any.",
    voiceExamples: 'For example, "Levi\'s, Madewell, and Zara."',
    parser: 'brands',
  },
  {
    id: 'sizes',
    index: 9,
    type: 'perBrandSize',
    label: 'What size did you buy in those brands?',
    help: 'Your usual size in each — this is our ground truth.',
    dependsOn: 'brands',
    voicePrompt: 'And what size did you usually buy in {brand}?',
    voiceExamples: 'Such as "a 30," or "medium."',
    parser: 'size',
  },
  {
    id: 'frustration',
    index: 10,
    type: 'choice',
    label: 'Biggest fit frustration when buying jeans?',
    help: 'We use this to personalise how we explain your recommendation.',
    options: [
      'Waist gap',
      'Hip tightness',
      'Wrong length',
      'Thigh fit',
      'Rise',
      'Other',
    ],
    voicePrompt:
      "Last one — what's your biggest frustration buying jeans? Waist gap, hip tightness, wrong length, thigh fit, rise, or something else?",
    parser: 'choice',
  },
]

export const TOTAL_QUESTIONS = QUESTIONS.length

export const SITE_URL = 'https://jackie-jeans.vercel.app/'
