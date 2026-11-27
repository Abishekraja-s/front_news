import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import toast from 'react-hot-toast';
import {
  articleService,
  categoryService,
  authorService,
  mediaService,
} from '../services/articleService';
import { getMediaUrl } from '../utils/images';
import { getYoutubeEmbedUrl } from '../utils/youtube';
import { ARTICLE_SOCIAL_DEFS } from '../utils/socialLinks';
import ImageUploadField from '../components/ImageUploadField';
import ArticleSocialLinks from '../components/ArticleSocialLinks';
import GeminiGeneratePanel from './GeminiGeneratePanel';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['DRAFT', 'PENDING', 'PUBLISHED', 'SCHEDULED', 'TRASH'];
/** Authors can only draft or submit for admin review */
const AUTHOR_STATUS_OPTIONS = ['DRAFT', 'PENDING'];

const UNDO_ICON_SVG =
  '<svg viewBox="0 0 18 18"><polyline class="ql-stroke" points="3.5 7.5 1.5 9.5 3.5 11.5"/><path class="ql-stroke" fill="none" d="M5.5,9.5 C5.5,9.5 9.5,4.5 14.5,6.5 C16,7.2 16.5,9 16.5,10.5"/></svg>';
const REDO_ICON_SVG =
  '<svg viewBox="0 0 18 18"><polyline class="ql-stroke" points="14.5 7.5 16.5 9.5 14.5 11.5"/><path class="ql-stroke" fill="none" d="M12.5,9.5 C12.5,9.5 8.5,4.5 3.5,6.5 C2,7.2 1.5,9 1.5,10.5"/></svg>';

// Quill only paints toolbar icons that exist in ui/icons
const QuillIcons = Quill.import('ui/icons');
QuillIcons.undo = UNDO_ICON_SVG;
QuillIcons.redo = REDO_ICON_SVG;

