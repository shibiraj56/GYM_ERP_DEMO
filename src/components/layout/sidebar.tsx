'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  Dumbbell,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole?: string;
  userName?: string;
  gymName?: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ userRole = 'OWNER_ADMIN', userName = 'Senthil Nathan', gymName = 'PowerFit Gym', isOpenMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['OWNER_ADMIN', 'RECEPTIONIST', 'TRAINER'],
    },
    {
      title: 'Members',
      href: '/members',
      icon: Users,
      roles: ['OWNER_ADMIN', 'RECEPTIONIST'],
    },
    {
      title: 'Membership Plans',
      href: '/plans',
      icon: Dumbbell,
      roles: ['OWNER_ADMIN', 'RECEPTIONIST'],
    },
    {
      title: 'Fees & Payments',
      href: '/fees',
      icon: CreditCard,
      roles: ['OWNER_ADMIN', 'RECEPTIONIST'],
    },
    {
      title: 'Attendance',
      href: '/attendance',
      icon: CalendarCheck,
      roles: ['OWNER_ADMIN', 'RECEPTIONIST', 'TRAINER'],
    },
    {
      title: 'Trainers',
      href: '/trainers',
      icon: UserCheck,
      roles: ['OWNER_ADMIN', 'RECEPTIONIST', 'TRAINER'],
    },
    {
      title: 'Expenses',
      href: '/expenses',
      icon: Receipt,
      roles: ['OWNER_ADMIN'],
    },
    {
      title: 'Financial Reports',
      href: '/reports',
      icon: BarChart3,
      roles: ['OWNER_ADMIN'],
    },
    {
      title: 'Gym Settings',
      href: '/settings',
      icon: Settings,
      roles: ['OWNER_ADMIN'],
    },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const roleLabels: Record<string, string> = {
    OWNER_ADMIN: 'Owner / Admin',
    RECEPTIONIST: 'Receptionist',
    TRAINER: 'Gym Trainer',
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-950 text-slate-100 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-slate-800/80 px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25">
              <Dumbbell className="h-6 w-6 transform -rotate-12" />
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight text-white leading-tight">
                {gymName}
              </span>
              <span className="text-[11px] font-medium tracking-wider uppercase text-blue-400">
                Tamil Nadu ERP
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Core Modules
          </p>
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  'flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-slate-400')} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-slate-800/80 p-4 bg-slate-900/60">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold text-sm">
              {userName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white leading-tight">{userName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="h-3 w-3 text-blue-400" />
                <p className="truncate text-xs text-slate-400">{roleLabels[userRole] || userRole}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-rose-950/50 hover:text-rose-400 hover:border-rose-900/50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
