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
  const { user, registerSeller } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'SELLER' ? '/seller' : '/admin'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerSeller(form);
      toast.success('Account created — submit products for admin approval');
      navigate('/seller');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SellerAuthShell
      title="Seller Registration"
      subtitle="Create an account to list products on The Great India News Marketplace"
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
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <button
          type="submit"
          disabled={loading}
          className="btn-primary sm:col-span-2 w-full py-3 text-base sm:text-sm disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create seller account'}
        </button>
      </form>
    </SellerAuthShell>
  );
};

export default SellerRegister;
