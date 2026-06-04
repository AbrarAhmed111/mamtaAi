import '../assets/css/globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ReactNode } from 'react'
import Providers from '@/store/Providers'
import { AuthProvider } from '@/lib/supabase/context'
import { metadata as siteMetadata, viewport as siteViewport } from '@/lib/site-metadata'

export const metadata = siteMetadata
export const viewport = siteViewport

type RootLayoutProps = {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <Providers>
      <AuthProvider>
        <html lang="en" suppressHydrationWarning>
          <body suppressHydrationWarning className="antialiased">
            <Toaster position="top-center" />
            {children}
          </body>
        </html>
      </AuthProvider>
    </Providers>
  )
}
