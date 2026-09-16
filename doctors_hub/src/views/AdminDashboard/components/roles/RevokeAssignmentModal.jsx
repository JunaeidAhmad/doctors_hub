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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Revoke Role Assignment?</h3>
            <p className="text-xs text-slate-400">This will remove the user's granted permissions.</p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1">
          <div className="text-slate-300">
            <span className="text-slate-500">User:</span> <strong className="text-white">{revokingAssignment.user_details?.phone_number || revokingAssignment.user}</strong>
          </div>
          <div className="text-slate-300">
            <span className="text-slate-500">Role:</span> <strong className="text-teal-300">{revokingAssignment.role_details?.name}</strong>
          </div>
          {revokingAssignment.facility_details && (
            <div className="text-slate-300">
              <span className="text-slate-500">Facility:</span> <strong className="text-slate-200">{revokingAssignment.facility_details.name}</strong>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={revokeLoading}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 disabled:opacity-50 cursor-pointer"
          >
            {revokeLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>Confirm Revoke</span>
          </button>
        </div>
      </div>
    </div>
  );
}
