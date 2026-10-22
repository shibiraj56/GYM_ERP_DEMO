import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, createAuditLog } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await requireRole(['OWNER_ADMIN']);
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const where: any = { gymId: session.gymId };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
    });

    return NextResponse.json({ expenses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(['OWNER_ADMIN']);
    const body = await request.json();

    const {
      category,
      description,
      amount,
      paymentMethod = 'UPI',
      referenceNumber,
      expenseDate,
      notes,
    } = body;

    const expenseAmt = parseInt(amount, 10);
    if (!category || !description || !expenseAmt || expenseAmt <= 0) {
      return NextResponse.json(
        { error: 'Category, description, and valid amount are required' },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        gymId: session.gymId,
        category,
        description: description.trim(),
        amount: expenseAmt,
        paymentMethod,
        referenceNumber: referenceNumber || null,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        notes: notes || null,
        recordedById: session.userId,
      },
    });

    await createAuditLog({
      gymId: session.gymId,
      userId: session.userId,
      action: 'EXPENSE_RECORDED',
      entityType: 'EXPENSE',
      entityId: expense.id,
      details: { category, amount: expenseAmt, description },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
