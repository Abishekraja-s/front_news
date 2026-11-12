import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { marketplaceService, pageContentService } from '../services/articleService';
import NewsImage from '../components/NewsImage';

const DEFAULT_ENQUIRY_AGREE =
  'By submitting this enquiry, you agree that your submitted contact details and message may be shared with the relevant seller for the purpose of responding to your enquiry, in accordance with our Privacy Policy.';

const MarketplaceDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [agreeText, setAgreeText] = useState(DEFAULT_ENQUIRY_AGREE);
  const [form, setForm] = useState({ buyerName: '', buyerEmail: '', buyerPhone: '', message: '' });

  useEffect(() => {
    setLoading(true);
    marketplaceService
      .getProduct(id)
      .then(({ data }) => setProduct(data.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    pageContentService
      .getPublicLegal('marketplace-disclaimer')
      .then(({ data }) => {
        const text =
          data.data?.content?.enquiryAgreementText?.trim() ||
          data.data?.content?.agreementCheckboxText?.trim();
        if (text) setAgreeText(text);
      })
      .catch(() => {});
  }, []);

  const handleEnquiry = async (e) => {
    e.preventDefault();
    const name = form.buyerName.trim();
    const email = form.buyerEmail.trim();
    const phone = form.buyerPhone.replace(/\D/g, '');
    const message = form.message.trim();

    if (!name || !email || !phone || !message) {
      toast.error('All fields are required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid email');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    if (!agreed) {
      toast.error('Please agree to the Marketplace notice to continue');
      return;
    }

    setSending(true);
    try {
      await marketplaceService.sendEnquiry(id, {
        buyerName: name,
        buyerEmail: email,
        buyerPhone: phone,
        message,
      });
      toast.success('Enquiry sent to the seller');
      setForm({ buyerName: '', buyerEmail: '', buyerPhone: '', message: '' });
      setAgreed(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send enquiry');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="container-news py-12">
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-news py-12 text-center">
        <h1 className="text-xl font-bold">Product not found</h1>
        <Link to="/marketplace" className="text-teal-700 text-sm mt-3 inline-block">← Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="container-news py-8">
      <Helmet>
        <title>{product.title} | Marketplace</title>
      </Helmet>
      <Link to="/marketplace" className="text-sm text-teal-700 font-medium">← All listings</Link>
      <div className="mt-4 grid lg:grid-cols-2 gap-8">
        <NewsImage src={product.image} seed={product._id} alt={product.title} className="w-full rounded-2xl object-cover aspect-[4/3]" />
        <div>
          <p className="text-xs font-semibold uppercase text-teal-700">{product.category}</p>
          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-slate-900 mt-1">{product.title}</h1>
          <p className="text-2xl font-bold text-teal-700 mt-3">₹{Number(product.price).toLocaleString('en-IN')}</p>
          <p className="text-sm text-slate-500 mt-1">{product.location} · {product.condition?.replace('_', ' ')}</p>
          {product.description && (
            <p className="text-slate-700 mt-4 whitespace-pre-wrap leading-relaxed">{product.description}</p>
          )}
          <div className="mt-4 p-4 rounded-2xl bg-stone-100 text-sm">
            <p className="font-semibold text-slate-900">Seller</p>
            <p className="text-slate-600">{product.seller?.businessName || product.seller?.name}</p>
            {product.seller?.city && <p className="text-slate-500 text-xs">{product.seller.city}</p>}
          </div>

          <form onSubmit={handleEnquiry} className="mt-6 bg-white border border-stone-200 rounded-2xl p-5 space-y-3 shadow-sm" noValidate>
            <h2 className="font-bold text-slate-900">Send enquiry to seller</h2>
            <p className="text-xs text-slate-500">Your message goes directly to the seller’s dashboard.</p>
            <input
              required
              placeholder="Your name *"
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              value={form.buyerName}
              onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
            />
            <input
              required
              type="email"
              placeholder="Email *"
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              value={form.buyerEmail}
              onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })}
            />
            <input
              required
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              placeholder="Phone number *"
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              value={form.buyerPhone}
              onChange={(e) =>
                setForm({ ...form, buyerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })
              }
            />
            <textarea
              required
              rows={4}
              placeholder="Message *"
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
            <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
              />
              <span className="leading-relaxed">
                <span className="text-red-500 font-semibold mr-0.5">*</span>
                {agreeText}{' '}
                <Link
                  to="/marketplace-disclaimer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 font-semibold underline underline-offset-2 hover:text-teal-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  Read full notice
                </Link>
              </span>
            </label>
            <button type="submit" disabled={sending || !agreed} className="btn-primary w-full disabled:opacity-50">
              {sending ? 'Sending…' : 'Send enquiry'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceDetail;
