import { useEffect, useState } from 'react';
import { eventGifService } from '../services/articleService';
import { getImageUrl } from '../utils/images';

const DISMISS_KEY = 'eventGifDismissedId';

/**
 * Floating event GIF — bottom-left, auto-shown when active + in date range.
 */
const EventGifFloat = () => {
  const [event, setEvent] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      eventGifService
        .getActive()
        .then(({ data }) => {
          if (cancelled) return;
          const next = data.data || null;
          setEvent(next);
          if (!next) {
            setVisible(false);
            return;
          }
          try {
            const dismissedId = sessionStorage.getItem(DISMISS_KEY);
            if (dismissedId && dismissedId === next._id) {
              setDismissed(true);
              setVisible(false);
              return;
            }
          } catch {
            /* ignore */
          }
          setDismissed(false);
          requestAnimationFrame(() => setVisible(true));
        })
        .catch(() => {
          if (!cancelled) {
            setEvent(null);
            setVisible(false);
          }
        });
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setVisible(false);
    setDismissed(true);
    try {
      if (event?._id) sessionStorage.setItem(DISMISS_KEY, event._id);
    } catch {
      /* ignore */
    }
  };

  if (!event?.gifUrl || dismissed) return null;

  const href = event.eventUrl?.trim();
  const isLink = Boolean(href && href !== '#');
  const src = getImageUrl(event.gifUrl, event._id || 'event-gif');

  const media = (
    <img
      src={src}
      alt={event.title || 'Event'}
      className="w-full h-auto block rounded-[10px]"
      draggable={false}
    />
  );

  return (
    <div
      className={`fixed z-[60] left-3 sm:left-5 pointer-events-none
        bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))]
        sm:bottom-6
        transition-all duration-500 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      aria-live="polite"
    >
      <div className="pointer-events-auto relative w-[90px] sm:w-[140px] md:w-[160px]">
        <button
          type="button"
          onClick={handleClose}
          className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-slate-900/85 text-white text-sm leading-none
            flex items-center justify-center shadow-md hover:bg-slate-900 border border-white/80"
          aria-label="Close event GIF"
        >
          ×
        </button>
        <div
          className="rounded-2xl overflow-hidden bg-white border-2 border-white shadow-[0_8px_28px_rgba(15,23,42,0.28)]
            ring-1 ring-black/5"
        >
          {isLink ? (
            <a href={href} target="_blank" rel="noopener noreferrer" title={event.title || 'Open event'}>
              {media}
            </a>
          ) : (
            media
          )}
        </div>
      </div>
    </div>
  );
};

export default EventGifFloat;
