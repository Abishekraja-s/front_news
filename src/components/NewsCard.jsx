import { Link } from 'react-router-dom';
import NewsImage from './NewsImage';
import { getArticlePath } from '../utils/articlePaths';

const NewsCard = ({ article, variant = 'default' }) => {
  if (!article) return null;
  const href = getArticlePath(article);

  if (variant === 'horizontal') {
    return (
      <Link to={href} className="flex gap-3 group">
        <div className="flex-shrink-0 w-24 h-16 md:w-32 md:h-20 overflow-hidden rounded-xl ring-1 ring-black/5 bg-stone-100">
          <NewsImage
            src={article.featuredImage}
            seed={article.slug}
            alt={article.imageAlt || article.title}
            className="w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="flex-1 min-w-0 self-center">
          {article.category && (
            <span className="text-xs text-brand-600 font-medium">
              {article.category.nameTamil || article.category.name}
            </span>
          )}
          <h3 className="text-sm md:text-base font-semibold text-slate-900 group-hover:text-brand-700 line-clamp-2 leading-snug mt-0.5">
            {article.title}
          </h3>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link to={href} className="block group py-2 border-b border-gray-100 last:border-0">
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-brand-600 line-clamp-2">
          {article.title}
        </h3>
      </Link>
    );
  }

  return (
    <Link to={href} className="card-news group block">
      <div className="aspect-video overflow-hidden bg-stone-100">
        <NewsImage
          src={article.featuredImage}
          seed={article.slug}
          alt={article.imageAlt || article.title}
          className="w-full h-full object-cover object-center"
          loading="lazy"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="p-4">
        {article.category && (
          <span className="inline-block text-xs text-brand-600 font-semibold uppercase tracking-wide mb-1">
            {article.category.nameTamil || article.category.name}
          </span>
        )}
        <h3 className="text-base font-bold text-gray-900 group-hover:text-brand-600 line-clamp-2 leading-snug font-headline">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{article.excerpt}</p>
        )}
      </div>
    </Link>
  );
};

export default NewsCard;
