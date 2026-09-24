import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { marketplaceService } from '../services/articleService';
import ImageUploadField from '../components/ImageUploadField';

const empty = {
  title: '',
  description: '',
  price: '',
  location: '',
  image: '',
  category: '',
  condition: 'used',
};

const SellerProductForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    marketplaceService
      .getCategories()
      .then(({ data }) => {
        const list = data.data || [];
        setCategories(list);
        setForm((prev) => {
          if (prev.category) return prev;
          return { ...prev, category: list[0]?.name || '' };
        });
      })
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    marketplaceService
      .getMyProducts()
      .then(({ data }) => {
        const p = (data.data || []).find((x) => x._id === id);
        if (!p) {
          toast.error('Product not found');
          navigate('/seller/products');
          return;
        }
        setForm({
          title: p.title || '',
          description: p.description || '',
          price: p.price ?? '',
          location: p.location || '',
          image: p.image || '',
          category: p.category || '',
          condition: p.condition || 'used',
        });
      })
      .catch(() => toast.error('Failed to load'));
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) {
      toast.error('Please select a category');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, price: Number(form.price) };
      if (isEdit) {
        await marketplaceService.updateProduct(id, payload);
        toast.success('Product updated');
      } else {
        await marketplaceService.createProduct(payload);
        toast.success('Product listed on marketplace');
      }
      navigate('/seller/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = (() => {
    const names = categories.map((c) => c.name);
    if (form.category && !names.includes(form.category)) {
      return [...categories, { _id: 'legacy', name: form.category }];
    }
    return categories;
  })();

  return (
    <div className="max-w-2xl">
      <Link to="/seller/products" className="text-sm text-teal-700 font-medium">← My Products</Link>
      <h1 className="text-2xl font-bold text-slate-900 mt-2">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
      <p className="text-sm text-slate-500 mb-6">Your listing goes live on the marketplace as soon as you save.</p>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-4">
        <label className="block text-sm">
          <span className="text-slate-600">Title</span>
          <input required className="mt-1 w-full border rounded-xl px-3 py-2.5" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Description</span>
          <textarea rows={4} className="mt-1 w-full border rounded-xl px-3 py-2.5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-slate-600">Price (₹)</span>
            <input required type="number" min="0" step="1" className="mt-1 w-full border rounded-xl px-3 py-2.5" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Location</span>
            <input className="mt-1 w-full border rounded-xl px-3 py-2.5" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Category</span>
            <select
              required
              className="mt-1 w-full border rounded-xl px-3 py-2.5 bg-white"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Select category</option>
              {categoryOptions.map((c) => (
                <option key={c._id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Condition</span>
            <select className="mt-1 w-full border rounded-xl px-3 py-2.5" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
              {['new', 'like_new', 'good', 'fair', 'used'].map((c) => (
                <option key={c} value={c}>{c.replace('_', ' ')}</option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <span className="text-sm text-slate-600">Product image</span>
          <div className="mt-1">
            <ImageUploadField
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
              placeholder="https://…"
              inputClassName="w-full border rounded-xl px-3 py-2.5"
              seed={id || 'product'}
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving…' : isEdit ? 'Save changes' : 'Submit for review'}</button>
          <Link to="/seller/products" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
};

export default SellerProductForm;
