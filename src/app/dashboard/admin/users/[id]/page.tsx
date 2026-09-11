'use client'

import { useParams } from 'next/navigation'
import UserDetailView from '@/components/Dashboard/Admin/UserDetailView'

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>()
  const userId = params?.id

  if (!userId) {
    return null
  }

  return <UserDetailView userId={userId} />
}
