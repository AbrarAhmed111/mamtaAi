'use client';

import { FaCheck, FaTrophy, FaGift } from 'react-icons/fa';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ComponentType<any>;
  points: number;
  action: string;
}

interface WelcomeChecklistProps {
  checklist: ChecklistItem[];
  totalPoints: number;
  onItemAction?: (itemId: string) => void;
}

export default function WelcomeChecklist({ 
  checklist, 
  totalPoints, 
  onItemAction 
}: WelcomeChecklistProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">🎉 Welcome Checklist</h3>
        <div className="flex items-center space-x-2">
          <FaTrophy className="text-yellow-500" />
          <span className="text-sm font-medium text-gray-600">{totalPoints} points</span>
        </div>
      </div>

      <div className="space-y-4">
        {checklist.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                item.completed
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.completed
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {item.completed ? <FaCheck /> : <Icon />}
                  </div>
                  <div>
                    <h4 className={`font-medium ${
                      item.completed ? 'text-green-800' : 'text-gray-900'
                    }`}>
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">+{item.points} pts</span>
                  {!item.completed && (
                    <button
                      onClick={() => onItemAction?.(item.id)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {item.action}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalPoints > 0 && (
        <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FaGift className="text-yellow-600" />
            <span className="font-semibold text-yellow-800">Great Progress!</span>
          </div>
          <p className="text-yellow-700 text-sm">
            You&apos;ve earned {totalPoints} points! Keep going to unlock special rewards and badges.
          </p>
        </div>
      )}
    </div>
  );
}
