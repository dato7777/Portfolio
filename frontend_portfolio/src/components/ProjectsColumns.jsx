// src/components/ProjectsColumns.jsx
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const GAP_X = 14;   // space between columns
const GAP_Y = 10;   // space between chips
const MIN_COL_WIDTH = 180; // only switch to 3 cols if each col gets at least this width

export default function ProjectsColumns({
  show = false,
  tags = [],

  // Bounds
  anchorLeftId,
  anchorRightId = "projectsRail",
  anchorTopId = "heroName",
  anchorBottomId = "einsteinQuote",

  leftVW = 50,
  topOffset = 0,
  bottomOffset = 0,
  padLeft = 12,
  padRight = 16,
  padTop = 8,
  rightVW = 100,
  rightOffset = 0,
  padBottom = 16,

  baseDelay = 0.25,
  perItemDelay = 0.08,
}) {
  const [zone, setZone] = useState(null);

  const vwvh = useMemo(
    () => ({
      vw: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
      vh: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
    }),
    []
  );

  useLayoutEffect(() => {
    const r = (id) => {
      const el = id ? document.getElementById(id) : null;
      return el ? el.getBoundingClientRect() : null;
    };

    const calc = () => {
      const { vw } = vwvh;

      let left = Math.floor(vw * (leftVW / 100));
      const leftRect = r(anchorLeftId);
      if (leftRect) left = Math.max(left, Math.round(leftRect.right + window.scrollX) + padLeft);

      let right = vw * (rightVW / 100);
      const rightRect = r(anchorRightId);
      if (rightRect) {
        right = Math.round(rightRect.left + window.scrollX) - padRight;
      }
      right += rightOffset;

      let top = 160;
      const topRect = r(anchorTopId);
      if (topRect) {
        top = Math.round(topRect.bottom + window.scrollY) + padTop;
      }
      top += topOffset;

      let bottom = Math.max(top + 240, window.innerHeight - 140);
      const bottomRect = r(anchorBottomId);
      if (bottomRect) {
        bottom = Math.round(bottomRect.top + window.scrollY) - padBottom;
      }
      bottom += bottomOffset;

      const width = Math.max(240, right - left);
      const height = Math.max(160, bottom - top);

      setZone({ left, top, width, height });
    };

    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [
    anchorLeftId,
    anchorRightId,
    anchorTopId,
    anchorBottomId,
    leftVW,
    padLeft,
    padRight,
    padTop,
    padBottom,
    vwvh,
  ]);

  if (!show || !zone) return null;

  const canThree = (zone.width - 2 * GAP_X) / 3 >= MIN_COL_WIDTH;
  const cols = canThree ? 3 : 2;

  const columns = Array.from({ length: cols }, () => []);
  tags.forEach((t, i) => {
    columns[i % cols].push(t);
  });

  // 🎯 define clickable project links
  const projectLinks = {
    "QuizProAI": "/projects/quizproai",
    "Smart File Organizer": "/projects/fileorganizer",
    "RainFella Shopify Store": "/projects/rainfella",
    "Rebar Import Simulation": "/projects/rebarsim",
    "Portfolio Website": "/projects/portfolio",
  };

  return (
    <div
      className="fixed z-10 pointer-events-none"
      style={{
        left: zone.left,
        top: zone.top,
        width: zone.width,
        height: zone.height,
        overflowY: "auto",
      }}
      aria-hidden
    >
      <div className="flex" style={{ gap: GAP_X }}>
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col" style={{ gap: GAP_Y }}>
            {col.map((label, idx) => {
              const globalIndex = ci + idx * cols;
              const tilt = (Math.random() * 2 - 1) * 1.4;
              const idleAmp = 2 + (globalIndex % 3);
              const idleDur = 6 + (globalIndex % 4) * 1.2;
              const link = projectLinks[label] || null;

              // 🎬 animated block (with drift)
              const block = (
                <motion.div
                  animate={{
                    y: [0, -idleAmp, idleAmp * 0.6, 0],
                    rotate: [tilt, tilt + 0.35, tilt - 0.25, tilt],
                  }}
                  transition={{
                    duration: idleDur,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                    delay: baseDelay + globalIndex * perItemDelay + 0.6,
                  }}
                  className="relative inline-flex items-center justify-center
                             px-3.5 md:px-4 py-1.5 md:py-2 rounded-xl
                             bg-black/90 text-white
                             text-sm md:text-base font-semibold tracking-wide
                             shadow-[0_6px_20px_rgba(0,0,0,0.08)]
                             border border-neutral-900/10
                             text-center pointer-events-auto select-none
                             hover:bg-neutral-800 transition"
                  style={{ width: "max-content", cursor: link ? "pointer" : "default" }}
                >
                  {label}
                </motion.div>
              );

              return (
                <motion.div
                  key={`${label}-${globalIndex}`}
                  initial={{ y: -16, opacity: 0, rotate: tilt - 6, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, rotate: tilt, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 28,
                    delay: baseDelay + globalIndex * perItemDelay,
                  }}
                >
                  {link ? (
                    <a href={link} className="no-underline text-inherit">
                      {block}
                    </a>
                  ) : (
                    block
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
