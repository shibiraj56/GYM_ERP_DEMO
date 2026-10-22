import React from 'react';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';
import { ReportsClient } from '@/components/reports/reports-client';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const session = await requireRole(['OWNER_ADMIN']);

  const [payments, expenses, refunds, invoices, notifications] = await Promise.all([
    prisma.payment.findMany({
      where: { gymId: session.gymId },
      include: { member: true },
      orderBy: { paymentDate: 'desc' },
    }),
    prisma.expense.findMany({
      where: { gymId: session.gymId },
      orderBy: { expenseDate: 'desc' },
    }),
    prisma.refund.findMany({
      where: { gymId: session.gymId },
    }),
    prisma.invoice.findMany({
      where: { gymId: session.gymId },
    }),
    prisma.notification.findMany({
      where: { gymId: session.gymId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const grossCollections = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalRefunds = refunds.reduce((sum, r) => sum + r.amount, 0);
  const netIncome = grossCollections - totalRefunds;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netOperatingBalance = netIncome - totalExpenses;
  const totalOutstandingDues = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
  const partialPaymentsCount = invoices.filter((i) => i.status === 'PARTIAL').length;

  const paymentMethodBreakdown: Record<string, number> = {};
  for (const p of payments) {
    paymentMethodBreakdown[p.paymentMethod] = (paymentMethodBreakdown[p.paymentMethod] || 0) + p.amount;
  }

  const expenseCategoryBreakdown: Record<string, number> = {};
  for (const e of expenses) {
    expenseCategoryBreakdown[e.category] = (expenseCategoryBreakdown[e.category] || 0) + e.amount;
  }

  const summary = {
    grossCollections,
    totalRefunds,
    netIncome,
    totalExpenses,
    netOperatingBalance,
    totalOutstandingDues,
    partialPaymentsCount,
    paymentMethodBreakdown,
    expenseCategoryBreakdown,
  };

  return (
    <AppShell userSession={session} notifications={notifications}>
      <ReportsClient
        summary={summary}
        recentPayments={payments.slice(0, 10)}
        recentExpenses={expenses.slice(0, 10)}
        gymName={session.gymName}
      />
    </AppShell>
  );
}
