import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { articleService } from '../services/articleService';
import { getArticlePath } from '../utils/articlePaths';
import { NEXT_TEN_CATEGORIES } from './CategoryScrollSection';
import NewsImage from './NewsImage';

/** Second block only — remaining categories after the first-10 header strip */
const CAROUSEL_CATEGORIES = NEXT_TEN_CATEGORIES;

const THEMES = {
  politics: { from: '#2563eb', to: '#1e40af', icon: 'building' },
  sports: { from: '#16a34a', to: '#15803d', icon: 'trophy' },
  world: { from: '#7c3aed', to: '#5b21b6', icon: 'globe' },
  business: { from: '#ea580c', to: '#c2410c', icon: 'chart' },
  education: { from: '#0891b2', to: '#0e7490', icon: 'book' },
  jobs: { from: '#4f46e5', to: '#3730a3', icon: 'briefcase' },
  agriculture: { from: '#65a30d', to: '#3f6212', icon: 'leaf' },
  'sri-lanka': { from: '#dc2626', to: '#991b1b', icon: 'globe' },
  health: { from: '#db2777', to: '#9d174d', icon: 'heart' },
  'short-news': { from: '#0d9488', to: '#0f766e', icon: 'bolt' },
  weather: { from: '#0284c7', to: '#075985', icon: 'cloud' },
  'other-news': { from: '#64748b', to: '#334155', icon: 'grid' },
  district: { from: '#b45309', to: '#92400e', icon: 'map' },
  chennai: { from: '#9333ea', to: '#6b21a8', icon: 'building' },
  'tamil-nadu': { from: '#c026d3', to: '#86198f', icon: 'map' },
  india: { from: '#e11d48', to: '#9f1239', icon: 'flag' },
  crime: { from: '#57534e', to: '#292524', icon: 'shield' },
  pocso: { from: '#78716c', to: '#44403c', icon: 'shield' },
  spiritual: { from: '#d97706', to: '#b45309', icon: 'spark' },
  special: { from: '#e11d48', to: '#be123c', icon: 'bolt' },
};

function themeFor(slug, index = 0) {
  if (THEMES[slug]) return THEMES[slug];
  const fallback = Object.values(THEMES);
  return fallback[index % fallback.length];
}

function relativeTimeTa(value) {
  if (!value) return '';
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return '';
  const mins = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (mins < 1) return 'இப்போது';
  if (mins < 60) return `${mins} நிமிடம் முன்பு`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} மணி நேரம் முன்பு`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} நாள் முன்பு`;
  try {
    return new Date(value).toLocaleDateString('ta-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

const CatGlyph = ({ name, className = 'w-5 h-5' }) => {
  const p = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  };
  switch (name) {
    case 'trophy':
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM5 5H4a2 2 0 00-2 2v1a4 4 0 004 4M19 5h1a2 2 0 012 2v1a4 4 0 01-4 4" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17l6-6 4 4 8-8M14 7h7v7" />
        </svg>
      );
    case 'building':
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'leaf':
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14zm0 0c0-4 2-7 5-9" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case 'book':
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'cloud':
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      );
    case 'bolt':
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
        </svg>
      );
  }
};

