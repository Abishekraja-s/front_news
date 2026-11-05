import { useEffect, useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminThemeToggle from './AdminThemeToggle';
import toast from 'react-hot-toast';
import { settingService } from '../services/articleService';
import {
  getBrandAssetUrl,
  getBrandPosterUrl,
  isBrandVideo,
} from '../utils/images';
import {
  readCachedPublicSettings,
  writeCachedPublicSettings,
  warmBrandAssetsFromSettings,
} from '../utils/brandSettingsCache';

const AdminLogin = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(() => readCachedPublicSettings() || {});

  useEffect(() => {
    warmBrandAssetsFromSettings(readCachedPublicSettings());
    settingService
      .getPublic()
      .then(({ data }) => {
        const next = data.data || {};
        setSettings(next);
        writeCachedPublicSettings(next);
        warmBrandAssetsFromSettings(next);
      })
      .catch(() => {});
  }, []);

  const siteName = settings?.siteName || 'The Great India News';
  const siteNameTamil = settings?.siteNameTamil || 'தி கிரேட் இந்தியா நியூஸ்';
  const logoUrl = getBrandAssetUrl(settings?.headerLogo);
  const posterUrl = getBrandPosterUrl(settings?.headerLogo);

  if (user) {
    if (user.role === 'SELLER') return <Navigate to="/seller" replace />;
    if (user.role === 'MATRIMONY') return <Navigate to="/matrimony/member" replace />;
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success('Login successful');
      navigate(
        data.user?.role === 'SELLER'
          ? '/seller'
          : data.user?.role === 'MATRIMONY'
            ? '/matrimony/member'
            : '/admin'
      );
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK' || !err.response
          ? 'Cannot reach the server. Make sure the backend is running on port 5000.'
          : 'Login failed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const LogoBlock = ({ variant = 'panel' }) => {
    const isMobile = variant === 'mobile';
    if (logoUrl) {
      if (isBrandVideo(settings?.headerLogo)) {
        return (
          <video
            src={logoUrl}
            poster={posterUrl || undefined}
            className={`w-auto object-contain mb-4 ${isMobile ? 'h-12 mx-auto' : 'h-16 max-w-[280px] object-left'}`}
            autoPlay
            muted
            loop
            playsInline
          />
        );
      }
      return (
        <img
          src={logoUrl}
          alt={siteName}
          className={`w-auto object-contain mb-4 ${isMobile ? 'h-12 mx-auto' : 'h-16 max-w-[280px] object-left'}`}
        />
      );
    }
    return (
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
          isMobile ? 'bg-brand-600 mx-auto' : 'bg-white/10'
        }`}
      >
        <span className="text-white font-bold text-2xl">G</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row">
      {/* Brand panel — hidden on small mobile */}
      <div className="hidden sm:flex lg:w-1/2 bg-gradient-to-br from-brand-700 via-brand-800 to-news-dark p-8 lg:p-12 flex-col justify-between">
        <div>
          <LogoBlock variant="panel" />
          <h1 className="text-3xl lg:text-4xl font-bold text-white font-headline leading-tight">
            {siteName}
          </h1>
          <p className="text-brand-200 mt-2 text-lg">{siteNameTamil}</p>
        </div>
        <p className="text-slate-400 text-sm">
          Professional news management system for editors and administrators.
        </p>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative admin-page-bg">
        <div className="absolute top-4 right-4">
          <AdminThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <div className="sm:hidden text-center mb-8">
            <LogoBlock variant="mobile" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin Login</h1>
          </div>

          <div className="admin-card shadow-xl p-6 sm:p-8">
            <h2 className="hidden sm:block text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Sign in</h2>
            <p className="hidden sm:block text-slate-500 dark:text-slate-400 text-sm mb-6">Enter your admin credentials</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="admin-input"
                  placeholder="admin@thegreatindianews.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="admin-input"
                  placeholder="••••••••"
                />
                <div className="mt-2 flex justify-end">
                  <Link
                    to="/admin/forgot-password"
                    className="text-sm font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <Link to="/" className="block text-center text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 mt-6">
              ← Back to website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
