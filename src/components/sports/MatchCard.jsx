import { Link } from 'react-router-dom';
import { TeamLogo } from './SportsUi';

export const SPORT_LABELS = {
  cricket: 'Cricket',
  football: 'Football',
  basketball: 'Basketball',
  tennis: 'Tennis',
  other: 'Other',
  chess: 'Chess',
};

export const statusLabel = (status, statusDetail = '') => {
  const detail = String(statusDetail || '').toLowerCase();
  if (/stumps|day\s*\d|lunch|tea|drinks/i.test(detail) || /stumps/i.test(status)) {
    if (/stumps/i.test(detail)) return 'Stumps';
    if (/lunch/i.test(detail)) return 'Lunch';
    if (/tea/i.test(detail)) return 'Tea';
  }
  if (status === 'live' || status === 'halftime') return 'LIVE';
  if (status === 'finished') return 'Completed';
  if (status === 'scheduled') return 'Upcoming';
  if (status === 'postponed') return 'Postponed';
  if (status === 'cancelled') return 'Cancelled';
  return status || 'Upcoming';
};

export const scoreOf = (m) => {
  if (m?.homeScoreText || m?.awayScoreText) {
    return { home: m.homeScoreText || '—', away: m.awayScoreText || '—' };
  }
  return { home: String(m?.homeScore ?? 0), away: String(m?.awayScore ?? 0) };
};

/** Parse "245/6 (48.2 ov)" style strings for compact card display */
export const parseScoreParts = (text = '') => {
  const s = String(text || '').trim();
  if (!s || s === '—' || s === '-') return { main: '—', overs: '' };
  const m = s.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (m) {
    return {
      main: m[1].trim(),
      overs: String(m[2]).replace(/\s*ov(ers?)?/i, '').trim(),
    };
  }
  return { main: s, overs: '' };
};

const badgeClass = (label, isLive) => {
  if (isLive && label === 'LIVE') return 'bg-rose-600 text-white';
  if (label === 'Stumps' || label === 'Lunch' || label === 'Tea') return 'bg-amber-500/90 text-white';
  if (label === 'Completed') return 'bg-slate-600 text-white';
  if (label === 'Upcoming') return 'bg-teal-700 text-white';
  return 'bg-slate-700 text-white';
};

/**
 * Google Search–style cricket match card (on-brand teal/slate).
 */
const MatchCard = ({ match, className = '', compact = false }) => {
  if (!match) return null;
  const score = scoreOf(match);
  const homeParts = parseScoreParts(score.home);
  const awayParts = parseScoreParts(score.away);
  const isLive = match.status === 'live' || match.status === 'halftime';
  const badge = statusLabel(match.status, match.statusDetail);
  const to = match._id ? `/live-sports/match/${match._id}` : '/live-sports';
  const league = match.tournament || match.league || match.competition;
  const updatedAt = match.lastSyncedAt || match.lastUpdatedAt;
  const statusLine =
    match.statusDetail ||
    match.liveClock ||
    (match.startTime ? new Date(match.startTime).toLocaleString() : '');

  return (
    <Link
      to={to}
      className={`block rounded-2xl border border-stone-200/80 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white p-3.5 sm:p-4 overflow-hidden transition-all hover:shadow-lg hover:border-teal-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 snap-start shrink-0 ${
        compact ? 'w-[min(100%,20rem)] min-w-[17rem]' : ''
      } ${className}`}
    >
      <article>
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[10px] uppercase font-semibold tracking-wide text-teal-300/90 min-w-0 break-words leading-snug">
            {league || SPORT_LABELS[match.sport] || match.sport}
          </span>
          <span
            className={`text-[9px] font-bold uppercase shrink-0 px-2 py-0.5 rounded ${badgeClass(badge, isLive)} ${
              isLive && badge === 'LIVE' ? 'animate-pulse' : ''
            }`}
          >
            {badge === 'LIVE' ? '● LIVE' : badge}
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <TeamLogo
              src={match.homeLogo || match.stats?.homeLogo}
              name={match.homeTeam}
              size="sm"
              dark
            />
            <span className="text-sm font-semibold text-white/95 break-words flex-1 min-w-0">
              {match.homeTeam}
            </span>
            <div className="text-right shrink-0">
              <p className="font-mono text-sm font-bold text-white leading-tight">{homeParts.main}</p>
              {homeParts.overs ? (
                <p className="text-[10px] text-slate-400 font-mono">{homeParts.overs} ov</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <TeamLogo
              src={match.awayLogo || match.stats?.awayLogo}
              name={match.awayTeam}
              size="sm"
              dark
            />
            <span className="text-sm font-semibold text-white/95 break-words flex-1 min-w-0">
              {match.awayTeam}
            </span>
            <div className="text-right shrink-0">
              <p className="font-mono text-sm font-bold text-white leading-tight">{awayParts.main}</p>
              {awayParts.overs ? (
                <p className="text-[10px] text-slate-400 font-mono">{awayParts.overs} ov</p>
              ) : null}
            </div>
          </div>
        </div>

        {(statusLine || updatedAt) && (
          <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-1.5">
            {statusLine ? (
              <p className="text-[11px] text-slate-300 line-clamp-2 flex-1 min-w-0">{statusLine}</p>
            ) : (
              <span />
            )}
            {updatedAt ? (
              <p className="text-[10px] text-slate-500 shrink-0">
                Updated {new Date(updatedAt).toLocaleTimeString()}
              </p>
            ) : null}
          </div>
        )}
      </article>
    </Link>
  );
};

export default MatchCard;
