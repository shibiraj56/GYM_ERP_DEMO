import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, createAuditLog } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // Only owner/admin can issue refunds
    const session = await requireRole(['OWNER_ADMIN']);
    const body = await request.json();

    const { amount, reason } = body;
    const refundAmount = parseInt(amount, 10);

    if (!refundAmount || refundAmount <= 0 || !reason) {
      return NextResponse.json(
        { error: 'Refund amount and reason are required' },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: { invoice: true, member: true },
    });

    if (!payment || payment.gymId !== session.gymId) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    if (refundAmount > payment.amount) {
      return NextResponse.json(
        { error: `Refund amount cannot exceed original payment amount (₹${payment.amount})` },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Refund Record
      const refund = await tx.refund.create({
        data: {
          gymId: session.gymId,
          paymentId: payment.id,
          invoiceId: payment.invoiceId,
          amount: refundAmount,
          reason,
          refundDate: new Date(),
          approvedById: session.userId,
        },
      });

      // 2. Adjust invoice balance
      const newPaid = Math.max(0, payment.invoice.paidAmount - refundAmount);
      const newDue = payment.invoice.netAmount - newPaid;
      const newStatus = newDue === 0 ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'PENDING';

      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: newPaid,
          balanceDue: newDue,
          status: newStatus,
        },
      });

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          gymId: session.gymId,
          userId: session.userId,
          action: 'PAYMENT_REFUNDED',
          entityType: 'REFUND',
          entityId: refund.id,
          details: JSON.stringify({
            paymentId: payment.id,
            receiptNumber: payment.receiptNumber,
            refundAmount,
            reason,
            member: payment.member.fullName,
          }),
        },
      });

      return refund;
    });

    return NextResponse.json({ success: true, refund: result });
  } catch (error: any) {
    console.error('Refund error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
