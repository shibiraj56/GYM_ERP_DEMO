import React from 'react';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';
import { MemberListClient } from '@/components/members/member-list-client';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const session = await requireAuth();

  const [members, plans, totalCount, notifications] = await Promise.all([
    prisma.member.findMany({
      where: { gymId: session.gymId, isArchived: false },
      include: {
        memberships: {
          include: { plan: true },
          orderBy: { expiryDate: 'desc' },
          take: 1,
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.membershipPlan.findMany({
      where: { gymId: session.gymId, isActive: true },
      orderBy: { durationDays: 'asc' },
    }),
    prisma.member.count({
      where: { gymId: session.gymId, isArchived: false },
    }),
    prisma.notification.findMany({
      where: { gymId: session.gymId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return (
    <AppShell userSession={session} notifications={notifications}>
      <MemberListClient
        initialMembers={members}
        plans={plans}
        gymName={session.gymName}
        totalCount={totalCount}
      />
    </AppShell>
  );
}
