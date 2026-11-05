import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { getPublicApiUrl, getPublicSiteUrl } from '../utils/seo';

/** Official brand colors */
const BRAND = {
  whatsapp: '#25D366',
  facebook: '#1877F2',
  x: '#000000',
  telegram: '#26A5E4',
};

const IconWhatsApp = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.99.59 3.84 1.6 5.4L2 22l4.95-1.63a9.9 9.9 0 004.99 1.34h.01c5.46 0 9.89-4.4 9.89-9.84C21.84 6.4 17.5 2 12.04 2zm5.75 13.98c-.24.68-1.4 1.25-1.93 1.33-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.78-4.17-4.93-4.36-.14-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.45.27-.29.59-.36.79-.36h.57c.18 0 .43-.07.67.51.24.59.82 2 .89 2.15.07.15.12.32.02.52-.1.2-.15.32-.3.5-.14.17-.3.38-.43.51-.14.14-.29.29-.12.56.16.27.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.23 1.38.27.14.43.12.59-.07.16-.2.68-.79.86-1.06.18-.27.36-.22.61-.13.24.09 1.55.73 1.82.86.27.14.45.2.52.31.06.12.06.68-.18 1.36z" />
  </svg>
);

const IconFacebook = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z" />
  </svg>
);

const IconX = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M18.9 2H22l-6.8 7.8L23 22h-6.6l-5.2-6.8L5.4 22H2.3l7.3-8.3L1 2h6.7l4.7 6.2L18.9 2zm-1.2 18h1.8L7.4 3.9H5.5L17.7 20z" />
  </svg>
);

const IconTelegram = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M21.5 3.4L2.8 10.6c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.7.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8L22.8 4.7c.3-1.2-.5-1.7-1.3-1.3zM8.7 13.8l9.2-5.8c.5-.3.9-.1.5.2l-7.4 6.7-.3 3.3-1.9-4.4z" />
  </svg>
);

const IconCopy = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path strokeLinecap="round" d="M5 15V5a2 2 0 012-2h10" />
  </svg>
);

/**
 * Share: title + link only.
 * Official brand icon colors on light tiles (clipped corner).
 */
const ShareButtons = ({ url, title, slug, categorySlug }) => {
  const siteBase = useMemo(() => getPublicSiteUrl(), []);
  const apiBase = useMemo(() => getPublicApiUrl(), []);

  const pageUrl = useMemo(() => {
    if (url && /^https:\/\//i.test(url) && !/localhost|127\.0\.0\.1/i.test(url)) return url;
    if (slug && categorySlug) return `${siteBase}/${categorySlug}/${slug}`;
    if (slug) return `${siteBase}/news/${slug}`;
    return siteBase;
  }, [url, slug, categorySlug, siteBase]);

  /**
   * Prefer site /og/news (pretty). Fallback: API /share/news — always server HTML with
   * og:title + direct og:image (WhatsApp needs this; SPA shell has no article preview).
   */
  const previewUrl = useMemo(() => {
    if (!slug) return pageUrl;
    const enc = encodeURIComponent(slug);
    // Site OG page (Netlify function). v= busts failed WhatsApp image cache.
    if (siteBase) return `${siteBase}/og/news/${enc}?v=4`;
    return `${apiBase}/share/news/${enc}`;
  }, [slug, siteBase, apiBase, pageUrl]);

  // WhatsApp: title in text + link on its own line for rich preview
  const shareText = useMemo(() => {
    const t = (title || '').trim();
    return t ? `${t}\n\n${previewUrl}` : previewUrl;
  }, [title, previewUrl]);

  const shares = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
      bg: BRAND.whatsapp,
      icon: <IconWhatsApp className="w-[22px] h-[22px] text-white" />,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(previewUrl)}`,
      bg: BRAND.facebook,
      icon: <IconFacebook className="w-[22px] h-[22px] text-white" />,
    },
    {
      id: 'x',
      name: 'X',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(previewUrl)}&text=${encodeURIComponent(
        title || ''
      )}`,
      bg: BRAND.x,
      icon: <IconX className="w-5 h-5 text-white" />,
    },
    {
      id: 'telegram',
      name: 'Telegram',
      href: `https://t.me/share/url?url=${encodeURIComponent(previewUrl)}&text=${encodeURIComponent(
        title || ''
      )}`,
      bg: BRAND.telegram,
      icon: <IconTelegram className="w-[22px] h-[22px] text-white" />,
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <aside
      className="share-signal overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
      aria-label="Share this story"
    >
      <div className="flex items-stretch">
        <div className="hidden sm:flex w-9 shrink-0 items-center justify-center bg-slate-900 text-teal-300">
          <span
            className="text-[10px] font-bold tracking-[0.28em] uppercase"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Share
          </span>
        </div>

        <div className="flex-1 min-w-0 p-3 sm:p-4">
          <div className="flex items-end justify-between gap-3 mb-3">
            <div>
              <p className="sm:hidden text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400 mb-1">
                Share
              </p>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 font-headline leading-snug">
                Pass this story on
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Real brand colors · white icons
              </p>
            </div>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 shrink-0 border border-dashed border-slate-300 dark:border-slate-600 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-teal-500 hover:text-teal-800 transition-colors"
            >
              <IconCopy />
              Copy
            </button>
          </div>

          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {shares.map((s) => (
              <li key={s.id}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-signal-btn group flex flex-col items-center justify-center gap-1.5 min-h-[76px] sm:min-h-[84px] text-white hover:-translate-y-0.5 transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2"
                  style={{
                    backgroundColor: s.bg,
                    clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)',
                  }}
                  aria-label={`Share on ${s.name}`}
                >
                  <span className="opacity-100 group-hover:scale-110 transition-transform drop-shadow-sm">
                    {s.icon}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-white">
                    {s.name}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default ShareButtons;
