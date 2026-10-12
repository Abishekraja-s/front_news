import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { featureService } from '../services/articleService';
import { FeatureIcon } from '../features/FeatureIcons';

const POLL_MS = 4000;
const TABS = [
  { id: 'events', label: 'Events', labelTa: 'நிகழ்வுகள்', color: 'bg-orange-500' },
  { id: 'births', label: 'Births', labelTa: 'பிறப்பு', color: 'bg-violet-500' },
  { id: 'deaths', label: 'Deaths', labelTa: 'இறப்பு', color: 'bg-slate-700' },
  { id: 'holidays', label: 'Holidays', labelTa: 'விடுமுறை', color: 'bg-emerald-500' },
  { id: 'tamil', label: 'Tamil', labelTa: 'தமிழ்', color: 'bg-rose-500' },
];

const HistoryCard = ({ row, featured }) => (
  <article
    className={`rounded-2xl p-4 sm:p-5 ring-1 transition-all ${
      featured
        ? 'bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 text-white ring-transparent shadow-lg'
        : 'bg-white ring-orange-100 hover:ring-orange-200'
    }`}
  >
    <div className="flex gap-3">
      {row.thumbnail && (
        <img
          src={row.thumbnail}
          alt=""
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 bg-stone-100"
        />
      )}
      <div className="min-w-0">
        <p className={`text-xs font-black tracking-wide ${featured ? 'text-white/90' : 'text-orange-600'}`}>
          {row.year != null ? row.year : 'On this day'}
          {row.india ? ' · India' : ''}
        </p>
        {row.title && (
          <h3 className={`text-sm font-bold mt-0.5 ${featured ? 'text-white' : 'text-slate-900'}`}>{row.title}</h3>
        )}
        <p className={`text-sm leading-relaxed mt-1 ${featured ? 'text-white/95' : 'text-slate-700'}`}>{row.text}</p>
        {row.url && (
          <a
            href={row.url}
            target="_blank"
            rel="noreferrer"
            className={`inline-block text-xs font-semibold mt-2 ${featured ? 'text-white underline' : 'text-orange-700'}`}
          >
            Read more →
          </a>
        )}
      </div>
    </div>
  </article>
);

const TodayInHistoryPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('events');
  const [tick, setTick] = useState(0);

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    featureService
      .getTodayInHistoryLive()
      .then(({ data: res }) => {
        setData(res.data);
        setError('');
      })
      .catch(() => {
        if (!silent) setError('Could not load today in history.');
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

  const lists = useMemo(
    () => ({
      events: data?.events || [],
      births: data?.births || [],
      deaths: data?.deaths || [],
      holidays: data?.holidays || [],
      tamil: data?.tamilEvents || [],
    }),
    [data]
  );

  const items = lists[tab] || [];
  const featuredIndex = items.length ? tick % items.length : 0;
  const featured = items[featuredIndex];
  const rest = items.filter((_, i) => i !== featuredIndex);
  const age = data?.updatedAt ? Math.max(0, Math.round((Date.now() - new Date(data.updatedAt).getTime()) / 1000)) : null;

  return (
    <>
      <Helmet>
        <title>Today in History | The Great India News</title>
      </Helmet>
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 text-white">
        <div className="absolute -top-16 -right-8 w-52 h-52 rounded-full bg-yellow-300/30 blur-2xl" />
        <div className="container-news py-7 sm:py-10 relative">
          <Link to="/explore" className="text-xs font-semibold text-white/85 hover:text-white">
            ← Explore All Features
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="w-14 h-14 rounded-3xl bg-white text-orange-600 flex items-center justify-center shadow-lg">
              <FeatureIcon name="history" className="w-7 h-7" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl sm:text-4xl font-headline font-bold">Today in History</h1>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/20">
                  Live
                </span>
              </div>
              <p className="text-base font-tamil leading-relaxed mt-1 text-white/95">வரலாற்றில் இன்று</p>
            </div>
          </div>
          <p className="text-sm text-white/90 mt-3">
            {data?.dateLabel || 'On this day'}
            {data?.clock ? ` · ${data.clock} IST` : ''}
            {age != null ? ` · updated ${age}s ago` : ''}
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-b from-orange-50 via-white to-amber-50 min-h-[50vh]">
        <div className="container-news py-6 space-y-4">
          {error && (
            <p className="text-sm text-rose-700 bg-rose-50 ring-1 ring-rose-100 rounded-2xl px-4 py-3">{error}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {TABS.filter((t) => t.id !== 'tamil' || (data?.tamilEvents || []).length).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold ${
                  tab === t.id ? `${t.color} text-white shadow-md` : 'bg-white text-slate-700 ring-1 ring-orange-100'
                }`}
              >
                {t.label}
                <span className="ml-1 opacity-80 font-tamil">{t.labelTa}</span>
              </button>
            ))}
          </div>

          {loading && !items.length ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-orange-100/60 animate-pulse" />
              ))}
            </div>
          ) : !items.length ? (
            <p className="text-sm text-slate-600 bg-white rounded-2xl p-5 ring-1 ring-orange-100">No entries in this tab yet.</p>
          ) : (
            <div className="space-y-3">
              {featured && <HistoryCard row={featured} featured />}
              {rest.map((row) => (
                <HistoryCard key={row.id} row={row} />
              ))}
            </div>
          )}

          {data?.note && <p className="text-[12px] text-slate-500">{data.note}</p>}
        </div>
      </div>
    </>
  );
};

export default TodayInHistoryPage;
