'use client';

interface ProgressSummaryProps {
  completedItems: number;
  totalItems: number;
}

export default function ProgressSummary({ 
  completedItems, 
  totalItems
}: ProgressSummaryProps) {
  const progressPercentage = (completedItems / totalItems) * 100;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Your Progress</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Checklist Progress</span>
          <span className="text-sm font-medium text-gray-900">
            {completedItems}/{totalItems}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
