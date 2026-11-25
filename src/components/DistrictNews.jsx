import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { articleService, categoryService } from '../services/articleService';
import NewsCard from './NewsCard';

/**
 * District chip strip + main district news for the selected district.
 * Chips alone used to show with no article fetch — now selecting a district loads news.
 */
const DistrictNews = () => {
  const [districts, setDistricts] = useState([]);
  const [activeSlug, setActiveSlug] = useState('');
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    categoryService
      .getAll({ districts: 'true' })
      .then(({ data }) => {
        // Order: admin `order` first, then Tamil name (அரியலூர் → …)
        const list = [...(data.data || [])].sort((a, b) => {
          const ao = Number(a.order) || 0;
          const bo = Number(b.order) || 0;
          if (ao !== bo) return ao - bo;
          return String(a.nameTamil || a.name).localeCompare(
            String(b.nameTamil || b.name),
            'ta'
          );
        });
        setDistricts(list);
        if (!activeSlug) setActiveSlug('all');
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed active once from first load
  }, []);

  useEffect(() => {
    if (!activeSlug) return undefined;
    let cancelled = false;
    setLoadingArticles(true);
    // "all" → every district (Ariyalur, Chennai, …); else one district
    articleService
      .getByDistrict(activeSlug === 'all' ? 'all' : activeSlug, 1, 8)
      .then(({ data }) => {
        if (!cancelled) setArticles(data.data || []);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingArticles(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSlug]);

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

  const activeDistrict = districts.find((d) => d.slug === activeSlug);
  const activeLabel =
    activeSlug === 'all' ? 'அனைத்து மாவட்டம்' : activeDistrict?.nameTamil || activeDistrict?.name || 'மாவட்டம்';
  const moreHref = activeSlug === 'all' ? '/district' : `/tamil-nadu/${activeSlug}`;

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
              inline-flex items-center justify-center transition-all"
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
              inline-flex items-center justify-center transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-stone-200 p-3 sm:p-4 mb-5 shadow-none">
        <div
          ref={scrollerRef}
          className="district-scroll overflow-x-auto overflow-y-hidden py-1
            overscroll-x-contain touch-pan-x
            scroll-smooth snap-x snap-mandatory
            [-webkit-overflow-scrolling:touch]"
        >
          {/* Row-major: All → Ariyalur → … left-to-right, then second row */}
          <div
            className="grid grid-rows-2 grid-flow-row gap-2.5 pr-1"
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, Math.ceil((districts.length + 1) / 2))}, minmax(8rem, 9rem))`,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveSlug('all')}
              className={`snap-start group w-full px-4 py-3 text-center
                rounded-2xl border shadow-none transition-colors duration-200 whitespace-nowrap
                ${
                  activeSlug === 'all'
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-stone-200 bg-white text-slate-800 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800'
                }`}
            >
              <span className="text-sm font-semibold tracking-wide font-tamil">அனைத்தும்</span>
            </button>
            {districts.map((district) => {
              const isActive = district.slug === activeSlug;
              return (
                <button
                  key={district._id}
                  type="button"
                  onClick={() => setActiveSlug(district.slug)}
                  className={`snap-start group w-full px-4 py-3 text-center
                    rounded-2xl border shadow-none transition-colors duration-200 whitespace-nowrap
                    ${
                      isActive
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-stone-200 bg-white text-slate-800 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800'
                    }`}
                >
                  <span
                    className={`block text-[10px] font-bold uppercase tracking-wider mb-0.5 ${
                      isActive ? 'text-white/80 opacity-100' : 'text-brand-500/80 opacity-0 group-hover:opacity-100'
                    } transition-opacity`}
                  >
                    District
                  </span>
                  <span className="text-sm font-semibold tracking-wide font-tamil">
                    {district.nameTamil || district.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 font-tamil">{activeLabel}</h3>
        {activeSlug ? (
          <Link
            to={moreHref}
            className="text-xs sm:text-sm font-semibold text-brand-700 hover:text-brand-800 shrink-0"
          >
            மேலும் செய்திகள் →
          </Link>
        ) : null}
      </div>

      {loadingArticles ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mx-auto max-w-6xl">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-44 sm:h-56 rounded-2xl" aria-hidden />
          ))}
        </div>
      ) : articles.length ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 district-news-cards mx-auto max-w-6xl justify-items-center">
          {articles.map((article) => (
            <div key={article._id} className="w-full">
              <NewsCard article={article} hideExcerpt fullTitle />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 py-6 text-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/60">
          இந்த மாவட்டத்தில் செய்திகள் இல்லை.
        </p>
      )}
    </section>
  );
};

export default DistrictNews;
