import { Link } from 'react-router-dom';

/**
 * Horizontal pill portal cards (Marketplace / Matrimony / Quiz)
 * — white capsule + left gradient icon blob + right circular arrow.
 */
const FeaturePortalCards = ({ className = '', centered = false }) => (
  <div className={`mb-8 w-full max-w-full min-w-0 ${className}`.trim()}>
    <div
      className={`grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch mx-auto ${
        centered
          ? 'max-w-5xl justify-items-center'
          : 'justify-items-center md:justify-items-stretch'
      }`}
    >
      {/* Marketplace — green */}
      <Link
        to="/marketplace"
        className="portal-pill group relative block w-full max-w-md md:max-w-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-[2rem]"
      >
        <div className="relative flex items-center gap-3 sm:gap-3.5 rounded-[2rem] bg-white pl-2 pr-3 py-2.5 shadow-[0_14px_36px_rgba(15,23,42,0.1)] ring-1 ring-emerald-100/80 group-hover:shadow-[0_18px_44px_rgba(5,150,105,0.18)] transition-shadow duration-300">
          <div
            className="portal-blob portal-blob-g relative shrink-0 flex h-[4.6rem] w-[4.6rem] sm:h-[5rem] sm:w-[5rem] items-center justify-center text-white shadow-[0_12px_28px_rgba(5,150,105,0.4)] -ml-1 -my-1"
            style={{ background: 'linear-gradient(145deg, #4ade80 0%, #16a34a 55%, #166534 100%)' }}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2M8 7h.01M12 7h.01" />
            </svg>
          </div>

          <div className="min-w-0 flex-1 py-1">
            <h3 className="text-xl sm:text-[1.35rem] font-bold font-tamil text-slate-900 leading-tight">சந்தை</h3>
            <p className="mt-0.5 text-[12px] sm:text-[13px] text-slate-500 truncate">Marketplace - Buy &amp; Sell</p>
          </div>

          <span
            className="shrink-0 inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full text-white shadow-[0_8px_20px_rgba(22,163,74,0.45)] group-hover:scale-110 transition-transform duration-300"
            style={{ background: 'linear-gradient(145deg, #22c55e, #15803d)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>

      {/* Matrimony — pink / magenta */}
      <Link
        to="/matrimony"
        className="portal-pill group relative block w-full max-w-md md:max-w-none focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-[2rem]"
      >
        <div className="relative flex items-center gap-3 sm:gap-3.5 rounded-[2rem] bg-white pl-2 pr-3 py-2.5 shadow-[0_14px_36px_rgba(15,23,42,0.1)] ring-1 ring-pink-100/80 group-hover:shadow-[0_18px_44px_rgba(219,39,119,0.18)] transition-shadow duration-300">
          <div
            className="portal-blob portal-blob-p relative shrink-0 flex h-[4.6rem] w-[4.6rem] sm:h-[5rem] sm:w-[5rem] items-center justify-center text-white shadow-[0_12px_28px_rgba(219,39,119,0.4)] -ml-1 -my-1"
            style={{ background: 'linear-gradient(145deg, #fb7185 0%, #e11d48 50%, #9f1239 100%)' }}
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>

          <div className="min-w-0 flex-1 py-1">
            <h3 className="text-xl sm:text-[1.35rem] font-bold font-tamil text-slate-900 leading-tight">திருமணம்</h3>
            <p className="mt-0.5 text-[12px] sm:text-[13px] text-slate-500 truncate">Matrimony - Find matches</p>
          </div>

          <span
            className="shrink-0 inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full text-white shadow-[0_8px_20px_rgba(225,29,72,0.45)] group-hover:scale-110 transition-transform duration-300"
            style={{ background: 'linear-gradient(145deg, #f43f5e, #be123c)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>

      {/* Quiz — purple / indigo */}
      <Link
        to="/explore/news-quiz"
        className="portal-pill group relative block w-full max-w-md md:max-w-none focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-[2rem]"
      >
        <div className="relative flex items-center gap-3 sm:gap-3.5 rounded-[2rem] bg-white pl-2 pr-3 py-2.5 shadow-[0_14px_36px_rgba(15,23,42,0.1)] ring-1 ring-violet-100/80 group-hover:shadow-[0_18px_44px_rgba(109,40,217,0.18)] transition-shadow duration-300">
          <div
            className="portal-blob portal-blob-v relative shrink-0 flex h-[4.6rem] w-[4.6rem] sm:h-[5rem] sm:w-[5rem] items-center justify-center text-white shadow-[0_12px_28px_rgba(109,40,217,0.4)] -ml-1 -my-1"
            style={{ background: 'linear-gradient(145deg, #a78bfa 0%, #7c3aed 50%, #4c1d95 100%)' }}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="min-w-0 flex-1 py-1">
            <h3 className="text-xl sm:text-[1.35rem] font-bold font-tamil text-slate-900 leading-tight">வினாடி வினா</h3>
            <p className="mt-0.5 text-[12px] sm:text-[13px] text-slate-500 truncate">Quiz - Daily exams</p>
          </div>

          <span
            className="shrink-0 inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full text-white shadow-[0_8px_20px_rgba(124,58,237,0.45)] group-hover:scale-110 transition-transform duration-300"
            style={{ background: 'linear-gradient(145deg, #8b5cf6, #5b21b6)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>
    </div>

    <style>{`
      .portal-pill { transition: transform 0.3s ease; }
      .portal-pill:hover { transform: translateY(-3px); }

      .portal-blob {
        border-radius: 1.65rem 1.1rem 1.75rem 1.2rem;
      }
      .portal-blob-p {
        border-radius: 1.2rem 1.85rem 1.15rem 1.7rem;
      }
      .portal-blob-v {
        border-radius: 1.85rem 1.35rem 1.2rem 1.75rem;
      }
    `}</style>
  </div>
);

export default FeaturePortalCards;
