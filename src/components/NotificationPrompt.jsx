import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const STORAGE_KEY = 'tgin_notify_prompt';
/** Calendar day key for “already auto-shown today” (YYYY-M-D local) */
const DAY_KEY = 'tgin_notify_auto_day';
const DAY_MS = 24 * 60 * 60 * 1000;
/** After "Not now", wait before auto-opening again */
const SNOOZE_MS = 45 * 60 * 1000;
const AUTO_SHOW_DELAY_MS = 1800;

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

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const getPromptDay = () => {
  try {
    return localStorage.getItem(DAY_KEY) || '';
  } catch {
    return '';
  }
};

const markPromptDayShown = () => {
  try {
    localStorage.setItem(DAY_KEY, todayKey());
  } catch {
    /* ignore */
  }
};

const wasShownToday = () => getPromptDay() === todayKey();

const getBrowserPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
};

const isNotificationsAllowed = () => getBrowserPermission() === 'granted';

/**
 * Auto-open rules:
 * - once per calendar day (even if already granted) via DAY_KEY
 * - "default": also respect 45m snooze after Not now
 */
const shouldAutoShowPrompt = () => {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;

  // Already auto-shown today → stop (dedicated day key; not status/at timestamps)
  if (wasShownToday()) return false;

  const saved = readState();
  const perm = Notification.permission;

  // Undecided — honor short snooze after "Not now"
  if (perm === 'default') {
    if (saved?.status === 'later' && saved.at && Date.now() - saved.at < SNOOZE_MS) {
      return false;
    }
  }

  // granted / denied / default (not snoozed) → show today
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
 * Floating notify bell + LIVE ALERTS card.
 * Red mark while notifications are not allowed; cleared when allowed.
 * Auto-opens the card once per day until the user enables alerts.
 * @param {{ stacked?: boolean }} props stacked — bell sits in parent flex stack (no fixed position)
 */
const NotificationPrompt = ({ stacked = false }) => {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [allowed, setAllowed] = useState(() => isNotificationsAllowed());
  const [supported, setSupported] = useState(true);

  const refreshPermission = useCallback(() => {
    const perm = getBrowserPermission();
    setSupported(perm !== 'unsupported');
    setAllowed(perm === 'granted');
    if (perm === 'granted') {
      const saved = readState() || {};
      // Keep status only — never touch DAY_KEY / prompt-day here
      writeState({
        ...saved,
        status: 'allowed',
        at: saved.at || Date.now(),
      });
    }
  }, []);

  useEffect(() => {
    refreshPermission();
    if ('serviceWorker' in navigator) {
      ensureServiceWorker().catch(() => {});
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshPermission();
    };
    document.addEventListener('visibilitychange', onVisible);
    const daily = window.setInterval(refreshPermission, DAY_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(daily);
    };
  }, [refreshPermission]);

  useEffect(() => {
    if (!supported) return undefined;
    if (!shouldAutoShowPrompt()) return undefined;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      // Re-check right before show (Strict Mode / race safe)
      if (!shouldAutoShowPrompt()) return;
      markPromptDayShown();
      const saved = readState() || {};
      writeState({
        ...saved,
        status:
          saved.status ||
          (isNotificationsAllowed()
            ? 'allowed'
            : getBrowserPermission() === 'denied'
              ? 'denied'
              : 'later'),
        at: saved.at || Date.now(),
      });
      setVisible(true);
    }, AUTO_SHOW_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [supported]);

  const openPrompt = () => {
    if (!supported) return;
    // Bell always opens the card
    setVisible(true);
  };

  const dismiss = useCallback((status) => {
    const saved = readState() || {};
    markPromptDayShown();
    writeState({
      ...saved,
      status,
      at: Date.now(),
    });
    setVisible(false);
    refreshPermission();
  }, [refreshPermission]);

  const onLater = () => dismiss('later');

  const onAllow = async () => {
    if (busy) return;
    const perm = getBrowserPermission();
    if (perm === 'denied') {
      // Browser blocks re-prompt — keep red mark, close card
      dismiss('denied');
      return;
    }
    setBusy(true);
    try {
      const permission = await requestPermissionAndNotify();
      if (permission === 'granted') {
        setAllowed(true);
        dismiss('allowed');
      } else if (permission === 'denied') {
        dismiss('denied');
      } else {
        dismiss('later');
      }
    } catch {
      dismiss('later');
    } finally {
      setBusy(false);
    }
  };

  if (!supported) return null;

  const showRedMark = !allowed;
  const browserDenied = getBrowserPermission() === 'denied';

  return (
    <>
      {/* Bell — squircle teal design (distinct from pink reel circle) */}
      <button
        type="button"
        onClick={openPrompt}
        className={`${
          stacked
            ? 'relative'
            : `fixed z-[56] right-3 sm:right-5
               bottom-[calc(9.75rem+env(safe-area-inset-bottom,0px))]
               sm:bottom-[5.5rem]`
        }
          w-11 h-11 sm:w-12 sm:h-12 rounded-[0.9rem] sm:rounded-[1rem]
          bg-gradient-to-br from-teal-400 via-emerald-500 to-teal-700
          text-white shadow-[0_8px_20px_rgba(13,148,136,0.45)]
          ring-2 ring-white/95 ring-offset-1 ring-offset-transparent
          flex items-center justify-center
          hover:scale-105 hover:shadow-[0_10px_24px_rgba(13,148,136,0.55)]
          active:scale-95 transition-all
          focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300
          notify-bell-ring`}
        aria-label={allowed ? 'Notifications enabled' : 'Enable news alerts'}
        title={allowed ? 'Alerts on' : 'Enable alerts'}
      >
        <span className="pointer-events-none absolute inset-0 rounded-[0.9rem] sm:rounded-[1rem] bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.35),transparent_55%)]" />
        <svg viewBox="0 0 24 24" className="relative w-5 h-5 sm:w-6 sm:h-6 drop-shadow-sm" aria-hidden>
          <path
            fill="currentColor"
            d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm6-6V11a6 6 0 1 0-12 0v5l-1.7 1.7A1 1 0 0 0 5 19h14a1 1 0 0 0 .7-1.7L18 16Z"
          />
          <path
            className="notify-bell-arc"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            d="M17.8 6.2c.85.95 1.35 2.15 1.35 3.45M6.2 6.2A5.6 5.6 0 0 0 4.85 9.65"
          />
        </svg>
        {showRedMark ? (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-3 w-3 sm:h-3.5 sm:w-3.5"
            aria-hidden
          >
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full bg-rose-500 ring-2 ring-white shadow-sm" />
          </span>
        ) : null}
      </button>

      {typeof document !== 'undefined'
        ? createPortal(
            <>
              {visible ? (
                <div
                  className="fixed z-[100] inset-x-3 bottom-[calc(4.85rem+env(safe-area-inset-bottom,0px))] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:left-auto sm:w-[360px] pointer-events-none"
                  role="dialog"
                  aria-labelledby="notify-prompt-title"
                  aria-describedby="notify-prompt-desc"
                >
                  <div className="notify-card pointer-events-auto relative overflow-hidden rounded-3xl bg-[#07111f] text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
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
                            {allowed ? 'Alerts are on' : 'Breaking news, instantly'}
                          </h2>
                        </div>
                      </div>

                      <p id="notify-prompt-desc" className="text-sm text-slate-300 leading-relaxed">
                        {allowed
                          ? 'You will receive breaking news and district alerts. You can turn these off anytime in browser settings.'
                          : browserDenied
                            ? 'Notifications are blocked in this browser. Open site settings and allow notifications, then tap the bell again.'
                            : 'Turn on notifications for headlines, district updates, and special reports. Unsubscribe anytime.'}
                      </p>

                      {!allowed && !browserDenied ? (
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
                      ) : null}

                      <div className={`mt-5 grid grid-cols-1 gap-2.5 ${allowed || browserDenied ? '' : 'sm:grid-cols-[1fr_1.35fr]'}`}>
                        {!allowed && !browserDenied ? (
                          <button
                            type="button"
                            onClick={onLater}
                            disabled={busy}
                            className="order-2 sm:order-1 min-h-[46px] rounded-2xl border border-white/15 bg-white/5 text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors disabled:opacity-60"
                          >
                            Not now
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={allowed || browserDenied ? onLater : onAllow}
                          disabled={busy}
                          className="order-1 sm:order-2 min-h-[46px] rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 text-sm font-bold text-white shadow-lg shadow-teal-900/40 hover:from-teal-400 hover:to-teal-500 transition-all disabled:opacity-60"
                        >
                          {busy
                            ? 'Please wait…'
                            : allowed
                              ? 'Got it'
                              : browserDenied
                                ? 'Close'
                                : 'Enable alerts'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
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
                .notify-bell-ring .notify-bell-arc {
                  animation: notifyArc 1.4s ease-in-out infinite;
                  transform-origin: center;
                }
                @keyframes notifyArc {
                  0%, 100% { opacity: 0.35; }
                  50% { opacity: 1; }
                }
                @media (prefers-reduced-motion: reduce) {
                  .notify-bell-ring .notify-bell-arc { animation: none; opacity: 1; }
                }
              `}</style>
            </>,
            document.body
          )
        : null}
    </>
  );
};

export default NotificationPrompt;
