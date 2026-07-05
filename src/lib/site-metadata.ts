import type { Metadata, Viewport } from 'next'

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000'

export const siteConfig = {
  name: 'MumtaAI',
  tagline: "Understanding Your Baby's Every Cry",
  description:
    "Understanding your baby's every cry with AI-powered insights. MumtaAI helps families decode cries, track daily care, invite caregivers, and parent with confidence.",
  url: siteUrl,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ec4899',
  colorScheme: 'light',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  keywords: [
    'MumtaAI',
    'baby cry analysis',
    'AI parenting',
    'baby care app',
    'cry translation',
    'newborn tracking',
    'caregiver invites',
    'baby insights',
  ],
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [
      {
        url: '/mamta-email-logo.png',
        width: 512,
        height: 512,
        alt: `${siteConfig.name} logo`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: ['/mamta-email-logo.png'],
  },
  icons: {
    icon: [
      { url: '/favicons/favicon.ico', sizes: 'any' },
      { url: '/favicons/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicons/apple-touch-icon.png',
  },
  manifest: '/favicons/site.webmanifest',
  category: 'health',
}
