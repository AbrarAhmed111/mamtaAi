'use client';

import { FaCheck } from 'react-icons/fa';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  earned: boolean;
  earnedAt?: Date;
}

interface BadgesSectionProps {
  badges: Badge[];
}

export default function BadgesSection({ badges }: BadgesSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Badges</h3>
      
      <div className="space-y-3">
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.id}
              className={`flex items-center space-x-3 p-3 rounded-lg ${
                badge.earned ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                badge.earned ? 'bg-yellow-100' : 'bg-gray-100'
              }`}>
                <Icon className={`text-sm ${badge.earned ? badge.color : 'text-gray-400'}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  badge.earned ? 'text-yellow-800' : 'text-gray-600'
                }`}>
                  {badge.name}
                </p>
                <p className="text-xs text-gray-500">{badge.description}</p>
              </div>
              {badge.earned && <FaCheck className="text-green-500" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
