import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireRole(['OWNER_ADMIN']);

    const expenses = await prisma.expense.findMany({
      where: { gymId: session.gymId },
      orderBy: { expenseDate: 'desc' },
    });

    const headers = ['Date', 'Category', 'Description', 'Amount (INR)', 'Payment Method', 'Reference Number', 'Notes'];

    const rows = expenses.map((e) => [
      format(new Date(e.expenseDate), 'yyyy-MM-dd'),
      e.category,
      `"${e.description.replace(/"/g, '""')}"`,
      e.amount,
      e.paymentMethod,
      e.referenceNumber || '',
      e.notes ? `"${e.notes.replace(/"/g, '""')}"` : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="gym-expenses-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
