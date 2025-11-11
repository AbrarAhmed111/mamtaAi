'use client';

import { FaCheck } from 'react-icons/fa';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ComponentType<any>;
  action: string;
}

interface WelcomeChecklistProps {
  checklist: ChecklistItem[];
  onItemAction?: (itemId: string) => void;
}

export default function WelcomeChecklist({ 
  checklist, 
  onItemAction 
}: WelcomeChecklistProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">🎉 Welcome Checklist</h3>
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
                
                <div className="flex items-center">
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
    </div>
  );
}
