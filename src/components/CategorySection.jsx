import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import NewsImage from './NewsImage';
import CategoryBanner from './CategoryBanner';
import { getArticlePath } from '../utils/articlePaths';
import { timeAgo } from '../utils/helpers';

/**
 * Each homepage category gets a different card layout so sections
 * never look like copies of each other (esp. crime → pocso → spiritual → special).
 */
const LAYOUT_BY_SLUG = {
  district: 'carousel',
  politics: 'featured',
  chennai: 'mosaic',
  'tamil-nadu': 'magazine',
  india: 'spotlight',
  world: 'editorial',
  crime: 'stack',
  pocso: 'magazine',
  spiritual: 'mosaic',
  special: 'spotlight',
  education: 'editorial',
  sports: 'featured',
  jobs: 'timeline',
  agriculture: 'carousel',
  'sri-lanka': 'mosaic',
  business: 'magazine',
  health: 'editorial',
  'short-news': 'timeline',
  weather: 'carousel',
  'other-news': 'featured',
  cinema: 'spotlight',
  technology: 'mosaic',
};

const HEADER_ICONS = {
  district: 'pin',
  politics: 'building',
  chennai: 'building',
  'tamil-nadu': 'home',
  india: 'flag',
  world: 'globe',
  crime: 'shield',
  pocso: 'shield',
  sports: 'ball',
  jobs: 'briefcase',
  cinema: 'film',
  technology: 'chip',
  health: 'heart',
  education: 'book',
  business: 'chart',
  special: 'star',
  spiritual: 'spark',
  agriculture: 'leaf',
  default: 'news',
};

const shortDate = (date) => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
};

const HeaderIcon = ({ name }) => {
  const common = { className: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'aria-hidden': true };
  const paths = {
    pin: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    ),
    building: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
    home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    flag: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8m0 0V5a2 2 0 012-2h6.5l1 2H21l-3 6 3 6h-8.5l-1-2H5a2 2 0 00-2 2z" />,
    globe: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />,
    shield: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
    ball: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    briefcase: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
    film: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />,
    chip: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />,
    heart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
    book: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
    chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
    star: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
    spark: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />,
    leaf: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />,
    news: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />,
  };
  return <svg {...common}>{paths[name] || paths.news}</svg>;
};

