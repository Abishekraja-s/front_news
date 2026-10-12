import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { featureService } from '../services/articleService';
import { FeatureIcon } from '../features/FeatureIcons';
import RasiImage from '../components/RasiImage';

const resolveHref = (item) => {
  const slug = item.meta?.slug;
  if (slug === 'astrology' || slug === 'horoscope' || item.link === '/astrology' || item.title === 'Astrology') {
    return '/astrology';
  }
  if (slug === 'quiz' || item.title === 'Daily Quiz') return '/explore/exams';
  if (slug === 'stocks' || item.title === 'Stock Watchlist') return '/explore/stocks';
  if (slug === 'history' || item.title === 'Today in History') return '/explore/today-in-history';
  if (slug === 'game' || item.title === 'Random Game') return '/explore/random-game';
  if (item.link) return item.link;
  return '/explore';
};

const isAstrology = (item) =>
  item.link === '/astrology' || item.meta?.slug === 'astrology' || item.meta?.slug === 'horoscope';

const FALLBACK = [
  { _id: 'astrology', title: 'Astrology', titleTamil: 'ராசி பலன்', icon: 'star', color: '#7c3aed', link: '/astrology', meta: { slug: 'astrology' } },
  { _id: 'quiz', title: 'Daily Quiz', titleTamil: '5 கேள்வி', icon: 'quiz', color: '#2563eb', link: '/explore/exams', meta: { slug: 'quiz' } },
  { _id: 'stocks', title: 'Stock Watchlist', titleTamil: 'பங்குகள்', icon: 'chart', color: '#16a34a', link: '/explore/stocks', meta: { slug: 'stocks' } },
  { _id: 'history', title: 'Today in History', titleTamil: 'வரலாற்றில் இன்று', icon: 'history', color: '#ea580c', link: '/explore/today-in-history', meta: { slug: 'history' } },
  { _id: 'game', title: 'Random Game', titleTamil: 'விளையாட்டு', icon: 'game', color: '#db2777', link: '/explore/random-game', meta: { slug: 'game' } },
];

const DailyDosePage = () => {
  const [feature, setFeature] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    featureService
      .getByKey('daily_dose')
      .then(({ data }) => setFeature(data.data))
      .catch(() => setFeature(null))
      .finally(() => setLoading(false));
  }, []);

  const items = feature?.items?.length ? feature.items : FALLBACK;

  return (
    <>
      <Helmet>
        <title>Daily Dose · தினசரி | The Great India News</title>
      </Helmet>
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-fuchsia-600 to-rose-500 text-white">
        <div className="container-news py-7 sm:py-10 relative">
          <Link to="/explore" className="text-xs font-semibold text-white/85 hover:text-white">
            ← Explore All Features
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-white text-violet-700 flex items-center justify-center shadow-lg">
              <FeatureIcon name="spark" className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-headline font-bold">
                {feature?.name || 'Daily Dose'}
              </h1>
              <p className="text-sm font-tamil text-white/90 mt-0.5">
                {feature?.nameTamil || 'தினசரி'} · அனைத்து தினசரி அம்சங்கள்
              </p>
            </div>
          </div>
          <p className="text-sm text-white/80 mt-3 max-w-xl">
            {feature?.description || 'Horoscope, quiz, stocks, history, games and more — updated every day.'}
          </p>
        </div>
      </div>

      <div className="container-news py-6 sm:py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-violet-50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {items.map((item) => (
              <Link
                key={item._id || item.title}
                to={resolveHref(item)}
                className="flex flex-col items-center text-center gap-2 p-4 sm:p-5 rounded-3xl bg-white ring-1 ring-stone-200 shadow-sm hover:ring-violet-300 hover:shadow-md hover:-translate-y-0.5 transition-all min-h-[140px]"
              >
                {isAstrology(item) ? (
                  <RasiImage slug="mesham" size="sm" alt={item.titleTamil || item.title || 'Astrology'} className="shrink-0" />
                ) : (
                  <span
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-soft shrink-0"
                    style={{ backgroundColor: item.color || '#0d9488' }}
                  >
                    <FeatureIcon name={item.icon || 'spark'} className="w-6 h-6" />
                  </span>
                )}
                <span className="text-sm font-bold text-slate-900 leading-tight">{item.title}</span>
                {item.titleTamil ? (
                  <span className="text-xs text-slate-600 font-tamil leading-relaxed">{item.titleTamil}</span>
                ) : null}
                <span className="text-[11px] font-semibold text-violet-700 mt-auto">Open →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default DailyDosePage;
