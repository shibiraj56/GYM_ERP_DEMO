import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, createAuditLog } from '@/lib/auth';
import { addDays, isAfter } from 'date-fns';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const {
      memberId,
      planId,
      startDate,
      discount = 0,
      paidAmount = 0,
      paymentMethod = 'UPI',
      notes,
    } = body;

    if (!memberId || !planId) {
      return NextResponse.json(
        { error: 'Member ID and Plan ID are required for renewal' },
        { status: 400 }
      );
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        memberships: {
          orderBy: { expiryDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!member || member.gymId !== session.gymId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.gymId !== session.gymId) {
      return NextResponse.json({ error: 'Membership plan is invalid' }, { status: 400 });
    }

    // Determine rollover start date
    // If current membership is still active and in the future, extend from current expiry!
    const latestMem = member.memberships[0];
    const now = new Date();
    let effectiveStart = startDate ? new Date(startDate) : now;

    if (latestMem && isAfter(new Date(latestMem.expiryDate), now)) {
      effectiveStart = new Date(latestMem.expiryDate);
    }

    const newExpiry = addDays(effectiveStart, plan.durationDays);
    const basePrice = plan.price;
    const finalPrice = Math.max(0, basePrice - Number(discount));
    const paidAmt = Math.min(finalPrice, Number(paidAmount));
    const balanceDue = finalPrice - paidAmt;

    // Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark previous membership as RENEWED if exists
      if (latestMem) {
        await tx.membership.update({
          where: { id: latestMem.id },
          data: { status: 'RENEWED' },
        });
      }

      // 2. Create new Membership
      const newMembership = await tx.membership.create({
        data: {
          gymId: session.gymId,
          memberId: member.id,
          planId: plan.id,
          startDate: effectiveStart,
          expiryDate: newExpiry,
          basePrice,
          discount: Number(discount),
          finalPrice,
          status: 'ACTIVE',
          notes: notes || 'Subscription renewal',
        },
      });

      // 3. Update member status to ACTIVE
      await tx.member.update({
        where: { id: member.id },
        data: { status: 'ACTIVE' },
      });

      // 4. Create new Invoice
      const invCount = await tx.invoice.count({ where: { gymId: session.gymId } });
      const invoiceNumber = `INV-2026-${1001 + invCount}`;

      const invoice = await tx.invoice.create({
        data: {
          gymId: session.gymId,
          invoiceNumber,
          memberId: member.id,
          membershipId: newMembership.id,
          dueDate: effectiveStart,
          totalAmount: basePrice,
          discount: Number(discount),
          netAmount: finalPrice,
          paidAmount: paidAmt,
          balanceDue,
          status: balanceDue === 0 ? 'PAID' : paidAmt > 0 ? 'PARTIAL' : 'PENDING',
          notes: `Renewal: ${plan.name}`,
        },
      });

      // 5. Record Payment if paidAmt > 0
      let payment = null;
      if (paidAmt > 0) {
        const settings = await tx.gymSettings.findUnique({
          where: { gymId: session.gymId },
        });
        const prefix = settings?.receiptPrefix || 'REC-';
        const nextNum = settings?.nextReceiptNumber || 1001;
        const receiptNumber = `${prefix}${nextNum}`;

        payment = await tx.payment.create({
          data: {
            gymId: session.gymId,
            receiptNumber,
            invoiceId: invoice.id,
            memberId: member.id,
            amount: paidAmt,
            paymentMethod,
            paymentDate: new Date(),
            notes: 'Membership renewal payment',
            receivedById: session.userId,
          },
        });

        await tx.gymSettings.update({
          where: { gymId: session.gymId },
          data: { nextReceiptNumber: nextNum + 1 },
        });
      }

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          gymId: session.gymId,
          userId: session.userId,
          action: 'MEMBERSHIP_RENEWED',
          entityType: 'MEMBERSHIP',
          entityId: newMembership.id,
          details: JSON.stringify({
            member: member.fullName,
            plan: plan.name,
            newExpiry,
            paidAmount: paidAmt,
          }),
        },
      });

      return { membership: newMembership, invoice, payment };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Renewal error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
