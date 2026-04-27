export type BabyHealthSuggestionInput = {
  name: string
  birthDate: string | null
  gender: string | null
  bloodType: string | null
  weightKg: number | null
  heightCm: number | null
}

function monthsFromBirth(birthDateISO: string | null): number | null {
  if (!birthDateISO) return null
  const bd = new Date(birthDateISO)
  if (Number.isNaN(bd.getTime())) return null
  const now = new Date()
  let months = (now.getFullYear() - bd.getFullYear()) * 12 + (now.getMonth() - bd.getMonth())
  if (now.getDate() < bd.getDate()) months -= 1
  return Math.max(0, months)
}

/**
 * Short, general wellness tips based on profile fields — not medical advice.
 */
export function buildBabyHealthSuggestions(b: BabyHealthSuggestionInput): string[] {
  const tips: string[] = []
  const months = monthsFromBirth(b.birthDate)
  const first = b.name.trim() || 'Your baby'

  if (months === null) {
    tips.push(`Track ${first}'s feeding, sleep, and diapers so you can spot patterns early.`)
  } else if (months < 1) {
    tips.push(
      `In the first weeks, ${first} may feed very often; offer milk on demand and watch for enough wet diapers each day.`,
    )
    tips.push(
      'Place your baby on their back for sleep, on a firm surface without loose bedding — safe sleep reduces risk.',
    )
  } else if (months < 3) {
    tips.push(`Around ${months + 1} months, short periods of tummy time while awake help strengthen neck and shoulders.`)
    tips.push('Watch for steady weight gain and alert periods between naps; contact your clinician if you are worried.')
  } else if (months < 6) {
    tips.push('If you have started solids, introduce one new food at a time and watch for any reactions.')
    tips.push('Continue regular well-baby visits for growth checks and vaccinations as advised locally.')
  } else {
    tips.push('Active play, reading aloud, and back-and-forth “conversation” support development at this age.')
    tips.push('Keep routines for sleep and meals where possible — predictability often helps mood and digestion.')
  }

  if (b.weightKg != null && b.weightKg < 2.5) {
    tips.push('Low birth weight babies may need closer follow-up with your care team about feeding and weight gain.')
  }

  if (b.heightCm != null && b.weightKg != null && months != null && months >= 0) {
    const w = b.weightKg
    const h = b.heightCm / 100
    if (h > 0) {
      const bmi = w / (h * h)
      if (bmi < 10) {
        tips.push('If growth seems very low on the chart, ask your pediatrician to review length-for-age and weight-for-length.')
      }
    }
  }

  if (b.bloodType) {
    tips.push(`Keep ${first}'s blood type (${b.bloodType}) noted for hospital visits or emergencies.`)
  }

  tips.push('This information is educational only and does not replace advice from a qualified clinician.')

  return tips.slice(0, 8)
}
