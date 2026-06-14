'use client'

import AuthScreenLayout from '@/components/auth/AuthScreenLayout'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthScreenLayout>{children}</AuthScreenLayout>
}
