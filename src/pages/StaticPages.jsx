import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { pageContentService } from '../services/articleService';

const StaticPage = ({ title, children }) => (
  <>
    <Helmet>
      <title>{title} - The Great India News</title>
    </Helmet>
    <div className="container-news py-8 max-w-3xl">
      <h1 className="text-3xl font-bold font-headline mb-6">{title}</h1>
      <div className="text-gray-700 leading-relaxed space-y-4">{children}</div>
    </div>
  </>
);

const splitParagraphs = (text = '') =>
  String(text)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

const renderBodyLines = (text, contactEmail) => {
  const email = contactEmail || '';
  const parts = String(text)
    .replace(/Privacy Policy/gi, '@@PRIVACY@@')
    .replace(email ? new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi') : /$^/, '@@EMAIL@@')
    .split(/(@@PRIVACY@@|@@EMAIL@@)/g);

  return parts.map((part, i) => {
    if (part === '@@PRIVACY@@') {
      return (
        <Link key={i} to="/privacy-policy" className="text-brand-600 hover:underline">
          Privacy Policy
        </Link>
      );
    }
    if (part === '@@EMAIL@@' && email) {
      return (
        <a key={i} href={`mailto:${email}`} className="text-brand-600 hover:underline">
          {email}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const EditableLegalPage = ({ slug, fallbackTitle }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    pageContentService
      .getPublicLegal(slug)
      .then(({ data }) => {
        if (alive) setContent(data.data?.content || null);
      })
      .catch(() => {
        if (alive) setContent(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  const title = content?.pageTitle || fallbackTitle || 'Page';
  const email = content?.contactEmail || '';

  if (loading) {
    return (
      <StaticPage title={title}>
        <p className="text-slate-500">Loading…</p>
      </StaticPage>
    );
  }

  if (!content) {
    return (
      <StaticPage title={title}>
        <p>Content is not available right now. Please try again later.</p>
      </StaticPage>
    );
  }

  return (
    <StaticPage title={title}>
      {content.intro ? <p>{content.intro}</p> : null}
      {(content.sections || []).map((section, idx) => (
        <div key={`${section.heading}-${idx}`}>
          {section.heading ? <h2 className="text-xl font-bold mt-8 mb-3">{section.heading}</h2> : null}
          {splitParagraphs(section.body).map((para, pIdx) => {
            const lines = para.split('\n').map((l) => l.trim()).filter(Boolean);
            const isList = lines.length > 1 && lines.every((l) => /^[•\-*]/.test(l));
            if (isList) {
              return (
                <ul key={pIdx} className="list-disc pl-6 space-y-2">
                  {lines.map((line, li) => (
                    <li key={li}>{renderBodyLines(line.replace(/^[•\-*]\s*/, ''), email)}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={pIdx} className={pIdx > 0 ? 'mt-3' : undefined}>
                {renderBodyLines(para, email)}
              </p>
            );
          })}
        </div>
      ))}
    </StaticPage>
  );
};

export const Contact = () => <EditableLegalPage slug="contact" fallbackTitle="Contact Us" />;
export const PrivacyPolicy = () => (
  <EditableLegalPage slug="privacy-policy" fallbackTitle="Privacy Policy" />
);
export const Terms = () => <EditableLegalPage slug="terms" fallbackTitle="Terms of Use" />;
export const EditorialPolicy = () => (
  <EditableLegalPage slug="editorial-policy" fallbackTitle="Editorial Policy" />
);
export const CorrectionPolicy = () => (
  <EditableLegalPage slug="correction-policy" fallbackTitle="Correction Policy" />
);
export const Copyright = () => <EditableLegalPage slug="copyright" fallbackTitle="Copyright" />;
export const Grievance = () => (
  <EditableLegalPage slug="grievance" fallbackTitle="Grievance Redressal" />
);
export const Disclaimer = () => <EditableLegalPage slug="disclaimer" fallbackTitle="Disclaimer" />;
export const GdprPrivacyPolicy = () => (
  <EditableLegalPage slug="gdpr-privacy-policy" fallbackTitle="GDPR Privacy Policy" />
);
export const MarketplaceDisclaimer = () => (
  <EditableLegalPage slug="marketplace-disclaimer" fallbackTitle="Marketplace Disclaimer" />
);
export const MatrimonyDisclaimer = () => (
  <EditableLegalPage slug="matrimony-disclaimer" fallbackTitle="Matrimony Disclaimer" />
);
export const Advertise = () => (
  <EditableLegalPage slug="advertise" fallbackTitle="Advertisement Us" />
);
