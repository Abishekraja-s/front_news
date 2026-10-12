import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { featureService } from '../services/articleService';
import { FeatureIcon } from '../features/FeatureIcons';

const formatValue = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString('en-IN', { maximumFractionDigits: v >= 1000 ? 1 : 2 });
};

const IndexCard = ({ row, featured }) => {
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
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{row.region || 'Market'}</p>
          <h2 className="text-base font-bold text-slate-900 mt-0.5">{row.name}</h2>
          {row.nameTamil && <p className="text-[11px] text-slate-500 font-tamil">{row.nameTamil}</p>}
        </div>
        {row.marketState && (
          <span className="text-[10px] font-semibold uppercase text-slate-400">{row.marketState}</span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
        {formatValue(row.value)}
      </p>
      {row.changePercent != null && (
        <p className={`text-[11px] font-bold mt-2 ${up ? 'text-emerald-700' : down ? 'text-rose-700' : 'text-slate-500'}`}>
          {up ? '↑' : down ? '↓' : '→'}{' '}
          {row.change != null ? `${row.change > 0 ? '+' : ''}${formatValue(row.change)} · ` : ''}
          {Math.abs(row.changePercent).toFixed(2)}%
        </p>
      )}
    </div>
  );
};

const MarketIndexesPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError('');
    featureService
      .getMarketLive(manual ? { refresh: '1' } : undefined)
      .then(({ data: res }) => setData(res.data))
      .catch(() => setError('Could not load live market indexes.'))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    load(false);
    const poll = setInterval(() => load(true), 60 * 1000);
    return () => clearInterval(poll);
  }, []);

  const indexes = data?.indexes || [];
  const regions = useMemo(
    () => ['all', ...Array.from(new Set(indexes.map((i) => i.region).filter(Boolean)))],
    [indexes]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return indexes.filter((r) => {
      if (region !== 'all' && r.region !== region) return false;
      if (!needle) return true;
      return (
        String(r.name || '').toLowerCase().includes(needle) ||
        String(r.symbol || '').toLowerCase().includes(needle) ||
        String(r.nameTamil || '').includes(q.trim()) ||
        String(r.region || '').toLowerCase().includes(needle)
      );
    });
  }, [indexes, q, region]);

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((row) => {
      const key = row.region || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const highlight = data?.highlight || '^NSEI';

  return (
    <div className="min-h-[50vh]">
      <Helmet>
        <title>Live Market Indexes | The Great India News</title>
      </Helmet>

      <div className="border-b border-stone-200/80 bg-gradient-to-br from-sky-50/50 via-white to-stone-50/40">
        <div className="container-news py-6 sm:py-8">
          <Link to="/explore" className="text-xs font-semibold text-brand-700 hover:text-brand-900">
            ← Explore All Features
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <FeatureIcon name="chart" className="w-8 h-8 text-brand-700" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-headline font-bold text-slate-900">Market</h1>
              <p className="text-sm text-slate-600 font-tamil mt-0.5">சந்தை · பங்குச் சுட்டெண்கள்</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-3 max-w-2xl">
            Live Nifty, Sensex and global indexes — fetched automatically.
          </p>
        </div>
      </div>

      <div className="container-news py-6 space-y-5">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search NIFTY, Sensex, Nasdaq…"
            className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white min-w-[220px] flex-1 max-w-md"
          />
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white"
          >
            {regions.map((r) => (
              <option key={r} value={r}>
                {r === 'all' ? 'All markets' : r}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            {refreshing ? 'Fetching…' : 'Fetch live rates'}
          </button>
          <span className="text-xs text-slate-500">{filtered.length} indexes</span>
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

        {!loading && !error && grouped.map(([label, rows]) => (
          <section key={label}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">{label}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rows.map((row) => (
                <IndexCard key={row.symbol || row.name} row={row} featured={row.symbol === highlight} />
              ))}
            </div>
          </section>
        ))}

        {!loading && !error && !filtered.length && (
          <p className="text-sm text-slate-600">No indexes match that search.</p>
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

export default MarketIndexesPage;
