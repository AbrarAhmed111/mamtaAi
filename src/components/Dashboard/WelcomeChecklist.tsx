'use client';

import { FaCheck } from 'react-icons/fa';
import Spinner from '@/components/ui/spinner';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ComponentType<{ className?: string }>;
  action: string;
  loading?: boolean;
}

interface WelcomeChecklistProps {
  checklist: ChecklistItem[];
  onItemAction?: (itemId: string) => void;
}

export default function WelcomeChecklist({ checklist, onItemAction }: WelcomeChecklistProps) {
  return (
    <div className="rounded-3xl border border-pink-100/80 bg-white p-5 shadow-md shadow-pink-100/20 sm:p-6">
      <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900 sm:text-xl">
        <span aria-hidden>🎉</span>
        Welcome Checklist
      </h3>

      <div className="space-y-3">
        {checklist.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`flex flex-col gap-4 rounded-2xl border p-4 transition-all sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
                item.completed
                  ? 'border-emerald-100 bg-emerald-50/40'
                  : 'border-gray-100 bg-white hover:border-pink-100 hover:shadow-sm'
              }`}
            >
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                    item.completed
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : item.loading
                        ? 'bg-pink-50 text-pink-500'
                        : 'bg-pink-50 text-pink-500'
                  }`}
                >
                  {item.loading ? (
                    <Spinner size={20} color={item.completed ? 'white' : 'pink'} />
                  ) : item.completed ? (
                    <FaCheck className="text-lg" />
                  ) : (
                    <Icon className="text-lg" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4
                    className={`font-semibold text-lg ${item.completed ? 'text-green-800' : 'text-gray-900'}`}
                  >
                    {item.title}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                </div>
              </div>

              {!item.completed && (
                <button
                  type="button"
                  onClick={() => onItemAction?.(item.id)}
                  className="shrink-0 self-start rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-pink-200/50 transition-all hover:bg-pink-600 hover:shadow-lg sm:self-center"
                >
                  {item.action}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
