import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, createAuditLog } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: params.id },
    });

    if (!plan || plan.gymId !== session.gymId) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const { name, durationDays, price, description, isActive } = body;

    const updated = await prisma.membershipPlan.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name.trim() : plan.name,
        durationDays: durationDays !== undefined ? parseInt(durationDays, 10) : plan.durationDays,
        price: price !== undefined ? parseInt(price, 10) : plan.price,
        description: description !== undefined ? description?.trim() : plan.description,
        isActive: isActive !== undefined ? Boolean(isActive) : plan.isActive,
      },
    });

    await createAuditLog({
      gymId: session.gymId,
      userId: session.userId,
      action: 'PLAN_UPDATED',
      entityType: 'PLAN',
      entityId: plan.id,
      details: body,
    });

    return NextResponse.json({ success: true, plan: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: params.id },
    });

    if (!plan || plan.gymId !== session.gymId) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Toggle active state rather than hard delete if memberships reference it
    const updated = await prisma.membershipPlan.update({
      where: { id: params.id },
      data: { isActive: !plan.isActive },
    });

    return NextResponse.json({ success: true, plan: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
