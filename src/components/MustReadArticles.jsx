import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import NewsImage from './NewsImage';
import { getArticlePath } from '../utils/articlePaths';

const THEMES = [
  {
    border: 'border-rose-200/80',
    glow: 'hover:shadow-rose-200/50',
    wave: '#fb7185',
    ring: 'ring-rose-100',
  },
  {
    border: 'border-sky-200/80',
    glow: 'hover:shadow-sky-200/50',
    wave: '#38bdf8',
    ring: 'ring-sky-100',
  },
  {
    border: 'border-emerald-200/80',
    glow: 'hover:shadow-emerald-200/50',
    wave: '#34d399',
    ring: 'ring-emerald-100',
  },
  {
    border: 'border-teal-200/80',
    glow: 'hover:shadow-teal-200/50',
    wave: '#2dd4bf',
    ring: 'ring-teal-100',
  },
];

const MegaphoneIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" aria-hidden>
    <path
      d="M4 10.5v3a1 1 0 0 0 1 1h1.4L11 18V6.5L6.4 9.5H5a1 1 0 0 0-1 1Z"
      fill="currentColor"
    />
    <path
      d="M14.5 9.2a3.2 3.2 0 0 1 0 5.6M16.8 7.2a5.8 5.8 0 0 1 0 9.6"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
    />
    <path d="M11 9.2v5.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
  </svg>
);

/** Vertical wave on the right edge of the image (for left-image / right-content cards) */
const WaveOverlay = ({ color }) => (
  <svg
    className="absolute top-0 right-0 bottom-0 h-full w-4 sm:w-5 pointer-events-none"
    viewBox="0 0 24 120"
    preserveAspectRatio="none"
    aria-hidden
  >
    <path
      d="M8 0 C18 18 2 36 12 54 C22 72 4 90 14 120 L24 120 L24 0 Z"
      fill={color}
      opacity="0.9"
    />
    <path
      d="M14 0 C20 20 8 40 16 58 C24 76 10 96 18 120 L24 120 L24 0 Z"
      fill="white"
      opacity="0.95"
    />
  </svg>
);

/**
 * Premium Must Read carousel — UI only; same mustReadArticles data.
 */
const MustReadArticles = ({ articles, className = '' }) => {
  const list = useMemo(
    () => (articles || []).filter((a) => a && (a._id || a.slug)),
    [articles]
  );
  const scrollerRef = useRef(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector('[data-must-card]');
    if (!card) {
      setPageCount(1);
      return;
    }
    const gap = 16;
    const perView = Math.max(1, Math.round(el.clientWidth / (card.offsetWidth + gap)));
    setPageCount(Math.max(1, Math.ceil(list.length / perView)));
  }, [list.length]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) {
      setPage(0);
      return;
    }
    const ratio = el.scrollLeft / max;
    setPage(Math.round(ratio * (pageCount - 1)));
  };

  const scrollByPage = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector('[data-must-card]');
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.85;
    el.scrollBy({ left: dir * step * Math.max(1, Math.floor(el.clientWidth / step)), behavior: 'smooth' });
  };

  const goToPage = (i) => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const left = pageCount <= 1 ? 0 : (i / (pageCount - 1)) * max;
    el.scrollTo({ left, behavior: 'smooth' });
  };

  if (!list.length) return null;

  return (
    <section
      className={`mb-6 min-w-0 relative overflow-hidden rounded-2xl border border-stone-200/80 bg-gradient-to-br from-white via-stone-50 to-teal-50/40 p-3 sm:p-4 shadow-sm ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.55s ease, transform 0.55s ease',
      }}
    >
      {/* soft decorative wash */}
      <div
        className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-orange-200/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-teal-200/25 blur-3xl"
        aria-hidden
      />

      {/* Header */}
      <div className="relative z-[1] flex flex-wrap items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5 min-w-0">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 shadow-md shadow-orange-200/60 flex items-center justify-center text-white">
          <MegaphoneIcon />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              <span className="text-slate-900">Must </span>
              <span className="text-orange-500">Read</span>
            </h3>
            <span className="hidden sm:inline text-stone-300">|</span>
            <p className="text-sm font-semibold text-slate-700">முக்கிய செய்திகள்</p>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative z-[1]">
        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              className="hidden sm:flex absolute -left-0.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-white/90 backdrop-blur border border-stone-200 text-slate-800 shadow-md hover:scale-105 hover:border-teal-300 transition-all text-sm"
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              className="hidden sm:flex absolute -right-0.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-white/90 backdrop-blur border border-stone-200 text-slate-800 shadow-md hover:scale-105 hover:border-teal-300 transition-all text-sm"
              aria-label="Next"
            >
              ›
            </button>
          </>
        )}

        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 -mx-0.5 px-0.5 scrollbar-hide"
        >
          {list.map((article, index) => {
            const theme = THEMES[index % THEMES.length];

            return (
              <Link
                key={article._id || article.slug}
                to={getArticlePath(article)}
                data-must-card
                className={`group snap-start shrink-0 w-[88%] sm:w-[calc(50%-0.4rem)] lg:w-[calc(33.333%-0.5rem)]
                  flex flex-row items-stretch gap-0 min-h-[5.25rem] sm:min-h-[5.75rem]
                  rounded-xl border bg-white/90 backdrop-blur-sm overflow-hidden shadow-sm
                  transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${theme.border} ${theme.glow} ring-1 ${theme.ring}`}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(10px)',
                  transitionDelay: `${Math.min(index, 6) * 60}ms`,
                  transitionProperty: 'opacity, transform, box-shadow',
                }}
              >
                <div className="relative w-[38%] sm:w-[40%] shrink-0 overflow-hidden bg-stone-200 self-stretch min-h-[5.25rem]">
                  <NewsImage
                    src={article.featuredImage}
                    seed={article.slug}
                    alt={article.imageAlt || article.title}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 pointer-events-none" />
                  <WaveOverlay color={theme.wave} />
                </div>

                <div className="flex-1 min-w-0 px-2.5 sm:px-3 py-2 flex items-center">
                  <h4 className="text-[12px] sm:text-[13px] md:text-sm font-bold text-slate-900 leading-snug line-clamp-3 transition-colors group-hover:text-teal-800">
                    {article.title}
                  </h4>
                </div>
              </Link>
            );
          })}
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToPage(i)}
                aria-label={`Page ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  page === i
                    ? 'w-6 bg-gradient-to-r from-orange-500 to-rose-500'
                    : 'w-2 bg-stone-300 hover:bg-stone-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div
        className="mt-4 h-1 rounded-full bg-gradient-to-r from-teal-400/40 via-orange-300/50 to-rose-400/40"
        aria-hidden
      />
    </section>
  );
};

export default MustReadArticles;
