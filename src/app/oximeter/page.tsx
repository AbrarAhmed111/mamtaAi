import type { Metadata } from 'next'
import OximeterIntegrationPage from '@/components/marketing/oximeter/OximeterIntegrationPage'

export const metadata: Metadata = {
  title: 'Oximeter Integration | MamtaAI',
  description:
    'Connect a supported Bluetooth pulse oximeter to MamtaAI for real-time oxygen saturation, pulse rate, and session monitoring linked to your baby profile.',
}

export default function Page() {
  return <OximeterIntegrationPage />
}
