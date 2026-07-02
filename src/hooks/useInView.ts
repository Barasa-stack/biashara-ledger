import { useEffect, useRef, useState } from 'react';

type ObserverEntry = { target: Element; isIntersecting: boolean };

let observer: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, (inView: boolean) => void>();

if (typeof window !== 'undefined') {
  observer = new IntersectionObserver(
    (entries: ObserverEntry[]) => {
      entries.forEach((entry) => {
        const cb = callbacks.get(entry.target);
        if (cb) cb(entry.isIntersecting);
        if (entry.isIntersecting && observer) {
          observer.unobserve(entry.target);
          callbacks.delete(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );
}

export function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !observer) return;
    callbacks.set(el, setInView);
    observer.observe(el);
    return () => {
      if (observer) {
        observer.unobserve(el);
        callbacks.delete(el);
      }
    };
  }, []);

  return { ref, inView };
}
