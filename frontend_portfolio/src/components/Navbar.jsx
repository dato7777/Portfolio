// src/components/MyNavbar.jsx
import React from "react";
import { NavLink } from "react-router-dom";

const items = [
  { label: "Home", to: "/" },
  { label: "Projects", to: "/projects" },
  { label: "Info", to: "/info" },
  { label: "Contact", to: "/contact" },
  { label: "FAQ", to: "/faq" },
];

export default function MyNavbar({ showOnMobile = false }) {
  // hidden on small screens by default; set showOnMobile to true to always show
  const visibility = showOnMobile ? "flex" : "hidden md:flex";

  return (
    <nav
      className={`fixed left-6 top-1/2 -translate-y-1/2 ${visibility} flex-col gap-5 text-sm z-30`}
      aria-label="Primary"
    >
      {items.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          className={({ isActive }) =>
            `group flex items-center gap-3 transition-opacity ${
              isActive ? "opacity-100" : "opacity-70 hover:opacity-100"
            }`
          }
        >
          <span className="block h-2.5 w-2.5 rounded-full bg-neutral-400 group-hover:bg-neutral-900 dark:bg-neutral-500 dark:group-hover:bg-white transition-colors" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
