import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { featureService } from '../services/articleService';
import { FeatureIcon } from '../features/FeatureIcons';

const POLL_MS = 60_000;

const TrendingNowPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      featureService
        .getTrendingLive({ limit: 20 })
        .then(({ data: res }) => {
          if (!cancelled) {
            setData(res.data);
            setError('');
          }
        })
        .catch(() => {
          if (!cancelled) setError('டிரெண்டிங் தலைப்புகளை ஏற்ற முடியவில்லை.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const items = data?.items || [];

  return (
    <>
      <Helmet>
        <title>Trending Now · டிரெண்டிங் | The Great India News</title>
      </Helmet>
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-cyan-700 to-slate-800 text-white">
        <div className="container-news py-7 sm:py-10 relative">
          <Link to="/explore" className="text-xs font-semibold text-white/85 hover:text-white">
            ← Explore All Features
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-white text-teal-700 flex items-center justify-center shadow-lg">
              <FeatureIcon name="trend" className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-headline font-bold">Trending Now</h1>
              <p className="text-sm font-tamil text-white/90 mt-0.5">டிரெண்டிங் · தினசரி தானியங்கி புதுப்பிப்பு</p>
            </div>
          </div>
          <p className="text-xs text-white/75 mt-3">
            {data?.dateKey ? `இன்று · ${data.dateKey}` : 'Loading…'}
            {data?.updatedAt ? ` · ${new Date(data.updatedAt).toLocaleTimeString('en-IN')}` : ''}
          </p>
        </div>
      </div>

      <div className="container-news py-6 max-w-2xl">
        {loading && !items.length ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 rounded-2xl bg-teal-50 animate-pulse" />
            ))}
          </div>
        ) : error && !items.length ? (
          <p className="text-rose-700 text-sm">{error}</p>
        ) : (
          <ol className="rounded-3xl bg-white ring-1 ring-teal-100 shadow-lg divide-y divide-stone-100 overflow-hidden">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-teal-50/50 transition-colors">
                <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 text-sm font-extrabold flex items-center justify-center shrink-0">
                  {item.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-bold text-slate-900 truncate">{item.title}</p>
                  {item.titleTamil ? (
                    <p className="text-xs font-tamil text-slate-500 truncate">{item.titleTamil}</p>
                  ) : null}
                </div>
                <span className="text-sm text-slate-400 tabular-nums font-semibold shrink-0">{item.posts}</span>
              </li>
            ))}
          </ol>
        )}
        <p className="text-[11px] text-slate-500 mt-4 text-center font-tamil">
          ஒவ்வொரு நாளும் புதிய டிரெண்டிங் தலைப்புகள் தானாக புதுப்பிக்கப்படும்
        </p>
      </div>
    </>
  );
};

export default TrendingNowPage;
