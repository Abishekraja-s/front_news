import { Link } from 'react-router-dom';
import NewsCard from './NewsCard';
import NewsImage from './NewsImage';
import CategoryBanner from './CategoryBanner';
import { getArticlePath } from '../utils/articlePaths';

/** Distinct homepage layout per category slug */
const LAYOUT_BY_SLUG = {
  district: 'grid',
  politics: 'editorial',
  chennai: 'magazine',
  'tamil-nadu': 'spotlight',
  india: 'grid',
  world: 'numbered',
  crime: 'board',
  pocso: 'timeline',
  spiritual: 'serene',
  special: 'mosaic',
  education: 'timeline',
  sports: 'arena',
  jobs: 'board',
  agriculture: 'spotlight',
  'sri-lanka': 'magazine',
  business: 'ticker',
  health: 'split',
  'short-news': 'numbered',
  weather: 'grid',
  'other-news': 'spotlight',
  cinema: 'posters',
  technology: 'split',
};

const SectionHeader = ({ title, slug }) => (
  <div className="flex items-center justify-between mb-4 gap-3">
    <h2 className="section-title">{title}</h2>
    {slug && (
      <Link to={`/${slug}`} className="text-sm text-brand-600 hover:underline font-medium shrink-0">
        அனைத்தும் →
      </Link>
    )}
  </div>
);

const CatLabel = ({ article }) =>
  article?.category ? (
    <span className="text-xs text-brand-600 font-medium">
      {article.category.nameTamil || article.category.name}
    </span>
  ) : null;

const ThumbTitle = ({ article, imgClass = 'w-28 h-20', titleClass = 'text-sm font-semibold' }) => (
  <Link to={getArticlePath(article)} className="flex gap-3 group min-w-0">
    <div className={`shrink-0 overflow-hidden rounded-xl ring-1 ring-black/5 ${imgClass}`}>
      <NewsImage
        src={article.featuredImage}
        seed={article.slug}
        alt={article.imageAlt || article.title}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
    <div className="min-w-0 self-center">
      <CatLabel article={article} />
      <h3 className={`${titleClass} text-slate-900 group-hover:text-brand-700 line-clamp-2 leading-snug mt-0.5`}>
        {article.title}
      </h3>
    </div>
  </Link>
);

/** Featured left + sidebar list */
const LayoutSpotlight = ({ articles }) => {
  const [main, ...rest] = articles;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      <div className="lg:col-span-2">
        <NewsCard article={main} />
      </div>
      <div className="space-y-4">
        {rest.slice(0, 4).map((a) => (
          <NewsCard key={a._id} article={a} variant="horizontal" />
        ))}
      </div>
    </div>
  );
};

