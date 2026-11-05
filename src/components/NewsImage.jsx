import { useEffect, useState } from 'react';
import { getImageUrl } from '../utils/images';

/**
 * News image with optional placeholder.
 * noPlaceholder=true → hide broken/missing images (no random dummy photos).
 */
const NewsImage = ({
  src,
  alt = '',
  seed = 'news',
  className = '',
  loading = 'lazy',
  noPlaceholder = false,
  placeholderClassName = '',
  ...props
}) => {
  // Brand default-og JPEG is for WhatsApp cards only — not a news thumbnail
  const usable = src?.trim() && !/default-og-image\.jpg/i.test(src) ? src.trim() : '';
  const resolved = usable ? getImageUrl(usable, seed) : noPlaceholder ? '' : getImageUrl('', seed);
  const [imgSrc, setImgSrc] = useState(resolved);
  const [failed, setFailed] = useState(!usable && noPlaceholder);

  // Re-bind when image URL is updated after enrich / edit
  useEffect(() => {
    const nextUsable = src?.trim() && !/default-og-image\.jpg/i.test(src) ? src.trim() : '';
    const next = nextUsable ? getImageUrl(nextUsable, seed) : noPlaceholder ? '' : getImageUrl('', seed);
    setImgSrc(next);
    setFailed(!nextUsable && noPlaceholder);
  }, [src, seed, noPlaceholder]);

  const handleError = () => {
    if (!failed) {
      setFailed(true);
      if (!noPlaceholder) {
        setImgSrc(getImageUrl('', seed));
      }
    }
  };

  if (failed && noPlaceholder) {
    return (
      <div
        className={`bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 ${placeholderClassName || className}`}
        aria-hidden
      >
        <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={handleError}
      // Help browsers pick a full-width fetch on mobile listing cards
      {...(props.sizes ? {} : { sizes: '(max-width: 640px) 100vw, 50vw' })}
      {...props}
    />
  );
};

export default NewsImage;
