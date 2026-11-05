import { useEffect, useState } from 'react';
import { categoryService } from '../services/articleService';
import { NAV_ITEMS } from '../utils/helpers';

const STATIC_TOP = [
  { label: 'முகப்பு', path: '/' },
  { label: 'இன்று', path: '/explore' },
];

/**
 * Header / mobile menu nav: Home + Today + categories with showInHeader.
 * Falls back to static NAV_ITEMS if the API is unavailable.
 */
export default function useHeaderNavItems() {
  const [items, setItems] = useState(NAV_ITEMS);

  useEffect(() => {
    let cancelled = false;
    categoryService
      .getAll({ header: 'true', status: 'active' })
      .then(({ data }) => {
        if (cancelled) return;
        const cats = (data.data || [])
          .filter((c) => c?.slug && c.showInHeader !== false)
          .map((c) => ({
            label: c.nameTamil || c.name,
            path: `/${c.slug}`,
          }));
        setItems([...STATIC_TOP, ...cats]);
      })
      .catch(() => {
        if (!cancelled) setItems(NAV_ITEMS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return items;
}
