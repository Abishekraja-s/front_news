import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { articleService, categoryService } from '../services/articleService';
import { getImageUrl } from '../utils/images';
import { CATEGORY_SLUGS } from '../utils/helpers';

const FALLBACK_TITLES = {
  'tamil-nadu': 'தமிழ்நாடு',
  chennai: 'சென்னை',
  india: 'இந்தியா',
  world: 'உலகம்',
  politics: 'அரசியல்',
  business: 'வணிகம்',
  sports: 'விளையாட்டு',
  cinema: 'சினிமா',
  technology: 'தொழில்நுட்பம்',
  education: 'கல்வி',
  jobs: 'வேலைவாய்ப்பு',
  spiritual: 'ஆன்மிகம்',
  special: 'சிறப்பு',
};

const PAGE_SIZE = 12;

/**
 * Instagram / Reels-style — one news per full screen, snap to next.
 */
const NewsReelFeed = ({ open, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('all');
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    categoryService
      .getAll()
      .then(({ data }) => {
        const list = (data.data || []).filter((c) => c.slug && !c.parent);
        if (list.length) {
          setCategories(list);
        } else {
          setCategories(CATEGORY_SLUGS.map((slug) => ({ slug, nameTamil: FALLBACK_TITLES[slug], name: slug })));
        }
      })
      .catch(() => {
        setCategories(CATEGORY_SLUGS.map((slug) => ({ slug, nameTamil: FALLBACK_TITLES[slug], name: slug })));
      });
  }, []);

  const loadPage = useCallback(async (nextPage, cat, replace = false) => {
    setLoading(true);
    try {
      let rows = [];
      let more = false;
      if (cat === 'all') {
        if (nextPage === 1) {
          const { data } = await articleService.getLatest(Math.min(PAGE_SIZE, 30));
          rows = data.data || [];
          more = CATEGORY_SLUGS.length > 0;
        } else {
          const slug = CATEGORY_SLUGS[(nextPage - 2) % CATEGORY_SLUGS.length];
          const round = Math.floor((nextPage - 2) / CATEGORY_SLUGS.length) + 1;
          const { data } = await articleService.getByCategory(slug, round, PAGE_SIZE);
          rows = data.data || [];
          more = nextPage < CATEGORY_SLUGS.length * 3;
        }
      } else {
        const { data } = await articleService.getByCategory(cat, nextPage, PAGE_SIZE);
        rows = data.data || [];
        const pages = data.pagination?.pages || 1;
        more = nextPage < pages && rows.length > 0;
      }
      setArticles((prev) => {
        if (replace) return rows;
        const seen = new Set(prev.map((a) => a._id || a.slug));
        const merged = [...prev];
        rows.forEach((a) => {
          const key = a._id || a.slug;
          if (!seen.has(key)) merged.push(a);
        });
        return merged;
      });
      setHasMore(more);
      setPage(nextPage);
    } catch {
      if (replace) setArticles([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    setArticles([]);
    setPage(1);
    setHasMore(true);
    loadPage(1, category, true);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    const prevOverflow = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouch;
    };
  }, [open, category, loadPage]);

  useEffect(() => {
    if (!open || !hasMore || loading) return undefined;
    const el = sentinelRef.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadPage(page + 1, category, false);
      },
      { root: scrollerRef.current, rootMargin: '120px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [open, hasMore, loading, page, category, loadPage]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-slate-950 text-white w-screen h-[100dvh] max-h-[100dvh] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="News reel"
    >
      {/* Overlay header — does not reduce slide height */}
      <div className="absolute top-0 inset-x-0 z-20 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center justify-between gap-2 mb-2 pointer-events-auto">
          <p className="text-sm font-bold tracking-tight truncate">அனைத்து செய்திகள்</p>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 shrink-0 rounded-full bg-white/15 hover:bg-white/25 text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1 pointer-events-auto">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              category === 'all'
                ? 'bg-rose-500 border-rose-400 text-white'
                : 'bg-black/40 border-white/20 text-white/90 backdrop-blur-sm'
            }`}
          >
            அனைத்தும்
          </button>
          {categories.map((c) => {
            const slug = c.slug;
            const label = c.nameTamil || FALLBACK_TITLES[slug] || c.name || slug;
            const active = category === slug;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => setCategory(slug)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-rose-500 border-rose-400 text-white'
                    : 'bg-black/40 border-white/20 text-white/90 backdrop-blur-sm'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory overscroll-y-contain"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y mandatory',
          scrollSnapStop: 'always',
        }}
      >
        {articles.map((article) => {
          const catLabel =
            article.category?.nameTamil ||
            article.category?.name ||
            FALLBACK_TITLES[article.category?.slug] ||
            '';
          const img = getImageUrl(article.featuredImage, article.slug || article._id);
          return (
            <article
              key={article._id || article.slug}
              className="relative w-full h-[100dvh] max-h-[100dvh] shrink-0 snap-start snap-always overflow-hidden"
            >
              <div className="absolute inset-0">
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30" />
              </div>

              <div
                className="absolute inset-x-0 bottom-0 z-10 w-full box-border
                  px-4 sm:px-5
                  pt-10
                  pb-[max(1.25rem,env(safe-area-inset-bottom))]
                  max-w-full"
              >
                {catLabel ? (
                  <span className="inline-block max-w-full truncate text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/15 border border-white/25 mb-2.5">
                    {catLabel}
                  </span>
                ) : null}
                <h2
                  className="w-full max-w-full text-[1.15rem] sm:text-2xl font-bold font-headline leading-snug
                    break-words [overflow-wrap:anywhere] [word-break:break-word]
                    line-clamp-4"
                >
                  {article.title}
                </h2>
                {article.excerpt ? (
                  <p
                    className="w-full max-w-full text-sm text-white/80 mt-2 leading-relaxed
                      break-words [overflow-wrap:anywhere] [word-break:break-word]
                      line-clamp-3"
                  >
                    {article.excerpt}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-3 w-full max-w-full">
                  <Link
                    to={`/news/${article.slug}`}
                    onClick={onClose}
                    className="inline-flex items-center px-4 py-2.5 rounded-full bg-rose-500 text-white text-sm font-bold hover:bg-rose-400 shrink-0"
                  >
                    முழு செய்தி →
                  </Link>
                  <span className="text-[11px] text-white/55">Swipe ↑↓</span>
                </div>
              </div>
            </article>
          );
        })}

        {loading && articles.length === 0 && (
          <div className="h-[100dvh] flex items-center justify-center text-white/60 text-sm snap-start">
            Loading…
          </div>
        )}

        {!loading && articles.length === 0 && (
          <div className="h-[100dvh] flex items-center justify-center text-white/60 text-sm px-6 text-center snap-start break-words">
            இந்த பிரிவில் செய்திகள் இல்லை.
          </div>
        )}

        {/* sentinel inside last gap — small so it doesn't break one-screen snap */}
        <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      </div>
    </div>
  );
};

export default NewsReelFeed;
