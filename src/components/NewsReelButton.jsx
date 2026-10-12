import { useState } from 'react';
import NewsReelFeed from './NewsReelFeed';

/**
 * Right-side floating button → Instagram-style all-news scroll.
 */
const NewsReelButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed z-[55] right-3 sm:right-5
          bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))]
          sm:bottom-6
          w-14 h-14 sm:w-16 sm:h-16 rounded-full
          bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600
          text-white shadow-[0_0_24px_rgba(244,63,94,0.55)]
          border-2 border-white/90
          flex items-center justify-center
          hover:scale-105 active:scale-95 transition-transform
          focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        aria-label="Open all news reel"
        title="All news"
      >
        <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="3" width="16" height="18" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M10 9.2v5.6l5-2.8-5-2.8z" fill="currentColor" />
        </svg>
      </button>

      <NewsReelFeed open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default NewsReelButton;
