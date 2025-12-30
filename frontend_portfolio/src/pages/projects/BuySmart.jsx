import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "http://127.0.0.1:8000";

export default function BuySmart() {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all"); // future use
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState("Type a product (Hebrew/English) and press Search.");
  const [error, setError] = useState("");
  const [rawResults, setRawResults] = useState(null);

  // Optional categories UI (simple)
  const [catsOpen, setCatsOpen] = useState(false);
  const [catsLoading, setCatsLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const resultsRef = useRef(null);

  // ---- helpers ----
  const safeText = (v) => (v == null ? "" : String(v));
  const formatIls = (n) =>
    n == null || Number.isNaN(Number(n)) ? "—" : `₪${Number(n).toFixed(2)}`;

  const normalizeHetzi = (payload) => {
    // Backend returns: { query, results: [ ... ] }
    // Each block might contain: { searched_results: [...] }
    const container = payload?.results?.[0] ?? payload;

    const resultsBlocks = Array.isArray(container?.results)
      ? container.results
      : [container];

    const ok = container?.IsOK ?? true;

    const items = resultsBlocks.flatMap((block) => {
      const arr = Array.isArray(block?.searched_results) ? block.searched_results : [];
      return arr.map((it) => ({
        source: "hetzi-hinam",
        subCategory: it?.prod_sub_cat_name,
        id: it?.prod_id,
        name: it?.prod_name,
        image: it?.prod_img,
        unit: it?.prod_unit_size_desc || "",
        price: it?.prod_price_net ?? it?.prod_price_per_unit ?? null,
        pricePerUnitDesc: it?.prod_price_un_desc || "",
        raw: it,
        p_link: "https://shop.hazi-hinam.co.il/catalog/products/" +
          it?.prod_id + "/" +
          it?.prod_barkod + "/" +
          it?.prod_name
      }));
    });

    const errDesc =
      container?.ErrorResponse?.ErrorDescription ||
      container?.ErrorResponse?.InputValidationErrors?.[0]?.ErrorDescription ||
      container?.detail ||
      "";

    return {
      ok: Boolean(ok),
      items,
      error: errDesc,
      raw: container,
    };
  };

  const { normalized, orderedResults } = useMemo(() => {
    if (!rawResults) return { normalized: null, orderedResults: [] };

    const hetzi = normalizeHetzi(rawResults);

    // IMPORTANT: keep backend order (no sorting). Just cap how many to show for UI.
    const ordered = hetzi.items || []

    return {
      normalized: { hetzi },
      orderedResults: ordered,
    };
  }, [rawResults]);

  // ---- UX hints ----
  useEffect(() => {
    if (loading) {
      setHint(`Searching for “${query || "…"}”…`);
      return;
    }
    if (!query) {
      setHint("Type a product (Hebrew/English) and press Search.");
      return;
    }
    if (rawResults && !error) {
      setHint(`Results for “${query}”.`);
      return;
    }
    setHint(`Ready to search “${query}”.`);
  }, [query, loading, rawResults, error]);

  // ---- actions ----
  const runSearch = async () => {
    const q = query.trim();
    if (!q || loading) return;

    setError("");
    setLoading(true);
    setRawResults(null);

    try {
      const res = await axios.get(`${API_BASE}/scrapers/search`, {
        params: { q, sources: sourceFilter },
        timeout: 25000,
      });

      setRawResults(res.data);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Failed to fetch results. Check backend is running and CORS is enabled.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") runSearch();
  };

  const toggleCategories = async () => {
    const next = !catsOpen;
    setCatsOpen(next);

    if (next && categories.length === 0 && !catsLoading) {
      setCatsLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE}/scrapers/getCategories`, { timeout: 25000 });
        setCategories(res.data || []);
      } catch (e) {
        const msg = e?.response?.data?.detail || e?.message || "Failed to fetch categories.";
        setError(msg);
      } finally {
        setCatsLoading(false);
      }
    }
  };

  // ---- UI components ----
  const PillButton = ({ active, onClick, children, tone = "cyan" }) => {
    const toneClass =
      tone === "yellow"
        ? "border-yellow-300/60 bg-yellow-400/10 text-yellow-100 shadow-[0_0_12px_rgba(255,255,0,0.25)]"
        : "border-cyan-300/60 bg-cyan-400/10 text-cyan-100 shadow-[0_0_12px_rgba(0,255,255,0.25)]";

    return (
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={`
          px-4 py-2 rounded-full text-sm font-semibold
          border ${toneClass}
          transition
          ${active ? "brightness-125" : "hover:brightness-110"}
        `}
      >
        {children}
      </motion.button>
    );
  };

  const ProductCard = ({ p }) => (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="
        rounded-2xl p-4
        bg-white/5 border border-cyan-400/30
        shadow-[0_0_18px_rgba(0,255,255,0.12)]
        backdrop-blur
        flex gap-4
      "
    >
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/30 border border-cyan-300/20 flex items-center justify-center shrink-0">
        {p.image ? (
          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <span className="opacity-60 text-sm">No image</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* CHANGED: removed truncate, allow wrap, allow breaking long words */}
            <div className="text-base md:text-lg font-semibold text-cyan-50 whitespace-normal break-words leading-snug">
              {safeText(p.name)}
            </div>

            <div className="text-xs text-cyan-200/70 mt-1">
              {p.subCategory ? `Category: ${p.subCategory}` : ""}
              {p.unit ? ` • Unit: ${p.unit}` : ""}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xs uppercase tracking-widest text-yellow-200/70">
              Price
            </div>
            <div className="text-xl font-extrabold text-yellow-300">
              {formatIls(p.price)}
            </div>
          </div>
        </div>

        {p.pricePerUnitDesc ? (
          <div className="mt-2 text-sm text-cyan-200/80">
            {p.pricePerUnitDesc}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] px-2 py-1 rounded-full border border-cyan-300/30 text-cyan-100/80 bg-white/5">
            Source: {p.source}
          </span>

          {p.id != null && (
            <span className="text-[11px] px-2 py-1 rounded-full border border-cyan-300/30 text-cyan-100/80 bg-white/5">
              ID: {p.id}
            </span>

          )}
          <a
  href={p.p_link}
  target="_blank"
  rel="noopener noreferrer"
  className="
    inline-flex items-center justify-center
    text-[11px] font-semibold
    px-2 py-1
    rounded-full
    border border-cyan-300/40
    bg-gradient-to-r from-cyan-500/20 to-blue-600/20
    shadow-[0_0_16px_rgba(0,255,255,0.18)]
    backdrop-blur-md
    transition-all duration-300
    hover:brightness-125 hover:scale-[1.04] hover:shadow-[0_0_24px_rgba(255,255,0,0.22)]
    active:scale-95
  "
>
  Link To Product
</a>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="relative min-h-screen text-white overflow-y-auto flex flex-col items-center justify-start pt-24 pb-32">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#020617] via-[#040a20] to-black" />
      <motion.div
        className="absolute -top-32 -left-32 w-[160vw] h-[160vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(30,150,255,0.12)_0%,transparent_70%)] -z-10"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 240, repeat: Infinity, ease: "linear" }}
      />

      <motion.h1
        className="text-4xl md:text-6xl font-extrabold mb-4 text-center tracking-wide drop-shadow-[0_0_12px_rgba(0,200,255,0.35)]"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
      >
        🛒 BuySmart Lab
      </motion.h1>

      <div className="mt-2 mb-8 px-4 py-2 rounded-full border border-cyan-400/30 bg-white/10 backdrop-blur text-cyan-100 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
        {hint}
      </div>

      <motion.div
        className="z-20 w-full max-w-3xl px-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        <div className="flex flex-col gap-3 rounded-3xl p-5 bg-white/5 border border-cyan-400/30 backdrop-blur shadow-[0_0_22px_rgba(0,255,255,0.12)]">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder='Search product… e.g., "בננה" / "חלב" / "עגבניה"'
              className="
                w-full text-lg md:text-xl text-center font-semibold text-indigo-100 placeholder-indigo-300
                bg-black/20 border-2 border-cyan-400/40 rounded-full px-6 py-3
                focus:outline-none focus:ring-4 focus:ring-yellow-300/30
                focus:border-yellow-300 shadow-md transition-all duration-300
              "
            />
            <motion.button
              onClick={runSearch}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="
                px-7 py-3 rounded-full font-bold text-black bg-yellow-300 hover:bg-yellow-400
                shadow-[0_0_25px_rgba(255,255,0,0.35)]
                transition disabled:opacity-60 disabled:cursor-not-allowed
              "
              disabled={!query.trim() || loading}
            >
              {loading ? "Searching..." : "Search"}
            </motion.button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <PillButton tone="cyan" active={catsOpen} onClick={toggleCategories}>
              {catsOpen ? "Hide Categories" : "Show Categories"}
            </PillButton>

            <PillButton
              tone="yellow"
              active={false}
              onClick={() => {
                setQuery("");
                setRawResults(null);
                setError("");
                setHint("Type a product (Hebrew/English) and press Search.");
              }}
            >
              Clear
            </PillButton>

            <div className="px-3 py-1.5 rounded-full border border-cyan-300/30 bg-white/5 text-xs text-cyan-100/70">
              Sources: {sourceFilter} (UI ready; backend can use later)
            </div>
          </div>

          <AnimatePresence>
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-2 text-sm text-red-200 bg-red-900/20 border border-red-400/30 rounded-2xl px-4 py-3"
              >
                {error}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {catsOpen ? (
              <motion.div
                key="cats"
                initial={{ opacity: 0, y: -10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.18 }}
                className="
                  mt-2 rounded-2xl p-4
                  bg-black/35 border border-cyan-300/30
                  shadow-[0_0_18px_rgba(0,255,255,0.10)]
                  backdrop-blur
                "
              >
                {catsLoading ? (
                  <div className="text-cyan-200">Loading categories…</div>
                ) : categories.length === 0 ? (
                  <div className="text-cyan-200/70 text-sm">
                    No categories loaded (or endpoint returned empty).
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories.map((block, idx) => (
                      <div key={idx}>
                        <div className="text-xs uppercase tracking-widest text-cyan-200/70 mb-2">
                          Source: {block.source}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(block.data || []).slice(0, 60).map((c) => (
                            <button
                              key={c.id}
                              onClick={() => setQuery(c.name || "")}
                              className="
                                px-3 py-1.5 rounded-full text-xs font-semibold
                                bg-cyan-900/35 border border-cyan-400/40 text-cyan-100
                                hover:bg-cyan-800/40 transition
                              "
                              title={`Category ID: ${c.id}`}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 text-[11px] text-cyan-100/50">
                          Showing first 60 categories for UI cleanliness.
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>

      <div ref={resultsRef} className="z-20 w-full max-w-5xl px-4 mt-10">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xl text-cyan-200 text-center mt-10"
            >
              Fetching results for “{query}”…
            </motion.div>
          ) : rawResults ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <div className="rounded-3xl p-5 bg-white/5 border border-cyan-400/30 backdrop-blur shadow-[0_0_22px_rgba(0,255,255,0.10)]">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-cyan-200/70">
                      Query
                    </div>
                    <div className="text-2xl font-extrabold text-cyan-50">
                      {query}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* CHANGED: label + count based on orderedResults */}
                    <span className="text-xs px-3 py-1.5 rounded-full border border-yellow-300/40 bg-yellow-400/10 text-yellow-100">
                      Results shown: {orderedResults.length}
                    </span>
                    <span className="text-xs px-3 py-1.5 rounded-full border border-cyan-300/40 bg-cyan-400/10 text-cyan-100">
                      Source: hetzi-hinam (for now)
                    </span>
                  </div>
                </div>

                {!normalized?.hetzi?.ok && normalized?.hetzi?.error ? (
                  <div className="mt-3 text-sm text-red-200 bg-red-900/20 border border-red-400/30 rounded-2xl px-4 py-3">
                    Hetzi-Hinam returned an error: {normalized.hetzi.error}
                  </div>
                ) : null}
              </div>

              {/* CHANGED: show orderedResults (backend order) */}
              {orderedResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orderedResults.map((p, idx) => (
                    <ProductCard key={`${p.id ?? "p"}-${idx}`} p={p} />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl p-6 bg-white/5 border border-cyan-400/20 backdrop-blur text-center text-cyan-200/70">
                  No items found (or the source returned empty).
                </div>
              )}

              <details className="mt-4 rounded-2xl bg-black/30 border border-cyan-300/20 p-4">
                <summary className="cursor-pointer text-sm text-cyan-200/80">
                  Debug: show raw response JSON
                </summary>
                <pre className="mt-3 text-xs overflow-auto whitespace-pre-wrap text-cyan-100/70">
                  {JSON.stringify(rawResults, null, 2)}
                </pre>
              </details>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-cyan-200/70 mt-10"
            >
              No search yet. Enter a query above.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}