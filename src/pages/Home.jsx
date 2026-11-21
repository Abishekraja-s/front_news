import { lazy, Suspense, useEffect, useState } from 'react';
import { articleService } from '../services/articleService';
import FeaturedNews from '../components/FeaturedNews';
import { LatestNews, PopularNews } from '../components/LatestNews';
import CategorySection from '../components/CategorySection';
import Advertisement from '../components/Advertisement';
import AdSenseSlot from '../components/AdSenseSlot';
import NewsCard from '../components/NewsCard';
import LazyMount from '../components/LazyMount';
import { SkeletonCard } from '../components/Loading';
import CategoryScrollSection from '../components/CategoryScrollSection';
import FeaturePortalCards from '../components/FeaturePortalCards';
import CategoryDeckSection from '../components/CategoryDeckSection';
import { CATEGORY_SLUGS, CATEGORY_TITLES } from '../utils/helpers';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';
import { Helmet } from 'react-helmet-async';

/** Below-fold chunks — keep initial JS small so homepage opens faster */
const YoutubeVideoSlider = lazy(() => import('../components/YoutubeVideoSlider'));
const InstagramPostsSection = lazy(() => import('../components/InstagramPostsSection'));
const GoogleNewsSection = lazy(() => import('../components/GoogleNewsSection'));
const GovernmentNotificationsSection = lazy(() => import('../components/GovernmentNotificationsSection'));
const DistrictNews = lazy(() => import('../components/DistrictNews'));

const SectionFallback = ({ h = 160 }) => (
  <div className="mb-8 rounded-2xl bg-stone-100/80 animate-pulse" style={{ minHeight: h }} aria-hidden />
);

