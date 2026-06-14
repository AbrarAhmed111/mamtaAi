'use client'

import { useRouter } from 'next/navigation'
import ExpertApplicationAuthForm from '@/components/auth/ExpertApplicationAuthForm'

export default function AuthExpertApplicationPage() {
  const router = useRouter()

  return (
    <ExpertApplicationAuthForm
      onBack={() => router.replace('/auth/role')}
      afterSubmitPath="/onboarding?status=pending"
    />
  )
}
