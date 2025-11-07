// src/components/SkillsRandomWall.jsx
import React, { useEffect, useMemo, useState, useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";

// --- sizing helpers ---
const estimateChipWidth = (label) => {
  const base = 30, perChar = 8.0;
  const w = base + perChar * label.length;
  return Math.max(90, Math.min(260, Math.round(w)));
};
const CHIP_HEIGHT = 36;
const MARGIN = 10;        // gap between chips
const CELL_SIZE = 64;     // spatial grid cell size
const MAX_SAMPLES = 12000;

const rand = (min, max) => Math.random() * (max - min) + min;

// --- geometry helpers ---
const toPx = (v, vw, vh) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    if (v.endsWith("vw")) return (parseFloat(v) / 100) * vw;
    if (v.endsWith("vh")) return (parseFloat(v) / 100) * vh;
    if (v.endsWith("px")) return parseFloat(v);
  }
  return Number(v) || 0;
};

// point-in-polygon (ray casting)
function insidePolygon(x, y, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y;
    const xj = pts[j].x, yj = pts[j].y;
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) c = !c;
  }
  return c;
}

// quick rectangle overlap with margin
function rectsOverlap(a, b) {
  return !(
    a.x + a.w + MARGIN < b.x ||
    b.x + b.w + MARGIN < a.x ||
    a.y + a.h + MARGIN < b.y ||
    b.y + b.h + MARGIN < a.y
  );
}

function gridKey(cx, cy) { return `${cx},${cy}`; }

