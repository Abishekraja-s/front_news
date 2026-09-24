import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { marketplaceService } from '../services/articleService';
import AdminPageHeader from './AdminPageHeader';
import DataTable from './DataTable';
import NewsImage from '../components/NewsImage';

const AdminMarketplace = () => {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadProducts = () => {
    setLoading(true);
    const params = filter ? { status: filter } : {};
    marketplaceService
      .getAdminProducts(params)
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  const loadEnquiries = () => {
    setLoading(true);
    marketplaceService
      .getAdminEnquiries()
      .then(({ data }) => setEnquiries(data.data || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  const loadCategories = () => {
    setLoading(true);
    marketplaceService
      .getAdminCategories()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === 'products') loadProducts();
    else if (tab === 'enquiries') loadEnquiries();
    else loadCategories();
  }, [tab, filter]);

  const review = async (id, status) => {
    let rejectionReason = '';
    if (status === 'REJECTED') {
      rejectionReason = prompt('Rejection reason (shown to seller):') || 'Does not meet guidelines';
    }
    try {
      await marketplaceService.reviewProduct(id, { status, rejectionReason });
      toast.success(`Product ${status.toLowerCase()}`);
      loadProducts();
    } catch {
      toast.error('Review failed');
    }
  };

  const removeProduct = async (row) => {
    if (!row?._id) return;
    if (!confirm(`Permanently delete "${row.title}"? This cannot be undone.`)) return;
    setDeletingId(row._id);
    try {
      await marketplaceService.deleteAdminProduct(row._id);
      toast.success('Product deleted');
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteByDate = async () => {
    if (!dateFrom && !dateTo) {
      return toast.error('Pick a from and/or to date');
    }
    try {
      setBulkBusy(true);
      const preview = await marketplaceService.deleteAdminProductsByDate({
        from: dateFrom || undefined,
        to: dateTo || undefined,
        status: filter || undefined,
        dryRun: true,
      });
      const count = preview.data?.data?.count ?? 0;
      if (!count) {
        toast.error('No products match that date range');
        return;
      }
      const rangeLabel = [dateFrom || '…', dateTo || '…'].join(' → ');
      const statusLabel = filter ? ` (${filter})` : '';
      if (
        !confirm(
          `Permanently delete ${count} product(s) created ${rangeLabel}${statusLabel}? This cannot be undone.`
        )
      ) {
        return;
      }
      const { data } = await marketplaceService.deleteAdminProductsByDate({
        from: dateFrom || undefined,
        to: dateTo || undefined,
        status: filter || undefined,
        dryRun: false,
      });
      toast.success(data.message || 'Deleted');
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete by date failed');
    } finally {
      setBulkBusy(false);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    setSavingCategory(true);
    try {
      await marketplaceService.createCategory({ name, isActive: true });
      toast.success('Category added');
      setNewCategory('');
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add category');
    } finally {
      setSavingCategory(false);
    }
  };

  const toggleCategory = async (row) => {
    try {
      await marketplaceService.updateCategory(row._id, { isActive: !row.isActive });
      toast.success(row.isActive ? 'Category hidden' : 'Category activated');
      loadCategories();
    } catch {
      toast.error('Update failed');
    }
  };

  const renameCategory = async (row) => {
    const name = prompt('Category name:', row.name);
    if (!name || !name.trim() || name.trim() === row.name) return;
    try {
      await marketplaceService.updateCategory(row._id, { name: name.trim() });
      toast.success('Category updated');
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const removeCategory = async (row) => {
    if (!confirm(`Delete category "${row.name}"?`)) return;
    try {
      await marketplaceService.deleteCategory(row._id);
      toast.success('Category deleted');
      loadCategories();
    } catch {
      toast.error('Delete failed');
    }
  };

  const productColumns = [
    {
      key: 'title',
      header: 'Product',
      sortable: true,
      render: (row) => (
        <div className="flex gap-3 items-center">
          <NewsImage src={row.image} seed={row._id} alt="" className="w-12 h-10 rounded-lg object-cover" />
          <div>
            <p className="font-medium text-slate-900">{row.title}</p>
            <p className="text-xs text-slate-500">₹{Number(row.price).toLocaleString('en-IN')} · {row.location}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (row) => <span className="text-sm">{row.category || '—'}</span>,
    },
    {
      key: 'seller',
      header: 'Seller',
      render: (row) => (
        <div className="text-sm">
          <p className="font-medium">{row.seller?.name}</p>
          <p className="text-xs text-slate-500">{row.seller?.email}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-bold uppercase">{row.status}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      render: (row) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN') : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="data-table-actions">
          {row.status === 'PENDING' && (
            <>
              <button type="button" className="data-table-action data-table-action-edit" onClick={() => review(row._id, 'APPROVED')}>
                Approve
              </button>
              <button type="button" className="data-table-action data-table-action-delete" onClick={() => review(row._id, 'REJECTED')}>
                Reject
              </button>
            </>
          )}
          {row.status === 'APPROVED' && (
            <button type="button" className="data-table-action data-table-action-secondary" onClick={() => review(row._id, 'INACTIVE')}>
              Unlist
            </button>
          )}
          {row.status === 'INACTIVE' && (
            <button type="button" className="data-table-action data-table-action-edit" onClick={() => review(row._id, 'APPROVED')}>
              Relist
            </button>
          )}
          <button
            type="button"
            className="data-table-action data-table-action-delete disabled:opacity-50"
            disabled={deletingId === row._id}
            onClick={() => removeProduct(row)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const enquiryColumns = [
    { key: 'buyerName', header: 'Buyer', sortable: true, render: (row) => (
      <div>
        <p className="font-medium">{row.buyerName}</p>
        <p className="text-xs text-slate-500">{row.buyerEmail}</p>
      </div>
    )},
    {
      key: 'buyerPhone',
      header: 'Mobile',
      sortable: true,
      render: (row) => {
        const phone = String(row.buyerPhone || '').replace(/\D/g, '');
        return <span className="text-sm text-slate-700 whitespace-nowrap tabular-nums">{phone || '—'}</span>;
      },
    },
    { key: 'product', header: 'Product', render: (row) => row.product?.title || '—' },
    { key: 'seller', header: 'Seller', render: (row) => row.seller?.name || '—' },
    { key: 'status', header: 'Status', sortable: true },
    { key: 'message', header: 'Message', render: (row) => <span className="text-sm line-clamp-2">{row.message}</span> },
  ];

  const categoryColumns = [
    { key: 'name', header: 'Category', sortable: true },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <span className={`text-xs font-bold uppercase ${row.isActive ? 'text-teal-700' : 'text-slate-400'}`}>
          {row.isActive ? 'Active' : 'Hidden'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="data-table-actions">
          <button type="button" className="data-table-action data-table-action-edit" onClick={() => renameCategory(row)}>
            Edit
          </button>
          <button type="button" className="data-table-action data-table-action-secondary" onClick={() => toggleCategory(row)}>
            {row.isActive ? 'Hide' : 'Show'}
          </button>
          <button type="button" className="data-table-action data-table-action-delete" onClick={() => removeCategory(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Marketplace"
        subtitle="Review seller products, manage categories, and monitor enquiries"
      />
      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" onClick={() => setTab('products')} className={tab === 'products' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>
          Products
        </button>
        <button type="button" onClick={() => setTab('categories')} className={tab === 'categories' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>
          Categories
        </button>
        <button type="button" onClick={() => setTab('enquiries')} className={tab === 'enquiries' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>
          Enquiries
        </button>
        {tab === 'products' && (
          <select className="border rounded-xl px-3 py-2 text-sm ml-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All statuses</option>
            {['PENDING', 'APPROVED', 'REJECTED', 'SOLD', 'INACTIVE'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      {tab === 'categories' && (
        <form onSubmit={addCategory} className="mb-4 flex flex-wrap gap-2 items-end">
          <label className="text-sm flex-1 min-w-[200px]">
            <span className="text-slate-600">New category</span>
            <input
              className="mt-1 w-full border rounded-xl px-3 py-2.5"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g. Electronics"
            />
          </label>
          <button type="submit" disabled={savingCategory || !newCategory.trim()} className="btn-primary text-sm">
            {savingCategory ? 'Adding…' : 'Add category'}
          </button>
        </form>
      )}

      {tab === 'products' && (
        <div className="mb-4 p-3 rounded-xl border border-stone-200 bg-white flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Created from</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-stone-200 rounded-xl px-3 py-2 text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Created to</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-stone-200 rounded-xl px-3 py-2 text-sm bg-white"
            />
          </div>
          <button
            type="button"
            onClick={handleDeleteByDate}
            disabled={bulkBusy || (!dateFrom && !dateTo)}
            className="text-sm font-semibold px-3 py-2 rounded-xl border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-50"
          >
            {bulkBusy ? 'Deleting…' : 'Delete by date'}
          </button>
          <p className="text-xs text-slate-500 w-full sm:w-auto sm:ml-2">
            Deletes all products created in this range. Uses the status filter above when set.
          </p>
        </div>
      )}

      {tab === 'products' && (
        <DataTable columns={productColumns} data={products} loading={loading} emptyMessage="No products" searchPlaceholder="Search products..." />
      )}
      {tab === 'enquiries' && (
        <DataTable columns={enquiryColumns} data={enquiries} loading={loading} emptyMessage="No enquiries" searchPlaceholder="Search enquiries..." />
      )}
      {tab === 'categories' && (
        <DataTable columns={categoryColumns} data={categories} loading={loading} emptyMessage="No categories" searchPlaceholder="Search categories..." />
      )}
    </div>
  );
};

export default AdminMarketplace;
