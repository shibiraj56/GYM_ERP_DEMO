import React from 'react';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';
import { SettingsClient } from '@/components/settings/settings-client';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await requireRole(['OWNER_ADMIN']);

  const [gym, users, notifications] = await Promise.all([
    prisma.gym.findUnique({
      where: { id: session.gymId },
      include: { settings: true },
    }),
    prisma.user.findMany({
      where: { gymId: session.gymId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.notification.findMany({
      where: { gymId: session.gymId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  if (!gym) {
    throw new Error('Gym tenant configuration not found');
  }

  return (
    <AppShell userSession={session} notifications={notifications}>
      <SettingsClient gym={gym} users={users} />
    </AppShell>
  );
}
