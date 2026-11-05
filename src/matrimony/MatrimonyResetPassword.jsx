import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const inputCls = 'mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5';

const MatrimonyResetPassword = () => {
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
    return <Navigate to={user.role === 'MATRIMONY' ? '/matrimony/member' : '/admin'} replace />;
  }

  if (!token) {
    return <Navigate to="/matrimony/forgot-password" replace />;
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
      const { data } = await authService.resetPassword(token, password, 'matrimony');
      toast.success(data.message || 'Password updated');
      navigate('/matrimony/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-stone-200 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 font-headline">Set new password</h1>
        <p className="text-sm text-slate-500 mt-1">
          {email
            ? `Choose a new password for ${email}`
            : 'Choose a new password for your matrimony account'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="text-slate-600">New password</span>
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={6}
                className={`${inputCls} pr-14`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 px-2 py-1.5 rounded-lg hover:bg-stone-100"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Confirm password</span>
            <input
              required
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={6}
              className={inputCls}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
            />
          </label>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Saving…' : 'Update password'}
          </button>
          <p className="text-xs text-slate-400 text-center">
            Or{' '}
            <Link to="/matrimony/forgot-password" className="text-teal-700 font-semibold">
              request a new reset link
            </Link>
          </p>
        </form>

        <p className="text-xs text-center mt-4">
          <Link to="/matrimony/login" className="text-slate-400 hover:text-slate-600">
            ← Back to Matrimony Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default MatrimonyResetPassword;
