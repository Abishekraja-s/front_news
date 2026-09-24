/** 12 Rasi images — circle icon only (no text) */

const RASI_VERSION = 'v12';

const RASI_IMAGE = {
  mesham: `/astrology/mesham.webp?${RASI_VERSION}`,
  rishabam: `/astrology/rishabam.webp?${RASI_VERSION}`,
  mithunam: `/astrology/mithunam.webp?${RASI_VERSION}`,
  kadagam: `/astrology/kadagam.webp?${RASI_VERSION}`,
  simmam: `/astrology/simmam.webp?${RASI_VERSION}`,
  kanni: `/astrology/kanni.webp?${RASI_VERSION}`,
  thulam: `/astrology/thulam.webp?${RASI_VERSION}`,
  viruchigam: `/astrology/viruchigam.webp?${RASI_VERSION}`,
  dhanusu: `/astrology/dhanusu.webp?${RASI_VERSION}`,
  magaram: `/astrology/magaram.webp?${RASI_VERSION}`,
  kumbam: `/astrology/kumbam.webp?${RASI_VERSION}`,
  meenam: `/astrology/meenam.webp?${RASI_VERSION}`,
};

/**
 * Circular gold zodiac icon only (no text under the image).
 * @param {{ slug: string, size?: 'sm'|'md'|'lg'|'xl', className?: string, alt?: string }} props
 */
const RasiImage = ({ slug, size = 'md', className = '', alt = '' }) => {
  const sizes = {
    sm: 'w-14 h-14',
    md: 'w-24 h-24 sm:w-28 sm:h-28',
    lg: 'w-32 h-32 sm:w-40 sm:h-40',
    xl: 'w-40 h-40 sm:w-44 sm:h-44',
  };
  const src = RASI_IMAGE[slug] || RASI_IMAGE.mesham;

  return (
    <div
      className={`flex-shrink-0 overflow-hidden rounded-full bg-black shadow-md ring-2 ring-amber-500/40 ${sizes[size] || sizes.md} ${className}`}
    >
      <img
        src={src}
        alt={alt || `${slug} rasi`}
        className="h-full w-full object-contain object-center select-none"
        loading="eager"
        decoding="async"
        width={176}
        height={176}
        draggable={false}
      />
    </div>
  );
};

export default RasiImage;
export { RASI_IMAGE };
