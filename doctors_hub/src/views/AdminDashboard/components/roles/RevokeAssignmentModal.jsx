import React from 'react';
import { ShieldAlert, RefreshCw, Trash2 } from 'lucide-react';

export default function RevokeAssignmentModal({
  revokingAssignment,
  revokeLoading,
  onClose,
  onConfirm
}) {
  if (!revokingAssignment) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#d1d5dc] rounded-sm max-w-md w-full shadow-elevated p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xs bg-rose-50 border border-rose-200 text-rose-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-serif font-bold text-[#1b1c1d]">Revoke Role Assignment?</h3>
            <p className="text-[11px] text-slate-500 font-body">This will remove the user's granted operational permissions.</p>
          </div>
        </div>

        <div className="p-3 bg-[#faf9fa] rounded-xs border border-[#e3e5ea] text-xs font-body space-y-1">
          <div className="text-slate-700">
            <span className="text-slate-500 font-label">User:</span> <strong className="text-slate-900">{revokingAssignment.user_details?.phone_number || revokingAssignment.user}</strong>
          </div>
          <div className="text-slate-700">
            <span className="text-slate-500 font-label">Role:</span> <strong className="text-[#094cb2]">{revokingAssignment.role_details?.name}</strong>
          </div>
          {revokingAssignment.facility_details && (
            <div className="text-slate-700">
              <span className="text-slate-500 font-label">Facility:</span> <strong className="text-slate-900">{revokingAssignment.facility_details.name}</strong>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1 border-t border-[#d1d5dc]">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 rounded-sm font-label font-semibold text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={revokeLoading}
            className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-sm font-label font-semibold text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {revokeLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>Confirm Revoke</span>
          </button>
        </div>
      </div>
    </div>
  );
}
