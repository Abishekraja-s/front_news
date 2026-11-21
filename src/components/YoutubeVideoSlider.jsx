import { useEffect, useMemo, useRef, useState } from 'react';
import { youtubeService } from '../services/articleService';
import { SITE_CATEGORIES } from '../utils/helpers';

const ACCENT_RED = '#E61E26';

const CATEGORY_LABELS = SITE_CATEGORIES.map((c) => c.nameTamil).filter(Boolean);

function hashLabel(seed = '') {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return CATEGORY_LABELS[h % CATEGORY_LABELS.length] || 'வீடியோ';
}

function formatDuration(raw) {
  if (!raw) return '';
  const str = String(raw).trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) return str;
  // ISO-8601 PT#H#M#S
  const m = str.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (m) {
    const h = Number(m[1] || 0);
    const min = Number(m[2] || 0);
    const sec = Number(m[3] || 0);
    if (h > 0) {
      return `${h}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
    return `${min}:${String(sec).padStart(2, '0')}`;
  }
  return str;
}

function formatViews(raw) {
  if (raw == null || raw === '') return '';
  const n = Number(String(raw).replace(/,/g, ''));
  if (!Number.isFinite(n) || n < 0) return String(raw);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

const PlayIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.14v13.72L19 12 8 5.14z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const MetaRow = ({ date, views, light = false }) => {
  const dateText = formatDate(date);
  const viewsText = formatViews(views);
  if (!dateText && !viewsText) return null;
  return (
    <div
      className={`mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs ${
        light ? 'text-white/80' : 'text-slate-500'
      }`}
    >
      {dateText ? (
        <span className="inline-flex items-center gap-1">
          <CalendarIcon />
          {dateText}
        </span>
      ) : null}
      {dateText && viewsText ? <span className={light ? 'text-white/40' : 'text-slate-300'}>|</span> : null}
      {viewsText ? (
        <span className="inline-flex items-center gap-1">
          <EyeIcon />
          {viewsText}
          {light ? ' பார்வைகள்' : ''}
        </span>
      ) : null}
    </div>
  );
};

const DurationBadge = ({ duration, className = '' }) => {
  const text = formatDuration(duration);
  if (!text) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums ${className}`}
    >
      <svg className="w-3 h-3 opacity-90" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
      </svg>
      {text}
    </span>
  );
};

const CategoryPill = ({ label, className = '' }) => (
  <span
    className={`inline-flex max-w-[70%] truncate rounded-md px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-white shadow-sm ${className}`}
    style={{ backgroundColor: ACCENT_RED }}
  >
    {label}
  </span>
);

const RedPlayButton = ({ size = 'md' }) => {
  const box = size === 'lg' ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-10 h-10 sm:w-11 sm:h-11';
  const icon = size === 'lg' ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-4 h-4 sm:w-5 sm:h-5';
  return (
    <span
      className={`${box} rounded-full text-white flex items-center justify-center shadow-lg ring-4 ring-white/25 group-hover:scale-110 transition-transform duration-300`}
      style={{ backgroundColor: ACCENT_RED }}
    >
      <PlayIcon className={`${icon} ml-0.5`} />
    </span>
  );
};

/**
 * Featured (left) video — title + meta over gradient on the thumbnail.
 */
