import React from 'react';
import { Tag, X } from 'lucide-react';

export default function SpecialtyAliasModal({
  isOpen,
  onClose,
  editingAlias,
  aliasForm,
  setAliasForm,
  canonicalList,
  onSave
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-400" />
            <span>{editingAlias ? 'Edit Alias' : 'Add New Alias to Synonym Ring'}</span>
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Raw Alias / Variation Name *
            </label>
            <input
              type="text"
              required
              value={aliasForm.name}
              onChange={e => setAliasForm({ ...aliasForm, name: e.target.value })}
              placeholder="e.g. কার্ডিওলজি or Heart Specialist"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Will be automatically normalized and indexed for instant matching.
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Target Canonical Specialty *
            </label>
            <select
              required
              value={aliasForm.specialty}
              onChange={e => setAliasForm({ ...aliasForm, specialty: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
            >
              <option value="" disabled>Select Canonical Target</option>
              {canonicalList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.bn_name ? `(${s.bn_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Language</label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="radio"
                  name="lang"
                  value="bn"
                  checked={aliasForm.language === 'bn'}
                  onChange={e => setAliasForm({ ...aliasForm, language: e.target.value })}
                  className="text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Bengali (বাংলা)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="radio"
                  name="lang"
                  value="en"
                  checked={aliasForm.language === 'en'}
                  onChange={e => setAliasForm({ ...aliasForm, language: e.target.value })}
                  className="text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <span>English</span>
              </label>
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={aliasForm.is_verified}
                onChange={e => setAliasForm({ ...aliasForm, is_verified: e.target.checked })}
                className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="font-bold">Verified (Live in search dropdowns)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              {editingAlias ? 'Save Changes' : 'Add to Ring'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
