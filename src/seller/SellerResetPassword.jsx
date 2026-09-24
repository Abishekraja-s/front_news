import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import {
  SellerAuthShell,
  SellerAuthFooter,
  SellerBackLink,
  sellerInputCls,
} from './SellerAuthShell';

const SellerResetPassword = () => {
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
    return <Navigate to={user.role === 'SELLER' ? '/seller' : '/admin'} replace />;
  }

  if (!token) {
    return <Navigate to="/seller/forgot-password" replace />;
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
      const { data } = await authService.resetPassword(token, password);
      toast.success(data.message || 'Password updated');
      navigate('/seller/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SellerAuthShell
      title="Set new password"
      subtitle={
        email
          ? `Choose a new password for ${email}`
          : 'Choose a new password for your seller account'
      }
      footer={
        <SellerAuthFooter>
          <SellerBackLink to="/seller/login" label="← Back to Seller Login" />
        </SellerAuthFooter>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="text-slate-600 font-medium">New password</span>
          <div className="relative mt-1.5">
            <input
              required
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={6}
              className={`${sellerInputCls} mt-0 pr-12`}
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
          <span className="text-slate-600 font-medium">Confirm password</span>
          <input
            required
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={6}
            className={sellerInputCls}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-base sm:text-sm disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Update password'}
        </button>
        <p className="text-xs text-slate-400 text-center">
          Or{' '}
          <Link to="/seller/forgot-password" className="text-teal-700 font-semibold">
            request a new reset link
          </Link>
        </p>
      </form>
    </SellerAuthShell>
  );
};

export default SellerResetPassword;
