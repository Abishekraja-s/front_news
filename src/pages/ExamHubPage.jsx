import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { examService } from '../services/articleService';
import { FeatureIcon } from '../features/FeatureIcons';

const ExamHubPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('tnpsc');
  const [q, setQ] = useState('');

  useEffect(() => {
    setLoading(true);
    examService
      .getCatalog()
      .then(({ data: res }) => {
        setData(res.data);
        setError('');
      })
      .catch(() => setError('தேர்வு பட்டியலை ஏற்ற முடியவில்லை.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = data?.categories || [];
  const active = categories.find((c) => c.id === tab) || categories[0];
  const exams = useMemo(() => {
    const list = active?.exams || [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (e) =>
        e.name.toLowerCase().includes(needle) ||
        (e.nameTamil || '').includes(q.trim()) ||
        e.slug.includes(needle)
    );
  }, [active, q]);

  return (
    <>
      <Helmet>
        <title>தினசரி வினாடி வினா · TNPSC & வங்கி தேர்வுகள் | The Great India News</title>
      </Helmet>
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white">
        <div className="container-news py-7 sm:py-10 relative">
          <Link to="/explore" className="text-xs font-semibold text-white/85 hover:text-white">
            ← Explore All Features
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="w-14 h-14 rounded-3xl bg-white text-blue-700 flex items-center justify-center shadow-lg">
              <FeatureIcon name="quiz" className="w-7 h-7" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl sm:text-4xl font-headline font-bold">Daily Quiz</h1>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/20">
                  Live
                </span>
              </div>
              <p className="text-base font-tamil leading-relaxed mt-1 text-white/95">5 கேள்வி · தினசரி புதுப்பிப்பு</p>
            </div>
          </div>
          <p className="text-sm text-white/90 mt-3 max-w-2xl font-tamil leading-relaxed">
            TNPSC மற்றும் வங்கி தேர்வுகளுக்கான தமிழ் கேள்விகள் · ஒவ்வொரு நாளும் தானாக மாறும் · சோதனை + மதிப்பெண்
          </p>
          {data?.dateKey && (
            <p className="text-xs text-white/75 mt-2">
              இன்று: {data.dateKey} · {data.totalExams} தேர்வுகள் · {data.totalQuestions} கேள்விகள்
            </p>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-b from-blue-50 via-white to-indigo-50 min-h-[50vh]">
        <div className="container-news py-6 space-y-4">
          {error && (
            <p className="text-sm text-rose-700 bg-rose-50 ring-1 ring-rose-100 rounded-2xl px-4 py-3">{error}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setTab(c.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold ${
                  (active?.id || tab) === c.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-slate-700 ring-1 ring-blue-100'
                }`}
              >
                {c.name}
                <span className="ml-1 font-tamil opacity-90">{c.nameTamil}</span>
              </button>
            ))}
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="தேர்வு தேடுங்கள்… Search exam"
            className="w-full rounded-2xl border border-blue-200 px-4 py-2.5 text-sm"
          />

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-36 rounded-2xl bg-blue-100/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {exams.map((exam) => (
                <article
                  key={exam.slug}
                  className="rounded-2xl bg-white p-4 ring-1 ring-blue-100 shadow-sm flex flex-col"
                >
                  <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                    {exam.categoryName}
                  </p>
                  <h2 className="text-base font-bold text-slate-900 mt-1">{exam.name}</h2>
                  <p className="text-[12px] text-slate-600 font-tamil leading-relaxed mt-0.5">{exam.nameTamil}</p>
                  <div className="mt-auto pt-4 flex flex-wrap gap-2">
                    <Link
                      to={`/explore/exams/${exam.slug}/daily`}
                      className="flex-1 text-center rounded-xl bg-blue-600 text-white text-xs font-bold px-3 py-2.5 hover:bg-blue-500"
                    >
                      தினசரி 5 கேள்வி
                    </Link>
                    <Link
                      to={`/explore/exams/${exam.slug}/test`}
                      className="flex-1 text-center rounded-xl bg-emerald-600 text-white text-xs font-bold px-3 py-2.5 hover:bg-emerald-500"
                    >
                      முழு சோதனை
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
          {!loading && !exams.length && (
            <p className="text-sm text-slate-600">பொருத்தமான தேர்வு இல்லை.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default ExamHubPage;
