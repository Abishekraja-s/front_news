import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { featureService } from '../services/articleService';
import { FeatureIcon } from '../features/FeatureIcons';

const POLL_MS = 60 * 1000;

const inr = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: v >= 1000 ? 1 : 2 })}`;
};

const Change = ({ pct, ch }) => {
  if (pct == null) return null;
  const up = pct > 0;
  const down = pct < 0;
  return (
    <span className={`text-xs font-bold ${up ? 'text-emerald-600' : down ? 'text-rose-600' : 'text-slate-500'}`}>
      {up ? '▲' : down ? '▼' : '•'} {ch != null ? `${ch > 0 ? '+' : ''}${ch} · ` : ''}
      {Math.abs(pct).toFixed(2)}%
    </span>
  );
};

const Stat = ({ label, value }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">{label}</p>
    <p className="text-xs font-semibold text-slate-800 mt-0.5">{value ?? '—'}</p>
  </div>
);

const StockCard = ({ row, compact }) => {
  const up = (row.changePercent || 0) > 0;
  const down = (row.changePercent || 0) < 0;
  return (
    <article
      className={`rounded-2xl p-4 ring-1 bg-white ${
        up ? 'ring-emerald-100' : down ? 'ring-rose-100' : 'ring-stone-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-black tracking-wider text-emerald-700">{row.ticker}</p>
          <h3 className="text-sm font-bold text-slate-900 truncate">{row.name}</h3>
          {row.nameTamil && <p className="text-[11px] text-slate-500 font-tamil leading-relaxed">{row.nameTamil}</p>}
        </div>
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 shrink-0">
          {row.sector}
        </span>
      </div>
      <p className="text-xl font-extrabold text-slate-900 mt-2">{inr(row.price)}</p>
      <Change pct={row.changePercent} ch={row.change} />
      {!compact && (
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-stone-100">
          <Stat label="Open" value={inr(row.open)} />
          <Stat label="High" value={inr(row.high)} />
          <Stat label="Low" value={inr(row.low)} />
          <Stat label="Prev" value={inr(row.prevClose)} />
          <Stat label="Volume" value={row.volumeLabel} />
          <Stat label="52W H" value={inr(row.week52High)} />
          <Stat label="52W L" value={inr(row.week52Low)} />
        </div>
      )}
    </article>
  );
};

const StockWatchlistPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [sector, setSector] = useState('all');
  const [tick, setTick] = useState(0);

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    featureService
      .getStocksLive()
      .then(({ data: res }) => {
        setData(res.data);
        setError('');
      })
      .catch(() => {
        if (!silent) setError('Could not load live stocks.');
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

  const stocks = data?.stocks || [];
  const indexes = data?.indexes || [];
  const sectors = useMemo(() => ['all', ...Array.from(new Set(stocks.map((s) => s.sector).filter(Boolean)))], [stocks]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return stocks.filter((s) => {
      if (sector !== 'all' && s.sector !== sector) return false;
      if (!needle) return true;
      return (
        s.name.toLowerCase().includes(needle) ||
        s.ticker.toLowerCase().includes(needle) ||
        (s.nameTamil || '').includes(q.trim()) ||
        (s.sector || '').toLowerCase().includes(needle)
      );
    });
  }, [stocks, q, sector]);

  const age = data?.updatedAt ? Math.max(0, Math.round((Date.now() - new Date(data.updatedAt).getTime()) / 1000)) : null;
  const ageLabel = age == null ? '' : age < 60 ? `${age}s ago` : `${Math.floor(age / 60)}m ${age % 60}s ago`;

  return (
    <>
      <Helmet>
        <title>Stock Watchlist | The Great India News</title>
      </Helmet>
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 text-white">
        <div className="container-news py-7 sm:py-10 relative">
          <Link to="/explore" className="text-xs font-semibold text-white/85 hover:text-white">
            ← Explore All Features
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="w-14 h-14 rounded-3xl bg-white text-emerald-700 flex items-center justify-center shadow-lg">
              <FeatureIcon name="chart" className="w-7 h-7" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl sm:text-4xl font-headline font-bold">Stock Watchlist</h1>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/20">
                  Live
                </span>
              </div>
              <p className="text-base font-tamil leading-relaxed mt-1 text-white/95">பங்குகள்</p>
            </div>
          </div>
          <p className="text-sm text-white/90 mt-3">
            NIFTY 50 stocks with full quotes · auto-refresh every minute
            {age != null ? ` · updated ${ageLabel}` : ''}
          </p>
          <span className="sr-only">{tick}</span>
        </div>
      </div>

      <div className="bg-gradient-to-b from-emerald-50 via-white to-teal-50 min-h-[50vh]">
        <div className="container-news py-6 space-y-5">
          {error && (
            <p className="text-sm text-rose-700 bg-rose-50 ring-1 ring-rose-100 rounded-2xl px-4 py-3">{error}</p>
          )}

          {indexes.length > 0 && (
            <div className="grid sm:grid-cols-3 gap-3">
              {indexes.map((row) => (
                <div key={row.symbol} className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
                  <p className="text-[10px] font-bold uppercase text-emerald-700">{row.name}</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{inr(row.price).replace('₹', '')}</p>
                  <Change pct={row.changePercent} ch={row.change} />
                </div>
              ))}
            </div>
          )}

          {(data?.gainers?.length || data?.losers?.length) > 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                <p className="text-xs font-black uppercase text-emerald-800 mb-2">Top gainers</p>
                {(data.gainers || []).slice(0, 3).map((s) => (
                  <p key={s.symbol} className="text-sm flex justify-between gap-2 py-0.5">
                    <span className="font-semibold text-slate-800 truncate">{s.ticker}</span>
                    <Change pct={s.changePercent} ch={s.change} />
                  </p>
                ))}
              </div>
              <div className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-100">
                <p className="text-xs font-black uppercase text-rose-800 mb-2">Top losers</p>
                {(data.losers || []).slice(0, 3).map((s) => (
                  <p key={s.symbol} className="text-sm flex justify-between gap-2 py-0.5">
                    <span className="font-semibold text-slate-800 truncate">{s.ticker}</span>
                    <Change pct={s.changePercent} ch={s.change} />
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search stock, ticker or sector"
              className="flex-1 rounded-2xl border border-emerald-200 px-4 py-2.5 text-sm"
            />
            <button
              type="button"
              onClick={() => load(true)}
              className="rounded-2xl bg-emerald-600 text-white text-sm font-bold px-4 py-2.5"
            >
              Refresh now
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {sectors.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSector(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  sector === s ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 ring-1 ring-emerald-100'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          {loading && !stocks.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-emerald-100/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((row) => (
                <StockCard key={row.symbol} row={row} />
              ))}
            </div>
          )}
          {data?.note && (
            <p className="text-[12px] text-slate-500">
              {data.note} · {filtered.length} of {data.count || stocks.length} stocks
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default StockWatchlistPage;
