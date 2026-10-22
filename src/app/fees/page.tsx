import React from 'react';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';
import { FeesClient } from '@/components/fees/fees-client';

export const dynamic = 'force-dynamic';

export default async function FeesPage() {
  const session = await requireAuth();

  const [invoices, payments, notifications] = await Promise.all([
    prisma.invoice.findMany({
      where: { gymId: session.gymId },
      include: {
        member: true,
        payments: true,
        membership: { include: { plan: true } },
      },
      orderBy: { dueDate: 'desc' },
    }),
    prisma.payment.findMany({
      where: { gymId: session.gymId },
      include: {
        member: true,
        invoice: true,
      },
      orderBy: { paymentDate: 'desc' },
    }),
    prisma.notification.findMany({
      where: { gymId: session.gymId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return (
    <AppShell userSession={session} notifications={notifications}>
      <FeesClient
        initialInvoices={invoices}
        initialPayments={payments}
        gymName={session.gymName}
        userRole={session.role}
      />
    </AppShell>
  );
}
