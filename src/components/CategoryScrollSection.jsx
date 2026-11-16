import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { articleService } from '../services/articleService';
import { getArticlePath } from '../utils/articlePaths';
import { SITE_CATEGORIES } from '../utils/helpers';
import NewsImage from './NewsImage';

const ACTIVE_RED = '#E61E26';

/**
 * Top category pills (red active) + horizontal scrolling article cards.
 * Arrow marks only on the category bar (no overflow outside this div).
 */
const CategoryScrollSection = ({ className = '' }) => {
  const categories = SITE_CATEGORIES;
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug || 'district');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const catRef = useRef(null);
  const scrollerRef = useRef(null);

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
    const amount = Math.max(160, Math.floor(el.clientWidth * 0.65));
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

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
    if (scrollerRef.current) scrollerRef.current.scrollLeft = 0;
  }, [activeSlug]);

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
    <div className={`mb-8 min-w-0 ${className}`.trim()}>
      {/* Category bar only — arrows stay inside this div */}
      <div className="relative mb-3 min-w-0 overflow-hidden">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            aria-label="Scroll categories left"
            disabled={!canLeft}
            onClick={() => scrollCats('left')}
            className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg text-white disabled:opacity-30 disabled:cursor-default"
            style={{ backgroundColor: ACTIVE_RED }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div
            ref={catRef}
            className="flex-1 min-w-0 flex gap-2 overflow-x-auto scrollbar-hide py-0.5"
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
                  className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
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
            className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg text-white disabled:opacity-30 disabled:cursor-default"
            style={{ backgroundColor: ACTIVE_RED }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1"
      >
        {loading &&
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[70vw] sm:w-56 md:w-64 snap-start rounded-xl overflow-hidden bg-white border border-stone-200/80"
            >
              <div className="skeleton aspect-[16/10] w-full" />
              <div className="p-3 space-y-2">
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-2/3 rounded" />
              </div>
            </div>
          ))}

        {!loading && articles.length === 0 && (
          <p className="text-sm text-slate-500 py-6 px-1">இந்த பிரிவில் செய்திகள் இல்லை.</p>
        )}

        {!loading &&
          articles.map((article) => (
            <Link
              key={article._id}
              to={getArticlePath(article)}
              className="group shrink-0 w-[70vw] sm:w-56 md:w-64 snap-start flex flex-col overflow-hidden rounded-xl bg-white border border-stone-200/80 hover:border-stone-300 hover:shadow-sm transition-all"
            >
              <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                <NewsImage
                  src={article.featuredImage}
                  seed={article.slug}
                  alt={article.imageAlt || article.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <h3 className="p-3 text-sm font-semibold text-slate-900 leading-snug line-clamp-3 group-hover:text-red-700 transition-colors">
                {article.title}
              </h3>
            </Link>
          ))}
      </div>
    </div>
  );
};

export default CategoryScrollSection;
