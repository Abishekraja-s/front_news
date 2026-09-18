import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { articleService } from '../services/articleService';
import { sanitizeHtml } from '../utils/sanitize';
import { formatDateTime } from '../utils/helpers';
import { getYoutubeEmbedUrl } from '../utils/youtube';
import NewsImage from '../components/NewsImage';
import ArticleAudioReader from '../components/ArticleAudioReader';
import { StatusBadge } from './AdminPageHeader';
import Loading from '../components/Loading';

/**
 * Admin preview — loads article by ID (works for DRAFT / PENDING / PUBLISHED).
 * Public /news/:slug only works for PUBLISHED, which made View look broken.
 */
const ArticlePreview = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    articleService
      .getById(id)
      .then(({ data }) => setArticle(data.data))
      .catch(() => {
        toast.error('Failed to load article');
        setArticle(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;

  if (!article) {
    return (
      <div className="admin-card text-center py-12">
        <p className="text-slate-600 mb-4">Article not found</p>
        <Link to="/admin/articles" className="btn-primary text-sm">
          Back to Articles
        </Link>
      </div>
    );
  }

  const youtubeEmbed = getYoutubeEmbedUrl(article.youtubeVideoLink);
  const publicUrl = article.slug ? `/news/${article.slug}` : null;
  const isLiveOnSite = article.status === 'PUBLISHED';

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Article Preview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            How this story looks — works for draft and published
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={article.status} />
          <Link to="/admin/articles" className="btn-secondary text-sm">
            ← Articles
          </Link>
          <Link to={`/admin/articles/edit/${article._id}`} className="btn-secondary text-sm">
            Edit
          </Link>
          {publicUrl && isLiveOnSite && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm"
            >
              Open on website
            </a>
          )}
        </div>
      </div>

      {!isLiveOnSite && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Status is <strong>{article.status}</strong> — not visible on the public site until you
          publish. This is an admin preview only.
        </div>
      )}

      <article className="admin-card max-w-3xl mx-auto">
        {article.category && (
          <span className="inline-block text-sm text-teal-700 font-semibold mb-2">
            {article.category.nameTamil || article.category.name}
          </span>
        )}

        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-3">
          {article.title}
        </h2>

        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mb-5 pb-4 border-b border-slate-100">
          {article.author?.name && <span className="font-medium text-slate-700">{article.author.name}</span>}
          {article.publishedAt && (
            <>
              <span>•</span>
              <time>{formatDateTime(article.publishedAt)}</time>
            </>
          )}
        </div>

        {article.excerpt && (
          <p className="text-slate-600 text-base mb-5 leading-relaxed">{article.excerpt}</p>
        )}

        <figure className="mb-6">
          <NewsImage
            src={article.featuredImage}
            seed={article.slug || article._id}
            alt={article.imageAlt || article.title}
            className="w-full rounded-xl"
            loading="eager"
          />
          {article.imageCaption && (
            <figcaption className="text-sm text-slate-500 mt-2 text-center italic">
              {article.imageCaption}
            </figcaption>
          )}
        </figure>

        <ArticleAudioReader
          audioReader={article.audioReader}
          title={article.title}
          excerpt={article.excerpt}
          content={article.content}
        />

        {youtubeEmbed && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-slate-800 mb-2">YouTube Video</p>
            <div className="aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                title={article.title}
                src={youtubeEmbed}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content || '') }}
        />

        {article.sourceUrl && (
          <p className="mt-6 text-sm">
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-700 font-medium hover:underline"
            >
              Source link →
            </a>
          </p>
        )}
      </article>
    </div>
  );
};

export default ArticlePreview;
