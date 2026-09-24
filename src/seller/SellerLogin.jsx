import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  SellerAuthShell,
  SellerAuthFooter,
  SellerBackLink,
  sellerInputCls,
} from './SellerAuthShell';

const SellerLogin = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'SELLER' ? '/seller' : '/admin'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.user?.role !== 'SELLER') {
        await logout();
        toast.error('This login is for sellers only. Use Admin login for staff.');
        navigate('/admin/login');
        return;
      }
      toast.success('Welcome back');
      navigate('/seller');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SellerAuthShell
      title="Seller Login"
      subtitle="Manage your Marketplace listings and enquiries"
      footer={
        <SellerAuthFooter>
          <p className="text-sm text-slate-500">
            New seller?{' '}
            <Link to="/seller/register" className="text-teal-700 font-semibold">
              Register
            </Link>
          </p>
          <SellerBackLink />
        </SellerAuthFooter>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="text-slate-600 font-medium">Email</span>
          <input
            required
            type="email"
            autoComplete="email"
            inputMode="email"
            className={sellerInputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-600 font-medium">Password</span>
          <div className="relative mt-1.5">
            <input
              required
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`${sellerInputCls} mt-0 pr-12`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 px-2 py-1.5 rounded-lg hover:bg-stone-100"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="mt-2 flex justify-end">
            <Link
              to="/seller/forgot-password"
              className="text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Forgot password?
            </Link>
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-base sm:text-sm disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </SellerAuthShell>
  );
};

export default SellerLogin;
