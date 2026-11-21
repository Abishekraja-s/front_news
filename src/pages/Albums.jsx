import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { albumService } from '../services/articleService';
import { getImageUrl } from '../utils/images';

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const Albums = () => {
  const [albums, setAlbums] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    albumService
      .getPublicCategories()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  const load = useCallback(
    async (pageNum = 1, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const params = { page: pageNum, limit: 12 };
        if (category) params.category = category;
        const { data } = await albumService.getPublic(params);
        const rows = data.data || [];
        setAlbums((prev) => (append ? [...prev, ...rows] : rows));
        setPagination(data.pagination || { pages: 1, total: rows.length });
        setPage(pageNum);
      } catch {
        if (!append) setAlbums([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category]
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  return (
    <>
      <Helmet>
        <title>Photo Albums | The Great India News</title>
        <meta
          name="description"
          content="Browse photo albums and image galleries from The Great India News."
        />
      </Helmet>

      <div className="container-news py-8 sm:py-10">
        <header className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">Gallery</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-news-dark font-tamil leading-tight">
            Albums
          </h1>
          <p className="mt-2 text-slate-600 text-sm sm:text-base">
            Published photo collections — tap an album to open the full gallery.
          </p>
        </header>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 mb-2">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                !category
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-stone-200/80 text-slate-700 hover:bg-stone-300'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                type="button"
                onClick={() => setCategory(cat.slug)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  category === cat.slug
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-stone-200/80 text-slate-700 hover:bg-stone-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-stone-100">
                <div className="skeleton aspect-[4/3] w-full" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : albums.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
            <p className="text-slate-600 font-medium">No published albums yet.</p>
            <p className="text-sm text-slate-500 mt-1">Check back soon for new galleries.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {albums.map((album) => (
                <Link
                  key={album._id}
                  to={`/albums/${album.slug}`}
                  className="group relative block overflow-hidden rounded-2xl bg-stone-900 shadow-md shadow-stone-900/10 ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/20"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={getImageUrl(album.coverImage, album.slug)}
                      alt={album.title}
                      className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.06]"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
                    <h2 className="text-lg font-semibold leading-snug font-tamil line-clamp-2 drop-shadow">
                      {album.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/80">
                      {album.albumDate && <span>{formatDate(album.albumDate)}</span>}
                      <span>{album.imageCount || 0} photos</span>
                      {album.category?.name && <span>{album.category.name}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {page < (pagination.pages || 1) && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => load(page + 1, true)}
                  className="inline-flex items-center justify-center rounded-full bg-red-600 px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-red-700 disabled:opacity-60 transition"
                >
                  {loadingMore ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Albums;
