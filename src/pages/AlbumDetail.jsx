import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { albumService } from '../services/articleService';
import { getImageUrl } from '../utils/images';
import ShareButtons from '../components/ShareButtons';

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const AlbumDetail = () => {
  const { slug } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    albumService
      .getBySlug(slug)
      .then(({ data }) => {
        if (!cancelled) setAlbum(data.data);
      })
      .catch(() => {
        if (!cancelled) setAlbum(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const images = useMemo(() => album?.images || [], [album]);
  const lightboxOpen = lightboxIndex != null && images[lightboxIndex];

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const showPrev = useCallback(() => {
    setLightboxIndex((i) => (i == null ? i : (i - 1 + images.length) % images.length));
  }, [images.length]);
  const showNext = useCallback(() => {
    setLightboxIndex((i) => (i == null ? i : (i + 1) % images.length));
  }, [images.length]);

  useEffect(() => {
    if (lightboxIndex == null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [lightboxIndex, closeLightbox, showPrev, showNext]);

  // Touch swipe for lightbox
  useEffect(() => {
    if (lightboxIndex == null) return undefined;
    let startX = 0;
    const onStart = (e) => {
      startX = e.changedTouches?.[0]?.clientX ?? 0;
    };
    const onEnd = (e) => {
      const endX = e.changedTouches?.[0]?.clientX ?? 0;
      const dx = endX - startX;
      if (Math.abs(dx) < 50) return;
      if (dx > 0) showPrev();
      else showNext();
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
    };
  }, [lightboxIndex, showPrev, showNext]);

  if (loading) {
    return (
      <div className="container-news py-10">
        <div className="skeleton h-10 w-2/3 max-w-md rounded mb-4" />
        <div className="skeleton h-4 w-1/3 rounded mb-8" />
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton break-inside-avoid rounded-xl aspect-[4/3]" />
          ))}
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="container-news py-16 text-center">
        <h1 className="text-2xl font-bold text-news-dark mb-2">Album not found</h1>
        <p className="text-slate-500 mb-6">This album may be unpublished or removed.</p>
        <Link to="/albums" className="text-red-600 font-medium hover:underline">
          ← Back to Albums
        </Link>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `/albums/${album.slug}`;

  return (
    <>
      <Helmet>
        <title>{album.title} | Albums | The Great India News</title>
        <meta name="description" content={album.description || album.title} />
      </Helmet>

      <div className="container-news py-8 sm:py-10">
        <nav className="text-sm text-slate-500 mb-5">
          <Link to="/albums" className="hover:text-red-600 transition-colors">
            Albums
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800">{album.title}</span>
        </nav>

        <header className="mb-8 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-news-dark font-tamil leading-tight">
            {album.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            {album.albumDate && <span>{formatDate(album.albumDate)}</span>}
            <span>{images.length} photos</span>
            {album.category?.name && <span>{album.category.name}</span>}
          </div>
          {album.description ? (
            <p className="mt-4 text-slate-700 leading-relaxed whitespace-pre-line">{album.description}</p>
          ) : null}
          <div className="mt-5">
            <ShareButtons title={album.title} url={shareUrl} />
          </div>
        </header>

        {images.length === 0 ? (
          <p className="text-slate-500 py-10 text-center">No images in this album.</p>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
            {images.map((image, index) => {
              const src = image.webpUrl || image.url || image.thumbnailUrl;
              return (
                <button
                  key={image._id}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl bg-stone-100 shadow-sm ring-1 ring-black/5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <img
                    src={getImageUrl(src, image._id)}
                    alt={image.caption || `${album.title} photo ${index + 1}`}
                    className="w-full h-auto object-cover transition duration-400 group-hover:scale-[1.03] group-hover:brightness-105"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="text-sm text-white/80">
              {lightboxIndex + 1} / {images.length}
            </p>
            <button
              type="button"
              onClick={closeLightbox}
              className="rounded-full h-10 w-10 inline-flex items-center justify-center bg-white/10 hover:bg-white/20 transition"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center px-2 sm:px-12 pb-6 min-h-0">
            <button
              type="button"
              onClick={showPrev}
              className="absolute left-2 sm:left-4 z-10 hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition"
              aria-label="Previous image"
            >
              ‹
            </button>
            <img
              src={getImageUrl(
                images[lightboxIndex].url || images[lightboxIndex].webpUrl,
                images[lightboxIndex]._id
              )}
              alt={images[lightboxIndex].caption || ''}
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
            />
            <button
              type="button"
              onClick={showNext}
              className="absolute right-2 sm:right-4 z-10 hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition"
              aria-label="Next image"
            >
              ›
            </button>
          </div>

          <div className="flex sm:hidden items-center justify-center gap-4 pb-5">
            <button
              type="button"
              onClick={showPrev}
              className="h-11 w-11 rounded-full bg-white/10 text-xl"
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={showNext}
              className="h-11 w-11 rounded-full bg-white/10 text-xl"
              aria-label="Next"
            >
              ›
            </button>
          </div>

          {images[lightboxIndex].caption ? (
            <p className="text-center text-sm text-white/70 px-4 pb-4">
              {images[lightboxIndex].caption}
            </p>
          ) : null}
        </div>
      )}
    </>
  );
};

export default AlbumDetail;
