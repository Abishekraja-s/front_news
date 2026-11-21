import { TeamLogo } from './SportsUi';
import { parseScoreParts, statusLabel } from './MatchCard';

const WinProbabilityBar = ({ home, away, draw, homeName, awayName }) => {
  const h = Number(home);
  const a = Number(away);
  const d = Number(draw);
  if (![h, a, d].some((n) => Number.isFinite(n) && n > 0)) return null;
  const total = (Number.isFinite(h) ? h : 0) + (Number.isFinite(a) ? a : 0) + (Number.isFinite(d) ? d : 0);
  if (total <= 0) return null;
  const hp = ((Number.isFinite(h) ? h : 0) / total) * 100;
  const dp = ((Number.isFinite(d) ? d : 0) / total) * 100;
  const ap = ((Number.isFinite(a) ? a : 0) / total) * 100;

  return (
    <div className="mt-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Win probability</p>
      <div className="flex h-2 rounded-full overflow-hidden bg-white/10">
        {hp > 0 && <div className="bg-teal-400 transition-all duration-500" style={{ width: `${hp}%` }} />}
        {dp > 0 && <div className="bg-slate-400 transition-all duration-500" style={{ width: `${dp}%` }} />}
        {ap > 0 && <div className="bg-amber-400 transition-all duration-500" style={{ width: `${ap}%` }} />}
      </div>
      <div className="flex justify-between gap-2 mt-1.5 text-[10px] text-slate-400">
        <span>
          {homeName} {Number.isFinite(h) ? `${Math.round(h)}%` : ''}
        </span>
        {Number.isFinite(d) && d > 0 ? <span>Draw {Math.round(d)}%</span> : <span />}
        <span>
          {awayName} {Number.isFinite(a) ? `${Math.round(a)}%` : ''}
        </span>
      </div>
    </div>
  );
};

const PlayerChip = ({ label, players }) => {
  if (!players?.length) return null;
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">{label}</p>
      <ul className="space-y-1">
        {players.map((p, i) => (
          <li key={p.name || i} className="flex items-baseline justify-between gap-2 text-xs">
            <span className="text-white/90 truncate font-medium">
              {p.name}
              {p.onStrike ? ' *' : ''}
            </span>
            <span className="font-mono text-slate-300 shrink-0">
              {p.runs != null ? `${p.runs}${p.balls != null ? ` (${p.balls})` : ''}` : null}
              {p.wickets != null
                ? `${p.wickets}/${p.runs ?? '—'}${p.overs != null ? ` · ${p.overs}` : ''}`
                : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Google Sports–style dark scoreboard header for match detail.
 */
const GoogleScoreHeader = ({ match, detail, updatedAt }) => {
  if (!match) return null;
  const isLive = match.status === 'live' || match.status === 'halftime';
  const badge = statusLabel(match.status, match.statusDetail);
  const homeParts = parseScoreParts(match.homeScoreText || match.homeScore);
  const awayParts = parseScoreParts(match.awayScoreText || match.awayScore);
  const cricket = detail?.cricket || {};
  const winProb = detail?.winProbability || cricket.winProbability;
  const batters = detail?.currentBatters || cricket.currentBatters;
  const bowlers = detail?.currentBowlers || cricket.currentBowlers;
  const toss = detail?.toss || cricket.toss;
  const venue = detail?.venue || match.venue;
  const series = match.tournament || match.competition || match.league;
  const inningsLabel =
    match.statusDetail ||
    cricket.homeInnings?.display ||
    detail?.summary ||
    '';

  return (
    <header className="rounded-2xl overflow-hidden border border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white shadow-xl">
      <div className="px-4 sm:px-6 pt-4 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
          <div className="min-w-0">
            {series && (
              <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-300/90 truncate">
                {series}
              </p>
            )}
            {venue && <p className="text-xs text-slate-400 mt-1 truncate">{venue}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded ${
                isLive && badge === 'LIVE'
                  ? 'bg-rose-600 text-white animate-pulse'
                  : badge === 'Stumps' || badge === 'Lunch' || badge === 'Tea'
                    ? 'bg-amber-500 text-white'
                    : 'bg-white/10 text-slate-200'
              }`}
            >
              {badge === 'LIVE' ? '● LIVE' : badge}
            </span>
            {updatedAt && (
              <span className="text-[10px] text-slate-500 font-mono">
                Updated {typeof updatedAt === 'string' ? updatedAt : new Date(updatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-6 items-center">
          <div className="flex flex-col items-center sm:items-end gap-2 min-w-0">
            <TeamLogo src={match.homeLogo || detail?.homeLogo} name={match.homeTeam} size="lg" dark />
            <p className="text-sm sm:text-base font-bold text-center sm:text-right break-words">
              {match.homeTeam}
            </p>
            <div className="text-center sm:text-right">
              <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight">{homeParts.main}</p>
              {homeParts.overs ? (
                <p className="text-xs text-slate-400 font-mono mt-0.5">{homeParts.overs} ov</p>
              ) : cricket.homeInnings?.overs ? (
                <p className="text-xs text-slate-400 font-mono mt-0.5">{cricket.homeInnings.overs} ov</p>
              ) : null}
            </div>
          </div>

          <div className="text-center px-1">
            <p className="text-[10px] uppercase text-slate-500 tracking-widest">vs</p>
          </div>

          <div className="flex flex-col items-center sm:items-start gap-2 min-w-0">
            <TeamLogo src={match.awayLogo || detail?.awayLogo} name={match.awayTeam} size="lg" dark />
            <p className="text-sm sm:text-base font-bold text-center sm:text-left break-words">
              {match.awayTeam}
            </p>
            <div className="text-center sm:text-left">
              <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight">{awayParts.main}</p>
              {awayParts.overs ? (
                <p className="text-xs text-slate-400 font-mono mt-0.5">{awayParts.overs} ov</p>
              ) : cricket.awayInnings?.overs ? (
                <p className="text-xs text-slate-400 font-mono mt-0.5">{cricket.awayInnings.overs} ov</p>
              ) : null}
            </div>
          </div>
        </div>

        {inningsLabel && (
          <p className="text-center text-sm text-slate-300 mt-4 leading-snug">{inningsLabel}</p>
        )}
        {detail?.summary && detail.summary !== inningsLabel && (
          <p className="text-center text-xs text-slate-400 mt-1.5 leading-relaxed">{detail.summary}</p>
        )}

        {winProb && (
          <WinProbabilityBar
            home={winProb.home}
            away={winProb.away}
            draw={winProb.draw}
            homeName={match.homeTeam}
            awayName={match.awayTeam}
          />
        )}

        {(batters?.length || bowlers?.length) && (
          <div className="mt-4 grid sm:grid-cols-2 gap-4 pt-3 border-t border-white/10">
            <PlayerChip label="Batters" players={batters} />
            <PlayerChip label="Bowlers" players={bowlers} />
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 border-t border-white/10 pt-3">
          {toss && (
            <span>
              Toss:{' '}
              {typeof toss === 'string'
                ? toss
                : [toss.winner || toss.team, toss.decision || toss.elected].filter(Boolean).join(' — ')}
            </span>
          )}
          {venue && <span>Venue: {venue}</span>}
          <span>Times shown in your local timezone</span>
        </div>
      </div>
    </header>
  );
};

export default GoogleScoreHeader;
