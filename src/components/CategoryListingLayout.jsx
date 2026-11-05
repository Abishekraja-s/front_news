import { Link } from 'react-router-dom';
import NewsImage from './NewsImage';
import { getArticlePath } from '../utils/articlePaths';

const formatDate = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const Meta = ({ article, className = 'text-xs text-slate-500' }) => {
  const date = formatDate(article.publishedAt || article.updatedAt);
  if (!date) return null;
  return <time className={className}>{date}</time>;
};

/** Full-bleed image fill (object-cover) — no letterbox bars */
const Img = ({ article, className = '', loading = 'lazy' }) => (
  <NewsImage
    src={article.featuredImage}
    seed={article.slug}
    alt={article.imageAlt || article.title}
    className={`w-full h-full object-cover object-center ${className}`}
    loading={loading}
    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
  />
);

/* ——— Card primitives (structurally different) ——— */

/** Image card — fills frame on desktop; 2-up friendly on mobile */
const CardPortrait = ({ article }) => (
  <Link to={getArticlePath(article)} className="group flex flex-col">
    <div className="aspect-[4/3] sm:aspect-[4/5] lg:aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 ring-1 ring-black/5 shadow-sm">
      <Img article={article} className="group-hover:scale-[1.04] transition-transform duration-500" />
    </div>
    <Meta article={article} className="text-[11px] text-slate-400 mt-2.5 block" />
    <h3 className="mt-1 text-sm sm:text-base font-bold text-slate-900 group-hover:text-teal-800 line-clamp-3 leading-snug font-headline">
      {article.title}
    </h3>
  </Link>
);

/** Wide landscape elevated card */
const CardLandscape = ({ article, accentHover = 'group-hover:text-teal-800' }) => (
  <Link
    to={getArticlePath(article)}
    className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-stone-200 shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.1)] transition-all"
  >
    <div className="aspect-[16/10] overflow-hidden bg-stone-100">
      <Img article={article} className="group-hover:scale-[1.04] transition-transform duration-500" />
    </div>
    <div className="p-4 sm:p-5">
      <Meta article={article} className="text-[11px] font-medium text-slate-400 mb-1.5" />
      <h3 className={`text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-3 font-headline ${accentHover}`}>
        {article.title}
      </h3>
      {article.excerpt && (
        <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">{article.excerpt}</p>
      )}
    </div>
  </Link>
);

/** Horizontal strip — stacked image on mobile for clarity */
const CardStrip = ({ article, bar = 'bg-teal-500' }) => (
  <Link
    to={getArticlePath(article)}
    className="group flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-stone-200 bg-white hover:shadow-md transition-all"
  >
    <div className={`hidden sm:block w-1.5 shrink-0 ${bar}`} />
    <div className="w-full sm:w-40 md:w-48 shrink-0 aspect-[16/10] sm:aspect-[4/3] overflow-hidden bg-stone-100">
      <Img article={article} className="group-hover:scale-[1.04] transition-transform duration-500" />
    </div>
    <div className="flex-1 p-3.5 sm:p-4 min-w-0 self-center">
      <div className={`sm:hidden h-1 w-10 rounded-full mb-2.5 ${bar}`} />
      <Meta article={article} />
      <h3 className="mt-0.5 text-sm sm:text-base font-bold text-slate-900 group-hover:text-teal-800 leading-snug line-clamp-3 font-headline">
        {article.title}
      </h3>
    </div>
  </Link>
);

/**
 * Numbered list card — large clear image on mobile;
 * desktop keeps number + wide thumb + headline.
 */
