import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { databaseBackupService } from '../services/articleService';
import AdminPageHeader from './AdminPageHeader';

const FORMATS = [
  {
    id: 'json',
    label: 'JSON',
    ext: '.json',
    hint: 'Compact single file — best for restore scripts',
  },
  {
    id: 'pretty-json',
    label: 'Pretty JSON',
    ext: '.pretty.json',
    hint: 'Indented JSON — easier to read',
  },
  {
    id: 'ndjson',
    label: 'NDJSON',
    ext: '.ndjson',
    hint: 'Newline-delimited — best for large full dumps',
  },
];

const triggerNativeDownload = (fileUrl, filename) => {
  const a = document.createElement('a');
  a.href = fileUrl;
  a.download = filename || 'database-backup.json';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
};

const DatabaseBackupAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [progress, setProgress] = useState('');
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await databaseBackupService.getStats();
      setStats(data.data || null);
      setSelected([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load database stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleCollection = (name) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const selectAll = () => {
    if (!stats?.collections?.length) return;
    setSelected(stats.collections.map((c) => c.name));
  };

  const clearSelection = () => setSelected([]);

  const handleDownload = async (format) => {
    setDownloading(format);
    setProgress('Starting backup job…');
    try {
      const params = { format };
      if (selected.length) params.collections = selected.join(',');

      toast.loading('Building backup on server…', { id: 'db-backup' });

      const { fileUrl, filename, size } = await databaseBackupService.download(
        params,
        {
          onProgress: (job) => {
            const msg = job.message || 'Building…';
            setProgress(msg);
            toast.loading(msg, { id: 'db-backup' });
          },
        }
      );

      setProgress('Starting browser download…');
      triggerNativeDownload(fileUrl, filename);

      const sizeMb = size ? (size / (1024 * 1024)).toFixed(2) : '?';
      toast.success(`Download started: ${filename} (${sizeMb} MB)`, {
        id: 'db-backup',
      });
      setProgress('');
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || 'Backup download failed';
      toast.error(message, { id: 'db-backup' });
      setProgress('');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Database Backup"
        subtitle="Download a full MongoDB dump as JSON or NDJSON. Super Admin only."
      >
        <button type="button" onClick={load} className="btn-secondary text-sm py-2.5 px-4">
          Refresh stats
        </button>
      </AdminPageHeader>

      <div className="admin-card mb-6 space-y-2">
        <p className="text-sm text-slate-600">
          Database: <span className="font-semibold text-slate-900">{stats?.database || '—'}</span>
        </p>
        <p className="text-sm text-slate-600">
          Collections: <span className="font-semibold text-slate-900">{stats?.collectionCount ?? 0}</span>
          {' · '}
          Documents: <span className="font-semibold text-slate-900">{stats?.totalDocuments ?? 0}</span>
        </p>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Full dumps are built on the server first, then downloaded. Keep this tab open until the
          browser save starts. Passwords are redacted.
        </p>
        {progress ? (
          <p className="text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
            {progress}
          </p>
        ) : null}
      </div>

      <div className="admin-card mb-6">
        <h2 className="font-semibold text-slate-900 mb-1">Download format</h2>
        <p className="text-sm text-slate-500 mb-4">
          Click a format to download{' '}
          {selected.length ? `${selected.length} selected collection(s)` : 'the full database'}.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              disabled={Boolean(downloading)}
              onClick={() => handleDownload(f.id)}
              className="text-left rounded-xl border border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/40 p-4 transition-colors disabled:opacity-50"
            >
              <p className="font-semibold text-slate-900">
                {downloading === f.id ? 'Preparing…' : `Download ${f.label}`}
              </p>
              <p className="text-xs text-slate-500 mt-1">{f.hint}</p>
              <p className="text-[11px] font-mono text-slate-400 mt-2">{f.ext}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="font-semibold text-slate-900">Collections</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Optional: select specific collections. Leave empty to export everything.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600"
            >
              Clear
            </button>
          </div>
        </div>

        {!stats?.collections?.length ? (
          <p className="text-sm text-slate-500 py-6 text-center">No collections found.</p>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
            {stats.collections.map((c) => {
              const checked = selected.includes(c.name);
              return (
                <li key={c.name}>
                  <label className="flex items-center gap-3 py-2.5 px-1 cursor-pointer hover:bg-slate-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCollection(c.name)}
                      className="rounded border-slate-300 text-brand-600"
                    />
                    <span className="flex-1 font-mono text-sm text-slate-800">{c.name}</span>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {c.count.toLocaleString()} docs
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DatabaseBackupAdmin;
