import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { marketplaceService } from '../services/articleService';
import NewsImage from '../components/NewsImage';

const Marketplace = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (query = q, cat = category) => {
    setLoading(true);
    marketplaceService
      .getProducts({
        q: query.trim() || undefined,
        category: cat || undefined,
        limit: 24,
      })
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    marketplaceService
      .getCategories()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => setCategories([]));
    load('', '');
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(q, category);
  };

  const handleCategoryChange = (e) => {
    const next = e.target.value;
    setCategory(next);
    load(q, next);
  };

  return (
    <div className="min-h-[50vh]">
      <Helmet>
        <title>Marketplace | The Great India News</title>
        <meta name="description" content="Buy and sell locally — browse Marketplace listings." />
      </Helmet>

      <div className="border-b border-stone-200 bg-white/70">
        <div className="container-news py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-teal-700">சந்தை</p>
              <h1 className="text-3xl font-headline font-bold text-slate-900 mt-1">Marketplace</h1>
              <p className="text-sm text-slate-600 mt-2 max-w-xl">
                Browse local seller listings. Send a direct enquiry to the seller for any product.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/seller/register" className="btn-primary text-sm">Sell on Marketplace</Link>
              <Link to="/seller/login" className="btn-secondary text-sm">Seller Login</Link>
            </div>
          </div>
          <form onSubmit={handleSearch} className="mt-6 flex flex-wrap gap-2 max-w-3xl">
            <select
              value={category}
              onChange={handleCategoryChange}
              className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white min-w-[160px]"
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              className="flex-1 min-w-[180px] border border-stone-200 rounded-xl px-4 py-2.5 text-sm bg-white"
            />
            <button type="submit" className="btn-primary text-sm">Search</button>
          </form>
        </div>
      </div>

      <div className="container-news py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="skeleton h-64 rounded-2xl" />
            ))}
          </div>
        ) : !products.length ? (
          <div className="text-center py-16 text-slate-500">
            <p>{category || q.trim() ? 'No products match your filters.' : 'No approved products yet.'}</p>
            {!category && !q.trim() && (
              <Link to="/seller/register" className="text-teal-700 font-semibold mt-2 inline-block">Become a seller</Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {products.map((p) => (
              <Link
                key={p._id}
                to={`/marketplace/${p._id}`}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                <NewsImage src={p.image} seed={p._id} alt={p.title} className="w-full h-44 object-cover group-hover:scale-[1.02] transition-transform" />
                <div className="p-4">
                  <h2 className="font-semibold text-slate-900 line-clamp-2">{p.title}</h2>
                  <p className="text-lg font-bold text-teal-700 mt-1">₹{Number(p.price).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-slate-500 mt-1">{p.location || p.seller?.city}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
