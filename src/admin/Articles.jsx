import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { articleService } from '../services/articleService';
import toast from 'react-hot-toast';
import { formatDateTime } from '../utils/helpers';
import AdminPageHeader, { StatusBadge } from './AdminPageHeader';
import DataTable from './DataTable';
import { getArticlePath } from '../utils/articlePaths';
import { useAdminPermissions } from '../context/AdminPermissionsContext';
import { useAuth } from '../context/AuthContext';

const ALL_STATUS_TABS = ['', 'PUBLISHED', 'DRAFT', 'PENDING', 'SCHEDULED', 'TRASH'];
/** Author flow: draft → pending review → admin publish or trash */
const AUTHOR_STATUS_TABS = ['', 'DRAFT', 'PENDING', 'PUBLISHED', 'TRASH'];

const Articles = () => {
  const { user } = useAuth();
  const isAuthor = user?.role === 'AUTHOR';
  const { canDo } = useAdminPermissions();
  const canCreate = canDo('articles-create') || isAuthor;
  const canEditAdmin = !isAuthor && canDo('articles-edit');
  const canDelete = canDo('articles-delete');
  const canReview = !isAuthor && (canDo('articles-edit') || canDelete);
  /** Authors may edit only drafts / pending — not published or trash */
  const authorCanEditStatus = (s) => ['DRAFT', 'PENDING'].includes(s);
  const statusTabs = isAuthor ? AUTHOR_STATUS_TABS : ALL_STATUS_TABS;
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => {
    if (isAuthor && status && !['DRAFT', 'PENDING', 'PUBLISHED', 'TRASH'].includes(status)) {
      setStatus('');
    }
  }, [isAuthor, status]);

  const fetchArticles = useCallback(() => {
    setLoading(true);
    const params = { limit: 100, ...(status ? { status } : {}) };
    articleService
      .getAll(params)
      .then(({ data }) => setArticles(data.data || []))
      .catch(() => toast.error('Failed to load articles'))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleDelete = useCallback(
    async (row) => {
      const id = row?._id || row;
      const isTrash = row?.status === 'TRASH';
      const ok = window.confirm(
        isTrash
          ? 'Permanently delete this article? This cannot be undone.'
          : 'Move this article to trash?'
      );
      if (!ok) return;

      setDeletingId(id);
      try {
        await articleService.delete(id, isTrash);
        setArticles((prev) => prev.filter((a) => a._id !== id));
        toast.success(isTrash ? 'Article permanently deleted' : 'Article moved to trash');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Delete failed');
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

  const handleAcceptPublish = useCallback(async (row) => {
    if (!window.confirm(`Accept and publish “${row.title}”?`)) return;
    setReviewingId(row._id);
    try {
      await articleService.update(row._id, {
        status: 'PUBLISHED',
        publishedAt: new Date().toISOString(),
      });
      toast.success('Accepted — published');
      fetchArticles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Publish failed');
    } finally {
      setReviewingId(null);
    }
  }, [fetchArticles]);

  const handleRejectTrash = useCallback(async (row) => {
    if (!window.confirm(`Reject “${row.title}” and move to Trash?`)) return;
    setReviewingId(row._id);
    try {
      await articleService.delete(row._id, false);
      toast.success('Rejected — moved to Trash');
      fetchArticles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject failed');
    } finally {
      setReviewingId(null);
    }
  }, [fetchArticles]);

  const handleSubmitForReview = useCallback(async (row) => {
    if (!window.confirm(`Submit “${row.title}” for admin review?`)) return;
    setReviewingId(row._id);
    try {
      await articleService.update(row._id, { status: 'PENDING' });
      toast.success('Submitted for review');
      fetchArticles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setReviewingId(null);
    }
  }, [fetchArticles]);

  const columns = useMemo(
    () => [
      {
        key: 'title',
        header: 'Title',
        sortable: true,
        cellClassName: 'max-w-xs sm:max-w-md',
        render: (row) => (
          <p className="font-medium text-slate-900 line-clamp-2 leading-snug">{row.title}</p>
        ),
      },
      {
        key: 'category.nameTamil',
        header: 'Category',
        sortable: true,
        sortValue: (row) => row.category?.nameTamil || row.category?.name || '',
        render: (row) => (
          <span className="text-slate-600 whitespace-nowrap">
            {row.category?.nameTamil || row.category?.name || '-'}
          </span>
        ),
      },
      {
        key: 'author.name',
        header: 'Author',
        sortable: true,
        sortValue: (row) => row.author?.name || '',
        render: (row) => row.author?.name || '-',
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'publishedAt',
        header: 'Published',
        sortable: true,
        sortValue: (row) => (row.publishedAt ? new Date(row.publishedAt).getTime() : 0),
        render: (row) => (
          <span className="text-slate-500 whitespace-nowrap text-xs sm:text-sm">
            {row.publishedAt ? formatDateTime(row.publishedAt) : '-'}
          </span>
        ),
      },
      {
        key: 'views',
        header: 'Views',
        sortable: true,
        sortValue: (row) => row.views || 0,
        render: (row) => (
          <span className="font-medium tabular-nums">
            {row.views?.toLocaleString('en-IN') || 0}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="data-table-actions">
            <Link
              to={`/admin/articles/preview/${row._id}`}
              className="data-table-action data-table-action-secondary"
              title="Preview article"
            >
              View
            </Link>
            {row.slug && row.status === 'PUBLISHED' && (
              <a
                href={getArticlePath(row)}
                target="_blank"
                rel="noopener noreferrer"
                className="data-table-action data-table-action-secondary"
                title="Open on public website"
              >
                Site
              </a>
            )}
            {canReview && row.status === 'PENDING' && (
              <>
                <button
                  type="button"
                  disabled={reviewingId === row._id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAcceptPublish(row);
                  }}
                  className="data-table-action data-table-action-edit disabled:opacity-50"
                  title="Accept and publish"
                >
                  {reviewingId === row._id ? '…' : 'Accept'}
                </button>
                <button
                  type="button"
                  disabled={reviewingId === row._id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRejectTrash(row);
                  }}
                  className="data-table-action data-table-action-delete disabled:opacity-50"
                  title="Reject to Trash"
                >
                  Reject
                </button>
              </>
            )}
            {isAuthor && row.status === 'DRAFT' && (
              <button
                type="button"
                disabled={reviewingId === row._id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmitForReview(row);
                }}
                className="data-table-action data-table-action-edit disabled:opacity-50"
                title="Submit draft for admin review"
              >
                {reviewingId === row._id ? '…' : 'Submit for Review'}
              </button>
            )}
            {(canEditAdmin || (isAuthor && authorCanEditStatus(row.status))) && (
              <Link
                to={`/admin/articles/edit/${row._id}`}
                className="data-table-action data-table-action-edit"
              >
                Edit
              </Link>
            )}
            {canDelete && (
              <button
                type="button"
                disabled={deletingId === row._id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(row);
                }}
                className="data-table-action data-table-action-delete disabled:opacity-50"
              >
                {deletingId === row._id
                  ? '…'
                  : row.status === 'TRASH'
                    ? 'Delete forever'
                    : 'Delete'}
              </button>
            )}
          </div>
        ),
      },
    ],
    [
      handleDelete,
      handleAcceptPublish,
      handleRejectTrash,
      handleSubmitForReview,
      deletingId,
      reviewingId,
      canEditAdmin,
      canDelete,
      canReview,
      isAuthor,
    ]
  );

  const statusToolbar = (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide max-w-full">
      {statusTabs.map((s) => (
        <button
          key={s || 'all'}
          type="button"
          onClick={() => setStatus(s)}
          className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
            status === s
              ? 'bg-brand-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {s || 'All'}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <AdminPageHeader
        title="Articles"
        subtitle={
          isAuthor
            ? 'Your articles · Draft → Submit for Review · Admin publishes or rejects to Trash'
            : 'Manage articles · Pending: Accept to publish or Reject to Trash'
        }
        actionLabel={canCreate ? '+ Add Article' : undefined}
        actionTo={canCreate ? '/admin/articles/create' : undefined}
      />

      <DataTable
        columns={columns}
        data={articles}
        loading={loading}
        searchPlaceholder="Search articles..."
        searchKeys={['title', 'author.name', 'category.nameTamil', 'category.name', 'status']}
        emptyMessage="No articles found"
        emptyAction={
          canCreate ? (
            <Link to="/admin/articles/create" className="btn-primary mt-4 inline-flex text-sm">
              Create first article
            </Link>
          ) : null
        }
        toolbar={statusToolbar}
        pageSize={10}
      />
    </div>
  );
};

export default Articles;
