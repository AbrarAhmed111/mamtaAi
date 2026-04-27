export type CryGuidance = {
  /** Short “what to check next” ideas */
  suggestions: string[]
  /** Practical care steps */
  tips: string[]
}

const DEFAULT: CryGuidance = {
  suggestions: [
    'Watch for patterns: time since last feed, nap, or diaper change.',
    'Note if the cry changes pitch or stops when you hold or soothe your baby.',
  ],
  tips: [
    'Stay calm and go through basics: hunger, sleep, comfort, diaper.',
    'Contact your pediatrician if you are worried or symptoms seem unusual.',
  ],
}

const GUIDE: Record<string, CryGuidance> = {
  hunger: {
    suggestions: [
      'Try offering a small feed even if it was recent — cluster feeding is common.',
      'Check rooting, lip smacking, or fist-to-mouth cues alongside the cry.',
    ],
    tips: [
      'Offer breast or bottle slowly; pause for burping mid-feed if fussy.',
      'Track last feed time so the next caregiver knows the rhythm.',
    ],
  },
  sleepy: {
    suggestions: [
      'Look for yawning, eye rubbing, zoning out, or shorter wake windows than usual.',
      'Reduce stimulation: dim lights, lower noise, slower movements.',
    ],
    tips: [
      'Start a short wind-down (swaddle if you use one, white noise, rocking).',
      'Put down drowsy but awake when possible to support self-settling over time.',
    ],
  },
  sleep: {
    suggestions: [
      'Often overlaps with tired — check wake window and overstimulation.',
      'If fighting sleep, try a change of scene: dark room + consistent sound.',
    ],
    tips: [
      'Keep wake windows age-appropriate; an overtired baby cries harder.',
      'Safe sleep: alone, on back, flat surface, no loose bedding.',
    ],
  },
  tired: {
    suggestions: ['Treat like sleep pressure building — earlier nap may help today.'],
    tips: ['Shorten the next wake window slightly and watch for earlier sleepy cues.'],
  },
  pain: {
    suggestions: [
      'Look for fever, vomiting, unusual lethargy, rash, or injury — seek care if present.',
      'Gas or reflux can mimic pain; gentle bicycle legs or upright hold after feeds.',
    ],
    tips: [
      'If pain seems persistent or intense, call your pediatrician or local urgent line.',
      'Document when crying started and what soothes or worsens it.',
    ],
  },
  discomfort: {
    suggestions: [
      'Temperature, clothing tags, hair tourniquet, or diaper rash are common causes.',
      'Teething or mild illness can increase baseline fussiness.',
    ],
    tips: [
      'Do a head-to-toe check: toes, fingers, neck folds, diaper fit.',
      'Offer comfort holds; if fever ≥100.4°F (38°C) in young infants, call your clinician.',
    ],
  },
  fussy: {
    suggestions: [
      'Often a mix of needs — run through feed, burp, diaper, sleep in order.',
      'Purple crying peaks in early months; soothing rhythm matters more than “fixing”.',
    ],
    tips: [
      'Try 5 S’s (swaddle, side/stomach hold while awake, shush, swing, suck) if you use them.',
      'Tag-team with another adult if you need a short break.',
    ],
  },
  gas: {
    suggestions: [
      'Burp mid-feed and after; upright position 15–20 minutes can help.',
      'Tummy massage or bicycle legs may release trapped gas.',
    ],
    tips: ['If bottle feeding, check nipple flow — too fast can increase air swallowing.'],
  },
  colic: {
    suggestions: [
      'Evening fussing clusters are common; rule out hunger and overtiredness first.',
      'Track duration — if crying is many hours daily, discuss with your pediatrician.',
    ],
    tips: [
      'Reduce overstimulation late day; predictable low-light routine can help.',
      'It is okay to set baby safely down and breathe for a minute if you are overwhelmed.',
    ],
  },
  burp: {
    suggestions: ['Mid-feed pauses for burping often reduce end-of-feed fussing.'],
    tips: ['Hold upright on chest or over shoulder; gentle patting rhythm.'],
  },
  lonely: {
    suggestions: ['Your baby may want closeness, voice, or slow motion — not always “needs”.'],
    tips: ['Wear baby or hold while you sit; sing or hum at a steady slow pace.'],
  },
  bored: {
    suggestions: ['Change of face, gentle voice, or a new safe texture to look at can help.'],
    tips: ['Short floor time with you nearby can reset attention without overstimulation.'],
  },
  unknown: DEFAULT,
}

function normalizeCryKey(raw: string): string {
  return String(raw || 'unknown')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_')
}

export function formatCryTypeLabel(raw: string): string {
  const k = normalizeCryKey(raw)
  if (!k || k === 'unknown') return 'Unknown'
  return k
    .split('_')
    .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ')
}

export function getCryTypeGuidance(raw: string): CryGuidance {
  const k = normalizeCryKey(raw)
  if (GUIDE[k]) return GUIDE[k]
  if (k.includes('hunger') || k.includes('feed')) return GUIDE.hunger
  if (k.includes('sleep') || k.includes('drows')) return GUIDE.sleepy
  if (k.includes('pain') || k.includes('hurt')) return GUIDE.pain
  if (k.includes('discomfort') || k.includes('uncomfort')) return GUIDE.discomfort
  if (k.includes('fuss')) return GUIDE.fussy
  if (k.includes('gas') || k.includes('wind')) return GUIDE.gas
  if (k.includes('colic')) return GUIDE.colic
  if (k.includes('burp')) return GUIDE.burp
  if (k.includes('lonely') || k.includes('attention')) return GUIDE.lonely
  if (k.includes('bored')) return GUIDE.bored
  return DEFAULT
}
