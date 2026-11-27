import { useEffect, useMemo, useRef, useState } from 'react';
import { getArticleSocialLinks, SOCIAL_PREVIEW_THEME } from '../utils/socialLinks';
import { getImageUrl } from '../utils/images';
import { SocialIcon } from './SocialLinks';

let twitterScriptPromise = null;

function ensureTwitterWidgets() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.twttr?.widgets) return Promise.resolve(window.twttr);
  if (twitterScriptPromise) return twitterScriptPromise;

  twitterScriptPromise = new Promise((resolve) => {
    const existing = document.getElementById('twitter-wjs');
    if (existing) {
      const check = () => {
        if (window.twttr?.widgets) resolve(window.twttr);
        else setTimeout(check, 50);
      };
      check();
      return;
    }
    window.twttr = window.twttr || { _e: [], ready(f) { window.twttr._e.push(f); } };
    const s = document.createElement('script');
    s.id = 'twitter-wjs';
    s.src = 'https://platform.twitter.com/widgets.js';
    s.async = true;
    s.onload = () => window.twttr?.ready?.((twttr) => resolve(twttr));
    s.onerror = () => resolve(null);
    document.body.appendChild(s);
  });

  return twitterScriptPromise;
}

function extractTweetId(url) {
  const m = String(url || '').match(/\/status\/(\d+)/i);
  return m ? m[1] : '';
}

/**
 * X post — stretch to full card width; height hugs the tweet (no side/bottom empty space).
 * X widgets cap ~550px; if narrower than the card we scale up so the post is edge-to-edge.
 */
const TwitterEmbed = ({ url }) => {
  const hostRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let heightRo;
    const tweetId = extractTweetId(url);

    const fitToCard = (node) => {
      const iframe = node?.querySelector('iframe');
      if (!iframe) return;

      const apply = () => {
        const parentW = Math.floor(
          node.parentElement?.clientWidth || node.clientWidth || 0
        );
        const rawW = iframe.offsetWidth || Number(iframe.getAttribute('width')) || 0;
        const rawH = iframe.offsetHeight || Number(iframe.getAttribute('height')) || 0;
        if (rawW < 40 || rawH < 40 || parentW < 40) return;

        // Scale tweet to fill full card width (eliminates side gutters)
        const scale = parentW / rawW;
        iframe.style.margin = '0';
        iframe.style.display = 'block';
        iframe.style.transformOrigin = 'top left';
        iframe.style.transform = scale > 1.005 || scale < 0.995 ? `scale(${scale})` : 'none';
        iframe.style.maxWidth = 'none';

        node.style.width = '100%';
        node.style.overflow = 'hidden';
        node.style.height = `${Math.ceil(rawH * scale)}px`;
      };

      apply();
      heightRo?.disconnect();
      if (typeof ResizeObserver !== 'undefined') {
        heightRo = new ResizeObserver(apply);
        heightRo.observe(iframe);
        if (node.parentElement) heightRo.observe(node.parentElement);
      }
    };

    const mount = async () => {
      const node = hostRef.current;
      if (cancelled || !node || !tweetId) {
        if (!cancelled && !tweetId) setFailed(true);
        return;
      }

      const available = Math.floor(
        node.parentElement?.getBoundingClientRect().width ||
          node.getBoundingClientRect().width ||
          window.innerWidth - 32
      );
      // Ask X for as wide as possible; then we scale to exact card width
      const width = Math.max(280, Math.min(550, available));

      const twttr = await ensureTwitterWidgets();
      if (cancelled || !twttr?.widgets?.createTweet) {
        if (!cancelled) setFailed(true);
        return;
      }

      node.innerHTML = '';
      node.style.width = '100%';
      node.style.height = 'auto';

      try {
        await twttr.widgets.createTweet(tweetId, node, {
          theme: 'light',
          dnt: true,
          align: 'left',
          width,
          conversation: 'none',
        });
        if (!cancelled) {
          requestAnimationFrame(() => fitToCard(node));
          setTimeout(() => fitToCard(node), 200);
          setTimeout(() => fitToCard(node), 800);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    const raf = requestAnimationFrame(mount);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      heightRo?.disconnect();
    };
  }, [url]);

  if (failed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-5 text-sm font-semibold text-teal-700 hover:underline"
      >
        Open post on X →
      </a>
    );
  }

  return (
    <div
      ref={hostRef}
      className="twitter-embed-host w-full max-w-full min-w-0 overflow-hidden leading-none"
      style={{ width: '100%' }}
    />
  );
};

