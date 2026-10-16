import { useEffect, useRef, useState } from 'react';
import {
  ensureAdSenseScript,
  getAdSenseInsStyle,
  isValidAdSlotId,
  isValidPublisherId,
} from '../utils/adsense';

/**
 * Renders a single Google AdSense unit with correct client/slot attributes.
 *
 * @param {object} props
 * @param {object} props.placement - { publisherId, adSlotId, adFormat, sizeMode, width, height, location }
 * @param {string} [props.className]
 * @param {boolean} [props.showLabel=true] - show "Advertisement" label
 * @param {boolean} [props.previewMode=false] - admin preview: softer empty state, no "broken" claim
 */
const AdSenseUnit = ({
  placement,
  className = '',
  showLabel = true,
  previewMode = false,
}) => {
  const insRef = useRef(null);
  const pushedRef = useRef(false);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | empty | invalid

  const publisherId = String(placement?.publisherId || '').trim();
  const adSlotId = String(placement?.adSlotId || '').trim();
  const adFormat = placement?.adFormat || 'auto';
  const sizeMode = placement?.sizeMode || 'responsive';
  const width = placement?.width || 336;
  const height = placement?.height || 280;
  const valid = isValidPublisherId(publisherId) && isValidAdSlotId(adSlotId);

  useEffect(() => {
    let cancelled = false;
    let emptyTimer;
    pushedRef.current = false;

    const run = async () => {
      if (!valid) {
        setStatus('invalid');
        return;
      }

      setStatus('loading');
      const ok = await ensureAdSenseScript(publisherId);
      if (cancelled) return;

      if (!ok) {
        setStatus('empty');
        return;
      }

      // Wait a tick so <ins> is committed with data attributes
      await new Promise((r) => requestAnimationFrame(() => r()));
      if (cancelled || !insRef.current || pushedRef.current) return;

      // Skip if Google already filled this node
      if (insRef.current.getAttribute('data-adsbygoogle-status')) {
        setStatus('ready');
        return;
      }

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
        setStatus('ready');
      } catch {
        setStatus('empty');
      }

      // After a short delay, if still unfilled (common on localhost / admin), mark empty for preview UI
      emptyTimer = window.setTimeout(() => {
        if (cancelled || !insRef.current) return;
        const filled = insRef.current.getAttribute('data-adsbygoogle-status') === 'done';
        const hasIframe = Boolean(insRef.current.querySelector('iframe'));
        if (!filled && !hasIframe) {
          setStatus((s) => (s === 'ready' ? 'empty' : s));
        }
      }, 2500);
    };

    run();
    return () => {
      cancelled = true;
      if (emptyTimer) window.clearTimeout(emptyTimer);
    };
  }, [publisherId, adSlotId, adFormat, sizeMode, width, height, valid]);

  if (!placement) return null;

  if (!valid) {
    return (
      <div className={`ad-container ${className}`}>
        {showLabel && (
          <p className="text-[10px] text-gray-400 text-center mb-1 uppercase tracking-wider">
            {previewMode ? 'Preview' : 'Advertisement'}
          </p>
        )}
        <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-4 text-center text-xs text-amber-800">
          Invalid publisher ID or ad slot ID format. Use <span className="font-mono">ca-pub-…</span> and a numeric slot.
        </div>
      </div>
    );
  }

  const style = getAdSenseInsStyle({ sizeMode, width, height });
  const responsive = sizeMode === 'responsive' ? 'true' : 'false';

  return (
    <div
      className={`ad-container ${className}`}
      data-adsense-location={placement.location || ''}
      data-adsense-preview={previewMode ? 'true' : undefined}
    >
      {showLabel && (
        <p className="text-[10px] text-gray-400 text-center mb-1 uppercase tracking-wider">
          {previewMode ? 'AdSense preview' : 'Advertisement'}
        </p>
      )}

      <div className="relative mx-auto max-w-full" style={sizeMode === 'fixed' ? { maxWidth: width } : undefined}>
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={style}
          data-ad-client={publisherId}
          data-ad-slot={adSlotId}
          {...(sizeMode === 'fixed'
            ? {}
            : {
                'data-ad-format': adFormat,
                'data-full-width-responsive': responsive,
              })}
        />

        {/* Overlay only in admin preview when Google does not fill (localhost / unapproved) */}
        {previewMode && (status === 'empty' || status === 'loading') && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/95 px-3 text-center"
            aria-hidden={status === 'loading'}
          >
            <div className="text-xs text-slate-500">
              {status === 'loading' ? (
                <p>Loading AdSense unit…</p>
              ) : (
                <>
                  <p className="font-medium text-slate-600">Configuration loaded — no creative filled here</p>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                    Google often skips fills in admin / localhost. This does not mean the placement is broken.
                    Live ads serve on the public site when the unit is approved and eligible.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdSenseUnit;
