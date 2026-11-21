/**
 * Single source of truth for site social platforms.
 * Keys must match Admin → Settings → Social Media fields.
 */

import { getYoutubeEmbedUrl } from './youtube.js';

export const SOCIAL_LINK_DEFS = [
  {
    id: 'facebook',
    key: 'socialFacebook',
    label: 'Facebook',
    ariaLabel: 'Visit us on Facebook',
  },
  {
    id: 'twitter',
    key: 'socialTwitter',
    label: 'Twitter / X',
    ariaLabel: 'Visit us on Twitter / X',
  },
  {
    id: 'youtube',
    key: 'socialYoutube',
    label: 'YouTube',
    ariaLabel: 'Visit us on YouTube',
  },
  {
    id: 'instagram',
    key: 'socialInstagram',
    label: 'Instagram',
    ariaLabel: 'Visit us on Instagram',
  },
  {
    id: 'telegram',
    key: 'socialTelegram',
    label: 'Telegram',
    ariaLabel: 'Visit us on Telegram',
  },
  {
    id: 'whatsapp',
    key: 'whatsapp_group_link',
    label: 'WhatsApp',
    ariaLabel: 'Join us on WhatsApp',
  },
];

/**
 * Normalize admin-entered URLs so links always work.
 * Adds https:// when missing; rejects unsafe schemes.
 */
export function normalizeExternalUrl(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return '';
  if (/^(javascript|data|vbscript):/i.test(value)) return '';

  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(value)
    ? value
    : `https://${value}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    if (!parsed.hostname) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Build clickable social links from public settings.
 * Empty / invalid / duplicate URLs are omitted.
 */
export function getConfiguredSocialLinks(settings) {
  if (!settings || typeof settings !== 'object') return [];

  const seen = new Set();
  const links = [];

  for (const def of SOCIAL_LINK_DEFS) {
    const url = normalizeExternalUrl(settings[def.key]);
    if (!url) continue;

    const dedupeKey = url.replace(/\/+$/, '').toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    links.push({
      id: def.id,
      key: def.key,
      label: def.label,
      ariaLabel: def.ariaLabel,
      url,
    });
  }

  return links;
}

/** Per-article social post / profile URLs (admin Add Article). */
export const ARTICLE_SOCIAL_DEFS = [
  {
    id: 'twitter',
    key: 'socialX',
    label: 'X',
    ariaLabel: 'Open on X',
    placeholder: 'https://x.com/...',
  },
  {
    id: 'instagram',
    key: 'socialInstagram',
    label: 'Instagram',
    ariaLabel: 'Open on Instagram',
    placeholder: 'https://www.instagram.com/...',
  },
  {
    id: 'facebook',
    key: 'socialFacebook',
    label: 'Facebook',
    ariaLabel: 'Open on Facebook',
    placeholder: 'https://www.facebook.com/...',
  },
  {
    id: 'tiktok',
    key: 'socialTiktok',
    label: 'TikTok',
    ariaLabel: 'Open on TikTok',
    placeholder: 'https://www.tiktok.com/...',
  },
];

/**
 * Build clickable social links from an article document.
 * Order: YouTube (from youtubeVideoLink) → X → Instagram → Facebook → TikTok.
 * Empty / invalid URLs are omitted.
 */
export function getArticleSocialLinks(article) {
  if (!article || typeof article !== 'object') return [];

  const links = [];

  const youtubeUrl = normalizeExternalUrl(article.youtubeVideoLink || article.socialYoutube);
  if (youtubeUrl) {
    links.push({
      id: 'youtube',
      key: 'youtubeVideoLink',
      label: 'YouTube',
      ariaLabel: 'Open on YouTube',
      url: youtubeUrl,
      ...getSocialPreviewMeta(youtubeUrl, 'youtube'),
    });
  }

  for (const def of ARTICLE_SOCIAL_DEFS) {
    const url = normalizeExternalUrl(article[def.key]);
    if (!url) continue;
    links.push({
      id: def.id,
      key: def.key,
      label: def.label,
      ariaLabel: def.ariaLabel,
      url,
      ...getSocialPreviewMeta(url, def.id),
    });
  }
  return links;
}

/** Platform brand accents for preview cards */
export const SOCIAL_PREVIEW_THEME = {
  youtube: { accent: '#FF0000', soft: '#fef2f2', label: 'YouTube' },
  twitter: { accent: '#0f1419', soft: '#f1f5f9', label: 'X' },
  instagram: { accent: '#E1306C', soft: '#fdf2f8', label: 'Instagram' },
  facebook: { accent: '#1877F2', soft: '#eff6ff', label: 'Facebook' },
  tiktok: { accent: '#010101', soft: '#f8fafc', label: 'TikTok' },
};

/**
 * Derive display + optional embed URL from a social link.
 */
export function getSocialPreviewMeta(rawUrl, platformId = '') {
  const url = normalizeExternalUrl(rawUrl);
  if (!url) return { host: '', pathLabel: '', embedUrl: '' };

  let host = '';
  let pathLabel = '';
  let embedUrl = '';
  try {
    const parsed = new URL(url);
    host = parsed.hostname.replace(/^www\./, '');
    pathLabel = `${parsed.pathname}${parsed.search}`.replace(/\/$/, '') || '/';
    if (pathLabel.length > 48) pathLabel = `${pathLabel.slice(0, 45)}…`;

    const id = String(platformId || '').toLowerCase();
    if (id === 'youtube' || /youtube\.com|youtu\.be|youtube-nocookie\.com/i.test(host)) {
      embedUrl = getYoutubeEmbedUrl(url) || '';
    } else if (id === 'instagram' || /instagram\.com/i.test(host)) {
      const m = parsed.pathname.match(/\/(p|reel|tv)\/([^/?#]+)/i);
      if (m) {
        embedUrl = `https://www.instagram.com/${m[1]}/${m[2]}/embed/captioned/`;
      }
    } else if (id === 'facebook' || /facebook\.com|fb\.watch|fb\.com/i.test(host)) {
      // Any Facebook/FB post URL can be passed to the plugin when it looks like a post
      const path = parsed.pathname || '';
      const isPost =
        /\/(posts|videos|watch|share|reel|photo|permalink\.php|story\.php)/i.test(path) ||
        parsed.searchParams.has('v') ||
        parsed.searchParams.has('story_fbid') ||
        parsed.searchParams.has('fbid') ||
        /facebook\.com\/.+\/(posts|videos)\//i.test(url);
      if (isPost || id === 'facebook') {
        embedUrl = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500`;
      }
    } else if (id === 'tiktok' || /tiktok\.com/i.test(host)) {
      const m = parsed.pathname.match(/\/video\/(\d+)/i);
      if (m) embedUrl = `https://www.tiktok.com/embed/v2/${m[1]}`;
    } else if (id === 'twitter' || /(?:twitter|x)\.com/i.test(host)) {
      const m = parsed.pathname.match(/\/status\/(\d+)/i);
      if (m) {
        // Full tweet chrome; container height controls whether inner scroll appears
        embedUrl = `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}&theme=light&dnt=true`;
      }
    }
  } catch {
    /* ignore */
  }

  return { host, pathLabel, embedUrl };
}
