import { useCallback, useEffect, useMemo, useState } from 'react';
import { adService } from '../services/articleService';
import toast from 'react-hot-toast';
import AdminPageHeader, { StatusBadge } from './AdminPageHeader';
import DataTable from './DataTable';
import NewsImage from '../components/NewsImage';
import ImageUploadField from '../components/ImageUploadField';

const CATEGORY_BANNER_LABELS = {
  district: 'District / மாவட்டம்',
  politics: 'Politics / அரசியல்',
  chennai: 'Chennai / சென்னை',
  'tamil-nadu': 'Tamil Nadu / தமிழ்நாடு',
  india: 'India / இந்தியா',
  world: 'World / உலகம்',
  crime: 'Crime / குற்றம்',
  pocso: 'POCSO / போக்சோ',
  spiritual: 'Spiritual / ஆன்மீகம்',
  special: 'Special / சிறப்பு செய்திகள்',
  education: 'Education / கல்வி',
  sports: 'Sports / விளையாட்டு',
  jobs: 'Jobs / வேலை வாய்ப்பு',
  agriculture: 'Agriculture / விவசாயம்',
  'sri-lanka': 'Sri Lanka / இலங்கை',
  business: 'Business / வணிகம்',
  health: 'Health / மருத்துவம்',
  'short-news': 'Short News / ஷார்ட் நியூஸ்',
  weather: 'Weather / வானிலை',
  'other-news': 'Other News / மற்ற செய்திகள்',
};

const AD_POSITIONS = [
  { value: 'header', label: 'Header' },
  { value: 'top_banner', label: 'Top banner' },
  { value: 'homepage_top', label: 'Homepage top' },
  { value: 'homepage_middle', label: 'Homepage middle' },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'article_top', label: 'Article top' },
  { value: 'article_middle', label: 'Article middle' },
  { value: 'article_bottom', label: 'Article bottom' },
  { value: 'footer', label: 'Footer' },
  { value: 'mobile_sticky', label: 'Mobile sticky' },
  { value: 'category_below', label: 'All categories — below title (shared)' },
  ...Object.entries(CATEGORY_BANNER_LABELS).map(([slug, name]) => ({
    value: `category_${slug}`,
    label: `Category banner — ${name}`,
  })),
];

const positionLabel = (value) =>
  AD_POSITIONS.find((p) => p.value === value)?.label || String(value || '').replace(/_/g, ' ');

const toDateInputValue = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatAdDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

