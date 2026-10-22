import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';
import { MemberProfileClient } from '@/components/members/member-profile-client';

export const dynamic = 'force-dynamic';

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
  const session = await requireAuth();

  const [member, plans, notifications] = await Promise.all([
    prisma.member.findUnique({
      where: { id: params.id },
      include: {
        memberships: {
          include: { plan: true },
          orderBy: { expiryDate: 'desc' },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 60,
        },
        trainerAssignments: {
          include: { trainer: true },
          orderBy: { startDate: 'desc' },
        },
      },
    }),
    prisma.membershipPlan.findMany({
      where: { gymId: session.gymId, isActive: true },
      orderBy: { durationDays: 'asc' },
    }),
    prisma.notification.findMany({
      where: { gymId: session.gymId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  if (!member || member.gymId !== session.gymId) {
    notFound();
  }

  return (
    <AppShell userSession={session} notifications={notifications}>
      <MemberProfileClient
        member={member}
        plans={plans}
        gymName={session.gymName}
      />
    </AppShell>
  );
}
