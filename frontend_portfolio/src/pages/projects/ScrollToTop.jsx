import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets scroll on route change.
 * Tries window, <html>, <body>, and a custom container (#page-scroll-root).
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // let the new route render, then scroll
    const id = requestAnimationFrame(() => {
      // 1) window / document
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // 2) your custom scroll container if you use one
      const el = document.getElementById("page-scroll-root");
      if (el) {
        el.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    });

    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
