import { useMemo, useState } from 'react';
import { getArticleSocialLinks, SOCIAL_PREVIEW_THEME } from '../utils/socialLinks';
import { getImageUrl } from '../utils/images';
import { SocialIcon } from './SocialLinks';

const SocialPreviewCard = ({ link, coverSrc, coverSeed }) => {
  const theme = SOCIAL_PREVIEW_THEME[link.id] || SOCIAL_PREVIEW_THEME.twitter;
  const [embedFailed, setEmbedFailed] = useState(false);
  const showEmbed = Boolean(link.embedUrl) && !embedFailed;
  const cover = coverSrc?.trim() ? getImageUrl(coverSrc, coverSeed || 'social') : '';

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:shadow-md transition-all min-w-0 h-full">
      <div
        className="relative aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-slate-100"
        style={{ background: theme.soft }}
      >
        {showEmbed ? (
          <iframe
            title={`${link.label} preview`}
            src={link.embedUrl}
            className="absolute inset-0 w-full h-full border-0 bg-black"
            loading="lazy"
            // YouTube Error 153 if referrer is stripped; keep origin for embeds
            referrerPolicy={link.id === 'youtube' ? 'strict-origin-when-cross-origin' : 'no-referrer'}
            allow={
              link.id === 'youtube'
                ? 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                : undefined
            }
            allowFullScreen={link.id === 'youtube'}
            onError={() => setEmbedFailed(true)}
            {...(link.id === 'youtube'
              ? {}
              : {
                  sandbox: 'allow-scripts allow-same-origin allow-popups allow-presentation',
                })}
          />
        ) : (
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.ariaLabel}
            className="absolute inset-0 block"
          >
            {cover ? (
              <img
                src={cover}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-90"
                loading="lazy"
              />
            ) : null}
            <div
              className={`absolute inset-0 ${cover ? 'bg-gradient-to-t from-black/70 via-black/35 to-black/10' : ''}`}
              style={!cover ? { background: `linear-gradient(145deg, ${theme.accent} 0%, #0f172a 100%)` } : undefined}
            />
            <div className="absolute inset-0 flex flex-col justify-between p-3.5 sm:p-4">
              <span
                className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
                style={{ backgroundColor: `${theme.accent}cc` }}
              >
                <SocialIcon id={link.id} className="w-3.5 h-3.5" />
                {theme.label}
              </span>
              <div className="text-white">
                <p className="text-sm sm:text-base font-bold leading-snug line-clamp-2 drop-shadow-sm">
                  {link.host || theme.label}
                </p>
                {link.pathLabel ? (
                  <p className="mt-1 text-[11px] sm:text-xs text-white/80 line-clamp-1 font-mono">
                    {link.pathLabel}
                  </p>
                ) : null}
              </div>
            </div>
          </a>
        )}
      </div>

      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 sm:p-3.5 min-w-0 group"
      >
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: theme.accent }}
        >
          <SocialIcon id={link.id} className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 truncate">{theme.label}</p>
          <p className="text-xs text-slate-500 truncate">{link.host || link.url}</p>
        </div>
        <span className="shrink-0 text-xs font-semibold text-teal-700 group-hover:underline">
          Open →
        </span>
      </a>
    </article>
  );
};

/**
 * Responsive social URL preview cards (X / Instagram / Facebook / TikTok).
 */
const ArticleSocialLinks = ({ article, className = '' }) => {
  const links = useMemo(() => getArticleSocialLinks(article), [article]);

  if (!links.length) return null;

  return (
    <div className={`mb-6 min-w-0 ${className}`.trim()}>
      <p className="text-sm font-semibold text-slate-800 mb-3">Social links</p>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
        {links.map((link) => (
          <div
            key={link.key}
            className="shrink-0 w-[min(100%,280px)] sm:w-[min(100%,300px)] md:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-1.5rem*3)/4)] snap-start"
          >
            <SocialPreviewCard
              link={link}
              coverSrc={article?.featuredImage || article?.ogImage || ''}
              coverSeed={article?.slug || link.key}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticleSocialLinks;
