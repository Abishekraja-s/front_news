import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { governmentNotificationService } from '../services/articleService';

const NAVY = '#0b1f4a';
const ROYAL = '#1e3a8a';
const ACCENT = '#E50914';

const LEVEL_META = {
  central: { label: 'Central', labelTa: 'மத்திய', tone: '#1e3a8a' },
  tamil_nadu: { label: 'Tamil Nadu', labelTa: 'தமிழ்நாடு', tone: '#0f766e' },
  department: { label: 'Department', labelTa: 'துறை', tone: '#475569' },
  other: { label: 'Other', labelTa: 'மற்றவை', tone: '#64748b' },
};

const SCOPE_TABS = [
  { key: 'all', label: 'All', labelTa: 'அனைத்தும்', icon: 'grid' },
  { key: 'central', label: 'Central', labelTa: 'மத்திய', icon: 'book' },
  { key: 'tamil_nadu', label: 'Tamil Nadu', labelTa: 'தமிழ்நாடு', icon: 'sprout' },
  { key: 'jobs', label: 'Jobs', labelTa: 'வேலை', icon: 'users' },
];

const CATEGORY_META = {
  all: { label: 'All', short: 'All', shortTa: 'அனைத்தும்', tone: '#E50914', icon: 'grid' },
  announcement: { label: 'Announcement', short: 'Announcement', shortTa: 'அறிவிப்பு', tone: '#7c3aed', icon: 'megaphone' },
  scheme: { label: 'Scheme', short: 'Scheme', shortTa: 'திட்டம்', tone: '#059669', icon: 'sprout' },
  job: { label: 'Jobs', short: 'Jobs', shortTa: 'வேலை', tone: '#2563eb', icon: 'users' },
  tender: { label: 'Tender', short: 'Tender', shortTa: 'டெண்டர்', tone: '#d97706', icon: 'doc' },
  order: { label: 'Order', short: 'Order', shortTa: 'ஆணை', tone: '#0f766e', icon: 'gavel' },
  circular: { label: 'Policy', short: 'Policy', shortTa: 'சுற்றறிக்கை', tone: '#1e3a8a', icon: 'book' },
  welfare: { label: 'Welfare', short: 'Welfare', shortTa: 'நலன்', tone: '#db2777', icon: 'heart' },
  public_notice: { label: 'Press', short: 'Press', shortTa: 'செய்தி', tone: '#0284c7', icon: 'doc' },
  alert: { label: 'Alert', short: 'Alert', shortTa: 'எச்சரிக்கை', tone: '#dc2626', icon: 'bell' },
  general: { label: 'General', short: 'General', shortTa: 'பொது', tone: '#475569', icon: 'grid' },
};

const CATEGORY_CHIPS = [
  'all',
  'announcement',
  'scheme',
  'order',
  'circular',
  'welfare',
  'public_notice',
  'alert',
  'tender',
];

function catMeta(key) {
  return CATEGORY_META[key] || CATEGORY_META.general;
}

function levelMeta(level) {
  return LEVEL_META[level] || LEVEL_META.other;
}

function itemTitle(item) {
  return item?.titleTamil || item?.title || '';
}

function itemSummary(item) {
  return item?.summaryTamil || item?.summary || '';
}

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function buildListParams({ page, scope, category, importantOnly, search }) {
  const params = { page, limit: 18 };
  if (scope === 'central' || scope === 'tamil_nadu') params.level = scope;
  if (scope === 'jobs') params.category = 'job';
  else if (category && category !== 'all') params.category = category;
  if (importantOnly) params.important = '1';
  if (search) params.q = search;
  return params;
}

const CatIcon = ({ name, className = 'w-4 h-4' }) => {
  const props = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  };
  switch (name) {
    case 'megaphone':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      );
    case 'users':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'sprout':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V9m0 0C9 9 6.5 6.5 6 4c3.5.5 6 3 6 5zm0 0c3 0 5.5-2.5 6-5-3.5.5-6 3-6 5zm0 10c-2 0-4 1-4 3h8c0-2-2-3-4-3z" />
        </svg>
      );
    case 'doc':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'book':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
    case 'gavel':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h4l3-3 4 4-3 3H7l-4 4v-4l2-2-2-2V10zm10 1l6 6m-3-9l3 3" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
  }
};

