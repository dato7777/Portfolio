import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/** Scroll window to top once when the route pathname changes. */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const prevPath = useRef(pathname);

  useLayoutEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
