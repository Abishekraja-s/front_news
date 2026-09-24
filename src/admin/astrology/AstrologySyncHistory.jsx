import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { astrologyService } from '../../services/articleService';
import AdminPageHeader from '../AdminPageHeader';
import AstrologyNav from './AstrologyNav';
import DataTable from '../DataTable';

const statusClass = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  running: 'bg-sky-50 text-sky-700 border-sky-200',
};

const AstrologySyncHistory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(null);

  const load = () => {
    setLoading(true);
    astrologyService
      .getSyncLogs({ limit: 50 })
      .then(({ data }) => setItems(data.data || []))
      .catch(() => toast.error('Failed to load sync history'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openView = async (id) => {
    try {
      const { data } = await astrologyService.getSyncLog(id);
      setView(data.data);
    } catch {
      toast.error('Could not load log');
    }
  };

  const columns = [
    {
      key: 'syncDate',
      header: 'Date',
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap">
          {row.syncDate || (row.syncStartedAt ? new Date(row.syncStartedAt).toLocaleDateString('en-GB') : '—')}
        </span>
      ),
    },
    {
      key: 'syncStartedAt',
      header: 'Time',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {row.syncStartedAt
            ? new Date(row.syncStartedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
            : '—'}
        </span>
      ),
    },
    {
      key: 'recordsUpdated',
      header: 'Records',
      sortable: true,
      render: (row) => <span>{row.recordsUpdated ?? 0}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusClass[row.status] || statusClass.running}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'trigger',
      header: 'Trigger',
      render: (row) => <span className="text-xs uppercase text-slate-500">{row.trigger}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (row) => (
        <button type="button" onClick={() => openView(row._id)} className="data-table-action data-table-action-edit">
          View
        </button>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Sync History" subtitle="Manual and automatic astrology synchronizations" />
      <AstrologyNav />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          emptyMessage="No sync history yet"
          searchPlaceholder="Search logs..."
          searchKeys={['syncDate', 'status', 'trigger', 'errorMessage', 'apiProvider']}
          pageSize={15}
        />
      </div>

      {view && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setView(null)}>
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Sync Detail</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-slate-500">Date</dt><dd className="font-medium">{view.syncDate}</dd></div>
              <div><dt className="text-slate-500">Status</dt><dd className="font-medium uppercase">{view.status}</dd></div>
              <div><dt className="text-slate-500">Fetched / Updated</dt><dd>{view.recordsFetched} / {view.recordsUpdated}</dd></div>
              <div><dt className="text-slate-500">Provider</dt><dd>{view.apiProvider || '—'}</dd></div>
              <div><dt className="text-slate-500">HTTP</dt><dd>{view.responseCode || '—'}</dd></div>
              {view.errorMessage && (
                <div><dt className="text-slate-500">Error</dt><dd className="text-rose-600">{view.errorMessage}</dd></div>
              )}
            </dl>
            <button type="button" className="btn-secondary text-sm mt-4 py-2 px-4" onClick={() => setView(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AstrologySyncHistory;