const slugFromPath = (path = '') => {
  const cleaned = String(path).replace(/^https?:\/\/[^/]+/i, '').trim();
  const segment = cleaned.split('/').filter(Boolean).pop() || '';
  return segment
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/** URL slug from title (English + Tamil); keep combining marks for Tamil */
const slugFromTitle = (title = '') => {
  const text = String(title || '').trim().toLowerCase();
  let base = text
    .replace(/[^\p{L}\p{M}\p{N}\s-]+/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
  if (!base || base.length < 2 || /^[\s.\-_:!|]+$/u.test(base)) {
    base = text
      .replace(/[^a-z0-9\s-]+/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);
  }
  return base || '';
};

const isWeakSlug = (slug = '') =>
  !slug ||
  slug.length < 2 ||
  !/\p{L}/u.test(slug) ||
  /^rss-[a-z0-9]+$/i.test(slug) ||
  /^article-[a-z0-9]+$/i.test(slug) ||
  /^news-[a-z0-9]+$/i.test(slug) ||
  /^[\s.\-_:!|0-9]+$/u.test(slug);

const buildArticleContentFallback = (preview = {}) => {
  if (preview.content?.trim()) return preview.content;
  const parts = [];
  if (preview.directAnswer) parts.push(`<p><strong>${preview.directAnswer}</strong></p>`);
  if (preview.aiSummary) parts.push(`<p>${preview.aiSummary}</p>`);
  (preview.headings || []).forEach((heading) => {
    parts.push(`<h2>${heading}</h2><p></p>`);
  });
  (preview.faqs || []).forEach((faq) => {
    if (faq?.question && faq?.answer) {
      parts.push(`<h3>${faq.question}</h3><p>${faq.answer}</p>`);
    }
  });
  return parts.join('\n');
};

/** applyMode: 'full' | 'seoAeo' — seoAeo keeps title, excerpt, content, slug unchanged */
const applyGeminiPreviewToForm = (preview, prev, applyMode = 'full') => {
  const ogTitle = preview.ogTitle || preview.metaTitle || prev.ogTitle;
  const ogDescription = preview.ogDescription || preview.metaDescription || prev.ogDescription;
  const jsonLdStr =
    preview.customJsonLd || (preview.jsonLd ? JSON.stringify(preview.jsonLd, null, 2) : prev.customJsonLd);
  const tagsArr = preview.tags?.length
    ? preview.tags
    : [preview.focusKeyword, ...(preview.secondaryKeywords || [])].filter(Boolean);

  const seoAeoFields = {
    seoTitle: preview.metaTitle || prev.seoTitle,
    metaDescription: preview.metaDescription || prev.metaDescription,
    focusKeyword: preview.focusKeyword || prev.focusKeyword,
    secondaryKeywords: (preview.secondaryKeywords || []).join(', '),
    canonicalUrl: preview.canonicalSuggestion || prev.canonicalUrl,
    ogTitle,
    ogDescription,
    twitterTitle: preview.twitterTitle || ogTitle || prev.twitterTitle,
    twitterDescription: preview.twitterDescription || ogDescription || prev.twitterDescription,
    directAnswer: preview.directAnswer || prev.directAnswer,
    aiSummary: preview.aiSummary || prev.aiSummary,
    entities: (preview.entities || []).join(', '),
    aeoHeadings: (preview.headings || []).join(', '),
    faqs: preview.faqs?.length ? preview.faqs : prev.faqs,
    robots: preview.robots || prev.robots,
    customJsonLd: jsonLdStr,
  };

  if (applyMode === 'seoAeo') {
    return { ...prev, ...seoAeoFields };
  }

  return {
    ...prev,
    ...seoAeoFields,
    title: preview.h1 || prev.title,
    slug: preview.slugSuggestion || slugFromPath(preview.canonicalSuggestion) || prev.slug,
    excerpt: preview.excerpt || preview.metaDescription || prev.excerpt,
    content: buildArticleContentFallback(preview) || prev.content,
    tags: tagsArr.length ? tagsArr.join(', ') : prev.tags,
  };
};

const ArticleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthor = user?.role === 'AUTHOR';
  const statusOptions = isAuthor ? AUTHOR_STATUS_OPTIONS : STATUS_OPTIONS;
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [mustReadOptions, setMustReadOptions] = useState([]);
  const mustReadListRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const scrollMustRead = useCallback((dir) => {
    const el = mustReadListRef.current;
    if (!el) return;
    el.scrollBy({ top: dir * 120, behavior: 'smooth' });
  }, []);
  const [audioUploading, setAudioUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    imageAlt: '',
    imageCaption: '',
    category: '',
    district: '',
    author: '',
    tags: '',
    status: 'DRAFT',
    publishedAt: '',
    scheduledAt: '',
    seoTitle: '',
    metaDescription: '',
    focusKeyword: '',
    secondaryKeywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    directAnswer: '',
    aiSummary: '',
    entities: '',
    aeoHeadings: '',
    faqs: [],
    robots: 'index,follow',
    customJsonLd: '',
    isFeatured: false,
    isBreaking: false,
    isLive: false,
    isMustWatch: false,
    mustReadArticles: [],
    audioReader: '',
    youtubeVideoLink: '',
    socialX: '',
    socialInstagram: '',
    socialFacebook: '',
    socialTiktok: '',
  });

  useEffect(() => {
    Promise.all([
      categoryService.getAll({ districts: 'false' }),
      categoryService.getAll({ districts: 'true' }),
      authorService.getAll(),
      articleService.getAll({ limit: 20, page: 1, status: 'PUBLISHED' }),
    ]).then(([catRes, distRes, authRes, articlesRes]) => {
      setCategories(catRes.data.data || []);
      setDistricts(distRes.data.data || []);
      const activeAuthors = authRes.data.data || [];
      // AUTHOR login → only their own byline; admin/editor/reporter → full list
      const ownAuthor = user?._id
        ? activeAuthors.find(
            (a) => String(a.user?._id || a.user || '') === String(user._id)
          )
        : null;
      const listForRole = isAuthor
        ? ownAuthor
          ? [ownAuthor]
          : activeAuthors.filter(
              (a) =>
                String(a.name || '').trim().toLowerCase() ===
                String(user?.name || '').trim().toLowerCase()
            )
        : activeAuthors;
      setAuthors(listForRole);
      if (isAuthor && listForRole[0]?._id) {
        setForm((prev) => ({ ...prev, author: listForRole[0]._id }));
      }
      const rows = articlesRes.data?.data || [];
      setMustReadOptions(rows);
    });
  }, [isEdit, isAuthor, user?._id, user?.name]);

  useEffect(() => {
    if (isEdit) {
      articleService.getById(id).then(({ data }) => {
        const a = data.data;
        if (isAuthor && ['PUBLISHED', 'TRASH'].includes(a.status)) {
          toast.error('Published and Trash articles can only be edited by admin');
          navigate('/admin/articles');
          return;
        }
        const linked = (a.mustReadArticles || []).filter((m) => m && (m._id || m));
        const title = a.title || '';
        const fromTitle = slugFromTitle(title);
        const slug =
          isWeakSlug(a.slug) && fromTitle ? fromTitle : a.slug || fromTitle || '';
        setForm({
          title,
          slug,
          excerpt: a.excerpt || '',
          content: a.content || '',
          featuredImage: a.featuredImage || '',
          imageAlt: a.imageAlt || '',
          imageCaption: a.imageCaption || '',
          category: a.category?._id || a.category || '',
          district: a.district?._id || a.district || '',
          author: a.author?._id || a.author || '',
          tags: (a.tags || []).join(', '),
          status: a.status || 'DRAFT',
          publishedAt: a.publishedAt ? a.publishedAt.slice(0, 16) : '',
          scheduledAt: a.scheduledAt ? a.scheduledAt.slice(0, 16) : '',
          seoTitle: a.seoTitle || '',
          metaDescription: a.metaDescription || '',
          focusKeyword: a.focusKeyword || '',
          secondaryKeywords: (a.secondaryKeywords || []).join(', '),
          canonicalUrl: a.canonicalUrl || '',
          ogTitle: a.ogTitle || '',
          ogDescription: a.ogDescription || '',
          ogImage: a.ogImage || '',
          twitterTitle: a.twitterTitle || '',
          twitterDescription: a.twitterDescription || '',
          twitterImage: a.twitterImage || '',
          directAnswer: a.directAnswer || '',
          aiSummary: a.aiSummary || '',
          entities: (a.entities || []).join(', '),
          aeoHeadings: (a.aeoHeadings || []).join(', '),
          faqs: a.faqs || [],
          robots: a.robots || 'index,follow',
          customJsonLd: a.customJsonLd || '',
          isFeatured: a.isFeatured || false,
          isBreaking: a.isBreaking || false,
          isLive: a.isLive || false,
          isMustWatch: a.isMustWatch || false,
          mustReadArticles: linked.map((m) => String(m._id || m)),
          audioReader: a.audioReader || '',
          youtubeVideoLink: a.youtubeVideoLink || '',
          socialX: a.socialX || '',
          socialInstagram: a.socialInstagram || '',
          socialFacebook: a.socialFacebook || '',
          socialTiktok: a.socialTiktok || '',
        });
        // Keep previously linked articles visible even if they fall outside last-30 list
        const linkedDocs = linked.filter((m) => m && m._id && m.title);
        if (linkedDocs.length) {
          setMustReadOptions((prev) => {
            const ids = new Set(prev.map((x) => String(x._id)));
            const extras = linkedDocs.filter((m) => !ids.has(String(m._id)));
            return extras.length ? [...extras, ...prev] : prev;
          });
        }
      });
    }
  }, [id, isEdit, isAuthor, navigate]);

  const quillRef = useRef(null);

  const syncHistoryButtons = useCallback(() => {
    const editor = quillRef.current?.getEditor?.();
    if (!editor?.history) return;
    const toolbarEl = editor.getModule('toolbar')?.container;
    if (!toolbarEl) return;

    const undoBtn = toolbarEl.querySelector('button.ql-undo');
    const redoBtn = toolbarEl.querySelector('button.ql-redo');
    const undoStack = editor.history.stack?.undo || [];
    const redoStack = editor.history.stack?.redo || [];

    if (undoBtn) {
      if (!undoBtn.querySelector('svg')) undoBtn.innerHTML = UNDO_ICON_SVG;
      undoBtn.disabled = undoStack.length === 0;
      undoBtn.setAttribute('aria-label', 'Undo');
      undoBtn.setAttribute('title', 'Undo');
    }
    if (redoBtn) {
      if (!redoBtn.querySelector('svg')) redoBtn.innerHTML = REDO_ICON_SVG;
      redoBtn.disabled = redoStack.length === 0;
      redoBtn.setAttribute('aria-label', 'Redo');
      redoBtn.setAttribute('title', 'Redo');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let detach = () => {};
    let frames = 0;

    const attach = () => {
      const editor = quillRef.current?.getEditor?.();
      if (!editor) {
        if (frames++ < 120) requestAnimationFrame(attach);
        return;
      }
      if (cancelled) return;
      syncHistoryButtons();
      const onChange = () => syncHistoryButtons();
      editor.on('text-change', onChange);
      editor.on('editor-change', onChange);
      detach = () => {
        editor.off('text-change', onChange);
        editor.off('editor-change', onChange);
      };
    };

    attach();
    return () => {
      cancelled = true;
      detach();
    };
  }, [syncHistoryButtons]);

  const quillModules = useMemo(
    () => ({
      history: {
        delay: 500,
        maxStack: 200,
        userOnly: true,
      },
      toolbar: {
        container: [
          ['undo', 'redo'],
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ font: [] }],
          [{ size: ['small', false, 'large', 'huge'] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ script: 'sub' }, { script: 'super' }],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
          [{ direction: 'rtl' }],
          ['blockquote', 'code-block'],
          ['link', 'image', 'video'],
          ['clean'],
        ],
        handlers: {
          undo() {
            this.quill.history.undo();
          },
          redo() {
            this.quill.history.redo();
          },
        },
      },
    }),
    []
  );

  const quillFormats = useMemo(
    () => [
      'header',
      'font',
      'size',
      'bold',
      'italic',
      'underline',
      'strike',
      'script',
      'color',
      'background',
      'align',
      'direction',
      'list',
      'indent',
      'blockquote',
      'code-block',
      'link',
      'image',
      'video',
    ],
    []
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      if (name === 'title') {
        return {
          ...prev,
          title: value,
          slug: slugFromTitle(value),
        };
      }
      return {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
    });
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setAudioUploading(true);
    try {
      const { data } = await mediaService.uploadAudio(formData);
      setForm((prev) => ({ ...prev, audioReader: data.data?.url || '' }));
      toast.success('Audio uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Audio upload failed');
    } finally {
      setAudioUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e, overrideStatus) => {
    e.preventDefault();
    setLoading(true);

    const nextStatus = overrideStatus || form.status;
    const lockedAuthorId = isAuthor ? authors[0]?._id || form.author : form.author;
    const autoSlug = slugFromTitle(form.title) || form.slug;
    const payload = {
      ...form,
      status: nextStatus,
      // Always send title-based slug (field is disabled / may be ignored by browser)
      slug: autoSlug,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      secondaryKeywords: (form.secondaryKeywords || '').split(',').map((t) => t.trim()).filter(Boolean),
      entities: (form.entities || '').split(',').map((t) => t.trim()).filter(Boolean),
      aeoHeadings: (form.aeoHeadings || '').split(',').map((t) => t.trim()).filter(Boolean),
      faqs: (form.faqs || []).filter((f) => f.question && f.answer),
      category: form.category || undefined,
      district: form.district || undefined,
      // disabled <select> is not submitted — force AUTHOR byline from linked account
      author: lockedAuthorId || undefined,
      mustReadArticles: (form.mustReadArticles || []).map(String).filter(Boolean).slice(0, 10),
    };

    // Empty date strings clear publishedAt in Mongo and hide the article on the site
    if (!payload.publishedAt) delete payload.publishedAt;
    if (nextStatus === 'PUBLISHED' && !payload.publishedAt) {
      payload.publishedAt = new Date().toISOString();
    }

    const successMsg =
      nextStatus === 'PUBLISHED'
        ? 'Published — visible on website'
        : nextStatus === 'PENDING'
          ? 'Submitted for review'
          : nextStatus === 'TRASH'
            ? 'Rejected — moved to Trash'
            : nextStatus === 'DRAFT'
              ? 'Saved as draft'
              : isEdit
                ? 'Article updated'
                : 'Article created';

    try {
      if (isEdit) {
        await articleService.update(id, payload);
      } else {
        await articleService.create(payload);
      }
      toast.success(successMsg);
      navigate('/admin/articles');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{isEdit ? 'Edit Article' : 'Add Article'}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {isAuthor
            ? 'Save as draft or submit for admin review. Admins publish or reject to Trash.'
            : 'Write and publish news content'}
        </p>
      </div>

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <div className="admin-card space-y-4">
              <div>
                <label className={labelClass}>Title *</label>
                <input name="title" value={form.title} onChange={handleChange} required className="admin-input" />
              </div>
              <div>
                <label className={labelClass}>Slug</label>
                <input
                  name="slug"
                  value={form.slug}
                  readOnly
                  disabled
                  className="admin-input bg-slate-50 text-slate-600 cursor-not-allowed"
                  placeholder="Auto from title"
                  title="Slug is generated automatically from the title"
                />
                <p className="text-[11px] text-slate-500 mt-1">Auto-updated from title (not editable)</p>
              </div>
              <div>
                <label className={labelClass}>Short Description</label>
                <textarea name="excerpt" value={form.excerpt} onChange={handleChange} rows={2} className="admin-input" />
              </div>
            </div>
            <div className="admin-card">
              <label className={labelClass}>Content *</label>
              <div className="article-editor">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={form.content}
                  onChange={(val) => {
                    setForm((p) => ({ ...p, content: val }));
                    requestAnimationFrame(syncHistoryButtons);
                  }}
                  modules={quillModules}
                  formats={quillFormats}
                />
              </div>
            </div>

            {!isAuthor && (
              <>
                <GeminiGeneratePanel
                  mode="article"
                  compact
                  initialTopic={form.title}
                  articleId={id || null}
                  excerpt={form.excerpt}
                  content={form.content}
                  pageType="article"
                  onApplied={(preview, applyMode = 'full') => {
                    setForm((p) => applyGeminiPreviewToForm(preview, p, applyMode));
                  }}
                />

                <div className="admin-card space-y-3">
                  <h3 className="font-semibold text-slate-900">AEO / GEO fields</h3>
                  <textarea name="directAnswer" value={form.directAnswer} onChange={handleChange} rows={2} className="admin-input" placeholder="Direct answer (AEO)" />
                  <textarea name="aiSummary" value={form.aiSummary} onChange={handleChange} rows={2} className="admin-input" placeholder="AI summary (GEO)" />
                  <input name="entities" value={form.entities} onChange={handleChange} className="admin-input" placeholder="Entities (comma-separated)" />
                  <input name="aeoHeadings" value={form.aeoHeadings} onChange={handleChange} className="admin-input" placeholder="Question headings (comma-separated)" />
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="admin-card space-y-4">
              <h3 className="font-semibold text-slate-900">{isAuthor ? 'Submit' : 'Publish'}</h3>
              <div>
                <label className={labelClass}>Status</label>
                {isAuthor ? (
                  <input
                    type="text"
                    readOnly
                    value={form.status === 'PENDING' ? 'PENDING (awaiting review)' : form.status}
                    className="admin-input bg-slate-50 text-slate-700"
                  />
                ) : (
                  <select name="status" value={form.status} onChange={handleChange} className="admin-input">
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className={labelClass}>Category *</label>
                <select name="category" value={form.category} onChange={handleChange} required className="admin-input">
                  <option value="">Select</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.nameTamil || c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>District</label>
                <select name="district" value={form.district} onChange={handleChange} className="admin-input">
                  <option value="">None</option>
                  {districts.map((d) => (
                    <option key={d._id} value={d._id}>{d.nameTamil || d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Author *</label>
                <select
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                  required
                  disabled={isAuthor}
                  className="admin-input disabled:bg-slate-50 disabled:text-slate-700"
                >
                  {!isAuthor && <option value="">Select</option>}
                  {authors.map((a) => (
                    <option key={a._id} value={a._id}>{a.name}</option>
                  ))}
                </select>
                {isAuthor && (
                  <p className="text-[11px] text-slate-500 mt-1">Your author byline (locked to your account).</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Must Read</label>
                <p className="text-[11px] text-slate-500 mb-1.5">
                  Select up to 10 from the last 20 published articles (scroll to see all).
                </p>
                <div className="relative rounded-xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => scrollMustRead(-1)}
                    aria-label="Scroll Must Read list up"
                    className="absolute top-1 right-1 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md
                      bg-slate-100 text-slate-600 border border-slate-200
                      hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path d="M10 6l6 8H4l6-8z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollMustRead(1)}
                    aria-label="Scroll Must Read list down"
                    className="absolute bottom-1 right-1 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md
                      bg-slate-100 text-slate-600 border border-slate-200
                      hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path d="M10 14L4 6h12l-6 8z" />
                    </svg>
                  </button>
                  <div
                    ref={mustReadListRef}
                    className="must-read-scroll h-52 overflow-y-auto overscroll-contain py-2 pr-9 pl-2 space-y-1.5"
                  >
                    {mustReadOptions.filter((a) => String(a._id) !== String(id)).length === 0 ? (
                      <p className="text-xs text-slate-400 px-1">No published articles available yet.</p>
                    ) : (
                      mustReadOptions
                        .filter((a) => String(a._id) !== String(id))
                        .map((a) => {
                          const checked = (form.mustReadArticles || []).includes(String(a._id));
                          const atLimit =
                            !checked && (form.mustReadArticles || []).length >= 10;
                          return (
                            <label
                              key={a._id}
                              className={`flex items-start gap-2 text-sm text-slate-700 px-1 py-0.5 rounded hover:bg-stone-50 cursor-pointer ${
                                atLimit ? 'opacity-50' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="mt-0.5 rounded border-slate-300 text-brand-600 shrink-0"
                                checked={checked}
                                disabled={atLimit}
                                onChange={() => {
                                  setForm((prev) => {
                                    const cur = (prev.mustReadArticles || []).map(String);
                                    const next = checked
                                      ? cur.filter((x) => x !== String(a._id))
                                      : cur.length >= 10
                                        ? cur
                                        : [...cur, String(a._id)];
                                    return { ...prev, mustReadArticles: next };
                                  });
                                }}
                              />
                              <span className="leading-snug line-clamp-2">{a.title}</span>
                            </label>
                          );
                        })
                    )}
                  </div>
                </div>
                {(form.mustReadArticles || []).length > 0 && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    {(form.mustReadArticles || []).length} selected
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>Tags (comma separated)</label>
                <input name="tags" value={form.tags} onChange={handleChange} className="admin-input" />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} className="rounded border-slate-300 text-brand-600" />
                  Latest
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="isBreaking" checked={form.isBreaking} onChange={handleChange} className="rounded border-slate-300 text-brand-600" />
                  Breaking
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="isLive" checked={form.isLive} onChange={handleChange} className="rounded border-slate-300 text-brand-600" />
                  Live
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="isMustWatch" checked={form.isMustWatch} onChange={handleChange} className="rounded border-slate-300 text-brand-600" />
                  Must Watch
                </label>
              </div>
            </div>

            <div className="admin-card space-y-3">
              <h3 className="font-semibold text-slate-900">Audio Reader</h3>
              <p className="text-xs text-slate-500">
                Upload an MP3/audio file, or leave empty — readers can still use Listen (browser voice) on the article page.
              </p>
              <input
                name="audioReader"
                value={form.audioReader}
                onChange={handleChange}
                className="admin-input"
                placeholder="Audio URL (upload or paste link)"
              />
              <div className="flex flex-wrap items-center gap-2">
                <label className="btn-secondary text-sm py-2 px-3 cursor-pointer">
                  {audioUploading ? 'Uploading…' : 'Upload audio file'}
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                    className="hidden"
                    disabled={audioUploading}
                    onChange={handleAudioUpload}
                  />
                </label>
                {form.audioReader && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, audioReader: '' }))}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove audio
                  </button>
                )}
              </div>
              {form.audioReader && (
                <audio controls preload="metadata" className="w-full" src={getMediaUrl(form.audioReader)}>
                  Your browser does not support audio playback.
                </audio>
              )}
            </div>

            <div className="admin-card space-y-4 min-w-0">
              <div>
                <h3 className="font-semibold text-slate-900">YouTube &amp; Social links</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Paste a link — preview card appears below (same style for every platform).
                </p>
              </div>
              <div className="min-w-0 space-y-2">
                <label className="block text-xs font-medium text-slate-600">YouTube Video</label>
                <input
                  name="youtubeVideoLink"
                  value={form.youtubeVideoLink}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  inputMode="url"
                  autoComplete="off"
                />
                {form.youtubeVideoLink.trim() && !getYoutubeEmbedUrl(form.youtubeVideoLink) && (
                  <p className="text-xs text-rose-600">
                    Invalid YouTube URL — video will not show on the article.
                  </p>
                )}
                {getYoutubeEmbedUrl(form.youtubeVideoLink) && (
                  <div className="min-w-0 overflow-hidden">
                    <ArticleSocialLinks
                      article={{
                        youtubeVideoLink: form.youtubeVideoLink,
                        featuredImage: form.featuredImage,
                        ogImage: form.ogImage,
                        slug: form.slug || 'preview',
                      }}
                      includeIds={['youtube']}
                      hideHeading
                      className="!mb-0"
                    />
                  </div>
                )}
              </div>
              {ARTICLE_SOCIAL_DEFS.map((def) => (
                <div key={def.key} className="min-w-0 space-y-2">
                  <label className="block text-xs font-medium text-slate-600">{def.label}</label>
                  <input
                    name={def.key}
                    value={form[def.key]}
                    onChange={handleChange}
                    className="admin-input"
                    placeholder={def.placeholder}
                    inputMode="url"
                    autoComplete="off"
                  />
                  {String(form[def.key] || '').trim() && (
                    <div className="min-w-0 overflow-hidden">
                      <ArticleSocialLinks
                        article={{
                          [def.key]: form[def.key],
                          featuredImage: form.featuredImage,
                          ogImage: form.ogImage,
                          slug: form.slug || 'preview',
                        }}
                        includeIds={[def.id]}
                        hideHeading
                        className="!mb-0"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="admin-card space-y-3">
              <h3 className="font-semibold text-slate-900">Featured Image</h3>
              <ImageUploadField
                value={form.featuredImage}
                onChange={(url) => setForm((prev) => ({ ...prev, featuredImage: url }))}
                placeholder="Image URL"
                seed={form.slug || id || 'featured'}
              />
              <input name="imageAlt" value={form.imageAlt} onChange={handleChange} className="admin-input" placeholder="Alt text" />
              <input name="imageCaption" value={form.imageCaption} onChange={handleChange} className="admin-input" placeholder="Caption" />
            </div>

            {!isAuthor && (
              <div className="admin-card space-y-3">
                <h3 className="font-semibold text-slate-900">SEO</h3>
                <input name="seoTitle" value={form.seoTitle} onChange={handleChange} className="admin-input" placeholder="SEO Title" />
                <textarea name="metaDescription" value={form.metaDescription} onChange={handleChange} rows={2} className="admin-input" placeholder="Meta Description" />
                <input name="focusKeyword" value={form.focusKeyword} onChange={handleChange} className="admin-input" placeholder="Focus Keyword" />
                <input name="secondaryKeywords" value={form.secondaryKeywords} onChange={handleChange} className="admin-input" placeholder="Secondary keywords" />
                <input name="canonicalUrl" value={form.canonicalUrl} onChange={handleChange} className="admin-input" placeholder="Canonical URL" />
                <input name="ogTitle" value={form.ogTitle} onChange={handleChange} className="admin-input" placeholder="OG Title" />
                <textarea name="ogDescription" value={form.ogDescription} onChange={handleChange} rows={2} className="admin-input" placeholder="OG Description" />
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-white/95 backdrop-blur border-t border-slate-200 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
          {isAuthor ? (
            <>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'DRAFT')}
                disabled={loading}
                className="btn-secondary w-full sm:w-auto"
              >
                {loading ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'PENDING')}
                disabled={loading}
                className="btn-primary w-full sm:w-auto"
              >
                {loading ? 'Submitting…' : 'Submit for Review'}
              </button>
            </>
          ) : (
            <>
              <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={(e) => handleSubmit(e, 'DRAFT')} disabled={loading} className="btn-secondary w-full sm:w-auto">
                Save Draft
              </button>
              <button type="button" onClick={(e) => handleSubmit(e, 'PENDING')} disabled={loading} className="btn-secondary w-full sm:w-auto">
                Submit for Review
              </button>
              {form.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'TRASH')}
                  disabled={loading}
                  className="w-full sm:w-auto text-sm font-semibold px-4 py-2.5 rounded-lg border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-50"
                >
                  Reject → Trash
                </button>
              )}
              <button type="button" onClick={(e) => handleSubmit(e, 'PUBLISHED')} disabled={loading} className="btn-primary w-full sm:w-auto">
                {form.status === 'PENDING' ? 'Accept & Publish' : 'Publish'}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default ArticleForm;
