import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, createAuditLog } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') || '';
    const memberId = searchParams.get('memberId') || '';

    const where: any = { gymId: session.gymId };
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (memberId) {
      where.memberId = memberId;
    }

    const [invoices, payments] = await Promise.all([
      prisma.invoice.findMany({
        where,
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
    ]);

    return NextResponse.json({ invoices, payments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { invoiceId, memberId, amount, paymentMethod = 'UPI', transactionRef, notes } = body;

    const paymentAmount = parseInt(amount, 10);
    if (!invoiceId || !paymentAmount || paymentAmount <= 0) {
      return NextResponse.json(
        { error: 'Invoice ID and a positive payment amount are required' },
        { status: 400 }
      );
    }

    // Load invoice with gym isolation
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { member: true },
    });

    if (!invoice || invoice.gymId !== session.gymId) {
      return NextResponse.json({ error: 'Invoice not found or invalid' }, { status: 404 });
    }

    if (paymentAmount > invoice.balanceDue) {
      return NextResponse.json(
        {
          error: `Payment amount (₹${paymentAmount}) cannot exceed outstanding balance (₹${invoice.balanceDue})`,
        },
        { status: 400 }
      );
    }

    // Atomic transaction for payment creation & invoice balance update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch settings for receipt number
      const settings = await tx.gymSettings.findUnique({
        where: { gymId: session.gymId },
      });
      const prefix = settings?.receiptPrefix || 'REC-';
      const nextNum = settings?.nextReceiptNumber || 1001;
      const receiptNumber = `${prefix}${nextNum}`;

      // 2. Create Payment record
      const payment = await tx.payment.create({
        data: {
          gymId: session.gymId,
          receiptNumber,
          invoiceId: invoice.id,
          memberId: invoice.memberId,
          amount: paymentAmount,
          paymentMethod,
          transactionRef: transactionRef || null,
          paymentDate: new Date(),
          notes: notes || null,
          receivedById: session.userId,
        },
      });

      // 3. Update Invoice paidAmount and balanceDue
      const newPaidAmount = invoice.paidAmount + paymentAmount;
      const newBalanceDue = invoice.netAmount - newPaidAmount;
      const newStatus = newBalanceDue === 0 ? 'PAID' : 'PARTIAL';

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          status: newStatus,
        },
      });

      // 4. Update next receipt number in settings
      await tx.gymSettings.update({
        where: { gymId: session.gymId },
        data: { nextReceiptNumber: nextNum + 1 },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          gymId: session.gymId,
          userId: session.userId,
          action: 'PAYMENT_COLLECTED',
          entityType: 'PAYMENT',
          entityId: payment.id,
          details: JSON.stringify({
            receiptNumber,
            amount: paymentAmount,
            member: invoice.member.fullName,
            remainingDue: newBalanceDue,
          }),
        },
      });

      return { payment, invoice: updatedInvoice };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
