import { Link } from 'react-router-dom';

const LINKS = [
  {
    to: '/marketplace',
    label: 'Marketplace',
    labelTa: 'சந்தை',
    hint: 'Buy & sell',
    accent: 'from-teal-500 to-emerald-600',
    ring: 'ring-teal-200/80 dark:ring-teal-800',
    iconBg: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l1-4h16l1 4M4 9h16v10a1 1 0 01-1 1H5a1 1 0 01-1-1V9zm4 4h2m4 0h2" />
      </svg>
    ),
  },
  {
    to: '/matrimony',
    label: 'Matrimony',
    labelTa: 'திருமணம்',
    hint: 'Find matches',
    accent: 'from-rose-500 to-pink-600',
    ring: 'ring-rose-200/80 dark:ring-rose-800',
    iconBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.5C2.5 10.5 2.5 7.5 4.5 5.5s5-2 7 0c2-2 5-2 7 0s2 5 0 7l-7 7-7-7z" />
      </svg>
    ),
  },
  {
    to: '/explore/exams',
    label: 'Quiz',
    labelTa: 'வினாடி வினா',
    hint: 'Daily exams',
    accent: 'from-indigo-500 to-violet-600',
    ring: 'ring-indigo-200/80 dark:ring-indigo-800',
    iconBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h.01M15 9h.01M8 14s1.5 2 4 2 4-2 4-2M12 3a9 9 0 100 18 9 9 0 000-18z" />
      </svg>
    ),
  },
];

/**
 * Premium quick links under category titles — card chips with blink accent.
 */
const CategoryQuickLinks = ({ className = '' }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 ${className}`}>
    {LINKS.map((item) => (
      <Link
        key={item.to}
        to={item.to}
        className={`category-quick-blink group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 ring-1 ${item.ring} shadow-sm hover:shadow-md transition-shadow`}
      >
        <span
          className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`}
          aria-hidden
        />
        <span className="flex items-center gap-3 px-3.5 py-3 sm:px-4 sm:py-3.5">
          <span
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}
          >
            {item.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
              {item.labelTa}
            </span>
            <span className="block text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {item.label} · {item.hint}
            </span>
          </span>
          <span
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${item.accent} text-white text-sm font-bold shadow-sm`}
            aria-hidden
          >
            →
          </span>
        </span>
      </Link>
    ))}
  </div>
);

export default CategoryQuickLinks;
