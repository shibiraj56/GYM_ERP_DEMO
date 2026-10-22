import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, createAuditLog } from '@/lib/auth';
import { addDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {
      gymId: session.gymId,
      isArchived: false,
    };

    if (query) {
      where.OR = [
        { fullName: { contains: query } },
        { memberCode: { contains: query } },
        { mobile: { contains: query } },
        { email: { contains: query } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [members, totalCount] = await Promise.all([
      prisma.member.findMany({
        where,
        include: {
          memberships: {
            include: { plan: true },
            orderBy: { expiryDate: 'desc' },
            take: 1,
          },
          invoices: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.member.count({ where }),
    ]);

    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const {
      fullName,
      mobile,
      email,
      gender,
      dateOfBirth,
      address,
      emergencyContactName,
      emergencyContactPhone,
      joiningDate,
      planId,
      startDate,
      discount = 0,
      customExpiryDate,
      initialPaymentAmount = 0,
      paymentMethod = 'CASH',
      notes,
    } = body;

    if (!fullName || !mobile || !planId) {
      return NextResponse.json(
        { error: 'Full name, mobile number, and membership plan are required' },
        { status: 400 }
      );
    }

    // Check duplicate mobile in same gym
    const existing = await prisma.member.findFirst({
      where: { gymId: session.gymId, mobile: mobile.trim(), isArchived: false },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `A member with mobile number ${mobile} is already registered (${existing.fullName} - ${existing.memberCode})`,
        },
        { status: 409 }
      );
    }

    // Get plan details
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.gymId !== session.gymId) {
      return NextResponse.json({ error: 'Selected membership plan is invalid' }, { status: 400 });
    }

    // Auto-generate Member Code (e.g. MEM-1008)
    const count = await prisma.member.count({ where: { gymId: session.gymId } });
    const memberCode = `MEM-${1001 + count}`;

    const memberStart = startDate ? new Date(startDate) : new Date();
    const calculatedExpiry = customExpiryDate
      ? new Date(customExpiryDate)
      : addDays(memberStart, plan.durationDays);

    const basePrice = plan.price;
    const finalPrice = Math.max(0, basePrice - Number(discount));
    const paidAmt = Math.min(finalPrice, Number(initialPaymentAmount));
    const balanceDue = finalPrice - paidAmt;

    // Execute in Prisma Transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Member
      const member = await tx.member.create({
        data: {
          gymId: session.gymId,
          memberCode,
          fullName: fullName.trim(),
          mobile: mobile.trim(),
          email: email?.trim() || null,
          gender: gender || 'Male',
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          address: address || null,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
          status: 'ACTIVE',
          notes: notes || null,
        },
      });

      // 2. Create Membership Subscription
      const membership = await tx.membership.create({
        data: {
          gymId: session.gymId,
          memberId: member.id,
          planId: plan.id,
          startDate: memberStart,
          expiryDate: calculatedExpiry,
          basePrice,
          discount: Number(discount),
          finalPrice,
          status: 'ACTIVE',
          notes,
        },
      });

      // 3. Create Invoice
      const invCount = await tx.invoice.count({ where: { gymId: session.gymId } });
      const invoiceNumber = `INV-2026-${1001 + invCount}`;

      const invoice = await tx.invoice.create({
        data: {
          gymId: session.gymId,
          invoiceNumber,
          memberId: member.id,
          membershipId: membership.id,
          dueDate: memberStart,
          totalAmount: basePrice,
          discount: Number(discount),
          netAmount: finalPrice,
          paidAmount: paidAmt,
          balanceDue,
          status: balanceDue === 0 ? 'PAID' : paidAmt > 0 ? 'PARTIAL' : 'PENDING',
          notes: `Enrollment: ${plan.name}`,
        },
      });

      // 4. Record Initial Payment if paidAmt > 0
      let payment = null;
      if (paidAmt > 0) {
        // Fetch settings for next receipt number
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
            notes: 'Initial enrollment payment',
            receivedById: session.userId,
          },
        });

        // Increment receipt number
        await tx.gymSettings.update({
          where: { gymId: session.gymId },
          data: { nextReceiptNumber: nextNum + 1 },
        });
      }

      // 5. System Notification
      await tx.notification.create({
        data: {
          gymId: session.gymId,
          type: 'NEW_MEMBER',
          title: 'New Member Enrolled',
          message: `${member.fullName} (${member.memberCode}) enrolled in ${plan.name}.`,
          memberId: member.id,
        },
      });

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          gymId: session.gymId,
          userId: session.userId,
          action: 'MEMBER_REGISTERED',
          entityType: 'MEMBER',
          entityId: member.id,
          details: JSON.stringify({
            memberCode,
            fullName: member.fullName,
            plan: plan.name,
            paidAmount: paidAmt,
          }),
        },
      });

      return { member, membership, invoice, payment };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error creating member:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
