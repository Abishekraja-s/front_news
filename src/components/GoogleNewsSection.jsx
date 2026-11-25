import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { googleNewsService } from '../services/articleService';
import NewsImage from './NewsImage';
import { getGoogleNewsExcerpt } from '../utils/text';
import { formatDateTime } from '../utils/helpers';

const NEWS_RED = '#E50914';

/** Flexible matchers — DB categories are often empty or inconsistent, so we match keywords too */
const NAV_CATEGORIES = [
  {
    id: 'all',
    label: 'All News',
    categoryAliases: [],
    keywords: [],
  },
  {
    id: 'tamil-nadu',
    label: 'Tamil Nadu',
    categoryAliases: ['tamil nadu', 'tamilnadu', 'tn'],
    keywords: [
      'tamil nadu',
      'tamilnadu',
      'chennai',
      'madurai',
      'coimbatore',
      'trichy',
      'tiruchy',
      'salem',
      'erode',
      'tirunelveli',
      'thanjavur',
      'vellore',
      'dmk',
      'aiadmk',
      'stalin',
    ],
  },
  {
    id: 'india',
    label: 'India',
    categoryAliases: ['nation', 'india', 'national', 'indian', 'nations'],
    keywords: [
      'india',
      'indian',
      'nation',
      'delhi',
      'mumbai',
      'kolkata',
      'bengaluru',
      'bangalore',
      'hyderabad',
      'modi',
      'lok sabha',
      'rajya sabha',
      'supreme court',
      'centre',
      'central government',
    ],
  },
  {
    id: 'world',
    label: 'World',
    /** Google News RSS / DB topic codes */
    categoryAliases: ['world', 'international', 'global', 'world news'],
    keywords: [
      'united nations',
      'white house',
      'pentagon',
      'nato',
      'ukraine',
      'gaza',
      'israel',
      'beijing',
      'moscow',
      'washington',
      'london',
      'paris',
      'tokyo',
      'middle east',
    ],
  },
  {
    id: 'politics',
    label: 'Politics',
    categoryAliases: ['politics', 'political'],
    keywords: [
      'politics',
      'political',
      'election',
      'minister',
      'parliament',
      'assembly',
      'party',
      'bjp',
      'congress',
      'cabinet',
      'cm ',
      'chief minister',
    ],
  },
  {
    id: 'business',
    label: 'Business',
    categoryAliases: ['business', 'economy', 'finance'],
    keywords: [
      'business',
      'economy',
      'market',
      'stock',
      'bank',
      'finance',
      'rupee',
      'gdp',
      'company',
      'startup',
      'trade',
      'sensex',
      'nifty',
    ],
  },
  {
    id: 'sports',
    label: 'Sports',
    categoryAliases: ['sports', 'sport'],
    keywords: [
      'sports',
      'cricket',
      'football',
      'tennis',
      'ipl',
      'hockey',
      'olympics',
      'match',
      'tournament',
      'player',
      'world cup',
    ],
  },
  {
    id: 'technology',
    label: 'Technology',
    categoryAliases: ['technology', 'tech', 'science'],
    keywords: [
      'technology',
      'tech',
      'ai ',
      'artificial intelligence',
      'smartphone',
      'app ',
      'cyber',
      'software',
      'google',
      'apple',
      'microsoft',
      'internet',
      'digital',
    ],
  },
  {
    id: 'health',
    label: 'Health',
    categoryAliases: ['health', 'medical'],
    keywords: [
      'health',
      'hospital',
      'medical',
      'doctor',
      'covid',
      'vaccine',
      'disease',
      'medicine',
      'aiims',
      'wellness',
    ],
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    categoryAliases: ['entertainment', 'cinema', 'movie'],
    keywords: [
      'entertainment',
      'cinema',
      'movie',
      'film',
      'actor',
      'actress',
      'kollywood',
      'bollywood',
      'music',
      'song',
      'ott',
      'tv show',
    ],
  },
];