const EmblemMark = () => (
  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white/90" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
    <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
    <circle cx="32" cy="32" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M32 8v8M32 48v8M8 32h8M48 32h8M14 14l6 6M44 44l6 6M14 50l6-6M44 20l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const LevelBadge = ({ level, light = false }) => {
  const meta = levelMeta(level || 'central');
  if (light) {
    return (
      <span className="inline-flex w-fit items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-white/20 text-white border border-white/25">
        {meta.label}
      </span>
    );
  }
  return (
    <span
      className="inline-flex w-fit items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
      style={{ backgroundColor: meta.tone }}
    >
      {meta.label}
    </span>
  );
};

const FeaturedHero = ({ item }) => {
  if (!item) return null;
  const meta = catMeta(item.category);
  return (
    <article className="relative overflow-hidden rounded-2xl min-h-[280px] sm:min-h-[340px] lg:min-h-[420px] h-full shadow-[0_12px_40px_rgba(11,31,74,0.25)] group">
      <div
        className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.03]"
        style={{
          background: `linear-gradient(145deg, ${NAVY} 0%, ${ROYAL} 48%, ${meta.tone} 160%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at 10% 90%, rgba(229,9,20,0.35), transparent 35%)',
        }}
      />
      <div className="absolute -right-6 -bottom-8 opacity-[0.12] text-white pointer-events-none">
        <CatIcon name={meta.icon} className="w-48 h-48" />
      </div>
      <div className="relative z-[1] flex flex-col justify-end h-full min-h-[300px] lg:min-h-[420px] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
            style={{ backgroundColor: ACCENT }}
          >
            <CatIcon name={meta.icon} className="w-3.5 h-3.5" />
            {meta.short}
          </span>
          <LevelBadge level={item.level || 'central'} light />
        </div>
        <h2
          className="mt-3 text-xl sm:text-2xl font-bold text-white font-tamil line-clamp-4"
          style={{ lineHeight: 1.4 }}
        >
          {itemTitle(item)}
        </h2>
        {itemSummary(item) ? (
          <p className="mt-2 text-sm text-white/80 line-clamp-3 leading-relaxed">{itemSummary(item)}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/75">
          {item.publishedAt ? (
            <span className="inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(item.publishedAt)}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 truncate max-w-[14rem]">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
            </svg>
            {item.sourceName || item.department || 'Official'}
          </span>
        </div>
        {item.officialUrl ? (
          <a
            href={item.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg hover:brightness-110 transition"
            style={{ backgroundColor: ACCENT }}
          >
            View official source →
          </a>
        ) : null}
      </div>
    </article>
  );
};

const SideCard = ({ item }) => {
  if (!item) return null;
  const meta = catMeta(item.category);
  return (
    <article className="group flex items-stretch gap-3 rounded-2xl bg-white border border-slate-200/80 p-3 shadow-[0_4px_18px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 transition-all duration-300 h-full">
      <div
        className="relative shrink-0 w-[4.75rem] sm:w-[5.25rem] rounded-xl overflow-hidden flex items-center justify-center text-white"
        style={{ background: `linear-gradient(145deg, ${meta.tone}, ${NAVY})` }}
      >
        <CatIcon name={meta.icon} className="w-7 h-7 opacity-95 group-hover:scale-110 transition-transform duration-500" />
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-center py-0.5">
        <div className="flex flex-wrap items-center gap-1 mb-1">
          <span
            className="inline-flex w-fit items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: meta.tone }}
          >
            {meta.short}
          </span>
          <LevelBadge level={item.level || 'central'} />
        </div>
        <h3
          className="text-sm font-bold text-slate-900 font-tamil line-clamp-2 group-hover:text-[#1e3a8a] transition-colors"
          style={{ lineHeight: 1.45 }}
        >
          {itemTitle(item)}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
          <span className="truncate max-w-[9rem] font-medium">{item.sourceName || 'Official'}</span>
          {item.publishedAt ? (
            <>
              <span className="text-slate-300">•</span>
              <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
            </>
          ) : null}
        </div>
      </div>
      {item.officialUrl ? (
        <a
          href={item.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="self-center shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm hover:scale-105 transition"
          style={{ backgroundColor: ACCENT }}
          aria-label="Open official source"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      ) : null}
    </article>
  );
};

const GovernmentNotifications = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [titles, setTitles] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [page, setPage] = useState(1);
  const [scope, setScope] = useState('all');
  const [category, setCategory] = useState('all');
  const [importantOnly, setImportantOnly] = useState(
    searchParams.get('important') === '1' || searchParams.get('important') === 'true'
  );
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (importantOnly) next.set('important', '1');
    else next.delete('important');
    setSearchParams(next, { replace: true });
  }, [importantOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    governmentNotificationService
      .getPublicList(
        buildListParams({ page, scope, category, importantOnly, search })
      )
      .then(({ data }) => {
        setItems(data.data || []);
        setTitles(data.titles || {});
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
        setEnabled(data.enabled !== false);
      })
      .catch(() => {
        setItems([]);
        setEnabled(false);
      })
      .finally(() => setLoading(false));
  }, [page, scope, category, importantOnly, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(q.trim());
  };

  const selectScope = (key) => {
    setScope(key);
    setCategory('all');
    setPage(1);
  };

  const selectCategory = (key) => {
    if (scope === 'jobs') setScope('all');
    setCategory(key);
    setPage(1);
  };

  const pageTitle = titles.latestTa || titles.latest || 'அரசு அறிவிப்புகள்';
  const featured = items[0] || null;
  const rest = items.slice(1);

  const stats = useMemo(() => {
    const counts = { central: 0, tamil_nadu: 0, job: 0, announcement: 0 };
    items.forEach((i) => {
      if (i.level === 'central') counts.central += 1;
      if (i.level === 'tamil_nadu') counts.tamil_nadu += 1;
      if (i.category === 'job') counts.job += 1;
      if (i.category === 'announcement') counts.announcement += 1;
    });
    return counts;
  }, [items]);

  return (
    <div className="min-h-[50vh] bg-slate-50/80">
      <Helmet>
        <title>{pageTitle} | The Great India News</title>
        <meta
          name="description"
          content="Official Central and Tamil Nadu government notifications, schemes, jobs, and alerts."
        />
      </Helmet>

      <div className="container-news py-6 sm:py-8">
        <Link to="/" className="text-xs font-semibold text-brand-700 hover:underline">
          ← முகப்பு
        </Link>

        <div className="mt-4 relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-b from-slate-50 via-white to-slate-50 shadow-[0_8px_40px_rgba(11,31,74,0.08)]">
          {/* Navy header — matches homepage / first-image design */}
          <div
            className="relative overflow-hidden px-4 sm:px-6 pt-5 pb-6 sm:pt-6 sm:pb-7"
            style={{ background: `linear-gradient(120deg, ${NAVY} 0%, ${ROYAL} 55%, #312e81 100%)` }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  'radial-gradient(ellipse at 20% 0%, rgba(96,165,250,0.45), transparent 50%), radial-gradient(ellipse at 90% 40%, rgba(229,9,20,0.25), transparent 40%)',
              }}
            />
            <div className="relative z-[1] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="shrink-0">
                  <EmblemMark />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-[1.7rem] font-bold text-white font-tamil leading-tight">
                    {pageTitle}
                  </h1>
                  <p className="text-sm text-blue-100/90 mt-0.5">
                    {titles.latest || 'Latest Government Notifications'}
                    <span className="text-blue-100/70"> · Central & Tamil Nadu</span>
                  </p>
                </div>
              </div>
              <span
                className="self-start inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold text-white shadow-lg"
                style={{ backgroundColor: ACCENT }}
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                </span>
                <CatIcon name="bell" className="w-3.5 h-3.5" />
                Latest Updates
              </span>
            </div>

            <form onSubmit={handleSearch} className="relative z-[1] mt-5 flex flex-col sm:flex-row gap-2 max-w-xl">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search notifications…"
                className="flex-1 border-0 rounded-xl px-4 py-2.5 text-sm bg-white/95 shadow-sm focus:ring-2 focus:ring-white/40 outline-none"
              />
              <button
                type="submit"
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md hover:brightness-110"
                style={{ backgroundColor: ACCENT }}
              >
                Search
              </button>
            </form>
          </div>

          <div className="px-4 sm:px-6 py-5 space-y-4">
            {/* Scope tabs */}
            <div
              role="tablist"
              aria-label="Government level"
              className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-2xl bg-white border border-slate-200/80 p-1.5 shadow-sm"
            >
              {SCOPE_TABS.map((tab) => {
                const active = scope === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => selectScope(tab.key)}
                    className={`min-h-[44px] w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs sm:text-sm font-semibold transition-colors ${
                      active ? 'text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    style={active ? { backgroundColor: ACCENT } : undefined}
                  >
                    <CatIcon name={tab.icon} className="w-4 h-4 shrink-0" />
                    <span className="font-tamil sm:hidden">{tab.labelTa}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Category chips */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
              {CATEGORY_CHIPS.map((key) => {
                const meta = catMeta(key);
                const active = category === key && scope !== 'jobs';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectCategory(key)}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition ${
                      active
                        ? 'text-white border-transparent shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                    style={active ? { backgroundColor: meta.tone, borderColor: meta.tone } : undefined}
                  >
                    <CatIcon name={meta.icon} className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{meta.short}</span>
                    <span className="sm:hidden font-tamil">{meta.shortTa}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setImportantOnly((v) => !v);
                  setPage(1);
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border transition ${
                  importantOnly
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Important only
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5 skeleton min-h-[320px] rounded-2xl" />
                <div className="lg:col-span-7 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="skeleton h-24 rounded-2xl" />
                  ))}
                </div>
              </div>
            ) : !enabled || !items.length ? (
              <div className="text-center py-14 text-slate-500 rounded-2xl border border-dashed border-slate-200 bg-white">
                <p>No published government notifications for this filter.</p>
                <button
                  type="button"
                  onClick={() => {
                    selectScope('all');
                    setSearch('');
                    setQ('');
                    setImportantOnly(false);
                  }}
                  className="mt-3 text-sm font-semibold hover:underline"
                  style={{ color: ACCENT }}
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400">{pagination.total} notifications</p>

                {/* Featured + side list — first-image layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  <div className="lg:col-span-5">
                    <FeaturedHero item={featured} />
                  </div>
                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
                    {rest.slice(0, 6).map((item) => (
                      <SideCard key={item._id} item={item} />
                    ))}
                  </div>
                </div>

                {rest.length > 6 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {rest.slice(6).map((item) => (
                      <SideCard key={item._id} item={item} />
                    ))}
                  </div>
                )}

                {/* Stats strip */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  {[
                    { label: 'Central', count: stats.central || pagination.total, color: '#1e3a8a', icon: 'book' },
                    { label: 'Tamil Nadu', count: stats.tamil_nadu, color: '#0f766e', icon: 'sprout' },
                    { label: 'Jobs', count: stats.job, color: '#2563eb', icon: 'users' },
                    { label: 'Announcements', count: stats.announcement, color: ACCENT, icon: 'megaphone' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center gap-2.5 min-w-[8.5rem] rounded-xl bg-white border border-slate-200/80 px-3 py-2.5 shadow-sm"
                    >
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white shrink-0"
                        style={{ backgroundColor: s.color }}
                      >
                        <CatIcon name={s.icon} className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-slate-900 tabular-nums leading-none">{s.count}+</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-500">
                      Page {pagination.page} / {pagination.pages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= pagination.pages}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernmentNotifications;
