import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-slate-900 text-white hover:bg-slate-800',
        secondary: 'border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200',
        destructive: 'border-transparent bg-rose-500 text-white',
        outline: 'text-slate-800 border-slate-300',
        success: 'border-transparent bg-emerald-100 text-emerald-800 font-medium',
        warning: 'border-transparent bg-amber-100 text-amber-800 font-medium',
        danger: 'border-transparent bg-rose-100 text-rose-800 font-medium',
        info: 'border-transparent bg-sky-100 text-sky-800 font-medium',
        purple: 'border-transparent bg-purple-100 text-purple-800 font-medium',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  status?: string;
}

function StatusBadge({ status, className }: { status: string; className?: string }) {
  const norm = status?.toUpperCase() || '';
  if (norm === 'ACTIVE' || norm === 'PAID') {
    return <Badge variant="success" className={className}>Active / Paid</Badge>;
  }
  if (norm === 'EXPIRING_SOON') {
    return <Badge variant="warning" className={className}>Expiring Soon</Badge>;
  }
  if (norm === 'EXPIRED') {
    return <Badge variant="danger" className={className}>Expired</Badge>;
  }
  if (norm === 'OVERDUE') {
    return <Badge variant="danger" className={className}>Overdue</Badge>;
  }
  if (norm === 'PARTIAL' || norm === 'PARTIALLY_PAID') {
    return <Badge variant="warning" className={className}>Partially Paid</Badge>;
  }
  if (norm === 'PENDING') {
    return <Badge variant="secondary" className={className}>Pending</Badge>;
  }
  if (norm === 'FROZEN') {
    return <Badge variant="info" className={className}>Frozen</Badge>;
  }
  if (norm === 'CANCELLED') {
    return <Badge variant="destructive" className={className}>Cancelled</Badge>;
  }
  return <Badge variant="secondary" className={className}>{status}</Badge>;
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, StatusBadge, badgeVariants };
