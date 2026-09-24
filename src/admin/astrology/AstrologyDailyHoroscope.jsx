import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { astrologyService } from '../../services/articleService';
import AdminPageHeader from '../AdminPageHeader';
import AstrologyNav from './AstrologyNav';
import DataTable from '../DataTable';

const AstrologyDailyHoroscope = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    astrologyService
      .getHoroscopes({ limit: 100 })
      .then(({ data }) => setItems(data.data || []))
      .catch(() => toast.error('Failed to load horoscopes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = async (id) => {
    try {
      const { data } = await astrologyService.getHoroscope(id);
      setEditing({ ...data.data });
    } catch {
      toast.error('Could not load record');
    }
  };

  const saveEdit = async () => {
    if (!editing?._id) return;
    setSaving(true);
    try {
      await astrologyService.updateHoroscope(editing._id, {
        prediction: editing.prediction,
        career: editing.career,
        finance: editing.finance,
        love: editing.love,
        health: editing.health,
        education: editing.education,
        luckyNumber: editing.luckyNumber,
        luckyColor: editing.luckyColor,
        luckyTime: editing.luckyTime,
        advice: editing.advice,
        status: editing.status,
      });
      toast.success('Updated');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'date',
        header: 'Date',
        sortable: true,
        render: (row) => <span className="whitespace-nowrap text-sm">{row.date}</span>,
      },
      {
        key: 'rasi',
        header: 'Rasi',
        sortable: true,
        render: (row) => <span className="text-xs font-mono text-slate-500">{row.rasi}</span>,
      },
      {
        key: 'rasiTamil',
        header: 'Tamil Name',
        sortable: true,
        render: (row) => <span className="font-medium">{row.rasiTamil}</span>,
      },
      {
        key: 'rasiEnglish',
        header: 'English Name',
        sortable: true,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (row) => (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50">
            {row.status}
          </span>
        ),
      },
      {
        key: 'updatedAt',
        header: 'Updated At',
        sortable: true,
        sortValue: (row) => new Date(row.updatedAt).getTime(),
        render: (row) => (
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {row.updatedAt ? new Date(row.updatedAt).toLocaleString('en-IN') : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Action',
        render: (row) => (
          <div className="data-table-actions">
            <button type="button" className="data-table-action data-table-action-secondary" onClick={() => setView(row)}>
              View
            </button>
            <button type="button" className="data-table-action data-table-action-edit" onClick={() => openEdit(row._id)}>
              Edit
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div>
      <AdminPageHeader
        title="Daily Horoscope"
        subtitle="Synced Rasi predictions stored in the database"
      />
      <AstrologyNav />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          emptyMessage="No horoscope records — run Sync Now after configuring the API"
          searchPlaceholder="Search by rasi or date..."
          searchKeys={['date', 'rasi', 'rasiTamil', 'rasiEnglish', 'status']}
          pageSize={20}
        />
      </div>

      {view && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setView(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1">{view.rasiTamil} · {view.rasiEnglish}</h3>
            <p className="text-xs text-slate-500 mb-3">{view.date}</p>
            <div className="space-y-3 text-sm">
              {['prediction', 'career', 'finance', 'love', 'health', 'education', 'luckyNumber', 'luckyColor', 'luckyTime', 'advice'].map((k) =>
                view[k] ? (
                  <div key={k}>
                    <p className="text-xs font-semibold uppercase text-slate-500">{k}</p>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5 whitespace-pre-wrap">{view[k]}</p>
                  </div>
                ) : null
              )}
            </div>
            <button type="button" className="btn-secondary text-sm mt-4 py-2 px-4" onClick={() => setView(null)}>Close</button>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setEditing(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 max-h-[85vh] overflow-y-auto space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Edit · {editing.rasiTamil}</h3>
            {['prediction', 'career', 'finance', 'love', 'health', 'education', 'luckyNumber', 'luckyColor', 'luckyTime', 'advice'].map((k) => (
              <label key={k} className="block text-sm">
                <span className="text-slate-600 capitalize">{k}</span>
                <textarea
                  className="input mt-1 min-h-[72px]"
                  value={editing[k] || ''}
                  onChange={(e) => setEditing((prev) => ({ ...prev, [k]: e.target.value }))}
                />
              </label>
            ))}
            <div className="flex gap-2 pt-2">
              <button type="button" className="btn-primary text-sm py-2 px-4" disabled={saving} onClick={saveEdit}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="btn-secondary text-sm py-2 px-4" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AstrologyDailyHoroscope;
