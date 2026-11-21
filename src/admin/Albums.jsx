import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { albumService } from '../services/articleService';
import { getImageUrl } from '../utils/images';
import AdminPageHeader, { StatusBadge } from './AdminPageHeader';
import DataTable from './DataTable';

const Albums = () => {
  const [albums, setAlbums] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [catForm, setCatForm] = useState({ name: '', description: '', displayOrder: 0 });
  const [showCatForm, setShowCatForm] = useState(false);
  const [savingCat, setSavingCat] = useState(false);
  const [fetchingToday, setFetchingToday] = useState(false);

  const fetchAlbums = useCallback(() => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (search.trim()) params.search = search.trim();
    albumService
      .getAdmin(params)
      .then(({ data }) => setAlbums(data.data || []))
      .catch(() => toast.error('Failed to load albums'))
      .finally(() => setLoading(false));
  }, [statusFilter, search]);

  const fetchCategories = useCallback(() => {
    albumService
      .getCategories()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleFetchTodayNews = async () => {
    setFetchingToday(true);
    try {
      const { data } = await albumService.createFromTodayNews({ limit: 20 });
      toast.success(
        data.message ||
          `Created ${data.data?.albumsCreated ?? 0} albums from news`
      );
      fetchAlbums();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch today\'s news albums');
    } finally {
      setFetchingToday(false);
    }
  };

  const handleToggle = async (row) => {
    try {
      await albumService.togglePublish(row._id);
      toast.success(row.status === 'published' ? 'Unpublished' : 'Published');
      fetchAlbums();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete album "${row.title}" and all its images?`)) return;
    try {
      await albumService.delete(row._id);
      toast.success('Album deleted');
      fetchAlbums();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSavingCat(true);
    try {
      await albumService.createCategory({
        name: catForm.name.trim(),
        description: catForm.description.trim(),
        displayOrder: Number(catForm.displayOrder) || 0,
      });
      toast.success('Category created');
      setCatForm({ name: '', description: '', displayOrder: 0 });
      setShowCatForm(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await albumService.deleteCategory(cat._id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'cover',
        label: 'Cover',
        render: (row) => (
          <img
            src={getImageUrl(row.coverImage, row.slug)}
            alt=""
            className="h-12 w-16 rounded-md object-cover bg-slate-100"
            loading="lazy"
          />
        ),
      },
      {
        key: 'title',
        label: 'Album',
        render: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{row.title}</p>
            <p className="text-xs text-slate-500 truncate">
              {row.category?.name || 'Uncategorized'} · {row.imageCount || 0} images
            </p>
          </div>
        ),
      },
      {
        key: 'albumDate',
        label: 'Date',
        render: (row) =>
          row.albumDate
            ? new Date(row.albumDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—',
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => (
          <StatusBadge status={row.status === 'published' ? 'PUBLISHED' : 'DRAFT'} />
        ),
      },
      {
        key: 'displayOrder',
        label: 'Order',
        render: (row) => row.displayOrder ?? 0,
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => (
          <div className="flex flex-wrap gap-1.5">
            <Link
              to={`/admin/albums/edit/${row._id}`}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => handleToggle(row)}
              className="text-xs px-2.5 py-1 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700"
            >
              {row.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row)}
              className="text-xs px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Album"
        subtitle="Create albums, upload optimized images, and publish to the website gallery"
        actionLabel="Add New Album"
        actionTo="/admin/albums/new"
      >
        <button
          type="button"
          disabled={fetchingToday}
          onClick={handleFetchTodayNews}
          className="btn-secondary text-sm py-2.5 px-4 w-full sm:w-auto"
        >
          {fetchingToday ? 'Fetching…' : "Fetch today's news albums"}
        </button>
      </AdminPageHeader>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search albums..."
          className="admin-input sm:max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-input sm:max-w-[10rem]"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <button type="button" onClick={fetchAlbums} className="btn-secondary text-sm py-2 px-3">
          Refresh
        </button>
      </div>

      <DataTable columns={columns} data={albums} loading={loading} emptyMessage="No albums yet" />

      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Album Categories</h2>
            <p className="text-sm text-slate-500">Organize albums for the public gallery filters</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCatForm((v) => !v)}
            className="btn-secondary text-sm py-2 px-3"
          >
            {showCatForm ? 'Cancel' : 'Add Category'}
          </button>
        </div>

        {showCatForm && (
          <form onSubmit={handleCreateCategory} className="grid sm:grid-cols-3 gap-3 mb-4">
            <input
              className="admin-input"
              placeholder="Category name"
              value={catForm.name}
              onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              className="admin-input"
              placeholder="Description (optional)"
              value={catForm.description}
              onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div className="flex gap-2">
              <input
                type="number"
                className="admin-input w-24"
                placeholder="Order"
                value={catForm.displayOrder}
                onChange={(e) => setCatForm((f) => ({ ...f, displayOrder: e.target.value }))}
              />
              <button type="submit" disabled={savingCat} className="btn-primary text-sm px-4">
                {savingCat ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}

        {categories.length === 0 ? (
          <p className="text-sm text-slate-500">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {categories.map((cat) => (
              <li key={cat._id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{cat.name}</p>
                  <p className="text-xs text-slate-500">
                    {cat.slug} · order {cat.displayOrder ?? 0}
                    {!cat.isActive ? ' · inactive' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Albums;
