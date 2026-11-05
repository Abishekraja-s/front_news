import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryService } from '../services/articleService';

const DistrictNews = () => {
  const [districts, setDistricts] = useState([]);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    categoryService
      .getAll({ districts: 'true' })
      .then(({ data }) => {
        const list = [...(data.data || [])].sort((a, b) =>
          String(a.nameTamil || a.name).localeCompare(String(b.nameTamil || b.name), 'ta')
        );
        setDistricts(list);
      })
      .catch(() => {});
  }, []);

  const syncScrollEdges = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(max > 4 && el.scrollLeft < max - 4);
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    syncScrollEdges();
    el.addEventListener('scroll', syncScrollEdges, { passive: true });
    window.addEventListener('resize', syncScrollEdges);
    return () => {
      el.removeEventListener('scroll', syncScrollEdges);
      window.removeEventListener('resize', syncScrollEdges);
    };
  }, [districts]);

  const scrollByDir = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(280, el.clientWidth * 0.7), behavior: 'smooth' });
  };

  if (!districts.length) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="section-title mb-0">மாவட்ட செய்திகள்</h2>
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            disabled={!canLeft}
            aria-label="Scroll districts left"
            className="w-8 h-8 rounded-full border border-stone-200 bg-white text-slate-600
              hover:border-teal-300 hover:text-teal-700 disabled:opacity-30 disabled:cursor-not-allowed
              inline-flex items-center justify-center transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            disabled={!canRight}
            aria-label="Scroll districts right"
            className="w-8 h-8 rounded-full border border-stone-200 bg-white text-slate-600
              hover:border-teal-300 hover:text-teal-700 disabled:opacity-30 disabled:cursor-not-allowed
              inline-flex items-center justify-center transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Edge fades */}
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-8 sm:w-12 bg-gradient-to-r from-stone-100 to-transparent transition-opacity ${
            canLeft ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden
        />
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-8 sm:w-12 bg-gradient-to-l from-stone-100 to-transparent transition-opacity ${
            canRight ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden
        />

        <div
          ref={scrollerRef}
          className="district-scroll overflow-x-auto overflow-y-hidden py-1
            overscroll-x-contain touch-pan-x
            scroll-smooth snap-x snap-mandatory
            [-webkit-overflow-scrolling:touch]"
        >
          <div className="grid grid-rows-2 grid-flow-col auto-cols-max gap-2 pr-1">
            {districts.map((district) => (
              <Link
                key={district._id}
                to={`/tamil-nadu/${district.slug}`}
                className="snap-start min-w-[7.5rem] sm:min-w-[8.25rem] px-3.5 py-2.5 text-center
                  rounded-xl border border-stone-200/90 bg-white text-slate-800
                  shadow-[0_1px_2px_rgba(15,23,42,0.04)]
                  hover:border-teal-300 hover:bg-teal-50/70 hover:text-teal-800
                  active:scale-[0.98] transition-all whitespace-nowrap"
              >
                <span className="text-sm font-semibold tracking-wide">
                  {district.nameTamil || district.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DistrictNews;
