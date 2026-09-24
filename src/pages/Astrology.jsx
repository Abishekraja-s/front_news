import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { astrologyService } from '../services/articleService';
import RasiImage from '../components/RasiImage';

const Astrology = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    astrologyService
      .getPublicToday()
      .then(({ data: res }) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const panchang = data?.panchang;

  return (
    <div className="min-h-[50vh]">
      <Helmet>
        <title>இன்றைய ராசி பலன் | The Great India News</title>
        <meta
          name="description"
          content="இன்றைய 12 ராசி பலன் — தமிழ் மற்றும் ஆங்கிலம். The Great India News astrology desk."
        />
      </Helmet>

      <div className="border-b border-stone-200 bg-white/70">
        <div className="container-news py-8">
          <Link to="/" className="text-xs font-semibold text-brand-700 hover:underline font-tamil">
            ← முகப்பு
          </Link>
          <p className="text-[11px] font-bold uppercase tracking-widest text-teal-700 mt-3">Astrology</p>
          <h1 className="text-3xl sm:text-4xl font-tamil font-bold text-slate-900 mt-1 leading-snug">
            இன்றைய ராசி பலன்
          </h1>
          <p className="text-sm text-slate-500 mt-1">Today&apos;s Astrology</p>
          {data?.displayDate && (
            <p className="text-base font-medium text-slate-800 mt-3">{data.displayDate}</p>
          )}
        </div>
      </div>

      <div className="container-news py-8">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-36 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {panchang && (
              <section className="mb-10 rounded-2xl border border-stone-200 bg-white p-5">
                <h2 className="text-lg font-tamil font-bold text-slate-900">
                  பஞ்சாங்கம் <span className="font-sans font-semibold text-slate-500">· Panchangam</span>
                </h2>
                {panchang.locationLabel && (
                  <p className="text-xs text-slate-500 mt-1">{panchang.locationLabel}</p>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 text-sm">
                  {[
                    ['Tithi', panchang.tithi],
                    ['Nakshatra', panchang.nakshatraTamil || panchang.nakshatraEnglish],
                    ['Yoga', panchang.yoga],
                    ['Karana', panchang.karana],
                    ['Sunrise', panchang.sunrise],
                    ['Sunset', panchang.sunset],
                    ['Rahu Kalam', panchang.rahuKalam],
                    ['Yamagandam', panchang.yamagandam],
                    ['Kuligai', panchang.kuligai],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
                      <p className="font-medium text-slate-800 font-tamil">{value}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.rasis || []).map((rasi) => (
                <Link
                  key={rasi.slug}
                  to={`/astrology/rasi/${rasi.slug}`}
                  className="group rounded-2xl border border-stone-200 bg-white p-5 hover:border-teal-300 hover:shadow-sm transition flex flex-col"
                >
                  <div className="flex flex-col items-center text-center">
                    <RasiImage
                      slug={rasi.slug}
                      size="xl"
                      alt={`${rasi.rasiTamil} ${rasi.rasiEnglish}`}
                      className="group-hover:scale-[1.03] transition-transform"
                    />
                    <h2 className="text-xl sm:text-2xl font-tamil font-bold text-slate-900 group-hover:text-teal-800 leading-snug mt-3">
                      {rasi.rasiTamil}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">{rasi.rasiEnglish}</p>
                  </div>
                  {rasi.previewTamil && (
                    <p className="text-sm text-slate-800 mt-4 line-clamp-3 font-tamil leading-relaxed text-left">
                      {rasi.previewTamil}
                    </p>
                  )}
                  {rasi.previewEnglish && (
                    <p className={`text-sm text-slate-600 line-clamp-2 leading-relaxed text-left ${rasi.previewTamil ? 'mt-2' : 'mt-4'}`}>
                      {rasi.previewEnglish}
                    </p>
                  )}
                  {!rasi.previewTamil && !rasi.previewEnglish && (
                    <p className="text-sm text-slate-500 mt-4 font-tamil text-left">தரவு விரைவில் வரும்</p>
                  )}
                  <span className="inline-block mt-4 text-sm font-semibold text-teal-700 group-hover:underline font-tamil">
                    விவரங்கள் →
                  </span>
                </Link>
              ))}
            </div>

            {!data?.rasis?.length && (
              <p className="text-sm text-slate-500 font-tamil">ராசி பலன் தரவு இன்னும் கிடைக்கவில்லை.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Astrology;
