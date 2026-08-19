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
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          icon: CheckCircle2,
          label: normalized === 'verified' ? 'Verified' : normalized === 'confirmed' ? 'Confirmed' : normalized === 'completed' ? 'Completed' : 'Active'
        };
      case 'pending':
      case 'processing':
        return {
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          icon: Clock,
          label: 'Pending'
        };
      case 'cancelled':
      case 'rejected':
      case 'inactive':
        return {
          bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
          icon: XCircle,
          label: normalized === 'cancelled' ? 'Cancelled' : normalized === 'rejected' ? 'Rejected' : 'Inactive'
        };
      case 'no_show':
      case 'noshow':
        return {
          bg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
          icon: AlertTriangle,
          label: 'No Show'
        };
      default:
        return {
          bg: 'bg-slate-700/30 border-slate-600/40 text-slate-300',
          icon: ShieldCheck,
          label: status || 'Unknown'
        };
    }
  };

  const { bg, icon: Icon, label } = getStyle();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold tracking-wide ${bg} ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="capitalize">{label}</span>
    </span>
  );
}
