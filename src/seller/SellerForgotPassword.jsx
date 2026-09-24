import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import {
  SellerAuthShell,
  SellerAuthFooter,
  SellerBackLink,
  sellerInputCls,
} from './SellerAuthShell';

const SellerForgotPassword = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'SELLER' ? '/seller' : '/admin'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.forgotPassword(email);
      setSent(true);
      toast.success(data.message || 'Reset link sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SellerAuthShell
      title="Forgot password"
      subtitle="Enter your seller account email. We will send a reset link if the account exists."
      footer={
        <SellerAuthFooter>
          <p className="text-sm text-slate-500">
            Remembered it?{' '}
            <Link to="/seller/login" className="text-teal-700 font-semibold">
              Sign in
            </Link>
          </p>
          <SellerBackLink to="/seller/login" label="← Back to Seller Login" />
        </SellerAuthFooter>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder.
        </div>
      ) : (
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
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base sm:text-sm disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </SellerAuthShell>
  );
};

export default SellerForgotPassword;
