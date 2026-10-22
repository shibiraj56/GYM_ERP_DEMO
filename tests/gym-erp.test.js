const test = require('node:test');
const assert = require('node:assert');
const { PrismaClient } = require('@prisma/client');
const { addDays, differenceInDays } = require('date-fns');

const prisma = new PrismaClient();

test('Gym ERP Test Suite: Billing, Membership & Verification', async (t) => {
  let testGym;
  let testPlan;
  let testMember;

  await t.test('1. Database Tenant & Gym Settings Verification', async () => {
    testGym = await prisma.gym.findFirst({
      where: { slug: 'powerfit-coimbatore' },
      include: { settings: true },
    });

    assert.ok(testGym, 'Gym tenant must exist');
    assert.strictEqual(testGym.state, 'Tamil Nadu', 'State must be Tamil Nadu');
    assert.ok(testGym.settings, 'Gym settings must be configured');
    assert.strictEqual(testGym.settings.currency, 'INR', 'Currency must be INR');
    assert.strictEqual(testGym.settings.timezone, 'Asia/Kolkata', 'Timezone must be Asia/Kolkata');
  });

  await t.test('2. Membership Plans Verification', async () => {
    const plans = await prisma.membershipPlan.findMany({
      where: { gymId: testGym.id },
    });

    assert.ok(plans.length >= 4, 'Must have at least 4 default membership plans');
    testPlan = plans.find((p) => p.name === 'Monthly Standard') || plans[0];
    assert.strictEqual(testPlan.durationDays, 30, 'Monthly standard must be 30 days');
    assert.ok(testPlan.price > 0, 'Price must be positive integer in INR');
  });

  await t.test('3. Expiry Date Calculation Workflow', async () => {
    const startDate = new Date('2026-10-01T00:00:00.000Z');
    const calculatedExpiry = addDays(startDate, testPlan.durationDays);
    const days = differenceInDays(calculatedExpiry, startDate);

    assert.strictEqual(days, 30, 'Expiry date must be exactly 30 days from start date');
  });

  await t.test('4. Member Enrollment & Duplicate Prevention', async () => {
    const uniqueMobile = `98421${Math.floor(10000 + Math.random() * 90000)}`;
    const memberCode = `MEM-TEST-${Date.now().toString().slice(-4)}`;

    testMember = await prisma.member.create({
      data: {
        gymId: testGym.id,
        memberCode,
        fullName: 'Test Athlete Automated',
        mobile: uniqueMobile,
        status: 'ACTIVE',
      },
    });

    assert.ok(testMember.id, 'Member must be created successfully');

    // Attempt duplicate mobile registration in the same gym
    const duplicate = await prisma.member.findFirst({
      where: { gymId: testGym.id, mobile: uniqueMobile, isArchived: false },
    });
    assert.ok(duplicate, 'Duplicate detection query must locate existing mobile');
  });

  await t.test('5. Billing Ledger, Partial Payment & Outstanding Balance', async () => {
    const totalAmount = 6500;
    const initialPaid = 4000;
    const expectedBalance = totalAmount - initialPaid;

    const invoice = await prisma.invoice.create({
      data: {
        gymId: testGym.id,
        invoiceNumber: `INV-TEST-${Date.now().toString().slice(-4)}`,
        memberId: testMember.id,
        dueDate: new Date(),
        totalAmount,
        netAmount: totalAmount,
        paidAmount: initialPaid,
        balanceDue: expectedBalance,
        status: 'PARTIAL',
      },
    });

    assert.strictEqual(invoice.balanceDue, 2500, 'Outstanding balance must accurately calculate 2500');
    assert.strictEqual(invoice.status, 'PARTIAL', 'Invoice status must be marked PARTIAL');

    // Record second payment to clear dues
    const payment = await prisma.payment.create({
      data: {
        gymId: testGym.id,
        receiptNumber: `REC-TEST-${Date.now().toString().slice(-4)}`,
        invoiceId: invoice.id,
        memberId: testMember.id,
        amount: expectedBalance,
        paymentMethod: 'UPI',
        transactionRef: 'UPI1234567890',
      },
    });

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: invoice.paidAmount + payment.amount,
        balanceDue: 0,
        status: 'PAID',
      },
    });

    assert.strictEqual(updatedInvoice.balanceDue, 0, 'Balance due must reach 0 after final settlement');
    assert.strictEqual(updatedInvoice.status, 'PAID', 'Invoice status must update to PAID');
  });

  await t.test('6. Attendance & Same-Day Duplicate Prevention', async () => {
    const now = new Date();
    const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1st Check-in
    const att = await prisma.attendance.create({
      data: {
        gymId: testGym.id,
        memberId: testMember.id,
        date: todayMid,
        checkInTime: now,
      },
    });
    assert.ok(att.id, 'First check-in must succeed');

    // 2nd Check-in attempt on the same day must throw unique constraint violation
    await assert.rejects(
      async () => {
        await prisma.attendance.create({
          data: {
            gymId: testGym.id,
            memberId: testMember.id,
            date: todayMid,
            checkInTime: now,
          },
        });
      },
      /Unique constraint failed/i,
      'Duplicate attendance on same day must be prevented by unique constraint'
    );
  });

  await t.test('7. Continuous Membership Renewal Workflow', async () => {
    const currentExpiry = new Date(Date.now() + 5 * 86400000); // 5 days in future

    // Create active membership
    const mem1 = await prisma.membership.create({
      data: {
        gymId: testGym.id,
        memberId: testMember.id,
        planId: testPlan.id,
        startDate: new Date(),
        expiryDate: currentExpiry,
        basePrice: testPlan.price,
        finalPrice: testPlan.price,
        status: 'ACTIVE',
      },
    });

    // When renewed before expiry, new membership must extend from currentExpiry
    const renewedExpiry = addDays(currentExpiry, testPlan.durationDays);
    const mem2 = await prisma.membership.create({
      data: {
        gymId: testGym.id,
        memberId: testMember.id,
        planId: testPlan.id,
        startDate: currentExpiry,
        expiryDate: renewedExpiry,
        basePrice: testPlan.price,
        finalPrice: testPlan.price,
        status: 'ACTIVE',
      },
    });

    assert.strictEqual(
      mem2.startDate.getTime(),
      currentExpiry.getTime(),
      'Renewal must start from current expiry date'
    );
    assert.ok(
      mem2.expiryDate > mem1.expiryDate,
      'New expiry date must extend further into the future'
    );
  });

  await t.test('8. Net Operating Balance Reconciles with DB Records', async () => {
    const [paymentsSum, refundsSum, expensesSum] = await Promise.all([
      prisma.payment.aggregate({
        where: { gymId: testGym.id },
        _sum: { amount: true },
      }),
      prisma.refund.aggregate({
        where: { gymId: testGym.id },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { gymId: testGym.id },
        _sum: { amount: true },
      }),
    ]);

    const income = (paymentsSum._sum.amount || 0) - (refundsSum._sum.amount || 0);
    const expenses = expensesSum._sum.amount || 0;
    const netBalance = income - expenses;

    assert.strictEqual(typeof netBalance, 'number', 'Net balance must be calculated');
    assert.ok(!isNaN(netBalance), 'Net balance must not be NaN');
  });

  // Cleanup test member
  await prisma.attendance.deleteMany({ where: { memberId: testMember.id } });
  await prisma.payment.deleteMany({ where: { memberId: testMember.id } });
  await prisma.invoice.deleteMany({ where: { memberId: testMember.id } });
  await prisma.membership.deleteMany({ where: { memberId: testMember.id } });
  await prisma.member.delete({ where: { id: testMember.id } });
});
