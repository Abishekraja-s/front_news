import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const inputCls = 'mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5';

const MatrimonyForgotPassword = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'MATRIMONY' ? '/matrimony/member' : '/admin'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.forgotPassword(email, 'matrimony');
      setSent(true);
      toast.success(data.message || 'Reset link sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-stone-200 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 font-headline">Forgot password</h1>
        <p className="text-sm text-slate-500 mt-1">
          Enter your matrimony account email. We will send a reset link if the account exists.
        </p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              If a matrimony account exists for <strong className="font-semibold">{email}</strong>, a reset
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
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="text-slate-600">Email</span>
              <input
                required
                type="email"
                autoComplete="email"
                inputMode="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="text-sm text-slate-500 mt-4 text-center">
          Remembered it?{' '}
          <Link to="/matrimony/login" className="text-teal-700 font-semibold">
            Sign in
          </Link>
        </p>
        <p className="text-xs text-center mt-3">
          <Link to="/matrimony/login" className="text-slate-400 hover:text-slate-600">
            ← Back to Matrimony Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default MatrimonyForgotPassword;
