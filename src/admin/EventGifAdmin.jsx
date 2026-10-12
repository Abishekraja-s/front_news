import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { eventGifService } from '../services/articleService';
import { getImageUrl } from '../utils/images';
import AdminPageHeader, { StatusBadge } from './AdminPageHeader';
import DataTable from './DataTable';
import ImageUploadField from '../components/ImageUploadField';

const toDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const emptyForm = {
  title: '',
  gifUrl: '',
  eventUrl: '',
  startDate: '',
  endDate: '',
  isActive: true,
  displayOrder: 0,
};

const EventGifAdmin = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchEvents = useCallback(() => {
    setLoading(true);
    eventGifService
      .getAll()
      .then(({ data }) => setEvents(data.data || []))
      .catch(() => toast.error('Failed to load event GIFs'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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

  const openEdit = (row) => {
    setEditingId(row._id);
    setForm({
      title: row.title || '',
      gifUrl: row.gifUrl || '',
      eventUrl: row.eventUrl || '',
      startDate: toDateInput(row.startDate),
      endDate: toDateInput(row.endDate),
      isActive: row.isActive !== false,
      displayOrder: row.displayOrder ?? 0,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Event title is required');
      return;
    }
    if (!form.gifUrl.trim()) {
      toast.error('Please upload a GIF');
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast.error('Start and end dates are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        gifUrl: form.gifUrl.trim(),
        eventUrl: form.eventUrl.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: Boolean(form.isActive),
        displayOrder: Number(form.displayOrder) || 0,
      };
      if (editingId) {
        await eventGifService.update(editingId, payload);
        toast.success('Event GIF updated');
      } else {
        await eventGifService.create(payload);
        toast.success('Event GIF created');
      }
      resetForm();
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (row) => {
    try {
      await eventGifService.update(row._id, { isActive: !row.isActive });
      toast.success(row.isActive ? 'Event deactivated' : 'Event activated');
      fetchEvents();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event GIF?')) return;
    try {
      await eventGifService.delete(id);
      toast.success('Deleted');
      if (editingId === id) resetForm();
      fetchEvents();
    } catch {
      toast.error('Delete failed');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'title',
        header: 'Event',
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-3 min-w-0">
            {row.gifUrl ? (
              <img
                src={getImageUrl(row.gifUrl, row._id)}
                alt=""
                className="w-14 h-14 rounded-lg object-contain bg-slate-50 border border-slate-200 shrink-0"
              />
            ) : null}
            <div className="min-w-0">
              <p className="font-medium text-slate-900 truncate">{row.title}</p>
              {row.eventUrl ? (
                <p className="text-[10px] text-slate-400 truncate max-w-[220px]">{row.eventUrl}</p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        key: 'startDate',
        header: 'Dates',
        sortable: true,
        sortValue: (row) => new Date(row.startDate).getTime(),
        render: (row) => (
          <span className="text-xs text-slate-600 whitespace-nowrap">
            {toDateInput(row.startDate)} → {toDateInput(row.endDate)}
          </span>
        ),
      },
      {
        key: 'displayOrder',
        header: 'Order',
        sortable: true,
        sortValue: (row) => row.displayOrder || 0,
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
            <button type="button" onClick={() => openEdit(row)} className="data-table-action data-table-action-secondary">
              Edit
            </button>
            <button type="button" onClick={() => handleToggle(row)} className="data-table-action data-table-action-secondary">
              {row.isActive ? 'Deactivate' : 'Activate'}
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
    <div>
      <AdminPageHeader
        title="Event GIF"
        subtitle="Upload any event GIF — shown bottom-left on the website when active and within the date range"
        actionLabel={showForm ? undefined : '+ Add Event'}
        onAction={openCreate}
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-card mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="font-semibold text-slate-900">{editingId ? 'Edit Event' : 'Add Event'}</h2>
            {editingId && <span className="text-xs text-slate-500 font-mono">ID: {editingId}</span>}
          </div>
          <div className="space-y-4">
            <input
              placeholder="Event Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="admin-input"
            />
            <ImageUploadField
              label="Animated GIF"
              value={form.gifUrl}
              onChange={(url) => setForm({ ...form, gifUrl: url })}
              placeholder="GIF URL or upload .gif"
              required
              seed={editingId || 'event-gif'}
              previewClassName="max-h-40 w-full object-contain rounded-lg bg-slate-50 border border-slate-200"
            />
            <input
              placeholder="Event URL (opens when GIF is clicked)"
              value={form.eventUrl}
              onChange={(e) => setForm({ ...form, eventUrl: e.target.value })}
              className="admin-input"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-600">Start Date</span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                  className="admin-input"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-600">End Date</span>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                  className="admin-input"
                />
              </label>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-600">Display Order</span>
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                  className="admin-input"
                  placeholder="0 = first"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 px-1 mt-6">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-slate-300"
                />
                Active on website
              </label>
            </div>
            {form.gifUrl?.trim() && (
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">Live preview</p>
                <img
                  src={getImageUrl(form.gifUrl, editingId || 'event-gif-preview')}
                  alt="GIF preview"
                  className="max-w-[180px] w-full h-auto rounded-xl border-2 border-white shadow-md"
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Saving…' : editingId ? 'Update Event' : 'Create Event'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <DataTable
        columns={columns}
        data={events}
        loading={loading}
        searchKeys={['title', 'eventUrl', 'gifUrl']}
        emptyMessage="No event GIFs yet. Upload a GIF to get started."
      />
    </div>
  );
};

export default EventGifAdmin;
