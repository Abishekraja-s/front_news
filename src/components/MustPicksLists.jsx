import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { articleService, googleNewsService } from '../services/articleService';
import { getArticlePath } from '../utils/articlePaths';
import NewsImage from './NewsImage';

const itemImage = (item) =>
  item?.featuredImage || item?.image || item?.ogImage || item?.thumbnail || '';

const itemTime = (item) => {
  const t = item?.publishedAt || item?.updatedAt || item?.createdAt;
  const ms = t ? new Date(t).getTime() : 0;
  return Number.isFinite(ms) ? ms : 0;
};

const PickList = ({ heading, items, accentClass = 'text-brand-600' }) => {
  if (!items?.length) return null;
  return (
    <div className="mb-5 last:mb-0">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 mb-2.5">
        {heading}
      </h3>
      <ul className="space-y-3">
        {items.map((item) => {
          const img = itemImage(item);
          return (
            <li key={item._id || item.slug}>
              <Link
                to={getArticlePath(item)}
                className="group flex gap-2.5 items-start min-w-0"
              >
                <div className="w-16 h-12 sm:w-[72px] sm:h-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-black/5">
                  <NewsImage
                    src={img}
                    seed={item.slug || item._id}
                    alt={item.imageAlt || item.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <span
                  className={`min-w-0 flex-1 text-sm font-medium leading-snug line-clamp-3 group-hover:underline ${accentClass}`}
                >
                  {item.title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/**
 * Compact MUST READ + MUST WATCH lists for article sidebars.
 * Must Read → Google News flagged items (newest first)
 * Must Watch → same recent news as homepage top (latest), order by publishedAt
 */
const MustPicksLists = ({ excludeSlug = '', className = '' }) => {
  const [mustRead, setMustRead] = useState([]);
  const [mustWatch, setMustWatch] = useState([]);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      googleNewsService.getMustPicks('must-read', 8),
      // Homepage "Latest" — recent published news in order
      articleService.getLatest(10),
      articleService.getMustWatch(8),
    ]).then(([readRes, latestRes, aWatchRes]) => {
      if (cancelled) return;

      const readItems =
        readRes.status === 'fulfilled' ? readRes.value.data?.data || [] : [];
      const latest =
        latestRes.status === 'fulfilled' ? latestRes.value.data?.data || [] : [];
      const aWatch =
        aWatchRes.status === 'fulfilled' ? aWatchRes.value.data?.data || [] : [];

      const filterOut = (list) =>
        list.filter((item) => item?.slug && item.slug !== excludeSlug);

      // Homepage recent order first; fill gaps with must-watch flags; keep newest → oldest
      const watchMap = new Map();
      [...latest, ...aWatch]
        .filter((item) => item?.slug && item.slug !== excludeSlug)
        .sort((a, b) => itemTime(b) - itemTime(a))
        .forEach((item) => {
          if (!watchMap.has(item.slug)) watchMap.set(item.slug, item);
        });

      setMustRead(
        filterOut(readItems)
          .sort((a, b) => itemTime(b) - itemTime(a))
          .slice(0, 6)
      );
      setMustWatch([...watchMap.values()].slice(0, 6));
    });

    return () => {
      cancelled = true;
    };
  }, [excludeSlug]);

  if (!mustRead.length && !mustWatch.length) return null;

  return (
    <div className={`rounded-xl border border-stone-200 bg-white p-4 ${className}`}>
      <PickList heading="MUST READ -" items={mustRead} accentClass="text-brand-600" />
      <PickList heading="MUST WATCH -" items={mustWatch} accentClass="text-rose-600" />
    </div>
  );
};

export default MustPicksLists;
