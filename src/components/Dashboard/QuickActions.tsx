'use client';

import { FaChartLine, FaCog, FaChevronRight, FaUsers } from 'react-icons/fa';
import Link from 'next/link';

interface QuickActionsProps {
  onActionClick?: (action: string) => void;
}

const linkActions = [
  {
    href: '/dashboard/community',
    label: 'Join Community',
    icon: FaUsers,
    iconBg: 'bg-pink-50',
    iconColor: 'text-pink-500',
  },
  {
    href: '/dashboard/insights',
    label: 'View Insights',
    icon: FaChartLine,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: FaCog,
    iconBg: 'bg-gray-50',
    iconColor: 'text-gray-500',
  },
];

export default function QuickActions({ onActionClick }: QuickActionsProps) {
  return (
    <div className="rounded-3xl border border-pink-100/80 bg-white p-5 shadow-md shadow-pink-100/20">
      <h3 className="mb-4 text-lg font-bold text-gray-900">Quick Actions</h3>

      <div className="space-y-2">
        {linkActions.map(action => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-2xl border border-transparent bg-pink-50/30 p-3.5 transition-all hover:border-pink-100 hover:bg-pink-50/60"
              onClick={() => onActionClick?.(action.label)}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.iconBg}`}
              >
                <Icon className={`text-base ${action.iconColor}`} />
              </div>
              <span className="flex-1 text-sm font-semibold text-gray-800 group-hover:text-pink-700">
                {action.label}
              </span>
              <FaChevronRight className="h-3 w-3 shrink-0 text-gray-300 transition-colors group-hover:text-pink-400" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
