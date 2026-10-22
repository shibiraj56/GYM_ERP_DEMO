'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface AppShellProps {
  children: React.ReactNode;
  userSession: {
    userId: string;
    email: string;
    name: string;
    role: 'OWNER_ADMIN' | 'RECEPTIONIST' | 'TRAINER';
    gymId: string;
    gymName: string;
  };
  notifications?: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    createdAt: Date | string;
    isRead: boolean;
  }>;
}

export function AppShell({ children, userSession, notifications = [] }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar
        userRole={userSession.role}
        userName={userSession.name}
        gymName={userSession.gymName}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-x-hidden min-w-0">
        <Header
          gymName={userSession.gymName}
          notifications={notifications}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
