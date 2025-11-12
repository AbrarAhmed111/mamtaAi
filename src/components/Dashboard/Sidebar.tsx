'use client';

import { useState } from 'react';
import { FaBaby, FaMicrophone, FaChartLine, FaUsers, FaUserMd, FaBars, FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import logo from '@/assets/img/smallLogo.png';
import Image from 'next/image';
import { MdDashboard } from "react-icons/md";
interface SidebarProps {
  currentPath?: string;
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ currentPath = '/dashboard', user, isOpen = false, onToggle }: SidebarProps) {
  const navigationItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: MdDashboard,
      active: currentPath?.startsWith('/dashboard') && (currentPath === '/dashboard')
    },
    {
      href: '/dashboard/babies',
      label: 'My Babies',
      icon: FaBaby,
      active: currentPath?.startsWith('/dashboard/babies')
    },
    {
      href: '/dashboard/recordings',
      label: 'Recordings',
      icon: FaMicrophone,
      active: currentPath?.startsWith('/dashboard/recordings')
    },
    {
      href: '/dashboard/insights',
      label: 'Insights',
      icon: FaChartLine,
      active: currentPath?.startsWith('/dashboard/insights')
    },
    {
      href: '/dashboard/community',
      label: 'Community',
      icon: FaUsers,
      active: currentPath?.startsWith('/dashboard/community')
    },
    {
      href: '/dashboard/experts',
      label: 'Experts',
      icon: FaUserMd,
      active: currentPath?.startsWith('/dashboard/experts')
    }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Image
              src={logo}
              alt="MamtaAI"
              width={24}
              height={24}
              className="object-contain rounded-full"
            />
            <h1 className="text-xl font-semibold text-gray-900">MamtaAI</h1>
          </div>
          <button
            onClick={onToggle}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Logo - Desktop */}
        <div className="hidden lg:block p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Image
              src={logo}
              alt="MamtaAI"
              width={28}
              height={28}
              className="object-contain rounded-full"
            />
            <h1 className="text-xl font-semibold text-gray-900">MamtaAI</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Close mobile menu when clicking a link on mobile
                  if (window.innerWidth < 1024) {
                    onToggle?.();
                  }
                }}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  item.active
                    ? 'text-blue-600 bg-blue-50 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="text-lg" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <FaBaby className="text-pink-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {user?.name || 'Sarah Johnson'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role || 'Parent'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
