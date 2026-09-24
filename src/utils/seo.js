import { getImageUrl, getSiteUrl } from './images';

export const SITE_NAME = 'The Great India News';
export const FALLBACK_TITLE = 'The Great India News - தி கிரேட் இந்தியா நியூஸ்';
export const FALLBACK_DESCRIPTION = 'Latest Tamil news from Tamil Nadu, India and World.';

/** Production site — never use localhost for OG / share URLs */
export const PRODUCTION_SITE = 'https://thegreatindianews.netlify.app';
export const PRODUCTION_API = 'https://news-backend-pxp9-a6j6.onrender.com';

export const DEFAULT_OG_IMAGE_PATH = '/assets/images/default-og-image.jpg';

const isLocalHost = (url = '') => /localhost|127\.0\.0\.1/i.test(url);

export const getPublicSiteUrl = () => {
  const fromEnv = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');
  if (fromEnv && !isLocalHost(fromEnv)) return fromEnv;
  const fromHelper = (getSiteUrl() || '').replace(/\/$/, '');
  if (fromHelper && !isLocalHost(fromHelper)) return fromHelper;
  if (typeof window !== 'undefined') {
    const origin = window.location.origin.replace(/\/$/, '');
    if (origin && !isLocalHost(origin)) return origin;
  }
  return PRODUCTION_SITE;
};

export const getPublicApiUrl = () => {
  const fromEnv = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  if (fromEnv && !isLocalHost(fromEnv)) return fromEnv;
  return PRODUCTION_API;
};

export const getDefaultOgImageUrl = () =>
  `${getPublicSiteUrl()}${DEFAULT_OG_IMAGE_PATH}`;

const toHttps = (url) => {
  if (!url) return '';
  if (url.startsWith('http://')) return url.replace(/^http:/i, 'https:');
  return url;
};

/**
 * Absolute HTTPS image for og:image / twitter:image.
 * Relative paths → API host. Empty → site default OG image.
 * Never returns localhost.
 */
export const getAbsoluteOgImage = (image, seed = 'news') => {
  const fallback = getDefaultOgImageUrl();
  if (!image || !String(image).trim()) return fallback;

  let url = toHttps(String(image).trim());

  if (url.startsWith('/')) {
    const api = getPublicApiUrl();
    url = `${api}${url}`;
  } else if (!/^https?:\/\//i.test(url)) {
    url = `${getPublicApiUrl()}/${url}`;
  } else {
    url = toHttps(getImageUrl(image, seed));
  }

  if (!url || isLocalHost(url)) return fallback;
  if (url.includes('picsum.photos') && /\/\d+\/\d+/.test(url)) {
    url = url.replace(/\/\d+\/\d+/, '/1200/630');
  }
  return url;
};

const cleanText = (value, max = 200) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

/**
 * Unique OG + Twitter fields per article (DB).
 */
export const buildArticleSocialMeta = (article) => {
  const siteOrigin = getPublicSiteUrl();
  const slug = article?.slug || '';
  const siteArticleUrl = slug ? `${siteOrigin}/news/${slug}` : siteOrigin;

  const rawCanonical = (article?.canonicalUrl || '').trim();
  const canonicalLink =
    rawCanonical.startsWith('http://') || rawCanonical.startsWith('https://')
      ? toHttps(rawCanonical)
      : siteArticleUrl;

  const title = cleanText(
    article?.ogTitle || article?.seoTitle || article?.title || FALLBACK_TITLE,
    110
  );

  const description = cleanText(
    article?.ogDescription ||
      article?.metaDescription ||
      article?.excerpt ||
      FALLBACK_DESCRIPTION,
    200
  );

  const image = getAbsoluteOgImage(
    article?.ogImage || article?.featuredImage,
    slug || 'news'
  );

  const twitterTitle = cleanText(article?.twitterTitle || title, 110);
  const twitterDescription = cleanText(
    article?.twitterDescription || description,
    200
  );
  const twitterImage = getAbsoluteOgImage(
    article?.twitterImage || article?.ogImage || article?.featuredImage,
    slug || 'news'
  );

  return {
    title,
    description,
    image,
    url: siteArticleUrl,
    canonicalLink,
    siteName: SITE_NAME,
    twitterTitle,
    twitterDescription,
    twitterImage,
    imageType: 'image/jpeg',
    imageWidth: '1200',
    imageHeight: '630',
  };
};

export const buildGoogleNewsSocialMeta = (item) => {
  const siteOrigin = getPublicSiteUrl();
  const slug = item?.slug || '';
  const title = cleanText(item?.title || FALLBACK_TITLE, 110);
  const description = cleanText(
    item?.excerpt || item?.description || FALLBACK_DESCRIPTION,
    200
  );
  const image = getAbsoluteOgImage(item?.image, item?.guid || slug || 'news');
  const url = slug ? `${siteOrigin}/news/${slug}` : siteOrigin;

  return {
    title,
    description,
    image,
    url,
    canonicalLink: url,
    siteName: SITE_NAME,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
    imageType: 'image/jpeg',
    imageWidth: '1200',
    imageHeight: '630',
  };
};
