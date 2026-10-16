import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { articleService, googleNewsService } from '../services/articleService';

const PickList = ({ heading, items, accentClass = 'text-brand-600' }) => {
  if (!items?.length) return null;
  return (
    <div className="mb-5 last:mb-0">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 mb-2">
        {heading}
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item._id}>
            <Link
              to={`/news/${item.slug}`}
              className={`block text-sm font-medium leading-snug line-clamp-2 hover:underline ${accentClass}`}
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Compact MUST READ + MUST WATCH lists for article sidebars.
 * Must Read → Google News flagged items
 * Must Watch → site articles + Google News flagged watch items
 */
const MustPicksLists = ({ excludeSlug = '', className = '' }) => {
  const [mustRead, setMustRead] = useState([]);
  const [mustWatch, setMustWatch] = useState([]);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      googleNewsService.getMustPicks('must-read', 8),
      googleNewsService.getMustPicks('must-watch', 6),
      articleService.getMustWatch(6),
    ]).then(([readRes, gWatchRes, aWatchRes]) => {
      if (cancelled) return;

      const readItems =
        readRes.status === 'fulfilled' ? readRes.value.data?.data || [] : [];
      const gWatch =
        gWatchRes.status === 'fulfilled' ? gWatchRes.value.data?.data || [] : [];
      const aWatch =
        aWatchRes.status === 'fulfilled' ? aWatchRes.value.data?.data || [] : [];

      const filterOut = (list) =>
        list.filter((item) => item.slug && item.slug !== excludeSlug);

      const watchMap = new Map();
      [...aWatch, ...gWatch].forEach((item) => {
        if (item?.slug && item.slug !== excludeSlug && !watchMap.has(item.slug)) {
          watchMap.set(item.slug, item);
        }
      });

      setMustRead(filterOut(readItems).slice(0, 6));
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
