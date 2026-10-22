# PowerFit Gym ERP – Production-Ready Gym Management System

A multi-tenant, production-ready Gym ERP web application specifically crafted for local gyms and fitness clubs in **Tamil Nadu, India** (Coimbatore, Chennai, Madurai, Salem, Tiruchirappalli, etc.).

Built with Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React, and Prisma ORM with integer-minor-unit currency handling and zero-data-loss database schema architecture.

---

## 🚀 Live Demo & Test Credentials

The system includes pre-configured role-based user accounts with one-click test logins:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Owner / Admin** | `admin@gym.com` | `admin123` | Full financial, expenses, reports, settings, and member administration |
| **Receptionist** | `staff@gym.com` | `staff123` | Front-desk check-ins, new member enrollments, fee collection, receipts |
| **Trainer** | `trainer@gym.com` | `trainer123` | Member roster, attendance logs, and athlete management |

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 App Router, React 18, TypeScript, Lucide React
- **Styling**: Tailwind CSS with custom SaaS dark sidebar & light data canvas
- **Database & ORM**: PostgreSQL / SQLite with Prisma ORM 5.22.0
- **Authentication**: JWT session with HTTP-only cookies, bcryptjs password hashing, and role-based route guard
- **Financial Charts**: Recharts (Income vs Expenses, Membership Health, Joinees velocity)
- **Validation**: React Hook Form with Zod schemas
- **Reporting & Print**: Printable official receipts (`@media print` formatted for A4 & thermal receipt printers) and CSV exports

---

## 📦 Key Functional Modules

### 1. Unified Dashboard
- **9 Real-time KPI Cards**: Active members, New joinees this month, Memberships expiring soon (within 7 days), Expired memberships, Monthly fee collections, Pending dues, Today's attendance, Monthly expenses, and Net operating balance.
- **Visual Analytics**: Interactive Recharts graphs tracking income vs expenses, membership distribution, and new enrollments.
- **Direct Quick Actions**: Add Member, Record Fee, Mark Attendance, 1-Click Renewal, WhatsApp click-to-chat alerts.

### 2. Member Management
- Automatically generated Member IDs (e.g. `MEM-1001`, `MEM-1002`).
- Duplicate mobile number registration prevention.
- Comprehensive member profiles with 4 detailed tabs:
  1. *Personal Details & Emergency Contacts*
  2. *Invoices & Payment Transactions Ledger*
  3. *Attendance Check-in Calendar*
  4. *Membership History & Renewals*
- CSV export of active athletes.

### 3. Membership Plans
- Flexible plan durations: Monthly (30 days), Quarterly (90 days), Half-Yearly (180 days), Annual (365 days), and Custom tiers.
- Individual member discount support and automatic expiry date rollover calculation.

### 4. Fee Collection, Payments & Receipts
- Full & partial payment tracking (`PAID`, `PARTIAL`, `PENDING`, `OVERDUE`).
- Automatic calculation of outstanding balances.
- Official printable payment receipts with Gym Header, Receipt Number (`PF-REC-1001`), Member Details, GSTIN, and Remaining Balance.
- Authorized refund workflows with audit logging.
- Pending fees aging report with days overdue counter.

### 5. Fast Attendance & Retention Tracking
- Fast, sub-second check-in by typing Member Name, Code, or Phone Number.
- **Same-day duplicate check-in prevention** enforced at the database level (`gymId + memberId + date` unique constraint).
- **Retention Alert**: Identifies active members who have not visited the gym in the last 7+ days with 1-click WhatsApp motivation link.

### 6. Trainers & Member Assignments
- Trainer profiles with specializations, contact details, and monthly salary arrangements.
- Member-to-trainer assignments.

### 7. Expenses & Financial Reconciliation
- Categorized operational outflows: Rent, Electricity (TNEB), Trainer Salaries, Equipment & Repairs, Supplements, Cleaning Supplies.
- Net Operating Balance reconciliation: `Gross Collections - Refunds - Expenses`.
- Separate cash flow vs accrued uncollected dues.
- Exportable audit report in CSV.

### 8. Configurable Gym Settings
- Configurable for any gym in Tamil Nadu: Gym name, contact number, address, GSTIN, receipt prefix, currency (`INR ₹`), timezone (`Asia/Kolkata`).
- Customizable WhatsApp renewal template with dynamic `{name}`, `{gym}`, `{expiryDate}` tags.
- User and role access management.

---

## 💻 Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
The project is configured with zero-setup SQLite for immediate local execution and PostgreSQL for production:
```bash
cp .env.example .env
```

### 3. Database Sync & Seed
```bash
# Push Prisma schema to local database
npm run db:push

# Seed default gym, users, plans, members, and expenses
npm run db:seed
```

### 4. Run Automated Test Suite
```bash
npm test
```

### 5. Start Development Server
```bash
npm run dev
# Open http://localhost:3000 in your browser
```

---

## 🚢 Production Deployment to Vercel with PostgreSQL

### 1. Provision a PostgreSQL Database
Deploy a database using **Neon**, **Supabase**, **Railway**, or **Vercel Postgres**.

### 2. Set Production Environment Variables
In your Vercel Project Settings &gt; Environment Variables:
```env
DATABASE_URL="postgresql://username:password@ep-host.aws.neon.tech/gym_erp?sslmode=require"
JWT_SECRET="generate-a-strong-random-production-secret-key"
NEXT_PUBLIC_APP_NAME="PowerFit Gym ERP"
```

### 3. Build & Deploy
The `npm run build` command automatically triggers:
```bash
prisma generate && next build
```

To run initial seed in production PostgreSQL:
```bash
npx prisma db push --schema prisma/schema.postgresql.prisma
node prisma/seed.js
```

---

## 🔒 Security & Tenant Isolation

- Every table contains a mandatory `gymId` foreign key for strict tenant isolation.
- Sensitive financial transactions (refunds, settings updates, user accounts) require the `OWNER_ADMIN` role.
- All password hashes are managed with `bcryptjs` (salt rounds: 10).
- Session authentication is stored in secure HTTP-only cookies (`gym_auth_token`).
