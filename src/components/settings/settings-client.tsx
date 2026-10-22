'use client';

import React, { useState } from 'react';
import {
  Settings,
  Building,
  Receipt,
  MessageSquare,
  Users,
  Database,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldCheck,
  Server,
  Cloud,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

interface SettingsClientProps {
  gym: any;
  users: any[];
}

export function SettingsClient({ gym, users }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'whatsapp' | 'users' | 'database'>('profile');

  const [gymData, setGymData] = useState({
    name: gym.name,
    phone: gym.phone || '',
    email: gym.email || '',
    address: gym.address || '',
    city: gym.city || 'Coimbatore',
    state: gym.state || 'Tamil Nadu',
    pincode: gym.pincode || '',
    receiptPrefix: gym.settings?.receiptPrefix || 'REC-',
    taxNumber: gym.settings?.taxNumber || '',
    whatsappTemplate:
      gym.settings?.whatsappTemplate ||
      'Hi {name}, your gym membership at {gym} is expiring on {expiryDate}. Please contact us to renew your membership. Thank you!',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // User creation modal
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'RECEPTIONIST',
    phone: '',
  });

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gymData),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to save settings');
        setIsSaving(false);
        return;
      }

      setSaveSuccess(true);
      setIsSaving(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error');
      setIsSaving(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to create user');
        return;
      }

      setIsAddUserModalOpen(false);
      window.location.reload();
    } catch (err) {
      alert('Network error');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Gym Configuration & Business Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure business profile, receipt numbering, reminders, user security, and database connections
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto scrollbar-none">
        {[
          { id: 'profile', label: 'Gym Profile & Location', icon: Building },
          { id: 'billing', label: 'Billing & Receipt Counter', icon: Receipt },
          { id: 'whatsapp', label: 'WhatsApp Reminders', icon: MessageSquare },
          { id: 'users', label: 'Staff & Role Access', icon: Users },
          { id: 'database', label: 'PostgreSQL & Vercel Deployment', icon: Database },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Gym settings successfully updated and saved to database!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-100 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 1: PROFILE */}
      {activeTab === 'profile' && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">
              Gym Center Identification
            </CardTitle>
            <p className="text-xs text-slate-500">
              Displayed on payment receipts, member profiles, and tax documents
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
              <Input
                label="Gym / Fitness Studio Name *"
                required
                value={gymData.name}
                onChange={(e) => setGymData({ ...gymData, name: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Contact Mobile / Phone *"
                  required
                  value={gymData.phone}
                  onChange={(e) => setGymData({ ...gymData, phone: e.target.value })}
                />
                <Input
                  label="Official Email Address"
                  type="email"
                  value={gymData.email}
                  onChange={(e) => setGymData({ ...gymData, email: e.target.value })}
                />
              </div>

              <Input
                label="Physical Address / Street"
                value={gymData.address}
                onChange={(e) => setGymData({ ...gymData, address: e.target.value })}
              />

              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="City"
                  value={gymData.city}
                  onChange={(e) => setGymData({ ...gymData, city: e.target.value })}
                />
                <Input
                  label="State"
                  value={gymData.state}
                  onChange={(e) => setGymData({ ...gymData, state: e.target.value })}
                />
                <Input
                  label="Pincode"
                  value={gymData.pincode}
                  onChange={(e) => setGymData({ ...gymData, pincode: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button type="submit" isLoading={isSaving} className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                  <Save className="h-4 w-4" />
                  <span>Save Profile</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: BILLING & RECEIPT COUNTER */}
      {activeTab === 'billing' && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">
              Receipt Numbering & Currency Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Receipt Number Prefix"
                  value={gymData.receiptPrefix}
                  onChange={(e) => setGymData({ ...gymData, receiptPrefix: e.target.value })}
                  placeholder="e.g. PF-REC-"
                />
                <Input
                  label="GSTIN Number (Optional)"
                  value={gymData.taxNumber}
                  onChange={(e) => setGymData({ ...gymData, taxNumber: e.target.value })}
                  placeholder="e.g. 33AABCP1234F1Z5"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">Configured Currency:</span>
                  <span className="font-extrabold text-blue-600">INR (₹ Indian Rupee)</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">Operating Time Zone:</span>
                  <span className="font-extrabold text-blue-600">Asia/Kolkata (IST +05:30)</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">Next Sequential Receipt Number:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {gym.settings?.receiptPrefix || 'REC-'}
                    {gym.settings?.nextReceiptNumber || 1001}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button type="submit" isLoading={isSaving} className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                  <Save className="h-4 w-4" />
                  <span>Update Billing Settings</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: WHATSAPP REMINDER */}
      {activeTab === 'whatsapp' && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">
              WhatsApp Renewal Alert Template
            </CardTitle>
            <p className="text-xs text-slate-500">
              Placeholders: <span className="font-mono text-blue-600">{'{name}'}</span>,{' '}
              <span className="font-mono text-blue-600">{'{gym}'}</span>,{' '}
              <span className="font-mono text-blue-600">{'{expiryDate}'}</span>
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
              <Textarea
                label="Message Template"
                rows={4}
                value={gymData.whatsappTemplate}
                onChange={(e) => setGymData({ ...gymData, whatsappTemplate: e.target.value })}
              />

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
                <span className="font-bold block mb-1">Live Preview Sample:</span>
                <p className="italic">
                  &ldquo;
                  {gymData.whatsappTemplate
                    .replace('{name}', 'Vignesh')
                    .replace('{gym}', gymData.name)
                    .replace('{expiryDate}', '28 Oct 2026')}
                  &rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button type="submit" isLoading={isSaving} className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                  <Save className="h-4 w-4" />
                  <span>Save Template</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                System User Accounts & Role Permissions
              </h3>
              <p className="text-xs text-slate-500">
                Owners, Front Desk Receptionists, and Gym Trainers
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsAddUserModalOpen(true)}
              className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add User</span>
            </Button>
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4 font-semibold">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* TAB 5: DATABASE & VERCEL DEPLOYMENT GUIDANCE */}
      {activeTab === 'database' && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-900 text-white rounded-t-xl">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-base font-bold text-white">
                PostgreSQL & Vercel Deployment Architecture
              </CardTitle>
            </div>
            <p className="text-xs text-slate-300">
              Clear, production-ready configuration guide for zero-downtime deployment
            </p>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-xs text-slate-700 leading-relaxed">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
              <span className="font-extrabold text-blue-900 text-sm block">
                Current Database Engine: SQLite (Local Development) / PostgreSQL Compatible
              </span>
              <p className="text-blue-800">
                The application models in <span className="font-mono">prisma/schema.prisma</span> are fully normalized and 100% portable to any PostgreSQL instance (Neon, Supabase, Railway, Vercel Postgres, or AWS RDS).
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-sm text-slate-900">Step 1: Set PostgreSQL Connection String</h4>
              <p>In your production environment variables (e.g. Vercel Project Settings &gt; Environment Variables):</p>
              <pre className="p-3 bg-slate-950 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto">
                DATABASE_URL=&quot;postgresql://username:password@ep-host.ap-southeast-1.aws.neon.tech/gym_erp?sslmode=require&quot;
              </pre>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-sm text-slate-900">Step 2: Database Migration on Deployment</h4>
              <p>During the build step on Vercel, Prisma automatically generates the client and applies migrations:</p>
              <pre className="p-3 bg-slate-950 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto">
                npm run build (executes: prisma generate &amp;&amp; next build)
              </pre>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-sm text-slate-900">Step 3: Initial Seed for PostgreSQL</h4>
              <p>To populate default plans, Tamil Nadu gym details, and test users in your new PostgreSQL database:</p>
              <pre className="p-3 bg-slate-950 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto">
                npx prisma db push --schema prisma/schema.postgresql.prisma
                node prisma/seed.js
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Create Team Member Login"
        description="Grant Owner, Receptionist, or Trainer dashboard access"
      >
        <form onSubmit={handleCreateUser} className="space-y-3">
          <Input
            label="Full Name *"
            required
            value={userData.name}
            onChange={(e) => setUserData({ ...userData, name: e.target.value })}
          />
          <Input
            label="Email Address *"
            type="email"
            required
            value={userData.email}
            onChange={(e) => setUserData({ ...userData, email: e.target.value })}
          />
          <Input
            label="Initial Password *"
            type="password"
            required
            value={userData.password}
            onChange={(e) => setUserData({ ...userData, password: e.target.value })}
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Role Permission *
            </label>
            <select
              value={userData.role}
              onChange={(e) => setUserData({ ...userData, role: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="RECEPTIONIST">Receptionist (Front Desk, Dues & Attendance)</option>
              <option value="TRAINER">Trainer (Attendance & Assigned Athletes)</option>
              <option value="OWNER_ADMIN">Owner / Admin (Full Financial & System Access)</option>
            </select>
          </div>
          <Input
            label="Phone Number"
            value={userData.phone}
            onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsAddUserModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
              Create User Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
