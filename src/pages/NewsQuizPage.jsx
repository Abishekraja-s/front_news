import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { featureService } from '../services/articleService';
import { FeatureIcon } from '../features/FeatureIcons';

const NewsQuizPage = () => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadQuiz = () => {
    setLoading(true);
    setResult(null);
    setAnswers({});
    setIndex(0);
    featureService
      .getNewsQuizDaily()
      .then(({ data: res }) => {
        setQuiz(res.data);
        setError('');
      })
      .catch(() => setError('கேள்விகளை ஏற்ற முடியவில்லை.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadQuiz();
  }, []);

  const questions = quiz?.questions || [];
  const current = questions[index];
  const answeredCount = Object.keys(answers).length;

  const choose = (optIndex) => {
    if (!current || result) return;
    setAnswers((prev) => ({ ...prev, [current.id]: optIndex }));
  };

  const submit = () => {
    setSubmitting(true);
    featureService
      .submitNewsQuiz({
        answers: questions.map((q) => ({
          id: q.id,
          answerIndex: answers[q.id] ?? null,
        })),
      })
      .then(({ data: res }) => setResult(res.data))
      .catch(() => setError('மதிப்பெண் கணக்கிட முடியவில்லை.'))
      .finally(() => setSubmitting(false));
  };

  if (loading) {
    return (
      <div className="container-news py-16">
        <div className="h-40 rounded-2xl bg-teal-100/60 animate-pulse" />
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="container-news py-10">
        <p className="text-rose-700">{error}</p>
        <Link to="/explore" className="text-brand-700 text-sm font-semibold mt-3 inline-block">
          ← Explore
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>News Quiz Challenge · செய்தி வினாடி வினா | The Great India News</title>
      </Helmet>
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 text-white">
        <div className="container-news py-6 sm:py-8">
          <Link to="/explore" className="text-xs font-semibold text-white/85 hover:text-white">
            ← Explore All Features
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-white/10 text-amber-300 flex items-center justify-center">
              <FeatureIcon name="trophy" className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-headline font-bold">News Quiz Challenge</h1>
              <p className="text-sm font-tamil text-white/90">செய்தி வினாடி வினா சவால்</p>
            </div>
          </div>
          <p className="text-xs text-white/80 mt-2">
            இன்றைய 5 கேள்விகள் · தானியங்கி தினசரி புதுப்பிப்பு · {quiz?.dateKey}
          </p>
        </div>
      </div>

      <div className="container-news py-6 max-w-2xl">
        {result ? (
          <div className="rounded-3xl bg-white ring-1 ring-teal-100 shadow-lg p-6 sm:p-8 space-y-5">
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-wider text-teal-700">முடிவு / Result</p>
              <p className="text-5xl font-extrabold text-slate-900 mt-2">
                {result.score}
                <span className="text-2xl text-slate-400">/{result.totalMarks}</span>
              </p>
              <p className="text-lg font-bold text-emerald-700 mt-1">
                {result.percent}% · Grade {result.grade}
              </p>
              <p className="text-sm font-tamil text-slate-600 mt-2 leading-relaxed">{result.message}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-emerald-50 p-3">
                <p className="text-xl font-extrabold text-emerald-700">{result.correct}</p>
                <p className="text-[11px] font-tamil text-emerald-800">சரி</p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-3">
                <p className="text-xl font-extrabold text-rose-700">{result.wrong}</p>
                <p className="text-[11px] font-tamil text-rose-800">தவறு</p>
              </div>
              <div className="rounded-2xl bg-stone-100 p-3">
                <p className="text-xl font-extrabold text-slate-700">{result.unanswered}</p>
                <p className="text-[11px] font-tamil text-slate-600">விடப்பட்டது</p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-800">எல்லா கேள்விகள் & விடைகள்</p>
              {result.review?.map((r, i) => {
                const missed = r.chosenIndex == null;
                return (
                  <div
                    key={r.id}
                    className={`rounded-2xl p-4 ring-1 ${
                      r.isCorrect
                        ? 'bg-emerald-50/80 ring-emerald-200'
                        : missed
                          ? 'bg-amber-50/80 ring-amber-200'
                          : 'bg-rose-50/80 ring-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="font-tamil font-bold text-slate-900 leading-relaxed">
                        {i + 1}. {r.question}
                      </p>
                      <span
                        className={`shrink-0 text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full ${
                          r.isCorrect
                            ? 'bg-emerald-600 text-white'
                            : missed
                              ? 'bg-amber-500 text-white'
                              : 'bg-rose-600 text-white'
                        }`}
                      >
                        {r.isCorrect ? 'சரி' : missed ? 'விடப்பட்டது' : 'தவறு'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {r.options.map((opt, oi) => {
                        const isCorrect = oi === r.correctIndex;
                        const isChosen = oi === r.chosenIndex;
                        const isWrongPick = isChosen && !isCorrect;
                        let cls = 'border-stone-200 bg-white text-slate-700';
                        if (isCorrect) {
                          cls = 'border-emerald-500 bg-emerald-100 text-emerald-950 ring-1 ring-emerald-300';
                        } else if (isWrongPick) {
                          cls = 'border-rose-500 bg-rose-100 text-rose-950 ring-1 ring-rose-300';
                        }
                        return (
                          <div
                            key={`${r.id}-${oi}`}
                            className={`w-full text-left px-3.5 py-3 rounded-xl border text-sm font-tamil font-medium ${cls}`}
                          >
                            <span
                              className={`inline-flex w-6 h-6 rounded-full text-[11px] font-bold items-center justify-center mr-2 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : isWrongPick
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-stone-200 text-slate-600'
                              }`}
                            >
                              {String.fromCharCode(65 + oi)}
                            </span>
                            {opt}
                            {isCorrect && (
                              <span className="ml-2 text-[11px] font-bold text-emerald-700">✓ சரியான விடை</span>
                            )}
                            {isWrongPick && (
                              <span className="ml-2 text-[11px] font-bold text-rose-700">✗ உங்கள் விடை</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {r.explanation ? (
                      <p className="mt-2.5 text-xs font-tamil text-slate-600 leading-relaxed">
                        விளக்கம்: {r.explanation}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                className="rounded-2xl bg-teal-600 text-white text-sm font-bold px-5 py-2.5"
                onClick={loadQuiz}
              >
                மீண்டும் முயற்சி
              </button>
              <Link
                to="/explore/exams"
                className="rounded-2xl bg-stone-100 text-slate-800 text-sm font-bold px-5 py-2.5"
              >
                TNPSC / வங்கி தேர்வுகள்
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-white ring-1 ring-teal-100 shadow-lg p-5 sm:p-7 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-slate-500">
                கேள்வி {index + 1} / {questions.length}
              </p>
              <p className="text-xs font-bold text-teal-700">
                பதில்: {answeredCount}/{questions.length}
              </p>
            </div>
            <div className="h-1.5 rounded-full bg-teal-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all"
                style={{ width: `${((index + 1) / Math.max(questions.length, 1)) * 100}%` }}
              />
            </div>
            {current && (
              <>
                <h2 className="text-lg sm:text-xl font-tamil font-bold text-slate-900 leading-relaxed">
                  {current.question}
                </h2>
                <div className="space-y-2">
                  {current.options.map((opt, i) => {
                    const selected = answers[current.id] === i;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => choose(i)}
                        className={`w-full text-left px-4 py-3.5 rounded-2xl border text-sm font-tamil font-medium transition-colors ${
                          selected
                            ? 'border-teal-500 bg-teal-50 text-teal-900'
                            : 'border-stone-200 hover:border-teal-300 bg-white text-slate-800'
                        }`}
                      >
                        <span className="inline-flex w-6 h-6 rounded-full bg-stone-100 text-[11px] font-bold items-center justify-center mr-2">
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            <div className="flex flex-wrap gap-2 justify-between pt-2">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => setIndex((n) => Math.max(0, n - 1))}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 bg-stone-100 disabled:opacity-40"
              >
                முந்தையது
              </button>
              {index < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setIndex((n) => Math.min(questions.length - 1, n + 1))}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-white bg-teal-600"
                >
                  அடுத்தது
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submit}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 disabled:opacity-60"
                >
                  {submitting ? 'கணக்கிடுகிறது…' : 'சமர்ப்பித்து மதிப்பெண் பார்க்க'}
                </button>
              )}
            </div>
            {error && <p className="text-sm text-rose-700">{error}</p>}
          </div>
        )}
      </div>
    </>
  );
};

export default NewsQuizPage;
