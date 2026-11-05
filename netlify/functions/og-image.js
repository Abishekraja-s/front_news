/**
 * Proxies article images through our Netlify domain so WhatsApp can fetch them.
 *
 * Preferred (no query string — WhatsApp-friendly):
 *   /og/img/<base64url>.jpg  →  /.netlify/functions/og-image?b64=<base64url>
 *
 * Legacy:
 *   /.netlify/functions/og-image?url=https://...
 */

const ALLOWED_HOST_HINTS = [
  'thgim.com',
  'thehindu.com',
  'bbci.co.uk',
  'bbc.co.uk',
  'picsum.photos',
  'onrender.com',
  'netlify.app',
  'cloudinary.com',
  'googleapis.com',
  'googleusercontent.com',
  'wp.com',
  'amazonaws.com',
  'tv9tamilnews.com',
  'gumlet.io',
];

const fromBase64Url = (token = '') => {
  const cleaned = String(token)
    .replace(/\.jpe?g$/i, '')
    .replace(/\.png$/i, '')
    .replace(/\.webp$/i, '')
    .trim();
  const b64 = cleaned.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, 'base64').toString('utf8');
};

export async function handler(event) {
  const qs = event.queryStringParameters || {};
  let raw = qs.url || '';
  if (!raw && qs.b64) {
    try {
      raw = fromBase64Url(qs.b64);
    } catch {
      return { statusCode: 400, body: 'Invalid b64' };
    }
  }
  // Path style: /og/img/TOKEN.jpg may arrive as path on the function in some setups
  if (!raw && event.path) {
    const part = event.path.split('/').filter(Boolean).pop() || '';
    if (part && part !== 'og-image') {
      try {
        raw = fromBase64Url(part);
      } catch {
        /* ignore */
      }
    }
  }

  let target;
  try {
    target = new URL(raw);
  } catch {
    return { statusCode: 400, body: 'Invalid url' };
  }

  if (!/^https?:$/i.test(target.protocol)) {
    return { statusCode: 400, body: 'Only http(s) allowed' };
  }

  const host = target.hostname.toLowerCase();
  const allowed =
    ALLOWED_HOST_HINTS.some((h) => host === h || host.endsWith(`.${h}`)) ||
    host.endsWith('.netlify.app');

  if (!allowed && target.protocol !== 'https:') {
    return { statusCode: 403, body: 'Host not allowed' };
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!upstream.ok) {
      return { statusCode: upstream.status, body: 'Upstream image error' };
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return { statusCode: 415, body: 'Not an image' };
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    return {
      statusCode: 200,
      headers: {
        'content-type': contentType.split(';')[0].trim() || 'image/jpeg',
        'cache-control': 'public, max-age=86400',
        'access-control-allow-origin': '*',
      },
      body: buf.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 502, body: `Proxy failed: ${err.message}` };
  }
}
