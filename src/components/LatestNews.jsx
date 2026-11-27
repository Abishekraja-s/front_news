import NewsCard from './NewsCard';

const LatestNews = ({ articles, title = 'சமீபத்திய செய்திகள்' }) => {
  const list = (articles || []).slice(0, 5);

  return (
  <div>
    <h3 className="text-lg font-bold text-news-dark border-b-2 border-brand-600 pb-2 mb-4">{title}</h3>
    <div className="space-y-1">
      {list.map((article) => (
        <NewsCard key={article._id} article={article} variant="compact" />
      ))}
    </div>
  </div>
  );
};

const PopularNews = ({ articles, title = 'பிரபலமான செய்திகள்' }) => {
  const list = (articles || []).slice(0, 5);

  return (
  <div>
    <h3 className="text-lg font-bold text-news-dark border-b-2 border-brand-600 pb-2 mb-1">{title}</h3>
    <p className="text-[11px] text-slate-500 mb-3">கடந்த 7 நாட்கள்</p>
    <div className="space-y-3">
      {list.map((article, i) => (
        <div key={article._id} className="flex gap-3 items-start">
          <span className="flex-shrink-0 w-7 h-7 bg-brand-600 text-white text-sm font-bold rounded-full flex items-center justify-center">
            {i + 1}
          </span>
          <NewsCard article={article} variant="compact" />
        </div>
      ))}
    </div>
  </div>
  );
};

export { LatestNews, PopularNews };
