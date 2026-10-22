'use client';

import React from 'react';
import Link from 'next/link';
import { Printer, ArrowLeft, Dumbbell, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatINR, formatDate } from '@/lib/utils';

export function ReceiptViewClient({ payment }: { payment: any }) {
  const { gym, member, invoice } = payment;
  const planName = invoice?.membership?.plan?.name || 'General Membership';

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex flex-col items-center justify-center">
      {/* Action Bar (Hidden on print) */}
      <div className="w-full max-w-2xl mb-4 flex items-center justify-between no-print">
        <Link
          href="/fees"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Fee Collection</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save as PDF</span>
          </Button>
        </div>
      </div>

      {/* Printable Receipt Paper */}
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 print-card text-slate-900">
        {/* Gym Header */}
        <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Dumbbell className="h-7 w-7 -rotate-12" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                {gym.name}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {gym.address}, {gym.city}, {gym.state} - {gym.pincode}
              </p>
              <p className="text-xs text-slate-500">
                Contact: <span className="font-semibold text-slate-700">{gym.phone}</span> | GSTIN:{' '}
                <span className="font-mono text-slate-700">{gym.settings?.taxNumber || '33AABCP1234F1Z5'}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase rounded-full">
              Payment Receipt
            </span>
            <p className="text-xs font-mono font-bold text-slate-800 mt-2">
              #{payment.receiptNumber}
            </p>
            <p className="text-[11px] text-slate-500">{formatDate(payment.paymentDate)}</p>
          </div>
        </div>

        {/* Member and Invoice Details */}
        <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-100 text-xs">
          <div>
            <p className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Billed To</p>
            <h3 className="text-sm font-extrabold text-slate-900 mt-1">{member.fullName}</h3>
            <p className="text-slate-600 mt-0.5 font-mono">Member ID: {member.memberCode}</p>
            <p className="text-slate-600">Mobile: {member.mobile}</p>
            {member.email && <p className="text-slate-600">{member.email}</p>}
          </div>

          <div className="text-right">
            <p className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Payment Details</p>
            <p className="text-slate-700 mt-1 font-semibold">
              Mode: <span className="font-bold text-slate-900">{payment.paymentMethod}</span>
            </p>
            {payment.transactionRef && (
              <p className="text-slate-600 font-mono text-[11px] mt-0.5">
                Ref / UTR: {payment.transactionRef}
              </p>
            )}
            <p className="text-slate-600 mt-0.5">Invoice: {invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 pb-2">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Standard Fee</th>
                <th className="py-2 text-right">Discount</th>
                <th className="py-2 text-right">Net Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 font-semibold text-slate-800">
                  {planName} Subscription
                  <span className="block text-[11px] font-normal text-slate-500">
                    Validity: {formatDate(invoice.dueDate)}
                  </span>
                </td>
                <td className="py-3 text-right">{formatINR(invoice.totalAmount)}</td>
                <td className="py-3 text-right text-emerald-600">-{formatINR(invoice.discount)}</td>
                <td className="py-3 text-right font-bold text-slate-900">{formatINR(invoice.netAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Calculation Summary */}
        <div className="pt-4 border-t-2 border-slate-100 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Total Invoiced Fee:</span>
            <span className="font-semibold text-slate-800">{formatINR(invoice.netAmount)}</span>
          </div>

          <div className="flex justify-between py-2 border-y border-slate-200 bg-emerald-50/50 px-3 rounded-lg text-emerald-900">
            <span className="font-bold text-sm">Amount Received Now:</span>
            <span className="font-black text-base text-emerald-700">{formatINR(payment.amount)}</span>
          </div>

          <div className="flex justify-between text-slate-700 pt-1">
            <span>Cumulative Total Paid:</span>
            <span className="font-bold text-slate-900">{formatINR(invoice.paidAmount)}</span>
          </div>

          <div className="flex justify-between text-slate-700 font-bold">
            <span>Remaining Outstanding Balance:</span>
            <span className={invoice.balanceDue > 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-700'}>
              {formatINR(invoice.balanceDue)}
            </span>
          </div>
        </div>

        {/* Notes & Footer */}
        {payment.notes && (
          <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 italic">
            Remarks: {payment.notes}
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-slate-200 flex items-end justify-between text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">Thank you for working out with us!</p>
            <p className="text-[11px]">This is a computer-generated tax invoice & receipt.</p>
          </div>
          <div className="text-right">
            <div className="h-10 border-b border-dashed border-slate-300 w-36 mb-1" />
            <p className="font-bold text-slate-700">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
