import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

/** Primary homepage scopes — wired to public list `level` / `category` params */
const SCOPE_TABS = [
  { key: 'all', label: 'All', labelTa: 'அனைத்தும்', icon: 'grid' },
  { key: 'central', label: 'Central', labelTa: 'மத்திய', icon: 'book' },
  { key: 'tamil_nadu', label: 'Tamil Nadu', labelTa: 'தமிழ்நாடு', icon: 'sprout' },
  { key: 'jobs', label: 'Jobs', labelTa: 'வேலை', icon: 'users' },
];

const CATEGORY_META = {
  all: { label: 'All Notifications', short: 'All', shortTa: 'அனைத்தும்', tone: '#E50914', icon: 'grid' },
  announcement: { label: 'Announcements', short: 'Announcement', shortTa: 'அறிவிப்பு', tone: '#7c3aed', icon: 'megaphone' },
  scheme: { label: 'Schemes', short: 'Scheme', shortTa: 'திட்டம்', tone: '#059669', icon: 'sprout' },
  job: { label: 'Appointments', short: 'Jobs', shortTa: 'வேலை', tone: '#2563eb', icon: 'users' },
  tender: { label: 'Tenders', short: 'Tender', shortTa: 'டெண்டர்', tone: '#d97706', icon: 'doc' },
  order: { label: 'Orders', short: 'Order', shortTa: 'ஆணை', tone: '#0f766e', icon: 'gavel' },
  circular: { label: 'Policies', short: 'Policy', shortTa: 'சுற்றறிக்கை', tone: '#1e3a8a', icon: 'book' },
  welfare: { label: 'Welfare', short: 'Welfare', shortTa: 'நலன்', tone: '#db2777', icon: 'heart' },
  public_notice: { label: 'Press Releases', short: 'Press', shortTa: 'செய்தி', tone: '#0284c7', icon: 'doc' },
  alert: { label: 'Alerts', short: 'Alert', shortTa: 'எச்சரிக்கை', tone: '#dc2626', icon: 'bell' },
  general: { label: 'General', short: 'General', shortTa: 'பொது', tone: '#475569', icon: 'grid' },
};

/** Category chips (Jobs lives only in SCOPE_TABS to avoid duplicate / click conflicts) */
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

function levelMeta(level) {
  return LEVEL_META[level] || LEVEL_META.other;
}

function isGovLevel(level) {
  return level === 'central' || level === 'tamil_nadu';
}

function buildListParams(scope, category) {
  const params = { page: 1, limit: 18 };
  if (scope === 'central' || scope === 'tamil_nadu') {
    params.level = scope;
  }
  if (scope === 'jobs') {
    params.category = 'job';
  } else if (category && category !== 'all') {
    params.category = category;
  }
  return params;
}