/** Stacked full-bleed rows — image left / right alternating */
const LayoutMagazine = ({ articles }) => (
  <div className="space-y-4">
    {articles.slice(0, 4).map((a, i) => (
      <Link
        key={a._id}
        to={getArticlePath(a)}
        className={`flex flex-col sm:flex-row gap-0 overflow-hidden rounded-2xl border border-stone-200 bg-white group ${
          i % 2 === 1 ? 'sm:flex-row-reverse' : ''
        }`}
      >
        <div className="sm:w-2/5 aspect-[16/10] sm:aspect-auto sm:min-h-[160px] overflow-hidden shrink-0">
          <NewsImage
            src={a.featuredImage}
            seed={a.slug}
            alt={a.imageAlt || a.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center">
          <CatLabel article={a} />
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-700 leading-snug mt-1 font-headline">
            {a.title}
          </h3>
          {a.excerpt && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{a.excerpt}</p>}
        </div>
      </Link>
    ))}
  </div>
);

/** Equal 2×2 / 4-col image cards */
const LayoutGrid = ({ articles }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    {articles.slice(0, 4).map((a) => (
      <NewsCard key={a._id} article={a} />
    ))}
  </div>
);

/** Large numbers beside stories */
const LayoutNumbered = ({ articles }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
    {articles.slice(0, 6).map((a, i) => (
      <Link key={a._id} to={getArticlePath(a)} className="flex gap-4 group items-start">
        <span className="text-4xl font-black text-brand-200 leading-none tabular-nums shrink-0 w-12 group-hover:text-brand-400 transition-colors">
          {String(i + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex gap-3">
            <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 ring-1 ring-black/5">
              <NewsImage
                src={a.featuredImage}
                seed={a.slug}
                alt={a.imageAlt || a.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <h3 className="text-sm md:text-base font-semibold text-slate-900 group-hover:text-brand-700 line-clamp-3 leading-snug">
              {a.title}
            </h3>
          </div>
        </div>
      </Link>
    ))}
  </div>
);

/** Featured image + text below, with compact thumb rows */
const LayoutEditorial = ({ articles }) => {
  const [main, ...rest] = articles;
  if (!main) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <Link
        to={getArticlePath(main)}
        className="lg:col-span-7 group flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-teal-300 transition-colors"
      >
        <div className="aspect-[16/10] overflow-hidden bg-slate-100 shrink-0">
          <NewsImage
            src={main.featuredImage}
            seed={main.slug}
            alt={main.imageAlt || main.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <div className="p-4 sm:p-5 flex-1">
          <CatLabel article={main} />
          <h3 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-teal-800 leading-snug font-headline">
            {main.title}
          </h3>
          {main.excerpt && (
            <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed">{main.excerpt}</p>
          )}
        </div>
      </Link>

      <div className="lg:col-span-5 flex flex-col gap-3">
        {rest.slice(0, 4).map((a) => (
          <Link
            key={a._id}
            to={getArticlePath(a)}
            className="group flex gap-3 items-stretch rounded-xl bg-white border border-slate-200 hover:border-teal-300 p-2.5 transition-colors min-h-0"
          >
            <div className="w-[88px] sm:w-24 aspect-[4/3] rounded-lg overflow-hidden shrink-0 bg-slate-100">
              <NewsImage
                src={a.featuredImage}
                seed={a.slug}
                alt={a.imageAlt || a.title}
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <div className="min-w-0 flex-1 self-center pr-1">
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-teal-800 line-clamp-3 leading-snug">
                {a.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

/** Compact market-style rows */
const LayoutTicker = ({ articles }) => (
  <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white overflow-hidden">
    <ul className="divide-y divide-emerald-100/80">
      {articles.slice(0, 6).map((a, i) => (
        <li key={a._id}>
          <Link to={getArticlePath(a)} className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 hover:bg-emerald-50/70 transition-colors group">
            <span className="text-[11px] font-bold text-emerald-700/70 w-6 tabular-nums">{i + 1}</span>
            <div className="w-14 h-10 rounded-md overflow-hidden shrink-0">
              <NewsImage
                src={a.featuredImage}
                seed={a.slug}
                alt={a.imageAlt || a.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
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

/** Featured image above text + 3 equal action cards */
const LayoutArena = ({ articles }) => {
  const [main, ...rest] = articles;
  if (!main) return null;

  return (
    <div className="space-y-4">
      <Link
        to={getArticlePath(main)}
        className="group flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-orange-100 bg-white hover:border-orange-300 transition-colors"
      >
        <div className="sm:w-1/2 aspect-[16/10] sm:aspect-auto sm:min-h-[220px] overflow-hidden bg-slate-100 shrink-0">
          <NewsImage
            src={main.featuredImage}
            seed={main.slug}
            alt={main.imageAlt || main.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <div className="flex-1 p-4 sm:p-6 flex flex-col justify-center bg-orange-50/40">
          <span className="inline-block w-fit text-[10px] font-bold uppercase tracking-wider bg-orange-500 text-white px-2 py-0.5 rounded mb-3">
            Sports
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-orange-700 leading-tight font-headline">
            {main.title}
          </h3>
          {main.excerpt && (
            <p className="text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">{main.excerpt}</p>
          )}
        </div>
      </Link>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {rest.slice(0, 3).map((a) => (
          <Link
            key={a._id}
            to={getArticlePath(a)}
            className="rounded-xl border border-orange-100 bg-orange-50/40 p-3 flex gap-3 group hover:border-orange-300 transition-colors"
          >
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
              <NewsImage
                src={a.featuredImage}
                seed={a.slug}
                alt={a.imageAlt || a.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-700 line-clamp-3 self-center leading-snug">
              {a.title}
            </h3>
          </Link>
        ))}
      </div>
    </div>
  );
};

/** Portrait poster grid */
const LayoutPosters = ({ articles }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
    {articles.slice(0, 5).map((a) => (
      <Link key={a._id} to={getArticlePath(a)} className="group block">
        <div className="aspect-[3/4] rounded-xl overflow-hidden ring-1 ring-black/5 bg-slate-100 shadow-sm">
          <NewsImage
            src={a.featuredImage}
            seed={a.slug}
            alt={a.imageAlt || a.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <h3 className="mt-2 text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-rose-700 line-clamp-2 leading-snug">
          {a.title}
        </h3>
      </Link>
    ))}
  </div>
);

/** Story stack left + image/title card right (no overlay) */
const LayoutSplit = ({ articles }) => {
  const [main, ...rest] = articles;
  if (!main) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
      <div className="order-2 lg:order-1 space-y-0 divide-y divide-cyan-100 rounded-2xl border border-cyan-100 bg-cyan-50/30 px-4">
        {rest.slice(0, 4).map((a) => (
          <Link key={a._id} to={getArticlePath(a)} className="block py-3.5 group">
            <CatLabel article={a} />
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-cyan-800 line-clamp-2 mt-0.5 leading-snug">
              {a.title}
            </h3>
          </Link>
        ))}
      </div>
      <Link
        to={getArticlePath(main)}
        className="order-1 lg:order-2 group flex flex-col overflow-hidden rounded-2xl border border-cyan-100 bg-white hover:border-cyan-300 transition-colors"
      >
        <div className="aspect-[16/10] overflow-hidden bg-slate-100 shrink-0">
          <NewsImage
            src={main.featuredImage}
            seed={main.slug}
            alt={main.imageAlt || main.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <div className="p-4 sm:p-5">
          <span className="text-[10px] uppercase tracking-wider text-cyan-700 font-bold">Tech</span>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-cyan-800 mt-1 leading-snug">
            {main.title}
          </h3>
        </div>
      </Link>
    </div>
  );
};

/** Vertical timeline rail */
const LayoutTimeline = ({ articles }) => (
  <ol className="relative border-l-2 border-amber-200 ml-3 sm:ml-4 space-y-5">
    {articles.slice(0, 5).map((a) => (
      <li key={a._id} className="ml-5 sm:ml-7 relative">
        <span className="absolute -left-[1.65rem] sm:-left-[1.9rem] top-3 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-100" />
        <ThumbTitle article={a} imgClass="w-24 h-16 sm:w-32 sm:h-20" titleClass="text-sm sm:text-base font-semibold" />
      </li>
    ))}
  </ol>
);

/** Job-board style cards */
const LayoutBoard = ({ articles }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {articles.slice(0, 6).map((a) => (
      <Link
        key={a._id}
        to={getArticlePath(a)}
        className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3.5 hover:border-brand-400 hover:shadow-sm transition-all group"
      >
        <div className="w-1 self-stretch rounded-full bg-brand-500 shrink-0" />
        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
          <NewsImage
            src={a.featuredImage}
            seed={a.slug}
            alt={a.imageAlt || a.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
            Opportunity
          </span>
          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 line-clamp-2 mt-1 leading-snug">
            {a.title}
          </h3>
        </div>
      </Link>
    ))}
  </div>
);

/** Soft centered lead + side cards */
const LayoutSerene = ({ articles }) => {
  const [main, ...rest] = articles;
  return (
    <div className="rounded-3xl bg-gradient-to-b from-teal-50/70 via-white to-amber-50/50 border border-stone-100 p-4 sm:p-6">
      <Link to={getArticlePath(main)} className="block text-center max-w-2xl mx-auto group mb-6">
        <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-4 ring-1 ring-black/5">
          <NewsImage
            src={main.featuredImage}
            seed={main.slug}
            alt={main.imageAlt || main.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
            loading="lazy"
          />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-teal-800 leading-snug font-headline">
          {main.title}
        </h3>
        {main.excerpt && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{main.excerpt}</p>}
      </Link>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {rest.slice(0, 3).map((a) => (
          <NewsCard key={a._id} article={a} variant="horizontal" />
        ))}
      </div>
    </div>
  );
};

/** Mosaic grid — image on top, title below (no overlay) */
const LayoutMosaic = ({ articles }) => {
  const [a, b, c, d, e] = articles;
  if (!a) return null;

  const Tile = ({ item, wide = false }) => (
    <Link
      to={getArticlePath(item)}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-teal-300 transition-colors ${
        wide ? 'col-span-2 row-span-2' : ''
      }`}
    >
      <div className={`overflow-hidden bg-slate-100 shrink-0 ${wide ? 'aspect-[16/11] flex-1' : 'aspect-[16/10]'}`}>
        <NewsImage
          src={item.featuredImage}
          seed={item.slug}
          alt={item.imageAlt || item.title}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
          loading="lazy"
        />
      </div>
      <h3
        className={`p-2.5 sm:p-3 font-semibold text-slate-900 group-hover:text-teal-800 leading-snug ${
          wide ? 'text-base sm:text-xl line-clamp-3' : 'text-xs sm:text-sm line-clamp-2'
        }`}
      >
        {item.title}
      </h3>
    </Link>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Tile item={a} wide />
      {[b, c, d, e].filter(Boolean).map((item) => (
        <Tile key={item._id} item={item} />
      ))}
    </div>
  );
};

const LAYOUTS = {
  spotlight: LayoutSpotlight,
  magazine: LayoutMagazine,
  grid: LayoutGrid,
  numbered: LayoutNumbered,
  editorial: LayoutEditorial,
  ticker: LayoutTicker,
  arena: LayoutArena,
  posters: LayoutPosters,
  split: LayoutSplit,
  timeline: LayoutTimeline,
  board: LayoutBoard,
  serene: LayoutSerene,
  mosaic: LayoutMosaic,
};

const CategorySection = ({ title, articles, slug, loading }) => {
  if (loading) {
    return (
      <section className="mb-8">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-64 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (!articles?.length) return null;

  const layoutKey = LAYOUT_BY_SLUG[slug] || 'spotlight';
  const Layout = LAYOUTS[layoutKey] || LayoutSpotlight;

  return (
    <section className="mb-10 [content-visibility:auto] [contain-intrinsic-size:auto_420px]">
      <SectionHeader title={title} slug={slug} />
      <Layout articles={articles} />
      <CategoryBanner slug={slug} className="mt-4 md:mt-5" />
    </section>
  );
};

export default CategorySection;
