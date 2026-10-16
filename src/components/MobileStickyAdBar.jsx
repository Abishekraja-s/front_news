import { useEffect, useState } from 'react';
import { adService, adSenseService } from '../services/articleService';
import Advertisement from './Advertisement';
import AdSenseSlot from './AdSenseSlot';

/**
 * Mobile sticky ad above the bottom nav.
 * Renders nothing (no white bar) when there is no ad content.
 */
const MobileStickyAdBar = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      adService.getByPosition('mobile_sticky'),
      adSenseService.getPublic({ location: 'mobile_sticky', page: 'all' }),
    ]).then(([adRes, senseRes]) => {
      if (cancelled) return;
      const ads = adRes.status === 'fulfilled' ? adRes.value.data?.data || [] : [];
      const placements = senseRes.status === 'fulfilled' ? senseRes.value.data?.data || [] : [];
      const hasImageOrCode = ads.some(
        (ad) =>
          (ad.type === 'image' && ad.image?.trim()) ||
          (ad.type === 'code' && ad.code?.trim())
      );
      setShow(hasImageOrCode || placements.length > 0);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  return (
    <div className="lg:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] inset-x-0 z-30 bg-white border-t border-stone-200 p-2 shadow-md mobile-sticky-ad">
      <Advertisement position="mobile_sticky" label={false} />
      <AdSenseSlot location="mobile_sticky" page="all" />
    </div>
  );
};

export default MobileStickyAdBar;
