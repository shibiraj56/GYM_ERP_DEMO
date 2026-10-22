import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const dateStr = searchParams.get('date');
    const targetDate = dateStr ? new Date(dateStr) : new Date();

    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // Fetch attendance for the requested date
    const attendances = await prisma.attendance.findMany({
      where: {
        gymId: session.gymId,
        date: { gte: dayStart, lte: dayEnd },
      },
      include: {
        member: {
          include: {
            memberships: {
              include: { plan: true },
              orderBy: { expiryDate: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { checkInTime: 'desc' },
    });

    // Today's total count
    const todayCount = await prisma.attendance.count({
      where: {
        gymId: session.gymId,
        date: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) },
      },
    });

    // Identify active members who have not visited in the last 7 days
    const sevenDaysAgo = subDays(new Date(), 7);
    const activeMembers = await prisma.member.findMany({
      where: {
        gymId: session.gymId,
        status: 'ACTIVE',
        isArchived: false,
      },
      include: {
        attendances: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    const inactiveMembers = activeMembers.filter((m) => {
      const lastVisit = m.attendances[0]?.date;
      if (!lastVisit) return true; // never attended
      return new Date(lastVisit) < sevenDaysAgo;
    });

    return NextResponse.json({
      attendances,
      todayCount,
      inactiveMembers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { memberId, notes } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.gymId !== session.gymId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const now = new Date();
    // Normalize date to midnight
    const calendarDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check duplicate check-in today
    const existing = await prisma.attendance.findUnique({
      where: {
        gymId_memberId_date: {
          gymId: session.gymId,
          memberId: member.id,
          date: calendarDate,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `${member.fullName} has already been checked in today at ${new Date(
            existing.checkInTime
          ).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Duplicate check-in prevented.`,
        },
        { status: 409 }
      );
    }

    const record = await prisma.attendance.create({
      data: {
        gymId: session.gymId,
        memberId: member.id,
        date: calendarDate,
        checkInTime: now,
        notes: notes || null,
      },
      include: {
        member: true,
      },
    });

    return NextResponse.json({ success: true, attendance: record });
  } catch (error: any) {
    console.error('Attendance error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
