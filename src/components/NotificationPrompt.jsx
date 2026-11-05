import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'tgin_notify_prompt';
const LATER_MS = 3 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 2500;

const readState = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

const writeState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
};

const shouldShowPrompt = () => {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted' || Notification.permission === 'denied') return false;

  const saved = readState();
  if (!saved) return true;
  if (saved.status === 'allowed' || saved.status === 'denied') return false;
  if (saved.status === 'later' && saved.at) {
    return Date.now() - saved.at >= LATER_MS;
  }
  return true;
};

async function ensureServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

async function requestPermissionAndNotify() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission;

  await ensureServiceWorker();

  try {
    const reg = await navigator.serviceWorker?.ready;
    const title = 'The Great India News';
    const options = {
      body: 'You will receive breaking news alerts.',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'welcome-subscribe',
    };
    if (reg?.showNotification) {
      await reg.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  } catch {
    /* permission granted is enough */
  }
  return permission;
}

/**
 * Soft-ask notification prompt — dark editorial card (desktop + mobile).
 */
const NotificationPrompt = () => {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!shouldShowPrompt()) return undefined;
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      ensureServiceWorker().catch(() => {});
    }
  }, []);

  const dismiss = useCallback((status) => {
    writeState({ status, at: Date.now() });
    setVisible(false);
  }, []);

  const onLater = () => dismiss('later');

  const onAllow = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const permission = await requestPermissionAndNotify();
      if (permission === 'granted') dismiss('allowed');
      else if (permission === 'denied') dismiss('denied');
      else dismiss('later');
    } catch {
      dismiss('later');
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed z-[100] inset-x-3 bottom-[calc(4.85rem+env(safe-area-inset-bottom,0px))] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:left-auto sm:w-[360px] pointer-events-none"
      role="dialog"
      aria-labelledby="notify-prompt-title"
      aria-describedby="notify-prompt-desc"
    >
      <div className="notify-card pointer-events-auto relative overflow-hidden rounded-3xl bg-[#07111f] text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
        {/* ambient glow */}
        <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-teal-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-36 w-36 rounded-full bg-cyan-500/15 blur-3xl" />

        <button
          type="button"
          onClick={onLater}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>

        <div className="relative p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-700 shadow-lg shadow-teal-900/40">
              <span className="absolute inset-0 rounded-2xl animate-ping bg-teal-400/30" style={{ animationDuration: '2.4s' }} />
              <svg viewBox="0 0 24 24" className="relative h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-300">Live alerts</p>
              <h2 id="notify-prompt-title" className="text-lg sm:text-xl font-bold leading-tight mt-0.5">
                Breaking news, instantly
              </h2>
            </div>
          </div>

          <p id="notify-prompt-desc" className="text-sm text-slate-300 leading-relaxed">
            Turn on notifications for headlines, district updates, and special reports. Unsubscribe anytime.
          </p>

          <ul className="mt-4 space-y-2 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              Breaking &amp; flash alerts
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              District &amp; Tamil Nadu news
            </li>
          </ul>

          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_1.35fr]">
            <button
              type="button"
              onClick={onLater}
              disabled={busy}
              className="order-2 sm:order-1 min-h-[46px] rounded-2xl border border-white/15 bg-white/5 text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors disabled:opacity-60"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={onAllow}
              disabled={busy}
              className="order-1 sm:order-2 min-h-[46px] rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 text-sm font-bold text-white shadow-lg shadow-teal-900/40 hover:from-teal-400 hover:to-teal-500 transition-all disabled:opacity-60"
            >
              {busy ? 'Please wait…' : 'Enable alerts'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .notify-card {
          animation: notifyIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes notifyIn {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (min-width: 640px) {
          @keyframes notifyIn {
            from { opacity: 0; transform: translateY(12px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationPrompt;
