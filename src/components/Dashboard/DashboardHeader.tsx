'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FaBell, FaCog, FaBars } from 'react-icons/fa';
import Link from 'next/link';

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
  isLoading?: boolean;
  unreadNotificationCount?: number;
  notificationBlink?: boolean;
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
  userAvatarUrl,
  isLoading = false,
  unreadNotificationCount = 0,
  notificationBlink = false,
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
  <header className="sticky top-0 z-30 bg-white/90 supports-[backdrop-filter]:bg-white/60 backdrop-blur shadow-sm border-b border-pink-100">
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
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
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
                type="button"
                aria-label={
                  unreadNotificationCount > 0
                    ? `Notifications, ${unreadNotificationCount} unread`
                    : 'Notifications'
                }
                className={`p-2 relative rounded-full transition-colors ${
                  notificationBlink
                    ? 'text-pink-600 bg-pink-50 ring-2 ring-pink-400 ring-offset-2 ring-offset-white animate-bell-alert'
                    : unreadNotificationCount > 0
                      ? 'text-pink-600 bg-pink-50/90'
                      : 'text-gray-400 hover:text-gray-600'
                }`}
                onClick={onNotificationClick}
              >
                <FaBell className="text-lg" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center font-semibold shadow-sm">
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </span>
                )}
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
              {isLoading ? (
                <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-pink-200">
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                  <div className="hidden sm:block">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ) : (
                <button
                  className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-pink-200 hover:bg-pink-50 transition-colors"
                  onClick={() => setOpen(prev => !prev)}
                >
                  <Image
                    src={userAvatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userName) + '&background=E5E7EB&color=111827&size=64'}
                    alt={userName}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">{userName}</span>
                </button>
              )}
              {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-pink-100 rounded-xl shadow-lg z-50 overflow-hidden">
                  <Link
                    href="/dashboard/settings"
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-pink-50 text-gray-700 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    Profile & Settings
                  </Link>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-pink-50 text-gray-700 transition-colors border-t border-pink-100"
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
