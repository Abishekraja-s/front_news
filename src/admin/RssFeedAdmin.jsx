import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  rssIngestService,
  categoryService,
  authorService,
} from '../services/articleService';
import AdminPageHeader, { StatusBadge } from './AdminPageHeader';
import DataTable from './DataTable';
import { getImageUrl } from '../utils/images';

const emptySource = {
  name: '',
  feedUrl: '',
  category: '',
  author: '',
  tags: '',
  enabled: true,
  autoFetchEnabled: false,
  fetchIntervalMinutes: 60,
  createAsStatus: 'DRAFT',
  maxItemsPerFetch: 20,
  fetchFullContent: true,
  translateToTamil: true,
};

/** Multi-website RSS presets — add as many as you need; auto-fetch runs on each enabled source */
const NEWS_WEBSITE_PRESETS = [
  {
    id: 'india-today',
    label: 'India Today',
    siteUrl: 'https://www.indiatoday.in/',
    feeds: [
      { name: 'India Today — Latest', feedUrl: 'https://www.indiatoday.in/rss/home', tags: 'india-today, latest' },
      { name: 'India Today — India', feedUrl: 'https://www.indiatoday.in/rss/1206578', tags: 'india-today, india' },
      { name: 'India Today — World', feedUrl: 'https://www.indiatoday.in/rss/1206577', tags: 'india-today, world' },
      { name: 'India Today — Business', feedUrl: 'https://www.indiatoday.in/rss/1206574', tags: 'india-today, business' },
      { name: 'India Today — Sports', feedUrl: 'https://www.indiatoday.in/rss/1206550', tags: 'india-today, sports' },
      { name: 'India Today — Technology', feedUrl: 'https://www.indiatoday.in/rss/1206688', tags: 'india-today, technology' },
      { name: 'India Today — South India', feedUrl: 'https://www.indiatoday.in/rss/1207084', tags: 'india-today, south' },
    ],
  },
  {
    id: 'toi',
    label: 'Times of India',
    siteUrl: 'https://timesofindia.indiatimes.com/',
    feeds: [
      { name: 'TOI — Top Stories', feedUrl: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', tags: 'toi, top' },
      { name: 'TOI — India', feedUrl: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms', tags: 'toi, india' },
    ],
  },
  {
    id: 'ndtv',
    label: 'NDTV',
    siteUrl: 'https://www.ndtv.com/',
    feeds: [
      { name: 'NDTV — Top Stories', feedUrl: 'https://feeds.feedburner.com/ndtvnews-top-stories', tags: 'ndtv, top' },
      { name: 'NDTV — Latest', feedUrl: 'https://feeds.feedburner.com/ndtvnews-latest', tags: 'ndtv, latest' },
    ],
  },
  {
    id: 'indian-express',
    label: 'Indian Express',
    siteUrl: 'https://indianexpress.com/',
    feeds: [
      { name: 'Indian Express — Home', feedUrl: 'https://indianexpress.com/feed/', tags: 'indian-express' },
      { name: 'Indian Express — India', feedUrl: 'https://indianexpress.com/section/india/feed/', tags: 'indian-express, india' },
      { name: 'Indian Express — Sports', feedUrl: 'https://indianexpress.com/section/sports/feed/', tags: 'indian-express, sports' },
    ],
  },
  {
    id: 'the-hindu',
    label: 'The Hindu',
    siteUrl: 'https://www.thehindu.com/',
    feeds: [
      { name: 'The Hindu — Home', feedUrl: 'https://www.thehindu.com/feeder/default.rss', tags: 'the-hindu' },
      { name: 'The Hindu — National', feedUrl: 'https://www.thehindu.com/news/national/feeder/default.rss', tags: 'the-hindu, national' },
    ],
  },
  {
    id: 'ht',
    label: 'Hindustan Times',
    siteUrl: 'https://www.hindustantimes.com/',
    feeds: [
      { name: 'HT — India', feedUrl: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', tags: 'hindustan-times, india' },
    ],
  },
  {
    id: 'bbc',
    label: 'BBC India',
    siteUrl: 'https://www.bbc.com/news/world/asia/india',
    feeds: [
      { name: 'BBC — India', feedUrl: 'https://feeds.bbci.co.uk/news/world/asia/india/rss.xml', tags: 'bbc, india' },
    ],
  },
];

const ALL_PRESET_FEEDS = NEWS_WEBSITE_PRESETS.flatMap((site) =>
  site.feeds.map((f) => ({ ...f, siteId: site.id, siteLabel: site.label }))
);

const RssFeedAdmin = () => {
  const [tab, setTab] = useState('sources');
  const [sources, setSources] = useState([]);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptySource);
  const [statusFilter, setStatusFilter] = useState('DRAFT');
  const [selected, setSelected] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [bulkUrls, setBulkUrls] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const loadMeta = useCallback(() => {
    Promise.all([
      categoryService.getAll({ districts: 'false' }),
      authorService.getAllAdmin(),
    ])
      .then(([cRes, aRes]) => {
        setCategories(cRes.data.data || []);
        setAuthors(aRes.data.data || []);
      })
      .catch(() => {});
  }, []);

  const loadSources = useCallback(() => {
    setLoading(true);
    rssIngestService
      .getSources()
      .then(({ data }) => setSources(data.data || []))
      .catch(() => toast.error('Failed to load RSS sources'))
      .finally(() => setLoading(false));
  }, []);

  const loadArticles = useCallback((page = 1) => {
    setLoading(true);
    rssIngestService
      .getArticles({ page, limit: 20, status: statusFilter || undefined })
      .then(({ data }) => {
        setArticles(data.data || []);
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
        setSelected([]);
      })
      .catch(() => toast.error('Failed to load RSS articles'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    loadMeta();
    loadSources();
  }, [loadMeta, loadSources]);

  useEffect(() => {
    if (tab === 'articles') loadArticles(1);
  }, [tab, loadArticles]);

  const resetForm = () => {
    setForm(emptySource);
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (row) => {
    setForm({
      name: row.name || '',
      feedUrl: row.feedUrl || '',
      category: row.category?._id || row.category || '',
      author: row.author?._id || row.author || '',
      tags: Array.isArray(row.tags) ? row.tags.join(', ') : '',
      enabled: row.enabled !== false,
      autoFetchEnabled: Boolean(row.autoFetchEnabled),
      fetchIntervalMinutes: row.fetchIntervalMinutes || 60,
      createAsStatus: row.createAsStatus || 'DRAFT',
      maxItemsPerFetch: row.maxItemsPerFetch || 20,
      fetchFullContent: row.fetchFullContent !== false,
      translateToTamil: row.translateToTamil !== false,
    });
    setEditId(row._id);
    setShowForm(true);
  };

  const handleSaveSource = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.feedUrl.trim() || !form.category || !form.author) {
      return toast.error('Name, feed URL, category and author are required');
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        fetchIntervalMinutes: Number(form.fetchIntervalMinutes) || 60,
        maxItemsPerFetch: Number(form.maxItemsPerFetch) || 20,
      };
      if (editId) await rssIngestService.updateSource(editId, payload);
      else await rssIngestService.createSource(payload);
      toast.success(editId ? 'Source updated' : 'Source added');
      resetForm();
      loadSources();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSource = async (id) => {
    if (!confirm('Delete this RSS source?')) return;
    try {
      await rssIngestService.deleteSource(id);
      toast.success('Deleted');
      loadSources();
    } catch {
      toast.error('Delete failed');
    }
  };

  const defaultCategoryAuthor = () => ({
    category: form.category || categories[0]?._id || '',
    author: form.author || authors[0]?._id || '',
  });

  const createFeedSources = async (feeds, { autoFetch = true } = {}) => {
    if (!categories.length || !authors.length) {
      toast.error('Need at least one category and author');
      return { created: 0, skipped: 0 };
    }
    const { category, author } = defaultCategoryAuthor();
    if (!category || !author) {
      toast.error('Select category and author first');
      return { created: 0, skipped: 0 };
    }
    let created = 0;
    let skipped = 0;
    for (const preset of feeds) {
      try {
        await rssIngestService.createSource({
          name: preset.name,
          feedUrl: preset.feedUrl,
          tags: preset.tags || '',
          category,
          author,
          enabled: true,
          autoFetchEnabled: autoFetch,
          fetchIntervalMinutes: 60,
          createAsStatus: 'DRAFT',
          maxItemsPerFetch: 20,
          fetchFullContent: true,
          translateToTamil: true,
        });
        created += 1;
      } catch {
        skipped += 1;
      }
    }
    return { created, skipped };
  };

  const applyPresetFeed = (preset) => {
    if (!categories.length || !authors.length) {
      return toast.error('Load categories and authors first');
    }
    const { category, author } = defaultCategoryAuthor();
    setForm({
      ...emptySource,
      name: preset.name,
      feedUrl: preset.feedUrl,
      tags: preset.tags || '',
      category,
      author,
      autoFetchEnabled: true,
      fetchIntervalMinutes: 60,
      createAsStatus: 'DRAFT',
      maxItemsPerFetch: 20,
    });
    setEditId(null);
    setShowForm(true);
    toast.success(`${preset.name} loaded — Save to keep`);
  };

  const addWebsiteFeeds = async (site) => {
    if (!confirm(`Add ${site.feeds.length} feeds from ${site.label}?\nAuto-fetch will be ON (drafts).`)) return;
    setSaving(true);
    try {
      const { created, skipped } = await createFeedSources(site.feeds);
      toast.success(`${site.label}: added ${created}, skipped ${skipped}`);
      loadSources();
    } finally {
      setSaving(false);
    }
  };

  const addAllWebsiteFeeds = async () => {
    if (!confirm(`Add ${ALL_PRESET_FEEDS.length} feeds from ${NEWS_WEBSITE_PRESETS.length} websites?\nAuto-fetch ON → articles as Draft.`)) {
      return;
    }
    setSaving(true);
    try {
      const { created, skipped } = await createFeedSources(ALL_PRESET_FEEDS);
      toast.success(`Added ${created} feeds · skipped ${skipped} duplicates`);
      loadSources();
    } finally {
      setSaving(false);
    }
  };

  const addBulkUrls = async () => {
    const lines = bulkUrls
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => /^https?:\/\//i.test(s));
    if (!lines.length) return toast.error('Paste one RSS URL per line');
    if (!categories.length || !authors.length) {
      return toast.error('Need category and author');
    }
    setSaving(true);
    try {
      const feeds = lines.map((feedUrl, i) => {
        let host = 'rss';
        try {
          host = new URL(feedUrl).hostname.replace(/^www\./, '');
        } catch {
          /* ignore */
        }
        return {
          name: `${host} feed ${i + 1}`,
          feedUrl,
          tags: host,
        };
      });
      const { created, skipped } = await createFeedSources(feeds);
      toast.success(`Custom URLs: added ${created}, skipped ${skipped}`);
      setBulkUrls('');
      loadSources();
    } finally {
      setSaving(false);
    }
  };

  const enableAutoFetchAll = async () => {
    if (!sources.length) return;
    setSaving(true);
    try {
      let n = 0;
      for (const s of sources) {
        if (s.autoFetchEnabled && s.enabled) continue;
        await rssIngestService.updateSource(s._id, {
          enabled: true,
          autoFetchEnabled: true,
          fetchIntervalMinutes: s.fetchIntervalMinutes || 60,
        });
        n += 1;
      }
      toast.success(`Auto-fetch enabled on ${n} sources`);
      loadSources();
    } catch {
      toast.error('Failed to update sources');
    } finally {
      setSaving(false);
    }
  };

  const handleFetch = async (sourceId = null) => {
    setFetching(true);
    try {
      const { data } = await rssIngestService.fetchNow(sourceId ? { sourceId } : {});
      toast.success(data.message || 'Fetch completed');
      loadSources();
      if (tab === 'articles') loadArticles(pagination.page || 1);
      else setTab('articles');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Fetch failed');
    } finally {
      setFetching(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await rssIngestService.publishArticle(id);
      toast.success('Published');
      loadArticles(pagination.page || 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Publish failed');
    }
  };

  const handleBulkPublish = async () => {
    if (!selected.length) return toast.error('Select articles first');
    try {
      setBulkBusy(true);
      const { data } = await rssIngestService.bulkPublish(selected);
      toast.success(data.message || 'Published');
      loadArticles(pagination.page || 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk publish failed');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return toast.error('Select articles first');
    if (
      !confirm(
        `Permanently delete ${selected.length} selected imported article(s)? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      setBulkBusy(true);
      const { data } = await rssIngestService.bulkDelete(selected);
      toast.success(data.message || 'Deleted');
      loadArticles(pagination.page || 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk delete failed');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleDeleteByDate = async () => {
    if (!dateFrom && !dateTo) {
      return toast.error('Pick a from and/or to date');
    }
    try {
      setBulkBusy(true);
      const preview = await rssIngestService.deleteByDate({
        from: dateFrom || undefined,
        to: dateTo || undefined,
        status: statusFilter || undefined,
        dryRun: true,
      });
      const count = preview.data?.data?.count ?? 0;
      if (!count) {
        toast.error('No articles match that date range');
        return;
      }
      const rangeLabel = [dateFrom || '…', dateTo || '…'].join(' → ');
      const statusLabel = statusFilter ? ` (${statusFilter})` : '';
      if (
        !confirm(
          `Permanently delete ${count} imported article(s) imported ${rangeLabel}${statusLabel}? This cannot be undone.`
        )
      ) {
        return;
      }
      const { data } = await rssIngestService.deleteByDate({
        from: dateFrom || undefined,
        to: dateTo || undefined,
        status: statusFilter || undefined,
      });
      toast.success(data.message || `Deleted ${data.data?.deleted || 0}`);
      loadArticles(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Date delete failed');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!confirm('Delete this imported article?')) return;
    try {
      await rssIngestService.deleteArticle(id);
      toast.success('Deleted');
      loadArticles(pagination.page || 1);
    } catch {
      toast.error('Delete failed');
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const pageIds = articles.map((a) => a._id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

  const toggleSelectAllPage = () => {
    if (allPageSelected) {
      setSelected((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  const sourceColumns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Source',
        render: (row) => (
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-[11px] text-slate-400 truncate max-w-xs">{row.feedUrl}</p>
          </div>
        ),
      },
      {
        key: 'category',
        header: 'Category',
        render: (row) => row.category?.nameTamil || row.category?.name || '—',
      },
      {
        key: 'author',
        header: 'Author',
        render: (row) => row.author?.name || '—',
      },
      {
        key: 'auto',
        header: 'Auto',
        render: (row) => (
          <span className="text-xs">
            {row.autoFetchEnabled ? `Every ${row.fetchIntervalMinutes || 60}m` : 'Manual'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <StatusBadge active={row.enabled} />,
      },
      {
        key: 'last',
        header: 'Last fetch',
        render: (row) => (
          <div className="text-xs text-slate-500 max-w-[200px]">
            <p>{row.lastFetchAt ? new Date(row.lastFetchAt).toLocaleString('en-IN') : 'Never'}</p>
            <p className={row.lastFetchStatus === 'error' ? 'text-rose-600' : ''}>
              {row.lastFetchMessage || '—'}
            </p>
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="data-table-actions">
            <button
              type="button"
              disabled={fetching || !row.enabled}
              onClick={() => handleFetch(row._id)}
              className="data-table-action data-table-action-edit"
            >
              Fetch
            </button>
            <button type="button" onClick={() => openEdit(row)} className="data-table-action data-table-action-secondary">
              Edit
            </button>
            <button type="button" onClick={() => handleDeleteSource(row._id)} className="data-table-action data-table-action-delete">
              Delete
            </button>
          </div>
        ),
      },
    ],
    [fetching]
  );

  const articleColumns = useMemo(
    () => [
      {
        key: 'sel',
        header: (
          <input
            type="checkbox"
            checked={allPageSelected}
            onChange={toggleSelectAllPage}
            className="rounded border-slate-300"
            title="Select all on this page"
            aria-label="Select all on this page"
          />
        ),
        render: (row) => (
          <input
            type="checkbox"
            checked={selected.includes(row._id)}
            onChange={() => toggleSelect(row._id)}
            className="rounded border-slate-300"
          />
        ),
      },
      {
        key: 'title',
        header: 'Article',
        render: (row) => (
          <div className="flex gap-3 items-start max-w-md">
            {row.featuredImage ? (
              <img
                src={getImageUrl(row.featuredImage)}
                alt=""
                className="w-14 h-10 rounded object-cover border flex-shrink-0"
              />
            ) : null}
            <div>
              <p className="font-medium text-slate-900 line-clamp-2">{row.title}</p>
              <p className="text-[11px] text-slate-400">{row.rssFeed?.name || 'RSS'}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              row.status === 'PUBLISHED'
                ? 'bg-emerald-50 text-emerald-700'
                : row.status === 'PENDING'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-slate-100 text-slate-600'
            }`}
          >
            {row.status}
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'Imported',
        render: (row) => (
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {row.createdAt ? new Date(row.createdAt).toLocaleString('en-IN') : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="data-table-actions">
            {row.status !== 'PUBLISHED' && (
              <button
                type="button"
                onClick={() => handlePublish(row._id)}
                className="data-table-action data-table-action-edit"
              >
                Publish
              </button>
            )}
            <Link
              to={`/admin/articles/edit/${row._id}`}
              className="data-table-action data-table-action-secondary"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => handleDeleteArticle(row._id)}
              className="data-table-action data-table-action-delete"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [selected, allPageSelected]
  );

  return (
    <div>
      <AdminPageHeader
        title="RSS Feed"
        subtitle="Multiple news websites → automatic article fetch → review & publish"
        actionLabel={tab === 'sources' && !showForm ? '+ Add RSS Source' : undefined}
        onAction={() => {
          setShowForm(true);
          setEditId(null);
          setForm(emptySource);
        }}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          ['sources', 'Feed Sources'],
          ['articles', 'Imported Articles'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              tab === key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          disabled={fetching || !sources.length}
          onClick={() => handleFetch()}
          className="ml-auto btn-primary text-sm disabled:opacity-50"
        >
          {fetching ? 'Fetching…' : 'Fetch All Feeds'}
        </button>
      </div>

      {tab === 'sources' && (
        <div className="admin-card mb-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">Multiple news websites</h3>
              <p className="text-xs text-slate-500 mt-1">
                Add feeds from many sites. Enable auto-fetch so articles import automatically as drafts, then publish.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={addAllWebsiteFeeds}
                className="btn-primary text-sm disabled:opacity-50"
              >
                Add all website feeds
              </button>
              <button
                type="button"
                disabled={saving || !sources.length}
                onClick={enableAutoFetchAll}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                Turn ON auto-fetch for all
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-slate-600">Default category (for new feeds)</span>
              <select
                className="admin-input mt-1"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">First category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.nameTamil || c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Default author (for new feeds)</span>
              <select
                className="admin-input mt-1"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              >
                <option value="">First author</option>
                {authors.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            {NEWS_WEBSITE_PRESETS.map((site) => (
              <div key={site.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{site.label}</p>
                    <a
                      href={site.siteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-brand-700 underline"
                    >
                      {site.siteUrl}
                    </a>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => addWebsiteFeeds(site)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100"
                  >
                    Add {site.feeds.length} feeds
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {site.feeds.map((feed) => (
                    <button
                      key={feed.feedUrl}
                      type="button"
                      onClick={() => applyPresetFeed(feed)}
                      className="text-[11px] px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:border-brand-300"
                    >
                      {feed.name.replace(`${site.label} — `, '')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-sm font-medium text-slate-800 mb-1">Paste your own RSS links</h4>
            <p className="text-xs text-slate-500 mb-2">One feed URL per line — any news website RSS/Atom URL.</p>
            <textarea
              className="admin-input font-mono text-xs min-h-[88px]"
              placeholder={'https://example.com/rss.xml\nhttps://another-site.com/feed/'}
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
            />
            <button
              type="button"
              disabled={saving || !bulkUrls.trim()}
              onClick={addBulkUrls}
              className="btn-secondary text-sm mt-2 disabled:opacity-50"
            >
              Add pasted URLs
            </button>
          </div>
        </div>
      )}

      {tab === 'sources' && showForm && (
        <form onSubmit={handleSaveSource} className="admin-card mb-6 space-y-4 max-w-3xl">
          <h2 className="font-semibold text-slate-900">{editId ? 'Edit' : 'New'} RSS Source</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm sm:col-span-2">
              <span className="text-slate-600">Name</span>
              <input
                className="admin-input mt-1"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="BBC World / Hindu Tamil / …"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-slate-600">Feed URL</span>
              <input
                className="admin-input mt-1 font-mono text-xs"
                required
                value={form.feedUrl}
                onChange={(e) => setForm({ ...form, feedUrl: e.target.value })}
                placeholder="https://example.com/rss.xml"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Category</span>
              <select
                className="admin-input mt-1"
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.nameTamil || c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Author</span>
              <select
                className="admin-input mt-1"
                required
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              >
                <option value="">Select author</option>
                {authors.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Create as</span>
              <select
                className="admin-input mt-1"
                value={form.createAsStatus}
                onChange={(e) => setForm({ ...form, createAsStatus: e.target.value })}
              >
                <option value="DRAFT">Draft (review then publish)</option>
                <option value="PENDING">Pending review</option>
                <option value="PUBLISHED">Published immediately</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Max items / fetch</span>
              <input
                type="number"
                min={1}
                max={50}
                className="admin-input mt-1"
                value={form.maxItemsPerFetch}
                onChange={(e) => setForm({ ...form, maxItemsPerFetch: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Auto interval (minutes)</span>
              <input
                type="number"
                min={15}
                max={1440}
                className="admin-input mt-1"
                value={form.fetchIntervalMinutes}
                onChange={(e) => setForm({ ...form, fetchIntervalMinutes: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Tags (comma separated)</span>
              <input
                className="admin-input mt-1"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="rss, world, politics"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                className="rounded border-slate-300"
              />
              Enabled
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.autoFetchEnabled}
                onChange={(e) => setForm({ ...form, autoFetchEnabled: e.target.checked })}
                className="rounded border-slate-300"
              />
              Automatic fetch (server)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.fetchFullContent}
                onChange={(e) => setForm({ ...form, fetchFullContent: e.target.checked })}
                className="rounded border-slate-300"
              />
              Fetch full / big article content (not only RSS description)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.translateToTamil}
                onChange={(e) => setForm({ ...form, translateToTamil: e.target.checked })}
                className="rounded border-slate-300"
              />
              Translate to Tamil (Gemini)
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Opens each story page and pulls the full article body (RSS feeds usually send only a short description). Then translates title + full body to Tamil. Needs Gemini API key in Admin → AEO & GEO (or GEMINI_API_KEY in server .env).
          </p>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Source'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {tab === 'sources' && (
        <DataTable
          columns={sourceColumns}
          data={sources}
          loading={loading}
          searchPlaceholder="Search sources..."
          searchKeys={['name', 'feedUrl']}
          emptyMessage="No RSS sources yet — add a feed URL to start"
        />
      )}

      {tab === 'articles' && (
        <>
          <div className="flex flex-wrap gap-2 mb-3 items-center">
            <select
              className="admin-input w-auto text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="PUBLISHED">Published</option>
            </select>
            <button
              type="button"
              onClick={toggleSelectAllPage}
              disabled={!articles.length || bulkBusy}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {allPageSelected ? 'Clear page' : 'Select page'}
            </button>
            <button
              type="button"
              onClick={handleBulkPublish}
              disabled={!selected.length || bulkBusy}
              className="btn-primary text-sm disabled:opacity-50"
            >
              Publish selected ({selected.length})
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={!selected.length || bulkBusy}
              className="text-sm font-semibold px-3 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
            >
              Delete selected ({selected.length})
            </button>
            <span className="text-xs text-slate-400 ml-auto">
              {pagination.total || 0} imported articles
            </span>
          </div>

          <div className="admin-card mb-4 p-3 flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Imported from</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="admin-input text-sm w-auto"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Imported to</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="admin-input text-sm w-auto"
              />
            </div>
            <button
              type="button"
              onClick={handleDeleteByDate}
              disabled={bulkBusy || (!dateFrom && !dateTo)}
              className="text-sm font-semibold px-3 py-2 rounded-lg border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-50"
            >
              Delete by date
            </button>
            <p className="text-xs text-slate-500 w-full sm:w-auto sm:ml-2">
              Uses the status filter above. Example: Draft + today → delete only today&apos;s drafts.
            </p>
          </div>

          <DataTable
            columns={articleColumns}
            data={articles}
            loading={loading}
            searchPlaceholder="Search imported articles..."
            searchKeys={['title', 'excerpt']}
            emptyMessage="No imported articles — fetch a feed first"
          />
          {pagination.pages > 1 && (
            <div className="flex gap-2 mt-4 justify-center">
              <button
                type="button"
                className="btn-secondary text-sm"
                disabled={pagination.page <= 1}
                onClick={() => loadArticles(pagination.page - 1)}
              >
                Previous
              </button>
              <span className="text-sm text-slate-600 py-2">
                Page {pagination.page} / {pagination.pages}
              </span>
              <button
                type="button"
                className="btn-secondary text-sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => loadArticles(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RssFeedAdmin;
