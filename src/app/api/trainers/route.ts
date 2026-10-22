import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, createAuditLog } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireAuth();

    const trainers = await prisma.trainer.findMany({
      where: { gymId: session.gymId },
      include: {
        assignments: {
          where: { status: 'ACTIVE' },
          include: { member: true },
        },
      },
      orderBy: { trainerCode: 'asc' },
    });

    return NextResponse.json({ trainers });
  } catch (error: any) {
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
      specialization,
      salary,
      paymentArrangement = 'Monthly Fixed',
      joiningDate,
      notes,
    } = body;

    if (!fullName || !mobile) {
      return NextResponse.json(
        { error: 'Trainer name and mobile number are required' },
        { status: 400 }
      );
    }

    const count = await prisma.trainer.count({ where: { gymId: session.gymId } });
    const trainerCode = `TRN-00${count + 1}`;

    const trainer = await prisma.trainer.create({
      data: {
        gymId: session.gymId,
        trainerCode,
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email?.trim() || null,
        specialization: specialization?.trim() || 'General Fitness',
        salary: salary ? parseInt(salary, 10) : null,
        paymentArrangement,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        status: 'ACTIVE',
        notes: notes || null,
      },
    });

    await createAuditLog({
      gymId: session.gymId,
      userId: session.userId,
      action: 'TRAINER_CREATED',
      entityType: 'TRAINER',
      entityId: trainer.id,
      details: { trainerCode, fullName: trainer.fullName },
    });

    return NextResponse.json({ success: true, trainer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
