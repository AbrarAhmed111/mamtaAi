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
      iconColor: 'text-pink-600',
      bgGradient: 'from-pink-50 to-rose-50'
    },
    {
      href: '/insights',
      label: 'View Insights',
      icon: FaChartLine,
      iconColor: 'text-purple-600',
      bgGradient: 'from-purple-50 to-pink-50'
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: FaCog,
      iconColor: 'text-gray-600',
      bgGradient: 'from-gray-50 to-gray-100'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 bg-gradient-to-br from-white to-pink-50/20">
      <h3 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-5">
        Quick Actions
      </h3>
      
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center space-x-4 p-4 rounded-xl hover:shadow-md transition-all duration-300 bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 border border-pink-100 hover:border-pink-200 group"
              onClick={() => onActionClick?.(action.label)}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.bgGradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`text-lg ${action.iconColor}`} />
              </div>
              <span className="text-sm font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
