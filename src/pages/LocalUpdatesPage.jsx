import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { featureService } from '../services/articleService';
import { FeatureIcon } from '../features/FeatureIcons';

const POLL_MS = 3000;

const TONE = {
  emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-800 ring-amber-100',
  orange: 'bg-orange-50 text-orange-800 ring-orange-100',
  rose: 'bg-rose-50 text-rose-800 ring-rose-100',
  sky: 'bg-sky-50 text-sky-800 ring-sky-100',
  slate: 'bg-stone-100 text-slate-700 ring-stone-200',
};

const DOT = {
  emerald: 'bg-emerald-500 ring-emerald-100',
  amber: 'bg-amber-500 ring-amber-100',
  orange: 'bg-orange-500 ring-orange-100',
  rose: 'bg-rose-500 ring-rose-100',
  sky: 'bg-sky-500 ring-sky-100',
  slate: 'bg-slate-400 ring-stone-100',
};

const UpdateCard = ({ item }) => {
  const tone = TONE[item.tone] || TONE.slate;
  const dot = DOT[item.tone] || DOT.slate;
  return (
    <div className="hub-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.title}</p>
          {item.titleTamil && <p className="text-[11px] text-slate-500 font-tamil mt-0.5">{item.titleTamil}</p>}
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">{item.status}</h2>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ring-4 shrink-0 ${tone}`}>
          Live
        </span>
      </div>
      <div className="mt-3 flex items-start gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ring-4 mt-1.5 shrink-0 ${dot}`} />
        <div>
          <p className="text-sm font-medium text-slate-800">{item.detail}</p>
          {item.extra && <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{item.extra}</p>}
        </div>
      </div>
    </div>
  );
};

const LocalUpdatesPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    featureService
      .getLocalUpdatesLive()
      .then(({ data: res }) => {
        setData(res.data);
        setError('');
      })
      .catch(() => {
        if (!silent) setError('Could not load live local updates.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(false);
    const poll = setInterval(() => load(true), POLL_MS);
    const clock = setInterval(() => setTick((n) => n + 1), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, []);

  const items = data?.items || [];
  const city = data?.city || 'Chennai';
  const clock = data?.clock?.clock;
  const age = data?.updatedAt ? Math.max(0, Math.round((Date.now() - new Date(data.updatedAt).getTime()) / 1000)) : null;

  return (
    <>
      <Helmet>
        <title>Local Updates – {city} | The Great India News</title>
      </Helmet>
      <div className="bg-white border-b border-stone-200">
        <div className="container-news py-6 sm:py-8">
          <Link to="/explore" className="text-xs font-semibold text-brand-700 hover:text-brand-900">
            ← Explore All Features
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-slate-900">Local Updates</h1>
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-4 ring-emerald-100">
              Live
            </span>
          </div>
          <p className="text-sm text-slate-600 font-tamil mt-1">உள்ளூர் புதுப்பிப்புகள்</p>
          <p className="text-sm text-slate-600 mt-2">
            Water, power, metro and air quality for {city}
            {clock ? ` · ${clock} IST` : ''}
            {age != null ? ` · updated ${age}s ago` : ''}
          </p>
        </div>
      </div>

      <div className="container-news py-6 space-y-4">
        {error && (
          <p className="text-sm text-rose-700 bg-rose-50 ring-1 ring-rose-100 rounded-2xl px-4 py-3">{error}</p>
        )}

        {loading && !items.length ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="hub-card p-5 animate-pulse h-36 bg-stone-50" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {items.map((item) => (
              <UpdateCard key={item.key || item.title} item={item} />
            ))}
          </div>
        )}

        {data?.weather?.temp != null && (
          <p className="text-[12px] text-slate-500 flex items-center gap-2">
            <FeatureIcon name="pin" className="w-3.5 h-3.5 text-brand-700" />
            {city} {Number(data.weather.temp).toFixed(0)}°C
            {data.weather.humidity != null ? ` · humidity ${Math.round(data.weather.humidity)}%` : ''}
            {data.note ? ` · ${data.note}` : ''}
          </p>
        )}
        <span className="sr-only">{tick}</span>
      </div>
    </>
  );
};

export default LocalUpdatesPage;
