import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { matrimonyService } from '../services/articleService';
import DataTable from '../admin/DataTable';
import { getImageUrl } from '../utils/images';
import { useAuth } from '../context/AuthContext';
import { matrimonyLoginRedirect } from './matrimonyAuthRedirect';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'sent', label: 'Sent by me' },
  { id: 'received', label: 'Received on my profile' },
];

/** Received → enquirer profile; Sent → profile you enquired on */
const counterpartProfile = (row) => {
  if (row.enquiryType === 'received' || row.enquiryType === 'both') {
    return row.enquirerProfile || null;
  }
  return row.profile || null;
};

const profilePathFor = (row) => {
  const p = counterpartProfile(row);
  const key = p?.profileId || p?._id;
  if (!key) return null;
  return `/matrimony/${encodeURIComponent(String(key))}`;
};

const callPhoneFor = (row) => {
  if (row.enquiryType === 'received' || row.enquiryType === 'both') {
    return String(row.enquirerPhone || row.enquirerProfile?.mobile || '').replace(/\D/g, '');
  }
  return String(row.profile?.mobile || '').replace(/\D/g, '');
};

const ProfileCell = ({ profile, fallbackName }) => (
  <div className="flex items-center gap-3 min-w-[160px]">
    {profile?.profilePhoto ? (
      <img
        src={getImageUrl(profile.profilePhoto)}
        alt=""
        className="w-10 h-10 rounded-full object-cover border border-stone-200"
      />
    ) : (
      <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">
        {(profile?.fullName || fallbackName || '?').charAt(0)}
      </div>
    )}
    <div>
      <p className="font-medium text-slate-900">{profile?.fullName || fallbackName || '—'}</p>
      <p className="text-xs text-slate-500">
        {profile?.profileId || (profile ? '—' : 'No matrimony profile')}
      </p>
    </div>
  </div>
);

const CallIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const MatrimonyEnquiries = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    matrimonyService
      .getMyEnquiries()
      .then(({ data }) => setItems(data.data || []))
      .catch(() => toast.error('Failed to load enquiries'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (row) => {
    if (!row?._id) return;
    if (!window.confirm('Delete this enquiry? This cannot be undone.')) return;
    setDeletingId(row._id);
    try {
      await matrimonyService.deleteEnquiry(row._id);
      setItems((prev) => prev.filter((item) => item._id !== row._id));
      toast.success('Enquiry deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete enquiry');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    if (tab === 'sent') {
      return items.filter((row) => row.enquiryType === 'sent' || row.enquiryType === 'both');
    }
    if (tab === 'received') {
      return items.filter((row) => row.enquiryType === 'received' || row.enquiryType === 'both');
    }
    return items;
  }, [items, tab]);

  const columns = useMemo(
    () => [
      {
        key: 'enquiryType',
        header: 'Type',
        sortable: true,
        render: (row) => {
          const label =
            row.enquiryType === 'both'
              ? 'Sent & Received'
              : row.enquiryType === 'received'
                ? 'Received'
                : 'Sent';
          const tone =
            row.enquiryType === 'received'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : row.enquiryType === 'sent'
                ? 'bg-sky-50 text-sky-800 border-sky-200'
                : 'bg-violet-50 text-violet-800 border-violet-200';
          return (
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${tone}`}>
              {label}
            </span>
          );
        },
      },
      {
        key: 'profile',
        header: 'Profile',
        sortable: true,
        sortValue: (row) => counterpartProfile(row)?.fullName || row.enquirerName || '',
        render: (row) => {
          const isReceived = row.enquiryType === 'received' || row.enquiryType === 'both';
          return (
            <ProfileCell
              profile={counterpartProfile(row)}
              fallbackName={isReceived ? row.enquirerName : row.profile?.fullName}
            />
          );
        },
      },
      {
        key: 'enquirerName',
        header: 'From',
        sortable: true,
        render: (row) => (
          <div>
            <p className="text-sm font-medium text-slate-900">{row.enquirerName}</p>
            <p className="text-xs text-slate-500">{row.enquirerPhone}</p>
          </div>
        ),
      },
      {
        key: 'comment',
        header: 'Comment',
        render: (row) => (
          <span className="text-sm text-slate-600 line-clamp-3 max-w-[280px] whitespace-pre-wrap">
            {row.comment}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (row) => (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-stone-100 text-slate-600 border border-stone-200">
            {row.status}
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'Date',
        sortable: true,
        sortValue: (row) => new Date(row.createdAt).getTime(),
        render: (row) => (
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {row.createdAt ? new Date(row.createdAt).toLocaleString('en-IN') : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => {
          const path = profilePathFor(row);
          const phone = callPhoneFor(row);
          const callHref = phone ? `tel:${phone}` : null;

          return (
            <div className="data-table-actions">
              {path ? (
                user ? (
                  <Link to={path} className="data-table-action data-table-action-edit" title="View profile">
                    Profile
                  </Link>
                ) : (
                  <Link
                    to={matrimonyLoginRedirect(path).pathname}
                    state={matrimonyLoginRedirect(path).state}
                    className="data-table-action data-table-action-edit"
                    title="View profile"
                  >
                    Profile
                  </Link>
                )
              ) : (
                <button
                  type="button"
                  className="data-table-action text-slate-400 cursor-not-allowed"
                  onClick={() => toast.error('This person has no matrimony profile to view')}
                >
                  Profile
                </button>
              )}

              {callHref ? (
                <a
                  href={callHref}
                  className="data-table-action data-table-action-edit inline-flex items-center justify-center"
                  title={`Call ${phone}`}
                  aria-label="Call"
                >
                  <CallIcon />
                </a>
              ) : (
                <button
                  type="button"
                  className="data-table-action text-slate-300 cursor-not-allowed inline-flex items-center justify-center"
                  title="No phone number"
                  aria-label="Call unavailable"
                  onClick={() => toast.error('No phone number available')}
                >
                  <CallIcon />
                </button>
              )}

              <button
                type="button"
                className="data-table-action data-table-action-delete inline-flex items-center justify-center disabled:opacity-50"
                title="Delete enquiry"
                aria-label="Delete enquiry"
                disabled={deletingId === row._id}
                onClick={() => handleDelete(row)}
              >
                <DeleteIcon />
              </button>
            </div>
          );
        },
      },
    ],
    [user, deletingId]
  );

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">My Enquiries</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Enquiries you sent and enquiries received on your profile
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={tab === item.id ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-3 sm:p-4">
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          searchPlaceholder="Search enquiries..."
          searchKeys={[
            'enquirerName',
            'enquirerPhone',
            'comment',
            'status',
            'enquiryType',
            'profile.fullName',
            'profile.profileId',
            'enquirerProfile.fullName',
            'enquirerProfile.profileId',
          ]}
          emptyMessage={
            tab === 'received'
              ? 'No enquiries received on your profile yet.'
              : tab === 'sent'
                ? 'No sent enquiries yet. Browse profiles and submit an enquiry while logged in.'
                : 'No enquiries yet. Browse profiles and send an enquiry, or wait for others to contact you.'
          }
        />
      </div>
    </div>
  );
};

export default MatrimonyEnquiries;
