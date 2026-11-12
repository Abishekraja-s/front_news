import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminPageHeader from './AdminPageHeader';
import { pageContentService } from '../services/articleService';

const EMPTY = {
  pageTitle: '',
  intro: '',
  contactEmail: '',
  agreementCheckboxText: '',
  enquiryAgreementText: '',
  sections: [{ heading: '', body: '' }],
};

const Field = ({ label, value, onChange, type = 'text', rows, hint }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
      {label}
    </label>
    {type === 'textarea' ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows || 4}
        className="admin-input w-full"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="admin-input w-full"
      />
    )}
    {hint ? <p className="text-xs text-slate-500 mt-1">{hint}</p> : null}
  </div>
);

const StaticLegalPageEditor = () => {
  const { slug } = useParams();
  const [form, setForm] = useState(EMPTY);
  const [pageTitle, setPageTitle] = useState('');
  const [publicPath, setPublicPath] = useState('');
  const [hasAgreement, setHasAgreement] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    pageContentService
      .getLegalAdmin(slug)
      .then(({ data }) => {
        const page = data.data;
        setForm({ ...EMPTY, ...(page.content || {}) });
        setPageTitle(page.title || page.content?.pageTitle || slug);
        setPublicPath(page.meta?.path || `/${slug}`);
        setHasAgreement(Boolean(page.meta?.hasAgreementText));
        setIsPublished(page.isPublished !== false);
      })
      .catch(() => toast.error('Failed to load page content'))
      .finally(() => setLoading(false));
  }, [slug]);

  const updateSection = (index, key, value) => {
    setForm((prev) => {
      const sections = [...(prev.sections || [])];
      sections[index] = { ...sections[index], [key]: value };
      return { ...prev, sections };
    });
  };

  const addSection = () => {
    setForm((prev) => ({
      ...prev,
      sections: [...(prev.sections || []), { heading: '', body: '' }],
    }));
  };

  const removeSection = (index) => {
    setForm((prev) => ({
      ...prev,
      sections: (prev.sections || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await pageContentService.saveLegal(slug, {
        title: pageTitle,
        content: form,
        isPublished,
      });
      setForm({ ...EMPTY, ...(data.data?.content || form) });
      toast.success(data.message || 'Saved');
    } catch (err) {
      const msg =
        err.response?.data?.errors?.join?.(', ') ||
        err.response?.data?.message ||
        'Save failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500 py-12 text-center">Loading…</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      <AdminPageHeader
        title={pageTitle || 'Edit page'}
        subtitle="Update public page content shown on the website"
      />

      <div className="admin-card space-y-4 p-5">
        <Field label="Browser / admin title" value={pageTitle} onChange={setPageTitle} />
        <Field
          label="Page heading"
          value={form.pageTitle}
          onChange={(v) => setForm((p) => ({ ...p, pageTitle: v }))}
        />
        <Field
          label="Intro paragraph"
          type="textarea"
          rows={3}
          value={form.intro}
          onChange={(v) => setForm((p) => ({ ...p, intro: v }))}
        />
        <Field
          label="Contact email (optional links in body)"
          type="email"
          value={form.contactEmail}
          onChange={(v) => setForm((p) => ({ ...p, contactEmail: v }))}
        />
        {hasAgreement || form.agreementCheckboxText || form.enquiryAgreementText ? (
          <>
            <Field
              label="Registration checkbox text"
              type="textarea"
              rows={3}
              value={form.agreementCheckboxText}
              onChange={(v) => setForm((p) => ({ ...p, agreementCheckboxText: v }))}
              hint="Shown on Seller / Matrimony registration forms"
            />
            {slug === 'marketplace-disclaimer' || slug === 'matrimony-disclaimer' ? (
              <Field
                label="Enquiry form checkbox text"
                type="textarea"
                rows={3}
                value={form.enquiryAgreementText}
                onChange={(v) => setForm((p) => ({ ...p, enquiryAgreementText: v }))}
                hint="Shown on enquiry forms before submit"
              />
            ) : null}
          </>
        ) : null}
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="rounded border-slate-300 text-brand-600"
          />
          Published (visible on the website)
        </label>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Sections
          </h2>
          <button type="button" onClick={addSection} className="btn-secondary text-sm px-3 py-1.5">
            + Add section
          </button>
        </div>

        {(form.sections || []).map((section, index) => (
          <div key={index} className="admin-card space-y-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-400">Section {index + 1}</span>
              {(form.sections || []).length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  className="text-xs text-rose-600 font-medium hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            <Field
              label="Heading"
              value={section.heading}
              onChange={(v) => updateSection(index, 'heading', v)}
            />
            <Field
              label="Body"
              type="textarea"
              rows={6}
              value={section.body}
              onChange={(v) => updateSection(index, 'body', v)}
              hint="Blank line = new paragraph. Use • for bullet lines."
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save page'}
        </button>
        {publicPath ? (
          <a
            href={publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary px-6 py-2.5"
          >
            View page
          </a>
        ) : null}
      </div>
    </form>
  );
};

export default StaticLegalPageEditor;
