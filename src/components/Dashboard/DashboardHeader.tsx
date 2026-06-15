'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import Image from 'next/image';
import { FaBell, FaCog, FaChevronDown } from 'react-icons/fa';
import Link from 'next/link';
import PlanHeaderBadge from '@/components/subscription/PlanHeaderBadge';
import AdminHeaderBadge from '@/components/Dashboard/Admin/AdminHeaderBadge';
import { SidebarMenuButton } from './Sidebar';

interface DashboardHeaderProps {
  greeting?: string;
  userName?: string;
  subtitle?: string;
  showNotifications?: boolean;
  onNotificationClick?: () => void;
  notificationDropdown?: ReactNode;
  onSettingsClick?: () => void;
  onMenuToggle?: () => void;
  onSignOut?: () => void;
  userAvatarUrl?: string;
  isLoading?: boolean;
  unreadNotificationCount?: number;
  notificationBlink?: boolean;
  showPlanBadge?: boolean;
  showAdminBadge?: boolean;
  headerExtra?: ReactNode;
  notificationsOpen?: boolean;
  onNotificationsClose?: () => void;
}

export default function DashboardHeader({
  greeting = 'Good Morning',
  userName = 'Sarah',
  subtitle = "Welcome to your MamtaAI dashboard. Let's help you understand your baby better.",
  showNotifications = true,
  onNotificationClick,
  notificationDropdown,
  onSettingsClick,
  onMenuToggle,
  onSignOut,
  userAvatarUrl,
  isLoading = false,
  unreadNotificationCount = 0,
  notificationBlink = false,
  showPlanBadge = true,
  showAdminBadge = false,
  headerExtra,
  notificationsOpen = false,
  onNotificationsClose,
}: DashboardHeaderProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const root = notificationRef.current;
      if (!root || root.contains(event.target as Node)) return;
      onNotificationsClose?.();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onNotificationsClose?.();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [notificationsOpen, onNotificationsClose]);

  return (
    <header className="relative z-30 shrink-0 border-b border-pink-100/60 bg-white/75 px-4 py-5 shadow-sm shadow-pink-100/30 backdrop-blur-lg backdrop-saturate-150 supports-[backdrop-filter]:bg-white/60 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarMenuButton onClick={onMenuToggle} />
          <div className="min-w-0">
            <h1 className="truncate text-[21px] font-bold leading-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent sm:hidden">
              MamtaAI
            </h1>
            <h2 className="hidden truncate text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent sm:block sm:text-2xl">
              {greeting}, {userName}! 👋
            </h2>
            <p className="mt-0.5 hidden text-sm text-gray-600 sm:block">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 shrink items-center gap-1 sm:gap-3" ref={menuRef}>
          {headerExtra ? <div className="hidden lg:contents">{headerExtra}</div> : null}
          {showAdminBadge ? (
            <div className="hidden lg:block">
              <AdminHeaderBadge />
            </div>
          ) : showPlanBadge ? (
            <div className="hidden lg:block">
              <PlanHeaderBadge />
            </div>
          ) : null}
          {showNotifications && (
            <>
              {notificationsOpen && (
                <button
                  type="button"
                  aria-label="Close notifications"
                  className="fixed inset-0 z-[64] bg-black/25 sm:bg-transparent"
                  onClick={() => onNotificationsClose?.()}
                />
              )}
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  aria-label={
                    unreadNotificationCount > 0
                      ? `Notifications, ${unreadNotificationCount} unread`
                      : 'Notifications'
                  }
                  aria-expanded={notificationsOpen}
                  className={`rounded-full p-2.5 transition-colors ${
                    notificationBlink
                      ? 'bg-pink-50 text-pink-600 ring-2 ring-pink-300 ring-offset-2 animate-bell-alert'
                      : unreadNotificationCount > 0
                        ? 'bg-pink-50 text-pink-600'
                        : 'text-gray-400 hover:bg-pink-50/80 hover:text-gray-600'
                  }`}
                  onClick={onNotificationClick}
                >
                  <FaBell className="text-lg" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    </span>
                  )}
                </button>
                {notificationDropdown}
              </div>
            </>
          )}
          <button
            type="button"
            className="hidden rounded-full p-2.5 text-gray-400 transition-colors hover:bg-pink-50/80 hover:text-gray-600 md:block"
            onClick={onSettingsClick}
            aria-label="Settings"
          >
            <FaCog className="text-lg" />
          </button>

          <div className="relative">
            {isLoading ? (
              <div className="flex items-center gap-2 rounded-full border border-pink-100 py-1 pl-1 pr-2">
                <div className="h-9 w-9 animate-pulse rounded-full bg-gray-100" />
                <div className="hidden h-4 w-16 animate-pulse rounded bg-gray-100 sm:block" />
              </div>
            ) : (
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-pink-100 bg-white py-1 pl-1 pr-2.5 transition-colors hover:bg-pink-50/50"
                onClick={() => setOpen(prev => !prev)}
              >
                <Image
                  src={
                    userAvatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=FCE7F3&color=9D174D&size=64`
                  }
                  alt={userName}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover"
                />
                <span className="hidden max-w-[7rem] truncate text-sm font-semibold text-gray-700 sm:inline">
                  {userName}
                </span>
                <FaChevronDown
                  className={`hidden h-3 w-3 text-gray-400 transition-transform sm:block ${open ? 'rotate-180' : ''}`}
                />
              </button>
            )}
            {open && (
              <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-lg shadow-pink-100/40">
                <Link
                  href="/dashboard/settings"
                  className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-pink-50"
                  onClick={() => setOpen(false)}
                >
                  Profile & Settings
                </Link>
                <button
                  type="button"
                  className="w-full border-t border-pink-50 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-pink-50"
                  onClick={() => {
                    setOpen(false);
                    onSignOut?.();
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
