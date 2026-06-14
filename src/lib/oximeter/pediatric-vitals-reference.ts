export const PEDIATRIC_VITALS_REFERENCE = {
  title: 'MamtaAI Pediatric Vital Signs Reference Chart',
  description:
    'Healthy heart rate, SpO₂, and other vital ranges by age—from newborn to adolescent. Use it to set sensible oximeter alert limits.',
  pdfUrl:
    'https://sznhsvfitsvqfvfejavk.supabase.co/storage/v1/object/public/shared-resources/1781412742440_icpuz4dkb2f.pdf',
  attribution:
    'Adapted from PALS Guidelines (2015) and CPS Position Statement on Temperature Measurement in Pediatrics (2015); Dr. Chris Novak & Dr. Peter Gill, pedscases.com.',
} as const

export const PEDIATRIC_VITALS_REFERENCE_ANCHOR = 'pediatric-vitals-reference'

export const PEDIATRIC_VITALS_REFERENCE_PAGE = `/dashboard/oximeter#${PEDIATRIC_VITALS_REFERENCE_ANCHOR}`
