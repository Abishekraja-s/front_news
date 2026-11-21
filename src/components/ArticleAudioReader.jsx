import { useEffect, useMemo, useState } from 'react';
import { getMediaUrl } from '../utils/images';

/** Strip HTML to plain text for speech / preview. */
const htmlToSpeechText = (html = '') =>
  String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '. ')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '. ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

const WaveBars = ({ active }) => (
  <div className="hidden sm:flex items-end gap-[2px] h-3.5 shrink-0" aria-hidden>
    {[0.45, 0.8, 0.55, 1, 0.65].map((h, i) => (
      <span
        key={i}
        className={`w-[2.5px] rounded-full bg-gradient-to-t from-teal-600 to-cyan-400 transition-all ${
          active ? 'animate-pulse' : 'opacity-50'
        }`}
        style={{
          height: `${h * 100}%`,
          animationDelay: active ? `${i * 90}ms` : undefined,
          animationDuration: active ? `${700 + i * 80}ms` : undefined,
        }}
      />
    ))}
  </div>
);

/**
 * Article Audio Reader — premium player UI.
 * 1) Uploaded / linked audio when audioReader URL is set
 * 2) Otherwise browser speech (Tamil/English)
 */
const ArticleAudioReader = ({ audioReader, title = '', excerpt = '', content = '' }) => {
  const audioUrl = getMediaUrl(audioReader);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  const speechText = useMemo(() => {
    const body = htmlToSpeechText(content);
    return [title, excerpt, body].filter(Boolean).join('. ').slice(0, 12000);
  }, [title, excerpt, content]);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopSpeech = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  const startSpeech = () => {
    if (!speechText || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(speechText);
    const hasTamil = /[\u0B80-\u0BFF]/.test(speechText);
    utter.lang = hasTamil ? 'ta-IN' : 'en-IN';
    utter.rate = 0.95;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  if (audioUrl) {
    return (
      <div className="mb-6 relative overflow-hidden rounded-2xl border border-teal-200/60 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 p-4 sm:p-5 shadow-lg shadow-teal-900/10">
        <div className="pointer-events-none absolute -top-10 -right-8 w-40 h-40 rounded-full bg-teal-400/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-12 -left-6 w-36 h-36 rounded-full bg-cyan-400/15 blur-3xl" aria-hidden />
        <div className="relative z-[1] flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-500/30">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor" aria-hidden>
              <path d="M12 3a1 1 0 0 1 1 1v8.2a3 3 0 1 1-2 0V4a1 1 0 0 1 1-1Zm-5.5 9.5a5.5 5.5 0 1 0 11 0h-2a3.5 3.5 0 1 1-7 0h-2Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Audio Reader</p>
            <p className="text-xs text-teal-200/80">Uploaded narration</p>
          </div>
        </div>
        <audio controls preload="metadata" className="relative z-[1] w-full accent-teal-400" src={audioUrl}>
          Your browser does not support audio playback.
        </audio>
      </div>
    );
  }

  if (!supported || !speechText) return null;

  return (
    <div
      className={`mb-6 relative overflow-hidden rounded-2xl border shadow-md transition-all duration-300 ${
        speaking
          ? 'border-teal-300/70 bg-gradient-to-br from-teal-50 via-white to-cyan-50 shadow-teal-200/40'
          : 'border-stone-200/80 bg-gradient-to-br from-white via-stone-50 to-teal-50/50'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 20%, rgba(20,184,166,0.18), transparent 42%), radial-gradient(circle at 88% 70%, rgba(6,182,212,0.14), transparent 40%)',
        }}
        aria-hidden
      />

      <div className="relative z-[1] flex flex-row items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-4">
        <button
          type="button"
          onClick={speaking ? stopSpeech : startSpeech}
          aria-label={speaking ? 'Stop listening' : 'Listen to article'}
          className={`relative shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${
            speaking
              ? 'bg-gradient-to-br from-rose-500 to-orange-500 shadow-rose-300/50'
              : 'bg-gradient-to-br from-teal-600 to-cyan-500 shadow-teal-300/40 hover:scale-105'
          }`}
        >
          {speaking ? (
            <span className="flex gap-0.5" aria-hidden>
              <span className="w-1 h-3.5 rounded-sm bg-white" />
              <span className="w-1 h-3.5 rounded-sm bg-white" />
            </span>
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" fill="currentColor" aria-hidden>
              <path d="M8.5 5.8v12.4a1 1 0 0 0 1.5.86l9.2-6.2a1 1 0 0 0 0-1.72l-9.2-6.2a1 1 0 0 0-1.5.86Z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">Audio Reader</p>
            <span className="hidden xs:inline sm:inline shrink-0 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-teal-700 bg-teal-100/80 px-1.5 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 min-w-0">
            <p className="text-[10px] sm:text-xs text-slate-500 truncate">
              {speaking ? 'Playing…' : 'Browser voice'}
            </p>
            <WaveBars active={speaking} />
          </div>
        </div>

        <button
          type="button"
          onClick={speaking ? stopSpeech : startSpeech}
          className={`shrink-0 inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-300 active:scale-95 ${
            speaking
              ? 'bg-slate-900 hover:bg-slate-800'
              : 'bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600'
          }`}
        >
          {speaking ? (
            'Stop'
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" aria-hidden>
                <path d="M8.5 5.8v12.4a1 1 0 0 0 1.5.86l9.2-6.2a1 1 0 0 0 0-1.72l-9.2-6.2a1 1 0 0 0-1.5.86Z" />
              </svg>
              Listen
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ArticleAudioReader;
