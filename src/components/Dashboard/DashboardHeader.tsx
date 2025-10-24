'use client';

import { FaBell, FaCog, FaBars } from 'react-icons/fa';

interface DashboardHeaderProps {
  greeting?: string;
  userName?: string;
  subtitle?: string;
  showNotifications?: boolean;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
  onMenuToggle?: () => void;
}

export default function DashboardHeader({
  greeting = 'Good Morning',
  userName = 'Sarah',
  subtitle = 'Welcome to your MamtaAI dashboard. Let\'s help you understand your baby better.',
  showNotifications = true,
  onNotificationClick,
  onSettingsClick,
  onMenuToggle
}: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
            >
              <FaBars className="text-lg" />
            </button>
            
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {greeting}, {userName}! 👋
              </h2>
              <p className="text-sm sm:text-base text-gray-600 hidden sm:block">
                {subtitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {showNotifications && (
              <button 
                className="p-2 text-gray-400 hover:text-gray-600 relative"
                onClick={onNotificationClick}
              >
                <FaBell className="text-lg" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
            )}
            <button 
              className="p-2 text-gray-400 hover:text-gray-600"
              onClick={onSettingsClick}
            >
              <FaCog className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
