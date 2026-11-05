import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { articleService } from '../services/articleService';
import CategoryListingLayout from '../components/CategoryListingLayout';
import { SkeletonCard } from '../components/Loading';
import Advertisement from '../components/Advertisement';
import CategoryBanner from '../components/CategoryBanner';
import AdSenseSlot from '../components/AdSenseSlot';
import SportsWidgets from '../components/SportsWidgets';
import CategoryQuickLinks from '../components/CategoryQuickLinks';

import { CATEGORY_TITLES as SHARED_CATEGORY_TITLES } from '../utils/helpers';

const CATEGORY_TITLES = {
  ...SHARED_CATEGORY_TITLES,
  cinema: 'சினிமா',
  technology: 'தொழில்நுட்பம்',
};

const Category = () => {
  const { categorySlug: paramSlug } = useParams();
  const location = useLocation();
  // Named :categorySlug route, or fixed CATEGORY_ROUTES path like /politics
  const categorySlug =
    paramSlug || location.pathname.replace(/^\//, '').split('/').filter(Boolean)[0] || '';
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    articleService
      .getByCategory(categorySlug, page, 12)
      .then(({ data }) => {
        setArticles(data.data || []);
        setCategory(data.category);
        setPagination(data.pagination);
      })
      .catch(() => setError('Failed to load articles'))
      .finally(() => setLoading(false));
  }, [categorySlug, page]);

  const title = category?.nameTamil || CATEGORY_TITLES[categorySlug] || categorySlug;

  return (
    <>
      <Helmet>
        <title>{title} - The Great India News</title>
        <meta name="description" content={`${title} news - Latest updates from The Great India News`} />
      </Helmet>

      <div className="container-news py-6">
        <nav className="text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-brand-600">முகப்பு</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{title}</span>
        </nav>

        <h1 className="text-2xl md:text-3xl font-bold font-headline text-news-dark mb-4">{title}</h1>

        <Advertisement position="top_banner" className="mb-4" />
        <AdSenseSlot location="top_banner" page="category" category={categorySlug} className="mb-4" />
        <AdSenseSlot location="sidebar" page="category" category={categorySlug} className="mb-4" />

        <CategoryQuickLinks className="mb-6" />

        {categorySlug === 'sports' && <SportsWidgets page="category" className="mb-6" />}

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={() => setPage(1)} className="btn-primary">Retry</button>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>இந்த பிரிவில் செய்திகள் இல்லை.</p>
          </div>
        ) : (
          <>
            <CategoryListingLayout slug={categorySlug} articles={articles} />

            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.pages}
                  className="btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        <CategoryBanner slug={categorySlug} className="mt-6" />
      </div>
    </>
  );
};

export default Category;
