import type { PlanSlug } from '@/lib/subscription/types'

export type ComparisonValue = boolean | string

export type ComparisonRow = {
  category: string
  label: string
  free: ComparisonValue
  plus: ComparisonValue
  pro: ComparisonValue
}

export const PRICING_FAQ = [
  {
    q: 'Can I start on Free and upgrade later?',
    a: 'Yes. Your data stays when you upgrade. Limits apply to new actions on your current plan — we do not delete babies or recordings when you change plans.',
  },
  {
    q: 'What counts as one cry analysis?',
    a: 'Each saved recording that goes through our AI cry classification counts toward your monthly limit. Live microphone recordings count once saved.',
  },
  {
    q: 'Who should choose Plus vs Pro?',
    a: 'Plus fits most daily users with up to 3 babies and 2 caregivers. Pro is for larger families, unlimited community publishing, and all-time insights.',
  },
  {
    q: 'Is MamtaAI medical advice?',
    a: 'No. MamtaAI offers parenting support and AI-assisted cry insights. Always contact your pediatrician for medical concerns.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Paid plans can be canceled before renewal. After canceling, you keep access until the end of the billing period, then return to Free limits.',
  },
]

export const COMPARISON_ROWS: ComparisonRow[] = [
  { category: 'Profiles', label: 'Baby profiles', free: '1', plus: 'Up to 3', pro: 'Unlimited*' },
  { category: 'Recordings', label: 'Cry analyses / month', free: '7', plus: '60', pro: 'Unlimited*' },
  { category: 'Recordings', label: 'Max recording length', free: '30 sec', plus: '2 min', pro: '5 min' },
  { category: 'Family', label: 'Invite caregivers', free: false, plus: 'Up to 2', pro: 'Unlimited' },
  { category: 'Tracking', label: 'Activity logs / month', free: '20', plus: 'Unlimited', pro: 'Unlimited' },
  {
    category: 'Tracking',
    label: 'Activity types',
    free: 'Feeding, sleep, diaper',
    plus: 'All types',
    pro: 'All types',
  },
  { category: 'Insights', label: 'History window', free: '7 days', plus: '90 days', pro: 'All time' },
  { category: 'Insights', label: 'Full charts & trends', free: false, plus: true, pro: true },
  { category: 'Insights', label: 'CSV exports / month', free: '0', plus: '1', pro: 'Unlimited' },
  { category: 'Community', label: 'Read blog & forum', free: true, plus: true, pro: true },
  { category: 'Community', label: 'Publish blog posts', free: false, plus: '2 / month', pro: 'Unlimited' },
  { category: 'Community', label: 'Forum threads', free: '1 / week', plus: '10 / month', pro: 'Unlimited' },
  { category: 'Community', label: 'Resource uploads', free: false, plus: '3 total', pro: 'Unlimited' },
]

export type PlanUiConfig = {
  slug: PlanSlug
  accent: 'slate' | 'pink' | 'purple'
  iconBg: string
  gradient?: string
  idealFor: string
  sections: { title: string; items: string[] }[]
}

export const PLAN_UI: Record<PlanSlug, PlanUiConfig> = {
  free: {
    slug: 'free',
    accent: 'slate',
    iconBg: 'bg-slate-100 text-slate-600',
    idealFor: 'Trying MamtaAI with one baby',
    sections: [
      {
        title: 'Cry intelligence',
        items: [
          '7 AI cry analyses per calendar month',
          '30-second max recording length',
          'Live microphone capture only',
          'Full AI quality on every analysis',
        ],
      },
      {
        title: 'Care tracking',
        items: [
          '1 baby profile',
          '20 activity logs per month',
          'Feeding, sleep & diaper types only',
          '7-day insights summary',
        ],
      },
      {
        title: 'Community',
        items: [
          'Browse blog, forum & resources',
          '1 forum thread per week (4/month max)',
          'No blog posts or resource uploads',
        ],
      },
    ],
  },
  plus: {
    slug: 'plus',
    accent: 'pink',
    iconBg: 'bg-pink-100 text-pink-600',
    gradient: 'from-pink-500 to-rose-500',
    idealFor: 'Daily use with partner or grandparent',
    sections: [
      {
        title: 'Cry intelligence',
        items: [
          '60 cry analyses per month',
          '2-minute recordings',
          'Confidence scores & full cry guidance',
        ],
      },
      {
        title: 'Family & tracking',
        items: [
          'Up to 3 baby profiles',
          'Invite 2 caregivers (partner, nanny, grandparent)',
          'Unlimited activities — all types',
          'Medicine, milestones, play & more',
        ],
      },
      {
        title: 'Insights & community',
        items: [
          '90-day insights with full charts',
          '1 CSV export per month',
          '2 blog posts & 10 forum threads / month',
          'Up to 3 shared resources',
        ],
      },
    ],
  },
  pro: {
    slug: 'pro',
    accent: 'purple',
    iconBg: 'bg-purple-100 text-purple-600',
    gradient: 'from-purple-500 via-pink-500 to-rose-500',
    idealFor: 'Multi-child families & power caregivers',
    sections: [
      {
        title: 'Cry intelligence',
        items: [
          'Unlimited cry analyses (fair use)*',
          '5-minute recordings',
          'Live microphone capture',
          'Per-baby comparison insights',
        ],
      },
      {
        title: 'Family & tracking',
        items: [
          'Unlimited babies (soft cap 10)*',
          'Unlimited caregivers',
          'Unlimited activity logging',
          'All activity & milestone types',
        ],
      },
      {
        title: 'Insights & community',
        items: [
          'All-time history & unlimited exports',
          'Unlimited blog, forum & resources',
          'No promotional banners',
        ],
      },
    ],
  },
}

export function formatComparisonCell(value: ComparisonValue): { type: 'bool' | 'text'; display: string; positive: boolean } {
  if (typeof value === 'boolean') {
    return { type: 'bool', display: value ? 'yes' : 'no', positive: value }
  }
  const positive = value !== '0' && !String(value).startsWith('1 /')
  return { type: 'text', display: String(value), positive }
}
