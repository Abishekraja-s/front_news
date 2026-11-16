import NewsCard from './NewsCard';
import CategoryQuickLinks from './CategoryQuickLinks';

const RelatedNews = ({ articles }) => {
  const hasArticles = Boolean(articles?.length);

  return (
    <section className="mt-8 min-w-0">
      <CategoryQuickLinks className="mb-6" />

      {hasArticles ? (
        <>
          <h3 className="section-title">தொடர்புடைய செய்திகள்</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article) => (
              <NewsCard key={article._id} article={article} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
};

export default RelatedNews;
