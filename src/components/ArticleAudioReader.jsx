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

/**
 * Article Audio Reader:
 * 1) Plays uploaded / linked audio when audioReader URL is set
 * 2) Otherwise uses browser speech (Tamil/English) to read the article
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
      <div className="mb-6 rounded-xl border border-stone-200 bg-stone-50 p-4">
        <p className="text-sm font-semibold text-slate-800 mb-2">Audio Reader</p>
        <audio controls preload="metadata" className="w-full" src={audioUrl}>
          Your browser does not support audio playback.
        </audio>
      </div>
    );
  }

  if (!supported || !speechText) return null;

  return (
    <div className="mb-6 rounded-xl border border-stone-200 bg-stone-50 p-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-800">Audio Reader</p>
        <p className="text-xs text-slate-500 mt-0.5">Listen to this article (browser voice)</p>
      </div>
      <button
        type="button"
        onClick={speaking ? stopSpeech : startSpeech}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
      >
        {speaking ? 'Stop' : '▶ Listen'}
      </button>
    </div>
  );
};

export default ArticleAudioReader;
