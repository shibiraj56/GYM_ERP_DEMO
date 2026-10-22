'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  UserPlus,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface HeaderProps {
  gymName?: string;
  gymLocation?: string;
  notifications?: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    createdAt: Date | string;
    isRead: boolean;
  }>;
  onOpenMobileMenu?: () => void;
  onOpenQuickAction?: (action: 'member' | 'payment' | 'attendance') => void;
}

export function Header({
  gymName = 'PowerFit Gym & Fitness Studio',
  gymLocation = 'Coimbatore, Tamil Nadu',
  notifications = [],
  onOpenMobileMenu,
  onOpenQuickAction,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-8 backdrop-blur-md">
      {/* Left: Mobile Toggle & Gym Info */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
            {gymName}
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
            <span className="flex items-center gap-1 font-medium text-slate-600">
              <MapPin className="h-3.5 w-3.5 text-rose-500" />
              {gymLocation}
            </span>
            <span className="hidden md:inline-block text-slate-300">•</span>
            <span className="hidden md:flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-blue-500" />
              {formatDate(new Date(), 'EEEE, dd MMMM yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Quick Action Buttons & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden lg:flex items-center gap-2">
          <Link href="/members?action=new">
            <Button size="sm" variant="outline" className="gap-1.5 border-slate-300 font-medium">
              <UserPlus className="h-3.5 w-3.5 text-blue-600" />
              <span>+ Member</span>
            </Button>
          </Link>
          <Link href="/fees?action=record">
            <Button size="sm" variant="outline" className="gap-1.5 border-slate-300 font-medium">
              <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
              <span>+ Payment</span>
            </Button>
          </Link>
          <Link href="/attendance">
            <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Mark Attendance</span>
            </Button>
          </Link>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-900 text-sm">System Alerts</h4>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                    {notifications.length} alerts
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Close
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-2">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">No active alerts</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="py-2.5 first:pt-1 last:pb-1">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 rounded-lg bg-amber-50 p-1.5 text-amber-600 border border-amber-200">
                          {n.type === 'PAYMENT_OVERDUE' ? (
                            <CreditCard className="h-4 w-4 text-rose-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {formatDate(n.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
