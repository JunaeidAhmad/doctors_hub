import React, { useState, useEffect } from 'react';
import { 
  Building2, FlaskConical, MapPin, Phone, Mail, Clock, 
  CheckCircle2, Star, Save, RefreshCw, Layers, Image as ImageIcon,
  Activity, ShieldCheck, Tag, Sparkles
} from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { api } from '../../../../services/api';
import { 
  PageHeader, SectionCard, EditableField, Toggle, 
  StatusBadge, Skeleton 
} from '../shared';

export default function FacilityProfile({ kind = 'hospital' }) {
  const isHospital = kind === 'hospital';
  const {
    hospitals = [],
    diagnosticCenters = [],
    hospitalCategories = [],
    diagnosticCategories = [],
    hospitalServices = [],
    diagnosticServices = [],
    loadAllData,
    showNotification
  } = useAdminContext();

  const facility = isHospital ? hospitals[0] : diagnosticCenters[0];
  const categories = isHospital ? hospitalCategories : diagnosticCategories;
  const availableServices = isHospital ? hospitalServices : diagnosticServices;

  const [savingSection, setSavingSection] = useState(null);
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    tagline: '',
    badge: '',
    description: '',
    division: 'Dhaka',
    district: 'Dhaka',
    area: '',
    address_line: '',
    phone: '',
    email: '',
    open_timing: '',
    category_id: '',
    service_ids: [],
    logo: '',
    image: '',
    has_diagnostic_center: false,
    is_verified: true,
    rating: 4.8,
    reviews_count: 0,
  });

  useEffect(() => {
    if (facility) {
      const loc = facility.location_details || facility;
      setFormData({
        name: loc.name || facility.name || '',
        branch: loc.branch || facility.branch || 'Main Branch',
        tagline: loc.tagline || facility.tagline || '',
        badge: loc.badge || facility.badge || (isHospital ? 'Hospital' : 'Diagnostic Center'),
        description: loc.description || facility.description || '',
        division: loc.division || facility.division || 'Dhaka',
        district: loc.district || facility.district || 'Dhaka',
        area: loc.area || facility.area || '',
        address_line: loc.address_line || loc.address || facility.address_line || facility.address || '',
        phone: loc.phone || facility.phone || '',
        email: loc.email || facility.email || '',
        open_timing: loc.open_timing || facility.open_timing || '24/7 Service',
        category_id: facility.category?.id || facility.category_id || facility.category || categories[0]?.id || '',
        service_ids: (facility.services || []).map(s => (typeof s === 'object' ? s.id : s)),
        logo: loc.logo || facility.logo || '',
        image: loc.image || facility.image || '',
        has_diagnostic_center: Boolean(facility.has_diagnostic_center),
        is_verified: Boolean(loc.is_verified ?? facility.is_verified ?? true),
        rating: loc.rating ?? facility.rating ?? 4.8,
        reviews_count: loc.reviews_count ?? facility.reviews_count ?? 120,
      });
    }
  }, [facility, categories, isHospital]);

  const handleSaveSection = async (sectionName, payload) => {
    if (!facility?.id) return;
    setSavingSection(sectionName);
    try {
      if (isHospital) {
        await api.patchHospital(facility.id, payload);
      } else {
        await api.patchDiagnosticCenter(facility.id, payload);
      }
      showNotification(`${sectionName} updated successfully!`);
      await loadAllData();
    } catch (err) {
      alert(`Error updating ${sectionName}: ${err.message}`);
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveAll = async (e) => {
    e?.preventDefault();
    if (!facility?.id) return;
    setIsSavingAll(true);
    try {
      const payload = {
        name: formData.name,
        branch: formData.branch,
        tagline: formData.tagline,
        badge: formData.badge,
        description: formData.description,
        division: formData.division,
        district: formData.district,
        area: formData.area,
        address_line: formData.address_line,
        phone: formData.phone,
        email: formData.email,
        open_timing: formData.open_timing,
        category_id: formData.category_id || null,
        service_ids: formData.service_ids,
        logo: formData.logo,
        image: formData.image,
      };
      if (isHospital) {
        payload.has_diagnostic_center = formData.has_diagnostic_center;
        await api.patchHospital(facility.id, payload);
      } else {
        await api.patchDiagnosticCenter(facility.id, payload);
      }
      showNotification('Facility profile updated successfully!');
      await loadAllData();
    } catch (err) {
      alert(`Error saving facility profile: ${err.message}`);
    } finally {
      setIsSavingAll(false);
    }
  };

  const toggleService = (srvId) => {
    const next = formData.service_ids.includes(srvId)
      ? formData.service_ids.filter(id => id !== srvId)
      : [...formData.service_ids, srvId];
    setFormData({ ...formData, service_ids: next });
  };

  if (!facility) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={isHospital ? 'Hospital Profile' : 'Diagnostic Center Profile'}
          description="Manage your facility details, contact hours, and clinical services."
          icon={isHospital ? Building2 : FlaskConical}
        />
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-72 mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const primaryColor = isHospital ? 'emerald' : 'cyan';

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageHeader
        title={formData.name || (isHospital ? 'Hospital Profile' : 'Diagnostic Center Profile')}
        description={`Manage and update official public information for ${formData.branch || 'your branch'}.`}
        icon={isHospital ? Building2 : FlaskConical}
        badge={isHospital ? 'Hospital Admin' : 'Diagnostic Admin'}
        actionButton={
          <button
            onClick={handleSaveAll}
            disabled={isSavingAll}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition active:scale-95 cursor-pointer ${
              isHospital 
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' 
                : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20'
            }`}
          >
            {isSavingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All Changes</span>
          </button>
        }
      />

      {/* FACILITY HERO CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        <div className="w-24 h-24 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
          {formData.logo ? (
            <img src={formData.logo} alt={formData.name} className="w-full h-full object-cover" />
          ) : (
            isHospital ? <Building2 className="w-10 h-10 text-emerald-400" /> : <FlaskConical className="w-10 h-10 text-cyan-400" />
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h2 className="text-xl font-black text-white">{formData.name || 'Your Facility'}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
              {formData.branch || 'Main Branch'}
            </span>
            <StatusBadge status={formData.is_verified ? 'verified' : 'pending'} />
          </div>

          {formData.tagline && (
            <p className="text-xs text-slate-400 italic">{formData.tagline}</p>
          )}

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>{formData.area ? `${formData.area}, ` : ''}{formData.district || 'Dhaka'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{formData.open_timing || '24/7'}</span>
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{formData.rating} ({formData.reviews_count} reviews)</span>
            </span>
          </div>
        </div>
      </div>

      {/* EDITABLE SECTIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. IDENTITY & BRANDING */}
        <SectionCard
          title="Facility Identity"
          description="General naming, branch identification, and public tagline."
          icon={Tag}
          color={primaryColor}
          actions={
            <button
              onClick={() => handleSaveSection('Identity', {
                name: formData.name,
                branch: formData.branch,
                tagline: formData.tagline,
                badge: formData.badge,
                description: formData.description
              })}
              disabled={savingSection === 'Identity'}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              {savingSection === 'Identity' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-teal-400" />}
              <span>Save</span>
            </button>
          }
        >
          <div className="space-y-4">
            <EditableField
              label="Facility Full Name"
              required
              value={formData.name}
              onChange={val => setFormData({ ...formData, name: val })}
              placeholder="e.g. Bangladesh Specialized Hospital"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <EditableField
                label="Branch / Unit Name"
                required
                value={formData.branch}
                onChange={val => setFormData({ ...formData, branch: val })}
                placeholder="e.g. Dhanmondi Unit"
              />
              <EditableField
                label="Badge Title"
                value={formData.badge}
                onChange={val => setFormData({ ...formData, badge: val })}
                placeholder="e.g. Hospital / Diagnostic"
              />
            </div>
            <EditableField
              label="Tagline / Motto"
              value={formData.tagline}
              onChange={val => setFormData({ ...formData, tagline: val })}
              placeholder="e.g. Care with modern excellence"
            />
            <EditableField
              type="textarea"
              rows={3}
              label="Description / About Facility"
              value={formData.description}
              onChange={val => setFormData({ ...formData, description: val })}
              placeholder="Brief summary of your clinical services, bed capacity, ICU availability..."
            />
          </div>
        </SectionCard>

        {/* 2. LOCATION & ADDRESS */}
        <SectionCard
          title="Location & Address"
          description="Geographic details for patient navigation and search filtering."
          icon={MapPin}
          color={primaryColor}
          actions={
            <button
              onClick={() => handleSaveSection('Location', {
                division: formData.division,
                district: formData.district,
                area: formData.area,
                address_line: formData.address_line
              })}
              disabled={savingSection === 'Location'}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              {savingSection === 'Location' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-teal-400" />}
              <span>Save</span>
            </button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <EditableField
                label="Division"
                value={formData.division}
                onChange={val => setFormData({ ...formData, division: val })}
                placeholder="Dhaka"
              />
              <EditableField
                label="District"
                value={formData.district}
                onChange={val => setFormData({ ...formData, district: val })}
                placeholder="Dhaka"
              />
              <EditableField
                label="Thana / Area"
                value={formData.area}
                onChange={val => setFormData({ ...formData, area: val })}
                placeholder="e.g. Dhanmondi"
              />
            </div>
            <EditableField
              label="Full Street Address"
              required
              value={formData.address_line}
              onChange={val => setFormData({ ...formData, address_line: val })}
              placeholder="e.g. 21 Mirpur Road, Shyamoli, Dhaka-1207"
            />
          </div>
        </SectionCard>

        {/* 3. CONTACT & WORKING HOURS */}
        <SectionCard
          title="Contact & Hours"
          description="Helpline numbers, inquiries email, and operating schedule."
          icon={Phone}
          color={primaryColor}
          actions={
            <button
              onClick={() => handleSaveSection('Contact', {
                phone: formData.phone,
                email: formData.email,
                open_timing: formData.open_timing
              })}
              disabled={savingSection === 'Contact'}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              {savingSection === 'Contact' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-teal-400" />}
              <span>Save</span>
            </button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <EditableField
                label="Helpline / Contact Phone"
                value={formData.phone}
                onChange={val => setFormData({ ...formData, phone: val })}
                placeholder="e.g. 10633 or 01700000000"
              />
              <EditableField
                type="email"
                label="Official Email"
                value={formData.email}
                onChange={val => setFormData({ ...formData, email: val })}
                placeholder="info@facility.com"
              />
            </div>
            <EditableField
              label="Open Timing / Operating Hours"
              value={formData.open_timing}
              onChange={val => setFormData({ ...formData, open_timing: val })}
              placeholder="e.g. 24/7 Emergency & OPD (8:00 AM - 10:00 PM)"
            />
          </div>
        </SectionCard>

        {/* 4. CLASSIFICATION & SERVICES */}
        <SectionCard
          title="Classification & Facilities"
          description="Primary facility tier and multi-select clinical amenities."
          icon={Activity}
          color={primaryColor}
          actions={
            <button
              onClick={() => handleSaveSection('Classification', {
                category_id: formData.category_id || null,
                service_ids: formData.service_ids
              })}
              disabled={savingSection === 'Classification'}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              {savingSection === 'Classification' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-teal-400" />}
              <span>Save</span>
            </button>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Primary Category
              </label>
              <select
                value={formData.category_id}
                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-teal-500"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Available Services & Departments (Click to toggle)
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-44 overflow-y-auto">
                {availableServices.map(srv => {
                  const isSelected = formData.service_ids.includes(srv.id);
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => toggleService(srv.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isSelected 
                          ? isHospital 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                      <span>{srv.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 5. MEDIA ASSETS */}
        <SectionCard
          title="Media & Visual Assets"
          description="Facility logo and banner cover photography."
          icon={ImageIcon}
          color={primaryColor}
          actions={
            <button
              onClick={() => {
                const fd = new FormData();
                if (formData.logo instanceof File) fd.append('logo', formData.logo);
                if (formData.image instanceof File) fd.append('image', formData.image);
                
                // Only send if files were actually changed
                if ([...fd.keys()].length > 0) {
                  handleSaveSection('Media', fd);
                } else {
                  showNotification('No new files selected to upload.');
                }
              }}
              disabled={savingSection === 'Media'}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              {savingSection === 'Media' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-teal-400" />}
              <span>Upload</span>
            </button>
          }
        >
          <div className="space-y-4">
            <EditableField
              type="file"
              label="Logo Image (New File)"
              onChange={val => setFormData({ ...formData, logo: val })}
              helpText={typeof formData.logo === 'string' && formData.logo ? `Current logo: ${formData.logo.split('/').pop()}` : ''}
            />
            <EditableField
              type="file"
              label="Cover Banner (New File)"
              onChange={val => setFormData({ ...formData, image: val })}
              helpText={typeof formData.image === 'string' && formData.image ? `Current cover: ${formData.image.split('/').pop()}` : ''}
            />
            {(formData.image && typeof formData.image === 'string') && (
              <div className="mt-2 rounded-xl overflow-hidden border border-slate-800 max-h-36">
                <img src={formData.image} alt="Banner Preview" className="w-full h-full object-cover" />
              </div>
            )}
            {(formData.logo && typeof formData.logo === 'string') && (
              <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden border border-slate-800 bg-white">
                <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
        </SectionCard>

        {/* 6. CAPABILITIES & LAB SETTINGS (HOSPITAL ONLY) */}
        {isHospital && (
          <SectionCard
            title="Diagnostic Center & Lab Capability"
            description="Control whether this hospital operates an in-house diagnostic laboratory."
            icon={FlaskConical}
            color="emerald"
            actions={
              <button
                onClick={() => handleSaveSection('Capabilities', {
                  has_diagnostic_center: formData.has_diagnostic_center
                })}
                disabled={savingSection === 'Capabilities'}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                {savingSection === 'Capabilities' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-teal-400" />}
                <span>Save</span>
              </button>
            }
          >
            <div className="space-y-4">
              <Toggle
                id="hospital_lab_toggle"
                checked={formData.has_diagnostic_center}
                onChange={val => setFormData({ ...formData, has_diagnostic_center: val })}
                color="emerald"
                label="Has Internal Diagnostic Lab"
                description="When enabled, your admin sidebar reveals 'Offered Tests', 'Add Tests to Facility', and 'Lab Bookings' tabs."
              />
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400">
                {formData.has_diagnostic_center ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Lab features are active for this hospital.
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Lab features are disabled. Enable this to publish diagnostic tests and manage sample collections.
                  </span>
                )}
              </div>
            </div>
          </SectionCard>
        )}

      </div>
    </div>
  );
}
