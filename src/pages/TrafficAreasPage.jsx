import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { featureService } from '../services/articleService';
import { FeatureIcon } from '../features/FeatureIcons';

const LEVEL_STYLES = {
  smooth: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  normal: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  moderate: 'bg-amber-50 text-amber-800 ring-amber-100',
  slow: 'bg-orange-50 text-orange-800 ring-orange-100',
  heavy: 'bg-rose-50 text-rose-800 ring-rose-100',
};

const DOT = {
  smooth: 'bg-emerald-500 ring-emerald-100',
  normal: 'bg-emerald-500 ring-emerald-100',
  moderate: 'bg-amber-500 ring-amber-100',
  slow: 'bg-orange-500 ring-orange-100',
  heavy: 'bg-rose-500 ring-rose-100',
};

const AreaCard = ({ row, featured }) => (
  <div
    className={`hub-card p-4 sm:p-5 ${
      featured ? 'ring-1 ring-brand-300 bg-gradient-to-br from-brand-50/70 to-white' : ''
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {row.kind === 'district' ? 'District · ' : 'Area · '}
          {row.region}
        </p>
        <h2 className="text-base font-bold text-slate-900 mt-0.5">{row.name}</h2>
        {row.nameTamil && <p className="text-[11px] text-slate-500 font-tamil">{row.nameTamil}</p>}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ring-4 ${LEVEL_STYLES[row.level] || LEVEL_STYLES.normal}`}>
        {row.statusLabel}
      </span>
    </div>
    <div className="mt-3 flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ring-4 ${DOT[row.level] || DOT.normal}`} />
      <p className="text-sm text-slate-700">{row.detail}</p>
    </div>
    {row.incidents > 0 && (
      <p className="text-[11px] text-slate-500 mt-2">{row.incidents} live roadwork alert{row.incidents > 1 ? 's' : ''}</p>
    )}
  </div>
);

const TrafficAreasPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('all');
  const [kind, setKind] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError('');
    featureService
      .getTrafficLive(manual ? { refresh: '1' } : undefined)
      .then(({ data: res }) => setData(res.data))
      .catch(() => setError('Could not load live traffic.'))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    load(false);
  }, []);

  const areas = data?.areas || [];
  const regions = useMemo(
    () => ['all', ...Array.from(new Set(areas.map((i) => i.region).filter(Boolean)))],
    [areas]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return areas.filter((r) => {
      if (kind === 'districts' && r.kind !== 'district') return false;
      if (kind === 'areas' && r.kind === 'district') return false;
      if (region !== 'all' && r.region !== region) return false;
      if (!needle) return true;
      return (
        String(r.name || '').toLowerCase().includes(needle) ||
        String(r.city || '').toLowerCase().includes(needle) ||
        String(r.nameTamil || '').includes(q.trim()) ||
        String(r.statusLabel || '').toLowerCase().includes(needle) ||
        String(r.region || '').toLowerCase().includes(needle)
      );
    });
  }, [areas, q, region, kind]);

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((row) => {
      const key = row.region || 'Tamil Nadu';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const highlight = data?.highlight || 'chennai';

  return (
    <div className="min-h-[50vh]">
      <Helmet>
        <title>Tamil Nadu Traffic — All Areas | The Great India News</title>
      </Helmet>

      <div className="border-b border-stone-200/80 bg-gradient-to-br from-emerald-50/60 via-white to-stone-50/40">
        <div className="container-news py-6 sm:py-8">
          <Link to="/explore" className="text-xs font-semibold text-brand-700 hover:text-brand-900">
            ← Explore All Features
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <FeatureIcon name="traffic" className="w-8 h-8 text-brand-700" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-headline font-bold text-slate-900">Traffic</h1>
              <p className="text-sm text-slate-600 font-tamil mt-0.5">போக்குவரத்து · தமிழ்நாடு அனைத்து பகுதிகள்</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-3 max-w-2xl">
            Live traffic for every Tamil Nadu district and major city / town areas — fetched automatically.
          </p>
          {data?.summary && (
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <span className="hub-pill bg-white">{data.summary.districts ?? 38} districts</span>
              <span className="hub-pill bg-white">{data.summary.cityAreas ?? 0} city areas</span>
              <span className="hub-pill bg-white">{data.summary.total ?? areas.length} total</span>
              <span className="hub-pill bg-white">Heavy / slow: {data.summary.heavy}</span>
              <span className="hub-pill bg-white">Moderate: {data.summary.moderate}</span>
              <span className="hub-pill bg-white">Normal: {data.summary.normal}</span>
            </div>
          )}
        </div>
      </div>

      <div className="container-news py-6 space-y-5">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search district or area…"
            className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white min-w-[220px] flex-1 max-w-md"
          />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white"
          >
            <option value="all">Districts + areas</option>
            <option value="districts">All 38 districts</option>
            <option value="areas">City / town areas</option>
          </select>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white"
          >
            {regions.map((r) => (
              <option key={r} value={r}>
                {r === 'all' ? 'All areas' : r}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            {refreshing ? 'Fetching…' : 'Fetch live traffic'}
          </button>
          <span className="text-xs text-slate-500">{filtered.length} showing</span>
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
                <AreaCard key={row.slug || row.name} row={row} featured={row.slug === highlight} />
              ))}
            </div>
          </section>
        ))}

        {!loading && !error && !filtered.length && (
          <p className="text-sm text-slate-600">No areas match that search.</p>
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

export default TrafficAreasPage;
