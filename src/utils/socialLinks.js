/**
 * Single source of truth for site social platforms.
 * Keys must match Admin → Settings → Social Media fields.
 */

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
 * Empty / invalid URLs are omitted.
 */
export function getArticleSocialLinks(article) {
  if (!article || typeof article !== 'object') return [];

  const links = [];
  for (const def of ARTICLE_SOCIAL_DEFS) {
    const url = normalizeExternalUrl(article[def.key]);
    if (!url) continue;
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
