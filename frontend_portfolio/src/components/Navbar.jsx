import React, { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  HomeIcon,
  Squares2X2Icon,
  UserCircleIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

const items = [
  { label: "Home", to: "/", Icon: HomeIcon, mobileLabel: "Home" },
  { label: "Projects", to: "/projects", Icon: Squares2X2Icon, mobileLabel: "Projects" },
  { label: "About", to: "/about", Icon: UserCircleIcon, mobileLabel: "About" },
  { label: "Contact", to: "/contact", Icon: EnvelopeIcon, mobileLabel: "Contact" },
];

const shellClass =
  "border border-white/15 bg-slate-950/92 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.55)]";

function pathActive(pathname, to) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function preventPointerFocus(e) {
  e.preventDefault();
}

const linkClass = (active) =>
  `flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-semibold transition-all duration-200
   focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400
   ${
     active
       ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 text-white shadow-md shadow-cyan-500/25 ring-1 ring-white/20"
       : "text-slate-200 hover:bg-white/10 hover:text-white"
   }`;

export default function MyNavbar() {
  const { pathname } = useLocation();
  const onLogin = pathname === "/login";

  useEffect(() => {
    const el = document.activeElement;
    if (el && typeof el.blur === "function") {
      el.blur();
    }
  }, [pathname]);

  if (onLogin) return null;

  const navLinkProps = {
    onMouseDown: preventPointerFocus,
  };

  return (
    <>
      {/*
        ≥960px — full-height left rail; dock centered vertically, flush to the left edge.
        Flex column center avoids transform/safe-area drift at mid widths.
      */}
      <nav
        className="hidden nav:fixed nav:inset-y-0 nav:left-0 nav:z-50 nav:flex nav:w-[calc(var(--nav-desktop-w)+0.75rem)] nav:pointer-events-none"
        aria-label="Primary"
      >
        <div className="flex h-full w-full items-center justify-start pl-3">
          <div
            className={`${shellClass} pointer-events-auto flex w-[var(--nav-desktop-w)] flex-col gap-0.5 rounded-2xl p-2`}
          >
            <ul className="flex flex-col gap-0.5">
              {items.map(({ label, to, Icon }) => {
                const active = pathActive(pathname, to);
                return (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === "/"}
                      className={linkClass(active)}
                      {...navLinkProps}
                    >
                      <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                      <span className="truncate">{label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>

      {/* <960px — bottom dock */}
      <nav
        className="nav:hidden fixed bottom-0 inset-x-0 z-50 safe-bottom pointer-events-none"
        aria-label="Primary mobile"
      >
        <div className="pointer-events-auto mx-auto mb-3 w-[calc(100%-1.5rem)] max-w-lg">
          <div className={`${shellClass} grid grid-cols-4 gap-0.5 rounded-2xl p-1.5`}>
            {items.map(({ to, mobileLabel, Icon }) => {
              const active = pathActive(pathname, to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  {...navLinkProps}
                  className={`
                    flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-all duration-200
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-400
                    ${
                      active
                        ? "bg-gradient-to-b from-indigo-500/90 to-cyan-500/80 text-white ring-1 ring-white/25 shadow-inner"
                        : "text-slate-300 hover:bg-white/8 hover:text-white"
                    }
                  `}
                >
                  <Icon
                    className={`h-6 w-6 shrink-0 ${active ? "text-white" : "text-slate-300"}`}
                    aria-hidden
                  />
                  <span
                    className={`max-w-full truncate px-0.5 text-[11px] font-semibold leading-none sm:text-xs ${
                      active ? "text-white" : "text-slate-300"
                    }`}
                  >
                    {mobileLabel}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
