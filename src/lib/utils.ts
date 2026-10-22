import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Indian Rupees format (e.g. ₹ 1,500, ₹ 1,25,000)
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Standard friendly date formatter
 */
export function formatDate(date: Date | string | null | undefined, fmt: string = 'dd MMM yyyy'): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return format(d, fmt);
}

/**
 * Time only formatter (e.g. 06:30 AM)
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return format(d, 'hh:mm a');
}

/**
 * Relative distance helper (e.g. "in 3 days", "5 days ago")
 */
export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * WhatsApp click-to-chat URL generator
 * Format: https://wa.me/91XXXXXXXXXX?text=URL_ENCODED_MESSAGE
 */
export function getWhatsAppReminderUrl(params: {
  mobile: string;
  memberName: string;
  expiryDate: Date | string;
  gymName?: string;
  customTemplate?: string | null;
}): string {
  const cleanPhone = params.mobile.replace(/[^0-9]/g, '');
  const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  
  const formattedExpiry = formatDate(params.expiryDate);
  const gym = params.gymName || 'PowerFit Gym';
  
  let text = params.customTemplate || 
    `Hi ${params.memberName}, your gym membership at ${gym} is expiring on ${formattedExpiry}. Please contact the gym to renew your membership. Thank you!`;
  
  text = text
    .replace('{name}', params.memberName)
    .replace('{gym}', gym)
    .replace('{expiryDate}', formattedExpiry);

  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
}

/**
 * Helper to determine membership status based on expiry
 */
export function calculateMembershipStatus(expiryDate: Date | string, currentStatus?: string): string {
  if (currentStatus === 'FROZEN') return 'FROZEN';
  if (currentStatus === 'CANCELLED') return 'CANCELLED';

  const exp = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const now = new Date();
  
  if (isBefore(exp, now)) {
    return 'EXPIRED';
  }
  
  const in7Days = addDays(now, 7);
  if (isBefore(exp, in7Days)) {
    return 'EXPIRING_SOON';
  }

  return 'ACTIVE';
}
