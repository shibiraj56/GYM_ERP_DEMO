import prisma from './prisma';
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, addDays, format } from 'date-fns';

export async function getDashboardData(gymId: string) {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const in7Days = addDays(now, 7);

  // 1. Members metrics
  const [
    totalActiveMembers,
    newMembersThisMonth,
    expiringSoonMembers,
    expiredMembers,
    frozenMembers,
  ] = await Promise.all([
    prisma.member.count({
      where: { gymId, status: 'ACTIVE', isArchived: false },
    }),
    prisma.member.count({
      where: {
        gymId,
        joiningDate: { gte: currentMonthStart, lte: currentMonthEnd },
        isArchived: false,
      },
    }),
    prisma.member.count({
      where: {
        gymId,
        isArchived: false,
        memberships: {
          some: {
            expiryDate: { gte: now, lte: in7Days },
            status: 'ACTIVE',
          },
        },
      },
    }),
    prisma.member.count({
      where: { gymId, status: 'EXPIRED', isArchived: false },
    }),
    prisma.member.count({
      where: { gymId, status: 'FROZEN', isArchived: false },
    }),
  ]);

  // 2. Financial metrics
  // Fees collected this month
  const monthlyPayments = await prisma.payment.aggregate({
    where: {
      gymId,
      paymentDate: { gte: currentMonthStart, lte: currentMonthEnd },
    },
    _sum: { amount: true },
  });
  const feesCollectedThisMonth = monthlyPayments._sum.amount || 0;

  // Pending membership fees
  const pendingInvoices = await prisma.invoice.aggregate({
    where: {
      gymId,
      balanceDue: { gt: 0 },
    },
    _sum: { balanceDue: true },
  });
  const pendingMembershipFees = pendingInvoices._sum.balanceDue || 0;

  // Monthly Expenses
  const monthlyExpensesAgg = await prisma.expense.aggregate({
    where: {
      gymId,
      expenseDate: { gte: currentMonthStart, lte: currentMonthEnd },
    },
    _sum: { amount: true },
  });
  const monthlyExpenses = monthlyExpensesAgg._sum.amount || 0;

  // Monthly Net Balance
  const monthlyNetBalance = feesCollectedThisMonth - monthlyExpenses;

  // 3. Today's attendance
  const todayAttendance = await prisma.attendance.count({
    where: {
      gymId,
      checkInTime: { gte: todayStart, lte: todayEnd },
    },
  });

  // 4. Notifications
  const notifications = await prisma.notification.findMany({
    where: { gymId },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });

  // 5. Recent payments for live feed
  const recentPayments = await prisma.payment.findMany({
    where: { gymId },
    include: {
      member: true,
      invoice: true,
    },
    orderBy: { paymentDate: 'desc' },
    take: 5,
  });

  // 6. Expiring soon members list for renewal quick action
  const expiringMembersList = await prisma.member.findMany({
    where: {
      gymId,
      isArchived: false,
      memberships: {
        some: {
          expiryDate: { gte: now, lte: in7Days },
        },
      },
    },
    include: {
      memberships: {
        include: { plan: true },
        orderBy: { expiryDate: 'desc' },
        take: 1,
      },
    },
    take: 5,
  });

  // 7. Monthly chart trends (Last 6 Months)
  const monthlyTrends: Array<{
    month: string;
    income: number;
    expense: number;
    newMembers: number;
  }> = [];

  for (let i = 5; i >= 0; i--) {
    const targetMonth = subMonths(now, i);
    const mStart = startOfMonth(targetMonth);
    const mEnd = endOfMonth(targetMonth);
    const monthLabel = format(targetMonth, 'MMM yyyy');

    const [incomeAgg, expenseAgg, membersCount] = await Promise.all([
      prisma.payment.aggregate({
        where: { gymId, paymentDate: { gte: mStart, lte: mEnd } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { gymId, expenseDate: { gte: mStart, lte: mEnd } },
        _sum: { amount: true },
      }),
      prisma.member.count({
        where: { gymId, joiningDate: { gte: mStart, lte: mEnd }, isArchived: false },
      }),
    ]);

    monthlyTrends.push({
      month: monthLabel,
      income: incomeAgg._sum.amount || 0,
      expense: expenseAgg._sum.amount || 0,
      newMembers: membersCount,
    });
  }

  // 8. Membership status distribution
  const statusDistribution = [
    { name: 'Active', value: totalActiveMembers, fill: '#10b981' },
    { name: 'Expiring Soon', value: expiringSoonMembers, fill: '#f59e0b' },
    { name: 'Expired', value: expiredMembers, fill: '#f43f5e' },
    { name: 'Frozen', value: frozenMembers, fill: '#3b82f6' },
  ];

  return {
    kpis: {
      totalActiveMembers,
      newMembersThisMonth,
      expiringSoonMembers,
      expiredMembers,
      feesCollectedThisMonth,
      pendingMembershipFees,
      todayAttendance,
      monthlyExpenses,
      monthlyNetBalance,
    },
    notifications,
    recentPayments,
    expiringMembersList,
    monthlyTrends,
    statusDistribution,
  };
}
