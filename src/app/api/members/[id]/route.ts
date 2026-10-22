import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, createAuditLog } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();

    const member = await prisma.member.findUnique({
      where: { id: params.id },
      include: {
        memberships: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          include: { payments: true },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 60,
        },
        trainerAssignments: {
          include: { trainer: true },
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!member || member.gymId !== session.gymId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ member });
  } catch (error: any) {
    console.error('Error fetching member details:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const member = await prisma.member.findUnique({
      where: { id: params.id },
    });

    if (!member || member.gymId !== session.gymId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const {
      fullName,
      mobile,
      email,
      gender,
      dateOfBirth,
      address,
      emergencyContactName,
      emergencyContactPhone,
      status,
      notes,
    } = body;

    const updated = await prisma.member.update({
      where: { id: params.id },
      data: {
        fullName: fullName ? fullName.trim() : member.fullName,
        mobile: mobile ? mobile.trim() : member.mobile,
        email: email !== undefined ? (email ? email.trim() : null) : member.email,
        gender: gender || member.gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : member.dateOfBirth,
        address: address !== undefined ? address : member.address,
        emergencyContactName: emergencyContactName !== undefined ? emergencyContactName : member.emergencyContactName,
        emergencyContactPhone: emergencyContactPhone !== undefined ? emergencyContactPhone : member.emergencyContactPhone,
        status: status || member.status,
        notes: notes !== undefined ? notes : member.notes,
      },
    });

    await createAuditLog({
      gymId: session.gymId,
      userId: session.userId,
      action: 'MEMBER_UPDATED',
      entityType: 'MEMBER',
      entityId: member.id,
      details: { memberCode: member.memberCode, changes: body },
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error: any) {
    console.error('Error updating member:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();

    const member = await prisma.member.findUnique({
      where: { id: params.id },
    });

    if (!member || member.gymId !== session.gymId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Soft delete / archive
    await prisma.member.update({
      where: { id: params.id },
      data: { isArchived: true, status: 'CANCELLED' },
    });

    await createAuditLog({
      gymId: session.gymId,
      userId: session.userId,
      action: 'MEMBER_ARCHIVED',
      entityType: 'MEMBER',
      entityId: member.id,
      details: { memberCode: member.memberCode, fullName: member.fullName },
    });

    return NextResponse.json({ success: true, message: 'Member archived successfully' });
  } catch (error: any) {
    console.error('Error archiving member:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
