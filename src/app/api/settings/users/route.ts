import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { requireRole, createAuditLog } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await requireRole(['OWNER_ADMIN']);
    const body = await request.json();

    const { name, email, password, role = 'RECEPTIONIST', phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and initial password are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A user account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        gymId: session.gymId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        phone: phone ? phone.trim() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
      },
    });

    await createAuditLog({
      gymId: session.gymId,
      userId: session.userId,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: user.id,
      details: { email: user.email, role: user.role },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
