/**
 * Public article URL from MongoDB category slug + article slug.
 * Format: /{category-slug}/{news-slug}
 * Falls back to /news/{slug} when category is missing (e.g. Google News).
 */

export const getCategorySlug = (article) => {
  if (!article) return '';
  if (typeof article.category === 'object' && article.category?.slug) {
    return String(article.category.slug).trim();
  }
  if (typeof article.categorySlug === 'string' && article.categorySlug.trim()) {
    return article.categorySlug.trim();
  }
  return '';
};

export const getArticlePath = (article) => {
  const newsSlug = article?.slug ? String(article.slug).trim() : '';
  if (!newsSlug) return '/';
  const categorySlug = getCategorySlug(article);
  if (categorySlug) return `/${categorySlug}/${newsSlug}`;
  return `/news/${newsSlug}`;
};

export const getArticleAbsoluteUrl = (article, siteOrigin = '') => {
  const origin = String(siteOrigin || '').replace(/\/$/, '');
  const path = getArticlePath(article);
  return origin ? `${origin}${path}` : path;
};
