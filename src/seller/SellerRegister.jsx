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

const empty = { name: '', email: '', password: '', phone: '', businessName: '', city: '' };

const SellerRegister = () => {
  const { user, sendSellerRegisterOtp, verifySellerRegisterOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // form | otp
  const [form, setForm] = useState(empty);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  if (user) {
    return <Navigate to={user.role === 'SELLER' ? '/seller' : '/admin'} replace />;
  }

  const startResendTimer = () => {
    setResendIn(60);
    const id = setInterval(() => {
      setResendIn((n) => {
        if (n <= 1) {
          clearInterval(id);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await sendSellerRegisterOtp(form);
      toast.success(data?.message || 'OTP sent to your email');
      setStep('otp');
      setOtp('');
      startResendTimer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = String(otp).replace(/\D/g, '');
    if (code.length !== 6) {
      toast.error('Enter the 6-digit OTP from your email');
      return;
    }
    setLoading(true);
    try {
      const data = await verifySellerRegisterOtp({ email: form.email, otp: code });
      toast.success(data?.message || 'Registration successful — you are signed in');
      navigate('/seller');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0 || loading) return;
    setLoading(true);
    try {
      const { data } = await sendSellerRegisterOtp(form);
      toast.success(data?.message || 'New OTP sent');
      startResendTimer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SellerAuthShell
      title={step === 'otp' ? 'Verify email OTP' : 'Seller Registration'}
      subtitle={
        step === 'otp'
          ? `Enter the 6-digit code sent to ${form.email}`
          : 'Create an account to list products on The Great India News Marketplace'
      }
      maxWidthClass="max-w-lg"
      footer={
        <SellerAuthFooter>
          <p className="text-sm text-slate-500">
            Already registered?{' '}
            <Link to="/seller/login" className="text-teal-700 font-semibold">
              Sign in
            </Link>
          </p>
          <SellerBackLink />
        </SellerAuthFooter>
      }
    >
      {step === 'form' ? (
        <form onSubmit={handleSendOtp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ['name', 'Full name', 'text', true],
            ['email', 'Email', 'email', true],
            ['password', 'Password (min 6)', 'password', true],
            ['phone', 'Phone', 'tel', false],
            ['businessName', 'Business / shop name', 'text', false],
            ['city', 'City', 'text', false],
          ].map(([key, label, type, required]) => (
            <label
              key={key}
              className={`block text-sm ${key === 'businessName' ? 'sm:col-span-2' : ''}`}
            >
              <span className="text-slate-600 font-medium">{label}</span>
              <input
                required={required}
                type={type}
                autoComplete={
                  key === 'email' ? 'email' : key === 'password' ? 'new-password' : key === 'name' ? 'name' : 'off'
                }
                className={sellerInputCls}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
          <p className="sm:col-span-2 text-xs text-slate-500">
            We will email a one-time password (OTP) to confirm your email before creating the account.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary sm:col-span-2 w-full py-3 text-base sm:text-sm disabled:opacity-50"
          >
            {loading ? 'Sending OTP…' : 'Send OTP to email'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <label className="block text-sm">
            <span className="text-slate-600 font-medium">Enter OTP</span>
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              className={`${sellerInputCls} tracking-[0.35em] text-center text-lg font-semibold`}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
            />
          </label>
          <button
            type="submit"
            disabled={loading || otp.replace(/\D/g, '').length !== 6}
            className="btn-primary w-full py-3 text-base sm:text-sm disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Verify OTP & create account'}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              className="text-teal-700 font-semibold disabled:opacity-40"
              disabled={loading || resendIn > 0}
              onClick={handleResend}
            >
              {resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
            </button>
            <button
              type="button"
              className="text-slate-500 font-medium"
              disabled={loading}
              onClick={() => {
                setStep('form');
                setOtp('');
              }}
            >
              ← Edit details
            </button>
          </div>
          <p className="text-xs text-slate-500">
            After verification you will be signed in automatically. Next time use{' '}
            <Link to="/seller/login" className="text-teal-700 font-semibold">
              Marketplace Login
            </Link>
            .
          </p>
        </form>
      )}
    </SellerAuthShell>
  );
};

export default SellerRegister;
