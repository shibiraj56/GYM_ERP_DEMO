import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, createAuditLog } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { trainerId, memberId, notes } = body;

    if (!trainerId || !memberId) {
      return NextResponse.json(
        { error: 'Trainer ID and Member ID are required' },
        { status: 400 }
      );
    }

    // End any existing active assignment for this member
    await prisma.trainerAssignment.updateMany({
      where: {
        gymId: session.gymId,
        memberId,
        status: 'ACTIVE',
      },
      data: {
        status: 'COMPLETED',
        endDate: new Date(),
      },
    });

    const assignment = await prisma.trainerAssignment.create({
      data: {
        gymId: session.gymId,
        trainerId,
        memberId,
        startDate: new Date(),
        status: 'ACTIVE',
        notes: notes || null,
      },
      include: {
        trainer: true,
        member: true,
      },
    });

    await createAuditLog({
      gymId: session.gymId,
      userId: session.userId,
      action: 'TRAINER_ASSIGNED',
      entityType: 'TRAINER',
      entityId: trainerId,
      details: {
        trainer: assignment.trainer.fullName,
        member: assignment.member.fullName,
      },
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
