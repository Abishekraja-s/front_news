import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { articleService } from '../services/articleService';
import { getArticlePath } from '../utils/articlePaths';
import { SITE_CATEGORIES } from '../utils/helpers';
import NewsImage from './NewsImage';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';

const ACTIVE_RED = '#E61E26';

/** First 10 site categories — pill bar + horizontal cards (existing design). */
export const FIRST_TEN_CATEGORIES = SITE_CATEGORIES.slice(0, 10);
/** Next 10 site categories — deck / swipe card design. */
export const NEXT_TEN_CATEGORIES = SITE_CATEGORIES.slice(10);

/**
 * Top category pills (red active) + horizontal scrolling article cards.
 * Cards: next/prev click, drag, auto-scroll (page up/down scroll stays free).
 */
const CategoryScrollSection = ({ className = '', categories = FIRST_TEN_CATEGORIES }) => {
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug || 'district');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const catRef = useRef(null);

  const articleScroll = useHorizontalScroll({
    deps: [loading, articles.length, activeSlug],
    autoplayMs: 4000,
  });

  const updateArrows = useCallback(() => {
    const el = catRef.current;
    if (!el) {
      setCanLeft(false);
      setCanRight(false);
      return;
    }
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(max > 2 && el.scrollLeft < max - 2);
  }, []);

  const scrollCats = (dir) => {
    const el = catRef.current;
    if (!el) return;
    const amount = Math.max(140, Math.floor(el.clientWidth * 0.7));
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!categories.some((c) => c.slug === activeSlug)) {
      setActiveSlug(categories[0]?.slug || 'district');
    }
  }, [categories, activeSlug]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    articleService
      .getByCategory(activeSlug, 1, 12)
      .then(({ data }) => {
        if (!cancelled) setArticles(data.data || []);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSlug]);

  useEffect(() => {
    if (articleScroll.ref.current) articleScroll.ref.current.scrollLeft = 0;
  }, [activeSlug, articleScroll.ref]);

  useEffect(() => {
    const el = catRef.current;
    if (!el) return undefined;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateArrows) : null;
    ro?.observe(el);
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      ro?.disconnect();
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, categories.length]);

  if (!categories.length) return null;

  return (
    <div className={`mb-8 w-full max-w-full min-w-0 ${className}`.trim()}>
      <div className="mb-3 w-full min-w-0">
        <div className="flex items-center gap-1 sm:gap-1.5 w-full min-w-0">
          <button
            type="button"
            aria-label="Scroll categories left"
            disabled={!canLeft}
            onClick={() => scrollCats('left')}
            className="shrink-0 inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-white disabled:opacity-30 disabled:cursor-default"
            style={{ backgroundColor: ACTIVE_RED }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div
            ref={catRef}
            className="flex-1 min-w-0 flex gap-2 overflow-x-auto overscroll-x-contain scrollbar-hide py-0.5"
            style={{ touchAction: 'pan-x pan-y' }}
            role="tablist"
            aria-label="News categories"
          >
            {categories.map((cat) => {
              const active = cat.slug === activeSlug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveSlug(cat.slug)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                    active ? 'text-white shadow-sm' : 'text-white bg-slate-500 hover:bg-slate-600'
                  }`}
                  style={active ? { backgroundColor: ACTIVE_RED } : undefined}
                >
                  {cat.nameTamil || cat.name}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            aria-label="Scroll categories right"
            disabled={!canRight}
            onClick={() => scrollCats('right')}
            className="shrink-0 inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-white disabled:opacity-30 disabled:cursor-default"
            style={{ backgroundColor: ACTIVE_RED }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Article row with next/prev */}
      <div className="relative">
        <button
          type="button"
          aria-label="Previous articles"
          disabled={!articleScroll.canLeft}
          onClick={() => articleScroll.scrollByDir(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-md border border-slate-200 disabled:opacity-0 disabled:pointer-events-none hover:scale-105 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Next articles"
          disabled={!articleScroll.canRight}
          onClick={() => articleScroll.scrollByDir(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full text-white shadow-md disabled:opacity-0 disabled:pointer-events-none hover:scale-105 transition"
          style={{ backgroundColor: ACTIVE_RED }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div
          ref={articleScroll.ref}
          className="flex items-start gap-3 overflow-x-auto overscroll-x-contain pb-2 snap-x snap-mandatory scrollbar-hide w-full min-w-0 select-none sm:px-6"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}
        >
          {loading &&
            [1, 2, 3].map((i) => (
              <div
                key={i}
                data-hscroll-item
                className="shrink-0 w-[calc(100%-1.25rem)] max-w-[18rem] sm:w-56 md:w-64 snap-start self-start rounded-xl bg-white border border-stone-200/80"
              >
                <div className="skeleton aspect-[16/10] w-full rounded-t-xl" />
                <div className="p-3 space-y-2">
                  <div className="skeleton h-4 w-full rounded" />
                  <div className="skeleton h-4 w-2/3 rounded" />
                </div>
              </div>
            ))}

          {!loading && articles.length === 0 && (
            <p className="text-sm text-slate-500 py-6">இந்த பிரிவில் செய்திகள் இல்லை.</p>
          )}

          {!loading &&
            articles.map((article) => (
              <Link
                key={article._id}
                data-hscroll-item
                to={getArticlePath(article)}
                className="group shrink-0 w-[calc(100%-1.25rem)] max-w-[18rem] sm:w-56 md:w-64 snap-start self-start flex flex-col rounded-xl bg-white border border-stone-200/80 hover:border-stone-300 hover:shadow-sm transition-all overflow-visible"
              >
                <div className="aspect-[16/10] overflow-hidden rounded-t-xl bg-slate-100 shrink-0">
                  <NewsImage
                    src={article.featuredImage}
                    seed={article.slug}
                    alt={article.imageAlt || article.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="px-3 pt-2.5 pb-3.5 overflow-visible">
                  <h3
                    className="text-sm font-semibold text-slate-900 font-tamil break-words group-hover:text-red-700 transition-colors"
                    style={{ lineHeight: 1.85 }}
                  >
                    {article.title}
                  </h3>
                </div>
              </Link>
            ))}
        </div>

        {/* Mobile next/prev under the row */}
        <div className="mt-2 flex sm:hidden items-center justify-center gap-2">
          <button
            type="button"
            aria-label="Previous"
            disabled={!articleScroll.canLeft}
            onClick={() => articleScroll.scrollByDir(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200 disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next"
            disabled={!articleScroll.canRight}
            onClick={() => articleScroll.scrollByDir(1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white disabled:opacity-30"
            style={{ backgroundColor: ACTIVE_RED }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryScrollSection;
