'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  FaBaby,
  FaMicrophone,
  FaChartLine,
  FaUsers,
  FaUserMd,
  FaBars,
  FaTimes,
  FaCog,
  FaCrown,
  FaGem,
} from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import logo from '@/assets/img/smallLogo.png';
import { useSubscription } from '@/hooks/useSubscription';
import { PLAN_DEFINITIONS } from '@/lib/subscription/plans';
import type { PlanSlug } from '@/lib/subscription/types';

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

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: MdDashboard, match: (p: string) => p === '/dashboard' },
  { href: '/dashboard/babies', label: 'My Babies', icon: FaBaby, match: (p: string) => p.startsWith('/dashboard/babies') },
  { href: '/dashboard/recordings', label: 'Recordings', icon: FaMicrophone, match: (p: string) => p.startsWith('/dashboard/recordings') },
  { href: '/dashboard/insights', label: 'Insights', icon: FaChartLine, match: (p: string) => p.startsWith('/dashboard/insights') },
  { href: '/dashboard/community', label: 'Community', icon: FaUsers, match: (p: string) => p.startsWith('/dashboard/community') },
  { href: '/dashboard/experts', label: 'Experts', icon: FaUserMd, match: (p: string) => p.startsWith('/dashboard/experts') },
  { href: '/dashboard/settings', label: 'Settings', icon: FaCog, match: (p: string) => p.startsWith('/dashboard/settings') },
] as const;

const SIDEBAR_CARD =
  'flex h-full min-h-0 flex-col rounded-[28px] border border-pink-100/90 bg-white p-5 shadow-[0_8px_30px_rgba(236,72,153,0.12)]';

const PROMO_CARD_CLASS =
  'mt-4 flex shrink-0 items-center gap-3 rounded-2xl border border-pink-200/80 bg-pink-50/90 p-4 transition-shadow';

function planPromoContent(slug: PlanSlug): {
  title: string;
  description: string;
  Icon: typeof FaGem;
  iconClass: string;
} {
  if (slug === 'free') {
    return {
      title: 'MamtaAI Plus',
      description: 'Unlock advanced insights and personalized care.',
      Icon: FaGem,
      iconClass: 'text-pink-500',
    };
  }
  if (slug === 'plus') {
    return {
      title: 'MamtaAI Pro',
      description: PLAN_DEFINITIONS.pro.description,
      Icon: FaCrown,
      iconClass: 'text-purple-700',
    };
  }
  return {
    title: 'MamtaAI Pro',
    description: PLAN_DEFINITIONS.pro.description,
    Icon: FaCrown,
    iconClass: 'text-purple-700',
  };
}

function PlanPromoCard({
  slug,
  onNavigate,
}: {
  slug: PlanSlug;
  onNavigate?: () => void;
}) {
  const { title, description, Icon, iconClass } = planPromoContent(slug);

  return (
    <Link href="/pricing" onClick={onNavigate} className={`${PROMO_CARD_CLASS} hover:shadow-md`}>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-bold text-pink-600">
          <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} aria-hidden />
          {title}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-600">{description}</p>
      </div>
    </Link>
  );
}

function SidebarPanel({
  currentPath,
  onNavigate,
  showClose,
  onClose,
}: {
  currentPath: string;
  onNavigate?: () => void;
  showClose?: boolean;
  onClose?: () => void;
}) {
  const { slug, loading } = useSubscription();

  return (
    <>
      <div className="shrink-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            href="/"
            onClick={onNavigate}
            className="flex items-center gap-3 transition-opacity hover:opacity-85"
            aria-label="MamtaAI home"
          >
            <Image
              src={logo}
              alt="MamtaAI"
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-full object-cover object-center"
            />
            <div>
              <h1 className="text-[17px] font-bold leading-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                MamtaAI
              </h1>
              <p className="mt-0.5 text-[11px] font-medium text-gray-500">AI for happier babies</p>
            </div>
          </Link>
          {showClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-pink-50 hover:text-gray-600 lg:hidden"
              aria-label="Close menu"
            >
              <FaTimes className="text-lg" />
            </button>
          )}
        </div>
      </div>

      <nav className="mt-6 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto no-scroll py-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = item.match(currentPath);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-all duration-200 ${
                active
                  ? 'bg-pink-50 text-pink-600 shadow-[inset_3px_0_0_0_#ec4899]'
                  : 'text-gray-600 hover:bg-pink-50/50 hover:text-pink-600'
              }`}
            >
              <Icon className={`text-[17px] ${active ? 'text-pink-500' : 'text-gray-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {!loading && <PlanPromoCard slug={slug} onNavigate={onNavigate} />}
    </>
  );
}

export default function Sidebar({
  currentPath = '/dashboard',
  isOpen = false,
  onToggle,
}: SidebarProps) {
  const path = currentPath || '/dashboard';

  const closeOnNavigate = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onToggle?.();
    }
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-[80] bg-gray-900/30 backdrop-blur-[2px] lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-[90] w-[min(288px,88vw)] p-3 transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={SIDEBAR_CARD}>
          <SidebarPanel
            currentPath={path}
            onNavigate={closeOnNavigate}
            showClose
            onClose={onToggle}
          />
        </div>
      </aside>

      {/* Desktop — full height of dashboard row, no gap below */}
      <aside className="hidden h-full w-[272px] shrink-0 lg:block">
        <div className={SIDEBAR_CARD}>
          <SidebarPanel currentPath={path} />
        </div>
      </aside>
    </>
  );
}

export function SidebarMenuButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl p-2.5 text-gray-400 hover:bg-pink-50 hover:text-gray-600 lg:hidden"
      aria-label="Open menu"
    >
      <FaBars className="text-lg" />
    </button>
  );
}
