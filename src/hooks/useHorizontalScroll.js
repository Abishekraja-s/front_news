import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Horizontal carousel helpers: arrow state, wheel→x scroll, drag, optional autoplay.
 */
export function useHorizontalScroll({
  deps = [],
  autoplayMs = 0,
  pauseOnHover = true,
} = {}) {
  const ref = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const hoverRef = useRef(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = ref.current;
    if (!el) {
      setCanLeft(false);
      setCanRight(false);
      return;
    }
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(max > 2 && el.scrollLeft < max - 2);
  }, []);

  const scrollByDir = useCallback((dir) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector('[data-hscroll-item]');
    const amount = card
      ? card.getBoundingClientRect().width + 12
      : Math.max(200, Math.floor(el.clientWidth * 0.85));
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateArrows) : null;
    ro?.observe(el);
    window.addEventListener('resize', updateArrows);

    // Do NOT steal vertical (top/down) page scroll. Only handle sideways gestures
    // (trackpad deltaX) or Shift + wheel.
    const onWheel = (e) => {
      if (el.scrollWidth <= el.clientWidth + 2) return;
      const mostlyHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!e.shiftKey && !mostlyHorizontal) return;
      const delta = mostlyHorizontal ? e.deltaX : e.deltaY;
      if (!delta) return;
      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return;
      e.preventDefault();
      el.scrollLeft += delta;
    };

    const onDown = (e) => {
      if (e.button !== 0) return;
      // Touch / mobile: let the browser handle vertical page scroll — no mouse-drag hijack
      if (e.pointerType === 'touch' || window.matchMedia('(pointer: coarse)').matches) return;
      dragRef.current = {
        active: true,
        startX: e.pageX,
        startY: e.pageY,
        scrollLeft: el.scrollLeft,
        moved: false,
        axis: null,
      };
      el.style.cursor = 'grabbing';
    };
    const onMove = (e) => {
      if (!dragRef.current.active) return;
      const dx = e.pageX - dragRef.current.startX;
      const dy = e.pageY - (dragRef.current.startY || e.pageY);
      // If gesture is mostly vertical, release so the page can scroll up/down
      if (!dragRef.current.axis) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          dragRef.current.active = false;
          el.style.cursor = 'grab';
          return;
        }
        dragRef.current.axis = 'x';
      }
      if (Math.abs(dx) > 4) dragRef.current.moved = true;
      el.scrollLeft = dragRef.current.scrollLeft - dx;
    };
    const onUp = () => {
      dragRef.current.active = false;
      dragRef.current.axis = null;
      el.style.cursor = 'grab';
    };
    const onClickCapture = (e) => {
      if (dragRef.current.moved) {
        e.preventDefault();
        e.stopPropagation();
        dragRef.current.moved = false;
      }
    };
    const onEnter = () => {
      hoverRef.current = true;
    };
    const onLeave = () => {
      hoverRef.current = false;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    el.addEventListener('click', onClickCapture, true);
    if (pauseOnHover) {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    }
    el.style.cursor = 'grab';

    return () => {
      el.removeEventListener('scroll', updateArrows);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      el.removeEventListener('click', onClickCapture, true);
      if (pauseOnHover) {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      }
      ro?.disconnect();
      window.removeEventListener('resize', updateArrows);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateArrows, pauseOnHover, ...deps]);

  useEffect(() => {
    if (!autoplayMs || autoplayMs < 1000) return undefined;
    const id = setInterval(() => {
      if (hoverRef.current || dragRef.current.active) return;
      const el = ref.current;
      if (!el || el.scrollWidth <= el.clientWidth + 2) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollByDir(1);
      }
    }, autoplayMs);
    return () => clearInterval(id);
  }, [autoplayMs, scrollByDir, ...deps]);

  return { ref, canLeft, canRight, scrollByDir, updateArrows };
}

export default useHorizontalScroll;
