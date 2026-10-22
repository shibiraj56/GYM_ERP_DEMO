import React from 'react';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';
import { ExpensesClient } from '@/components/expenses/expenses-client';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const session = await requireRole(['OWNER_ADMIN']);

  const [expenses, notifications] = await Promise.all([
    prisma.expense.findMany({
      where: { gymId: session.gymId },
      orderBy: { expenseDate: 'desc' },
    }),
    prisma.notification.findMany({
      where: { gymId: session.gymId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return (
    <AppShell userSession={session} notifications={notifications}>
      <ExpensesClient initialExpenses={expenses} />
    </AppShell>
  );
}
