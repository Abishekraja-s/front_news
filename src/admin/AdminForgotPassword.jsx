import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
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
import AdminThemeToggle from './AdminThemeToggle';

const AdminBrandMark = ({ settings, light = false }) => {
  const logoUrl = getBrandAssetUrl(settings?.headerLogo);
  const posterUrl = getBrandPosterUrl(settings?.headerLogo);
  const name = settings?.siteName || 'The Great India News';
  const nameTa = settings?.siteNameTamil || 'தி கிரேட் இந்தியா நியூஸ்';

  return (
    <div className={light ? '' : ''}>
      {logoUrl ? (
        isBrandVideo(settings?.headerLogo) ? (
          <video
            src={logoUrl}
            poster={posterUrl || undefined}
            className="h-14 w-auto max-w-[240px] object-contain object-left mb-6"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={logoUrl}
            alt={name}
            className="h-14 w-auto max-w-[240px] object-contain object-left mb-6"
          />
        )
      ) : (
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
            light ? 'bg-brand-600' : 'bg-white/10'
          }`}
        >
          <span className="text-white font-bold text-2xl">G</span>
        </div>
      )}
      <h1
        className={`font-bold font-headline leading-tight ${
          light ? 'text-2xl text-slate-900 dark:text-slate-100' : 'text-3xl lg:text-4xl text-white'
        }`}
      >
        {name}
      </h1>
      {nameTa && (
        <p className={`mt-2 text-lg ${light ? 'text-slate-500' : 'text-brand-200'}`}>{nameTa}</p>
      )}
    </div>
  );
};

const AdminForgotPassword = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(() => readCachedPublicSettings() || {});
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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

  if (user) {
    if (user.role === 'SELLER') return <Navigate to="/seller" replace />;
    if (user.role === 'MATRIMONY') return <Navigate to="/matrimony/member" replace />;
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.forgotPassword(email, 'admin');
      setSent(true);
      toast.success(data.message || 'Reset link sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row">
      <div className="hidden sm:flex lg:w-1/2 bg-gradient-to-br from-brand-700 via-brand-800 to-news-dark p-8 lg:p-12 flex-col justify-between">
        <AdminBrandMark settings={settings} />
        <p className="text-slate-400 text-sm">
          Reset access for editors and administrators.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative admin-page-bg">
        <div className="absolute top-4 right-4">
          <AdminThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <div className="sm:hidden text-center mb-8">
            <AdminBrandMark settings={settings} light />
          </div>

          <div className="admin-card shadow-xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Forgot password</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Enter your admin email. We will send a reset link if the account exists.
            </p>

            {sent ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200">
                  If an admin account exists for <strong className="font-semibold">{email}</strong>, a reset
                  link has been emailed. It expires in 30 minutes — check inbox and spam.
                </div>
                <button
                  type="button"
                  className="text-sm font-semibold text-teal-700 hover:text-teal-800"
                  onClick={() => setSent(false)}
                >
                  Send again / use another email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="admin-input"
                    placeholder="admin@thegreatindianews.com"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-50">
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            )}

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-6 text-center">
              Remembered it?{' '}
              <Link to="/admin/login" className="text-teal-700 font-semibold hover:text-teal-800">
                Sign in
              </Link>
            </p>
            <Link
              to="/"
              className="block text-center text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 mt-3"
            >
              ← Back to website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