/** From date = start of local day; To date = end of local day (inclusive). */
const dateInputToStart = (value) => {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const dateInputToEnd = (value) => {
  if (!value) return null;
  const d = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const emptyForm = {
  title: '',
  position: 'sidebar',
  type: 'image',
  image: '',
  link: '',
  code: '',
  isActive: true,
  priority: 0,
  startDate: toDateInputValue(new Date()),
  endDate: '',
};

const Advertisements = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAds = useCallback(() => {
    setLoading(true);
    adService
      .getAll()
      .then(({ data }) => setAds(data.data || []))
      .catch(() => toast.error('Failed to load advertisements'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (ad) => {
    setEditingId(ad._id);
    setForm({
      title: ad.title || '',
      position: ad.position || 'sidebar',
      type: ad.type || 'image',
      image: ad.image || '',
      link: ad.link || '',
      code: ad.code || '',
      isActive: ad.isActive !== false,
      priority: ad.priority ?? 0,
      startDate: toDateInputValue(ad.startDate) || toDateInputValue(new Date()),
      endDate: toDateInputValue(ad.endDate),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.type === 'image' && !form.image?.trim()) {
      toast.error('Image is required for image ads');
      return;
    }
    if (form.type === 'code' && !form.code?.trim()) {
      toast.error('HTML code is required for code ads');
      return;
    }
    if (!form.startDate) {
      toast.error('Start date is required');
      return;
    }
    if (form.endDate && form.endDate < form.startDate) {
      toast.error('End date must be on or after Start date');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        position: form.position,
        type: form.type,
        image: form.type === 'image' ? form.image.trim() : '',
        link: form.type === 'image' ? form.link.trim() : '',
        code: form.type === 'code' ? form.code : '',
        isActive: Boolean(form.isActive),
        priority: Number(form.priority) || 0,
        startDate: dateInputToStart(form.startDate),
        endDate: form.endDate ? dateInputToEnd(form.endDate) : null,
      };

      if (editingId) {
        await adService.update(editingId, payload);
        toast.success('Advertisement updated');
      } else {
        await adService.create(payload);
        toast.success('Advertisement created');
      }
      resetForm();
      fetchAds();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (ad) => {
    try {
      await adService.update(ad._id, { isActive: !ad.isActive });
      toast.success(ad.isActive ? 'Ad disabled' : 'Ad enabled — will show on website');
      fetchAds();
    } catch {
      toast.error('Failed to update ad');
    }
  };

  const handleEnableAll = async () => {
    const inactive = ads.filter((a) => !a.isActive);
    if (!inactive.length) {
      toast.success('All ads are already active');
      return;
    }
    try {
      await Promise.all(inactive.map((ad) => adService.update(ad._id, { isActive: true })));
      toast.success(`Enabled ${inactive.length} ad(s) — refresh the website to see them`);
      fetchAds();
    } catch {
      toast.error('Failed to enable ads');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this advertisement?')) return;
    try {
      await adService.delete(id);
      toast.success('Deleted');
      if (editingId === id) resetForm();
      fetchAds();
    } catch {
      toast.error('Delete failed');
    }
  };

  const inactiveCount = ads.filter((a) => !a.isActive).length;

  const columns = useMemo(
    () => [
      {
        key: 'title',
        header: 'Title',
        sortable: true,
        render: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-slate-900 truncate">{row.title}</p>
            {row.type === 'image' && row.image && (
              <p className="text-[10px] text-slate-400 truncate max-w-[220px]">{row.image}</p>
            )}
          </div>
        ),
      },
      {
        key: 'position',
        header: 'Position',
        sortable: true,
        render: (row) => (
          <span className="text-slate-600 whitespace-nowrap text-xs sm:text-sm">{positionLabel(row.position)}</span>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        sortable: true,
        render: (row) => <span className="uppercase text-xs font-semibold text-slate-500">{row.type}</span>,
      },
      {
        key: 'priority',
        header: 'Priority',
        sortable: true,
        sortValue: (row) => row.priority || 0,
      },
      {
        key: 'startDate',
        header: 'Start',
        sortable: true,
        sortValue: (row) => (row.startDate ? new Date(row.startDate).getTime() : 0),
        render: (row) => (
          <span className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">{formatAdDate(row.startDate)}</span>
        ),
      },
      {
        key: 'endDate',
        header: 'End',
        sortable: true,
        sortValue: (row) => (row.endDate ? new Date(row.endDate).getTime() : Number.MAX_SAFE_INTEGER),
        render: (row) => (
          <span className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">
            {row.endDate ? formatAdDate(row.endDate) : 'No end'}
          </span>
        ),
      },
      {
        key: 'isActive',
        header: 'Status',
        sortable: true,
        sortValue: (row) => (row.isActive ? 1 : 0),
        render: (row) => <StatusBadge active={row.isActive} />,
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="data-table-actions">
            <button
              type="button"
              onClick={() => openEdit(row)}
              className="data-table-action data-table-action-secondary"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => handleToggle(row)}
              className="data-table-action data-table-action-secondary"
            >
              {row.isActive ? 'Disable' : 'Enable'}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row._id)}
              className="data-table-action data-table-action-delete"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editingId]
  );

  return (
    <div className="min-w-0 w-full max-w-full">
      <AdminPageHeader
        title="Advertisements"
        subtitle="Manage ad placements — only Active ads within Start/End dates appear on the website"
        actionLabel={showForm ? undefined : '+ Add Ad'}
        onAction={openCreate}
      >
        {inactiveCount > 0 && !showForm && (
          <button type="button" onClick={handleEnableAll} className="btn-secondary text-sm py-2.5 px-4 w-full sm:w-auto">
            Enable All ({inactiveCount})
          </button>
        )}
      </AdminPageHeader>

      {inactiveCount > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 sm:px-4 py-3 text-sm text-amber-800 break-words">
          <strong>{inactiveCount} inactive ad(s)</strong> will not show on the public website.
          Click <strong>Enable</strong> on each row or use <strong>Enable All</strong>.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-card mb-6 min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 mb-4 min-w-0">
            <h2 className="font-semibold text-slate-900">
              {editingId ? 'Edit Advertisement' : 'New Advertisement'}
            </h2>
            {editingId && (
              <span className="text-[11px] sm:text-xs text-slate-500 font-mono break-all">ID: {editingId}</span>
            )}
          </div>
          <div className="space-y-4 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="admin-input"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Position</label>
                <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="admin-input">
                  {AD_POSITIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="admin-input">
                  <option value="image">Image</option>
                  <option value="code">HTML Code</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Higher shows first"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="admin-input w-full min-w-0"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 min-h-[42px] sm:mt-6 px-1">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-slate-300 shrink-0"
                />
                Active on website
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Start date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                  className="admin-input w-full min-w-0 max-w-full"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">End date</label>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate || undefined}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="admin-input w-full min-w-0 max-w-full"
                />
                <p className="mt-1 text-[11px] text-slate-500">Leave empty for no end date.</p>
              </div>
            </div>
            {form.type === 'image' ? (
              <>
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Image</label>
                  <ImageUploadField
                    value={form.image}
                    onChange={(url) => setForm({ ...form, image: url })}
                    placeholder="Image URL"
                    required
                    seed={editingId || 'ad-preview'}
                    showPreview={false}
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Link URL</label>
                  <input
                    placeholder="https://… (optional)"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    className="admin-input"
                  />
                </div>
                {form.image && (
                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 min-w-0 overflow-hidden">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">Preview</p>
                    <NewsImage
                      src={form.image}
                      seed={editingId || 'ad-preview'}
                      alt=""
                      className="max-h-32 w-full object-contain rounded-lg bg-white"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">HTML code</label>
                <textarea
                  placeholder="HTML Code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  rows={6}
                  required
                  className="admin-input font-mono text-xs"
                />
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50 w-full sm:w-auto">
              {saving ? 'Saving…' : editingId ? 'Update Ad' : 'Save Ad'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary text-sm w-full sm:w-auto">
              Cancel
            </button>
          </div>
        </form>
      )}

      <DataTable
        columns={columns}
        data={ads}
        loading={loading}
        searchPlaceholder="Search ads..."
        searchKeys={['title', 'position', 'type']}
        emptyMessage="No advertisements found"
      />
    </div>
  );
};

export default Advertisements;
