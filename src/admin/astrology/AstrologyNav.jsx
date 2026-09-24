import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/admin/astrology', label: 'Dashboard', end: true },
  { to: '/admin/astrology/settings', label: 'API Configuration' },
  { to: '/admin/astrology/horoscopes', label: 'Daily Horoscope' },
  { to: '/admin/astrology/panchangam', label: 'Panchangam' },
  { to: '/admin/astrology/sync', label: 'Sync Now' },
  { to: '/admin/astrology/sync-history', label: 'Sync History' },
];

const AstrologyNav = () => (
  <nav className="flex flex-wrap gap-1.5 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
    {LINKS.map((link) => (
      <NavLink
        key={link.to}
        to={link.to}
        end={link.end}
        className={({ isActive }) => (isActive ? 'admin-tab admin-tab-active' : 'admin-tab')}
      >
        {link.label}
      </NavLink>
    ))}
  </nav>
);

export default AstrologyNav;