const CardTypeFirst = ({ article, index }) => {
  const num = String((index ?? 0) + 1).padStart(2, '0');
  return (
    <Link
      to={getArticlePath(article)}
      className="group block py-4 sm:py-5 border-b border-stone-200 last:border-0"
    >
      {/* Mobile: number + title, then full-width image */}
      <div className="sm:hidden">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl font-black text-teal-600/80 leading-none tabular-nums shrink-0">
            {num}
          </span>
          <h3 className="flex-1 text-base font-bold text-slate-900 group-hover:text-teal-800 leading-snug font-headline">
            {article.title}
          </h3>
        </div>
        <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-stone-100 ring-1 ring-black/5">
          <Img article={article} className="group-hover:scale-[1.04] transition-transform duration-500" />
        </div>
        <Meta article={article} className="text-[11px] text-slate-400 mt-2 block" />
      </div>

      {/* Desktop: number | large thumb | text */}
      <div className="hidden sm:grid sm:grid-cols-[auto_160px_1fr] sm:gap-4 sm:items-center">
        <span className="text-4xl font-black text-stone-200 leading-none tabular-nums group-hover:text-teal-300 transition-colors">
          {num}
        </span>
        <div className="aspect-[16/10] rounded-xl overflow-hidden bg-stone-100 ring-1 ring-black/5">
          <Img article={article} className="group-hover:scale-[1.04] transition-transform duration-500" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-teal-800 leading-snug font-headline">
            {article.title}
          </h3>
          <Meta article={article} className="text-xs text-slate-500 mt-2 block" />
        </div>
      </div>
    </Link>
  );
};

/** Tile — full-bleed image fill */
const CardTile = ({ article }) => (
  <Link to={getArticlePath(article)} className="group block">
    <div className="aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden bg-stone-100 ring-1 ring-black/5">
      <Img article={article} className="group-hover:scale-[1.04] transition-transform duration-500" />
    </div>
    <h3 className="mt-2 text-sm font-bold text-slate-900 group-hover:text-orange-700 line-clamp-2 leading-snug">
      {article.title}
    </h3>
  </Link>
);

/** Short-news card — wide image on mobile, compact pill on desktop */
const CardPill = ({ article }) => (
  <Link
    to={getArticlePath(article)}
    className="group flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl sm:rounded-full border border-stone-200 bg-white p-2 sm:pl-1.5 sm:pr-4 sm:py-1.5 hover:border-slate-400 hover:shadow-sm transition-all"
  >
    <div className="w-full sm:w-12 aspect-[16/10] sm:aspect-square sm:h-12 rounded-xl sm:rounded-full overflow-hidden shrink-0 bg-stone-100">
      <Img article={article} />
    </div>
    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-slate-700 line-clamp-2 leading-snug px-1 sm:px-0 pb-1 sm:pb-0">
      {article.title}
    </h3>
  </Link>
);

/** Job / notice board card */
const CardNotice = ({ article, label = 'Update' }) => (
  <Link
    to={getArticlePath(article)}
    className="group relative rounded-xl border border-dashed border-slate-300 bg-amber-50/40 p-4 hover:border-teal-400 hover:bg-white transition-all"
  >
    <span className="absolute -top-2 left-3 text-[10px] font-bold uppercase tracking-wider bg-teal-600 text-white px-2 py-0.5 rounded">
      {label}
    </span>
    <div className="flex gap-3 mt-1">
      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-stone-100">
        <Img article={article} />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-teal-800 line-clamp-3 leading-snug self-center">
        {article.title}
      </h3>
    </div>
  </Link>
);

/** Split: image half / text half side-by-side */
const CardSplit = ({ article, reverse = false }) => (
  <Link
    to={getArticlePath(article)}
    className={`group flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm hover:shadow-md transition-all ${
      reverse ? 'sm:flex-row-reverse' : ''
    }`}
  >
    <div className="sm:w-1/2 aspect-[16/10] sm:aspect-auto sm:min-h-[180px] overflow-hidden bg-stone-100">
      <Img article={article} className="group-hover:scale-[1.03] transition-transform duration-500" />
    </div>
    <div className="sm:w-1/2 p-5 sm:p-6 flex flex-col justify-center">
      <Meta article={article} className="text-xs font-semibold text-teal-700 mb-2" />
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-teal-800 leading-snug font-headline">
        {article.title}
      </h3>
      {article.excerpt && (
        <p className="text-sm text-slate-500 mt-2 line-clamp-3">{article.excerpt}</p>
      )}
    </div>
  </Link>
);

