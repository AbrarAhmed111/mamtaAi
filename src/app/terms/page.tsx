import type { Metadata } from 'next'
import LegalPageLayout from '@/components/marketing/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Terms of Service | MumtaAI',
  description: 'Terms of Service for using the MumtaAI platform and related services.',
}

const sections = [
  {
    title: '1. Acceptance of Terms',
    paragraphs: [
      'By creating an account or using MumtaAI, you agree to these Terms of Service. If you do not agree, do not use the service.',
      'MumtaAI is operated as a software platform for parents and caregivers. You must be at least 18 years old, or the age of majority in your jurisdiction, to register.',
    ],
  },
  {
    title: '2. Description of Service',
    paragraphs: [
      'MumtaAI provides AI-assisted baby cry analysis, health monitoring tools (including optional oximeter integration), community features, and related parental resources.',
      'The service is intended to support—not replace—professional medical judgment. MumtaAI is not a medical device and does not provide diagnoses.',
    ],
  },
  {
    title: '3. Accounts and Security',
    paragraphs: [
      'You are responsible for maintaining the confidentiality of your login credentials and for activity under your account.',
      'You agree to provide accurate registration information and to keep your profile up to date.',
    ],
    list: [
      'Notify us promptly if you suspect unauthorized access.',
      'Do not share accounts with unauthorized users.',
      'We may suspend accounts that violate these terms or pose a security risk.',
    ],
  },
  {
    title: '4. Subscriptions and Billing',
    paragraphs: [
      'Paid plans, trials, and promotional pricing are described on our pricing page. By subscribing, you authorize recurring charges according to your selected plan until you cancel.',
      'Refunds and cancellations are handled according to the billing provider and plan terms displayed at checkout.',
    ],
  },
  {
    title: '5. Acceptable Use',
    paragraphs: ['You agree not to misuse MumtaAI. Prohibited conduct includes:'],
    list: [
      'Uploading unlawful, harmful, or misleading content.',
      'Attempting to reverse engineer, scrape, or disrupt the platform.',
      'Harassing other users or experts in community areas.',
      'Using the service in violation of applicable laws or third-party rights.',
    ],
  },
  {
    title: '6. Health and Safety Disclaimer',
    paragraphs: [
      'Oximeter readings, cry analysis, and insights may be affected by device quality, environment, motion, and other factors. Always consult a qualified healthcare professional for medical concerns.',
      'In an emergency, contact local emergency services immediately.',
    ],
  },
  {
    title: '7. Intellectual Property',
    paragraphs: [
      'MumtaAI, its branding, software, and content are owned by MumtaAI or its licensors. You receive a limited, non-exclusive license to use the service for personal, non-commercial purposes unless otherwise agreed in writing.',
    ],
  },
  {
    title: '8. Limitation of Liability',
    paragraphs: [
      'To the fullest extent permitted by law, MumtaAI is not liable for indirect, incidental, or consequential damages arising from use of the service. Our total liability for any claim is limited to the amount you paid us in the twelve months before the claim, or one hundred US dollars, whichever is greater.',
    ],
  },
  {
    title: '9. Changes and Contact',
    paragraphs: [
      'We may update these terms from time to time. Continued use after changes constitutes acceptance of the revised terms.',
      'Questions about these Terms of Service may be sent to support@mamtaai.com.',
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="These terms govern your access to and use of MumtaAI, including our website, dashboard, and related features."
      lastUpdated="June 14, 2026"
      sections={sections}
    />
  )
}