const FeaturedVideoCard = ({ video, onPlay }) => {
  const label = hashLabel(video.videoId || video._id);
  const duration = video.metadata?.duration;
  const views = video.metadata?.viewCount;

  return (
    <button
      type="button"
      onClick={() => onPlay(video.videoId)}
      className="group relative w-full h-full min-h-[240px] sm:min-h-[280px] lg:min-h-full text-left rounded-xl overflow-hidden bg-slate-200 shadow-[0_8px_28px_rgba(15,23,42,0.12)] ring-1 ring-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
    >
      {video.thumbnail ? (
        <img
          src={video.thumbnail}
          alt={video.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="eager"
        />
      ) : (
        <div className="absolute inset-0 bg-slate-300" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-[1]">
        <CategoryPill label={label} />
        <DurationBadge duration={duration} />
      </div>

      <span className="absolute inset-0 flex items-center justify-center z-[1] pointer-events-none">
        <RedPlayButton size="lg" />
      </span>

      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-[1]">
        <h3
          className="text-base sm:text-lg md:text-xl font-bold text-white font-tamil line-clamp-2"
          style={{ lineHeight: 1.55 }}
        >
          {video.title}
        </h3>
        <MetaRow date={video.publishedAt} views={views} light />
      </div>
      <span className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: ACCENT_RED }} />
    </button>
  );
};

/**
 * Smaller grid video — thumbnail on top, title + meta below.
 */
const SmallVideoCard = ({ video, onPlay }) => {
  const label = hashLabel(video.videoId || video._id);
  const duration = video.metadata?.duration;
  const views = video.metadata?.viewCount;

  return (
    <button
      type="button"
      onClick={() => onPlay(video.videoId)}
      className="group flex flex-col w-full text-left rounded-xl overflow-hidden bg-white border border-stone-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.05)] hover:shadow-[0_10px_28px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
    >
      <div className="relative aspect-video overflow-hidden bg-slate-200">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-slate-300" />
        )}
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
        <div className="absolute top-2 left-2 z-[1]">
          <CategoryPill label={label} />
        </div>
        <span className="absolute inset-0 flex items-center justify-center z-[1] pointer-events-none">
          <RedPlayButton size="sm" />
        </span>
        <div className="absolute bottom-2 right-2 z-[1]">
          <DurationBadge duration={duration} />
        </div>
      </div>
      <div className="px-3 py-2.5 sm:px-3.5 sm:py-3">
        <h3
          className="text-sm font-bold text-slate-900 font-tamil line-clamp-2 group-hover:text-red-700 transition-colors"
          style={{ lineHeight: 1.55 }}
        >
          {video.title}
        </h3>
        <MetaRow date={video.publishedAt} views={views} />
      </div>
    </button>
  );
};

/**
 * Mobile-only tile: compact 2×2 card — rounded media, bottom sheet title strip.
 */
const MobileTileCard = ({ video, onPlay, accent }) => {
  const label = hashLabel(video.videoId || video._id);
  const duration = video.metadata?.duration;
  const dateText = formatDate(video.publishedAt);

  return (
    <button
      type="button"
      onClick={() => onPlay(video.videoId)}
      className="group relative flex flex-col w-full h-full text-left overflow-hidden rounded-2xl bg-stone-900 shadow-[0_6px_18px_rgba(15,23,42,0.18)] active:scale-[0.98] transition-transform"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-slate-700" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-start justify-between gap-1 z-[1]">
          <CategoryPill label={label} className="!text-[9px] !px-1.5 !py-0.5 max-w-[55%]" />
          <DurationBadge duration={duration} className="!text-[9px]" />
        </div>

        <span className="absolute inset-0 flex items-center justify-center z-[1] pointer-events-none">
          <span
            className="w-9 h-9 rounded-full text-white flex items-center justify-center shadow-md ring-2 ring-white/30"
            style={{ backgroundColor: accent || ACCENT_RED }}
          >
            <PlayIcon className="w-3.5 h-3.5 ml-0.5" />
          </span>
        </span>
      </div>

      <div className="relative px-2 pt-1.5 pb-2 bg-white min-h-[3.6rem] flex flex-col justify-between border-t-2" style={{ borderColor: accent || ACCENT_RED }}>
        <h3
          className="text-[11px] font-bold text-slate-900 font-tamil line-clamp-2"
          style={{ lineHeight: 1.45 }}
        >
          {video.title}
        </h3>
        {dateText ? (
          <span className="mt-0.5 text-[9px] text-slate-400 inline-flex items-center gap-0.5">
            <CalendarIcon />
            {dateText}
          </span>
        ) : null}
      </div>
    </button>
  );
};

const MOBILE_ACCENTS = ['#E61E26', '#0f766e', '#1d4ed8', '#b45309'];

function chunkVideos(list, size) {
  const pages = [];
  for (let i = 0; i < list.length; i += size) pages.push(list.slice(i, i + size));
  return pages;
}

/**
 * Homepage Videos section — desktop featured grid + mobile 2×2 swipe pages.
 */
