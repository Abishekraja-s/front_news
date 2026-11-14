import { useMemo } from 'react';
import { getArticleSocialLinks } from '../utils/socialLinks';
import { SocialIcon } from './SocialLinks';

/**
 * Renders per-article X / Instagram / Facebook / TikTok links when URLs are set.
 */
const ArticleSocialLinks = ({ article, className = '' }) => {
  const links = useMemo(() => getArticleSocialLinks(article), [article]);

  if (!links.length) return null;

  return (
    <div className={`mb-6 ${className}`.trim()}>
      <p className="text-sm font-semibold text-slate-800 mb-2">Social links</p>
      <nav aria-label="Article social links" className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.key}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.label}
            aria-label={link.ariaLabel}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-teal-300 hover:text-teal-800 hover:bg-teal-50 transition-colors"
          >
            <SocialIcon id={link.id} className="w-4 h-4" />
            <span>{link.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
};

export default ArticleSocialLinks;
