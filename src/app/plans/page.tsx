import React from 'react';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';
import { PlansClient } from '@/components/plans/plans-client';

export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  const session = await requireAuth();

  const [plans, notifications] = await Promise.all([
    prisma.membershipPlan.findMany({
      where: { gymId: session.gymId },
      include: {
        _count: { select: { memberships: true } },
      },
      orderBy: { durationDays: 'asc' },
    }),
    prisma.notification.findMany({
      where: { gymId: session.gymId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return (
    <AppShell userSession={session} notifications={notifications}>
      <PlansClient initialPlans={plans} userRole={session.role} />
    </AppShell>
  );
}