const YoutubeVideoSlider = () => {
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const mobileScrollerRef = useRef(null);

  useEffect(() => {
    youtubeService
      .getPublic()
      .then(({ data }) => {
        setChannel(data.data?.channel || null);
        setVideos(data.data?.videos || []);
      })
      .catch(() => {
        setVideos([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeId) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setActiveId(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [activeId]);

  const list = useMemo(() => videos.filter((v) => v?.videoId), [videos]);
  const { featured, rest } = useMemo(
    () => ({ featured: list[0] || null, rest: list.slice(1, 5) }),
    [list]
  );
  const mobilePages = useMemo(() => chunkVideos(list.slice(0, 12), 4), [list]);

  useEffect(() => {
    const el = mobileScrollerRef.current;
    if (!el) return undefined;
    const onScroll = () => {
      const w = el.clientWidth || 1;
      setPageIndex(Math.round(el.scrollLeft / w));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [mobilePages.length]);

  if (loading || !channel || !featured) return null;

  const title = channel.sliderTitleTamil || channel.sliderTitle || 'வீடியோக்கள்';
  const viewAllHref = channel.channelUrl || 'https://www.youtube.com';

  return (
    <section className="mb-10 rounded-2xl bg-white border border-stone-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-4 sm:p-5 md:p-6 overflow-hidden" aria-labelledby="youtube-slider-heading">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-4 lg:mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
              style={{ backgroundColor: ACCENT_RED }}
              aria-hidden="true"
            >
              <PlayIcon className="w-4 h-4 ml-0.5" />
            </span>
            <div className="min-w-0">
              <h2
                id="youtube-slider-heading"
                className="text-xl sm:text-2xl md:text-[1.65rem] font-bold text-slate-900 font-tamil leading-tight"
              >
            {title}
          </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Latest Videos • News • Interviews • Highlights
              </p>
            </div>
          </div>
          <div className="mt-3 h-[3px] w-16 rounded-full" style={{ backgroundColor: ACCENT_RED }} />
        </div>

        <a
          href={viewAllHref}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full lg:w-auto inline-flex items-center justify-center gap-1.5 rounded-full border px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-colors hover:bg-red-50"
          style={{ borderColor: ACCENT_RED, color: ACCENT_RED }}
        >
          அனைத்து வீடியோக்களையும் பார்க்க
          <span aria-hidden="true">→</span>
        </a>
      </div>

      {/* —— Mobile / tablet: unique 2×2 swipe pages —— */}
      <div className="lg:hidden min-w-0">
        <div
          ref={mobileScrollerRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide touch-pan-x -mx-1 px-1"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
          aria-label="Videos 2 by 2"
        >
          {mobilePages.map((page, pageIdx) => (
            <div
              key={`page-${pageIdx}`}
              className="shrink-0 w-full snap-start snap-always px-0.5"
            >
              <div className="grid grid-cols-2 gap-2.5">
                {page.map((v, i) => (
                  <MobileTileCard
                    key={v._id || v.videoId}
                    video={v}
                    onPlay={setActiveId}
                    accent={MOBILE_ACCENTS[(pageIdx * 4 + i) % MOBILE_ACCENTS.length]}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {mobilePages.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden="true">
            {mobilePages.map((_, i) => (
              <span
                key={`dot-${i}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === pageIndex ? 'w-5' : 'w-1.5 bg-stone-300'
                }`}
                style={i === pageIndex ? { backgroundColor: ACCENT_RED } : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* —— Desktop: featured left + 2×2 right —— */}
      <div className="hidden lg:grid grid-cols-2 gap-5 items-stretch">
        <div className="min-h-[420px]">
          <FeaturedVideoCard video={featured} onPlay={setActiveId} />
        </div>
        <div className="grid grid-cols-2 gap-4 content-start">
          {rest.map((v) => (
            <SmallVideoCard key={v._id || v.videoId} video={v} onPlay={setActiveId} />
          ))}
        </div>
      </div>

      {list.length > 5 && (
        <div className="hidden lg:grid mt-4 grid-cols-4 gap-4">
          {list.slice(5, 9).map((v) => (
            <SmallVideoCard key={v._id || v.videoId} video={v} onPlay={setActiveId} />
          ))}
        </div>
      )}

      {activeId && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6"
          onClick={() => setActiveId(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Video player"
        >
          <div
            className="w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute -top-11 right-0 text-white/90 text-sm font-medium hover:text-white px-2 py-1"
              onClick={() => setActiveId(null)}
            >
              Close ✕
            </button>
            <iframe
              title="YouTube player"
              src={`https://www.youtube.com/embed/${activeId}?autoplay=1&rel=0`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default YoutubeVideoSlider;
