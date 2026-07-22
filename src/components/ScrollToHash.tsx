import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// After every route change, if the URL has a #hash, scroll to that element.
// Native `scroll-behavior: smooth` on <html> handles the smooth part.
// Uses two rAFs so the target section is definitely in the DOM first.
export default function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const el = document.querySelector(hash);
        if (el instanceof HTMLElement) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [pathname, hash]);

  return null;
}
