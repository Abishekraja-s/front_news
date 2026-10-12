import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { matrimonyService } from '../services/articleService';
import {
  emptyMatrimonyForm,
  MatrimonyProfileFields,
  buildProfilePayload,
  validateMatrimonyProfileForm,
  Section,
  Field,
  inputCls,
} from './matrimonyFormShared';

const emptyAccount = () => ({ name: '', email: '', password: '', phone: '', city: '' });

const MatrimonyRegister = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState(emptyAccount());
  const [form, setForm] = useState(emptyMatrimonyForm());
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [step, setStep] = useState('form');
  const [otp, setOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [done, setDone] = useState(null);

  if (user && !done) {
    return <Navigate to={user.role === 'MATRIMONY' ? '/matrimony/member' : '/admin'} replace />;
  }

  useEffect(() => {
    matrimonyService
      .getPublicCategories()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const queueFile = (file, target) => {
    if (!file) return;
    setPendingUploads((p) => [...p, { file, target }]);
    const preview = URL.createObjectURL(file);
    if (target === 'profilePhoto') set('profilePhoto', preview);
    else if (target === 'horoscope') set('horoscopeUrl', preview);
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) queueFile(file, 'profilePhoto');
    e.target.value = '';
  };

  const handleHoroscope = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      queueFile(file, 'horoscope');
      set('horoscopeFileName', file.name);
      set('horoscopeMime', file.type);
    }
    e.target.value = '';
  };

  const handleGalleryPhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const index = (form.photos || []).length;
      setPendingUploads((p) => [...p, { file, target: 'gallery', index }]);
      setForm((f) => ({ ...f, photos: [...(f.photos || []), URL.createObjectURL(file)] }));
    }
    e.target.value = '';
  };

  const handleRemoveGalleryPhoto = (index) => {
    setForm((f) => ({
      ...f,
      photos: (f.photos || []).filter((_, i) => i !== index),
    }));
    setPendingUploads((p) => p.filter((item) => !(item.target === 'gallery' && item.index === index)));
  };

  const handleAddGalleryPhotoUrl = (url) => {
    const trimmed = String(url || '').trim();
    if (!trimmed) return;
    setForm((f) => ({ ...f, photos: [...(f.photos || []), trimmed] }));
  };

  const uploadPendingFiles = async () => {
    let profilePhoto = form.profilePhoto?.startsWith('blob:') ? '' : (form.profilePhoto || '');
    let horoscopeUrl = form.horoscopeUrl?.startsWith('blob:') ? '' : (form.horoscopeUrl || '');
    const photos = (form.photos || []).filter((u) => !String(u).startsWith('blob:'));

    for (const item of pendingUploads) {
      const fd = new FormData();
      fd.append('file', item.file);
      const { data } = item.target === 'horoscope'
        ? await matrimonyService.uploadRegisterDocument(fd)
        : await matrimonyService.uploadRegisterPhoto(fd);
      const url = data.data?.url;
      if (!url) continue;

      if (item.target === 'profilePhoto') profilePhoto = url;
      else if (item.target === 'horoscope') horoscopeUrl = url;
      else if (item.target === 'gallery') photos.push(url);
    }

    return { profilePhoto, horoscopeUrl, photos };
  };

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

  const sendOtp = async () => {
    const name = account.name.trim() || form.fullName.trim() || account.email.trim().split('@')[0];
    const uploads = await uploadPendingFiles();
    const profile = buildProfilePayload({
      ...form,
      ...uploads,
      fullName: form.fullName || name,
      mobile: form.mobile || account.phone,
      email: form.email || account.email,
      city: form.city || account.city,
    });
    const { data } = await matrimonyService.sendRegisterOtp({
      name,
      email: account.email.trim(),
      password: account.password,
      phone: account.phone,
      city: account.city,
      profile,
    });
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account.email.trim() || !account.password) {
      toast.error('Email and password are required');
      return;
    }
    if (account.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!account.name.trim()) {
      toast.error('Your name is required');
      return;
    }
    if (!account.phone.trim()) {
      toast.error('Mobile number is required');
      return;
    }
    if (!/^\d{10}$/.test(account.phone.replace(/\D/g, ''))) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    if (!account.city.trim()) {
      toast.error('City is required');
      return;
    }
    const profileErr = validateMatrimonyProfileForm(form);
    if (profileErr) {
      toast.error(profileErr);
      return;
    }

    setLoading(true);
    try {
      const data = await sendOtp();
      toast.success(data.message || 'OTP sent to your email');
      setStep('otp');
      setOtp('');
      startResendTimer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send OTP. Nothing was saved.');
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
      const { data } = await matrimonyService.verifyRegisterOtp({
        email: account.email.trim(),
        otp: code,
      });
      setDone({
        email: account.email.trim(),
        message: data.message || 'Registration successful. Please sign in.',
        emailSent: true,
        profileId: data.data?.profileId,
      });
      toast.success(data.message || 'OTP verified. Profile saved.');
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
      const data = await sendOtp();
      toast.success(data.message || 'New OTP sent');
      startResendTimer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend OTP');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4 py-8 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-stone-200 p-5 sm:p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl font-bold">✓</div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-headline mt-4">Registration successful</h1>
          <p className="text-sm text-slate-600 mt-2 break-words">{done.message}</p>
          {done.profileId && (
            <p className="text-sm text-slate-500 mt-2">
              Profile ID: <span className="font-semibold text-slate-800">{done.profileId}</span>
            </p>
          )}
          <p className="text-sm text-slate-600 mt-3 break-words">
            Sign in with <span className="font-medium break-all">{done.email}</span> and your password.
          </p>
          <button
            type="button"
            className="btn-primary w-full mt-6 py-3"
            onClick={() =>
              navigate('/matrimony/login', {
                replace: true,
                state: { registeredEmail: done.email, successMessage: 'Registration complete. Please sign in.' },
              })
            }
          >
            Continue to login
          </button>
          <p className="text-xs text-center mt-4">
            <Link to="/matrimony" className="text-slate-400 hover:text-slate-600">← Back to Matrimony</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 px-3 py-5 sm:px-4 sm:py-8">
      <div className="w-full max-w-5xl mx-auto">
        <div className="mb-5 sm:mb-6">
          <Link to="/matrimony" className="text-sm text-teal-700 font-semibold hover:underline">← Back to Matrimony</Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 font-headline mt-2 sm:mt-3">Matrimony Registration</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Fill every field, then we email an OTP. Your profile is stored only after the OTP is correct.
          </p>
        </div>

        {step === 'otp' ? (
          <div className="flex justify-center">
            <form
              onSubmit={handleVerifyOtp}
              className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-4"
            >
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Enter OTP</h2>
              <p className="text-sm text-slate-600 break-words">
                We sent a 6-digit code to <strong className="break-all">{account.email}</strong>. Verify it to save your profile.
              </p>
              <label className="block text-sm">
                <span className="text-slate-600 font-medium">OTP</span>
                <input
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className={`${inputCls} tracking-[0.4em] text-center text-xl sm:text-2xl font-semibold mt-1 h-12 sm:h-14`}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                />
              </label>
              <button
                type="submit"
                disabled={loading || otp.replace(/\D/g, '').length !== 6}
                className="btn-primary w-full py-3 text-sm sm:text-base disabled:opacity-50"
              >
                {loading ? 'Verifying…' : 'Verify OTP & save profile'}
              </button>
              <div className="flex flex-col-reverse xs:flex-row sm:flex-row items-stretch sm:items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  className="text-slate-500 font-medium text-left sm:text-right order-2 sm:order-2"
                  disabled={loading}
                  onClick={() => {
                    setStep('form');
                    setOtp('');
                  }}
                >
                  ← Edit details
                </button>
                <button
                  type="button"
                  className="text-teal-700 font-semibold disabled:opacity-40 text-left order-1 sm:order-1"
                  disabled={loading || resendIn > 0}
                  onClick={handleResend}
                >
                  {resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-1 pb-28 sm:pb-24">
          <Section title="Account Login Details">
            <Field label="Your Name" required>
              <input
                required
                className={inputCls}
                value={account.name}
                onChange={(e) => setAccount({ ...account, name: e.target.value })}
              />
            </Field>
            <Field label="Login Email" required>
              <input
                required
                type="email"
                autoComplete="email"
                className={inputCls}
                value={account.email}
                onChange={(e) => {
                  setAccount({ ...account, email: e.target.value });
                  if (!form.email) set('email', e.target.value);
                }}
              />
            </Field>
            <Field label="Password (min 6)" required>
              <input
                required
                type="password"
                autoComplete="new-password"
                minLength={6}
                className={inputCls}
                value={account.password}
                onChange={(e) => setAccount({ ...account, password: e.target.value })}
              />
            </Field>
            <Field label="Mobile Number" required>
              <input
                required
                className={inputCls}
                inputMode="numeric"
                maxLength={10}
                value={account.phone}
                onChange={(e) => {
                  const phone = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setAccount({ ...account, phone });
                  if (!form.mobile) set('mobile', phone);
                }}
              />
            </Field>
            <Field label="City" required>
              <input
                required
                className={inputCls}
                value={account.city}
                onChange={(e) => {
                  setAccount({ ...account, city: e.target.value });
                  if (!form.city) set('city', e.target.value);
                }}
              />
            </Field>
          </Section>

          <MatrimonyProfileFields
            form={form}
            set={set}
            categories={categories}
            uploading={loading}
            onPhoto={handlePhoto}
            onHoroscope={handleHoroscope}
            onGalleryPhoto={handleGalleryPhoto}
            onRemoveGalleryPhoto={handleRemoveGalleryPhoto}
            onAddGalleryPhotoUrl={handleAddGalleryPhotoUrl}
            requireAllFields
          />

          <div className="fixed sm:sticky bottom-0 inset-x-0 sm:inset-x-auto bg-stone-100/95 backdrop-blur border-t border-slate-200 py-3 px-3 sm:px-0 z-20">
            <div className="max-w-5xl mx-auto flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Link to="/matrimony/login" className="btn-secondary text-sm py-3 sm:py-2.5 px-4 w-full sm:w-auto text-center">
                Already registered?
              </Link>
              <button type="submit" disabled={loading} className="btn-primary text-sm py-3 sm:py-2.5 px-5 w-full sm:w-auto disabled:opacity-50">
                {loading ? 'Sending OTP…' : 'Register & Submit Profile'}
              </button>
            </div>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default MatrimonyRegister;
