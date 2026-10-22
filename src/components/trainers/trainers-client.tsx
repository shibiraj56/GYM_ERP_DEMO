'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Plus,
  Phone,
  Mail,
  Award,
  Users,
  Calendar,
  AlertCircle,
  Dumbbell,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatINR, formatDate } from '@/lib/utils';

interface TrainersClientProps {
  initialTrainers: any[];
  allActiveMembers: any[];
  userRole: string;
}

export function TrainersClient({
  initialTrainers,
  allActiveMembers,
  userRole,
}: TrainersClientProps) {
  const [trainers, setTrainers] = useState(initialTrainers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    specialization: 'Strength & Conditioning',
    salary: 25000,
    paymentArrangement: 'Monthly Fixed',
    joiningDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  async function handleAddTrainer(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/trainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to add trainer');
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

  async function handleAssignMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTrainer || !selectedMemberId) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/trainers/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId: selectedTrainer.id,
          memberId: selectedMemberId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to assign trainer');
        setIsSubmitting(false);
        return;
      }

      setIsAssignModalOpen(false);
      window.location.reload();
    } catch (err) {
      alert('Network error');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Gym Trainers & Coaches
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage fitness instructors, track assigned athletes, and oversee trainer arrangements
          </p>
        </div>

        {userRole === 'OWNER_ADMIN' && (
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add New Trainer</span>
          </Button>
        )}
      </div>

      {/* Trainers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainers.map((trainer) => (
          <Card key={trainer.id} className="border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {trainer.trainerCode}
                  </span>
                  <CardTitle className="text-base font-extrabold text-slate-900 mt-2">
                    {trainer.fullName}
                  </CardTitle>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Award className="h-3.5 w-3.5 text-amber-500" />
                    <span>{trainer.specialization}</span>
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                  {trainer.fullName.charAt(0)}
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800">{trainer.mobile}</span>
                </div>
                {trainer.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{trainer.email}</span>
                  </div>
                )}
                {userRole === 'OWNER_ADMIN' && trainer.salary && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 font-medium">Monthly Compensation</span>
                    <span className="font-bold text-slate-900">{formatINR(trainer.salary)}</span>
                  </div>
                )}

                {/* Assigned Members List */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                      Assigned Athletes ({trainer.assignments.length})
                    </span>
                  </div>
                  {trainer.assignments.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No members currently assigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {trainer.assignments.map((as: any) => (
                        <span
                          key={as.id}
                          className="px-2 py-1 rounded-md bg-slate-100 text-slate-800 font-medium text-[11px] border border-slate-200"
                        >
                          {as.member.fullName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </div>

            <CardFooter className="pt-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedTrainer(trainer);
                  setSelectedMemberId(allActiveMembers[0]?.id || '');
                  setIsAssignModalOpen(true);
                }}
                className="text-xs h-8 gap-1.5 border-slate-300 font-semibold"
              >
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span>Assign Athlete</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Add Trainer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Fitness Trainer"
        description="Register a new gym trainer and configure specialization"
      >
        <form onSubmit={handleAddTrainer} className="space-y-3">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
              {errorMessage}
            </div>
          )}

          <Input
            label="Full Name *"
            required
            placeholder="e.g. Karthik Raja"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Mobile Number *"
              required
              placeholder="e.g. 9842100000"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              placeholder="karthik@gym.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <Input
            label="Specialization *"
            required
            placeholder="e.g. Strength & Conditioning, CrossFit, Bodybuilding"
            value={formData.specialization}
            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Monthly Salary (₹ INR)"
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value, 10) })}
            />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Arrangement
              </label>
              <select
                value={formData.paymentArrangement}
                onChange={(e) => setFormData({ ...formData, paymentArrangement: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="Monthly Fixed">Monthly Fixed</option>
                <option value="Fixed + Commission">Fixed + Commission</option>
                <option value="Per Session">Per Session</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
              Save Trainer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Member Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Athlete to ${selectedTrainer?.fullName}`}
        description="Select a member to pair with this fitness trainer"
      >
        <form onSubmit={handleAssignMember} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Select Gym Member *
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-blue-500"
              required
            >
              {allActiveMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.memberCode} - {m.mobile})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
