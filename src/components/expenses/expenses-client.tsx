'use client';

import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Filter,
  CreditCard,
  Building2,
  Zap,
  Wrench,
  Users,
  Sparkles,
  ShoppingBag,
  MoreHorizontal,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatINR, formatDate } from '@/lib/utils';

interface ExpensesClientProps {
  initialExpenses: any[];
}

export function ExpensesClient({ initialExpenses }: ExpensesClientProps) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    category: 'RENT',
    description: '',
    amount: 0,
    paymentMethod: 'UPI',
    referenceNumber: '',
    expenseDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const categories = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'RENT', label: 'Rent', icon: Building2 },
    { id: 'ELECTRICITY', label: 'Electricity (TNEB)', icon: Zap },
    { id: 'TRAINER_SALARY', label: 'Trainer Salary', icon: Users },
    { id: 'EQUIPMENT', label: 'Equipment & Repairs', icon: Wrench },
    { id: 'CLEANING', label: 'Cleaning & Supplies', icon: Sparkles },
    { id: 'SUPPLEMENTS', label: 'Supplements Inventory', icon: ShoppingBag },
    { id: 'MAINTENANCE', label: 'Maintenance', icon: Wrench },
    { id: 'OTHER', label: 'Other', icon: MoreHorizontal },
  ];

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to record expense');
        setIsSubmitting(false);
        return;
      }

      setIsAddModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error');
      setIsSubmitting(false);
    }
  }

  const filteredExpenses = expenses.filter((e) => {
    const matchesCategory = selectedCategory === 'ALL' || e.category === selectedCategory;
    const matchesSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Gym Operational Expenses
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Log overheads, utilities, trainer salaries, maintenance, and commercial premises costs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a href="/api/expenses/export" download>
            <Button variant="outline" size="sm" className="gap-1.5 border-slate-300 text-slate-700">
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          </a>
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-md shadow-rose-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>+ Record Expense</span>
          </Button>
        </div>
      </div>

      {/* Total Spent Banner */}
      <Card className="border-rose-200 bg-gradient-to-r from-rose-50/70 to-orange-50/40 shadow-sm">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Total Recorded Operational Outflow
            </p>
            <h3 className="text-3xl font-black text-rose-700 mt-1">{formatINR(totalExpense)}</h3>
            <p className="text-xs text-rose-600 mt-1">
              Includes rent, electricity bills, trainer payouts, and equipment maintenance
            </p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-rose-200 shadow-sm">
            <Receipt className="h-8 w-8 text-rose-600" />
          </div>
        </CardContent>
      </Card>

      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCategory === c.id
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-rose-500 shadow-sm"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Reference #</th>
                <th className="py-3.5 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{formatDate(exp.expenseDate)}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-slate-100 text-slate-800 border border-slate-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs">{exp.description}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{exp.paymentMethod}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{exp.referenceNumber || '-'}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 text-sm">
                      -{formatINR(exp.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Gym Expense"
        description="Log an operational payment voucher with receipt/reference number"
      >
        <form onSubmit={handleAddExpense} className="space-y-3">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Expense Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-rose-500"
            >
              <option value="RENT">Rent (Gym Premises)</option>
              <option value="ELECTRICITY">Electricity (TNEB Bill)</option>
              <option value="TRAINER_SALARY">Trainer Salary Payout</option>
              <option value="EQUIPMENT">Equipment Purchase & Repair</option>
              <option value="CLEANING">Cleaning & Sanitization Supplies</option>
              <option value="SUPPLEMENTS">Supplements Restock</option>
              <option value="MAINTENANCE">General Facility Maintenance</option>
              <option value="OTHER">Other Operational Expense</option>
            </select>
          </div>

          <Input
            label="Description *"
            required
            placeholder="e.g. TNEB Commercial Electricity bill for October"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount (₹ INR) *"
              type="number"
              required
              min={1}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value, 10) })}
            />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-rose-500"
              >
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Payment Date *"
              type="date"
              required
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
            />
            <Input
              label="Reference / Bill / UTR #"
              placeholder="e.g. UTR889922"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
            />
          </div>

          <Textarea
            label="Notes (Optional)"
            placeholder="Additional remarks or vendor name"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-rose-600 hover:bg-rose-500 text-white font-semibold">
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
