import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireAuth();

    const members = await prisma.member.findMany({
      where: {
        gymId: session.gymId,
        isArchived: false,
      },
      include: {
        memberships: {
          include: { plan: true },
          orderBy: { expiryDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { memberCode: 'asc' },
    });

    const headers = [
      'Member ID',
      'Full Name',
      'Mobile Number',
      'Email',
      'Gender',
      'Status',
      'Joining Date',
      'Current Plan',
      'Plan Expiry Date',
      'Emergency Contact Name',
      'Emergency Contact Phone',
      'Address',
    ];

    const rows = members.map((m) => {
      const activePlan = m.memberships[0];
      return [
        m.memberCode,
        `"${m.fullName.replace(/"/g, '""')}"`,
        m.mobile,
        m.email || '',
        m.gender || '',
        m.status,
        m.joiningDate ? format(new Date(m.joiningDate), 'yyyy-MM-dd') : '',
        activePlan ? `"${activePlan.plan.name.replace(/"/g, '""')}"` : '',
        activePlan?.expiryDate ? format(new Date(activePlan.expiryDate), 'yyyy-MM-dd') : '',
        m.emergencyContactName ? `"${m.emergencyContactName.replace(/"/g, '""')}"` : '',
        m.emergencyContactPhone || '',
        m.address ? `"${m.address.replace(/"/g, '""')}"` : '',
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="gym-members-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting members:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
