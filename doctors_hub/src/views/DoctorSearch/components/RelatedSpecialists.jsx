import React, { useEffect, useState } from 'react';
import DoctorCard from './DoctorCard';
import { api } from '../../../services/api';
import { useLang } from '../../../hooks/useLang';
import { t, pluralizeSpecialty } from '../../../data/strings';

export default function RelatedSpecialists({
  specialty,
  filters = {},
  limit = 6,
  filteredFacility,
  filteredLocation,
  onBookDoctorSlot,
  onViewProfile,
  onSelectHospital,
  onSelectSpecialty
}) {
  const lang = useLang();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [items, setItems] = useState([]);
  const [related, setRelated] = useState([]);

  const filtersKey = JSON.stringify(filters || {});

  useEffect(() => {
    if (!specialty) {
      setItems([]);
      setRelated([]);
      setIsLoading(false);
      return undefined;
    }
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    api.getRelatedDoctors({ specialty, ...JSON.parse(filtersKey), limit })
      .then((data) => {
        if (!isMounted) return;
        setItems(Array.isArray(data?.results) ? data.results : []);
        setRelated(Array.isArray(data?.related) ? data.related : []);
      })
      .catch(() => {
        if (!isMounted) return;
        setHasError(true);
        setItems([]);
        setRelated([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [specialty, filtersKey, limit]);

  if (hasError || (!isLoading && items.length === 0)) return null;

  return (
    <section className="space-y-4" aria-label={t('relatedHeading')}>
      <h2 className="text-lg sm:text-xl font-bold text-on-surface">
        {t('relatedHeading')}
      </h2>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 animate-pulse space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-2xl bg-slate-200 shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((doc, idx) => (
              <DoctorCard
                key={doc.id || idx}
                doctor={doc}
                relatedVia={doc.related_via || null}
                filteredFacility={filteredFacility}
                filteredLocation={filteredLocation}
                onBookDoctorSlot={onBookDoctorSlot}
                onViewProfile={onViewProfile}
                onSelectHospital={onSelectHospital}
                onSelectSpecialty={onSelectSpecialty}
              />
            ))}
          </div>

          {related.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {related.map((rel) => (
                <button
                  key={rel.slug}
                  type="button"
                  onClick={() => {
                    if (onSelectSpecialty) onSelectSpecialty(rel.slug);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container-lowest border border-outline-variant text-primary hover:bg-primary/10 shadow-xs transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                  {t('seeAllSpecialists', {
                    specialty: lang === 'bn'
                      ? (rel.bn_name || rel.name)
                      : pluralizeSpecialty(rel.name)
                  })}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