const CategoryDeckCard = ({ category, articles, loading, index, showBreaking }) => {
  const [main, ...rest] = articles || [];
  const list = rest.slice(0, 2);
  const title = category.nameTamil || category.name;
  const theme = themeFor(category.slug, index);
  const when = relativeTimeTa(main?.publishedAt);

  return (
    <article
      data-deck-card
      className="shrink-0 w-[min(86vw,20.5rem)] sm:w-[21.5rem] snap-start self-stretch flex flex-col rounded-[1.25rem] bg-white/95 backdrop-blur-sm border border-white/80 shadow-[0_10px_36px_rgba(15,23,42,0.1)] overflow-hidden hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(15,23,42,0.14)] transition-all duration-300"
    >
      {/* Gradient header */}
      <Link
        to={`/${category.slug}`}
        className="flex items-center gap-2.5 px-3.5 py-3 text-white"
        style={{ background: `linear-gradient(115deg, ${theme.from} 0%, ${theme.to} 100%)` }}
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
          <CatGlyph name={theme.icon} className="w-5 h-5" />
        </span>
        <h2 className="flex-1 min-w-0 text-[15px] sm:text-base font-bold font-tamil truncate">{title}</h2>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shrink-0" aria-hidden="true">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </Link>

      <div className="px-3.5 pt-3 pb-3.5 flex flex-col flex-1 min-h-0">
        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="aspect-[16/10] rounded-xl bg-stone-100" />
            <div className="h-4 bg-stone-100 rounded w-5/6" />
            <div className="h-3 bg-stone-100 rounded w-2/5" />
            <div className="h-14 bg-stone-100 rounded-xl" />
            <div className="h-14 bg-stone-100 rounded-xl" />
          </div>
        )}

        {!loading && !main && (
          <div className="flex flex-col items-center justify-center text-center py-8 px-2 min-h-[14rem]">
            <p className="text-sm text-slate-500 font-tamil mb-3">இந்த பிரிவில் செய்திகள் இல்லை.</p>
            <Link
              to={`/${category.slug}`}
              className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold text-white"
              style={{ background: `linear-gradient(115deg, ${theme.from}, ${theme.to})` }}
            >
              {title} பார்க்க →
            </Link>
          </div>
        )}

        {!loading && main && (
          <>
            <Link to={getArticlePath(main)} className="group block">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-slate-100">
                <NewsImage
                  src={main.featuredImage}
                  seed={main.slug}
                  alt={main.imageAlt || main.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  loading="lazy"
                />
                {showBreaking && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-[#E50914] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                    </svg>
                    Breaking News
                  </span>
                )}
              </div>
              <h3
                className="mt-2.5 text-[14px] sm:text-[15px] font-bold text-slate-900 font-tamil line-clamp-2 group-hover:text-blue-700 transition-colors"
                style={{ lineHeight: 1.55 }}
              >
                {main.title}
              </h3>
              {when ? (
                <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-slate-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {when}
                </p>
              ) : null}
            </Link>

            <div className="mt-2.5 flex flex-col">
              {list.map((article) => (
                <Link
                  key={article._id}
                  to={getArticlePath(article)}
                  className="group flex items-start gap-2.5 py-2.5 border-t border-stone-100"
                >
                  <div className="relative shrink-0 w-14 h-14 overflow-hidden rounded-lg bg-slate-100">
                    <NewsImage
                      src={article.featuredImage}
                      seed={article.slug}
                      alt={article.imageAlt || article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <h4
                    className="flex-1 min-w-0 text-[12px] sm:text-[13px] font-semibold text-slate-800 font-tamil line-clamp-2 group-hover:text-blue-700 transition-colors pt-0.5"
                    style={{ lineHeight: 1.5 }}
                  >
                    {article.title}
                  </h4>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </article>
  );
};

/**
 * Premium horizontal category news carousel (no section title).
 * Only cards with real articles are shown.
 */
const CategoryDeckSection = ({ className = '', categories = CAROUSEL_CATEGORIES }) => {
  const [bySlug, setBySlug] = useState({});
  const [loading, setLoading] = useState(true);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const scrollerRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      setCanLeft(false);
      setCanRight(false);
      return;
    }
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(max > 2 && el.scrollLeft < max - 2);
    const card = el.querySelector('[data-deck-card]');
    const step = card ? card.getBoundingClientRect().width + 14 : el.clientWidth * 0.8;
    setPageIndex(Math.round(el.scrollLeft / Math.max(step, 1)));
  }, []);

  const scrollByDir = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector('[data-deck-card]');
    const amount = card ? card.getBoundingClientRect().width + 14 : Math.min(el.clientWidth * 0.85, 360);
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  useEffect(() => {
    let cancelled = false;
    if (!categories.length) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const accumulated = {};
    const BATCH = 3;

    (async () => {
      for (let i = 0; i < categories.length; i += BATCH) {
        if (cancelled) return;
        const slice = categories.slice(i, i + BATCH);
        const pairs = await Promise.all(
          slice.map(async (cat) => {
            try {
              const { data } = await articleService.getByCategory(cat.slug, 1, 6);
              return [cat.slug, data.data || []];
            } catch {
              return [cat.slug, []];
            }
          })
        );
        if (cancelled) return;
        pairs.forEach(([slug, list]) => {
          accumulated[slug] = list;
        });
        setBySlug({ ...accumulated });
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [categories]);

  // Always show every remaining category card (விவசாயம், இலங்கை, வணிகம், …)
  const visibleCats = categories;

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;

    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateArrows) : null;
    ro?.observe(el);
    window.addEventListener('resize', updateArrows);

    // Only hijack wheel when Shift is held or gesture is clearly horizontal —
    // otherwise let the page scroll up/down normally.
    const onWheel = (e) => {
      const mostlyHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!e.shiftKey && !mostlyHorizontal) return;
      if (el.scrollWidth <= el.clientWidth + 2) return;
      const delta = mostlyHorizontal ? e.deltaX : e.deltaY;
      if (!delta) return;
      e.preventDefault();
      el.scrollLeft += delta;
    };
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('scroll', updateArrows);
      el.removeEventListener('wheel', onWheel);
      ro?.disconnect();
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, visibleCats.length, loading]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;

    const onDown = (e) => {
      if (e.button !== 0) return;
      dragRef.current = { active: true, startX: e.pageX, scrollLeft: el.scrollLeft, moved: false };
      el.style.cursor = 'grabbing';
    };
    const onMove = (e) => {
      if (!dragRef.current.active) return;
      const dx = e.pageX - dragRef.current.startX;
      if (Math.abs(dx) > 4) dragRef.current.moved = true;
      el.scrollLeft = dragRef.current.scrollLeft - dx;
    };
    const onUp = () => {
      dragRef.current.active = false;
      el.style.cursor = 'grab';
    };
    const onClickCapture = (e) => {
      if (dragRef.current.moved) {
        e.preventDefault();
        e.stopPropagation();
        dragRef.current.moved = false;
      }
    };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    el.addEventListener('click', onClickCapture, true);
    el.style.cursor = 'grab';

    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      el.removeEventListener('click', onClickCapture, true);
    };
  }, [loading, visibleCats.length]);

  if (!categories.length) return null;

  const dotCount = Math.min(visibleCats.length, 10);

  return (
    <div className={`relative mb-8 w-full max-w-full min-w-0 ${className}`.trim()}>
      {/* Side arrows */}
      <button
        type="button"
        aria-label="Previous"
        disabled={!canLeft}
        onClick={() => scrollByDir(-1)}
        className="hidden sm:inline-flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full bg-white text-blue-600 shadow-[0_8px_24px_rgba(15,23,42,0.14)] border border-slate-100 disabled:opacity-0 disabled:pointer-events-none hover:scale-105 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next"
        disabled={!canRight}
        onClick={() => scrollByDir(1)}
        className="hidden sm:inline-flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full bg-white text-blue-600 shadow-[0_8px_24px_rgba(15,23,42,0.14)] border border-slate-100 disabled:opacity-0 disabled:pointer-events-none hover:scale-105 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div
        ref={scrollerRef}
        className="flex items-stretch gap-3.5 overflow-x-auto overscroll-x-contain pb-2 snap-x snap-mandatory touch-pan-x w-full min-w-0 max-w-full scrollbar-hide sm:px-6"
        style={{
          WebkitOverflowScrolling: 'touch',
          // Allow vertical page scroll; horizontal pan still works for the carousel
          touchAction: 'pan-x pan-y',
        }}
        aria-label="Category news carousel"
      >
        {visibleCats.map((cat, idx) => (
          <CategoryDeckCard
            key={cat.slug}
            category={cat}
            articles={bySlug[cat.slug] || []}
            loading={loading && !Object.prototype.hasOwnProperty.call(bySlug, cat.slug)}
            index={idx}
            showBreaking={idx === 0 && (bySlug[cat.slug] || []).length > 0}
          />
        ))}
        <div className="shrink-0 w-2" aria-hidden="true" />
      </div>

      {dotCount > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden="true">
          {Array.from({ length: dotCount }).map((_, i) => (
            <span
              key={`dot-${i}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === Math.min(pageIndex, dotCount - 1) ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryDeckSection;
