import React from 'react';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';
import { TrainersClient } from '@/components/trainers/trainers-client';

export const dynamic = 'force-dynamic';

export default async function TrainersPage() {
  const session = await requireAuth();

  const [trainers, activeMembers, notifications] = await Promise.all([
    prisma.trainer.findMany({
      where: { gymId: session.gymId },
      include: {
        assignments: {
          where: { status: 'ACTIVE' },
          include: { member: true },
        },
      },
      orderBy: { trainerCode: 'asc' },
    }),
    prisma.member.findMany({
      where: { gymId: session.gymId, status: 'ACTIVE', isArchived: false },
      orderBy: { fullName: 'asc' },
    }),
    prisma.notification.findMany({
      where: { gymId: session.gymId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return (
    <AppShell userSession={session} notifications={notifications}>
      <TrainersClient
        initialTrainers={trainers}
        allActiveMembers={activeMembers}
        userRole={session.role}
      />
    </AppShell>
  );
}
