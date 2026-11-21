import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { albumService } from '../services/articleService';
import { getImageUrl } from '../utils/images';

const STORY_MS = 4500;

const formatAlbumDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const PhotoBadge = ({ count }) => (
  <span className="explore-album-card__badge">
    <svg className="w-3 h-3 opacity-95" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
    {count || 0} photos
  </span>
);

const ArrowBtn = ({ dir, onClick, disabled }) => (
  <button
    type="button"
    aria-label={dir === 'left' ? 'Previous albums' : 'Next albums'}
    disabled={disabled}
    onClick={onClick}
    className="explore-albums__nav absolute top-1/2 -translate-y-1/2 z-20 hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-700 shadow-lg shadow-brand-900/10 ring-1 ring-brand-100 hover:bg-brand-50 hover:scale-105 active:scale-95 transition disabled:opacity-0 disabled:pointer-events-none"
    style={{ [dir === 'left' ? 'left' : 'right']: '0.35rem' }}
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d={dir === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
      />
    </svg>
  </button>
);

/** WhatsApp-status style full-screen album viewer */
const AlbumStatusPopup = ({ albums, startIndex, onClose }) => {
  const [albumIndex, setAlbumIndex] = useState(startIndex);
  const [imageIndex, setImageIndex] = useState(0);
  const [images, setImages] = useState([]);
  const [albumMeta, setAlbumMeta] = useState(albums[startIndex] || null);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const elapsedRef = useRef(0);
  const holdTimer = useRef(null);

  const loadAlbum = useCallback(async (index) => {
    const base = albums[index];
    if (!base?.slug) return;
    setLoading(true);
    setImageIndex(0);
    setProgress(0);
    elapsedRef.current = 0;
    setAlbumMeta(base);
    try {
      const { data } = await albumService.getBySlug(base.slug);
      const full = data.data || base;
      setAlbumMeta(full);
      const imgs = (full.images || [])
        .map((img) => img.url || img.webpUrl || img.thumbnailUrl)
        .filter(Boolean);
      if (imgs.length) {
        setImages(imgs);
      } else if (full.coverImage || base.coverImage) {
        setImages([full.coverImage || base.coverImage]);
      } else {
        setImages([]);
      }
    } catch {
      setImages(base.coverImage ? [base.coverImage] : []);
    } finally {
      setLoading(false);
    }
  }, [albums]);

  useEffect(() => {
    loadAlbum(albumIndex);
  }, [albumIndex, loadAlbum]);

  const goNextImage = useCallback(() => {
    setProgress(0);
    elapsedRef.current = 0;
    if (imageIndex < images.length - 1) {
      setImageIndex((i) => i + 1);
      return;
    }
    if (albumIndex < albums.length - 1) {
      setAlbumIndex((a) => a + 1);
      return;
    }
    onClose();
  }, [imageIndex, images.length, albumIndex, albums.length, onClose]);

  const goPrevImage = useCallback(() => {
    setProgress(0);
    elapsedRef.current = 0;
    if (imageIndex > 0) {
      setImageIndex((i) => i - 1);
      return;
    }
    if (albumIndex > 0) {
      setAlbumIndex((a) => a - 1);
    }
  }, [imageIndex, albumIndex]);

  // Auto-advance progress (status style)
  useEffect(() => {
    if (loading || paused || !images.length) return undefined;

    startRef.current = performance.now() - elapsedRef.current;

    const tick = (now) => {
      const elapsed = now - startRef.current;
      elapsedRef.current = elapsed;
      const pct = Math.min(100, (elapsed / STORY_MS) * 100);
      setProgress(pct);
      if (elapsed >= STORY_MS) {
        elapsedRef.current = 0;
        goNextImage();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loading, paused, images, imageIndex, albumIndex, goNextImage]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNextImage();
      if (e.key === 'ArrowLeft') goPrevImage();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, goNextImage, goPrevImage]);

  const onPointerDown = () => {
    setPaused(true);
    holdTimer.current = setTimeout(() => {}, 0);
  };
  const onPointerUp = () => {
    setPaused(false);
    clearTimeout(holdTimer.current);
  };

  const currentSrc = images[imageIndex];
  const title = albumMeta?.title || '';

  return (
    <div
      className="album-status fixed inset-0 z-[120] flex items-center justify-center bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Album status'}
    >
      <div className="relative w-full h-full sm:h-[min(100vh,820px)] sm:max-w-md sm:rounded-2xl sm:overflow-hidden sm:my-4 bg-black shadow-2xl">
        {/* Progress bars */}
        <div className="absolute top-0 inset-x-0 z-30 px-2.5 pt-2.5 flex gap-1">
          {(images.length ? images : [1]).map((_, i) => (
            <div key={i} className="h-[3px] flex-1 rounded-full bg-white/25 overflow-hidden">
              <div
                className="h-full bg-white rounded-full origin-left"
                style={{
                  width:
                    i < imageIndex
                      ? '100%'
                      : i === imageIndex
                        ? `${progress}%`
                        : '0%',
                  transition: i === imageIndex ? 'none' : 'width 0.15s linear',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-0 inset-x-0 z-30 pt-6 px-3 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-white/40 shrink-0 bg-slate-800">
            <img
              src={getImageUrl(albumMeta?.coverImage || currentSrc, albumMeta?.slug)}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold font-tamil truncate drop-shadow">{title}</p>
            <p className="text-white/70 text-[11px]">
              {formatAlbumDate(albumMeta?.albumDate)}
              {images.length ? ` · ${imageIndex + 1}/${images.length}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl leading-none inline-flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Image */}
        <div
          className="absolute inset-0 flex items-center justify-center select-none"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          {loading ? (
            <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : currentSrc ? (
            <img
              key={`${albumIndex}-${imageIndex}-${currentSrc}`}
              src={getImageUrl(currentSrc, `${albumMeta?.slug}-${imageIndex}`)}
              alt={title}
              className="album-status__img max-h-full max-w-full w-full h-full object-contain sm:object-cover"
              draggable={false}
            />
          ) : (
            <p className="text-white/70 text-sm">No photos in this album</p>
          )}

          {/* Tap zones — WhatsApp status style */}
          <button
            type="button"
            className="absolute inset-y-0 left-0 w-[32%] z-20 cursor-default bg-transparent"
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation();
              goPrevImage();
            }}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 w-[32%] z-20 cursor-default bg-transparent"
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation();
              goNextImage();
            }}
          />
        </div>

        {/* Footer caption + open full album */}
        <div className="absolute bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
          <p className="text-white/90 text-xs sm:text-sm font-tamil line-clamp-2 mb-3 pointer-events-none">
            {albumMeta?.description || title}
          </p>
          <div className="flex items-center justify-between gap-2 pointer-events-auto">
            <span className="text-[11px] text-white/60">
              Album {albumIndex + 1} of {albums.length}
            </span>
            {albumMeta?.slug && (
              <Link
                to={`/albums/${albumMeta.slug}`}
                onClick={onClose}
                className="text-xs font-semibold text-brand-200 hover:text-white underline-offset-2 hover:underline"
              >
                Open album page →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Explore Albums — equal cards + WhatsApp-status popup on click.
 */
const ExploreAlbumsSection = ({ albums = [], loading = false }) => {
  const scrollerRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [statusIndex, setStatusIndex] = useState(null);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) {
      setCanLeft(false);
      setCanRight(false);
      setPages(1);
      setPage(0);
      return;
    }
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(max > 4 && el.scrollLeft < max - 4);
    const pageCount = Math.max(1, Math.ceil(el.scrollWidth / Math.max(el.clientWidth, 1)));
    setPages(pageCount);
    setPage(Math.min(pageCount - 1, Math.round(el.scrollLeft / Math.max(el.clientWidth, 1))));
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScrollState) : null;
    ro?.observe(el);
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro?.disconnect();
      window.removeEventListener('resize', updateScrollState);
    };
  }, [albums.length, loading]);

  const scrollByDir = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(200, el.clientWidth * 0.7), behavior: 'smooth' });
  };

  return (
    <section className="explore-albums relative overflow-hidden rounded-2xl sm:rounded-3xl border border-brand-100/70 bg-gradient-to-br from-white via-brand-50/40 to-cyan-50/50 shadow-md shadow-brand-900/5">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="explore-albums__blob explore-albums__blob--a" />
        <div className="explore-albums__blob explore-albums__blob--b" />
        <div className="absolute inset-0 opacity-[0.04] explore-albums__watermark" />
      </div>

      <div className="relative p-4 sm:p-5 md:p-6">
        <div className="explore-albums__head flex items-start sm:items-center justify-between gap-3 mb-4 sm:mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="explore-albums__icon shrink-0 h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-brand-600 to-teal-500 text-white shadow-md shadow-brand-600/25 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="explore-albums__title text-xl sm:text-2xl font-headline font-bold text-slate-900 tracking-tight">
                Albums
              </h2>
              <p className="explore-albums__sub text-xs sm:text-sm text-slate-500 font-tamil mt-0.5 truncate">
                புகைப்பட தொகுப்புகள்
              </p>
            </div>
          </div>

          <Link to="/albums" className="explore-albums__viewall group shrink-0">
            <span>View All</span>
            <span className="explore-albums__viewall-arrow" aria-hidden>
              →
            </span>
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-3 sm:gap-3.5 md:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="skeleton shrink-0 w-[72vw] max-w-[17rem] sm:w-[15.5rem] md:w-[16.5rem] lg:w-[17.5rem] h-[22.5rem] sm:h-[24rem] md:h-[25.5rem] rounded-2xl"
              />
            ))}
          </div>
        ) : albums.length === 0 ? (
          <p className="text-sm text-slate-500 py-10 text-center">No published albums yet.</p>
        ) : (
          <div className="relative">
            <ArrowBtn dir="left" onClick={() => scrollByDir(-1)} disabled={!canLeft} />
            <ArrowBtn dir="right" onClick={() => scrollByDir(1)} disabled={!canRight} />

            <div
              ref={scrollerRef}
              className="flex gap-3 sm:gap-3.5 md:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 px-0.5 scroll-smooth items-stretch"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {albums.map((album, index) => (
                <button
                  key={album._id}
                  type="button"
                  onClick={() => setStatusIndex(index)}
                  aria-label={album.title || 'Open album'}
                  className="explore-album-card explore-albums__card group relative shrink-0 w-[72vw] max-w-[17rem] sm:w-[15.5rem] md:w-[16.5rem] lg:w-[17.5rem] h-[22.5rem] sm:h-[24rem] md:h-[25.5rem] snap-center sm:snap-start text-left"
                  style={{ animationDelay: `${100 + index * 90}ms` }}
                >
                  <span className="explore-album-card__media" aria-hidden>
                    <img
                      src={getImageUrl(album.coverImage, album.slug)}
                      alt=""
                      className="explore-album-card__img"
                      loading={index < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </span>
                  <span className="explore-album-card__shade" aria-hidden />
                  <span className="explore-album-card__shine" aria-hidden />
                  <span className="explore-album-card__ring" aria-hidden />

                  <span className="explore-album-card__badge-wrap">
                    <PhotoBadge count={album.imageCount} />
                  </span>

                  <span className="explore-album-card__footer">
                    <span className="explore-album-card__copy">
                      <span
                        className="explore-album-card__title font-tamil"
                        title={album.title}
                      >
                        {album.title || 'Untitled album'}
                      </span>
                      {album.albumDate ? (
                        <span className="explore-album-card__date">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {formatAlbumDate(album.albumDate)}
                        </span>
                      ) : null}
                    </span>
                    <span className="explore-album-card__go" aria-hidden>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {pages > 1 && (
              <div className="flex justify-center gap-1.5 mt-4" role="tablist" aria-label="Album pages">
                {Array.from({ length: pages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to page ${i + 1}`}
                    aria-current={i === page ? 'true' : undefined}
                    onClick={() => {
                      const el = scrollerRef.current;
                      if (!el) return;
                      el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === page ? 'w-6 bg-brand-600' : 'w-1.5 bg-brand-200 hover:bg-brand-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {statusIndex != null && (
        <AlbumStatusPopup
          albums={albums}
          startIndex={statusIndex}
          onClose={() => setStatusIndex(null)}
        />
      )}
    </section>
  );
};

export default ExploreAlbumsSection;