/** Weather-style airy chip */
const CardChip = ({ article }) => (
  <Link
    to={getArticlePath(article)}
    className="group rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-sky-100 p-3 hover:shadow-md transition-all"
  >
    <div className="aspect-[16/10] rounded-xl overflow-hidden bg-stone-100 mb-3">
      <Img article={article} className="group-hover:scale-[1.04] transition-transform duration-500" />
    </div>
    <h3 className="text-sm font-bold text-slate-800 group-hover:text-sky-800 line-clamp-2 leading-snug">
      {article.title}
    </h3>
    <Meta article={article} className="text-[10px] text-sky-600/70 mt-1.5 block" />
  </Link>
);

/* ——— Category layouts (each structurally unique) ——— */

/** District: mosaic — hero left, 2 stack right, then alternating strips */
const LayoutDistrict = ({ articles }) => {
  const [a, b, c, ...rest] = articles;
  return (
    <div className="space-y-5">
      {(a || b || c) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {a && (
            <Link
              to={getArticlePath(a)}
              className="lg:col-span-7 group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
            >
              <div className="aspect-[16/10] overflow-hidden bg-stone-100">
                <Img article={a} loading="eager" className="group-hover:scale-[1.03] transition-transform duration-500" />
              </div>
              <div className="p-5">
                <Meta article={a} className="text-xs font-semibold text-teal-700" />
                <h2 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-teal-800 leading-snug font-headline">
                  {a.title}
                </h2>
                {a.excerpt && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{a.excerpt}</p>}
              </div>
            </Link>
          )}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {[b, c].filter(Boolean).map((art) => (
              <Link
                key={art._id}
                to={getArticlePath(art)}
                className="group flex-1 flex flex-col sm:flex-row lg:flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white hover:shadow-md transition-all"
              >
                <div className="sm:w-40 lg:w-full aspect-[16/10] overflow-hidden bg-stone-100 shrink-0">
                  <Img article={art} className="group-hover:scale-[1.03] transition-transform duration-500" />
                </div>
                <div className="p-4 flex flex-col justify-center">
                  <Meta article={art} />
                  <h3 className="mt-1 text-base font-bold text-slate-900 group-hover:text-teal-800 line-clamp-3 font-headline">
                    {art.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      {rest.length > 0 && (
        <div className="space-y-3">
          {rest.map((art) => (
            <CardStrip key={art._id} article={art} bar="bg-slate-700" />
          ))}
        </div>
      )}
    </div>
  );
};

/** Politics: dark editorial lead + type-first list */
const LayoutPolitics = ({ articles }) => {
  const [main, ...rest] = articles;
  if (!main) return null;
  return (
    <div className="space-y-6">
      <Link
        to={getArticlePath(main)}
        className="group grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-2xl bg-slate-900 text-white shadow-lg"
      >
        <div className="aspect-[16/11] md:aspect-auto md:min-h-[280px] overflow-hidden">
          <Img article={main} loading="eager" className="group-hover:scale-[1.03] transition-transform duration-500" />
        </div>
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-300 mb-3">Politics</span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-snug font-headline group-hover:text-teal-200 transition-colors">
            {main.title}
          </h2>
          {main.excerpt && <p className="text-sm text-slate-300 mt-3 line-clamp-3">{main.excerpt}</p>}
          <Meta article={main} className="text-xs text-slate-400 mt-4" />
        </div>
      </Link>
      <div className="bg-white rounded-2xl border border-stone-200 px-4 sm:px-6">
        {rest.map((a, i) => (
          <CardTypeFirst key={a._id} article={a} index={i} />
        ))}
      </div>
    </div>
  );
};

/** Chennai: alternating full-width splits */
const LayoutChennai = ({ articles }) => (
  <div className="space-y-4">
    {articles.map((a, i) => (
      <CardSplit key={a._id} article={a} reverse={i % 2 === 1} />
    ))}
  </div>
);

/** Tamil Nadu: featured banner + portrait grid */
const LayoutTamilNadu = ({ articles }) => {
  const [main, ...rest] = articles;
  if (!main) return null;
  return (
    <div className="space-y-6">
      <CardSplit article={main} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {rest.map((a) => (
          <CardPortrait key={a._id} article={a} />
        ))}
      </div>
    </div>
  );
};

/** India: 2 cards mobile, more on desktop */
const LayoutIndia = ({ articles }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
    {articles.map((a) => (
      <CardTile key={a._id} article={a} />
    ))}
  </div>
);

/** World: numbered type-first list */
const LayoutWorld = ({ articles }) => (
  <div className="rounded-2xl border border-stone-200 bg-white px-4 sm:px-8 shadow-sm">
    {articles.map((a, i) => (
      <CardTypeFirst key={a._id} article={a} index={i} />
    ))}
  </div>
);

/** Crime: stark red-bar strips */
const LayoutCrime = ({ articles }) => (
  <div className="space-y-3">
    {articles.map((a) => (
      <CardStrip key={a._id} article={a} bar="bg-rose-600" />
    ))}
  </div>
);

/** POCSO: soft timeline */
const LayoutPocso = ({ articles }) => (
  <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-violet-200">
    {articles.map((a) => (
      <div key={a._id} className="relative">
        <span className="absolute -left-6 sm:-left-8 top-5 w-3 h-3 rounded-full bg-violet-500 ring-4 ring-violet-100" />
        <CardStrip article={a} bar="bg-violet-500" />
      </div>
    ))}
  </div>
);

/** Spiritual: centered serene feature + soft landscape cards */
const LayoutSpiritual = ({ articles }) => {
  const [main, ...rest] = articles;
  if (!main) return null;
  return (
    <div className="rounded-[1.75rem] bg-gradient-to-b from-teal-50/90 via-white to-amber-50/50 border border-stone-100 p-4 sm:p-8">
      <Link to={getArticlePath(main)} className="block text-center max-w-3xl mx-auto group mb-8">
        <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-5 ring-1 ring-black/5 bg-stone-100">
          <Img article={main} loading="eager" className="group-hover:scale-[1.02] transition-transform duration-700" />
        </div>
        <h2 className="text-xl sm:text-3xl font-bold text-slate-900 group-hover:text-teal-800 leading-snug font-headline">
          {main.title}
        </h2>
        {main.excerpt && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{main.excerpt}</p>}
      </Link>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {rest.map((a) => (
          <CardLandscape key={a._id} article={a} />
        ))}
      </div>
    </div>
  );
};

/** Special: bento asymmetric mosaic */
const LayoutSpecial = ({ articles }) => {
  const [a, b, c, d, ...rest] = articles;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-4 md:min-h-[420px]">
        {a && (
          <Link
            to={getArticlePath(a)}
            className="md:col-span-4 md:row-span-2 group overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm"
          >
            <div className="h-48 md:h-3/5 overflow-hidden bg-stone-100">
              <Img article={a} loading="eager" className="group-hover:scale-[1.03] transition-transform duration-500" />
            </div>
            <div className="p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">சிறப்பு</span>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-amber-800 leading-snug font-headline">
                {a.title}
              </h2>
              {a.excerpt && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{a.excerpt}</p>}
            </div>
          </Link>
        )}
        {[b, c].filter(Boolean).map((art) => (
          <Link
            key={art._id}
            to={getArticlePath(art)}
            className="md:col-span-2 group flex md:flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white hover:shadow-md transition-all"
          >
            <div className="w-28 md:w-full aspect-square md:aspect-[16/10] overflow-hidden bg-stone-100 shrink-0">
              <Img article={art} className="group-hover:scale-[1.03] transition-transform duration-500" />
            </div>
            <div className="p-3 flex items-center md:items-start">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 line-clamp-3 leading-snug">
                {art.title}
              </h3>
            </div>
          </Link>
        ))}
        {d && (
          <div className="md:col-span-2 md:hidden">
            <CardLandscape article={d} accentHover="group-hover:text-amber-800" />
          </div>
        )}
      </div>
      {d && (
        <div className="hidden md:block">
          <CardStrip article={d} bar="bg-amber-500" />
        </div>
      )}
      {rest.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {rest.map((art) => (
            <CardLandscape key={art._id} article={art} accentHover="group-hover:text-amber-800" />
          ))}
        </div>
      )}
    </div>
  );
};

/** Education: numbered syllabus list */
const LayoutEducation = ({ articles }) => (
  <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/30 overflow-hidden">
    <div className="px-4 sm:px-6 py-3 border-b border-indigo-100 bg-white/70">
      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">கல்வி அறிக்கைகள்</span>
    </div>
    <div className="px-4 sm:px-6 bg-white">
      {articles.map((a, i) => (
        <CardTypeFirst key={a._id} article={a} index={i} />
      ))}
    </div>
  </div>
);

/** Sports: bold hero + square tiles */
const LayoutSports = ({ articles }) => {
  const [main, ...rest] = articles;
  if (!main) return null;
  return (
    <div className="space-y-5">
      <Link
        to={getArticlePath(main)}
        className="group block overflow-hidden rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white shadow-sm"
      >
        <div className="aspect-[21/9] sm:aspect-[2.4/1] overflow-hidden bg-stone-100">
          <Img article={main} loading="eager" className="group-hover:scale-[1.03] transition-transform duration-500" />
        </div>
        <div className="p-5 sm:p-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">விளையாட்டு</span>
          <h2 className="mt-1 text-xl sm:text-3xl font-black text-slate-900 group-hover:text-orange-700 leading-snug font-headline">
            {main.title}
          </h2>
        </div>
      </Link>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {rest.map((a) => (
          <CardTile key={a._id} article={a} />
        ))}
      </div>
    </div>
  );
};

/** Jobs: notice-board grid */
const LayoutJobs = ({ articles }) => (
  <div className="grid grid-cols-2 gap-3 sm:gap-4">
    {articles.map((a) => (
      <CardNotice key={a._id} article={a} label="Opportunity" />
    ))}
  </div>
);

/** Agriculture: landscape cards with earth accent */
const LayoutAgriculture = ({ articles }) => (
  <div className="grid grid-cols-2 gap-3 sm:gap-4">
    {articles.map((a) => (
      <CardLandscape key={a._id} article={a} accentHover="group-hover:text-emerald-800" />
    ))}
  </div>
);

/** Sri Lanka: magazine zig-zag splits */
const LayoutSriLanka = ({ articles }) => (
  <div className="space-y-4">
    {articles.map((a, i) => (
      <CardSplit key={a._id} article={a} reverse={i % 2 === 1} />
    ))}
  </div>
);

/** Business: ticker rows */
const LayoutBusiness = ({ articles }) => (
  <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white overflow-hidden shadow-sm">
    <div className="px-4 py-2.5 bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider flex justify-between">
      <span>Market desk</span>
      <span className="opacity-70">Live updates</span>
    </div>
    <ul className="divide-y divide-emerald-100">
      {articles.map((a, i) => (
        <li key={a._id}>
          <Link
            to={getArticlePath(a)}
            className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 hover:bg-emerald-50/80 transition-colors group"
          >
            <span className="text-[11px] font-bold text-emerald-700/60 w-6 tabular-nums shrink-0">{i + 1}</span>
            <div className="w-24 h-16 sm:w-20 sm:h-14 rounded-xl overflow-hidden shrink-0 bg-stone-100 ring-1 ring-black/5">
              <Img article={a} />
            </div>
            <h3 className="flex-1 text-sm font-semibold text-slate-900 group-hover:text-emerald-800 line-clamp-2 leading-snug">
              {a.title}
            </h3>
            <span className="hidden sm:inline text-emerald-600 text-xs font-medium shrink-0">→</span>
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

/** Health: clean cyan landscape grid */
const LayoutHealth = ({ articles }) => (
  <div className="grid grid-cols-2 gap-3 md:gap-4">
    {articles.map((a) => (
      <Link
        key={a._id}
        to={getArticlePath(a)}
        className="group flex flex-col overflow-hidden rounded-2xl border border-cyan-100 bg-white hover:border-cyan-300 hover:shadow-md transition-all"
      >
        <div className="aspect-[16/10] overflow-hidden bg-cyan-50">
          <Img article={a} className="group-hover:scale-[1.04] transition-transform duration-500" />
        </div>
        <div className="p-3 sm:p-4">
          <Meta article={a} className="text-[11px] text-cyan-700" />
          <h3 className="mt-1 text-sm sm:text-base font-bold text-slate-900 group-hover:text-cyan-800 line-clamp-3 leading-snug font-headline">
            {a.title}
          </h3>
        </div>
      </Link>
    ))}
  </div>
);

/** Short news: round pill chips */
const LayoutShort = ({ articles }) => (
  <div className="grid grid-cols-2 gap-3">
    {articles.map((a) => (
      <CardPill key={a._id} article={a} />
    ))}
  </div>
);

/** Weather: airy chip grid */
const LayoutWeather = ({ articles }) => (
  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
    {articles.map((a) => (
      <CardChip key={a._id} article={a} />
    ))}
  </div>
);

/** Other / default: mix — first split, then landscape grid, then strips */
const LayoutMixed = ({ articles }) => {
  const [main, ...rest] = articles;
  const mid = rest.slice(0, 4);
  const tail = rest.slice(4);
  return (
    <div className="space-y-5">
      {main && <CardSplit article={main} />}
      {mid.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {mid.map((a) => (
            <CardLandscape key={a._id} article={a} />
          ))}
        </div>
      )}
      {tail.length > 0 && (
        <div className="space-y-3">
          {tail.map((a) => (
            <CardStrip key={a._id} article={a} bar="bg-slate-400" />
          ))}
        </div>
      )}
    </div>
  );
};

/** Cinema: 2 cards mobile, 4 desktop */
const LayoutCinema = ({ articles }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
    {articles.map((a) => (
      <CardPortrait key={a._id} article={a} />
    ))}
  </div>
);

/** Technology: hero + strips */
const LayoutTechnology = ({ articles }) => {
  const [main, ...rest] = articles;
  if (!main) return null;
  return (
    <div className="space-y-4">
      <CardSplit article={main} />
      <div className="space-y-3">
        {rest.map((a) => (
          <CardStrip key={a._id} article={a} bar="bg-cyan-500" />
        ))}
      </div>
    </div>
  );
};

const LAYOUT_BY_SLUG = {
  district: LayoutDistrict,
  politics: LayoutPolitics,
  chennai: LayoutChennai,
  'tamil-nadu': LayoutTamilNadu,
  india: LayoutIndia,
  world: LayoutWorld,
  crime: LayoutCrime,
  pocso: LayoutPocso,
  spiritual: LayoutSpiritual,
  special: LayoutSpecial,
  education: LayoutEducation,
  sports: LayoutSports,
  jobs: LayoutJobs,
  agriculture: LayoutAgriculture,
  'sri-lanka': LayoutSriLanka,
  business: LayoutBusiness,
  health: LayoutHealth,
  'short-news': LayoutShort,
  weather: LayoutWeather,
  'other-news': LayoutMixed,
  cinema: LayoutCinema,
  technology: LayoutTechnology,
};

const CategoryListingLayout = ({ slug, articles }) => {
  if (!articles?.length) return null;
  const Layout = LAYOUT_BY_SLUG[slug] || LayoutMixed;
  return (
    <div className="category-listing">
      <Layout articles={articles} />
    </div>
  );
};

export default CategoryListingLayout;
