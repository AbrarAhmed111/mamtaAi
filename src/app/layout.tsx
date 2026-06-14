import '../assets/css/globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ReactNode } from 'react'
import Providers from '@/store/Providers'
import { AuthProvider } from '@/lib/supabase/context'
import SmoothHashScroll from '@/components/marketing/SmoothHashScroll'
import { metadata as siteMetadata, viewport as siteViewport } from '@/lib/site-metadata'
import { getServerAuthUser } from '@/lib/supabase/server-auth'

export const metadata = siteMetadata
export const viewport = siteViewport

type RootLayoutProps = {
  children: ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const initialUser = await getServerAuthUser()

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased">
        <Providers>
          <AuthProvider initialUser={initialUser}>
            <SmoothHashScroll />
            <Toaster position="top-center" />
            {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
