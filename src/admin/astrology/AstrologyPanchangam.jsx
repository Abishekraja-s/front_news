import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { astrologyService } from '../../services/articleService';
import AdminPageHeader from '../AdminPageHeader';
import AstrologyNav from './AstrologyNav';

const FIELDS = [
  ['tithi', 'Tithi'],
  ['nakshatraTamil', 'Nakshatra (Tamil)'],
  ['nakshatraEnglish', 'Nakshatra (English)'],
  ['yoga', 'Yoga'],
  ['karana', 'Karana'],
  ['sunrise', 'Sunrise'],
  ['sunset', 'Sunset'],
  ['moonrise', 'Moonrise'],
  ['moonset', 'Moonset'],
  ['rahuKalam', 'Rahu Kalam'],
  ['yamagandam', 'Yamagandam'],
  ['kuligai', 'Kuligai'],
  ['abhijitMuhurtham', 'Abhijit Muhurtham'],
  ['tamilMonth', 'Tamil Month'],
  ['tamilYear', 'Tamil Year'],
];

const AstrologyPanchangam = () => {
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    astrologyService
      .getPanchang()
      .then(({ data: res }) => {
        setData(res);
        setRecent(res.recent || []);
      })
      .catch(() => toast.error('Failed to load panchangam'))
      .finally(() => setLoading(false));
  }, []);

  const item = data?.data;

  return (
    <div>
      <AdminPageHeader
        title="Panchangam"
        subtitle="Daily panchang stored from the Astrology API (Chennai by default)"
      />
      <AstrologyNav />

      {loading ? (
        <div className="skeleton h-48 rounded-2xl" />
      ) : !item ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-sm text-slate-500">
          No panchangam for {data?.displayDate || 'today'}. Run Sync Now after the API is configured.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">{data?.displayDate}</p>
          <p className="text-sm text-slate-500 mt-1">{item.locationLabel}</p>
          <dl className="grid sm:grid-cols-2 gap-3 mt-4">
            {FIELDS.map(([key, label]) =>
              item[key] ? (
                <div key={key} className="rounded-xl border border-slate-100 dark:border-slate-700 p-3">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">{item[key]}</dd>
                </div>
              ) : null
            )}
          </dl>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Recent dates</h2>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            {recent.map((r) => (
              <li key={r._id}>{r.date} — {r.tithi || '—'} / {r.nakshatraEnglish || r.nakshatra || '—'}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AstrologyPanchangam;
