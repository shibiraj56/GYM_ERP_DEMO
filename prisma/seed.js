const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for PowerFit Gym (Tamil Nadu)...');

  // 1. Create or upsert Gym
  const gym = await prisma.gym.upsert({
    where: { slug: 'powerfit-coimbatore' },
    update: {},
    create: {
      name: 'PowerFit Gym & Fitness Studio',
      slug: 'powerfit-coimbatore',
      email: 'contact@powerfitgym.in',
      phone: '+91 98421 23456',
      address: '74, Avinashi Road, Peelamedu',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641004',
      logoUrl: '/gym-logo.png',
    },
  });

  console.log('✓ Gym created/verified:', gym.name);

  // 2. Gym Settings
  await prisma.gymSettings.upsert({
    where: { gymId: gym.id },
    update: {},
    create: {
      gymId: gym.id,
      receiptPrefix: 'PF-REC-',
      nextReceiptNumber: 1007,
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      taxPercentage: 0,
      taxNumber: '33AABCP1234F1Z5',
      whatsappTemplate:
        'Vanakkam {name}! Your gym membership at {gym} is expiring on {expiryDate}. Please contact us at +91 98421 23456 to renew. Stay Fit!',
    },
  });

  console.log('✓ Gym settings created/verified');

  // 3. Create Users (Owner, Receptionist, Trainer)
  const passwordHash = await bcrypt.hash('admin123', 10);
  const staffHash = await bcrypt.hash('staff123', 10);
  const trainerHash = await bcrypt.hash('trainer123', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'admin@gym.com' },
    update: { passwordHash },
    create: {
      gymId: gym.id,
      name: 'R. Senthil Nathan (Owner)',
      email: 'admin@gym.com',
      passwordHash,
      role: 'OWNER_ADMIN',
      phone: '+91 98421 23456',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@gym.com' },
    update: { passwordHash: staffHash },
    create: {
      gymId: gym.id,
      name: 'Kavitha Devi (Front Desk)',
      email: 'staff@gym.com',
      passwordHash: staffHash,
      role: 'RECEPTIONIST',
      phone: '+91 97890 11223',
    },
  });

  const trainerUser = await prisma.user.upsert({
    where: { email: 'trainer@gym.com' },
    update: { passwordHash: trainerHash },
    create: {
      gymId: gym.id,
      name: 'Karthik Raja (Senior Trainer)',
      email: 'trainer@gym.com',
      passwordHash: trainerHash,
      role: 'TRAINER',
      phone: '+91 99441 55667',
    },
  });

  console.log('✓ Users seeded (admin@gym.com, staff@gym.com, trainer@gym.com)');

  // 4. Membership Plans
  const plansData = [
    { name: 'Monthly Standard', durationDays: 30, price: 1500, description: 'Access to cardio, weight training, and locker' },
    { name: 'Quarterly Fitness', durationDays: 90, price: 3800, description: 'Best value for 3 months, includes diet consultation' },
    { name: 'Half-Yearly Transformation', durationDays: 180, price: 6500, description: '6 months full access + complimentary steam bath' },
    { name: 'Annual Champion', durationDays: 365, price: 11000, description: '1 year unlimited access + personalized workout routine' },
    { name: 'Personal Training (Monthly)', durationDays: 30, price: 4500, description: 'Dedicated 1-on-1 personal trainer guidance' },
  ];

  const plans = [];
  for (const p of plansData) {
    const existing = await prisma.membershipPlan.findFirst({
      where: { gymId: gym.id, name: p.name },
    });
    if (existing) {
      plans.push(existing);
    } else {
      const created = await prisma.membershipPlan.create({
        data: {
          gymId: gym.id,
          ...p,
        },
      });
      plans.push(created);
    }
  }
  console.log(`✓ ${plans.length} Membership plans ready`);

  // 5. Trainers
  const trainersData = [
    {
      trainerCode: 'TRN-001',
      fullName: 'Karthik Raja',
      mobile: '+91 99441 55667',
      email: 'karthik@powerfitgym.in',
      specialization: 'Strength & Conditioning, Olympic Lifting',
      salary: 28000,
      paymentArrangement: 'Monthly Fixed + Commission',
      joiningDate: new Date('2025-01-10'),
    },
    {
      trainerCode: 'TRN-002',
      fullName: 'Priya Murugan',
      mobile: '+91 98432 77889',
      email: 'priya@powerfitgym.in',
      specialization: 'Fat Loss, Aerobics, Functional HIIT',
      salary: 24000,
      paymentArrangement: 'Monthly Fixed',
      joiningDate: new Date('2025-03-01'),
    },
    {
      trainerCode: 'TRN-003',
      fullName: 'Senthil Velan',
      mobile: '+91 94433 99001',
      email: 'senthil@powerfitgym.in',
      specialization: 'Bodybuilding & Nutrition Counseling',
      salary: 30000,
      paymentArrangement: 'Monthly Fixed',
      joiningDate: new Date('2024-11-15'),
    },
  ];

  const trainers = [];
  for (const t of trainersData) {
    const tr = await prisma.trainer.upsert({
      where: { gymId_trainerCode: { gymId: gym.id, trainerCode: t.trainerCode } },
      update: {},
      create: { gymId: gym.id, ...t },
    });
    trainers.push(tr);
  }
  console.log(`✓ ${trainers.length} Trainers ready`);

  // 6. Members, Memberships, Invoices, Payments
  const today = new Date();
  const dMinus60 = new Date(today.getTime() - 60 * 86400000);
  const dMinus30 = new Date(today.getTime() - 30 * 86400000);
  const dMinus25 = new Date(today.getTime() - 25 * 86400000);
  const dMinus10 = new Date(today.getTime() - 10 * 86400000);
  const dMinus2 = new Date(today.getTime() - 2 * 86400000);

  const dPlus1 = new Date(today.getTime() + 1 * 86400000);
  const dPlus3 = new Date(today.getTime() + 3 * 86400000);
  const dPlus7 = new Date(today.getTime() + 7 * 86400000);
  const dPlus25 = new Date(today.getTime() + 25 * 86400000);
  const dMinus5 = new Date(today.getTime() - 5 * 86400000);

  const membersData = [
    {
      memberCode: 'MEM-1001',
      fullName: 'Vignesh Sundaram',
      mobile: '9842111001',
      email: 'vignesh.sundar@gmail.com',
      gender: 'Male',
      dateOfBirth: new Date('1994-06-15'),
      address: '12, Gandhipuram 4th Street, Coimbatore',
      emergencyContactName: 'Sundaram (Father)',
      emergencyContactPhone: '9842111099',
      joiningDate: dMinus60,
      status: 'ACTIVE',
      planIndex: 1, // Quarterly
      startDate: dMinus30,
      expiryDate: dPlus25,
      paidStatus: 'PAID',
      paidAmount: 3800,
      paymentMethod: 'UPI',
      notes: 'Focusing on bench press and core strength',
    },
    {
      memberCode: 'MEM-1002',
      fullName: 'Anitha Rajendran',
      mobile: '9842111002',
      email: 'anitha.raj@yahoo.com',
      gender: 'Female',
      dateOfBirth: new Date('1998-11-20'),
      address: '45, Saibaba Colony, Coimbatore',
      emergencyContactName: 'Rajendran (Spouse)',
      emergencyContactPhone: '9842111098',
      joiningDate: dMinus25,
      status: 'EXPIRING_SOON',
      planIndex: 0, // Monthly
      startDate: dMinus25,
      expiryDate: dPlus3, // Expiring in 3 days!
      paidStatus: 'PAID',
      paidAmount: 1500,
      paymentMethod: 'CASH',
      notes: 'Morning batch attendee',
    },
    {
      memberCode: 'MEM-1003',
      fullName: 'Murugan Velu',
      mobile: '9842111003',
      email: 'murugan.velu@gmail.com',
      gender: 'Male',
      dateOfBirth: new Date('1991-03-08'),
      address: '88, RS Puram West, Coimbatore',
      emergencyContactName: 'Velu (Brother)',
      emergencyContactPhone: '9842111097',
      joiningDate: dMinus30,
      status: 'EXPIRING_SOON',
      planIndex: 0, // Monthly
      startDate: dMinus30,
      expiryDate: dPlus1, // Expiring tomorrow!
      paidStatus: 'PAID',
      paidAmount: 1500,
      paymentMethod: 'UPI',
      notes: 'Needs renewal alert via WhatsApp',
    },
    {
      memberCode: 'MEM-1004',
      fullName: 'Suresh Krishnan',
      mobile: '9842111004',
      email: 'suresh.k@outlook.com',
      gender: 'Male',
      dateOfBirth: new Date('1989-08-25'),
      address: '15, Peelamedu Pudur, Coimbatore',
      emergencyContactName: 'Krishnan (Father)',
      emergencyContactPhone: '9842111096',
      joiningDate: dMinus60,
      status: 'EXPIRED',
      planIndex: 0, // Monthly
      startDate: new Date(dMinus5.getTime() - 30 * 86400000),
      expiryDate: dMinus5, // Expired 5 days ago!
      paidStatus: 'OVERDUE',
      paidAmount: 0,
      paymentMethod: 'CASH',
      notes: 'Contacted once, promised to renew this Saturday',
    },
    {
      memberCode: 'MEM-1005',
      fullName: 'Deepak Raman',
      mobile: '9842111005',
      email: 'deepak.raman@gmail.com',
      gender: 'Male',
      dateOfBirth: new Date('1996-01-12'),
      address: '22, Race Course Road, Coimbatore',
      emergencyContactName: 'Raman (Father)',
      emergencyContactPhone: '9842111095',
      joiningDate: dMinus10,
      status: 'ACTIVE',
      planIndex: 2, // Half-Yearly (₹6,500)
      startDate: dMinus10,
      expiryDate: new Date(dMinus10.getTime() + 180 * 86400000),
      paidStatus: 'PARTIAL',
      paidAmount: 4000, // ₹2,500 due
      paymentMethod: 'UPI',
      notes: 'Remaining ₹2,500 due next week',
    },
    {
      memberCode: 'MEM-1006',
      fullName: 'Lakshmi Narayanan',
      mobile: '9842111006',
      email: 'lakshmi.n@gmail.com',
      gender: 'Female',
      dateOfBirth: new Date('2001-05-18'),
      address: '33, Saravanampatti, Coimbatore',
      emergencyContactName: 'Narayanan (Father)',
      emergencyContactPhone: '9842111094',
      joiningDate: dMinus2,
      status: 'ACTIVE',
      planIndex: 0, // Monthly
      startDate: dMinus2,
      expiryDate: new Date(dMinus2.getTime() + 30 * 86400000),
      paidStatus: 'PAID',
      paidAmount: 1500,
      paymentMethod: 'CARD',
      notes: 'New joinee, student discount ₹0 applied',
    },
    {
      memberCode: 'MEM-1007',
      fullName: 'Saravanan Natarajan',
      mobile: '9842111007',
      email: 'saravanan.n@gmail.com',
      gender: 'Male',
      dateOfBirth: new Date('1992-09-30'),
      address: '5, Singanallur, Coimbatore',
      emergencyContactName: 'Natarajan (Father)',
      emergencyContactPhone: '9842111093',
      joiningDate: dMinus60,
      status: 'FROZEN',
      planIndex: 3, // Annual
      startDate: dMinus60,
      expiryDate: new Date(dMinus60.getTime() + 365 * 86400000),
      paidStatus: 'PAID',
      paidAmount: 11000,
      paymentMethod: 'BANK_TRANSFER',
      notes: 'Temporarily paused membership for 2 weeks due to travel',
    },
  ];

  let receiptNum = 1001;
  let invNum = 1001;

  for (const m of membersData) {
    const member = await prisma.member.upsert({
      where: { gymId_memberCode: { gymId: gym.id, memberCode: m.memberCode } },
      update: { status: m.status },
      create: {
        gymId: gym.id,
        memberCode: m.memberCode,
        fullName: m.fullName,
        mobile: m.mobile,
        email: m.email,
        gender: m.gender,
        dateOfBirth: m.dateOfBirth,
        address: m.address,
        emergencyContactName: m.emergencyContactName,
        emergencyContactPhone: m.emergencyContactPhone,
        joiningDate: m.joiningDate,
        status: m.status,
        notes: m.notes,
      },
    });

    const plan = plans[m.planIndex];
    const finalPrice = plan.price;

    // Create Membership
    const existingMembership = await prisma.membership.findFirst({
      where: { gymId: gym.id, memberId: member.id },
    });

    let membership = existingMembership;
    if (!membership) {
      membership = await prisma.membership.create({
        data: {
          gymId: gym.id,
          memberId: member.id,
          planId: plan.id,
          startDate: m.startDate,
          expiryDate: m.expiryDate,
          basePrice: plan.price,
          discount: 0,
          finalPrice,
          status: m.status === 'EXPIRED' ? 'EXPIRED' : 'ACTIVE',
        },
      });
    }

    // Invoices and Payments
    const existingInv = await prisma.invoice.findFirst({
      where: { gymId: gym.id, memberId: member.id },
    });

    if (!existingInv) {
      const balanceDue = finalPrice - m.paidAmount;
      const inv = await prisma.invoice.create({
        data: {
          gymId: gym.id,
          invoiceNumber: `INV-2026-${invNum++}`,
          memberId: member.id,
          membershipId: membership.id,
          dueDate: m.startDate,
          totalAmount: finalPrice,
          discount: 0,
          netAmount: finalPrice,
          paidAmount: m.paidAmount,
          balanceDue,
          status:
            balanceDue === 0
              ? 'PAID'
              : m.paidAmount > 0
              ? 'PARTIAL'
              : m.status === 'EXPIRED'
              ? 'OVERDUE'
              : 'PENDING',
          notes: m.paidStatus === 'PARTIAL' ? 'Installment payment 1 of 2' : 'Full settlement',
        },
      });

      // Record payment if paidAmount > 0
      if (m.paidAmount > 0) {
        await prisma.payment.create({
          data: {
            gymId: gym.id,
            receiptNumber: `PF-REC-${receiptNum++}`,
            invoiceId: inv.id,
            memberId: member.id,
            amount: m.paidAmount,
            paymentMethod: m.paymentMethod,
            transactionRef: m.paymentMethod === 'UPI' ? `UPI${Math.floor(1000000000 + Math.random() * 9000000000)}` : 'OFFLINE-CASH',
            paymentDate: m.startDate,
            notes: 'Membership enrollment fee',
            receivedById: staff.id,
          },
        });
      }
    }

    // Today's attendance for active members (except frozen and expired)
    if (['MEM-1001', 'MEM-1002', 'MEM-1005', 'MEM-1006'].includes(m.memberCode)) {
      const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      await prisma.attendance.upsert({
        where: {
          gymId_memberId_date: {
            gymId: gym.id,
            memberId: member.id,
            date: todayMid,
          },
        },
        update: {},
        create: {
          gymId: gym.id,
          memberId: member.id,
          date: todayMid,
          checkInTime: new Date(today.getTime() - Math.floor(Math.random() * 4) * 3600000),
        },
      });
    }
  }

  console.log('✓ Members, memberships, invoices, payments, and attendance seeded');

  // 7. Operational Expenses for current month
  const expensesData = [
    { category: 'RENT', description: 'Gym Premises Monthly Rent (Avinashi Rd Building)', amount: 35000, paymentMethod: 'BANK_TRANSFER', referenceNumber: 'NEFT998811' },
    { category: 'ELECTRICITY', description: 'TNEB Commercial Power & AC Bill', amount: 8250, paymentMethod: 'UPI', referenceNumber: 'TNEB202610' },
    { category: 'TRAINER_SALARY', description: 'Trainer Salary Payout - Karthik Raja', amount: 28000, paymentMethod: 'BANK_TRANSFER', referenceNumber: 'SAL-OCT-01' },
    { category: 'TRAINER_SALARY', description: 'Trainer Salary Payout - Priya Murugan', amount: 24000, paymentMethod: 'BANK_TRANSFER', referenceNumber: 'SAL-OCT-02' },
    { category: 'EQUIPMENT', description: 'Cable Crossover Pulley Cable Replacement & Grease', amount: 3200, paymentMethod: 'CASH', referenceNumber: 'INV-EQ-88' },
    { category: 'CLEANING', description: 'Sanitizers, Floor Disinfectant, Paper Towels', amount: 2100, paymentMethod: 'UPI', referenceNumber: 'UPI778844' },
    { category: 'SUPPLEMENTS', description: 'Whey Protein & BCAA restock for front desk kiosk', amount: 12500, paymentMethod: 'CARD', referenceNumber: 'POS-TX-990' },
  ];

  for (const exp of expensesData) {
    await prisma.expense.create({
      data: {
        gymId: gym.id,
        category: exp.category,
        description: exp.description,
        amount: exp.amount,
        paymentMethod: exp.paymentMethod,
        referenceNumber: exp.referenceNumber,
        expenseDate: new Date(today.getTime() - Math.floor(Math.random() * 20) * 86400000),
        recordedById: owner.id,
      },
    });
  }
  console.log(`✓ ${expensesData.length} Operational expenses recorded`);

  // 8. Notifications
  await prisma.notification.createMany({
    data: [
      {
        gymId: gym.id,
        type: 'EXPIRY_WARNING',
        title: 'Membership Expiring Tomorrow',
        message: 'Murugan Velu (MEM-1003) Monthly plan expires tomorrow. WhatsApp reminder recommended.',
      },
      {
        gymId: gym.id,
        type: 'EXPIRY_WARNING',
        title: 'Membership Expiring in 3 Days',
        message: 'Anitha Rajendran (MEM-1002) Monthly plan expires in 3 days.',
      },
      {
        gymId: gym.id,
        type: 'PAYMENT_OVERDUE',
        title: 'Pending Fee Balance',
        message: 'Deepak Raman (MEM-1005) has an unpaid balance of ₹2,500 due on Half-Yearly plan.',
      },
      {
        gymId: gym.id,
        type: 'MEMBERSHIP_EXPIRED',
        title: 'Membership Expired',
        message: 'Suresh Krishnan (MEM-1004) expired 5 days ago.',
      },
    ],
  });

  // 9. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      gymId: gym.id,
      userId: owner.id,
      action: 'SYSTEM_INITIALIZED',
      entityType: 'GYM',
      entityId: gym.id,
      details: JSON.stringify({ message: 'Gym ERP initialized with production configuration' }),
    },
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
