'use client';

import { FaUsers, FaChartLine, FaCog } from 'react-icons/fa';
import Link from 'next/link';

interface QuickActionsProps {
  onActionClick?: (action: string) => void;
}

export default function QuickActions({ onActionClick }: QuickActionsProps) {
  const actions = [
    {
      href: '/community',
      label: 'Join Community',
      icon: FaUsers,
      color: 'text-blue-600'
    },
    {
      href: '/insights',
      label: 'View Insights',
      icon: FaChartLine,
      color: 'text-green-600'
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: FaCog,
      color: 'text-gray-600'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => onActionClick?.(action.label)}
            >
              <Icon className={action.color} />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