function catMeta(key) {
  return CATEGORY_META[key] || CATEGORY_META.general;
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
    <path d="M26 40c2-8 4-12 6-16 2 4 4 8 6 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

const FeaturedHero = ({ items }) => {
  const [index, setIndex] = useState(0);
  const slides = Array.isArray(items) ? items.filter(Boolean).slice(0, 4) : [];

  const slideKey = slides.map((s) => s._id || s.title).join('|');
  useEffect(() => {
    setIndex(0);
  }, [slideKey]);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const safeIndex = slides.length ? index % slides.length : 0;
  const item = slides[safeIndex];
  if (!item) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 min-h-[220px] flex items-center justify-center text-sm text-slate-500">
        No notification selected.
      </div>
    );
  }
  const meta = catMeta(item.category);

  return (
    <article className="relative overflow-hidden rounded-2xl min-h-[280px] sm:min-h-[320px] lg:min-h-[420px] h-full shadow-[0_12px_40px_rgba(11,31,74,0.25)] group">
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

      {slides.length > 1 && (
        <div className="absolute top-3 right-3 z-[2] flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
            />
          ))}
        </div>
      )}

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
        <h3
          className="mt-3 text-xl sm:text-2xl font-bold text-white font-tamil line-clamp-3"
          style={{ lineHeight: 1.4 }}
        >
          {itemTitle(item)}
        </h3>
        {itemSummary(item) ? (
          <p className="mt-2 text-sm text-white/80 line-clamp-2 leading-relaxed">{itemSummary(item)}</p>
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
            className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg hover:brightness-110 transition"
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
    <article className="group flex items-stretch gap-3 rounded-2xl bg-white border border-slate-200/80 p-3 shadow-[0_4px_18px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 transition-all duration-300">
      <div
        className="relative shrink-0 w-[4.75rem] sm:w-[5.25rem] rounded-xl overflow-hidden flex items-center justify-center text-white"
        style={{ background: `linear-gradient(145deg, ${meta.tone}, ${NAVY})` }}
      >
        <CatIcon name={meta.icon} className="w-7 h-7 opacity-95 group-hover:scale-110 transition-transform duration-500" />
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <div className="flex flex-wrap items-center gap-1 mb-1">
          <span
            className="inline-flex w-fit items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: meta.tone }}
          >
            {meta.short}
          </span>
          <LevelBadge level={item.level || 'central'} />
        </div>
        <h4
          className="text-sm font-bold text-slate-900 font-tamil line-clamp-2 group-hover:text-[#1e3a8a] transition-colors"
          style={{ lineHeight: 1.45 }}
        >
          {itemTitle(item)}
        </h4>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
          <span className="truncate max-w-[8rem] font-medium">{item.sourceName || 'Official'}</span>
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

const StatPill = ({ label, count, color, icon }) => (
  <div className="flex items-center gap-2.5 min-w-[8.5rem] rounded-xl bg-white border border-slate-200/80 px-3 py-2.5 shadow-sm">
    <span
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white shrink-0"
      style={{ backgroundColor: color }}
    >
      <CatIcon name={icon} className="w-4 h-4" />
    </span>
    <div className="min-w-0">
      <p className="text-base font-bold text-slate-900 tabular-nums leading-none">{count}+</p>
      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{label}</p>
    </div>
  </div>
);

/**
 * Homepage block: category feeds + premium Government Notifications UI.
 * Scopes: All | Central | Tamil Nadu | Jobs → `/public/list` level + category.
 */
const GovernmentNotificationsSection = () => {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('all');
  const [activeCat, setActiveCat] = useState('all');
  const [sectionVisible, setSectionVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = buildListParams(scope, activeCat);
        const listRes = await governmentNotificationService.getPublicList(params);
        if (cancelled) return;

        let listItems = listRes.data?.data || [];
        // Default All: prefer Central + Tamil Nadu only
        if (scope === 'all') {
          const govOnly = listItems.filter((i) => isGovLevel(i.level || 'central'));
          if (govOnly.length) listItems = govOnly;
        }

        const titles = {
          latest: listRes.data?.titles?.latest || 'Government Notifications',
          latestTa: listRes.data?.titles?.latestTa || 'அரசு அறிவிப்புகள்',
        };

        // Fallback: hub/public when list empty on All
        if (!listItems.length && scope === 'all' && activeCat === 'all') {
          try {
            const { data } = await governmentNotificationService.getPublic({ limit: 12 });
            if (cancelled) return;
            const latest = data?.data?.latest || [];
            const alerts = data?.data?.alerts || [];
            const merged = [...latest, ...alerts].filter((i) => isGovLevel(i.level || 'central'));
            if (merged.length || data?.enabled) {
              setPayload({
                success: true,
                enabled: data?.enabled !== false,
                data: {
                  latest: merged,
                  alerts: [],
                  titles: {
                    latest: data?.data?.titles?.latest || titles.latest,
                    latestTa: data?.data?.titles?.latestTa || titles.latestTa,
                  },
                  widgets: { latest: true, alerts: false },
                },
              });
              if (merged.length) setSectionVisible(true);
              return;
            }
          } catch {
            /* keep list path */
          }
        }

        setPayload({
          success: true,
          enabled: listRes.data?.enabled !== false,
          data: {
            latest: listItems,
            alerts: [],
            titles,
            widgets: { latest: true, alerts: false },
          },
        });
        if (scope === 'all' && activeCat === 'all' && listItems.length) {
          setSectionVisible(true);
        }
      } catch {
        if (!cancelled) setPayload(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, activeCat]);

  const enabled = payload?.enabled !== false;
  const { latest = [], titles = {} } = payload?.data || {};

  const pool = useMemo(() => {
    const map = new Map();
    latest.forEach((item, idx) => {
      if (!item) return;
      const key = String(item._id || item.officialUrl || item.title || idx);
      map.set(key, item);
    });
    return Array.from(map.values());
  }, [latest]);

  const filtered = pool;

  const selectScope = (key) => {
    setScope(key);
    setActiveCat('all');
  };

  const selectCategory = (key) => {
    // Leaving Jobs scope when picking a content category
    if (scope === 'jobs') setScope('all');
    setActiveCat(key);
  };

  const stats = useMemo(() => {
    const counts = {};
    pool.forEach((i) => {
      const k = i.category || 'general';
      counts[k] = (counts[k] || 0) + 1;
    });
    const levelCounts = { central: 0, tamil_nadu: 0 };
    pool.forEach((i) => {
      const lv = i.level || 'central';
      if (lv === 'central' || lv === 'tamil_nadu') levelCounts[lv] += 1;
    });
    return {
      categories: [
        { key: 'announcement', color: '#E50914' },
        { key: 'public_notice', color: '#2563eb' },
        { key: 'job', color: '#1e3a8a' },
        { key: 'scheme', color: '#059669' },
        { key: 'circular', color: '#0b1f4a' },
      ].map((row) => ({
        ...row,
        label: catMeta(row.key).label,
        icon: catMeta(row.key).icon,
        count: counts[row.key] || 0,
      })),
      levels: levelCounts,
    };
  }, [pool]);

  const showBlock = sectionVisible && enabled;
  const featuredItems = filtered;
  const sideItems = featuredItems.slice(1, 5);

  const emptyMessage = (() => {
    if (scope === 'jobs') return 'No job / appointment notifications right now.';
    if (activeCat !== 'all') {
      return `No ${catMeta(activeCat).label.toLowerCase()} in this view. Try All or another category.`;
    }
    if (scope === 'tamil_nadu') {
      return 'No Tamil Nadu notifications yet. Central updates still appear under All / Central.';
    }
    if (scope === 'central') return 'No Central government notifications in this view.';
    return 'No notifications in this filter.';
  })();

  const jsonLd =
    showBlock
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: titles.latest || 'Government Notifications',
          itemListElement: pool.slice(0, 8).map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.title,
            url: item.officialUrl || undefined,
            datePublished: item.publishedAt,
          })),
        }
      : null;

  return (
    <section className="mb-10 min-w-0">
      {jsonLd && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        </Helmet>
      )}

      {showBlock && (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-b from-slate-50 via-white to-slate-50 shadow-[0_8px_40px_rgba(11,31,74,0.08)]">
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
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-1/2 opacity-20 hidden md:block">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 400 200\'%3E%3Cpath fill=\'%23ffffff\' opacity=\'0.15\' d=\'M0 160 L40 120 L80 140 L120 80 L160 110 L200 40 L240 90 L280 60 L320 100 L360 50 L400 70 L400 200 L0 200Z\'/%3E%3C/svg%3E")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'right bottom',
                }}
              />
            </div>

            <div className="relative z-[1] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="gov-notif-float shrink-0">
                  <EmblemMark />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl md:text-[1.7rem] font-bold text-white font-tamil leading-tight">
                    {titles.latestTa || 'அரசு அறிவிப்புகள்'}
                  </h2>
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
          </div>

          <div className="px-4 sm:px-6 py-5 space-y-3">
            {/* Level scopes: 2×2 on mobile, 4 columns on sm+ — equal hit targets, no horizontal squeeze */}
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
                    aria-label={`${tab.label} / ${tab.labelTa}`}
                    onClick={() => selectScope(tab.key)}
                    className={`relative z-[1] min-h-[44px] w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs sm:text-sm font-semibold transition-colors ${
                      active
                        ? 'text-white shadow-md'
                        : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                    }`}
                    style={active ? { backgroundColor: ACCENT } : undefined}
                  >
                    <CatIcon name={tab.icon} className="w-4 h-4 shrink-0 pointer-events-none" />
                    <span className="leading-snug text-center pointer-events-none">
                      <span className="font-tamil sm:hidden">{tab.labelTa}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Categories: wrap on all screens so every option stays visible & tappable */}
            <div
              role="tablist"
              aria-label="Notification category"
              className="flex flex-wrap gap-1.5"
            >
              {CATEGORY_CHIPS.map((key) => {
                const meta = catMeta(key);
                const active = scope !== 'jobs' && activeCat === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-label={meta.label}
                    onClick={() => selectCategory(key)}
                    className={`relative z-[1] min-h-[40px] inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold border transition-colors ${
                      active
                        ? 'text-white border-transparent shadow-sm'
                        : 'text-slate-700 border-slate-200 bg-white hover:border-slate-300 active:bg-slate-50'
                    }`}
                    style={active ? { backgroundColor: meta.tone } : undefined}
                  >
                    <CatIcon name={meta.icon} className="w-3.5 h-3.5 shrink-0 pointer-events-none" />
                    <span className="leading-snug pointer-events-none">
                      <span className="font-tamil sm:hidden">{meta.shortTa || meta.short}</span>
                      <span className="hidden sm:inline">{meta.short}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {scope === 'jobs' && (
              <p className="text-[11px] text-slate-500 px-0.5">
                Showing jobs / appointments · pick a category above to browse other types
              </p>
            )}

            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-100 animate-pulse min-h-[280px]" />
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-slate-500 py-10 text-center rounded-2xl border border-dashed border-slate-200 bg-white px-4">
                {emptyMessage}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 items-start">
                  <FeaturedHero items={featuredItems} />
                  <div className="flex flex-col gap-3 min-w-0 w-full">
                    {sideItems.length > 0 ? (
                      sideItems.map((item, idx) => (
                        <SideCard key={item._id || item.officialUrl || `side-${idx}`} item={item} />
                      ))
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                        More notifications will appear here as they are published.
                      </div>
                    )}
                  </div>
                </div>

                {featuredItems.length > 5 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {featuredItems.slice(5, 11).map((item, idx) => (
                      <SideCard key={item._id || item.officialUrl || `extra-${idx}`} item={item} />
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur p-3 sm:p-4 shadow-sm">
              <div className="flex flex-col xl:flex-row xl:items-center gap-3 xl:gap-4">
                <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 xl:pb-0 flex-1 min-w-0">
                  <StatPill
                    label="Central"
                    count={stats.levels.central}
                    color="#1e3a8a"
                    icon="book"
                  />
                  <StatPill
                    label="Tamil Nadu"
                    count={stats.levels.tamil_nadu}
                    color="#0f766e"
                    icon="sprout"
                  />
                  {stats.categories
                    .filter((s) => s.count > 0)
                    .slice(0, 3)
                    .map((s) => (
                      <StatPill
                        key={s.key}
                        label={s.label}
                        count={s.count}
                        color={s.color}
                        icon={s.icon}
                      />
                    ))}
                </div>
                <Link
                  to="/government-notifications"
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3 text-sm font-bold text-white shadow-lg hover:brightness-110 transition"
                  style={{ backgroundColor: ACCENT }}
                >
                  View All Notifications →
                </Link>
              </div>
            </div>
          </div>

          <div className="h-1.5 w-full flex" aria-hidden="true">
            <span className="flex-1 bg-[#FF9933]" />
            <span className="flex-1 bg-white relative">
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full border border-[#000080]/60" />
              </span>
            </span>
            <span className="flex-1 bg-[#138808]" />
          </div>
        </div>
      )}

      <style>{`
        @keyframes gov-notif-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .gov-notif-float { animation: gov-notif-float 3.5s ease-in-out infinite; }
      `}</style>
    </section>
  );
};

export default GovernmentNotificationsSection;
