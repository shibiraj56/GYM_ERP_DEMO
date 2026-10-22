'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  CreditCard,
  Receipt,
  Scale,
  Calendar,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatINR, formatDate } from '@/lib/utils';

interface ReportsClientProps {
  summary: {
    grossCollections: number;
    totalRefunds: number;
    netIncome: number;
    totalExpenses: number;
    netOperatingBalance: number;
    totalOutstandingDues: number;
    partialPaymentsCount: number;
    paymentMethodBreakdown: Record<string, number>;
    expenseCategoryBreakdown: Record<string, number>;
  };
  recentPayments: any[];
  recentExpenses: any[];
  gymName: string;
}

export function ReportsClient({
  summary,
  recentPayments,
  recentExpenses,
  gymName,
}: ReportsClientProps) {
  const [dateRange, setDateRange] = useState('ALL');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial Statements & Audit Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cash flow reconciliation, income versus expenses, and net operating balance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a href="/api/reports/financial/export" download>
            <Button variant="outline" size="sm" className="gap-1.5 border-slate-300 text-slate-700">
              <Download className="h-4 w-4" />
              <span>Export Audit CSV</span>
            </Button>
          </a>
          <Button
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* Main Financial Balance Sheet Card */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Executive Financial Position • {gymName}
            </span>
            <h3 className="text-3xl font-black mt-1">
              Net Operating Balance: {formatINR(summary.netOperatingBalance)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Actual cash collected minus refunds and recorded operational expenses
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase ${
                summary.netOperatingBalance >= 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {summary.netOperatingBalance >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4" /> Surplus Balance
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4" /> Operating Deficit
                </>
              )}
            </span>
          </div>
        </div>

        {/* 4 Pillars Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-xs">
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Gross Collections</span>
            <h4 className="text-xl font-bold text-emerald-400 mt-0.5">
              +{formatINR(summary.grossCollections)}
            </h4>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Refunds Issued</span>
            <h4 className="text-xl font-bold text-amber-400 mt-0.5">
              -{formatINR(summary.totalRefunds)}
            </h4>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Operational Expenses</span>
            <h4 className="text-xl font-bold text-rose-400 mt-0.5">
              -{formatINR(summary.totalExpenses)}
            </h4>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Uncollected Dues</span>
            <h4 className="text-xl font-bold text-sky-400 mt-0.5">
              {formatINR(summary.totalOutstandingDues)}
            </h4>
          </div>
        </div>
      </div>

      {/* Two Detailed Analysis Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Channels Breakdown */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Collection Channels (Cash Flow)</span>
              <span className="text-xs text-slate-500 font-normal">By Payment Method</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {Object.entries(summary.paymentMethodBreakdown).map(([method, amount]) => {
              const pct = summary.grossCollections > 0 ? Math.round((amount / summary.grossCollections) * 100) : 0;
              return (
                <div key={method} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{method}</span>
                    <span className="text-slate-900">{formatINR(amount)} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Expenses by Category Breakdown */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Operational Expense Breakdown</span>
              <span className="text-xs text-slate-500 font-normal">By Cost Center</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {Object.entries(summary.expenseCategoryBreakdown).map(([cat, amount]) => {
              const pct = summary.totalExpenses > 0 ? Math.round((amount / summary.totalExpenses) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{cat}</span>
                    <span className="text-rose-600">-{formatINR(amount)} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Audit Reconciliation Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">
            Recent Certified Transactions & Receipts
          </CardTitle>
          <p className="text-xs text-slate-500">Every rupee reconciled against database records</p>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Entity / Beneficiary</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4 text-right">Net Flow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-700">{formatDate(p.paymentDate)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                      Fee Receipt #{p.receiptNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{p.member.fullName}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{p.paymentMethod} {p.transactionRef ? `(${p.transactionRef})` : ''}</td>
                  <td className="py-3 px-4 text-right font-extrabold text-emerald-600">+{formatINR(p.amount)}</td>
                </tr>
              ))}
              {recentExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-700">{formatDate(e.expenseDate)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-800">
                      Expense: {e.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{e.description}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{e.paymentMethod} {e.referenceNumber ? `(${e.referenceNumber})` : ''}</td>
                  <td className="py-3 px-4 text-right font-extrabold text-rose-600">-{formatINR(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
