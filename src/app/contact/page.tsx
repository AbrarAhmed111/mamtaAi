import type { Metadata } from 'next'
import ContactPage from '@/components/marketing/ContactPage'

export const metadata: Metadata = {
  title: 'Contact Us | MumtaAI',
  description:
    'Get in touch with the MumtaAI team. Questions, feedback, or support — send us a message and we will get back to you.',
}

export default function Page() {
  return <ContactPage />
}
