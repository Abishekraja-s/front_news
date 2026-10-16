import { useEffect, useState } from 'react';
import { adSenseService } from '../services/articleService';
import AdSenseUnit from './AdSenseUnit';

/**
 * Renders active AdSense placements for a location on the public site.
 * @param {string} location - e.g. header, article_top, homepage
 * @param {string} page - home | article | category | …
 * @param {string} category - optional category slug
 */
const AdSenseSlot = ({ location, customLocation = '', page = 'all', category = '', className = '' }) => {
  const [placements, setPlacements] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!location && !customLocation) return undefined;
    let cancelled = false;
    setLoaded(false);
    adSenseService
      .getPublic({ location, customLocation: customLocation || undefined, page, category: category || undefined })
      .then(({ data }) => {
        if (!cancelled) setPlacements(data.data || []);
      })
      .catch(() => {
        if (!cancelled) setPlacements([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [location, customLocation, page, category]);

  if (!loaded || !placements.length) return null;

  return (
    <>
      {placements.map((p) => (
        <AdSenseUnit key={p._id} placement={p} className={className} showLabel />
      ))}
    </>
  );
};

export default AdSenseSlot;
