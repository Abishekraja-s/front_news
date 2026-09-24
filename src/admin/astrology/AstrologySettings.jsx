import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { astrologyService } from '../../services/articleService';
import AdminPageHeader from '../AdminPageHeader';
import AstrologyNav from './AstrologyNav';

const emptyForm = () => ({
  apiProvider: 'free',
  apiBaseUrl: 'https://ohmanda.com/api/horoscope',
  apiKey: '',
  apiSecret: '',
  apiKeyMasked: '',
  apiSecretMasked: '',
  hasApiKey: false,
  hasApiSecret: false,
  language: 'Tamil',
  country: 'India',
  state: 'Tamil Nadu',
  city: 'Chennai',
  timezone: 'Asia/Kolkata',
  autoSync: true,
  syncTime: '00:05',
  lat: 13.0827,
  lon: 80.2707,
  apiStatus: 'unknown',
});

const AstrologySettings = () => {
  const [form, setForm] = useState(emptyForm());
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const load = () => {
    setLoading(true);
    astrologyService
      .getConfig()
      .then(({ data }) => {
        const c = data.data || {};
        setProviders(data.providers || []);
        setForm({
          ...emptyForm(),
          ...c,
          apiKey: c.hasApiKey ? '__UNCHANGED__' : '',
          apiSecret: c.hasApiSecret ? '__UNCHANGED__' : '',
        });
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        apiProvider: form.apiProvider,
        apiBaseUrl: form.apiBaseUrl,
        language: form.language,
        country: form.country,
        state: form.state,
        city: form.city,
        timezone: form.timezone,
        autoSync: form.autoSync,
        syncTime: form.syncTime,
        lat: form.lat,
        lon: form.lon,
      };
      if (form.apiKey && form.apiKey !== '__UNCHANGED__') payload.apiKey = form.apiKey;
      if (form.apiSecret && form.apiSecret !== '__UNCHANGED__') payload.apiSecret = form.apiSecret;

      const { data } = await astrologyService.updateConfig(payload);
      toast.success(data.message || 'Settings saved');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data } = await astrologyService.testConnection();
      toast.success(data.message || 'Connection successful');
      load();
    } catch (err) {
      toast.error(
        err.response?.data?.message
          || '✗ Astrology API connection failed. Please check the API URL and credentials.'
      );
      load();
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <AdminPageHeader title="API Configuration" subtitle="Astrology provider credentials and sync" />
        <AstrologyNav />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="API Configuration"
        subtitle="Credentials stay on the server — never sent to public pages"
      />
      <AstrologyNav />

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 space-y-4 max-w-3xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-300 font-medium">API Provider</span>
            <select
              className="input mt-1"
              value={form.apiProvider}
              onChange={(e) => {
                const value = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  apiProvider: value,
                  apiBaseUrl:
                    value === 'free'
                      ? 'https://ohmanda.com/api/horoscope'
                      : value === 'astrologyapi'
                        ? (prev.apiBaseUrl || 'https://json.astrologyapi.com')
                        : prev.apiBaseUrl,
                }));
              }}
            >
              {(providers.length ? providers : [
                { value: 'free', label: 'Free Daily Horoscope (no API key)' },
                { value: 'astrologyapi', label: 'AstrologyAPI.com' },
                { value: 'custom', label: 'Custom / Generic HTTP API' },
              ]).map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            {form.apiProvider === 'free' && (
              <p className="text-xs text-slate-500 mt-1">
                No API key needed. Syncs all 12 Rasi daily from a free horoscope API.
              </p>
            )}
            {form.apiProvider === 'astrologyapi' && (
              <p className="text-xs text-slate-500 mt-1">
                Put AstrologyAPI.com User ID in API Key and API Key in API Secret.
              </p>
            )}
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600 dark:text-slate-300 font-medium">API Base URL</span>
            <input
              className="input mt-1"
              value={form.apiBaseUrl}
              onChange={(e) => setField('apiBaseUrl', e.target.value)}
              placeholder="https://ohmanda.com/api/horoscope"
              disabled={form.apiProvider === 'free'}
            />
          </label>

          {form.apiProvider !== 'free' && (
            <>
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-300 font-medium">API Key</span>
            <input
              type="password"
              className="input mt-1"
              value={form.apiKey === '__UNCHANGED__' ? '' : form.apiKey}
              onChange={(e) => setField('apiKey', e.target.value)}
              placeholder={form.apiKeyMasked || 'Enter API key'}
              autoComplete="new-password"
            />
            {form.apiKeyMasked && (
              <p className="text-xs text-slate-500 mt-1">Saved: {form.apiKeyMasked}</p>
            )}
          </label>

          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-300 font-medium">API Secret</span>
            <input
              type="password"
              className="input mt-1"
              value={form.apiSecret === '__UNCHANGED__' ? '' : form.apiSecret}
              onChange={(e) => setField('apiSecret', e.target.value)}
              placeholder={form.apiSecretMasked || 'Enter API secret'}
              autoComplete="new-password"
            />
            {form.apiSecretMasked && (
              <p className="text-xs text-slate-500 mt-1">Saved: {form.apiSecretMasked}</p>
            )}
          </label>
            </>
          )}

          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-300 font-medium">Language</span>
            <input className="input mt-1" value={form.language} onChange={(e) => setField('language', e.target.value)} />
          </label>

          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-300 font-medium">Country</span>
            <input className="input mt-1" value={form.country} onChange={(e) => setField('country', e.target.value)} />
          </label>

          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-300 font-medium">State</span>
            <input className="input mt-1" value={form.state} onChange={(e) => setField('state', e.target.value)} />
          </label>

          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-300 font-medium">City</span>
            <input className="input mt-1" value={form.city} onChange={(e) => setField('city', e.target.value)} />
          </label>

          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-300 font-medium">Timezone</span>
            <input className="input mt-1" value={form.timezone} onChange={(e) => setField('timezone', e.target.value)} />
          </label>

          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-300 font-medium">Sync Time (24h HH:mm)</span>
            <input
              className="input mt-1"
              value={form.syncTime}
              onChange={(e) => setField('syncTime', e.target.value)}
              placeholder="00:05"
            />
            <p className="text-xs text-slate-500 mt-1">Default 12:05 AM Asia/Kolkata</p>
          </label>

          <label className="flex items-center gap-2 text-sm mt-6">
            <input
              type="checkbox"
              checked={Boolean(form.autoSync)}
              onChange={(e) => setField('autoSync', e.target.checked)}
            />
            <span className="font-medium text-slate-700 dark:text-slate-200">Auto Sync ON</span>
          </label>

          <div className="sm:col-span-2 text-sm">
            <span className="text-slate-600 dark:text-slate-300 font-medium">API Status</span>
            <p className="mt-1 font-semibold">
              {form.apiStatus === 'connected' && <span className="text-emerald-600">✓ Connected</span>}
              {form.apiStatus === 'failed' && <span className="text-rose-600">✗ Failed</span>}
              {form.apiStatus === 'unknown' && <span className="text-slate-500">Not tested</span>}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button type="submit" disabled={saving} className="btn-primary text-sm py-2.5 px-4 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="btn-secondary text-sm py-2.5 px-4 disabled:opacity-50"
          >
            {testing ? 'Testing…' : 'Test API Connection'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AstrologySettings;
