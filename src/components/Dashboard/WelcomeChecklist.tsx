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
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 bg-gradient-to-br from-white to-pink-50/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          🎉 Welcome Checklist
        </h3>
      </div>

      <div className="space-y-4">
        {checklist.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`p-5 rounded-xl border-2 transition-all duration-300 ${
                item.completed
                  ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm'
                  : 'border-pink-200 hover:border-pink-300 bg-gradient-to-br from-white to-pink-50/30 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      item.completed
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg'
                        : 'bg-gradient-to-br from-pink-100 to-rose-100 text-pink-600'
                    }`}
                  >
                    {item.completed ? <FaCheck className="text-lg" /> : <Icon className="text-lg" />}
                  </div>
                  <div>
                    <h4 className={`font-semibold text-lg ${
                      item.completed ? 'text-green-800' : 'text-gray-900'
                    }`}>
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  {!item.completed && (
                    <button
                      onClick={() => onItemAction?.(item.id)}
                      className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