export default function SkillsRandomWall({
  show = false,
  tags = [],

  // anchors (still supported; used if you don't pass polygon)
  anchorRightId,
  anchorTopId,
  anchorBottomIds = [],

  // rectangular fallback if polygon absent
  leftVW = 50,
  rightPx = 24,
  top = 160,
  bottomOffset = 140,

  // polygon mask (array of points: { x: "60vw" | 820, y: 220 })
  polygon = null,   // ← pass to get exact curvy zone

  // timings / cycling
  delayStart = 0.35,
  perItemDelay = 0.25,
  cycle = true,
  cycleInterval = 2.6,
  stopAfterOnePass = true,
}) {
  const [bounds, setBounds] = useState(null);  // {left,right,top,bottom,vw,vh}
  const [polyPx, setPolyPx] = useState(null);  // polygon converted to px
  const [slots, setSlots] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const timerRef = useRef(null);
  const nextKeyIdRef = useRef(1);

  // viewport snapshot
  const baseBounds = useMemo(() => {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const left = Math.floor(vw * (leftVW / 100));
    const right = vw - rightPx;
    const topPx = top;
    const bottomPx = vh - bottomOffset;
    return { vw, vh, left, right, top: topPx, bottom: bottomPx };
  }, [leftVW, rightPx, top, bottomOffset]);

  // compute rectangular bounds and polygon (if provided)
  useLayoutEffect(() => {
    const rectFor = (id) => {
      const el = id ? document.getElementById(id) : null;
      return el ? el.getBoundingClientRect() : null;
    };

    const calc = () => {
      const { vw, vh } = baseBounds;

      // 1) Rectangle fallback zone (right-half area)
      let left = Math.floor(vw * (leftVW / 100));
      let right = vw - rightPx;

      // Top = after name; Bottom = min(top of bottom anchors) or fallback
      let topY = top;
      const topRect = rectFor(anchorTopId);
      if (topRect) topY = Math.max(topY, Math.round(topRect.bottom + window.scrollY) + 8);

      let bottomY = vh - bottomOffset;
      const bottomRects = anchorBottomIds.map(rectFor).filter(Boolean);
      if (bottomRects.length) {
        bottomY = Math.min(...bottomRects.map(r => Math.round(r.top + window.scrollY) - 18));
      }

      // Right edge from projects rail
      const rightRect = rectFor(anchorRightId);
      if (rightRect) right = Math.min(right, Math.round(rightRect.left + window.scrollX) - 12);

      // sanity
      if (right - left < 240) right = left + 240;
      if (bottomY - topY < 220) bottomY = topY + 220;

      setBounds({ vw, vh, left, right, top: topY, bottom: bottomY });

      // 2) Build polygon-in-px (if provided)
      if (polygon && polygon.length >= 3) {
        const pts = polygon.map(p => ({
          x: toPx(p.x, vw, vh),
          y: toPx(p.y, vw, vh),
        }));
        setPolyPx(pts);
      } else {
        setPolyPx(null);
      }
    };

    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [baseBounds, anchorRightId, anchorTopId, anchorBottomIds, polygon, leftVW, rightPx, top, bottomOffset]);

  // generate non-overlapping RANDOM slots within polygon (or rectangle if no polygon)
  useEffect(() => {
    if (!show || !bounds || !tags.length) return;

    const placed = [];
    const grid = new Map();

    // sampling bbox
    let minX, maxX, minY, maxY;

    if (polyPx && polyPx.length >= 3) {
      minX = Math.min(...polyPx.map(p => p.x));
      maxX = Math.max(...polyPx.map(p => p.x));
      minY = Math.min(...polyPx.map(p => p.y));
      maxY = Math.max(...polyPx.map(p => p.y));
    } else {
      minX = bounds.left;
      maxX = bounds.right;
      minY = bounds.top;
      maxY = bounds.bottom;
    }

    // clamp to viewport
    minX = Math.max(0, minX); minY = Math.max(0, minY);

    // random sampling with spatial grid (blue-noise-ish)
    const widths = tags.map(t => estimateChipWidth(t));
    let tries = 0;

    while (tries < MAX_SAMPLES && placed.length < tags.length) {
      tries++;

      const w = widths[Math.floor(Math.random() * widths.length)];
      const h = CHIP_HEIGHT;

      // choose random top-left inside bbox
      const x = Math.round(rand(minX + 6, maxX - w - 6));
      const y = Math.round(rand(minY,     maxY - h));

      // must be inside polygon (check chip center & four corners), if polygon provided
      if (polyPx) {
        const cx = x + w / 2, cy = y + h / 2;
        const corners = [
          [x, y], [x + w, y], [x, y + h], [x + w, y + h]
        ];
        const okCorners = corners.every(([px, py]) => insidePolygon(px, py, polyPx));
        const okCenter  = insidePolygon(cx, cy, polyPx);
        if (!okCenter || !okCorners) continue;
      } else {
        // rectangle fallback
        if (x < bounds.left || x + w > bounds.right || y < bounds.top || y + h > bounds.bottom) continue;
      }

      const rect = { x, y, w, h };

      // spatial grid collision check
      const cx0 = Math.floor(x / CELL_SIZE);
      const cy0 = Math.floor(y / CELL_SIZE);
      const cx1 = Math.floor((x + w) / CELL_SIZE);
      const cy1 = Math.floor((y + h) / CELL_SIZE);

      let ok = true;
      for (let cx = cx0 - 1; cx <= cx1 + 1 && ok; cx++) {
        for (let cy = cy0 - 1; cy <= cy1 + 1 && ok; cy++) {
          const k = gridKey(cx, cy);
          const list = grid.get(k);
          if (list) {
            for (let idx of list) {
              if (rectsOverlap(rect, placed[idx])) { ok = false; break; }
            }
          }
        }
      }
      if (!ok) continue;

      // place
      const idx = placed.length;
      placed.push(rect);
      for (let cx = cx0; cx <= cx1; cx++) {
        for (let cy = cy0; cy <= cy1; cy++) {
          const k = gridKey(cx, cy);
          if (!grid.has(k)) grid.set(k, []);
          grid.get(k).push(idx);
        }
      }
    }

    // shuffle for varied animation order
    placed.sort(() => Math.random() - 0.5);
    setSlots(placed);
  }, [show, bounds, tags, polyPx]);

  // assign tags to slots + cycle extras so ALL appear
  useEffect(() => {
    if (!show || !bounds || slots.length === 0 || tags.length === 0) return;

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    const capacity = slots.length;
    const order = [...Array(tags.length).keys()].sort(() => Math.random() - 0.5);
    const firstBatch = Math.min(capacity, tags.length);

    const first = order.slice(0, firstBatch).map((tagIdx, i) => ({
      slotIdx: i, tagIdx, keyId: nextKeyIdRef.current++
    }));
    setAssignments(first);

    if (!cycle || firstBatch >= tags.length) return;

    const queue = order.slice(firstBatch);
    timerRef.current = setInterval(() => {
      setAssignments(prev => {
        if (queue.length === 0) {
          if (stopAfterOnePass) { clearInterval(timerRef.current); timerRef.current = null; return prev; }
          for (let i = 0; i < tags.length; i++) queue.push(i);
        }
        if (prev.length === 0) return prev;

        const replaceAt = Math.floor(Math.random() * prev.length);
        const nextTagIdx = queue.shift();
        const updated = [...prev];
        updated[replaceAt] = {
          slotIdx: prev[replaceAt].slotIdx,
          tagIdx: nextTagIdx,
          keyId: nextKeyIdRef.current++,
        };
        return updated;
      });
    }, cycleInterval * 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [show, bounds, slots, tags, cycle, cycleInterval, stopAfterOnePass]);

  if (!show || !bounds) return null;

  return (
    <div
      className="pointer-events-none fixed z-10 hidden md:block"
      style={{
        left: 0, right: 0,
        top: 0, bottom: 0,       // we position absolutely using page coords
      }}
      aria-hidden
    >
      {assignments.map((a, i) => {
        const slot = slots[a.slotIdx];
        const label = tags[a.tagIdx];
        const tiltBase = (Math.random() * 2 - 1) * 1.6;
        const idleAmp = 2 + (i % 3);
        const idleDur = 6 + (i % 4) * 1.2;

        return (
          <motion.div
            key={a.keyId}
            initial={{ y: -80, x: 24, rotate: -9, opacity: 0, scale: 0.95 }}
            animate={{
              y: slot.y,
              x: slot.x,
              rotate: tiltBase,
              opacity: 1,
              scale: 1,
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 28,
              delay: delayStart + (i * perItemDelay),
            }}
            className="absolute"
            style={{ width: slot.w }}
          >
            <motion.div
              animate={{
                y: [0, -idleAmp, idleAmp * 0.6, 0],
                rotate: [tiltBase, tiltBase + 0.35, tiltBase - 0.25, tiltBase],
              }}
              transition={{
                duration: idleDur,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
                delay: delayStart + (i * perItemDelay) + 0.6,
              }}
              className="
                relative mx-auto px-3.5 md:px-4 py-1.5 md:py-2 rounded-xl
                bg-yellow-300/90 text-neutral-900
                text-sm md:text-base font-semibold tracking-wide
                shadow-[0_6px_20px_rgba(0,0,0,0.08)]
                border border-neutral-900/10
                select-none
              "
              style={{ width: "max-content" }}
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-neutral-900 shadow-[0_0_0_3px_rgba(0,0,0,0.08)] dark:bg-neutral-200" />
              {label}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
