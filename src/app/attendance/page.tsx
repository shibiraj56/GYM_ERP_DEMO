import React from 'react';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';
import { AttendanceClient } from '@/components/attendance/attendance-client';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const session = await requireAuth();

  const targetDate = searchParams.date ? new Date(searchParams.date) : new Date();
  const dayStart = startOfDay(targetDate);
  const dayEnd = endOfDay(targetDate);

  const [attendances, todayCount, activeMembers, notifications] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        gymId: session.gymId,
        date: { gte: dayStart, lte: dayEnd },
      },
      include: {
        member: {
          include: {
            memberships: {
              include: { plan: true },
              orderBy: { expiryDate: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { checkInTime: 'desc' },
    }),
    prisma.attendance.count({
      where: {
        gymId: session.gymId,
        date: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) },
      },
    }),
    prisma.member.findMany({
      where: {
        gymId: session.gymId,
        status: 'ACTIVE',
        isArchived: false,
      },
      include: {
        attendances: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.notification.findMany({
      where: { gymId: session.gymId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const sevenDaysAgo = subDays(new Date(), 7);
  const inactiveMembers = activeMembers.filter((m) => {
    const lastVisit = m.attendances[0]?.date;
    if (!lastVisit) return true;
    return new Date(lastVisit) < sevenDaysAgo;
  });

  return (
    <AppShell userSession={session} notifications={notifications}>
      <AttendanceClient
        initialAttendances={attendances}
        todayCount={todayCount}
        inactiveMembers={inactiveMembers}
        allActiveMembers={activeMembers}
        gymName={session.gymName}
      />
    </AppShell>
  );
}
