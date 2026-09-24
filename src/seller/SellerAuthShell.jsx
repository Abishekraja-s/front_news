import { Link } from 'react-router-dom';

/** Shared responsive shell for seller auth screens (login / register / forgot / reset). */
export const SellerAuthShell = ({
  title,
  subtitle,
  children,
  footer,
  maxWidthClass = 'max-w-md',
}) => (
  <div className="min-h-[100dvh] bg-stone-100 flex flex-col">
    <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10 safe-area-pad">
      <div
        className={`w-full ${maxWidthClass} bg-white rounded-2xl shadow-md border border-stone-200 p-5 xs:p-6 sm:p-8`}
      >
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-headline leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{subtitle}</p>
        )}
        <div className="mt-5 sm:mt-6">{children}</div>
        {footer}
      </div>
    </div>
  </div>
);

export const sellerInputCls =
  'mt-1.5 w-full border border-stone-200 rounded-xl px-3 py-3 sm:py-2.5 text-base sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600';

export const SellerAuthFooter = ({ children }) => (
  <div className="mt-5 sm:mt-6 space-y-3 text-center">{children}</div>
);

export const SellerBackLink = ({ to = '/marketplace', label = '← Back to Marketplace' }) => (
  <p className="text-xs text-center">
    <Link to={to} className="text-slate-400 hover:text-slate-600 inline-block py-1">
      {label}
    </Link>
  </p>
);
