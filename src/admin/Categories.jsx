import { useEffect, useState, useMemo, useCallback } from 'react';
import { categoryService } from '../services/articleService';
import toast from 'react-hot-toast';
import AdminPageHeader from './AdminPageHeader';
import DataTable from './DataTable';

const emptyForm = {
  name: '',
  nameTamil: '',
  slug: '',
  order: 0,
  status: 'active',
  showInHeader: true,
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchCategories = () => {
    setLoading(true);
    categoryService.getAll()
      .then(({ data }) => setCategories(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        order: parseInt(form.order, 10) || 0,
        showInHeader: Boolean(form.showInHeader),
      };
      if (editId) {
        await categoryService.update(editId, payload);
        toast.success('Category updated');
      } else {
        await categoryService.create(payload);
        toast.success('Category created');
      }
      resetForm();
      fetchCategories();
    } catch {
      toast.error('Failed to save');
    }
  };

  const handleEdit = (cat) => {
    setForm({
      name: cat.name,
      nameTamil: cat.nameTamil,
      slug: cat.slug,
      order: cat.order,
      status: cat.status,
      showInHeader: cat.showInHeader !== false,
    });
    setEditId(cat._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete category?')) return;
    try {
      await categoryService.delete(id);
      toast.success('Deleted');
      fetchCategories();
    } catch {
      toast.error('Delete failed');
    }
  };

  const toggleHeader = useCallback(async (row) => {
    const next = row.showInHeader === false;
    setTogglingId(row._id);
    try {
      await categoryService.update(row._id, { showInHeader: next });
      setCategories((prev) =>
        prev.map((c) => (c._id === row._id ? { ...c, showInHeader: next } : c))
      );
      toast.success(next ? 'Visible in header' : 'Hidden from header');
    } catch {
      toast.error('Update failed');
    } finally {
      setTogglingId(null);
    }
  }, []);

  const columns = useMemo(() => [
    { key: 'nameTamil', header: 'Tamil Name', sortable: true, render: (row) => <span className="font-medium text-slate-900">{row.nameTamil}</span> },
    { key: 'name', header: 'English', sortable: true },
    { key: 'slug', header: 'Slug', sortable: true, render: (row) => <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{row.slug}</code> },
    { key: 'order', header: 'Order', sortable: true, sortValue: (row) => row.order || 0 },
    {
      key: 'showInHeader',
      header: 'Header',
      sortable: true,
      sortValue: (row) => (row.showInHeader === false ? 0 : 1),
      render: (row) => {
        const visible = row.showInHeader !== false;
        return (
          <button
            type="button"
            onClick={() => toggleHeader(row)}
            disabled={togglingId === row._id}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors disabled:opacity-50 ${
              visible
                ? 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title={visible ? 'Click to hide from header' : 'Click to show in header'}
          >
            {visible ? 'Visible in header' : 'Not visible in header'}
          </button>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="data-table-actions">
          <button type="button" onClick={() => handleEdit(row)} className="data-table-action data-table-action-edit">Edit</button>
          <button type="button" onClick={() => handleDelete(row._id)} className="data-table-action data-table-action-delete">Delete</button>
        </div>
      ),
    },
  ], [toggleHeader, togglingId]);

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        subtitle="Manage news categories"
        actionLabel={showForm ? undefined : '+ Add Category'}
        onAction={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-card mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">{editId ? 'Edit Category' : 'New Category'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input placeholder="Name (English)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="admin-input" />
            <input placeholder="Name (Tamil)" value={form.nameTamil} onChange={(e) => setForm({ ...form, nameTamil: e.target.value })} required className="admin-input" />
            <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="admin-input" />
            <input type="number" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className="admin-input" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Header visibility</label>
              <select
                value={form.showInHeader ? 'yes' : 'no'}
                onChange={(e) => setForm({ ...form, showInHeader: e.target.value === 'yes' })}
                className="admin-input"
              >
                <option value="yes">Visible in header</option>
                <option value="no">Not visible in header</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="admin-input"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button type="submit" className="btn-primary text-sm">Save</button>
            <button type="button" onClick={resetForm} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
      )}

      <DataTable
        columns={columns}
        data={categories}
        loading={loading}
        searchPlaceholder="Search categories..."
        searchKeys={['name', 'nameTamil', 'slug']}
        emptyMessage="No categories found"
      />
    </div>
  );
};

export default Categories;
