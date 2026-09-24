import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { astrologyService } from '../../services/articleService';
import AdminPageHeader from '../AdminPageHeader';
import AstrologyNav from './AstrologyNav';

const AstrologySyncNow = () => {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);

  const handleSync = async () => {
    if (!window.confirm('Fetch today’s astrology data from the external API and update the database?')) return;
    setSyncing(true);
    setResult(null);
    try {
      const { data } = await astrologyService.syncNow();
      setResult(data.data || data);
      toast.success(data.message || 'Sync completed');
    } catch (err) {
      const payload = err.response?.data;
      setResult(payload?.data || { success: false, message: payload?.message });
      toast.error(payload?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Sync Now"
        subtitle="Manually pull today’s data from the Astrology API into the database"
      />
      <AstrologyNav />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 max-w-xl space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          The external API is called only from the server. Public visitors always read from the database.
        </p>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="btn-primary text-sm py-2.5 px-5 disabled:opacity-50"
        >
          {syncing ? 'Syncing…' : 'Sync Astrology Now'}
        </button>

        {result && (
          <div className={`rounded-xl border p-4 text-sm ${result.success === false || result.status === 'failed' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
            <p className="font-semibold">{result.message}</p>
            {result.displayDate && (
              <p className="mt-2">Date: {result.displayDate}</p>
            )}
            {result.rasiUpdated != null && (
              <p>Rasi Updated: {result.rasiUpdated}</p>
            )}
            {result.status && <p>Status: {String(result.status)}</p>}
            {result.error && <p>Error: {result.error}</p>}
            <Link to="/admin/astrology/sync-history" className="inline-block mt-3 underline font-medium">
              View Sync History
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AstrologySyncNow;