const FallbackCover = ({ link, cover, theme }) => (
  <a
    href={link.url}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={link.ariaLabel}
    className="relative flex flex-col justify-between w-full min-h-[200px] p-4 overflow-hidden"
    style={{
      background: cover
        ? undefined
        : `linear-gradient(145deg, ${theme.accent} 0%, #0f172a 100%)`,
    }}
  >
    {cover ? (
      <>
        <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
      </>
    ) : null}
    <span
      className="relative z-[1] inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
      style={{ backgroundColor: `${theme.accent}cc` }}
    >
      <SocialIcon id={link.id} className="w-3.5 h-3.5" />
      {theme.label}
    </span>
    <div className="relative z-[1] text-white mt-8">
      <p className="text-sm font-bold leading-snug line-clamp-2">{link.host || theme.label}</p>
      <p className="mt-2 text-xs font-semibold text-teal-200">Open full post →</p>
    </div>
  </a>
);

const IframeEmbed = ({ link, aspectClass, onFail }) => (
  <div className={`relative w-full ${aspectClass} bg-slate-100 overflow-hidden`}>
    <iframe
      title={`${link.label} preview`}
      src={link.embedUrl}
      className="absolute inset-0 w-full h-full border-0 bg-white overflow-hidden"
      loading="lazy"
      scrolling="no"
      referrerPolicy={link.id === 'youtube' ? 'strict-origin-when-cross-origin' : 'no-referrer'}
      allow={
        link.id === 'youtube'
          ? 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
          : undefined
      }
      allowFullScreen={link.id === 'youtube'}
      onError={onFail}
      {...(link.id === 'youtube'
        ? {}
        : { sandbox: 'allow-scripts allow-same-origin allow-popups allow-presentation' })}
    />
  </div>
);

const SocialPreviewCard = ({ link, coverSrc, coverSeed }) => {
  const theme = SOCIAL_PREVIEW_THEME[link.id] || SOCIAL_PREVIEW_THEME.twitter;
  const [embedFailed, setEmbedFailed] = useState(false);
  const cover = coverSrc?.trim() ? getImageUrl(coverSrc, coverSeed || 'social') : '';
  const showEmbed = Boolean(link.embedUrl) && !embedFailed;
  const isTwitter = link.id === 'twitter';

  let media;
  if (isTwitter && link.url) {
    media = <TwitterEmbed url={link.url} />;
  } else if (link.id === 'youtube' && showEmbed) {
    media = (
      <IframeEmbed
        link={link}
        aspectClass="aspect-video"
        onFail={() => setEmbedFailed(true)}
      />
    );
  } else if (link.id === 'tiktok' && showEmbed) {
    media = (
      <IframeEmbed
        link={link}
        aspectClass="aspect-[9/16] max-h-[70vh]"
        onFail={() => setEmbedFailed(true)}
      />
    );
  } else if (link.id === 'instagram' && showEmbed) {
    media = (
      <IframeEmbed
        link={link}
        aspectClass="h-[540px] sm:h-[620px]"
        onFail={() => setEmbedFailed(true)}
      />
    );
  } else if (link.id === 'facebook' && showEmbed) {
    media = (
      <IframeEmbed
        link={link}
        aspectClass="h-[500px] sm:h-[580px]"
        onFail={() => setEmbedFailed(true)}
      />
    );
  } else {
    media = <FallbackCover link={link} cover={cover} theme={theme} />;
  }

  return (
    <article
      className="flex flex-col w-full max-w-full min-w-0 h-auto rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden"
      style={{ width: '100%' }}
    >
      <div
        className={`w-full max-w-full min-w-0 h-auto bg-white leading-none overflow-hidden ${
          isTwitter ? '[&_.twitter-tweet]:!m-0 [&_iframe]:!m-0' : ''
        }`}
        style={{ width: '100%' }}
      >
        {media}
      </div>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 min-w-0 group border-t border-slate-100 bg-white"
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
 * Mobile-first full-size social posts:
 * X uses official widget sized to screen width + auto height (no empty space / no scroll box).
 */
const ArticleSocialLinks = ({
  article,
  className = '',
  excludeIds = [],
  includeIds = null,
  hideHeading = false,
}) => {
  const includeKey = includeIds ? includeIds.join(',') : '';
  const excludeKey = excludeIds.join(',');
  const links = useMemo(
    () => getArticleSocialLinks(article, { excludeIds, includeIds }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable via joined keys
    [article, excludeKey, includeKey]
  );

  if (!links.length) return null;

  return (
    <div className={`mb-6 min-w-0 w-full ${className}`.trim()}>
      {!hideHeading && (
        <p className="text-sm font-semibold text-slate-800 mb-3">Related links</p>
      )}
      <div className="flex flex-col gap-4 w-full min-w-0">
        {links.map((link) => (
          <SocialPreviewCard
            key={link.key}
            link={link}
            coverSrc={article?.featuredImage || article?.ogImage || ''}
            coverSeed={article?.slug || link.key}
          />
        ))}
      </div>
    </div>
  );
};

export default ArticleSocialLinks;
