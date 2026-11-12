import { Link } from 'react-router-dom';
import NewsImage from './NewsImage';
import { getArticlePath } from '../utils/articlePaths';

const formatDate = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

/**
 * Shared category listing card — image, date, title, excerpt.
 * Grid: mobile 2 · desktop 4
 */
const CategoryCard = ({ article }) => (
  <Link
    to={getArticlePath(article)}
    className="group flex h-full flex-col overflow-hidden rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-shadow duration-300"
  >
    <div className="aspect-[16/10] overflow-hidden bg-slate-100">
      <NewsImage
        src={article.featuredImage}
        seed={article.slug}
        alt={article.imageAlt || article.title}
        className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
        loading="lazy"
        sizes="(max-width: 1023px) 50vw, 25vw"
      />
    </div>
    <div className="flex flex-1 flex-col p-3 sm:p-4">
      <time className="text-[11px] sm:text-xs text-slate-400 font-medium">
        {formatDate(article.publishedAt || article.updatedAt)}
      </time>
      <h3 className="mt-1.5 text-sm sm:text-[15px] font-bold text-slate-900 group-hover:text-teal-800 leading-snug line-clamp-3 font-headline">
        {article.title}
      </h3>
      {article.excerpt ? (
        <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-2">
          {article.excerpt}
        </p>
      ) : null}
    </div>
  </Link>
);

const CategoryListingLayout = ({ articles }) => {
  if (!articles?.length) return null;

  return (
    <div className="category-listing">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {articles.map((article, index) => (
          <CategoryCard key={article._id || article.slug || index} article={article} />
        ))}
      </div>
    </div>
  );
};

export default CategoryListingLayout;
