'use client';

import { FaBaby, FaPlus, FaUser } from 'react-icons/fa';
import Link from 'next/link';

interface Baby {
  id: string;
  name: string;
  age: string;
  avatar?: string | null;
  gender?: string | null;
  lastCry?: Date | null;
  totalCries?: number | null;
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
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 bg-gradient-to-br from-white to-pink-50/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Your Babies
        </h3>
        <Link
          href="/dashboard/babies/add-baby"
          onClick={onAddBaby}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm font-semibold"
        >
          <FaPlus className="text-sm" />
          <span>Add Baby</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {babies.map((baby) => {
          const avatarBgClass =
            baby.gender === 'male'
              ? 'bg-blue-50'
              : baby.gender === 'female'
              ? 'bg-pink-50'
              : 'bg-gray-50';
          const avatarIconClass =
            baby.gender === 'male'
              ? 'text-blue-400'
              : baby.gender === 'female'
              ? 'text-pink-400'
              : 'text-gray-400';
          return (
          <Link
            key={baby.id}
            href={`/dashboard/babies/${baby.id}`}
            className="block border border-pink-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-pink-50/30 hover:from-pink-50/50 hover:to-rose-50/50"
            onClick={() => onBabyClick?.(baby)}
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className={`w-14 h-14 rounded-full overflow-hidden border-2 border-pink-200 shadow-sm flex items-center justify-center ${avatarBgClass}`}>
                  {baby.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={baby.avatar}
                      alt={baby.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaUser className={`text-xl ${avatarIconClass}`} />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-pink-400 rounded-full border-2 border-white flex items-center justify-center">
                  <FaBaby className="text-white text-xs" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-lg">{baby.name}</h4>
                <p className="text-sm text-pink-600 font-medium mt-1">{baby.age}</p>
              </div>
            </div>
          </Link>
        )})}
      </div>
    </div>
  );
}
