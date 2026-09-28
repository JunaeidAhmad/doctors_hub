import React from 'react';
import { Stethoscope, X } from 'lucide-react';
import { ICON_OPTIONS, renderTaxonomyIcon } from './taxonomyIcons';

export default function CanonicalSpecialtyModal({
  isOpen,
  onClose,
  editingSpec,
  specForm,
  setSpecForm,
  canonicalList,
  onSave
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#d1d5dc] rounded-sm p-6 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#e3e5ea]">
          <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-[#094cb2]" />
            <span>{editingSpec ? 'Edit Canonical Specialty' : 'Add Canonical Specialty'}</span>
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
              English Display Name *
            </label>
            <input
              type="text"
              required
              value={specForm.name}
              onChange={e => setSpecForm({ ...specForm, name: e.target.value })}
              placeholder="e.g. Cardiology / Interventional Cardiology"
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">
                Canonical Key (English)
              </label>
              <input
                type="text"
                value={specForm.canonical_name}
                onChange={e => setSpecForm({ ...specForm, canonical_name: e.target.value })}
                placeholder="e.g. Cardiology"
                className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] text-xs font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Defaults to name if empty</span>
            </div>

            <div>
              <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">
                Bengali Name (বাংলা)
              </label>
              <input
                type="text"
                value={specForm.bn_name}
                onChange={e => setSpecForm({ ...specForm, bn_name: e.target.value })}
                placeholder="e.g. হৃদরোগ"
                className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-900 font-serif focus:outline-none focus:border-[#094cb2] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">
              Taxonomy Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ICON_OPTIONS.map(ico => (
                <button
                  type="button"
                  key={ico}
                  onClick={() => setSpecForm({ ...specForm, icon: ico })}
                  className={`p-2 rounded-sm border flex flex-col items-center gap-1 transition cursor-pointer ${
                    specForm.icon === ico 
                      ? 'border-[#094cb2] bg-[#e7ebff] text-[#094cb2] font-bold' 
                      : 'border-[#d1d5dc] bg-white text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {renderTaxonomyIcon(ico, "w-4 h-4")}
                  <span className="text-[10px] font-mono">{ico}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Umbrella Toggle */}
          <div className="p-3 bg-[#f7f6f7] border border-[#d1d5dc] rounded-sm space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(specForm.is_umbrella)}
                onChange={e => {
                  const val = e.target.checked;
                  setSpecForm(prev => ({
                    ...prev,
                    is_umbrella: val,
                    parent_ids: val ? [] : prev.parent_ids
                  }));
                }}
                className="rounded-xs border-[#d1d5dc] text-[#094cb2] focus:ring-[#094cb2] cursor-pointer"
              />
              <span className="font-label font-bold text-slate-900 text-xs">
                Top-Level Hospital Clinical Centre (Umbrella)
              </span>
            </label>
            <p className="text-[10px] text-slate-500">
              Check this if this node represents a major hospital department/centre (e.g. &quot;Cancer Care&quot;, &quot;Heart &amp; Vascular&quot;). Leave unchecked for specialist practitioner titles (e.g. &quot;Cardiologist&quot;).
            </p>
          </div>

          {/* Parent Hospital Centers (Only for non-umbrella leaves) */}
          {!specForm.is_umbrella && (
            <div>
              <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">
                Parent Hospital Clinical Centres ({specForm.parent_ids?.length || 0} Selected)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Select the hospital clinical centre(s) this specialist belongs to (supports multi-parenting):
              </p>
              <div className="max-h-36 overflow-y-auto bg-[#f7f6f7] border border-[#d1d5dc] rounded-sm p-2 space-y-1">
                {canonicalList
                  .filter(c => c.is_umbrella && (!editingSpec || c.id !== editingSpec.id))
                  .map(c => {
                    const isSelected = (specForm.parent_ids || []).includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 p-1.5 rounded-sm hover:bg-white cursor-pointer text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSpecForm(prev => {
                              const current = prev.parent_ids || [];
                              return {
                                ...prev,
                                parent_ids: isSelected
                                  ? current.filter(id => id !== c.id)
                                  : [...current, c.id]
                              };
                            });
                          }}
                          className="rounded-xs border-[#d1d5dc] text-[#094cb2] focus:ring-[#094cb2] cursor-pointer"
                        />
                        <span className="text-xs font-medium">{c.name} {c.bn_name ? `(${c.bn_name})` : ''}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-label font-bold uppercase text-[11px] mb-1">Clinical Scope &amp; Description</label>
            <textarea
              value={specForm.description}
              onChange={e => setSpecForm({ ...specForm, description: e.target.value })}
              rows={2}
              placeholder="Optional description of the specialty and clinical scope..."
              className="w-full bg-white border border-[#d1d5dc] rounded-sm px-3 py-2 text-slate-800 focus:outline-none focus:border-[#094cb2] text-xs resize-y"
            />
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
              {editingSpec ? 'Save Changes' : 'Create Canonical Specialty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
