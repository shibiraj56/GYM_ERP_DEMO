import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, createAuditLog } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireAuth();

    const plans = await prisma.membershipPlan.findMany({
      where: { gymId: session.gymId },
      include: {
        _count: { select: { memberships: true } },
      },
      orderBy: { durationDays: 'asc' },
    });

    return NextResponse.json({ plans });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { name, durationDays, price, description, isActive = true } = body;

    if (!name || !durationDays || price === undefined) {
      return NextResponse.json(
        { error: 'Plan name, duration (days), and price are required' },
        { status: 400 }
      );
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        gymId: session.gymId,
        name: name.trim(),
        durationDays: parseInt(durationDays, 10),
        price: parseInt(price, 10),
        description: description?.trim() || null,
        isActive: Boolean(isActive),
      },
    });

    await createAuditLog({
      gymId: session.gymId,
      userId: session.userId,
      action: 'PLAN_CREATED',
      entityType: 'PLAN',
      entityId: plan.id,
      details: { name: plan.name, price: plan.price, durationDays: plan.durationDays },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
