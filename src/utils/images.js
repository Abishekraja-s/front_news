/** Instant local placeholder — never hit slow external hosts (picsum) on homepage */
export const DEFAULT_NEWS_IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
      '<rect fill="#e7e5e4" width="800" height="450"/>' +
      '<rect fill="#d6d3d1" x="320" y="175" width="160" height="100" rx="12"/>' +
      '</svg>'
  );

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const getImageUrl = (url, seed = 'news') => {
  if (!url || url.trim() === '') {
    return DEFAULT_NEWS_IMAGE;
  }
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('http://')) {
    return url.replace(/^http:/i, 'https:');
  }
  if (url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return API_BASE ? `${API_BASE}${url}` : url;
  }
  const path = `/${url}`;
  return API_BASE ? `${API_BASE}${path}` : path;
};

/** Site listing image — never use the social default-og brand card as a news thumb */
export const getArticleImage = (article) => {
  let url = article?.featuredImage || '';
  if (/default-og-image\.jpg/i.test(url)) url = '';
  return getImageUrl(url, article?.slug || 'article');
};

export const getMediaUrl = (url) => {
  if (!url || url.trim() === '') return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) {
    return API_BASE ? `${API_BASE}${url}` : url;
  }
  const path = `/${url}`;
  return API_BASE ? `${API_BASE}${path}` : path;
};

/** Brand asset from settings — supports { url, version } with cache busting */
export const getBrandAssetUrl = (asset) => {
  if (!asset) return '';
  const url = typeof asset === 'string' ? asset : asset.url;
  if (!url?.trim()) return '';
  const base = getMediaUrl(url);
  const version = typeof asset === 'object' ? asset.version : null;
  if (!version) return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}v=${version}`;
};

export const getBrandPosterUrl = (asset) => {
  if (!asset?.posterUrl) return '';
  return getBrandAssetUrl({ url: asset.posterUrl, version: asset.version });
};

export const isBrandVideo = (asset) => {
  if (!asset) return false;
  if (typeof asset === 'object') {
    if (asset.mimeType === 'video/mp4') return true;
    return asset.url?.toLowerCase().endsWith('.mp4');
  }
  return String(asset).toLowerCase().endsWith('.mp4');
};

export const isBrandImageFavicon = (asset) => {
  if (!asset || isBrandVideo(asset)) return false;
  return Boolean(getBrandAssetUrl(asset));
};

export const HEADER_BRAND_LOGO_CLASS =
  'h-11 sm:h-12 md:h-14 w-auto max-w-[220px] sm:max-w-[300px] md:max-w-[380px] object-contain object-left flex-shrink-0';

export const FOOTER_BRAND_LOGO_CLASS =
  'h-11 sm:h-12 md:h-14 w-auto max-w-[220px] sm:max-w-[300px] md:max-w-[380px] object-contain object-left flex-shrink-0';

export const getAuthorImage = (author) =>
  getImageUrl(author?.profileImage, author?.slug || 'author');

export const getSiteUrl = () =>
  import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
