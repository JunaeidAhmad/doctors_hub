import React from 'react';

export default function DiagnosticsHeroSearch({
  categories = [],
  selectedCategory = 'all',
  onCategoryChange,
  searchKeyword = '',
  onSearchChange,
  onSearchSubmit,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearchSubmit && onSearchSubmit();
    }
  };

  return (
    <section className="mb-10">
      <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute right-0 top-0 w-96 h-full opacity-5 pointer-events-none bg-[radial-gradient(#00685f_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-3xl mb-6 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold mb-3">
            <span className="material-symbols-outlined text-sm">science</span>
            <span>Search Diagnostic Test</span>
          </div>

          <h1 className="font-headline-xl text-3xl sm:text-4xl text-on-surface font-bold tracking-tight mb-2">
            Book Diagnostic Tests Online
          </h1>
          <p className="font-body-lg text-sm sm:text-base text-on-surface-variant leading-relaxed">
            Compare verified diagnostic test fees, report turnaround times, and book verified doorstep home sample collections across leading healthcare centers.
          </p>
        </div>

        {/* Integrated Search Bar */}
        <div className="bg-surface-container-low p-2 rounded-xl border border-outline-variant/80 shadow-xs flex flex-col md:flex-row items-center gap-2 relative z-10">
          {/* Category Selector */}
          <div className="w-full md:w-56 relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] pointer-events-none">
              category
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full pl-10 pr-8 py-3 bg-surface-container-lowest border-0 rounded-lg text-on-surface font-label-md text-xs sm:text-sm focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="all">All Test Types</option>
              {categories
                .filter((cat) => cat.id !== 'all' && cat.slug !== 'all' && (cat.name || '').toLowerCase() !== 'all test types')
                .map((cat) => (
                  <option key={cat.slug || cat.id || cat.name} value={cat.slug || cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 text-on-surface-variant text-[18px] pointer-events-none">
              keyboard_arrow_down
            </span>
          </div>

          <div className="hidden md:block h-8 w-px bg-outline-variant/60"></div>

          {/* Test Name Search Input */}
          <div className="flex-1 w-full relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-primary text-[22px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Complete Blood Count (CBC) with ESR"
              className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/70 font-body-md text-xs sm:text-sm focus:ring-2 focus:ring-primary"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 text-on-surface-variant hover:text-on-surface text-xs font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={onSearchSubmit}
            className="w-full md:w-auto bg-primary hover:bg-primary-container text-on-primary font-semibold flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg shadow-sm transition-all shrink-0 active:scale-[0.98] cursor-pointer font-label-lg text-label-lg"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            <span>Search</span>
          </button>
        </div>
      </div>
    </section>
  );
}
