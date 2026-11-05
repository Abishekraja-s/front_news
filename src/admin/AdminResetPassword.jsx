import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import AdminThemeToggle from './AdminThemeToggle';

const AdminResetPassword = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const email = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    if (user.role === 'SELLER') return <Navigate to="/seller" replace />;
    if (user.role === 'MATRIMONY') return <Navigate to="/matrimony/member" replace />;
    return <Navigate to="/admin" replace />;
  }

  if (!token) {
    return <Navigate to="/admin/forgot-password" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authService.resetPassword(token, password, 'admin');
      toast.success(data.message || 'Password updated');
      navigate('/admin/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row">
      <div className="hidden sm:flex lg:w-1/2 bg-gradient-to-br from-brand-700 via-brand-800 to-news-dark p-8 lg:p-12 flex-col justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white font-headline leading-tight">
            Set new password
          </h1>
          <p className="text-brand-200 mt-2 text-lg">Admin account recovery</p>
        </div>
        <p className="text-slate-400 text-sm">Link expires 30 minutes after it was sent.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative admin-page-bg">
        <div className="absolute top-4 right-4">
          <AdminThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <div className="admin-card shadow-xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Set new password</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              {email ? `Choose a new password for ${email}` : 'Choose a new password for your admin account'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="admin-input pr-14"
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 px-2 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-700"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="admin-input"
                  placeholder="Re-enter password"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-50">
                {loading ? 'Saving…' : 'Update password'}
              </button>
            </form>

            <p className="text-xs text-slate-400 text-center mt-4">
              Or{' '}
              <Link to="/admin/forgot-password" className="text-teal-700 font-semibold">
                request a new reset link
              </Link>
            </p>
            <Link
              to="/admin/login"
              className="block text-center text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 mt-4"
            >
              ← Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminResetPassword;
