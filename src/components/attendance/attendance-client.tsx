'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  Clock,
  UserX,
  AlertCircle,
  Calendar,
  Sparkles,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { formatTime, formatDate, getWhatsAppReminderUrl } from '@/lib/utils';

interface AttendanceClientProps {
  initialAttendances: any[];
  todayCount: number;
  inactiveMembers: any[];
  allActiveMembers: any[];
  gymName: string;
}

export function AttendanceClient({
  initialAttendances,
  todayCount,
  inactiveMembers,
  allActiveMembers,
  gymName,
}: AttendanceClientProps) {
  const [attendances, setAttendances] = useState(initialAttendances);
  const [count, setCount] = useState(todayCount);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick lookup members for check-in dropdown/typeahead
  const candidateMembers = searchMemberQuery
    ? allActiveMembers
        .filter((m) => {
          const q = searchMemberQuery.toLowerCase();
          return (
            m.fullName.toLowerCase().includes(q) ||
            m.memberCode.toLowerCase().includes(q) ||
            m.mobile.includes(q)
          );
        })
        .slice(0, 5)
    : [];

  async function handleCheckIn(memberId: string) {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to check in' });
        setIsSubmitting(false);
        return;
      }

      setMessage({
        type: 'success',
        text: `Check-in recorded successfully for ${data.attendance.member.fullName}!`,
      });
      setSearchMemberQuery('');
      setIsSubmitting(false);

      // Refresh list
      window.location.reload();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error' });
      setIsSubmitting(false);
    }
  }

  // Filter attendance records by search
  const filteredAttendances = attendances.filter((att) => {
    return (
      att.member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.member.memberCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.member.mobile.includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Fast Attendance Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Rapid member entry verification, duplicate prevention, and workout frequency tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
            <Calendar className="h-4 w-4 text-blue-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                window.location.href = `/attendance?date=${e.target.value}`;
              }}
              className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none"
            />
          </div>
          <div className="px-3.5 py-1.5 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 text-xs font-bold">
            Today: {count} Check-ins
          </div>
        </div>
      </div>

      {/* Instant Check-In Box (Sub-second execution) */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 shadow-sm">
        <CardContent className="p-6">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900 mb-1 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span>Instant Member Check-In (Search & Mark in 2 Seconds)</span>
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              Type member code (e.g. MEM-1001), full name, or mobile number:
            </p>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Type name, phone, or 'MEM-...' to check in..."
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 shadow-sm"
              />
            </div>

            {/* Notification alert message */}
            {message && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {/* Live Autocomplete Results */}
            {candidateMembers.length > 0 && (
              <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden divide-y divide-slate-100 z-20">
                {candidateMembers.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{m.fullName}</span>
                      <span className="font-mono text-xs text-slate-500 ml-2 bg-slate-100 px-1.5 py-0.5 rounded">
                        {m.memberCode}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">{m.mobile}</span>
                    </div>
                    <Button
                      size="sm"
                      isLoading={isSubmitting}
                      onClick={() => handleCheckIn(m.id)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-8"
                    >
                      Check-In Now
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Today's Attendance Feed & Inactive Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Check-ins Log */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Check-In History for {formatDate(selectedDate)}
            </h3>
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Member ID</th>
                    <th className="py-3 px-4">Check-In Time</th>
                    <th className="py-3 px-4">Active Plan</th>
                    <th className="py-3 px-4 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendances.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No check-ins recorded for this date.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendances.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{att.member.fullName}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{att.member.memberCode}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            <Clock className="h-3 w-3 text-blue-600" />
                            {formatTime(att.checkInTime)}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {att.member.memberships[0]?.plan?.name || 'General'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/members/${att.member.id}`}
                            className="text-blue-600 hover:underline font-semibold"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Absent / Dormant Members */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-1.5">
            <UserX className="h-4 w-4 text-amber-500" />
            <span>Absent &gt; 7 Days ({inactiveMembers.length})</span>
          </h3>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="p-4 pb-2 bg-amber-50/50 border-b border-slate-100">
              <CardTitle className="text-xs font-bold text-amber-900">
                Retention Follow-up List
              </CardTitle>
              <p className="text-[11px] text-amber-700">
                Active members with no recorded check-ins this week
              </p>
            </CardHeader>
            <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto">
              {inactiveMembers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Great! All active members have attended this week.
                </div>
              ) : (
                inactiveMembers.map((m) => {
                  const waUrl = getWhatsAppReminderUrl({
                    mobile: m.mobile,
                    memberName: m.fullName,
                    expiryDate: new Date(),
                    gymName,
                    customTemplate: `Hi {name}! We noticed you have not visited ${gymName} this week. Don't break your workout streak—see you at the gym soon!`,
                  });

                  return (
                    <div key={m.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{m.fullName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{m.mobile}</p>
                        </div>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          title="Send Motivation via WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
