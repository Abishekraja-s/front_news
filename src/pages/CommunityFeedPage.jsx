import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { featureService } from '../services/articleService';
import { FeatureIcon } from '../features/FeatureIcons';
import NewsImage from '../components/NewsImage';

const POLL_MS = 60_000;

const CommunityFeedPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      featureService
        .getCommunityLive({ limit: 16 })
        .then(({ data: res }) => {
          if (!cancelled) {
            setData(res.data);
            setError('');
          }
        })
        .catch(() => {
          if (!cancelled) setError('சமூக இடுகைகளை ஏற்ற முடியவில்லை.');
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
        <title>From Our Community · எங்கள் சமூகத்திலிருந்து | The Great India News</title>
      </Helmet>
      <div className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-orange-500 to-amber-500 text-white">
        <div className="container-news py-7 sm:py-10 relative">
          <Link to="/explore" className="text-xs font-semibold text-white/85 hover:text-white">
            ← Explore All Features
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-white text-rose-600 flex items-center justify-center shadow-lg">
              <FeatureIcon name="users" className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-headline font-bold">From Our Community</h1>
              <p className="text-sm font-tamil text-white/90 mt-0.5">எங்கள் சமூகத்திலிருந்து · தினசரி தானியங்கி புதுப்பிப்பு</p>
            </div>
          </div>
          <p className="text-xs text-white/80 mt-3">
            {data?.dateKey ? `இன்று · ${data.dateKey}` : 'Loading…'}
            {data?.updatedAt ? ` · ${new Date(data.updatedAt).toLocaleTimeString('en-IN')}` : ''}
          </p>
        </div>
      </div>

      <div className="container-news py-6 max-w-2xl">
        {loading && !items.length ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-rose-50 animate-pulse" />
            ))}
          </div>
        ) : error && !items.length ? (
          <p className="text-rose-700 text-sm">{error}</p>
        ) : (
          <ul className="rounded-3xl bg-white ring-1 ring-rose-100 shadow-lg divide-y divide-stone-100 overflow-hidden">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3 px-4 sm:px-5 py-4 hover:bg-rose-50/40 transition-colors">
                <NewsImage
                  src={item.avatar}
                  seed={item.id}
                  alt=""
                  className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-rose-100"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900">
                    {item.author}{' '}
                    <span className="font-normal text-slate-400">· {item.postedAgo}</span>
                  </p>
                  <p className="text-sm text-slate-700 mt-1 font-tamil leading-snug">{item.text}</p>
                  {item.area ? (
                    <p className="text-[11px] text-rose-700/80 mt-1 font-semibold">{item.area}</p>
                  ) : null}
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    ♥ {item.likes} · 💬 {item.comments}
                    {item.postedAgoTamil ? ` · ${item.postedAgoTamil}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-slate-500 mt-4 text-center font-tamil">
          ஒவ்வொரு நாளும் புதிய சமூக இடுகைகள் தானாக புதுப்பிக்கப்படும்
        </p>
      </div>
    </>
  );
};

export default CommunityFeedPage;
