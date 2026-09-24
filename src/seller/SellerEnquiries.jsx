import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { marketplaceService } from '../services/articleService';
import DataTable from '../admin/DataTable';

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

const SellerEnquiries = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    marketplaceService
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
      await marketplaceService.deleteEnquiry(row._id);
      setItems((prev) => prev.filter((item) => item._id !== row._id));
      toast.success('Enquiry deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete enquiry');
    } finally {
      setDeletingId(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'buyerName',
        header: 'Buyer',
        sortable: true,
        render: (row) => (
          <div className="min-w-[140px]">
            <p className="font-medium text-slate-900">{row.buyerName}</p>
            <p className="text-xs text-slate-500 truncate max-w-[180px]">{row.buyerEmail}</p>
          </div>
        ),
      },
      {
        key: 'buyerPhone',
        header: 'Mobile',
        sortable: true,
        render: (row) => {
          const phone = String(row.buyerPhone || '').replace(/\D/g, '');
          return (
            <span className="text-sm text-slate-700 whitespace-nowrap tabular-nums">
              {phone || '—'}
            </span>
          );
        },
      },
      {
        key: 'product',
        header: 'Product',
        sortable: true,
        sortValue: (row) => row.product?.title || '',
        render: (row) => <span className="text-sm text-teal-700 font-medium">{row.product?.title || '—'}</span>,
      },
      {
        key: 'message',
        header: 'Message',
        render: (row) => <span className="text-sm text-slate-600 line-clamp-2 max-w-[240px]">{row.message}</span>,
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
            {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN') : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => {
          const phone = String(row.buyerPhone || '').replace(/\D/g, '');
          const callHref = phone ? `tel:${phone}` : null;

          return (
            <div className="data-table-actions">
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
                  className="data-table-action text-slate-400 cursor-not-allowed inline-flex items-center justify-center"
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, deletingId]
  );

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Enquiries</h1>
        <p className="text-sm text-slate-500 mt-0.5">Messages from customers interested in your products</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-3 sm:p-4">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          searchPlaceholder="Search enquiries..."
          searchKeys={['buyerName', 'buyerEmail', 'buyerPhone', 'message', 'status']}
          onSearch={(row, q) => {
            const hay = [
              row.buyerName,
              row.buyerEmail,
              row.buyerPhone,
              row.message,
              row.status,
              row.product?.title,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();
            return hay.includes(q.toLowerCase());
          }}
          emptyMessage="No enquiries yet"
          pageSize={10}
        />
      </div>
    </div>
  );
};

export default SellerEnquiries;
