'use client';

import React, { useState } from 'react';
import { Dumbbell, Plus, Edit, Check, Clock, Shield, Sparkles, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatINR } from '@/lib/utils';

interface PlansClientProps {
  initialPlans: any[];
  userRole: string;
}

export function PlansClient({ initialPlans, userRole }: PlansClientProps) {
  const [plans, setPlans] = useState(initialPlans);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    durationDays: 30,
    price: 1500,
    description: '',
    isActive: true,
  });

  function openCreateModal() {
    setEditingPlan(null);
    setFormData({
      name: '',
      durationDays: 30,
      price: 1500,
      description: '',
      isActive: true,
    });
    setErrorMessage('');
    setIsModalOpen(true);
  }

  function openEditModal(plan: any) {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      durationDays: plan.durationDays,
      price: plan.price,
      description: plan.description || '',
      isActive: plan.isActive,
    });
    setErrorMessage('');
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const url = editingPlan ? `/api/plans/${editingPlan.id}` : '/api/plans';
      const method = editingPlan ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to save plan');
        setIsSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error');
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(plan: any) {
    try {
      const res = await fetch(`/api/plans/${plan.id}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      alert('Network error');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Membership Plans & Pricing
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure flexible subscription tiers, durations, and pricing in INR (₹)
          </p>
        </div>

        {userRole === 'OWNER_ADMIN' && (
          <Button
            size="sm"
            onClick={openCreateModal}
            className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>+ Create New Plan</span>
          </Button>
        )}
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isAnnual = plan.durationDays >= 365;
          const isQuarterly = plan.durationDays === 90;

          return (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg border flex flex-col justify-between ${
                !plan.isActive
                  ? 'opacity-60 bg-slate-50 border-slate-200'
                  : isAnnual
                  ? 'border-indigo-400 bg-gradient-to-b from-indigo-50/40 to-white'
                  : 'border-slate-200'
              }`}
            >
              {isAnnual && plan.isActive && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl shadow-sm tracking-wider">
                  Best Value
                </div>
              )}

              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      {plan.durationDays} Days ({Math.round(plan.durationDays / 30)} Month
                      {plan.durationDays > 30 ? 's' : ''})
                    </span>
                    {!plan.isActive && (
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-xl font-extrabold text-slate-900 mt-1">
                    {plan.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {formatINR(plan.price)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ term</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                    {plan.description || 'Full access to weight room, cardio section, and general gym equipment.'}
                  </p>

                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{plan.durationDays} days continuous validity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{plan._count?.memberships || 0} active & past subscribers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Automated expiry alerts (7d, 3d, 1d)</span>
                    </div>
                  </div>
                </CardContent>
              </div>

              {userRole === 'OWNER_ADMIN' && (
                <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <button
                    onClick={() => handleToggleActive(plan)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    {plan.isActive ? 'Deactivate' : 'Reactivate'}
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(plan)}
                    className="h-8 text-xs gap-1 border-slate-300"
                  >
                    <Edit className="h-3.5 w-3.5 text-blue-600" />
                    <span>Edit Plan</span>
                  </Button>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>

      {/* Plan Modal (Create / Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Edit Membership Plan' : 'Create New Membership Plan'}
        description="Set tier name, standard validity in days, and fee structure"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Input
            label="Plan Name *"
            required
            placeholder="e.g. Quarterly Fitness Standard"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duration in Days *"
              type="number"
              required
              min={1}
              value={formData.durationDays}
              onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value, 10) })}
            />
            <Input
              label="Standard Fee (₹ INR) *"
              type="number"
              required
              min={0}
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value, 10) })}
            />
          </div>

          <Textarea
            label="Plan Description & Perks"
            placeholder="e.g. Includes cardio equipment, free weights, personal workout chart"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActiveCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Active plan (available for new member enrollments)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
