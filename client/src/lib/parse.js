// ─────────────────────────────────────────────────────────────────────────────
// Natural-language parsing for the voice flow.
// Turns messy spoken transcripts ("about thirty inches", "five foot six",
// "levis and madewell") into the exact option strings the quiz expects.
// ─────────────────────────────────────────────────────────────────────────────

import { BRANDS } from '../quiz/config.js'

const ONES = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19,
}
const TENS = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90,
}

// "one fifty", "thirty two", "forty" → number. Also handles plain digits.
export function wordsToNumber(text) {
  if (!text) return null
  const cleaned = text
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\band\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Direct digits anywhere ("about 30 inches").
  const digit = cleaned.match(/\d+/)
  // Spoken "one fifty" style → hundreds.
  const hundredsMatch = cleaned.match(/\b(one|two|three)\s+(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/)
  if (hundredsMatch) {
    const h = ONES[hundredsMatch[1]] * 100
    const rest = cleaned.slice(hundredsMatch.index + hundredsMatch[0].length).trim()
    return h + (parseTensOnes(hundredsMatch[2] + ' ' + rest) ?? 0)
  }
  if (/\bhundred\b/.test(cleaned)) {
    const before = cleaned.split('hundred')[0].trim().split(' ').pop()
    const base = (ONES[before] ?? 1) * 100
    const after = cleaned.split('hundred')[1] || ''
    return base + (parseTensOnes(after) ?? 0)
  }

  const words = parseTensOnes(cleaned)
  if (words != null) return words
  if (digit) return parseInt(digit[0], 10)
  return null
}

function parseTensOnes(text) {
  const tokens = text.toLowerCase().split(/\s+/).filter(Boolean)
  let total = null
  for (const t of tokens) {
    if (TENS[t] != null) total = (total ?? 0) + TENS[t]
    else if (ONES[t] != null) total = (total ?? 0) + ONES[t]
  }
  return total
}

// Height: "five foot six", "five six", "five ten", "5 11", "five feet".
export function parseHeight(text) {
  if (!text) return null
  const t = text.toLowerCase().replace(/-/g, ' ')

  // Digit form e.g. 5'6, 5 6, 5ft6
  const digit = t.match(/(\d)\s*(?:'|ft|feet|foot|’)?\s*(\d{1,2})?/)
  let feet = null
  let inches = 0

  const footWord = t.match(/\b(four|five|six)\b/)
  if (footWord) feet = ONES[footWord[1]]
  if (digit && digit[1]) feet = parseInt(digit[1], 10)

  if (feet == null) return null

  // inches: word after "foot/feet" or trailing digits
  const afterFoot = t.split(/foot|feet|ft|'|’/)[1]
  if (afterFoot != null && afterFoot.trim()) {
    const n = wordsToNumber(afterFoot)
    if (n != null && n <= 11) inches = n
  } else if (digit && digit[2]) {
    inches = parseInt(digit[2], 10)
  } else {
    // "five ten" with no foot keyword
    const nums = t.split(/\s+/).map((w) => ONES[w]).filter((x) => x != null)
    if (nums.length >= 2) inches = nums[1]
  }
  if (inches > 11) inches = 0
  const totalInches = feet * 12 + inches
  if (totalInches < 4 * 12 + 10 || totalInches > 6 * 12 + 2) return null
  return `${feet}'${inches}"`
}

// Inches measurement clamped to a valid range, returns e.g. `30"`.
export function parseInchesInRange(text, [min, max]) {
  const n = wordsToNumber(text)
  if (n == null) return null
  if (n < min || n > max) return null
  return `${n}"`
}

// Weight (lbs) or an explicit skip.
export function parseWeightOrSkip(text) {
  if (!text) return null
  const t = text.toLowerCase()
  if (/\b(skip|pass|next|no|rather not|prefer not|don'?t want|none|na)\b/.test(t)) {
    return { skip: true }
  }
  const n = wordsToNumber(text)
  if (n == null) return null
  if (n < 50 || n > 600) return null
  return { value: n }
}

// Generic fuzzy choice matcher against a small option list.
export function parseChoice(text, options) {
  if (!text) return null
  const t = text.toLowerCase()

  // direct / contains match first
  for (const opt of options) {
    const o = opt.toLowerCase()
    if (t.includes(o)) return opt
  }
  // keyword match on the distinctive word of each option
  const keywords = {
    snug: 'Snug',
    tight: 'Snug',
    fitted: 'Fitted',
    slightly: 'Slightly relaxed',
    relaxed: 'Relaxed',
    loose: 'Loose',
    high: 'High rise',
    mid: 'Mid rise',
    middle: 'Mid rise',
    low: 'Low rise',
    gap: 'Waist gap',
    waist: 'Waist gap',
    hip: 'Hip tightness',
    length: 'Wrong length',
    long: 'Wrong length',
    short: 'Wrong length',
    thigh: 'Thigh fit',
    rise: 'Rise',
    other: 'Other',
    something: 'Other',
  }
  for (const [kw, val] of Object.entries(keywords)) {
    if (t.includes(kw) && options.includes(val)) return val
  }
  return null
}

// Multi-select brand parser → returns array of canonical brand names.
export function parseBrands(text) {
  if (!text) return []
  const t = text.toLowerCase()
  if (/\b(none|nothing|can'?t recall|don'?t remember|no brands|skip)\b/.test(t)) {
    return []
  }
  const found = []
  for (const brand of BRANDS) {
    const aliases = brandAliases(brand)
    if (aliases.some((a) => t.includes(a))) found.push(brand)
  }
  return found
}

function brandAliases(brand) {
  const b = brand.toLowerCase()
  const map = {
    "levi's": ['levi', 'levis', "levi's"],
    'calvin klein': ['calvin', 'klein', 'ck'],
    'american eagle': ['american eagle', 'eagle', 'ae'],
    'citizens of humanity': ['citizens', 'humanity'],
    'good american': ['good american'],
    'abercrombie & fitch': ['abercrombie', 'fitch', 'a&f'],
    're/done': ['redone', 're done', 're/done'],
    'true religion': ['true religion'],
    'lucky brand': ['lucky'],
    'h&m': ['h&m', 'h and m', 'hm'],
  }
  return map[b] || [b]
}

// Per-brand size: accept a number ("30"), or letter sizing (S/M/L/XL),
// or things like "size 8".
export function parseSize(text) {
  if (!text) return null
  const t = text.toLowerCase().trim()
  const letter = t.match(/\b(extra small|x small|xs|small|s|medium|m|large|l|extra large|x large|xl|xxl)\b/)
  const n = wordsToNumber(t)
  if (n != null) return String(n)
  if (letter) {
    const map = {
      'extra small': 'XS', 'x small': 'XS', xs: 'XS',
      small: 'S', s: 'S',
      medium: 'M', m: 'M',
      large: 'L', l: 'L',
      'extra large': 'XL', 'x large': 'XL', xl: 'XL', xxl: 'XXL',
    }
    return map[letter[1]] || letter[1].toUpperCase()
  }
  return null
}

// Yes / no / affirmation detection for confirmations.
export function parseYesNo(text) {
  if (!text) return null
  const t = text.toLowerCase()
  if (/\b(yes|yeah|yep|yup|correct|right|sure|that'?s right|exactly|perfect|sounds good|confirm)\b/.test(t)) return true
  if (/\b(no|nope|nah|wrong|incorrect|change|redo|again|not quite)\b/.test(t)) return false
  return null
}

// Dispatch by parser name declared in the quiz config.
export function runParser(name, text, question) {
  switch (name) {
    case 'height':
      return parseHeight(text)
    case 'inches':
      return parseInchesInRange(text, question.range)
    case 'weightOrSkip':
      return parseWeightOrSkip(text)
    case 'choice':
      return parseChoice(text, question.options)
    case 'brands':
      return parseBrands(text)
    case 'size':
      return parseSize(text)
    default:
      return text
  }
}