const ArrowCircle = ({ light = false, className = '' }) => (
  <span
    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5 group-hover:scale-105 ${
      light
        ? 'bg-white text-brand-800 shadow-md'
        : 'bg-brand-800 text-white shadow-md shadow-brand-900/20'
    } ${className}`}
    aria-hidden
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  </span>
);

/** Slanted ribbon header + மேலும் செய்திகள் */
const SectionHeader = ({ title, slug }) => {
  const icon = HEADER_ICONS[slug] || HEADER_ICONS.default;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div className="relative inline-flex items-stretch min-w-0">
        <div
          className="relative flex items-center gap-2.5 text-white pl-3.5 pr-8 py-2.5 rounded-l-xl shadow-soft"
          style={{ background: 'linear-gradient(90deg, rgb(229, 9, 20) 0%, rgb(200, 8, 18) 100%)' }}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
            <HeaderIcon name={icon} />
          </span>
          <h2 className="text-base sm:text-lg md:text-xl font-bold font-tamil truncate mb-0">{title}</h2>
          {/* Diagonal slant */}
          <span
            className="pointer-events-none absolute top-0 -right-4 h-full w-8"
            style={{
              backgroundColor: 'rgb(229, 9, 20)',
              clipPath: 'polygon(0 0, 100% 0, 40% 100%, 0 100%)',
            }}
            aria-hidden
          />
        </div>
      </div>
      {slug ? (
        <Link
          to={`/${slug}`}
          className="inline-flex items-center gap-1.5 rounded-full border-2 text-xs sm:text-sm font-bold px-3.5 py-1.5 transition-colors shrink-0 hover:bg-red-50"
          style={{ borderColor: 'rgb(229, 9, 20)', color: 'rgb(229, 9, 20)' }}
        >
          மேலும் செய்திகள்
          <span aria-hidden>→</span>
        </Link>
      ) : null}
    </div>
  );
};

const catName = (article) => article?.category?.nameTamil || article?.category?.name || '';

/** Horizontal carousel cards (மாவட்டம் style) */
const LayoutCarousel = ({ articles, accent = 'brand' }) => {
  const scrollerRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const list = (articles || []).slice(0, 8);

  const sync = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(max > 4 && el.scrollLeft < max - 4);
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      el.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [list.length]);

  const scrollByDir = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(340, el.clientWidth * 0.8), behavior: 'smooth' });
  };

  const badgeTone =
    accent === 'violet'
      ? 'bg-violet-600'
      : accent === 'rose'
        ? 'bg-rose-600'
        : accent === 'orange'
          ? 'bg-orange-500'
          : 'bg-brand-700';

  const renderCard = (a) => {
    const dateLabel = shortDate(a.publishedAt);
    const label = catName(a);
    return (
      <Link
        to={getArticlePath(a)}
        className="group flex flex-col overflow-hidden h-full
          rounded-2xl bg-white ring-1 ring-stone-200/80 shadow-soft
          hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
          <NewsImage
            src={a.featuredImage}
            seed={a.slug}
            alt={a.imageAlt || a.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            loading="lazy"
          />
        </div>
        <div className="p-3.5 sm:p-4 flex flex-col flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {label ? (
              <span className={`rounded-md ${badgeTone} px-2 py-0.5 text-[10px] font-bold text-white`}>
                {label}
              </span>
            ) : null}
            {dateLabel ? (
              <span className="text-[10px] font-semibold text-slate-400">{dateLabel}</span>
            ) : null}
          </div>
          <h3
            className="text-sm sm:text-[15px] font-bold font-tamil text-slate-900 line-clamp-2 group-hover:text-brand-800"
            style={{ lineHeight: 1.45 }}
          >
            {a.title}
          </h3>
          {a.excerpt ? (
            <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">{a.excerpt}</p>
          ) : (
            <div className="flex-1" />
          )}
          <div className="mt-3 flex items-center justify-between gap-2">
            {a.publishedAt ? (
              <span className="text-[10px] text-slate-400">{timeAgo(a.publishedAt)}</span>
            ) : (
              <span />
            )}
            <ArrowCircle />
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="relative">
      {/* Mobile: vertical stack — no horizontal scroller trapping page scroll */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {list.map((a) => (
          <div key={a._id}>{renderCard(a)}</div>
        ))}
      </div>

      {/* Tablet/desktop: horizontal carousel */}
      <div className="relative hidden sm:block">
        <button
          type="button"
          onClick={() => scrollByDir(-1)}
          disabled={!canLeft}
          aria-label="Previous"
          className="hidden md:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center
            rounded-full bg-white border border-stone-200 text-slate-600 shadow-soft
            hover:border-brand-400 hover:text-brand-700 disabled:opacity-30 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => scrollByDir(1)}
          disabled={!canRight}
          aria-label="Next"
          className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center
            rounded-full bg-white border border-stone-200 text-slate-600 shadow-soft
            hover:border-brand-400 hover:text-brand-700 disabled:opacity-30 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div
          ref={scrollerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide
            overscroll-x-contain scroll-smooth px-0.5"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}
        >
          {list.map((a) => (
            <div key={a._id} className="snap-start shrink-0 w-[46%] lg:w-[31%]">
              {renderCard(a)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/** Featured image + text below (no overlay) + side list */
const LayoutFeatured = ({ articles }) => {
  const [main, ...rest] = articles || [];
  if (!main) return null;
  const side = rest.slice(0, 3);
  const dateLabel = shortDate(main.publishedAt);
  const label = catName(main);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 items-stretch">
      <Link
        to={getArticlePath(main)}
        className="lg:col-span-7 group flex flex-col overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-stone-200/80
          hover:ring-brand-300 transition-all"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-stone-100 shrink-0">
          <NewsImage
            src={main.featuredImage}
            seed={main.slug}
            alt={main.imageAlt || main.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {label ? (
              <span className="w-fit inline-flex items-center gap-1 rounded-md bg-brand-50 text-brand-800 px-2.5 py-1 text-[10px] font-bold">
                {label}
              </span>
            ) : null}
            {dateLabel ? (
              <span className="text-[10px] font-semibold text-slate-400">{dateLabel}</span>
            ) : null}
          </div>
          <h3
            className="text-xl sm:text-2xl font-bold font-tamil text-slate-900 leading-snug line-clamp-3 group-hover:text-brand-800 transition-colors"
            style={{ lineHeight: 1.35 }}
          >
            {main.title}
          </h3>
          {main.excerpt ? (
            <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed">{main.excerpt}</p>
          ) : null}
          <div className="mt-4 flex justify-end">
            <ArrowCircle />
          </div>
        </div>
      </Link>

      <div className="lg:col-span-5 flex flex-col gap-3">
        {side.map((a) => (
          <Link
            key={a._id}
            to={getArticlePath(a)}
            className="group flex-1 flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-stone-200/80 shadow-soft
              hover:shadow-lift hover:ring-brand-300 transition-all min-h-[5.5rem]"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-stone-100">
              <NewsImage
                src={a.featuredImage}
                seed={a.slug}
                alt={a.imageAlt || a.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="min-w-0 flex-1">
              {a.publishedAt ? (
                <p className="text-[10px] font-semibold text-brand-700 mb-0.5">{shortDate(a.publishedAt)}</p>
              ) : null}
              <h3
                className="text-sm font-bold font-tamil text-slate-900 line-clamp-3 group-hover:text-brand-800"
                style={{ lineHeight: 1.4 }}
              >
                {a.title}
              </h3>
            </div>
            <ArrowCircle className="self-center" />
          </Link>
        ))}
      </div>
    </div>
  );
};

/** Vertical stack cards with arrow CTA */
const LayoutStack = ({ articles }) => (
  <div className="flex flex-col gap-3">
    {(articles || []).slice(0, 4).map((a) => {
      const label = catName(a);
      return (
        <Link
          key={a._id}
          to={getArticlePath(a)}
          className="group flex gap-3 sm:gap-4 rounded-2xl bg-white p-3 sm:p-3.5 ring-1 ring-stone-200/80 shadow-soft
            hover:shadow-lift hover:ring-brand-300 hover:-translate-y-0.5 transition-all"
        >
          <div className="relative w-28 sm:w-36 aspect-[4/3] rounded-xl overflow-hidden shrink-0 bg-stone-100">
            <NewsImage
              src={a.featuredImage}
              seed={a.slug}
              alt={a.imageAlt || a.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-center py-0.5">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              {label ? (
                <span className="rounded bg-brand-50 text-brand-800 px-1.5 py-0.5 text-[9px] font-bold">
                  {label}
                </span>
              ) : null}
              {a.publishedAt ? (
                <p className="text-[10px] font-semibold text-brand-700">{shortDate(a.publishedAt)}</p>
              ) : null}
            </div>
            <h3 className="text-sm sm:text-base font-bold font-tamil text-slate-900 line-clamp-3 group-hover:text-brand-800 leading-snug">
              {a.title}
            </h3>
            {a.excerpt ? (
              <p className="mt-1 text-xs text-slate-500 line-clamp-2 hidden sm:block">{a.excerpt}</p>
            ) : null}
          </div>
          <ArrowCircle className="self-center" />
        </Link>
      );
    })}
  </div>
);

/** Big top story (image + text below) + two cards underneath — no text on image */
const LayoutMagazine = ({ articles }) => {
  const [main, ...rest] = articles || [];
  if (!main) return null;
  const below = rest.slice(0, 2);
  return (
    <div className="space-y-3 sm:space-y-4">
      <Link
        to={getArticlePath(main)}
        className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200/80 shadow-lift hover:ring-brand-300 transition-all"
      >
        <div className="relative aspect-[16/9] sm:aspect-[2.2/1] overflow-hidden bg-stone-100">
          <NewsImage
            src={main.featuredImage}
            seed={main.slug}
            alt={main.imageAlt || main.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
        <div className="p-4 sm:p-5 md:p-6">
          {catName(main) ? (
            <span className="inline-flex rounded-md bg-red-50 text-red-700 px-2 py-0.5 text-[10px] font-bold mb-2">
              {catName(main)}
            </span>
          ) : null}
          <h3 className="text-lg sm:text-2xl md:text-3xl font-bold font-tamil text-slate-900 leading-snug line-clamp-3 group-hover:text-brand-800">
            {main.title}
          </h3>
          {main.excerpt ? (
            <p className="mt-2 text-sm text-slate-500 line-clamp-2 max-w-3xl">{main.excerpt}</p>
          ) : null}
          <div className="mt-4 flex justify-end">
            <ArrowCircle />
          </div>
        </div>
      </Link>
      {below.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {below.map((a) => (
            <Link
              key={a._id}
              to={getArticlePath(a)}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200/80 shadow-soft hover:shadow-lift transition-all"
            >
              <div className="aspect-[16/9] overflow-hidden bg-stone-100">
                <NewsImage
                  src={a.featuredImage}
                  seed={a.slug}
                  alt={a.imageAlt || a.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-3.5 flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold font-tamil text-slate-900 line-clamp-3 group-hover:text-brand-800 leading-snug">
                  {a.title}
                </h3>
                <ArrowCircle />
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
};

/** Tall left card + two stacked right — image on top, title below (no overlay) */
const LayoutMosaic = ({ articles }) => {
  const [main, second, third] = articles || [];
  if (!main) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-stretch">
      <Link
        to={getArticlePath(main)}
        className="md:col-span-7 group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200/80 shadow-lift hover:ring-brand-300 transition-all"
      >
        <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-stone-100">
          <NewsImage
            src={main.featuredImage}
            seed={main.slug}
            alt={main.imageAlt || main.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          <h3 className="text-xl sm:text-2xl font-bold font-tamil text-slate-900 leading-snug line-clamp-3 group-hover:text-brand-800">
            {main.title}
          </h3>
          {main.excerpt ? (
            <p className="mt-2 text-sm text-slate-500 line-clamp-2">{main.excerpt}</p>
          ) : null}
          <div className="mt-auto pt-3 flex justify-end">
            <ArrowCircle />
          </div>
        </div>
      </Link>
      <div className="md:col-span-5 flex flex-col gap-3 sm:gap-4">
        {[second, third].filter(Boolean).map((a) => (
          <Link
            key={a._id}
            to={getArticlePath(a)}
            className="group flex-1 flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200/80 shadow-soft hover:shadow-lift transition-all min-h-0"
          >
            <div className="aspect-[16/9] overflow-hidden bg-stone-100 shrink-0">
              <NewsImage
                src={a.featuredImage}
                seed={a.slug}
                alt={a.imageAlt || a.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="p-3 sm:p-3.5 flex items-start justify-between gap-2 flex-1">
              <h3 className="text-sm sm:text-base font-bold font-tamil text-slate-900 line-clamp-3 group-hover:text-brand-800 leading-snug">
                {a.title}
              </h3>
              <ArrowCircle />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

/** Image left + title/list right — no text painted on the photo */
const LayoutSpotlight = ({ articles }) => {
  const [main, ...rest] = articles || [];
  if (!main) return null;
  const side = rest.slice(0, 3);
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-stone-200/80 shadow-lift bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <Link
          to={getArticlePath(main)}
          className="lg:col-span-7 group relative aspect-[16/10] lg:aspect-auto lg:min-h-[18rem] overflow-hidden bg-stone-100"
        >
          <NewsImage
            src={main.featuredImage}
            seed={main.slug}
            alt={main.imageAlt || main.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </Link>
        <div className="lg:col-span-5 flex flex-col justify-center p-4 sm:p-5 lg:p-6 gap-4 border-t lg:border-t-0 lg:border-l border-stone-100">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-red-600 font-bold mb-2">Spotlight</p>
            <Link to={getArticlePath(main)} className="group block">
              <h3 className="text-xl sm:text-2xl font-bold font-tamil text-slate-900 leading-snug line-clamp-4 group-hover:text-brand-800 transition-colors">
                {main.title}
              </h3>
              {main.excerpt ? (
                <p className="mt-2 text-sm text-slate-500 line-clamp-3">{main.excerpt}</p>
              ) : null}
            </Link>
          </div>
          <div className="space-y-0 divide-y divide-stone-100">
            {side.map((a, i) => (
              <Link
                key={a._id}
                to={getArticlePath(a)}
                className="group flex gap-3 py-3 first:pt-0 last:pb-0 items-start"
              >
                <span className="text-xs font-bold text-red-600 tabular-nums pt-0.5">
                  {String(i + 2).padStart(2, '0')}
                </span>
                <h4 className="text-sm font-semibold font-tamil text-slate-800 line-clamp-2 group-hover:text-brand-800 leading-snug">
                  {a.title}
                </h4>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Alternating image-left / image-right editorial rows */
const LayoutEditorial = ({ articles }) => (
  <div className="space-y-4">
    {(articles || []).slice(0, 4).map((a, i) => {
      const reverse = i % 2 === 1;
      return (
        <Link
          key={a._id}
          to={getArticlePath(a)}
          className={`group grid grid-cols-1 sm:grid-cols-12 gap-0 overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200/80 shadow-soft hover:shadow-lift transition-all ${
            reverse ? '' : ''
          }`}
        >
          <div className={`sm:col-span-5 relative aspect-[16/10] sm:aspect-auto sm:min-h-[10rem] bg-stone-100 ${reverse ? 'sm:order-2' : ''}`}>
            <NewsImage
              src={a.featuredImage}
              seed={a.slug}
              alt={a.imageAlt || a.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div className={`sm:col-span-7 p-4 sm:p-5 flex flex-col justify-center ${reverse ? 'sm:order-1' : ''}`}>
            {a.publishedAt ? (
              <p className="text-[10px] font-semibold text-brand-700 mb-1">{shortDate(a.publishedAt)} · {timeAgo(a.publishedAt)}</p>
            ) : null}
            <h3 className="text-base sm:text-lg font-bold font-tamil text-slate-900 line-clamp-3 group-hover:text-brand-800 leading-snug">
              {a.title}
            </h3>
            {a.excerpt ? (
              <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed">{a.excerpt}</p>
            ) : null}
            <div className="mt-3">
              <ArrowCircle />
            </div>
          </div>
        </Link>
      );
    })}
  </div>
);

/** Numbered compact timeline list */
const LayoutTimeline = ({ articles }) => (
  <ol className="rounded-2xl bg-white ring-1 ring-stone-200/80 shadow-soft divide-y divide-stone-100 overflow-hidden">
    {(articles || []).slice(0, 5).map((a, i) => (
      <li key={a._id}>
        <Link
          to={getArticlePath(a)}
          className="group flex gap-3 sm:gap-4 p-3.5 sm:p-4 hover:bg-stone-50 transition-colors items-center"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-white text-sm font-bold">
            {i + 1}
          </span>
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-stone-100">
            <NewsImage
              src={a.featuredImage}
              seed={a.slug}
              alt={a.imageAlt || a.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-bold font-tamil text-slate-900 line-clamp-2 group-hover:text-brand-800 leading-snug">
              {a.title}
            </h3>
            {a.publishedAt ? (
              <p className="mt-1 text-[11px] text-slate-400">{timeAgo(a.publishedAt)}</p>
            ) : null}
          </div>
          <ArrowCircle />
        </Link>
      </li>
    ))}
  </ol>
);

const ACCENT_BY_SLUG = {
  cinema: 'rose',
  sports: 'orange',
  special: 'violet',
  chennai: 'violet',
  spiritual: 'orange',
  pocso: 'rose',
};

const renderLayout = (layoutKey, articles, slug) => {
  switch (layoutKey) {
    case 'featured':
      return <LayoutFeatured articles={articles} />;
    case 'stack':
      return <LayoutStack articles={articles} />;
    case 'magazine':
      return <LayoutMagazine articles={articles} />;
    case 'mosaic':
      return <LayoutMosaic articles={articles} />;
    case 'spotlight':
      return <LayoutSpotlight articles={articles} />;
    case 'editorial':
      return <LayoutEditorial articles={articles} />;
    case 'timeline':
      return <LayoutTimeline articles={articles} />;
    default:
      return <LayoutCarousel articles={articles} accent={ACCENT_BY_SLUG[slug] || 'brand'} />;
  }
};

const CategorySection = ({ title, articles, slug, loading }) => {
  if (loading) {
    return (
      <section className="mb-8">
        <div className="skeleton h-10 w-56 mb-4 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!articles?.length) return null;

  const layoutKey = LAYOUT_BY_SLUG[slug] || 'carousel';

  return (
    <section className="mb-10 animate-fade-up [content-visibility:auto] [contain-intrinsic-size:auto_420px]">
      <SectionHeader title={title} slug={slug} />
      {renderLayout(layoutKey, articles, slug)}
      <CategoryBanner slug={slug} className="mt-4 md:mt-5" />
    </section>
  );
};

export default CategorySection;
