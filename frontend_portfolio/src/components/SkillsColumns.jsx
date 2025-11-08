// src/components/SkillsColumns.jsx
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const GAP_X = 14;   // space between columns
const GAP_Y = 10;   // space between chips
const MIN_COL_WIDTH = 180; // only switch to 3 cols if each col gets at least this width

export default function SkillsColumns({
    show = false,
    tags = [],

    // Bounds
    anchorLeftId,                 // e.g. "heroRightEdge" ← strongly recommended
    anchorRightId = "projectsRail",
    anchorTopId = "heroName",
    anchorBottomId = "einsteinQuote",

    // Fallback if you don't provide anchorLeftId
    leftVW = 50,
    topOffset = 0,       // 👈 NEW — move the zone up or down
    bottomOffset = 0,    // 👈 NEW — move the zone up or down               // % viewport width where the zone starts (kept right of hero)
    padLeft = 12,
    padRight = 16,
    padTop = 8,
    rightVW = 100,
    rightOffset = 0,
    padBottom = 16,

    // Animation
    baseDelay = 0.25,             // delay before first chip
    perItemDelay = 0.08,          // extra delay per chip (stagger)
}) {
    const [zone, setZone] = useState(null);

    const vwvh = useMemo(() => ({
        vw: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
        vh: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
    }), []);

    useLayoutEffect(() => {
        const r = (id) => {
            const el = id ? document.getElementById(id) : null;
            return el ? el.getBoundingClientRect() : null;
        };

        const calc = () => {
            const { vw } = vwvh;

            // left bound
            let left = Math.floor(vw * (leftVW / 100));
            const leftRect = r(anchorLeftId);
            if (leftRect) left = Math.max(left, Math.round(leftRect.right + window.scrollX) + padLeft);

            // right bound (white rail)
            let right = vw * (rightVW / 100); // fallback: use % of viewport width
            const rightRect = r(anchorRightId);
            if (rightRect) {
                right = Math.round(rightRect.left + window.scrollX) - padRight;
            }
            // Apply manual offset even if anchorRightId is undefined
            right += rightOffset;

            // top/bottom
            let top = 160; // default baseline
            const topRect = r(anchorTopId);
            if (topRect) {
                top = Math.round(topRect.bottom + window.scrollY) + padTop;
            }
            // Apply offset even if anchorTopId is undefined
            top += topOffset;


            let bottom = Math.max(top + 240, window.innerHeight - 140);
            const bottomRect = r(anchorBottomId);
            if (bottomRect) {
                bottom = Math.round(bottomRect.top + window.scrollY) - padBottom;
            }
            // Apply offset even if anchorBottomId is undefined
            bottom += bottomOffset;


            const width = Math.max(240, right - left);
            const height = Math.max(160, bottom - top);

            setZone({ left, top, width, height });
        };

        calc();
        window.addEventListener("resize", calc);
        return () => window.removeEventListener("resize", calc);
    }, [anchorLeftId, anchorRightId, anchorTopId, anchorBottomId, leftVW, padLeft, padRight, padTop, padBottom, vwvh]);

    if (!show || !zone) return null;

    // Decide columns: 3 if there is space for at least MIN_COL_WIDTH each
    const canThree = (zone.width - 2 * GAP_X) / 3 >= MIN_COL_WIDTH;
    const cols = canThree ? 3 : 2;

    // Split tags into columns (balanced-ish)
    const columns = Array.from({ length: cols }, () => []);
    tags.forEach((t, i) => {
        columns[i % cols].push(t);
    });

    return (
        <div
            className="fixed z-10 pointer-events-none"
            style={{
                left: zone.left,
                top: zone.top,
                width: zone.width,
                height: zone.height,
                overflowY: "auto", // if many skills, scroll inside zone (won't cover the quote)
            }}
            aria-hidden
        >
            <div
                className="flex"
                style={{ gap: GAP_X }}
            >
                {columns.map((col, ci) => (
                    <div key={ci} className="flex flex-col" style={{ gap: GAP_Y }}>
                        {col.map((label, idx) => {
                            const globalIndex = ci + idx * cols;              // stable stagger across columns
                            const tilt = (Math.random() * 2 - 1) * 1.4;        // small random tilt per chip
                            const idleAmp = 2 + ((globalIndex % 3));           // subtle drift amplitude
                            const idleDur = 6 + ((globalIndex % 4) * 1.2);     // subtle drift speed

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
                                    className="pointer-events-auto select-none"
                                    style={{ width: "max-content" }}  // ← width = text size
                                >
                                    {/* inner drift */}
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
                                            delay: baseDelay + globalIndex * perItemDelay + 0.6, // starts after landing
                                        }}
                                        className="
                      relative inline-flex items-center justify-center
                      px-3.5 md:px-4 py-1.5 md:py-2 rounded-xl
                      bg-yellow-300/90 text-neutral-900
                      text-sm md:text-base font-semibold tracking-wide
                      shadow-[0_6px_20px_rgba(0,0,0,0.08)]
                      border border-neutral-900/10
                      text-center
                    "
                                    >
                                        <span
                                            className="
                        absolute -top-2 left-1/2 -translate-x-1/2
                        w-2.5 h-2.5 rounded-full bg-neutral-900 dark:bg-neutral-200
                        shadow-[0_0_0_3px_rgba(0,0,0,0.08)]
                      "
                                        />
                                        {label}
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
