import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { astrologyService } from '../services/articleService';
import RasiImage from '../components/RasiImage';

const SECTIONS = [
  ['prediction', 'predictionTamil', 'GENERAL', 'பொது'],
  ['career', 'careerTamil', 'CAREER', 'தொழில்'],
  ['business', 'businessTamil', 'BUSINESS', 'வணிகம்'],
  ['finance', 'financeTamil', 'FINANCE', 'நிதி'],
  ['love', 'loveTamil', 'LOVE', 'காதல்'],
  ['family', 'familyTamil', 'FAMILY', 'குடும்பம்'],
  ['health', 'healthTamil', 'HEALTH', 'உடல்நலம்'],
  ['education', 'educationTamil', 'EDUCATION', 'கல்வி'],
  ['advice', 'adviceTamil', 'ADVICE', 'ஆலோசனை'],
  ['compatibility', 'compatibilityTamil', 'COMPATIBILITY', 'பொருத்தம்'],
];

const AstrologyRasiDetail = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    astrologyService
      .getPublicRasi(slug)
      .then(({ data: res }) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const h = data?.horoscope;
  const hasAnySection = h && SECTIONS.some(([enKey, taKey]) => h[enKey] || h[taKey]);

  return (
    <div className="min-h-[50vh]">
      <Helmet>
        <title>
          {data ? `${data.rasiTamil} (${data.rasiEnglish}) ராசி பலன்` : 'ராசி பலன்'} | The Great India News
        </title>
        <meta
          name="description"
          content={
            data
              ? `இன்றைய ${data.rasiTamil} / ${data.rasiEnglish} ராசி பலன் — தமிழ் மற்றும் ஆங்கிலம்.`
              : 'இன்றைய ராசி பலன்'
          }
        />
      </Helmet>

      <div className="border-b border-stone-200 bg-white/70">
        <div className="container-news py-8">
          <Link
            to="/astrology"
            className="text-xs font-semibold text-brand-700 hover:underline font-tamil"
          >
            ← இன்றைய ராசி பலன்
          </Link>
          {loading ? (
            <div className="skeleton h-16 w-64 rounded-xl mt-4" />
          ) : data ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
              <RasiImage
                slug={data.slug}
                size="xl"
                alt={`${data.rasiTamil} ${data.rasiEnglish}`}
              />
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl font-tamil font-bold text-slate-900 leading-snug">
                  {data.rasiTamil}
                </h1>
                <p className="text-lg text-slate-600">{data.rasiEnglish}</p>
                <p className="text-sm text-slate-500 mt-2">{data.displayDate}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-teal-700 mt-3">
                  Today&apos;s Rasi Palan
                </p>
                <p className="text-sm font-tamil text-teal-800 mt-1">இன்றைய ராசி பலன்</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-slate-500 font-tamil">ராசி கிடைக்கவில்லை</p>
          )}
        </div>
      </div>

      <div className="container-news py-8 max-w-3xl">
        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-24 rounded-2xl" />
          </div>
        ) : !hasAnySection ? (
          <p className="text-sm text-slate-500 font-tamil">
            இந்த ராசிக்கு இன்னும் பலன் சேமிக்கப்படவில்லை. தினசரி ஒத்திசைவுக்குப் பிறகு மீண்டும் பாருங்கள்.
          </p>
        ) : (
          <>
            <div className="space-y-5">
              {SECTIONS.map(([enKey, taKey, enLabel, taLabel]) => {
                const en = h[enKey];
                const ta = h[taKey];
                if (!en && !ta) return null;
                return (
                  <section key={enKey} className="rounded-2xl border border-stone-200 bg-white p-5">
                    <h2 className="text-sm font-bold tracking-wide text-teal-800">
                      <span className="uppercase">{enLabel}</span>
                      <span className="mx-1.5 text-teal-600/70">·</span>
                      <span className="font-tamil font-semibold normal-case">{taLabel}</span>
                    </h2>
                    {ta && (
                      <p className="mt-3 text-slate-900 leading-relaxed whitespace-pre-wrap font-tamil text-[15px]">
                        {ta}
                      </p>
                    )}
                    {en && (
                      <p className={`text-slate-600 leading-relaxed whitespace-pre-wrap text-sm ${ta ? 'mt-3 pt-3 border-t border-stone-100' : 'mt-3'}`}>
                        {en}
                      </p>
                    )}
                  </section>
                );
              })}
            </div>

            {(h.luckyNumber || h.luckyColor || h.luckyTime) && (
              <section className="mt-6 grid sm:grid-cols-3 gap-3">
                {h.luckyNumber && (
                  <div className="rounded-2xl border border-stone-200 bg-white p-4">
                    <p className="text-[11px] uppercase text-slate-500">Lucky Number</p>
                    <p className="text-xs font-tamil text-slate-500 mt-0.5">அதிர்ஷ்ட எண்</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">{h.luckyNumber}</p>
                  </div>
                )}
                {(h.luckyColor || h.luckyColorTamil) && (
                  <div className="rounded-2xl border border-stone-200 bg-white p-4">
                    <p className="text-[11px] uppercase text-slate-500">Lucky Colour</p>
                    <p className="text-xs font-tamil text-slate-500 mt-0.5">அதிர்ஷ்ட நிறம்</p>
                    {h.luckyColorTamil && (
                      <p className="text-lg font-bold text-slate-900 mt-1 font-tamil">{h.luckyColorTamil}</p>
                    )}
                    {h.luckyColor && (
                      <p className={`text-slate-600 ${h.luckyColorTamil ? 'text-sm mt-0.5' : 'text-lg font-bold text-slate-900 mt-1'}`}>
                        {h.luckyColor}
                      </p>
                    )}
                  </div>
                )}
                {h.luckyTime && (
                  <div className="rounded-2xl border border-stone-200 bg-white p-4">
                    <p className="text-[11px] uppercase text-slate-500">Lucky Time</p>
                    <p className="text-xs font-tamil text-slate-500 mt-0.5">அதிர்ஷ்ட நேரம்</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">{h.luckyTime}</p>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AstrologyRasiDetail;
