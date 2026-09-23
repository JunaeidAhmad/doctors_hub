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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#d1d5dc] rounded-sm p-6 max-w-md w-full space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#e3e5ea]">
          <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#094cb2]" />
            <span>{editingAlias ? 'Edit Alias' : 'Add New Alias to Synonym Ring'}</span>
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 text-xs font-body">
          <div>
            <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">
              Raw Alias / Variation Name *
            </label>
            <input
              type="text"
              required
              value={aliasForm.name}
              onChange={e => setAliasForm({ ...aliasForm, name: e.target.value })}
              placeholder="e.g. কার্ডিওলজি or Heart Specialist"
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] text-xs"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Will be automatically normalized and indexed for instant matching.
            </span>
          </div>

          <div>
            <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">
              Target Canonical Specialty *
            </label>
            <select
              required
              value={aliasForm.specialty}
              onChange={e => setAliasForm({ ...aliasForm, specialty: e.target.value })}
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] text-xs cursor-pointer font-semibold"
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
            <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Language</label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="lang"
                  value="bn"
                  checked={aliasForm.language === 'bn'}
                  onChange={e => setAliasForm({ ...aliasForm, language: e.target.value })}
                  className="text-[#094cb2] focus:ring-[#094cb2] cursor-pointer"
                />
                <span>Bengali (বাংলা)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="lang"
                  value="en"
                  checked={aliasForm.language === 'en'}
                  onChange={e => setAliasForm({ ...aliasForm, language: e.target.value })}
                  className="text-[#094cb2] focus:ring-[#094cb2] cursor-pointer"
                />
                <span>English</span>
              </label>
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={aliasForm.is_verified}
                onChange={e => setAliasForm({ ...aliasForm, is_verified: e.target.checked })}
                className="rounded-xs border-[#d1d5dc] text-[#094cb2] focus:ring-[#094cb2] cursor-pointer"
              />
              <span className="font-semibold">Verified Live (Appears in public search auto-suggest)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#e3e5ea]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#d1d5dc] bg-white hover:bg-[#f7f6f7] text-slate-700 font-label text-xs font-semibold uppercase tracking-wider rounded-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#094cb2] hover:bg-[#083e91] text-white font-label text-xs font-semibold uppercase tracking-wider rounded-sm transition shadow-sm cursor-pointer"
            >
              {editingAlias ? 'Save Changes' : 'Add to Ring'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
