import { Link } from 'react-router-dom';
import NewsImage from './NewsImage';

const FeaturedNews = ({ article }) => {
  if (!article) return null;

  return (
    <Link
      to={`/news/${article.slug}`}
      className="group block overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5 bg-white"
    >
      <div className="aspect-[16/10] md:aspect-[16/9] overflow-hidden bg-stone-100">
        <NewsImage
          src={article.featuredImage}
          seed={article.slug}
          alt={article.imageAlt || article.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          loading="eager"
          decoding="async"
        />
      </div>
      <div className="p-4 md:p-5">
        {article.category && (
          <span className="inline-block bg-brand-500 text-slate-900 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2">
            {article.category.nameTamil || article.category.name}
          </span>
        )}
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold font-headline leading-tight text-slate-900 group-hover:text-brand-800 transition-colors">
          {article.title}
        </h2>
        {article.excerpt && (
          <p className="text-sm md:text-base text-slate-600 mt-2 line-clamp-2">
            {article.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
};

export default FeaturedNews;