/** Map homepage tabs → Google News API `category` query (DB stores WORLD, NATION, …) */
const API_CATEGORY_BY_NAV = {
  world: 'WORLD',
  india: 'NATION',
  business: 'BUSINESS',
  technology: 'TECHNOLOGY',
  sports: 'SPORTS',
  health: 'HEALTH',
  entertainment: 'ENTERTAINMENT',
};

function itemSearchText(item) {
  return `${item?.title || ''} ${item?.excerpt || ''} ${item?.description || ''} ${item?.category || ''} ${item?.sourceName || ''}`.toLowerCase();
}

function matchesNavCategory(item, cat) {
  if (!cat || cat.id === 'all') return true;
  const hay = itemSearchText(item);
  const catField = String(item?.category || '').toLowerCase().trim();

  // Prefer exact / alias match on Google topic field (WORLD, NATION, …)
  if (catField) {
    if (cat.categoryAliases?.some((a) => {
      const alias = String(a).toLowerCase();
      return catField === alias || catField.includes(alias);
    })) {
      return true;
    }
    // If item already has a clear Google topic, don't keyword-steal into other tabs
    const knownTopics = ['world', 'nation', 'business', 'technology', 'sports', 'health', 'entertainment'];
    if (knownTopics.some((t) => catField === t || catField.includes(t))) {
      return false;
    }
  }

  if (cat.keywords?.some((k) => k && hay.includes(k.toLowerCase()))) return true;
  return false;
}

const BADGE_TONES = [
  { bg: '#fce7f3', fg: '#9d174d' },
  { bg: '#ede9fe', fg: '#5b21b6' },
  { bg: '#dbeafe', fg: '#1d4ed8' },
  { bg: '#dcfce7', fg: '#15803d' },
  { bg: '#ffedd5', fg: '#c2410c' },
  { bg: '#e0e7ff', fg: '#3730a3' },
];

function itemHref(item) {
  return item?.slug ? `/news/${item.slug}` : null;
}

function hasUsableImage(item) {
  const img = item?.image?.trim();
  if (!img) return false;
  if (img.includes('picsum.photos') || img.includes('googleusercontent.com')) return false;
  return true;
}

function imageSeed(item) {
  return item?.guid || item?.slug || item?._id || item?.title || 'news';
}

function categoryTone(label = '') {
  let h = 0;
  for (let i = 0; i < label.length; i += 1) h = (h + label.charCodeAt(i) * (i + 1)) % BADGE_TONES.length;
  return BADGE_TONES[h];
}

function displayCategory(item) {
  const raw = String(item?.category || '').trim();
  if (!raw) return 'News';
  const map = {
    NATION: 'India',
    WORLD: 'World',
    BUSINESS: 'Business',
    TECHNOLOGY: 'Technology',
    SPORTS: 'Sports',
    HEALTH: 'Health',
    ENTERTAINMENT: 'Entertainment',
  };
  return map[raw.toUpperCase()] || raw.replace(/_/g, ' ');
}

const GoogleGIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const TrendingIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
  </svg>
);

const CatIcon = ({ id, className = 'w-3.5 h-3.5' }) => {
  const common = { className, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'aria-hidden': true };
  switch (id) {
    case 'tamil-nadu':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-10.922L12 14z" />
        </svg>
      );
    case 'business':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'health':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case 'sports':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a15 15 0 010 20M12 2a15 15 0 000 20M2 12h20" />
        </svg>
      );
    case 'technology':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
        </svg>
      );
  }
};

const Thumb = ({ item, className = '', eager = false }) => {
  if (hasUsableImage(item)) {
    return (
      <NewsImage
        src={item.image}
        seed={imageSeed(item)}
        alt={item.title || ''}
        noPlaceholder
        className={className}
        loading={eager ? 'eager' : 'lazy'}
      />
    );
  }
  return (
    <div className={`bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center ${className}`}>
      <span className="text-[10px] font-semibold text-slate-600 px-2 text-center line-clamp-2">
        {item.sourceName || 'News'}
      </span>
    </div>
  );
};

