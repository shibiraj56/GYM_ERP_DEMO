'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  CreditCard,
  Clock,
  CheckCircle2,
  Receipt,
  MessageCircle,
  Edit,
  Trash2,
  ArrowLeft,
  RefreshCw,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatDate, formatINR, formatTime, getWhatsAppReminderUrl } from '@/lib/utils';

interface MemberProfileProps {
  member: any;
  plans: any[];
  gymName: string;
}

export function MemberProfileClient({ member, plans, gymName }: MemberProfileProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'attendance' | 'renewals'>('overview');

  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPayDueModalOpen, setIsPayDueModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Renewal form state
  const activeMembership = member.memberships[0];
  const defaultRenewalStart = activeMembership?.expiryDate
    ? new Date(activeMembership.expiryDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const [renewalData, setRenewalData] = useState({
    planId: activeMembership?.planId || plans[0]?.id || '',
    startDate: defaultRenewalStart,
    discount: 0,
    paidAmount: plans[0]?.price || 0,
    paymentMethod: 'UPI',
    notes: 'Membership renewal',
  });

  // Edit form state
  const [editData, setEditData] = useState({
    fullName: member.fullName,
    mobile: member.mobile,
    email: member.email || '',
    gender: member.gender || 'Male',
    dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '',
    address: member.address || '',
    emergencyContactName: member.emergencyContactName || '',
    emergencyContactPhone: member.emergencyContactPhone || '',
    status: member.status,
    notes: member.notes || '',
  });

  // Pay due balance state
  const [duePaymentAmount, setDuePaymentAmount] = useState(0);
  const [duePaymentMethod, setDuePaymentMethod] = useState('UPI');

  const renewalPlan = plans.find((p) => p.id === renewalData.planId) || plans[0];
  const renewalFinalPrice = Math.max(0, (renewalPlan?.price || 0) - Number(renewalData.discount || 0));

  async function handleRenewal(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/memberships/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          ...renewalData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to renew');
        setIsSubmitting(false);
        return;
      }

      setIsRenewModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error');
      setIsSubmitting(false);
    }
  }

  async function handleEditMember(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to update member');
        setIsSubmitting(false);
        return;
      }

      setIsEditModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error');
      setIsSubmitting(false);
    }
  }

  async function handleArchiveMember() {
    if (!confirm('Are you sure you want to archive this member?')) return;
    try {
      const res = await fetch(`/api/members/${member.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/members');
      }
    } catch (err) {
      alert('Error archiving member');
    }
  }

  async function handlePayDue(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInvoice) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          memberId: member.id,
          amount: duePaymentAmount,
          paymentMethod: duePaymentMethod,
          notes: 'Settlement of outstanding balance',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to record payment');
        setIsSubmitting(false);
        return;
      }

      setIsPayDueModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Network error');
      setIsSubmitting(false);
    }
  }

  async function handleMarkTodayAttendance() {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not mark attendance');
        return;
      }
      alert('Attendance recorded for today!');
      window.location.reload();
    } catch (err) {
      alert('Network error');
    }
  }

  const waUrl = getWhatsAppReminderUrl({
    mobile: member.mobile,
    memberName: member.fullName,
    expiryDate: activeMembership?.expiryDate,
    gymName,
  });

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/members"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Member Directory</span>
        </Link>
      </div>

      {/* Member Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="h-16 sm:h-20 w-16 sm:w-20 rounded-2xl bg-blue-600 text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
              {member.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {member.fullName}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {member.memberCode}
                </span>
                <StatusBadge status={member.status} />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2 font-medium">
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {member.mobile}
                </span>
                {member.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {member.email}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Joined {formatDate(member.joiningDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp Alert</span>
            </a>
            <Button
              size="sm"
              onClick={() => setIsRenewModalOpen(true)}
              className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Renew Membership</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkTodayAttendance}
              className="gap-1.5 border-slate-300 text-slate-700 rounded-xl text-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
              <span>Check-in Today</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              className="h-9 w-9 p-0 border-slate-300 text-slate-600 rounded-xl"
              title="Edit Profile"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleArchiveMember}
              className="h-9 w-9 p-0 border-slate-300 text-rose-600 hover:bg-rose-50 rounded-xl"
              title="Archive Member"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex gap-2 mt-8 pt-4 border-t border-slate-100 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: 'Overview & Details' },
            { id: 'invoices', label: `Invoices & Payments (${member.invoices.length})` },
            { id: 'attendance', label: `Attendance Log (${member.attendances.length})` },
            { id: 'renewals', label: `Membership History (${member.memberships.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Gender</span>
                <span className="font-semibold text-slate-800">{member.gender || 'Not specified'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Date of Birth</span>
                <span className="font-semibold text-slate-800">{formatDate(member.dateOfBirth)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Mobile Number</span>
                <span className="font-semibold text-slate-800">{member.mobile}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Email Address</span>
                <span className="font-semibold text-slate-800">{member.email || '-'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Residential Address</span>
                <span className="font-semibold text-slate-800 text-right max-w-xs">{member.address || '-'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">Emergency & Trainer Support</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Emergency Contact Name</span>
                <span className="font-semibold text-slate-800">{member.emergencyContactName || '-'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Emergency Contact Phone</span>
                <span className="font-semibold text-slate-800">{member.emergencyContactPhone || '-'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Assigned Fitness Trainer</span>
                <span className="font-semibold text-blue-600">
                  {member.trainerAssignments[0]?.trainer?.fullName || 'No trainer assigned'}
                </span>
              </div>
              <div className="py-2">
                <span className="text-slate-500 font-medium block mb-1">Notes / Health Remarks</span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 italic border border-slate-200">
                  {member.notes || 'No notes added for this member.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: INVOICES & PAYMENTS */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">Billing Invoices</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Paid Amount</th>
                    <th className="py-3 px-4">Balance Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {member.invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4">{formatDate(inv.dueDate)}</td>
                      <td className="py-3 px-4 font-semibold">{formatINR(inv.netAmount)}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">{formatINR(inv.paidAmount)}</td>
                      <td className="py-3 px-4 font-bold text-rose-600">{formatINR(inv.balanceDue)}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {inv.balanceDue > 0 && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setDuePaymentAmount(inv.balanceDue);
                              setIsPayDueModalOpen(true);
                            }}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            Pay Due
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Payment Transactions & Receipts */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">Payment Transactions & Receipts</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Reference UTR</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {member.payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">{p.receiptNumber}</td>
                      <td className="py-3 px-4">{formatDate(p.paymentDate)}</td>
                      <td className="py-3 px-4 font-extrabold text-emerald-600">+{formatINR(p.amount)}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{p.paymentMethod}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.transactionRef || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/fees/receipt/${p.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Receipt</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900">Attendance Log</CardTitle>
            <span className="text-xs text-slate-500 font-semibold">
              Total Recorded Visits: {member.attendances.length}
            </span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Check-in Time</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {member.attendances.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">
                      No attendance visits recorded yet.
                    </td>
                  </tr>
                ) : (
                  member.attendances.map((att: any) => (
                    <tr key={att.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-800">{formatDate(att.date)}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{formatTime(att.checkInTime)}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Present
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: MEMBERSHIP HISTORY */}
      {activeTab === 'renewals' && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">Membership Subscriptions</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-4">Plan Name</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Base Fee</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Final Fee</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {member.memberships.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.plan.name}</td>
                    <td className="py-3 px-4">{formatDate(m.startDate)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{formatDate(m.expiryDate)}</td>
                    <td className="py-3 px-4">{formatINR(m.basePrice)}</td>
                    <td className="py-3 px-4 text-emerald-600">-{formatINR(m.discount)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatINR(m.finalPrice)}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={m.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* RENEWAL MODAL */}
      <Modal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        title={`Renew Membership for ${member.fullName}`}
        description="Preserves all historical records, extends from expiry date, and creates invoice & payment"
      >
        <form onSubmit={handleRenewal} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Select Renewal Plan *
            </label>
            <select
              value={renewalData.planId}
              onChange={(e) => {
                const pl = plans.find((p) => p.id === e.target.value);
                setRenewalData({
                  ...renewalData,
                  planId: e.target.value,
                  paidAmount: Math.max(0, (pl?.price || 0) - Number(renewalData.discount || 0)),
                });
              }}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-blue-500"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.durationDays} days) - {formatINR(p.price)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start From Date"
              type="date"
              value={renewalData.startDate}
              onChange={(e) => setRenewalData({ ...renewalData, startDate: e.target.value })}
            />
            <Input
              label="Discount (₹)"
              type="number"
              value={renewalData.discount}
              onChange={(e) => {
                const disc = Number(e.target.value);
                setRenewalData({
                  ...renewalData,
                  discount: disc,
                  paidAmount: Math.max(0, (renewalPlan?.price || 0) - disc),
                });
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Payment Received (₹)"
              type="number"
              value={renewalData.paidAmount}
              onChange={(e) =>
                setRenewalData({ ...renewalData, paidAmount: Number(e.target.value) })
              }
            />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={renewalData.paymentMethod}
                onChange={(e) => setRenewalData({ ...renewalData, paymentMethod: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-800 font-medium">
            Plan Fee: <span className="font-bold">{formatINR(renewalFinalPrice)}</span>. Paid:{' '}
            <span className="font-bold">{formatINR(renewalData.paidAmount)}</span>. Balance due:{' '}
            <span className="font-bold">{formatINR(renewalFinalPrice - Number(renewalData.paidAmount))}</span>.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsRenewModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
              Confirm Renewal
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT MEMBER MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Member Information"
      >
        <form onSubmit={handleEditMember} className="space-y-3">
          <Input
            label="Full Name"
            value={editData.fullName}
            onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
          />
          <Input
            label="Mobile Number"
            value={editData.mobile}
            onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={editData.email}
            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Membership Status
            </label>
            <select
              value={editData.status}
              onChange={(e) => setEditData({ ...editData, status: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="EXPIRING_SOON">EXPIRING_SOON</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="FROZEN">FROZEN</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <Input
            label="Address"
            value={editData.address}
            onChange={(e) => setEditData({ ...editData, address: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Emergency Contact Name"
              value={editData.emergencyContactName}
              onChange={(e) => setEditData({ ...editData, emergencyContactName: e.target.value })}
            />
            <Input
              label="Emergency Contact Phone"
              value={editData.emergencyContactPhone}
              onChange={(e) => setEditData({ ...editData, emergencyContactPhone: e.target.value })}
            />
          </div>
          <Textarea
            label="Notes"
            value={editData.notes}
            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* PAY DUE MODAL */}
      <Modal
        isOpen={isPayDueModalOpen}
        onClose={() => setIsPayDueModalOpen(false)}
        title="Record Outstanding Balance Payment"
        description={`Settling dues for invoice ${selectedInvoice?.invoiceNumber}`}
      >
        <form onSubmit={handlePayDue} className="space-y-4">
          <Input
            label="Amount to Pay (₹)"
            type="number"
            max={selectedInvoice?.balanceDue}
            value={duePaymentAmount}
            onChange={(e) => setDuePaymentAmount(Number(e.target.value))}
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Payment Method
            </label>
            <select
              value={duePaymentMethod}
              onChange={(e) => setDuePaymentMethod(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsPayDueModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
              Record Payment & Issue Receipt
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
