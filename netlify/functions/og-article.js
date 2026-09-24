/**
 * Netlify Function — server HTML with full Open Graph + Twitter tags.
 * Crawlers (WhatsApp/Facebook) do not run React; they read this response.
 *
 * Route: /og/news/:slug  →  /.netlify/functions/og-article?slug=:slug
 */

const API = (process.env.VITE_API_URL || 'https://news-backend-pxp9-a6j6.onrender.com').replace(
  /\/$/,
  ''
);
const SITE = (process.env.VITE_SITE_URL || 'https://thegreatindianews.netlify.app').replace(
  /\/$/,
  ''
);
const SITE_NAME = 'The Great India News';
const FALLBACK_TITLE = 'The Great India News - தி கிரேட் இந்தியா நியூஸ்';
const FALLBACK_DESC = 'Latest Tamil news from Tamil Nadu, India and World.';
const DEFAULT_OG = `${SITE}/assets/images/default-og-image.jpg`;

const escapeHtml = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const stripHtml = (s = '') =>
  String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const clean = (s, max = 200) => stripHtml(s || '').slice(0, max);

const isLocal = (u = '') => /localhost|127\.0\.0\.1/i.test(u);

/** Absolute HTTPS featured image (or site default). No localhost. */
const toAbsoluteImage = (image) => {
  if (!image || !String(image).trim()) return DEFAULT_OG;
  let img = String(image).trim();
  if (/^http:\/\//i.test(img)) img = img.replace(/^http:/i, 'https:');
  if (img.startsWith('/')) img = `${API}${img}`;
  else if (!/^https:\/\//i.test(img)) img = `${API}/${img}`;
  if (isLocal(img)) return DEFAULT_OG;
  // Prefer proxy for third-party hosts so WhatsApp can download reliably
  if (
    img.startsWith('https://') &&
    !img.startsWith(SITE) &&
    !img.includes('onrender.com')
  ) {
    return `${SITE}/.netlify/functions/og-image?url=${encodeURIComponent(img)}`;
  }
  return img;
};

const renderHtml = ({ title, description, image, pageUrl }, { redirect = false } = {}) => {
  const t = escapeHtml(title || FALLBACK_TITLE);
  const d = escapeHtml(description || FALLBACK_DESC);
  const img = escapeHtml(image || DEFAULT_OG);
  const url = escapeHtml(pageUrl);

  const redirectBits = redirect
    ? `
  <meta http-equiv="refresh" content="1;url=${url}" />
  <script>setTimeout(function(){location.replace(${JSON.stringify(pageUrl)});},800);</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${t}</title>
  <link rel="canonical" href="${url}" />

  <meta name="description" content="${d}" />

  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:image:secure_url" content="${img}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${img}" />
${redirectBits}
</head>
<body>
  <h1>${t}</h1>
  <p>${d}</p>
  <img src="${img}" alt="${t}" width="1200" height="630" />
  <p><a href="${url}">Continue to article →</a></p>
</body>
</html>`;
};

async function loadMeta(slug) {
  try {
    const artRes = await fetch(`${API}/api/articles/slug/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
    });
    if (artRes.ok) {
      const json = await artRes.json();
      const a = json?.data;
      if (a?.title) {
        return {
          title: clean(a.ogTitle || a.title, 110) || FALLBACK_TITLE,
          description:
            clean(
              a.ogDescription || a.metaDescription || a.excerpt || stripHtml(a.content || ''),
              200
            ) || FALLBACK_DESC,
          image: toAbsoluteImage(a.ogImage || a.featuredImage),
          pageUrl: `${SITE}/news/${a.slug || slug}`,
        };
      }
    }
  } catch {
    /* continue */
  }

  try {
    const gRes = await fetch(`${API}/api/google-news/public/slug/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
    });
    if (gRes.ok) {
      const json = await gRes.json();
      const g = json?.data;
      if (g?.title) {
        return {
          title: clean(g.title, 110) || FALLBACK_TITLE,
          description:
            clean(g.excerpt || g.description || stripHtml(g.content || ''), 200) || FALLBACK_DESC,
          image: toAbsoluteImage(g.image),
          pageUrl: `${SITE}/news/${g.slug || slug}`,
        };
      }
    }
  } catch {
    /* continue */
  }

  return null;
}

const BOT_RE =
  /whatsapp|facebookexternalhit|Facebot|Twitterbot|TelegramBot|Slackbot|LinkedInBot|Discordbot|bot|crawler|spider|preview/i;

export async function handler(event) {
  const slug =
    event.queryStringParameters?.slug ||
    event.path?.split('/').filter(Boolean).pop() ||
    '';

  if (!slug || slug === 'og-article') {
    return {
      statusCode: 400,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
      body: 'Missing article slug',
    };
  }

  const ua = event.headers?.['user-agent'] || event.headers?.['User-Agent'] || '';
  const isBot = BOT_RE.test(ua);

  try {
    const meta = await loadMeta(decodeURIComponent(slug));
    if (!meta) {
      return {
        statusCode: 404,
        headers: { 'content-type': 'text/html; charset=utf-8' },
        body: renderHtml(
          {
            title: FALLBACK_TITLE,
            description: FALLBACK_DESC,
            image: DEFAULT_OG,
            pageUrl: SITE,
          },
          { redirect: false }
        ),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
      // Bots: no redirect so they read og:* fully. Humans: soft redirect to article.
      body: renderHtml(meta, { redirect: !isBot }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
      body: `Share error: ${err.message}`,
    };
  }
}
