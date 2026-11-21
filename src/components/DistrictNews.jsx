import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryService } from '../services/articleService';

/**
 * Premium district chip strip — stone/teal brand palette only.
 */
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
    el.scrollBy({ left: dir * Math.min(320, el.clientWidth * 0.72), behavior: 'smooth' });
  };

  if (!districts.length) return null;

  return (
    <section className="mb-10 animate-fade-up">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600 mb-1">Districts</p>
          <h2 className="section-title mb-0">மாவட்ட செய்திகள்</h2>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 mb-1">
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            disabled={!canLeft}
            aria-label="Scroll districts left"
            className="w-9 h-9 rounded-full border border-stone-200 bg-white text-slate-600
              hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50
              disabled:opacity-30 disabled:cursor-not-allowed
              inline-flex items-center justify-center transition-all shadow-soft"
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
            className="w-9 h-9 rounded-full border border-stone-200 bg-white text-slate-600
              hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50
              disabled:opacity-30 disabled:cursor-not-allowed
              inline-flex items-center justify-center transition-all shadow-soft"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative rounded-2xl bg-gradient-to-br from-white via-white to-brand-50/40 border border-stone-200/80 p-3 sm:p-4 shadow-soft">
        <div
          className={`pointer-events-none absolute inset-y-3 left-3 z-10 w-8 sm:w-10 rounded-l-xl bg-gradient-to-r from-white to-transparent transition-opacity ${
            canLeft ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden
        />
        <div
          className={`pointer-events-none absolute inset-y-3 right-3 z-10 w-8 sm:w-10 rounded-r-xl bg-gradient-to-l from-white to-transparent transition-opacity ${
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
          <div className="grid grid-rows-2 grid-flow-col auto-cols-max gap-2.5 pr-1">
            {districts.map((district) => (
              <Link
                key={district._id}
                to={`/tamil-nadu/${district.slug}`}
                className="snap-start group min-w-[8rem] sm:min-w-[9rem] px-4 py-3 text-center
                  rounded-2xl border border-stone-200/90 bg-stone-50/80 text-slate-800
                  shadow-[0_1px_2px_rgba(15,23,42,0.03)]
                  hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800 hover:-translate-y-0.5
                  hover:shadow-[0_8px_20px_rgba(13,148,136,0.12)]
                  active:scale-[0.98] transition-all duration-300 whitespace-nowrap"
              >
                <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-500/80 mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  District
                </span>
                <span className="text-sm font-semibold tracking-wide font-tamil">
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
