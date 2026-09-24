/**
 * Proxies article images through our Netlify domain so WhatsApp can fetch them.
 * GET /.netlify/functions/og-image?url=https://...
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
];

export async function handler(event) {
  const raw = event.queryStringParameters?.url || '';
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

  if (!allowed) {
    // Still allow common CDNs / news hosts — soft allow https images
    if (target.protocol !== 'https:') {
      return { statusCode: 403, body: 'Host not allowed' };
    }
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GreatIndiaNewsBot/1.0)',
        Accept: 'image/*,*/*',
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
        'content-type': contentType,
        'cache-control': 'public, max-age=86400',
        'access-control-allow-origin': '*',
      },
      body: buf.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 502, body: `Proxy failed: ${err.message}` };
  }
};
