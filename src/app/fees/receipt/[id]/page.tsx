import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ReceiptViewClient } from '@/components/fees/receipt-view-client';

export const dynamic = 'force-dynamic';

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const session = await requireAuth();

  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: {
      member: true,
      invoice: {
        include: {
          membership: {
            include: { plan: true },
          },
        },
      },
      gym: {
        include: { settings: true },
      },
    },
  });

  if (!payment || payment.gymId !== session.gymId) {
    notFound();
  }

  return <ReceiptViewClient payment={payment} />;
}
