'use client';

import { FaBaby, FaPlus } from 'react-icons/fa';

interface Baby {
  id: string;
  name: string;
  age: string;
  avatar: string;
  lastCry: Date;
  totalCries: number;
}

interface BabyProfilesProps {
  babies: Baby[];
  onAddBaby?: () => void;
  onBabyClick?: (baby: Baby) => void;
}

export default function BabyProfiles({ 
  babies, 
  onAddBaby, 
  onBabyClick 
}: BabyProfilesProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Babies</h3>
        <button 
          onClick={onAddBaby}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="text-sm" />
          <span>Add Baby</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {babies.map((baby) => (
          <div 
            key={baby.id} 
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onBabyClick?.(baby)}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <FaBaby className="text-pink-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{baby.name}</h4>
                <p className="text-sm text-gray-600">{baby.age}</p>
                <p className="text-xs text-gray-500">
                  Last cry: {baby.lastCry.toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{baby.totalCries}</p>
                <p className="text-xs text-gray-500">total cries</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
