import React from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Clock,
  AlertCircle,
  CreditCard,
  AlertTriangle,
  CalendarCheck,
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  MessageCircle,
  RefreshCw,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { requireAuth } from '@/lib/auth';
import { getDashboardData } from '@/lib/dashboard-data';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { formatINR, formatDate, getWhatsAppReminderUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await requireAuth();
  const data = await getDashboardData(session.gymId);

  const kpis = [
    {
      title: 'Active Members',
      value: data.kpis.totalActiveMembers,
      subtext: 'In good standing',
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200/60',
      href: '/members?status=ACTIVE',
    },
    {
      title: 'New This Month',
      value: data.kpis.newMembersThisMonth,
      subtext: 'Registered this month',
      icon: UserPlus,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200/60',
      href: '/members',
    },
    {
      title: 'Expiring Soon (<= 7d)',
      value: data.kpis.expiringSoonMembers,
      subtext: 'Action required',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200/60',
      href: '/members?status=EXPIRING_SOON',
      urgent: data.kpis.expiringSoonMembers > 0,
    },
    {
      title: 'Expired Members',
      value: data.kpis.expiredMembers,
      subtext: 'Needs follow-up',
      icon: AlertCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50 border-rose-200/60',
      href: '/members?status=EXPIRED',
    },
    {
      title: 'Fees Collected (Month)',
      value: formatINR(data.kpis.feesCollectedThisMonth),
      subtext: 'Actual cash & UPI received',
      icon: CreditCard,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200/60',
      href: '/fees',
    },
    {
      title: 'Pending Membership Fees',
      value: formatINR(data.kpis.pendingMembershipFees),
      subtext: 'Uncollected balance',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200/60',
      href: '/fees?status=PENDING',
    },
    {
      title: "Today's Attendance",
      value: data.kpis.todayAttendance,
      subtext: 'Check-ins today',
      icon: CalendarCheck,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-200/60',
      href: '/attendance',
    },
    {
      title: 'Monthly Expenses',
      value: formatINR(data.kpis.monthlyExpenses),
      subtext: 'Rent, power, salaries, supplies',
      icon: Receipt,
      color: 'text-rose-600',
      bg: 'bg-rose-50 border-rose-200/60',
      href: '/expenses',
    },
    {
      title: 'Net Operating Balance',
      value: formatINR(data.kpis.monthlyNetBalance),
      subtext: data.kpis.monthlyNetBalance >= 0 ? 'Surplus this month' : 'Deficit this month',
      icon: data.kpis.monthlyNetBalance >= 0 ? TrendingUp : TrendingDown,
      color: data.kpis.monthlyNetBalance >= 0 ? 'text-emerald-700' : 'text-rose-700',
      bg: data.kpis.monthlyNetBalance >= 0 ? 'bg-emerald-50/80 border-emerald-300' : 'bg-rose-50/80 border-rose-300',
      href: '/reports',
    },
  ];

  return (
    <AppShell userSession={session} notifications={data.notifications}>
      <div className="space-y-8">
        {/* Top Banner / Welcome & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-blue-400/20">
              {session.gymName}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {session.name}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Live gym overview: members, revenue, dues, and operational metrics for Tamil Nadu.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/members?action=new">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold gap-1.5 shadow-md">
                <UserPlus className="h-4 w-4" />
                <span>+ Add Member</span>
              </Button>
            </Link>
            <Link href="/fees?action=record">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 shadow-md">
                <CreditCard className="h-4 w-4" />
                <span>+ Record Fee</span>
              </Button>
            </Link>
            <Link href="/attendance">
              <Button size="sm" variant="outline" className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700 gap-1.5">
                <CalendarCheck className="h-4 w-4 text-indigo-400" />
                <span>Mark Attendance</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 9 Summary KPI Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Operations & Financial Summary
            </h3>
            <span className="text-xs text-slate-500 font-medium">Calculated in real-time</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <Link key={idx} href={kpi.href}>
                  <Card className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border ${kpi.bg}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-600 tracking-wide">
                            {kpi.title}
                          </p>
                          <h4 className={`text-2xl font-extrabold mt-1 tracking-tight ${kpi.color}`}>
                            {kpi.value}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1 font-medium">
                            {kpi.subtext}
                          </p>
                        </div>
                        <div className={`p-2.5 rounded-xl bg-white shadow-sm border border-slate-200/60 ${kpi.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Visual Charts */}
        <DashboardCharts
          monthlyTrends={data.monthlyTrends}
          statusDistribution={data.statusDistribution}
        />

        {/* Bottom Split Section: Expiring Members & Recent Fee Collections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Memberships Expiring Soon Alert Box */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>Memberships Expiring Soon (7 Days)</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Send pre-filled WhatsApp renewal notices</p>
              </div>
              <Link href="/members?status=EXPIRING_SOON" className="text-xs font-semibold text-blue-600 hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {data.expiringMembersList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No memberships expiring in the next 7 days.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.expiringMembersList.map((member) => {
                    const latestMem = member.memberships[0];
                    const waUrl = getWhatsAppReminderUrl({
                      mobile: member.mobile,
                      memberName: member.fullName,
                      expiryDate: latestMem?.expiryDate,
                      gymName: session.gymName,
                    });

                    return (
                      <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{member.fullName}</span>
                            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {member.memberCode}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Plan: <span className="font-medium text-slate-700">{latestMem?.plan?.name || 'Standard'}</span> • Expires:{' '}
                            <span className="font-semibold text-amber-700">{formatDate(latestMem?.expiryDate)}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition-colors"
                            title="Open WhatsApp chat with pre-filled renewal notice"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>

                          <Link href={`/members/${member.id}?action=renew`}>
                            <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs gap-1 border-slate-300">
                              <RefreshCw className="h-3 w-3 text-blue-600" />
                              <span>Renew</span>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments Stream */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  <span>Recent Fee Collections</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Live receipt transaction log</p>
              </div>
              <Link href="/fees" className="text-xs font-semibold text-blue-600 hover:underline">
                View all fees
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {data.recentPayments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No payment transactions recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.recentPayments.map((payment) => (
                    <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{payment.member.fullName}</span>
                          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                            {payment.receiptNumber}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Method: <span className="font-medium text-slate-700">{payment.paymentMethod}</span> • Date:{' '}
                          <span>{formatDate(payment.paymentDate)}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-extrabold text-emerald-600 block">
                          +{formatINR(payment.amount)}
                        </span>
                        <Link
                          href={`/fees/receipt/${payment.id}`}
                          className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Receipt</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
