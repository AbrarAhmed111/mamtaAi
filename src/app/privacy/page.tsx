import type { Metadata } from 'next'
import LegalPageLayout from '@/components/marketing/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy | MumtaAI',
  description: 'How MumtaAI collects, uses, and protects your personal and baby-related data.',
}

const sections = [
  {
    title: '1. Overview',
    paragraphs: [
      'MumtaAI respects your privacy. This Privacy Policy explains what information we collect, how we use it, and the choices you have when using our platform.',
      'By using MumtaAI, you consent to the practices described here, in addition to our Terms of Service.',
    ],
  },
  {
    title: '2. Information We Collect',
    paragraphs: ['We may collect the following categories of information:'],
    list: [
      'Account details such as name, email address, phone number, and profile preferences.',
      'Baby profile information you choose to provide (for example name, birth date, and health notes).',
      'Audio recordings and AI analysis results when you use cry recording features.',
      'Oximeter and health monitoring data when you connect supported devices.',
      'Usage data, device information, and logs needed to operate and secure the service.',
      'Payment and subscription metadata processed by our billing provider (we do not store full card numbers).',
    ],
  },
  {
    title: '3. How We Use Information',
    paragraphs: ['We use collected information to:'],
    list: [
      'Provide, maintain, and improve MumtaAI features.',
      'Personalize insights and link readings to the correct baby profile.',
      'Process subscriptions and send service-related communications.',
      'Enable family and caregiver access according to your permissions.',
      'Detect abuse, secure accounts, and comply with legal obligations.',
    ],
  },
  {
    title: '4. Sharing and Access',
    paragraphs: [
      'We do not sell your personal information. We may share data with trusted service providers (such as hosting, authentication, email, and payment processors) who assist in operating MumtaAI under contractual safeguards.',
      'Family members and caregivers you invite may access baby-related data according to the permissions you grant within the app.',
    ],
  },
  {
    title: '5. Data Retention and Security',
    paragraphs: [
      'We retain information for as long as your account is active or as needed to provide the service, comply with law, and resolve disputes.',
      'We use encryption, access controls, and industry-standard security practices. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.',
    ],
  },
  {
    title: '6. Your Choices and Rights',
    paragraphs: ['Depending on your location, you may have rights to:'],
    list: [
      'Access, correct, or delete certain personal information.',
      'Export data associated with your account where available.',
      'Manage notification and marketing preferences in Settings.',
      'Withdraw consent where processing is consent-based, subject to legal limits.',
    ],
  },
  {
    title: '7. Children’s Data',
    paragraphs: [
      'MumtaAI is designed for use by parents and authorized caregivers. Baby profile and health information is provided and controlled by the account holder. We do not knowingly collect personal information directly from children without appropriate parental authorization through the account holder.',
    ],
  },
  {
    title: '8. International Users',
    paragraphs: [
      'If you access MumtaAI from outside the country where our servers are located, your information may be processed in jurisdictions with different data protection laws.',
    ],
  },
  {
    title: '9. Updates and Contact',
    paragraphs: [
      'We may update this Privacy Policy periodically. Material changes will be reflected by updating the “Last updated” date above.',
      'Privacy questions or requests may be sent to support@mamtaai.com.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="This policy describes how MumtaAI handles personal information, baby profiles, recordings, and health-related data."
      lastUpdated="June 14, 2026"
      sections={sections}
    />
  )
}
