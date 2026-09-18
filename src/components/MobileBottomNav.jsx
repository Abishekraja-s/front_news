import { Link, useLocation } from 'react-router-dom';
import { MOBILE_BOTTOM_NAV_ITEMS, isMobileBottomNavActive } from '../utils/helpers';

const icons = {
  home: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  explore: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  marketplace: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  matrimony: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
};

const iconForPath = (path) => {
  if (path === '/') return icons.home;
  if (path === '/explore') return icons.explore;
  if (path === '/marketplace') return icons.marketplace;
  return icons.matrimony;
};

const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const lastIndex = MOBILE_BOTTOM_NAV_ITEMS.length - 1;

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 w-full bg-white border-t border-stone-200 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] mobile-bottom-nav"
      aria-label="Mobile bottom menu"
    >
      <ul className="flex w-full items-stretch m-0 p-0 list-none pl-2 pr-3 pb-[env(safe-area-inset-bottom,0px)]">
        {MOBILE_BOTTOM_NAV_ITEMS.map((item, index) => {
          const active = isMobileBottomNavActive(item.path, pathname);
          const isLast = index === lastIndex;
          const isLongLabel = item.label.length > 8;

          return (
            <li key={item.path} className="flex-1 min-w-0">
              <Link
                to={item.path}
                title={item.label}
                className={`flex w-full flex-col items-center justify-center gap-0.5 py-2 text-center transition-colors ${
                  isLast ? 'pl-0.5 pr-2' : 'px-0.5'
                } ${active ? 'text-teal-700' : 'text-slate-600'}`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center sm:h-7 sm:w-7 [&>svg]:h-full [&>svg]:w-full ${
                    active ? 'text-teal-600' : 'text-slate-500'
                  }`}
                >
                  {iconForPath(item.path)}
                </span>
                <span
                  className={`block w-full font-semibold leading-tight ${
                    isLongLabel
                      ? 'text-[9px] sm:text-[10px] whitespace-normal'
                      : 'text-[11px] sm:text-xs whitespace-nowrap'
                  } ${active ? 'text-teal-700' : 'text-slate-600'}`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
