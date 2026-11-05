export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ta-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('ta-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('ta-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const timeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'இப்போது';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} நிமிடங்களுக்கு முன்`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} மணி நேரத்திற்கு முன்`;
  return formatDate(date);
};

import { getImageUrl, DEFAULT_NEWS_IMAGE } from './images';

export { getImageUrl, DEFAULT_NEWS_IMAGE };

export const truncate = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? text.slice(0, length) + '...' : text;
};

/** Fixed bottom bar on mobile */
export const MOBILE_BOTTOM_NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Today', path: '/explore' },
  { label: 'Market', path: '/marketplace' },
  { label: 'Matrimony', path: '/matrimony' },
  { label: 'Quiz', path: '/explore/exams' },
];

export const isMobileBottomNavActive = (path, pathname = '') => {
  if (path === '/') return pathname === '/';
  if (path === '/explore') {
    if (pathname === '/explore') return true;
    if (!pathname.startsWith('/explore/')) return false;
    // Quiz has its own tab — don't mark Today active on exam/quiz routes
    return !pathname.startsWith('/explore/exams');
  }
  if (path === '/explore/exams') {
    return pathname === '/explore/exams' || pathname.startsWith('/explore/exams/');
  }
  return pathname === path || pathname.startsWith(`${path}/`);
};

/** Main site categories — display order */
export const SITE_CATEGORIES = [
  { name: 'District', nameTamil: 'மாவட்டம்', slug: 'district', order: 1 },
  { name: 'Politics', nameTamil: 'அரசியல்', slug: 'politics', order: 2 },
  { name: 'Chennai', nameTamil: 'சென்னை', slug: 'chennai', order: 3 },
  { name: 'Tamil Nadu', nameTamil: 'தமிழ்நாடு', slug: 'tamil-nadu', order: 4 },
  { name: 'India', nameTamil: 'இந்தியா', slug: 'india', order: 5 },
  { name: 'World', nameTamil: 'உலகம்', slug: 'world', order: 6 },
  { name: 'Crime', nameTamil: 'குற்றம்', slug: 'crime', order: 7 },
  { name: 'POCSO', nameTamil: 'போக்சோ', slug: 'pocso', order: 8 },
  { name: 'Spiritual', nameTamil: 'ஆன்மீகம்', slug: 'spiritual', order: 9 },
  { name: 'Special', nameTamil: 'சிறப்பு செய்திகள்', slug: 'special', order: 10 },
  { name: 'Education', nameTamil: 'கல்வி', slug: 'education', order: 11 },
  { name: 'Sports', nameTamil: 'விளையாட்டு', slug: 'sports', order: 12 },
  { name: 'Jobs', nameTamil: 'வேலை வாய்ப்பு', slug: 'jobs', order: 13 },
  { name: 'Agriculture', nameTamil: 'விவசாயம்', slug: 'agriculture', order: 14 },
  { name: 'Sri Lanka', nameTamil: 'இலங்கை', slug: 'sri-lanka', order: 15 },
  { name: 'Business', nameTamil: 'வணிகம்', slug: 'business', order: 16 },
  { name: 'Health', nameTamil: 'மருத்துவம்', slug: 'health', order: 17 },
  { name: 'Short News', nameTamil: 'ஷார்ட் நியூஸ்', slug: 'short-news', order: 18 },
  { name: 'Weather', nameTamil: 'வானிலை', slug: 'weather', order: 19 },
  { name: 'Other News', nameTamil: 'மற்ற செய்திகள்', slug: 'other-news', order: 20 },
];

export const CATEGORY_TITLES = Object.fromEntries(
  SITE_CATEGORIES.map((c) => [c.slug, c.nameTamil])
);

export const CATEGORY_SLUGS = SITE_CATEGORIES.map((c) => c.slug);

export const NAV_ITEMS = [
  { label: 'முகப்பு', path: '/' },
  { label: 'இன்று', path: '/explore' },
  ...SITE_CATEGORIES.map((c) => ({ label: c.nameTamil, path: `/${c.slug}` })),
];
