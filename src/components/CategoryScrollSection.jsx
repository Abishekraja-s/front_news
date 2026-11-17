import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { articleService } from '../services/articleService';
import { getArticlePath } from '../utils/articlePaths';
import { SITE_CATEGORIES } from '../utils/helpers';
import NewsImage from './NewsImage';

const ACTIVE_RED = '#E61E26';

/**
 * Top category pills (red active) + horizontal scrolling article cards.
 * Mobile: no clipped titles / no edge overflow outside this section.
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
    const amount = Math.max(140, Math.floor(el.clientWidth * 0.7));
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
    <div className={`mb-8 w-full max-w-full min-w-0 ${className}`.trim()}>
      {/* Category bar — arrows inside, pills scroll in the middle */}
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
            className="flex-1 min-w-0 flex gap-2 overflow-x-auto overscroll-x-contain scrollbar-hide py-0.5 touch-pan-x"
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

      {/* Article cards — titles fully visible (Tamil glyphs must not be mid-clipped) */}
      <div
        ref={scrollerRef}
        className="flex items-start gap-3 overflow-x-auto overscroll-x-contain pb-2 snap-x snap-mandatory scrollbar-hide touch-pan-x w-full min-w-0"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {loading &&
          [1, 2, 3].map((i) => (
            <div
              key={i}
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
              {/* No line-clamp: Tamil + -webkit-line-clamp clips mid-glyph */}
              <div className="px-3 pt-2.5 pb-3.5 overflow-visible">
                <h3 className="text-sm font-semibold text-slate-900 font-tamil break-words group-hover:text-red-700 transition-colors"
                  style={{ lineHeight: 1.85 }}
                >
                  {article.title}
                </h3>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
};

export default CategoryScrollSection;
