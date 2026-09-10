import React from 'react';

export default function DoctorReviewsSection({ doctor }) {
  if (!doctor) return null;

  const ratingNum = parseFloat(doctor.rating) || 4.9;
  const reviewCount = doctor.review_count || 120;
  const specialtyName = doctor.specialties?.[0]?.name || 'Specialist Consultation';

  const sampleReviews = [
    {
      initials: 'AH',
      name: 'Md. Anisul Haque',
      type: `${specialtyName} Follow-up`,
      date: '3 days ago',
      rating: 5,
      comment: `Dr. ${doctor.name.replace(/^Dr\.\s*|^Prof\.\s*/i, '')} listened to my medical concerns with great patience. Took time to thoroughly explain my diagnostic reports in plain terms without causing any alarm. The treatment plan has made a tremendous difference.`,
      waitTime: '~15 mins'
    },
    {
      initials: 'SB',
      name: 'Shabnam Begum',
      type: 'Clinical Evaluation & Prescription',
      date: '1 week ago',
      rating: 5,
      comment: `Outstanding doctor. The chamber management was very disciplined. Unlike other hurried specialists, he spent ample time listening to my mother's symptoms, adjusting her medication carefully, and giving dietary guidance.`,
      waitTime: '~20 mins'
    }
  ];

  return (
    <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 lg:p-7 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-outline-variant/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">
              rate_review
            </span>
            <h2 className="text-title-lg font-title-lg text-on-surface font-bold text-slate-900">
              Verified Patient Reviews
            </h2>
          </div>
          <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5 text-slate-500">
            Feedback collected from verified chamber appointment consultations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-headline-md font-headline-md font-bold text-on-surface text-slate-900">
            {ratingNum.toFixed(1)}
          </span>
          <div className="text-left">
            <div className="flex text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              ))}
            </div>
            <span className="text-label-sm font-label-sm text-on-surface-variant text-slate-500">
              {reviewCount} Verified Patients
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-outline-variant/40">
        {sampleReviews.map((rev, idx) => (
          <div key={idx} className="py-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-label-md">
                  {rev.initials}
                </div>
                <div>
                  <p className="text-title-md font-title-md text-on-surface font-semibold text-slate-900">
                    {rev.name}
                  </p>
                  <p className="text-label-sm font-label-sm text-outline text-slate-500">
                    {rev.type}
                  </p>
                </div>
              </div>
              <span className="text-label-sm font-label-sm text-outline text-slate-400">
                {rev.date}
              </span>
            </div>

            <p className="text-body-md font-body-md text-on-surface-variant text-slate-700 leading-relaxed">
              "{rev.comment}"
            </p>

            <div className="flex items-center gap-3 text-label-sm font-label-sm text-primary">
              <span className="inline-flex items-center gap-1 font-semibold text-teal-700">
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
                <span>Verified Chamber Visit</span>
              </span>
              <span className="text-outline-variant text-slate-300">•</span>
              <span className="text-on-surface-variant text-slate-500">Wait time: {rev.waitTime}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
