'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  Search,
  UserPlus,
  Download,
  Filter,
  Eye,
  MessageCircle,
  Calendar,
  Phone,
  Clock,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatDate, formatINR, getWhatsAppReminderUrl } from '@/lib/utils';

interface MemberListClientProps {
  initialMembers: any[];
  plans: any[];
  gymName: string;
  totalCount: number;
}

export function MemberListClient({
  initialMembers,
  plans,
  gymName,
  totalCount,
}: MemberListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [members, setMembers] = useState(initialMembers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(searchParams.get('action') === 'new');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Add Member Form State
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    gender: 'Male',
    dateOfBirth: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    joiningDate: new Date().toISOString().split('T')[0],
    planId: plans[0]?.id || '',
    startDate: new Date().toISOString().split('T')[0],
    discount: 0,
    initialPaymentAmount: plans[0]?.price || 0,
    paymentMethod: 'UPI',
    notes: '',
  });

  // Calculate selected plan pricing
  const selectedPlan = plans.find((p) => p.id === formData.planId) || plans[0];
  const finalPrice = Math.max(0, (selectedPlan?.price || 0) - Number(formData.discount || 0));

  function handlePlanChange(planId: string) {
    const pl = plans.find((p) => p.id === planId);
    setFormData((prev) => ({
      ...prev,
      planId,
      initialPaymentAmount: Math.max(0, (pl?.price || 0) - Number(prev.discount || 0)),
    }));
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to register member');
        setIsSubmitting(false);
        return;
      }

      setIsAddModalOpen(false);
      router.refresh();
      // Reset form
      setFormData({
        fullName: '',
        mobile: '',
        email: '',
        gender: 'Male',
        dateOfBirth: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        joiningDate: new Date().toISOString().split('T')[0],
        planId: plans[0]?.id || '',
        startDate: new Date().toISOString().split('T')[0],
        discount: 0,
        initialPaymentAmount: plans[0]?.price || 0,
        paymentMethod: 'UPI',
        notes: '',
      });
      // reload
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error');
      setIsSubmitting(false);
    }
  }

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.memberCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.mobile.includes(searchTerm);

    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = [
    { label: 'All Members', value: 'ALL', count: totalCount },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Expiring Soon', value: 'EXPIRING_SOON' },
    { label: 'Expired', value: 'EXPIRED' },
    { label: 'Frozen', value: 'FROZEN' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Member Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Directory of registered gym athletes, subscriptions, and active profiles
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a href="/api/members/export" download>
            <Button variant="outline" size="sm" className="gap-1.5 border-slate-300 text-slate-700">
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          </a>
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Add New Member</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === s.value
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID (MEM-...), or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Members Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Mobile & Contact</th>
                <th className="py-3.5 px-4">Current Plan</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No members found matching your search filters.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const activeMembership = member.memberships[0];
                  const waUrl = getWhatsAppReminderUrl({
                    mobile: member.mobile,
                    memberName: member.fullName,
                    expiryDate: activeMembership?.expiryDate,
                    gymName,
                  });

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200 shrink-0">
                            {member.fullName.charAt(0)}
                          </div>
                          <div>
                            <Link
                              href={`/members/${member.id}`}
                              className="font-bold text-slate-900 hover:text-blue-600 transition-colors block leading-tight"
                            >
                              {member.fullName}
                            </Link>
                            <span className="font-mono text-xs text-slate-500">
                              {member.memberCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          <div className="flex items-center gap-1 font-medium text-slate-700">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{member.mobile}</span>
                          </div>
                          {member.email && (
                            <span className="text-slate-400 text-[11px] block mt-0.5 truncate max-w-[150px]">
                              {member.email}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 text-xs">
                          {activeMembership?.plan?.name || 'Standard'}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Joined {formatDate(member.joiningDate)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-xs text-slate-800 block">
                          {formatDate(activeMembership?.expiryDate)}
                        </span>
                        {member.status === 'EXPIRING_SOON' && (
                          <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> Expiring Soon
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={member.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {member.status === 'EXPIRING_SOON' && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Send WhatsApp renewal alert"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          )}
                          <Link href={`/members/${member.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-600">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
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

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Gym Member"
        description="Enroll member, set up membership plan, and log initial payment transaction"
        maxWidth="2xl"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Member Personal Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              1. Personal Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Full Name *"
                required
                placeholder="e.g. S. Vignesh"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
              <Input
                label="Mobile Number (10 digits) *"
                required
                placeholder="e.g. 9842100000"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
              <Input
                label="Email Address (Optional)"
                type="email"
                placeholder="vignesh@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Membership Plan */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              2. Membership Subscription
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Select Plan *
                </label>
                <select
                  value={formData.planId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.durationDays} days) - {formatINR(p.price)}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Start Date *"
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <Input
                label="Discount (₹ INR)"
                type="number"
                placeholder="0"
                value={formData.discount}
                onChange={(e) => {
                  const disc = Number(e.target.value);
                  setFormData({
                    ...formData,
                    discount: disc,
                    initialPaymentAmount: Math.max(0, (selectedPlan?.price || 0) - disc),
                  });
                }}
              />
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col justify-center">
                <span className="text-slate-500">Calculated Net Amount</span>
                <span className="text-base font-extrabold text-blue-600 mt-0.5">
                  {formatINR(finalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Fee Payment Collection */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              3. Initial Payment Collection
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Payment Amount Received (₹)"
                type="number"
                value={formData.initialPaymentAmount}
                onChange={(e) =>
                  setFormData({ ...formData, initialPaymentAmount: Number(e.target.value) })
                }
              />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS)</option>
                </select>
              </div>
            </div>
            {finalPrice - Number(formData.initialPaymentAmount) > 0 && (
              <p className="text-xs text-amber-600 font-medium mt-2">
                ⚠️ Balance of {formatINR(finalPrice - Number(formData.initialPaymentAmount))} will be tracked as outstanding dues.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              Register & Save Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
