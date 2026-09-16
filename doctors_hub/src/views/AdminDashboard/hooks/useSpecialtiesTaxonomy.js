import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAdminContext } from '../context/AdminContext';
import { api } from '../../../services/api';

export function useSpecialtiesTaxonomy(initialTab = 'canonical') {
  const { 
    showToast, 
    loadAllData
  } = useAdminContext();

  // Active view: 'canonical' | 'aliases' | 'review-queue'
  const [subTab, setSubTab] = useState(initialTab);

  // Loading & stats states
  const [loading, setLoading] = useState(false);
  const [canonicalList, setCanonicalList] = useState([]);
  const [aliasesList, setAliasesList] = useState([]);
  const [counts, setCounts] = useState({
    total_aliases: 0,
    verified_aliases: 0,
    unverified_aliases: 0,
    canonical_specialties: 0
  });

  // Search & Filters for Canonical
  const [canonicalSearch, setCanonicalSearch] = useState('');

  // Search & Filters for Aliases
  const [aliasSearch, setAliasSearch] = useState('');
  const [aliasSpecialtyFilter, setAliasSpecialtyFilter] = useState('');
  const [aliasLangFilter, setAliasLangFilter] = useState('');
  const [aliasStatusFilter, setAliasStatusFilter] = useState('');

  // Review Queue Selection
  const [selectedReviewIds, setSelectedReviewIds] = useState([]);

  // Modals
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [editingSpec, setEditingSpec] = useState(null);
  const [specForm, setSpecForm] = useState({
    id: '',
    name: '',
    canonical_name: '',
    bn_name: '',
    icon: 'Stethoscope',
    description: '',
    component_ids: []
  });

  const [showAliasModal, setShowAliasModal] = useState(false);
  const [editingAlias, setEditingAlias] = useState(null);
  const [aliasForm, setAliasForm] = useState({
    id: '',
    name: '',
    specialty: '',
    language: 'bn',
    is_verified: true
  });

  // Fetch all taxonomy data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [canonRes, aliasRes, countsRes] = await Promise.all([
        api.getCanonicalSpecialties().catch(() => []),
        api.getSpecialtyAliases().catch(() => []),
        api.getSpecialtyAliasCounts().catch(() => null)
      ]);

      const canonArr = Array.isArray(canonRes) ? canonRes : (canonRes?.results || []);
      const aliasArr = Array.isArray(aliasRes) ? aliasRes : (aliasRes?.results || []);

      setCanonicalList(canonArr);
      setAliasesList(aliasArr);

      if (countsRes) {
        setCounts(countsRes);
      } else {
        const total = aliasArr.length;
        const verified = aliasArr.filter(a => a.is_verified).length;
        setCounts({
          total_aliases: total,
          verified_aliases: verified,
          unverified_aliases: total - verified,
          canonical_specialties: canonArr.length
        });
      }
    } catch (err) {
      console.error('Error loading taxonomy data:', err);
      if (showToast) showToast('Failed to load taxonomy data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (initialTab) {
      setSubTab(initialTab);
    }
  }, [initialTab]);

  // Total doctors covered
  const totalDoctorsCovered = useMemo(() => {
    return canonicalList.reduce((acc, curr) => acc + (curr.doctor_count || 0), 0);
  }, [canonicalList]);

  // Filtered Canonical
  const filteredCanonical = useMemo(() => {
    const q = canonicalSearch.trim().toLowerCase();
    if (!q) return canonicalList;
    return canonicalList.filter(item => 
      (item.name || '').toLowerCase().includes(q) ||
      (item.canonical_name || '').toLowerCase().includes(q) ||
      (item.bn_name || '').toLowerCase().includes(q) ||
      (item.slug || '').toLowerCase().includes(q)
    );
  }, [canonicalList, canonicalSearch]);

  // Filtered Aliases
  const filteredAliases = useMemo(() => {
    let list = aliasesList;
    if (aliasSpecialtyFilter) {
      list = list.filter(a => String(a.specialty) === String(aliasSpecialtyFilter));
    }
    if (aliasLangFilter) {
      list = list.filter(a => a.language === aliasLangFilter);
    }
    if (aliasStatusFilter === 'verified') {
      list = list.filter(a => a.is_verified);
    } else if (aliasStatusFilter === 'unverified') {
      list = list.filter(a => !a.is_verified);
    }
    const q = aliasSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(a => 
        (a.name || '').toLowerCase().includes(q) ||
        (a.normalized || '').toLowerCase().includes(q) ||
        (a.specialty_name || '').toLowerCase().includes(q) ||
        (a.specialty_canonical || '').toLowerCase().includes(q) ||
        (a.specialty_bn || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [aliasesList, aliasSpecialtyFilter, aliasLangFilter, aliasStatusFilter, aliasSearch]);

  // Unverified Queue Items
  const unverifiedAliases = useMemo(() => {
    return aliasesList.filter(a => !a.is_verified);
  }, [aliasesList]);

  // Modal Openers
  const handleOpenSpecModal = (spec = null) => {
    if (spec) {
      setEditingSpec(spec);
      setSpecForm({
        id: spec.id,
        name: spec.name || '',
        canonical_name: spec.canonical_name || '',
        bn_name: spec.bn_name || '',
        icon: spec.icon || 'Stethoscope',
        description: spec.description || '',
        component_ids: (spec.components || []).map(c => c.id)
      });
    } else {
      setEditingSpec(null);
      setSpecForm({
        id: '',
        name: '',
        canonical_name: '',
        bn_name: '',
        icon: 'Stethoscope',
        description: '',
        component_ids: []
      });
    }
    setShowSpecModal(true);
  };

  const handleOpenAliasModal = (alias = null) => {
    if (alias) {
      setEditingAlias(alias);
      setAliasForm({
        id: alias.id,
        name: alias.name || '',
        specialty: alias.specialty || (canonicalList[0]?.id || ''),
        language: alias.language || 'bn',
        is_verified: alias.is_verified ?? true
      });
    } else {
      setEditingAlias(null);
      setAliasForm({
        id: '',
        name: '',
        specialty: canonicalList[0]?.id || '',
        language: 'bn',
        is_verified: true
      });
    }
    setShowAliasModal(true);
  };

  // Save Specialty
  const handleSaveSpec = async (e) => {
    e.preventDefault();
    try {
      if (editingSpec) {
        await api.updateSpecialty(editingSpec.id, specForm);
        if (showToast) showToast(`Specialty "${specForm.name}" updated successfully!`, 'success');
      } else {
        await api.createSpecialty(specForm);
        if (showToast) showToast(`Specialty "${specForm.name}" created successfully!`, 'success');
      }
      setShowSpecModal(false);
      fetchData();
      if (loadAllData) loadAllData();
    } catch (err) {
      console.error('Error saving specialty:', err);
      if (showToast) showToast(err.message || 'Failed to save specialty', 'error');
    }
  };

  // Delete Specialty
  const handleDeleteSpec = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete canonical specialty "${name}"? This may affect linked doctors.`)) {
      return;
    }
    try {
      await api.deleteSpecialty(id);
      if (showToast) showToast(`Deleted "${name}"`, 'success');
      fetchData();
      if (loadAllData) loadAllData();
    } catch (err) {
      console.error('Error deleting specialty:', err);
      if (showToast) showToast(err.message || 'Failed to delete specialty', 'error');
    }
  };

  // Save Alias
  const handleSaveAlias = async (e) => {
    e.preventDefault();
    try {
      if (editingAlias) {
        await api.updateSpecialtyAlias(editingAlias.id, aliasForm);
        if (showToast) showToast(`Alias "${aliasForm.name}" updated!`, 'success');
      } else {
        await api.createSpecialtyAlias(aliasForm);
        if (showToast) showToast(`Alias "${aliasForm.name}" added to synonym ring!`, 'success');
      }
      setShowAliasModal(false);
      fetchData();
    } catch (err) {
      console.error('Error saving alias:', err);
      if (showToast) showToast(err.message || 'Failed to save alias', 'error');
    }
  };

  // Quick Reassign Alias
  const handleReassignAlias = async (aliasId, newSpecialtyId) => {
    try {
      await api.updateSpecialtyAlias(aliasId, { specialty: newSpecialtyId });
      if (showToast) showToast('Alias re-assigned to canonical specialty!', 'success');
      fetchData();
    } catch (err) {
      console.error('Error re-assigning alias:', err);
      if (showToast) showToast(err.message || 'Failed to re-assign alias', 'error');
    }
  };

  // Verify Single Alias
  const handleVerifyAlias = async (aliasId, name) => {
    try {
      await api.verifySpecialtyAlias(aliasId);
      if (showToast) showToast(`Verified "${name}" — now live in search dropdowns!`, 'success');
      fetchData();
    } catch (err) {
      console.error('Error verifying alias:', err);
      if (showToast) showToast(err.message || 'Failed to verify alias', 'error');
    }
  };

  // Delete Alias
  const handleDeleteAlias = async (aliasId, name) => {
    if (!window.confirm(`Delete alias "${name}"?`)) return;
    try {
      await api.deleteSpecialtyAlias(aliasId);
      if (showToast) showToast(`Deleted alias "${name}"`, 'success');
      fetchData();
    } catch (err) {
      console.error('Error deleting alias:', err);
      if (showToast) showToast(err.message || 'Failed to delete alias', 'error');
    }
  };

  // Batch Verify Selected
  const handleBatchVerify = async () => {
    if (selectedReviewIds.length === 0) return;
    try {
      const res = await api.batchVerifySpecialtyAliases(selectedReviewIds);
      if (showToast) showToast(`Approved ${res.updated_count || selectedReviewIds.length} aliases!`, 'success');
      setSelectedReviewIds([]);
      fetchData();
    } catch (err) {
      console.error('Error batch verifying:', err);
      if (showToast) showToast(err.message || 'Failed to batch verify', 'error');
    }
  };

  // Approve All Unverified
  const handleApproveAll = async () => {
    if (unverifiedAliases.length === 0) return;
    if (!window.confirm(`Approve all ${unverifiedAliases.length} pending aliases at once?`)) return;
    try {
      const allIds = unverifiedAliases.map(a => a.id);
      const res = await api.batchVerifySpecialtyAliases(allIds);
      if (showToast) showToast(`Approved all ${res.updated_count || allIds.length} aliases!`, 'success');
      setSelectedReviewIds([]);
      fetchData();
    } catch (err) {
      console.error('Error approving all:', err);
      if (showToast) showToast(err.message || 'Failed to approve all', 'error');
    }
  };

  // Toggle review item selection
  const toggleSelectReview = (id) => {
    setSelectedReviewIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllReviews = () => {
    if (selectedReviewIds.length === unverifiedAliases.length) {
      setSelectedReviewIds([]);
    } else {
      setSelectedReviewIds(unverifiedAliases.map(a => a.id));
    }
  };

  const clearAliasFilters = () => {
    setAliasSpecialtyFilter('');
    setAliasLangFilter('');
    setAliasStatusFilter('');
    setAliasSearch('');
  };

  return {
    subTab,
    setSubTab,
    loading,
    canonicalList,
    aliasesList,
    counts,
    canonicalSearch,
    setCanonicalSearch,
    aliasSearch,
    setAliasSearch,
    aliasSpecialtyFilter,
    setAliasSpecialtyFilter,
    aliasLangFilter,
    setAliasLangFilter,
    aliasStatusFilter,
    setAliasStatusFilter,
    clearAliasFilters,
    selectedReviewIds,
    totalDoctorsCovered,
    filteredCanonical,
    filteredAliases,
    unverifiedAliases,
    showSpecModal,
    setShowSpecModal,
    editingSpec,
    specForm,
    setSpecForm,
    showAliasModal,
    setShowAliasModal,
    editingAlias,
    aliasForm,
    setAliasForm,
    fetchData,
    handleOpenSpecModal,
    handleOpenAliasModal,
    handleSaveSpec,
    handleDeleteSpec,
    handleSaveAlias,
    handleReassignAlias,
    handleVerifyAlias,
    handleDeleteAlias,
    handleBatchVerify,
    handleApproveAll,
    toggleSelectReview,
    toggleSelectAllReviews
  };
}
