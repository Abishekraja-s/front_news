import { useEffect, useState } from 'react';
import { useParams, useLocation, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { articleService, googleNewsService } from '../services/articleService';
import { sanitizeHtml, generateArticleJsonLd } from '../utils/sanitize';
import GoogleNewsArticleView from '../components/GoogleNewsArticleView';
import { formatDateTime } from '../utils/helpers';
import { buildArticleSocialMeta } from '../utils/seo';
import { getArticlePath } from '../utils/articlePaths';
import { getYoutubeEmbedUrl } from '../utils/youtube';
import NewsImage from '../components/NewsImage';
import ShareButtons from '../components/ShareButtons';
import MustPicksLists from '../components/MustPicksLists';
import RelatedNews from '../components/RelatedNews';
import Advertisement from '../components/Advertisement';
import AdSenseSlot from '../components/AdSenseSlot';
import Loading from '../components/Loading';
import ArticleAudioReader from '../components/ArticleAudioReader';

const Article = () => {
  const { categorySlug: paramCategory, articleSlug, slug: legacySlug } = useParams();
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  // Routes like /politics/:articleSlug have no :categorySlug param — take it from the path
  const categorySlug =
    paramCategory ||
    (articleSlug && pathParts[0] && pathParts[0] !== 'news' && pathParts[0] !== 'post'
      ? pathParts[0]
      : undefined);
  const slug = articleSlug || legacySlug;
  const [article, setArticle] = useState(null);
  const [googleNews, setGoogleNews] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError('Article not found');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setArticle(null);
    setGoogleNews(null);
    setRelated([]);

    articleService
      .getBySlug(slug)
      .then((articleRes) => {
        if (cancelled) return;
        setArticle(articleRes.data.data);
        setLoading(false);
        // Related is secondary — don't block article view if it fails/hangs
        articleService
          .getRelated(slug)
          .then((relatedRes) => {
            if (!cancelled) setRelated(relatedRes.data.data || []);
          })
          .catch(() => {
            if (!cancelled) setRelated([]);
          });
      })
      .catch(() => {
        if (cancelled) return;
        // Google News only on legacy /news/:slug (no category segment)
        if (categorySlug) {
          setError('Article not found');
          setLoading(false);
          return;
        }
        googleNewsService
          .getBySlug(slug)
          .then(({ data }) => {
            if (cancelled) return;
            setGoogleNews(data.data);
            setLoading(false);
            googleNewsService
              .getRelated(slug)
              .then((relatedRes) => {
                if (!cancelled) setRelated(relatedRes.data?.data || []);
              })
              .catch(() => {
                if (!cancelled) setRelated([]);
              });
          })
          .catch(() => {
            if (!cancelled) {
              setError('Article not found');
              setLoading(false);
            }
          });
      });

    return () => {
      cancelled = true;
    };
  }, [slug, categorySlug]);

  if (loading) return <Loading />;
  if (error || (!article && !googleNews)) {
    return (
      <div className="container-news py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    );
  }

  if (googleNews) {
    return <GoogleNewsArticleView item={googleNews} related={related} />;
  }

  // Enforce /{category-slug}/{news-slug} from MongoDB (legacy /news/:slug redirects here)
  if (article?.category?.slug && article?.slug) {
    const expectedPath = getArticlePath(article);
    const onCategoryUrl =
      Boolean(categorySlug) &&
      categorySlug === article.category.slug &&
      slug === article.slug;
    if (!onCategoryUrl) {
      return <Navigate to={expectedPath} replace />;
    }
  }

  const jsonLd = generateArticleJsonLd(article);
  const youtubeEmbed = getYoutubeEmbedUrl(article.youtubeVideoLink);
  const social = buildArticleSocialMeta(article);

  return (
    <>
      <Helmet>
        <title>{article.seoTitle || article.title} - The Great India News</title>
        <meta name="description" content={social.description} />
        <link rel="canonical" href={social.canonicalLink || social.url} />

        <meta property="og:title" content={social.title} />
        <meta property="og:description" content={social.description} />
        <meta property="og:image" content={social.image} />
        <meta property="og:image:secure_url" content={social.image} />
        <meta property="og:image:type" content={social.imageType || 'image/jpeg'} />
        <meta property="og:image:width" content={social.imageWidth || '1200'} />
        <meta property="og:image:height" content={social.imageHeight || '630'} />
        <meta property="og:url" content={social.url} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content={social.siteName} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={social.twitterTitle} />
        <meta name="twitter:description" content={social.twitterDescription} />
        <meta name="twitter:image" content={social.twitterImage} />

        {jsonLd && (
          <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        )}
      </Helmet>

      <article className="container-news py-6">
        <nav className="text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-brand-600">முகப்பு</Link>
          {article.category && (
            <>
              <span className="mx-2">/</span>
              <Link to={`/${article.category.slug}`} className="hover:text-brand-600">
                {article.category.nameTamil || article.category.name}
              </Link>
            </>
          )}
        </nav>

        {article.category && (
          <span className="inline-block text-sm text-brand-600 font-semibold mb-2">
            {article.category.nameTamil || article.category.name}
          </span>
        )}

        {article.isMustWatch && (
          <span className="inline-flex items-center gap-1.5 ml-0 mb-2 mr-2 px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wide">
            <span aria-hidden>▶</span>
            Must Watch
          </span>
        )}

        <h1 className="text-2xl md:text-4xl font-bold font-headline text-news-dark leading-tight mb-4">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6 pb-4 border-b">
          {article.author && (
            <Link to={`/author/${article.author.slug}`} className="font-medium text-gray-700 hover:text-brand-600">
              {article.author.name}
            </Link>
          )}
          <span>•</span>
          <time dateTime={article.publishedAt}>{formatDateTime(article.publishedAt)}</time>
          {article.updatedAt && article.updatedAt !== article.publishedAt && (
            <>
              <span>•</span>
              <span>Updated: {formatDateTime(article.updatedAt)}</span>
            </>
          )}
        </div>

        <Advertisement position="article_top" className="mb-6" />
        <AdSenseSlot
          location="article_top"
          page="article"
          category={article.category?.slug || ''}
          className="mb-6"
        />

        {article.isLive && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <span className="inline-flex items-center gap-2 text-red-600 font-bold text-sm">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              LIVE
            </span>
            {article.liveUpdates?.length > 0 && (
              <div className="mt-4 space-y-4">
                {[...article.liveUpdates].reverse().map((update, i) => (
                  <div key={i} className="border-l-2 border-red-300 pl-4">
                    <time className="text-xs text-red-500 font-medium">{update.time}</time>
                    <p className="text-gray-800 mt-1">{update.updateText}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <figure className="mb-6">
          <NewsImage
            src={article.featuredImage}
            seed={article.slug}
            alt={article.imageAlt || article.title}
            className="w-full rounded-xl"
            loading="eager"
          />
            {article.imageCaption && (
              <figcaption className="text-sm text-gray-500 mt-2 text-center italic">
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
            <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-sm">
              <iframe
                title={`${article.title} — YouTube video`}
                src={youtubeEmbed}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
            />

            <Advertisement position="article_middle" className="my-8" />
            <AdSenseSlot
              location="article_middle"
              page="article"
              category={article.category?.slug || ''}
              className="my-8"
            />

            {article.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t">
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/search?q=${encodeURIComponent(tag)}`}
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-brand-50 hover:text-brand-600"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Mobile / tablet: share once under article */}
            <div className="mt-6 pt-6 border-t lg:hidden">
              <ShareButtons
                title={social.title}
                description={social.description}
                slug={article.slug}
                categorySlug={article.category?.slug}
                image={article.ogImage || article.featuredImage}
                url={social.url}
              />
              <MustPicksLists excludeSlug={article.slug} className="mt-6" />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Desktop: share in sidebar only (avoids mobile duplicate) */}
              <div className="hidden lg:block">
                <ShareButtons
                  title={social.title}
                  description={social.description}
                  slug={article.slug}
                  categorySlug={article.category?.slug}
                  image={article.ogImage || article.featuredImage}
                  url={social.url}
                />
              </div>
              <div className="hidden lg:block">
                <MustPicksLists excludeSlug={article.slug} />
              </div>
              <Advertisement position="sidebar" className="mt-6" />
              <AdSenseSlot
                location="sidebar"
                page="article"
                category={article.category?.slug || ''}
                className="mt-6"
              />
            </div>
          </aside>
        </div>

        <AdSenseSlot
          location="article_bottom"
          page="article"
          category={article.category?.slug || ''}
          className="mt-8"
        />
        <RelatedNews articles={related} />
      </article>
    </>
  );
};

export default Article;
