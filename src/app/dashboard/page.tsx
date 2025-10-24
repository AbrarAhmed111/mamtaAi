'use client';

import Dashboard from '@/components/Dashboard/Dashboard';

export default function DashboardPage() {
  const user = {
    name: 'Sarah Johnson',
    role: 'Parent',
    avatar: '/api/placeholder/40/40'
  };

  return (
    <Dashboard
      user={user}
      currentPath="/dashboard"
    />
  );
}