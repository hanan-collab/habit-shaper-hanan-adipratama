"use client";

import { useEffect, useRef, useState } from "react";

export function NumberTicker({ value, duration = 700, format = (number) => Math.round(number).toString() }: { value: number; duration?: number; format?: (value: number) => string }) {
  const previous = useRef(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      previous.current = value;
      setDisplay(value);
      return;
    }
    const from = previous.current;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else previous.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, value]);

  return <span className="hs-number-ticker">{format(display)}</span>;
}

