import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { astrologyService } from '../../services/articleService';
import AdminPageHeader from '../AdminPageHeader';
import AstrologyNav from './AstrologyNav';

const Stat = ({ label, value, tone = 'slate' }) => {
  const tones = {
    slate: 'bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-100',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    rose: 'bg-rose-50 border-rose-200 text-rose-900',
    teal: 'bg-teal-50 border-teal-200 text-teal-900',
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.slate}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-lg sm:text-xl font-bold mt-1 break-words">{value ?? '—'}</p>
    </div>
  );
};

const formatWhen = (d) => (d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—');

const AstrologyDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    astrologyService
      .getDashboard()
      .then(({ data: res }) => setData(res.data))
      .catch(() => toast.error('Failed to load astrology dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const apiOk = data?.apiStatus === 'connected';
  const lastFailed = data?.lastSyncStatus === 'failed';

  return (
    <div>
      <AdminPageHeader
        title="Astrology Dashboard"
        subtitle="API status, auto sync and today’s Rasi records"
        actionLabel="API Configuration"
        actionTo="/admin/astrology/settings"
      />
      <AstrologyNav />

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            <Stat label="Today's Date" value={data?.displayDate} tone="teal" />
            <Stat
              label="API Status"
              value={apiOk ? '✓ Connected' : data?.apiStatus === 'failed' ? '✗ Failed' : 'Unknown'}
              tone={apiOk ? 'green' : data?.apiStatus === 'failed' ? 'rose' : 'amber'}
            />
            <Stat
              label="Auto Sync"
              value={data?.autoSync ? `✓ Enabled (${data?.syncTimeDisplay || ''})` : 'Off'}
              tone={data?.autoSync ? 'green' : 'slate'}
            />
            <Stat
              label="Today's Rasi Records"
              value={`${data?.todayRecords ?? 0} / ${data?.todayRecordsTarget ?? 12}`}
              tone={(data?.todayRecords || 0) >= 12 ? 'green' : 'amber'}
            />
            <Stat label="Last Successful Sync" value={formatWhen(data?.lastSuccessfulSyncAt)} />
            <Stat label="Next Sync Time" value={formatWhen(data?.nextSyncAt)} />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 mb-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Last Sync Result</h2>
            <p className={`text-sm font-medium ${lastFailed ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
              {data?.lastSyncStatus
                ? `Status: ${String(data.lastSyncStatus).toUpperCase()}${data.lastSyncRecords != null ? ` · ${data.lastSyncRecords} records` : ''}`
                : 'No sync has run yet.'}
            </p>
            {data?.lastSyncError && (
              <p className="text-sm text-rose-600 mt-2">Error: {data.lastSyncError}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <Link to="/admin/astrology/sync" className="btn-primary text-sm py-2 px-4">
                Sync Now
              </Link>
              <Link to="/admin/astrology/sync-history" className="btn-secondary text-sm py-2 px-4">
                Sync History
              </Link>
              <Link to="/astrology" target="_blank" rel="noreferrer" className="btn-secondary text-sm py-2 px-4">
                View Public Page
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AstrologyDashboard;
