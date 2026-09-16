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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-400" />
            <span>{editingSpec ? 'Edit Canonical Specialty' : 'Add Canonical Specialty'}</span>
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
              English Display Name *
            </label>
            <input
              type="text"
              required
              value={specForm.name}
              onChange={e => setSpecForm({ ...specForm, name: e.target.value })}
              placeholder="e.g. Cardiology / Interventional Cardiology"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Canonical Key (English)
              </label>
              <input
                type="text"
                value={specForm.canonical_name}
                onChange={e => setSpecForm({ ...specForm, canonical_name: e.target.value })}
                placeholder="e.g. Cardiology"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Defaults to name if empty</span>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Bengali Name (বাংলা)
              </label>
              <input
                type="text"
                value={specForm.bn_name}
                onChange={e => setSpecForm({ ...specForm, bn_name: e.target.value })}
                placeholder="e.g. হৃদরোগ"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-bengali focus:outline-none focus:border-teal-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ICON_OPTIONS.map(ico => (
                <button
                  type="button"
                  key={ico}
                  onClick={() => setSpecForm({ ...specForm, icon: ico })}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                    specForm.icon === ico 
                      ? 'border-teal-500 bg-teal-500/10 text-teal-300' 
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {renderTaxonomyIcon(ico, "w-4 h-4")}
                  <span className="text-[10px]">{ico}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Compound Subspecialties Covered (Components)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              If this is a compound specialty (e.g., "Medicine, Allergy & Chest"), select the canonical specialties it includes so two-tier search ranks them accurately:
            </p>
            <div className="max-h-36 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-2 space-y-1">
              {canonicalList
                .filter(c => !editingSpec || c.id !== editingSpec.id)
                .map(c => {
                  const isSelected = specForm.component_ids.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSpecForm(prev => ({
                            ...prev,
                            component_ids: isSelected
                              ? prev.component_ids.filter(id => id !== c.id)
                              : [...prev.component_ids, c.id]
                          }));
                        }}
                        className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-teal-500 cursor-pointer"
                      />
                      <span className="text-xs">{c.name} {c.bn_name ? `(${c.bn_name})` : ''}</span>
                    </label>
                  );
                })}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Description</label>
            <textarea
              value={specForm.description}
              onChange={e => setSpecForm({ ...specForm, description: e.target.value })}
              rows={2}
              placeholder="Optional description of the specialty and clinical scope..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
            />
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
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition shadow-lg shadow-teal-600/20 cursor-pointer"
            >
              {editingSpec ? 'Save Changes' : 'Create Canonical Specialty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