const FeaturedCard = ({ item }) => {
  const href = itemHref(item);
  if (!href || !item) return null;
  const excerpt = getGoogleNewsExcerpt(item);
  const cat = displayCategory(item);

  return (
    <Link
      to={href}
      className="group flex flex-col h-full overflow-hidden rounded-2xl bg-white border border-stone-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.06)] hover:shadow-[0_10px_28px_rgba(15,23,42,0.1)] transition-shadow duration-300"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-100 shrink-0">
        <Thumb
          item={item}
          eager
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <span
          className="absolute top-3 left-3 inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold text-white shadow-sm"
          style={{ backgroundColor: NEWS_RED }}
        >
          {cat}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <span
          className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white mb-2"
          style={{ backgroundColor: NEWS_RED }}
        >
          <TrendingIcon className="w-3 h-3" />
          Trending
        </span>
        <h3
          className="text-lg sm:text-xl md:text-[1.35rem] font-bold text-slate-900 group-hover:text-red-700 transition-colors line-clamp-3"
          style={{ lineHeight: 1.4 }}
        >
          {item.title}
        </h3>
        {excerpt ? (
          <p className="mt-2 text-sm text-slate-600 line-clamp-2 leading-relaxed">{excerpt}</p>
        ) : null}
        <div className="mt-auto pt-3 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{item.sourceName || 'Source'}</span>
          {item.publishedAt ? (
            <>
              <span className="text-slate-300">•</span>
              <time dateTime={item.publishedAt}>{formatDateTime(item.publishedAt)}</time>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  );
};

const SideNewsRow = ({ item, index }) => {
  const href = itemHref(item);
  if (!href || !item) return null;
  const cat = displayCategory(item);
  const tone = categoryTone(cat);

  return (
    <Link
      to={href}
      className="group flex items-stretch gap-3 rounded-xl bg-white border border-stone-200/80 p-2.5 sm:p-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.1)] hover:border-stone-300 transition-all duration-300"
    >
      <div className="relative shrink-0 w-[5.5rem] sm:w-28 aspect-[4/3] overflow-hidden rounded-lg bg-stone-100">
        <Thumb item={item} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
        {index === 0 ? (
          <span
            className="absolute top-1 left-1 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[8px] font-bold text-white"
            style={{ backgroundColor: NEWS_RED }}
          >
            <TrendingIcon className="w-2.5 h-2.5" />
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 flex flex-col justify-center py-0.5">
        <h4
          className="text-[13px] sm:text-sm font-bold text-slate-900 group-hover:text-red-700 transition-colors line-clamp-2"
          style={{ lineHeight: 1.45 }}
        >
          {item.title}
        </h4>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-[11px] text-slate-500">
          <span className="font-semibold text-slate-600 truncate max-w-[9rem]">{item.sourceName || 'Source'}</span>
          {item.publishedAt ? (
            <>
              <span className="text-slate-300">|</span>
              <time dateTime={item.publishedAt} className="shrink-0">
                {formatDateTime(item.publishedAt)}
              </time>
            </>
          ) : null}
        </div>
      </div>

      <span
        className="hidden sm:inline-flex self-center shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold max-w-[5.5rem] truncate"
        style={{ backgroundColor: tone.bg, color: tone.fg }}
      >
        {cat}
      </span>
    </Link>
  );
};

const MiniCard = ({ item }) => {
  const href = itemHref(item);
  if (!href || !item) return null;
  return (
    <Link
      to={href}
      className="group flex gap-3 rounded-xl border border-stone-200/80 bg-white p-2.5 hover:shadow-md transition-all"
    >
      <div className="shrink-0 w-16 h-16 overflow-hidden rounded-lg bg-stone-100">
        <Thumb item={item} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-red-700" style={{ lineHeight: 1.45 }}>
          {item.title}
        </h4>
        <p className="mt-1 text-[10px] text-slate-500 truncate">{item.sourceName}</p>
      </div>
    </Link>
  );
};

const SkeletonBlock = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-10 bg-stone-100 rounded-xl w-2/3" />
    <div className="h-11 bg-stone-100 rounded-xl" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="h-72 lg:h-[440px] bg-stone-100 rounded-2xl" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-[4.5rem] bg-stone-100 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

/** Stable identity for Google News items (id → slug → normalized title) */
const newsItemKey = (item) => {
  if (!item) return '';
  const id = String(item._id || '').trim();
  if (id) return `id:${id}`;
  const slug = String(item.slug || '').trim();
  if (slug) return `slug:${slug}`;
  const title = String(item.title || item.titleTamil || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  return title ? `title:${title}` : '';
};

/** Drop duplicate stories from a list */
const dedupeNews = (list = []) => {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (!item) continue;
    const key = newsItemKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
};

/** Take next N unused items; marks keys in `used` */
const takeUnique = (source = [], count, used) => {
  const out = [];
  for (const item of source) {
    if (out.length >= count) break;
    const key = newsItemKey(item);
    if (!key || used.has(key)) continue;
    used.add(key);
    out.push(item);
  }
  return out;
};

/**
 * Premium Google News homepage section — live API data only.
 * Loads a shared pool, then filters client-side so every tab can show stories
 * even when Mongo category fields are empty / inconsistent.
 */
const GoogleNewsSection = () => {
  const [activeCat, setActiveCat] = useState('all');
  const [pool, setPool] = useState([]);
  const [mustRead, setMustRead] = useState([]);
  const [title, setTitle] = useState('Google News');
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  /** Cached topic counts from API distinct categories / fetches */
  const [topicCounts, setTopicCounts] = useState({});

  const activeNav = useMemo(
    () => NAV_CATEGORIES.find((c) => c.id === activeCat) || NAV_CATEGORIES[0],
    [activeCat]
  );

  const load = useCallback(async (pageNum = 1, append = false, navId = 'all') => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const apiCategory = API_CATEGORY_BY_NAV[navId] || undefined;
      const listParams = {
        page: pageNum,
        limit: 40,
      };
      // Try topic filter first (WORLD / NATION / …) when DB categories are populated
      if (apiCategory) listParams.category = apiCategory;

      const [{ data }, mustRes] = await Promise.all([
        googleNewsService.getPublicList(listParams),
        pageNum === 1 && (navId === 'all' || Boolean(apiCategory))
          ? googleNewsService.getMustPicks('must-read', 8).catch(() => ({ data: { data: [] } }))
          : Promise.resolve(null),
      ]);

      if (data.enabled === false && pageNum === 1 && navId === 'all') {
        setEnabled(false);
        setPool([]);
        return;
      }

      setEnabled(true);
      let next = dedupeNews(data.data || []);
      let usedApiTopic = Boolean(apiCategory) && next.length > 0;

      // Many items have empty `category` — WORLD/NATION API filter returns 0.
      // Fall back to a general pool and filter client-side so the section stays visible.
      if (apiCategory && next.length === 0 && pageNum === 1) {
        try {
          const fallback = await googleNewsService.getPublicList({ page: 1, limit: 40 });
          if (fallback.data?.enabled === false) {
            setEnabled(false);
            return;
          }
          next = dedupeNews(fallback.data?.data || []);
          usedApiTopic = false;
          setTitle(fallback.data?.title || data.title || 'Google News');
          setPage(fallback.data?.pagination?.page || 1);
          setPages(fallback.data?.pagination?.pages || 1);
        } catch {
          /* keep empty next — UI shows empty state, not a hidden section */
        }
      } else {
        setTitle(data.title || 'Google News');
        setPage(data.pagination?.page || pageNum);
        setPages(data.pagination?.pages || 1);
      }

      setPool((prev) => {
        if (!append) return next;
        return dedupeNews([...prev, ...next]);
      });
      if (mustRes) setMustRead(dedupeNews(mustRes.data?.data || []));

      // Store totals for tabs (0 from API still useful — UI can fall back to client counts)
      if (apiCategory && data.pagination?.total != null) {
        const apiTotal = data.pagination.total;
        setTopicCounts((prev) => ({
          ...prev,
          [navId]: apiTotal > 0 ? apiTotal : prev[navId],
          [`${navId}ApiEmpty`]: apiTotal === 0 && !usedApiTopic,
        }));
      } else if (navId === 'all') {
        const allTotal = data.pagination?.total ?? next.length;
        setTopicCounts((prev) => ({ ...prev, all: allTotal }));
        const topicEntries = Object.entries(API_CATEGORY_BY_NAV);
        Promise.all(
          topicEntries.map(async ([navKey, apiCat]) => {
            try {
              const res = await googleNewsService.getPublicList({
                page: 1,
                limit: 1,
                category: apiCat,
              });
              return [navKey, res.data?.pagination?.total ?? 0];
            } catch {
              return [navKey, 0];
            }
          })
        ).then((rows) => {
          setTopicCounts((prev) => {
            const nextCounts = { ...prev, all: allTotal };
            rows.forEach(([navKey, total]) => {
              nextCounts[navKey] = total;
            });
            return nextCounts;
          });
        });
      }
    } catch {
      // Keep previous pool on tab errors so the section does not vanish
      if (!append && navId === 'all') {
        setPool([]);
        setEnabled(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Refetch when category tab changes (World → category=WORLD, etc.)
  useEffect(() => {
    load(1, false, activeCat);
  }, [load, activeCat]);

  const items = useMemo(() => {
    if (activeNav.id === 'all') return dedupeNews(pool);

    const matched = pool.filter((item) => matchesNavCategory(item, activeNav));
    // API-scoped topic results (non-empty category field) — trust pool when matched empty
    const hasTopicField = pool.some((item) => {
      const c = String(item?.category || '').trim().toUpperCase();
      return Boolean(c) && c === (API_CATEGORY_BY_NAV[activeNav.id] || '');
    });
    if (hasTopicField && matched.length === 0) return dedupeNews(pool);
    if (matched.length > 0) return dedupeNews(matched);
    // Keyword / empty-category fallback: still show stories instead of hiding the section
    if (activeNav.id !== 'all') return dedupeNews(pool);
    return dedupeNews(matched);
  }, [pool, activeNav]);

  const catCounts = useMemo(() => {
    const counts = { all: topicCounts.all ?? pool.length };
    NAV_CATEGORIES.forEach((cat) => {
      if (cat.id === 'all') return;
      if (topicCounts[cat.id] != null) {
        counts[cat.id] = topicCounts[cat.id];
        return;
      }
      if (API_CATEGORY_BY_NAV[cat.id] && activeCat === cat.id) {
        counts[cat.id] = pool.length;
        return;
      }
      const n = pool.filter((item) => matchesNavCategory(item, cat)).length;
      counts[cat.id] = n;
    });
    return counts;
  }, [pool, topicCounts, activeCat]);

  /** Partition unique stories across UI blocks — no cross-section repeats */
  const { featured, sideList, latestExtra, mostReadList, topStoriesList } = useMemo(() => {
    const used = new Set();
    const featuredItem = takeUnique(items, 1, used)[0] || null;
    const side = takeUnique(items, 5, used);
    const latest = takeUnique(items, 4, used);

    let most = takeUnique(mustRead, 4, used);
    if (most.length < 4) {
      most = [...most, ...takeUnique(items, 4 - most.length, used)];
    }

    const topPref = items.filter((i) => i.isMustWatch || i.isMustRead);
    let top = takeUnique(topPref, 4, used);
    if (top.length < 4) {
      top = [...top, ...takeUnique(items, 4 - top.length, used)];
    }

    return {
      featured: featuredItem,
      sideList: side,
      latestExtra: latest,
      mostReadList: most,
      topStoriesList: top,
    };
  }, [items, mustRead]);

  // Only hide when Google News is disabled — never hide the whole block on an empty World/topic tab
  if (!loading && !enabled) return null;

  return (
    <section className="mb-10 rounded-2xl bg-white border border-stone-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-4 sm:p-5 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-stone-200 shadow-sm">
              <GoogleGIcon className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-sm"
              style={{ backgroundColor: NEWS_RED }}
            >
              <TrendingIcon />
              Trending Now
            </span>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
            Top stories from Google News • Tamil Nadu • India • World
          </p>
        </div>

        <a
          href="https://news.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="self-start inline-flex items-center gap-2 rounded-full border bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-red-50 transition-colors shadow-sm"
          style={{ borderColor: NEWS_RED }}
        >
          <GoogleGIcon className="w-4 h-4" />
          View on Google News
          <span aria-hidden="true" style={{ color: NEWS_RED }}>
            ↗
          </span>
        </a>
      </div>

      {/* Category nav */}
      <div
        className="mb-5 -mx-1 px-1 overflow-x-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}
      >
        <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1.5 rounded-xl bg-stone-100/90 p-1.5">
          {NAV_CATEGORIES.map((cat) => {
            const active = cat.id === activeCat;
            const count = catCounts[cat.id] ?? 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCat(cat.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  active ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                }`}
                style={active ? { backgroundColor: NEWS_RED } : undefined}
              >
                <CatIcon id={cat.id} />
                {cat.label}
                {pool.length > 0 && (
                  <span className={`text-[10px] tabular-nums ${active ? 'text-white/80' : 'text-slate-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <SkeletonBlock />
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500 py-10 text-center">No stories in this category right now.</p>
      ) : (
        <>
          {/* Featured + side list */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 items-stretch">
            <FeaturedCard item={featured} />
            <div className="flex flex-col gap-2.5 sm:gap-3 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <h3 className="text-sm font-bold text-slate-900">Latest Trending</h3>
                <Link to="/google-news" className="text-xs font-semibold hover:underline" style={{ color: NEWS_RED }}>
                  View All →
                </Link>
              </div>
              {sideList.map((item, idx) => (
                <SideNewsRow key={newsItemKey(item) || `side-${idx}`} item={item} index={idx} />
              ))}
            </div>
          </div>

          {/* Extra sections — each story appears in only one column */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-3.5">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: NEWS_RED }} />
                Latest Updates
              </h3>
              <div className="space-y-2.5">
                {latestExtra.map((item, idx) => (
                  <MiniCard key={`latest-${newsItemKey(item) || idx}`} item={item} />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-3.5">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Most Read News
              </h3>
              <div className="space-y-2.5">
                {mostReadList.map((item, idx) => (
                  <MiniCard key={`must-${newsItemKey(item) || idx}`} item={item} />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-3.5">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Top Stories
              </h3>
              <div className="space-y-2.5">
                {topStoriesList.map((item, idx) => (
                  <MiniCard key={`top-${newsItemKey(item) || idx}`} item={item} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            {page < pages && (
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => load(page + 1, true, activeCat)}
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-60 transition"
                style={{ backgroundColor: NEWS_RED }}
              >
                {loadingMore ? 'Loading…' : 'Load More'}
              </button>
            )}
            <Link
              to="/google-news"
              className="inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold hover:bg-red-50 transition"
              style={{ borderColor: NEWS_RED, color: NEWS_RED }}
            >
              View All News →
        </Link>
      </div>
        </>
      )}
    </section>
  );
};

export default GoogleNewsSection;
