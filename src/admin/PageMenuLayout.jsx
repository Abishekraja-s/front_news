import { NavLink, Outlet } from 'react-router-dom';

const PAGE_MENU_ITEMS = [
  { slug: 'about', label: 'About Us', path: '/admin/page-menu/about' },
  { slug: 'contact', label: 'Contact', path: '/admin/page-menu/contact' },
  { slug: 'editorial-policy', label: 'Editorial Policy', path: '/admin/page-menu/editorial-policy' },
  { slug: 'correction-policy', label: 'Correction Policy', path: '/admin/page-menu/correction-policy' },
  { slug: 'disclaimer', label: 'Disclaimer', path: '/admin/page-menu/disclaimer' },
  {
    slug: 'gdpr-privacy-policy',
    label: 'GDPR Privacy Policy',
    path: '/admin/page-menu/gdpr-privacy-policy',
  },
  { slug: 'privacy-policy', label: 'Privacy Policy', path: '/admin/page-menu/privacy-policy' },
  { slug: 'terms', label: 'Terms of Use', path: '/admin/page-menu/terms' },
  { slug: 'copyright', label: 'Copyright', path: '/admin/page-menu/copyright' },
  { slug: 'grievance', label: 'Grievance', path: '/admin/page-menu/grievance' },
  { slug: 'advertise', label: 'Advertisement Us', path: '/admin/page-menu/advertise' },
  {
    slug: 'marketplace-disclaimer',
    label: 'Marketplace Disclaimer',
    path: '/admin/page-menu/marketplace-disclaimer',
  },
  {
    slug: 'matrimony-disclaimer',
    label: 'Matrimony Disclaimer',
    path: '/admin/page-menu/matrimony-disclaimer',
  },
];

const PageMenuLayout = () => (
  <div>
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
        Menu Management
      </p>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Page Menu</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Create, edit, and publish static page content
      </p>
    </div>

    <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
      {PAGE_MENU_ITEMS.map((item) => (
        <NavLink
          key={item.slug}
          to={item.path}
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-700'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>

    <Outlet />
  </div>
);

export default PageMenuLayout;
