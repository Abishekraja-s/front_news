import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { sportsService } from '../services/articleService';
import MatchCard, { SPORT_LABELS } from '../components/sports/MatchCard';

const POLL_MS = 45_000;

const formatClock = (d) =>
  d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const LiveSports = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [title, setTitle] = useState('Live Sports');
  const [titleTa, setTitleTa] = useState('நேரடி விளையாட்டு');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sport, setSport] = useState(searchParams.get('sport') || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'live');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [visible, setVisible] = useState(
    typeof document === 'undefined' ? true : document.visibilityState !== 'hidden'
  );
  const carouselRef = useRef(null);
  const autoAdvanceRef = useRef(null);

  useEffect(() => {
    const next = new URLSearchParams();
    if (sport !== 'all') next.set('sport', sport);
    if (status !== 'all') next.set('status', status);
    setSearchParams(next, { replace: true });
  }, [sport, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const fetchList = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const { data } = await sportsService.getPublicList({
          page,
          limit: 18,
          sport: sport === 'all' ? undefined : sport,
          status,
        });
        setMatches(data.data?.matches || []);
        setStandings(data.data?.standings || []);
        setTitle(data.title || 'Live Sports');
        setTitleTa(data.titleTa || 'நேரடி விளையாட்டு');
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
        setUpdatedAt(new Date());
      } catch {
        if (!silent) {
          setMatches([]);
          setStandings([]);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [page, sport, status]
  );

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!visible) return undefined;
    const timer = setInterval(() => fetchList({ silent: true }), POLL_MS);
    return () => clearInterval(timer);
  }, [fetchList, visible]);

  const liveMatches = matches.filter((m) => m.status === 'live' || m.status === 'halftime');
  const showLiveStrip = status === 'live' || liveMatches.length > 0;

  useEffect(() => {
    if (!visible || liveMatches.length < 2) return undefined;
    const el = carouselRef.current;
    if (!el) return undefined;

    autoAdvanceRef.current = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      const cardWidth = el.querySelector('a')?.offsetWidth || 280;
      const gap = 12;
      const step = cardWidth + gap;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      const next = el.scrollLeft + step;
      el.scrollTo({
        left: next >= maxScroll - 8 ? 0 : next,
        behavior: 'smooth',
      });
    }, 8000);

    return () => clearInterval(autoAdvanceRef.current);
  }, [liveMatches.length, visible, matches]);

  return (
    <div className="min-h-[50vh]">
      <Helmet>
        <title>{titleTa || title} | The Great India News</title>
        <meta name="description" content="Live scores, upcoming matches, results and standings." />
      </Helmet>

      <div className="border-b border-stone-200 bg-white/70">
        <div className="container-news py-8">
          <Link to="/" className="text-xs font-semibold text-brand-700 hover:underline">
            ← முகப்பு
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-3 mt-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-teal-700">Sports</p>
              <h1 className="text-3xl font-headline font-bold text-slate-900 mt-1">{titleTa || title}</h1>
              {title && titleTa && title !== titleTa && (
                <p className="text-sm text-slate-500 mt-1">{title}</p>
              )}
            </div>
            {updatedAt && (
              <p className="text-xs text-slate-500 font-mono">
                Updated {formatClock(updatedAt)}
                {!visible ? ' · paused' : ''}
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {['all', 'cricket', 'football', 'basketball', 'tennis', 'chess', 'other'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSport(s);
                    setPage(1);
                  }}
                  className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg capitalize ${
                    sport === s ? 'bg-slate-900 text-white' : 'bg-white border border-stone-200 text-slate-600'
                  }`}
                >
                  {SPORT_LABELS[s] || s}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide w-full">
              {[
                { id: 'live', label: 'Live' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'finished', label: 'Results' },
                { id: 'all', label: 'All fixtures' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setStatus(s.id);
                    setPage(1);
                  }}
                  className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg ${
                    status === s.id ? 'bg-teal-700 text-white' : 'bg-white border border-stone-200 text-slate-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container-news py-8 space-y-10">
        {loading ? (
          <div className="space-y-6">
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-40 w-72 shrink-0 rounded-2xl" />
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton h-36 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {showLiveStrip && liveMatches.length > 0 && (
              <section>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Live now
                  </h2>
                  <p className="text-[11px] text-slate-400">Swipe · auto-advances</p>
                </div>
                <div
                  ref={carouselRef}
                  className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-1 px-1 scroll-smooth"
                >
                  {liveMatches.map((m) => (
                    <MatchCard key={`live-${m._id}`} match={m} compact />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                {status === 'upcoming'
                  ? 'Upcoming matches'
                  : status === 'finished'
                    ? 'Results'
                    : status === 'all'
                      ? 'All fixtures'
                      : 'Live matches'}
              </h2>
              {!matches.length ? (
                <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-12 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    {status === 'live' ? 'No live matches right now' : 'No matches found'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Scores refresh automatically when matches are live.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-400 mb-3">{pagination.total} matches</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {matches.map((m) => (
                      <MatchCard key={m._id} match={m} />
                    ))}
                  </div>
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-8">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="btn-secondary text-sm disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-slate-500">
                        Page {pagination.page} / {pagination.pages}
                      </span>
                      <button
                        type="button"
                        disabled={page >= pagination.pages}
                        onClick={() => setPage((p) => p + 1)}
                        className="btn-secondary text-sm disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            {standings.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Standings</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {standings.map((table) => (
                    <div key={table._id} className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
                      <div className="px-4 py-3 border-b border-stone-100">
                        <h3 className="text-sm font-semibold">{table.league}</h3>
                        <p className="text-[10px] text-slate-400 uppercase">
                          {SPORT_LABELS[table.sport] || table.sport}
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm min-w-[280px]">
                          <thead>
                            <tr className="text-left text-slate-400 border-b border-stone-100">
                              <th className="px-3 py-2">#</th>
                              <th className="px-3 py-2">Team</th>
                              <th className="px-3 py-2">P</th>
                              <th className="px-3 py-2">W</th>
                              <th className="px-3 py-2">Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(table.rows || []).slice(0, 10).map((row, i) => (
                              <tr key={`${row.team}-${i}`} className="border-b border-stone-50 last:border-0">
                                <td className="px-3 py-2 text-slate-500">{row.rank || i + 1}</td>
                                <td className="px-3 py-2 font-medium">{row.team}</td>
                                <td className="px-3 py-2">{row.played ?? '—'}</td>
                                <td className="px-3 py-2">{row.won ?? '—'}</td>
                                <td className="px-3 py-2 font-semibold">{row.points ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LiveSports;
