import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireRole(['OWNER_ADMIN']);

    const [payments, expenses, refunds, invoices] = await Promise.all([
      prisma.payment.findMany({
        where: { gymId: session.gymId },
        include: { member: true },
        orderBy: { paymentDate: 'desc' },
      }),
      prisma.expense.findMany({
        where: { gymId: session.gymId },
        orderBy: { expenseDate: 'desc' },
      }),
      prisma.refund.findMany({
        where: { gymId: session.gymId },
      }),
      prisma.invoice.findMany({
        where: { gymId: session.gymId },
      }),
    ]);

    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalRefunds = refunds.reduce((sum, r) => sum + r.amount, 0);
    const netIncome = totalCollected - totalRefunds;
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netOperatingBalance = netIncome - totalExpense;
    const totalDuesOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

    const reportLines = [
      'GYM ERP FINANCIAL RECONCILIATION REPORT',
      `Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`,
      `Gym: ${session.gymName}`,
      '',
      'SUMMARY METRICS (INR ₹)',
      `Gross Fee Collections,${totalCollected}`,
      `Total Refunds Issued,${totalRefunds}`,
      `Net Fee Revenue,${netIncome}`,
      `Total Operational Expenses,${totalExpense}`,
      `Net Operating Balance (Cash Flow),${netOperatingBalance}`,
      `Outstanding Member Dues,${totalDuesOutstanding}`,
      '',
      'RECORDED PAYMENT TRANSACTIONS',
      'Date,Receipt #,Member,Amount (INR),Method,Reference',
      ...payments.map((p) =>
        [
          format(new Date(p.paymentDate), 'yyyy-MM-dd'),
          p.receiptNumber,
          `"${p.member.fullName}"`,
          p.amount,
          p.paymentMethod,
          p.transactionRef || '',
        ].join(',')
      ),
      '',
      'RECORDED OPERATIONAL EXPENSES',
      'Date,Category,Description,Amount (INR),Method,Reference',
      ...expenses.map((e) =>
        [
          format(new Date(e.expenseDate), 'yyyy-MM-dd'),
          e.category,
          `"${e.description}"`,
          e.amount,
          e.paymentMethod,
          e.referenceNumber || '',
        ].join(',')
      ),
    ];

    return new Response(reportLines.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="financial-report-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