const CAT_BATCH = 4;

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [recentUpdated, setRecentUpdated] = useState([]);
  const [popular, setPopular] = useState([]);
  const [categoryData, setCategoryData] = useState({});
  const [heroLoading, setHeroLoading] = useState(true);
  const [catsLoading, setCatsLoading] = useState(true);

  // Critical path only — paint hero ASAP (do not wait for 20 category APIs)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [featuredRes, latestRes, recentRes, popularRes] = await Promise.allSettled([
          articleService.getFeatured(),
          // Real latest news by publish date (not old seeds with bumped updatedAt)
          articleService.getLatest(12, { by: 'published' }),
          // Truly recently updated: updated in 7d AND published within 30d
          articleService.getLatest(10, { by: 'updated', days: 7 }),
          articleService.getPopular(5, 7),
        ]);
        if (cancelled) return;
        setFeatured(
          featuredRes.status === 'fulfilled' ? featuredRes.value.data.data || [] : []
        );
        const latestList =
          latestRes.status === 'fulfilled' ? latestRes.value.data.data || [] : [];
        const recentList =
          recentRes.status === 'fulfilled' ? recentRes.value.data.data || [] : [];
        setLatest(latestList);
        setRecentUpdated(recentList.length ? recentList : latestList.slice(0, 10));
        const popularRaw =
          popularRes.status === 'fulfilled' ? popularRes.value.data.data || [] : [];
        // Client safety net: only last 7 days
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        setPopular(
          popularRaw.filter((a) => {
            const t = new Date(a.publishedAt || a.createdAt || 0).getTime();
            return Number.isFinite(t) && t >= weekAgo;
          })
        );
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setHeroLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Categories in small batches after hero — progressive fill, less network storm
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCatsLoading(true);
      const next = {};
      try {
        for (let i = 0; i < CATEGORY_SLUGS.length; i += CAT_BATCH) {
          if (cancelled) return;
          const batch = CATEGORY_SLUGS.slice(i, i + CAT_BATCH);
          await Promise.all(
            batch.map(async (slug) => {
              try {
                const { data } = await articleService.getByCategory(slug, 1, 6);
                next[slug] = data.data || [];
              } catch {
                next[slug] = [];
              }
            })
          );
          if (!cancelled) setCategoryData({ ...next });
        }
      } finally {
        if (!cancelled) setCatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const heroArticle = latest[0] || recentUpdated[0] || featured[0] || null;
  const heroId = heroArticle ? String(heroArticle._id) : '';
  const restLatest = latest.filter((a) => String(a._id) !== heroId);
  const sidebarLatest = restLatest.slice(0, 6);
  // Grid: prefer recently-updated feed; exclude hero so multiple cards show
  const recentUpdatedCards = (recentUpdated.length ? recentUpdated : restLatest)
    .filter((a) => String(a._id) !== heroId)
    .slice(0, 10);

  const recentScroll = useHorizontalScroll({
    deps: [recentUpdatedCards.length, heroLoading],
    autoplayMs: 4500,
  });

  return (
    <>
      <Helmet>
        <title>The Great India News - Latest Tamil News</title>
        <meta
          name="description"
          content="Latest Tamil news from Tamil Nadu, India and World. Breaking news, politics, sports, cinema and more."
        />
      </Helmet>

      <div className="container-news py-6">
        <Advertisement position="homepage_top" className="mb-6" />
        <AdSenseSlot location="homepage" page="home" className="mb-6" />
        <AdSenseSlot location="homepage_top" page="home" className="mb-6" />

        {heroLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 skeleton h-96 rounded-xl" />
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              {heroArticle ? <FeaturedNews article={heroArticle} /> : null}
            </div>
            <div className="space-y-6">
              <LatestNews articles={sidebarLatest} />
              <PopularNews articles={popular} />
            </div>
          </div>
        )}

        {!heroLoading && recentUpdatedCards.length > 0 && (
          <section className="mb-8 relative">
            <div className="flex items-end justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-news-dark font-tamil">
                  சமீபத்தில் புதுப்பிக்கப்பட்டவை
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Recently updated news</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  aria-label="Previous"
                  disabled={!recentScroll.canLeft}
                  onClick={() => recentScroll.scrollByDir(-1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm disabled:opacity-30 hover:bg-slate-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  disabled={!recentScroll.canRight}
                  onClick={() => recentScroll.scrollByDir(1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm disabled:opacity-30 hover:brightness-110"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            <div
              ref={recentScroll.ref}
              className="flex gap-3 overflow-x-auto overscroll-x-contain pb-2 snap-x snap-mandatory scrollbar-hide touch-pan-x select-none"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}
            >
              {recentUpdatedCards.map((article) => (
                <div
                  key={article._id}
                  data-hscroll-item
                  className="shrink-0 w-[85%] max-w-[18rem] sm:w-[48%] sm:max-w-none lg:w-[calc(25%-0.75rem)] snap-start"
                >
                  <NewsCard article={article} />
                </div>
              ))}
            </div>
          </section>
        )}

        <Advertisement position="homepage_middle" className="mb-8" />
        <AdSenseSlot location="homepage_middle" page="home" className="mb-8" />

        <LazyMount minHeight={220}>
          <Suspense fallback={<SectionFallback h={220} />}>
            <YoutubeVideoSlider />
          </Suspense>
        </LazyMount>

        <LazyMount minHeight={180}>
          <Suspense fallback={<SectionFallback h={180} />}>
            <InstagramPostsSection />
          </Suspense>
        </LazyMount>

        <div className="w-full min-w-0">
          <CategoryScrollSection />
        </div>
        <div className="w-full min-w-0">
          <FeaturePortalCards />
        </div>

        <div className="w-full min-w-0">
          <CategoryDeckSection />
        </div>

        <LazyMount minHeight={420} rootMargin="320px">
          <Suspense fallback={<SectionFallback h={420} />}>
            <GovernmentNotificationsSection />
          </Suspense>
        </LazyMount>

        <LazyMount minHeight={280}>
          <Suspense fallback={<SectionFallback h={280} />}>
            <GoogleNewsSection />
          </Suspense>
        </LazyMount>

        <LazyMount minHeight={240}>
          <Suspense fallback={<SectionFallback h={240} />}>
            <DistrictNews />
          </Suspense>
        </LazyMount>

        {CATEGORY_SLUGS.map((slug) => (
          <LazyMount key={slug} minHeight={200} rootMargin="240px">
            <CategorySection
              title={CATEGORY_TITLES[slug]}
              slug={slug}
              articles={categoryData[slug]}
              loading={catsLoading && !categoryData[slug]}
            />
          </LazyMount>
        ))}
      </div>
    </>
  );
};

export default Home;
