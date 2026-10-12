import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { featureService } from '../services/articleService';
import { FeatureIcon } from '../features/FeatureIcons';

const formatInr = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  const digits = v >= 100 ? 2 : v >= 10 ? 3 : v >= 1 ? 4 : 5;
  return `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: digits })}`;
};

const CurrencyCard = ({ row, featured }) => {
  const up = row.changePercent > 0;
  const down = row.changePercent < 0;
  return (
    <div
      className={`hub-card p-4 sm:p-5 ${
        featured ? 'ring-1 ring-brand-300 bg-gradient-to-br from-brand-50/70 to-white' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{row.pair}</p>
          <h2 className="text-base font-bold text-slate-900 mt-0.5">{row.name || row.code}</h2>
          {row.nameTamil && <p className="text-[11px] text-slate-500 font-tamil">{row.nameTamil}</p>}
        </div>
        <span className="text-sm font-extrabold text-brand-800">{row.code}</span>
      </div>
      <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
        {formatInr(row.rate)}
      </p>
      <p className="text-[11px] text-slate-500 mt-1">per 1 {row.code}</p>
      {row.changePercent != null && (
        <p className={`text-[11px] font-bold mt-2 ${up ? 'text-emerald-700' : down ? 'text-rose-700' : 'text-slate-500'}`}>
          {up ? '↑' : down ? '↓' : '→'} {Math.abs(row.changePercent).toFixed(2)}%
        </p>
      )}
    </div>
  );
};

const CurrencyRatesPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError('');
    featureService
      .getCurrencyLive(manual ? { refresh: '1' } : undefined)
      .then(({ data: res }) => setData(res.data))
      .catch(() => setError('Could not load live currency rates.'))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    load(false);
  }, []);

  const rates = data?.rates || [];
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rates;
    return rates.filter(
      (r) =>
        r.code.toLowerCase().includes(needle) ||
        String(r.name || '').toLowerCase().includes(needle) ||
        String(r.nameTamil || '').includes(q.trim()) ||
        String(r.pair || '').toLowerCase().includes(needle)
    );
  }, [rates, q]);

  const highlight = data?.highlight || 'USD';

  return (
    <div className="min-h-[50vh]">
      <Helmet>
        <title>Currency Rates vs INR | The Great India News</title>
      </Helmet>

      <div className="border-b border-stone-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-stone-50/40">
        <div className="container-news py-6 sm:py-8">
          <Link to="/explore" className="text-xs font-semibold text-brand-700 hover:text-brand-900">
            ← Explore All Features
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <FeatureIcon name="currency" className="w-8 h-8 text-brand-700" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-headline font-bold text-slate-900">Currency</h1>
              <p className="text-sm text-slate-600 font-tamil mt-0.5">நாணயம் · அந்நிய செலாவணி</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-3 max-w-2xl">
            Live foreign exchange rates in Indian Rupees. All major world currencies fetched automatically.
          </p>
        </div>
      </div>

      <div className="container-news py-6 space-y-5">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search USD, Euro, திர்ஹாம்…"
            className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white min-w-[220px] flex-1 max-w-md"
          />
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            {refreshing ? 'Fetching…' : 'Fetch live rates'}
          </button>
          <span className="text-xs text-slate-500">{filtered.length} currencies</span>
        </div>

        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl skeleton" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-2xl px-4 py-3">{error}</div>
        )}

        {!loading && !error && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((row) => (
              <CurrencyCard key={row.code} row={row} featured={row.code === highlight} />
            ))}
          </div>
        )}

        {!loading && !error && !filtered.length && (
          <p className="text-sm text-slate-600">No currencies match that search.</p>
        )}

        {data?.source && (
          <p className="text-[11px] text-slate-400">
            Live via {data.source}
            {data.note ? ` · ${data.note}` : ''}
            {data.updatedAt && (
              <> · Updated {new Date(data.updatedAt).toLocaleString('en-IN')}</>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export default CurrencyRatesPage;
