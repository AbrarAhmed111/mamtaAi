'use client';

import { useState, useRef, useEffect } from 'react';
import { FaBell, FaCog, FaBars } from 'react-icons/fa';

interface DashboardHeaderProps {
  greeting?: string;
  userName?: string;
  subtitle?: string;
  showNotifications?: boolean;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
  onMenuToggle?: () => void;
  onSignOut?: () => void;
  userAvatarUrl?: string;
}

export default function DashboardHeader({
  greeting = 'Good Morning',
  userName = 'Sarah',
  subtitle = 'Welcome to your MamtaAI dashboard. Let\'s help you understand your baby better.',
  showNotifications = true,
  onNotificationClick,
  onSettingsClick,
  onMenuToggle,
  onSignOut,
  userAvatarUrl
}: DashboardHeaderProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  return (
  <header className="sticky top-0 z-30 bg-white/90 supports-[backdrop-filter]:bg-white/60 backdrop-blur shadow-sm border-b border-gray-200">
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
          
          <div className="flex items-center space-x-2 sm:space-x-4" ref={menuRef}>
            {showNotifications && (
              <button 
                className="p-2 text-gray-400 hover:text-gray-600 relative hidden md:block"
                onClick={onNotificationClick}
              >
                <FaBell className="text-lg" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
            )}
            <button 
              className="p-2 text-gray-400 hover:text-gray-600 hidden md:block"
              onClick={onSettingsClick}
            >
              <FaCog className="text-lg" />
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-gray-200 hover:bg-gray-50"
                onClick={() => setOpen(prev => !prev)}
              >
                <img
                  src={userAvatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userName) + '&background=E5E7EB&color=111827&size=64'}
                  alt={userName}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="hidden sm:inline text-sm font-medium text-gray-700">{userName}</span>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    onClick={() => {
                      setOpen(false);
                      onSignOut && onSignOut();
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
