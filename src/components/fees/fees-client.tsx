'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Eye,
  MessageCircle,
  Calendar,
  Phone,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatINR, formatDate, getWhatsAppReminderUrl } from '@/lib/utils';
import { differenceInDays } from 'date-fns';

interface FeesClientProps {
  initialInvoices: any[];
  initialPayments: any[];
  gymName: string;
  userRole: string;
}

export function FeesClient({
  initialInvoices,
  initialPayments,
  gymName,
  userRole,
}: FeesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'pending'>(
    (searchParams.get('tab') as any) || 'invoices'
  );
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Payment Recording Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(searchParams.get('action') === 'record');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('UPI');
  const [transRef, setTransRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundTargetPayment, setRefundTargetPayment] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');

  // Aggregate summary
  const totalBilled = initialInvoices.reduce((sum, inv) => sum + inv.netAmount, 0);
  const totalCollected = initialPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = initialInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  // Invoices with pending balance for dropdown
  const pendingInvoices = initialInvoices.filter((inv) => inv.balanceDue > 0);

  function handleSelectInvoice(invId: string) {
    setSelectedInvoiceId(invId);
    const inv = initialInvoices.find((i) => i.id === invId);
    if (inv) {
      setPayAmount(inv.balanceDue);
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const selectedInv = initialInvoices.find((i) => i.id === selectedInvoiceId);
      if (!selectedInv) {
        setErrorMessage('Please select an invoice');
        setIsSubmitting(false);
        return;
      }

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          memberId: selectedInv.memberId,
          amount: payAmount,
          paymentMethod: payMethod,
          transactionRef: transRef,
          notes: payNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to record payment');
        setIsSubmitting(false);
        return;
      }

      setIsRecordModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error');
      setIsSubmitting(false);
    }
  }

  async function handleProcessRefund(e: React.FormEvent) {
    e.preventDefault();
    if (!refundTargetPayment) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/payments/${refundTargetPayment.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: refundAmount,
          reason: refundReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Refund failed');
        setIsSubmitting(false);
        return;
      }

      setIsRefundModalOpen(false);
      window.location.reload();
    } catch (err) {
      alert('Network error');
      setIsSubmitting(false);
    }
  }

  // Filtered lists
  const filteredInvoices = initialInvoices.filter((inv) => {
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesSearch =
      inv.member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.member.mobile.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const filteredPayments = initialPayments.filter((p) => {
    return (
      p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.member.mobile.includes(searchTerm)
    );
  });

  // Pending fees list with days overdue
  const pendingReport = initialInvoices
    .filter((inv) => inv.balanceDue > 0)
    .map((inv) => {
      const now = new Date();
      const due = new Date(inv.dueDate);
      const daysOverdue = Math.max(0, differenceInDays(now, due));
      return { ...inv, daysOverdue };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  return (
    <div className="space-y-6">
      {/* Top Header & Summary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Fee & Payment Collection
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage dues, track full & partial payments, issue receipts, and monitor overdue aging
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            if (pendingInvoices.length > 0) {
              handleSelectInvoice(pendingInvoices[0].id);
            }
            setIsRecordModalOpen(true);
          }}
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/20"
        >
          <CreditCard className="h-4 w-4" />
          <span>+ Record Fee Payment</span>
        </Button>
      </div>

      {/* 3 Overview Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Billed</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{formatINR(totalBilled)}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Sum of all membership invoices</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/60 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Collected</p>
            <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">{formatINR(totalCollected)}</h3>
            <p className="text-[11px] text-emerald-600 mt-0.5">Cleared via UPI, Cash & Cards</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Pending Dues</p>
            <h3 className="text-2xl font-extrabold text-amber-700 mt-1">{formatINR(totalOutstanding)}</h3>
            <p className="text-[11px] text-amber-600 mt-0.5">Uncollected fee balances</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'invoices' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Invoices & Dues ({initialInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'payments' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Payment Receipts ({initialPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'pending' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span>Overdue Aging Report ({pendingReport.length})</span>
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search member, receipt, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* TAB 1: INVOICES TABLE */}
      {activeTab === 'invoices' && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          {/* Sub-filter buttons */}
          <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex flex-wrap gap-1.5">
            {['ALL', 'PAID', 'PARTIAL', 'PENDING', 'OVERDUE'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                  statusFilter === st ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Member Name</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Net Amount</th>
                  <th className="py-3.5 px-4">Paid Amount</th>
                  <th className="py-3.5 px-4">Balance Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No invoices found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3.5 px-4">
                        <Link href={`/members/${inv.member.id}`} className="font-bold text-slate-900 hover:text-blue-600 block">
                          {inv.member.fullName}
                        </Link>
                        <span className="text-[11px] font-mono text-slate-500">{inv.member.mobile}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium">{formatDate(inv.dueDate)}</td>
                      <td className="py-3.5 px-4 font-semibold">{formatINR(inv.netAmount)}</td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-600">{formatINR(inv.paidAmount)}</td>
                      <td className="py-3.5 px-4 font-bold text-rose-600">{formatINR(inv.balanceDue)}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {inv.balanceDue > 0 ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              handleSelectInvoice(inv.id);
                              setIsRecordModalOpen(true);
                            }}
                            className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                          >
                            Collect Fee
                          </Button>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-600">Paid in Full</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: PAYMENT RECEIPTS LOG */}
      {activeTab === 'payments' && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Member Name</th>
                  <th className="py-3.5 px-4">Payment Date</th>
                  <th className="py-3.5 px-4">Amount Paid</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Reference / UTR</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{p.receiptNumber}</td>
                    <td className="py-3.5 px-4">
                      <Link href={`/members/${p.member.id}`} className="font-bold text-slate-900 hover:text-blue-600 block">
                        {p.member.fullName}
                      </Link>
                      <span className="text-[11px] text-slate-400">{p.member.mobile}</span>
                    </td>
                    <td className="py-3.5 px-4">{formatDate(p.paymentDate)}</td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-600 text-sm">+{formatINR(p.amount)}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{p.paymentMethod}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{p.transactionRef || '-'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/fees/receipt/${p.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Receipt</span>
                        </Link>
                        {userRole === 'OWNER_ADMIN' && (
                          <button
                            onClick={() => {
                              setRefundTargetPayment(p);
                              setRefundAmount(p.amount);
                              setRefundReason('');
                              setIsRefundModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                            title="Issue Refund"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: OVERDUE AGING REPORT */}
      {activeTab === 'pending' && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-amber-50/40">
            <CardTitle className="text-base font-bold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>Pending & Overdue Fees Aging Report</span>
            </CardTitle>
            <p className="text-xs text-amber-700">
              Sorted by severity of overdue days with direct WhatsApp click-to-chat links
            </p>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Member Name</th>
                  <th className="py-3.5 px-4">Mobile Number</th>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Amount Due</th>
                  <th className="py-3.5 px-4">Days Overdue</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingReport.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      All dues are fully settled! No pending invoices.
                    </td>
                  </tr>
                ) : (
                  pendingReport.map((item) => {
                    const waUrl = getWhatsAppReminderUrl({
                      mobile: item.member.mobile,
                      memberName: item.member.fullName,
                      expiryDate: item.dueDate,
                      gymName,
                      customTemplate: `Hi {name}, you have a pending membership fee of ${formatINR(
                        item.balanceDue
                      )} at ${gymName}. Please clear it at your earliest convenience. Thank you!`,
                    });

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{item.member.fullName}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{item.member.mobile}</td>
                        <td className="py-3.5 px-4 font-mono font-medium">{item.invoiceNumber}</td>
                        <td className="py-3.5 px-4">{formatDate(item.dueDate)}</td>
                        <td className="py-3.5 px-4 font-bold text-rose-600 text-sm">{formatINR(item.balanceDue)}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              item.daysOverdue > 14
                                ? 'bg-rose-100 text-rose-800'
                                : item.daysOverdue > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.daysOverdue > 0 ? `${item.daysOverdue} days overdue` : 'Due today'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>WhatsApp</span>
                            </a>
                            <Button
                              size="sm"
                              onClick={() => {
                                handleSelectInvoice(item.id);
                                setIsRecordModalOpen(true);
                              }}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              Collect Fee
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Fee Payment"
        description="Select pending member dues, enter amount, and issue official gym receipt"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Select Outstanding Invoice *
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => handleSelectInvoice(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">-- Choose Member Due --</option>
              {pendingInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.member.fullName} ({inv.invoiceNumber}) - Due: {formatINR(inv.balanceDue)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount Received (₹) *"
              type="number"
              required
              min={1}
              value={payAmount}
              onChange={(e) => setPayAmount(parseInt(e.target.value, 10))}
            />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Payment Method *
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS)</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <Input
            label="Transaction Reference / UTR Number (Optional)"
            placeholder="e.g. UPI Ref 309488172901"
            value={transRef}
            onChange={(e) => setTransRef(e.target.value)}
          />

          <Input
            label="Payment Notes (Optional)"
            placeholder="e.g. Installment settlement"
            value={payNotes}
            onChange={(e) => setPayNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Save Payment & Generate Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* REFUND MODAL */}
      <Modal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        title="Issue Authorized Refund"
        description="Reverses transaction, adjusts member ledger, and records full audit trail"
      >
        <form onSubmit={handleProcessRefund} className="space-y-4">
          <Input
            label="Refund Amount (₹) *"
            type="number"
            max={refundTargetPayment?.amount}
            value={refundAmount}
            onChange={(e) => setRefundAmount(parseInt(e.target.value, 10))}
          />
          <Input
            label="Reason for Refund *"
            required
            placeholder="e.g. Member relocated to Chennai"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsRefundModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} variant="destructive">
              Confirm Refund
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
