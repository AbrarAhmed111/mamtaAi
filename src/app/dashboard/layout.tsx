'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Dashboard/Sidebar'
import DashboardHeader from '@/components/Dashboard/DashboardHeader'
import { useAuth } from '@/lib/supabase/context'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev)

  const displayUser = {
    name: user?.profile?.full_name || 'User',
    role: (user?.profile?.role as string) || 'parent',
    avatar: user?.profile?.avatar_url || undefined,
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    if (hour < 22) return 'Good Evening'
    return 'Good Night'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex">
      <Sidebar
        currentPath={pathname || '/dashboard'}
        user={displayUser}
        isOpen={isMobileMenuOpen}
        onToggle={toggleMobileMenu}
      />

      <div className="flex-1 flex flex-col lg:ml-64">
        <DashboardHeader
          greeting={getGreeting()}
          userName={displayUser.name.split(' ')[0]}
          userAvatarUrl={displayUser.avatar}
          onMenuToggle={toggleMobileMenu}
          onSignOut={async () => {
            try {
              await signOut()
            } finally {
              window.location.href = '/welcome'
            }
          }}
        />

        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </div>
    </div>
  )
}


