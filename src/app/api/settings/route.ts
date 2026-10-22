import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, createAuditLog } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireRole(['OWNER_ADMIN']);

    const [gym, users] = await Promise.all([
      prisma.gym.findUnique({
        where: { id: session.gymId },
        include: { settings: true },
      }),
      prisma.user.findMany({
        where: { gymId: session.gymId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return NextResponse.json({ gym, users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireRole(['OWNER_ADMIN']);
    const body = await request.json();

    const {
      name,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      receiptPrefix,
      taxNumber,
      whatsappTemplate,
    } = body;

    // 1. Update Gym
    const updatedGym = await prisma.gym.update({
      where: { id: session.gymId },
      data: {
        name: name ? name.trim() : undefined,
        phone: phone ? phone.trim() : undefined,
        email: email ? email.trim() : undefined,
        address: address ? address.trim() : undefined,
        city: city ? city.trim() : undefined,
        state: state ? state.trim() : undefined,
        pincode: pincode ? pincode.trim() : undefined,
      },
    });

    // 2. Update GymSettings
    const updatedSettings = await prisma.gymSettings.upsert({
      where: { gymId: session.gymId },
      update: {
        receiptPrefix: receiptPrefix || undefined,
        taxNumber: taxNumber || undefined,
        whatsappTemplate: whatsappTemplate || undefined,
      },
      create: {
        gymId: session.gymId,
        receiptPrefix: receiptPrefix || 'REC-',
        taxNumber: taxNumber || null,
        whatsappTemplate: whatsappTemplate || null,
      },
    });

    await createAuditLog({
      gymId: session.gymId,
      userId: session.userId,
      action: 'SETTINGS_UPDATED',
      entityType: 'SETTINGS',
      entityId: session.gymId,
      details: body,
    });

    return NextResponse.json({ success: true, gym: updatedGym, settings: updatedSettings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
