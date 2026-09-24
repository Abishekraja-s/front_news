import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { getPublicSiteUrl } from '../utils/seo';

/**
 * Share: title + link only (no description text in the message).
 * Preview image still comes from OG tags on /og/news/:slug.
 */
const ShareButtons = ({ url, title, slug }) => {
  const siteBase = useMemo(() => getPublicSiteUrl(), []);

  const pageUrl = useMemo(() => {
    if (url && /^https:\/\//i.test(url) && !/localhost|127\.0\.0\.1/i.test(url)) return url;
    if (slug) return `${siteBase}/news/${slug}`;
    return siteBase;
  }, [url, slug, siteBase]);

  /** Crawler URL — server HTML with og:image for WhatsApp preview */
  const previewUrl = useMemo(() => {
    if (slug) return `${siteBase}/og/news/${encodeURIComponent(slug)}`;
    return pageUrl;
  }, [slug, siteBase, pageUrl]);

  /** Title + URL only — no description */
  const shareText = useMemo(
    () => [title || '', previewUrl].filter(Boolean).join('\n\n'),
    [title, previewUrl]
  );

  const shares = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
      color: 'bg-green-500',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(previewUrl)}`,
      color: 'bg-blue-600',
    },
    {
      id: 'x',
      name: 'X',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(previewUrl)}&text=${encodeURIComponent(
        title || ''
      )}`,
      color: 'bg-black',
    },
    {
      id: 'telegram',
      name: 'Telegram',
      href: `https://t.me/share/url?url=${encodeURIComponent(previewUrl)}&text=${encodeURIComponent(
        title || ''
      )}`,
      color: 'bg-sky-500',
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
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-600 mr-2">Share:</span>
      {shares.map((s) => (
        <a
          key={s.id}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${s.color} text-white text-xs px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity`}
        >
          {s.name}
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full hover:bg-gray-300 transition-colors"
      >
        Copy Link
      </button>
    </div>
  );
};

export default ShareButtons;
