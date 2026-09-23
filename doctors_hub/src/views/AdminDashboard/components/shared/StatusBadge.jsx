import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function StatusBadge({ status, type = 'status', className = '' }) {
  const normalized = String(status || '').toLowerCase().trim();

  const getStyle = () => {
    switch (normalized) {
      case 'confirmed':
      case 'verified':
      case 'active':
      case 'completed':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          icon: CheckCircle2,
          label: normalized === 'verified' ? 'Verified' : normalized === 'confirmed' ? 'Confirmed' : normalized === 'completed' ? 'Completed' : 'Active'
        };
      case 'pending':
      case 'processing':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          icon: Clock,
          label: 'Pending'
        };
      case 'cancelled':
      case 'rejected':
      case 'inactive':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          icon: XCircle,
          label: normalized === 'cancelled' ? 'Cancelled' : normalized === 'rejected' ? 'Rejected' : 'Inactive'
        };
      case 'no_show':
      case 'noshow':
        return {
          bg: 'bg-purple-50 border-purple-200 text-purple-800',
          icon: AlertTriangle,
          label: 'No Show'
        };
      default:
        return {
          bg: 'bg-[#f0eeef] border-[#d1d5dc] text-slate-700',
          icon: ShieldCheck,
          label: status || 'Standard'
        };
    }
  };

  const { bg, icon: Icon, label } = getStyle();

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border font-label text-[10px] font-semibold tracking-wider uppercase ${bg} ${className}`}>
      <Icon className="w-3 h-3 shrink-0" />
      <span>{label}</span>
    </span>
  );
}

