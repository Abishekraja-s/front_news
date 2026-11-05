/** Matrimony + Marketplace images only */
export const PORTAL_IMAGE_MAX_BYTES = 50 * 1024; // 50 KB
export const PORTAL_IMAGE_MAX_LABEL = '50 KB';

export const isPortalImageTooLarge = (file) => {
  if (!file) return false;
  if (!String(file.type || '').startsWith('image/')) return false;
  return file.size > PORTAL_IMAGE_MAX_BYTES;
};

export const portalImageSizeError = () =>
  `Image must be ${PORTAL_IMAGE_MAX_LABEL} or less`;
