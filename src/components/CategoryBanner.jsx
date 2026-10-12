import { useEffect, useState } from 'react';
import { adService } from '../services/articleService';
import NewsImage from './NewsImage';

/**
 * One banner under a category title.
 * Prefers Admin → Advertisements position `category_{slug}`,
 * falls back to shared `category_below`.
 */
const CategoryBanner = ({ slug, className = '' }) => {
  const [ad, setAd] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setAd(null);

    const load = async () => {
      try {
        if (slug) {
          const specific = await adService.getByPosition(`category_${slug}`);
          const list = specific.data?.data || [];
          if (list.length) {
            if (!cancelled) setAd(list[0]);
            return;
          }
        }
        const shared = await adService.getByPosition('category_below');
        const list = shared.data?.data || [];
        if (!cancelled) setAd(list[0] || null);
      } catch {
        if (!cancelled) setAd(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!loaded || !ad) return null;

  const hasImage = ad.type === 'image' && ad.image?.trim();
  const hasCode = ad.type === 'code' && ad.code?.trim();
  if (!hasImage && !hasCode) return null;

  const clickUrl = ad.link?.trim();
  const isClickable = Boolean(clickUrl && clickUrl !== '#');

  const imageBlock = hasImage ? (
    <NewsImage
      src={ad.image}
      seed={`ad-${ad._id || slug || 'category'}`}
      alt={ad.title || 'Advertisement'}
      className="w-full h-auto rounded-xl block"
      loading="lazy"
    />
  ) : (
    <div className="overflow-hidden rounded-xl w-full" dangerouslySetInnerHTML={{ __html: ad.code }} />
  );

  return (
    <div className={`ad-container ${className}`} data-ad-position={ad.position}>
      {isClickable ? (
        <a
          href={clickUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block"
          aria-label={ad.title || 'Advertisement'}
        >
          {imageBlock}
        </a>
      ) : (
        <div className="block">{imageBlock}</div>
      )}
    </div>
  );
};

export default CategoryBanner;
