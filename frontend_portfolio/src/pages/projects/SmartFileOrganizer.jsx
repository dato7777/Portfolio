// frontend_portfolio/src/pages/projects/SmartFileOrganizer.jsx
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../api/client";

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}

export default function SmartFileOrganizer() {
  const [files, setFiles] = useState([]);
  const [folderLabel, setFolderLabel] = useState("");
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [statsSummary, setStatsSummary] = useState(null);

  const progressIntervalRef = useRef(null);
  const statsRef = useRef(null);
  const hasScrolledToStats = useRef(false); // 👈 prevent double-scroll in StrictMode

  // Cleanup interval when unmounting
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  // Smooth scroll to stats ONCE when they appear
  useEffect(() => {
    if (statsSummary && statsRef.current && !hasScrolledToStats.current) {
      hasScrolledToStats.current = true;

      // Scroll so the stats card is nicely below the header
      const rect = statsRef.current.getBoundingClientRect();
      const offsetTop = rect.top + window.scrollY - 120; // adjust 120px if needed

      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  }, [statsSummary]);

  const handleFolderChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) {
      setFiles([]);
      setFolderLabel("");
      setMessage("No folder selected.");
      return;
    }

    setFiles(selectedFiles);
    setStatsSummary(null); // reset last stats
    hasScrolledToStats.current = false; // reset scroll guard

    const first = selectedFiles[0];
    // webkitRelativePath is non-standard but works in Chrome/Edge
    const relPath = first.webkitRelativePath || first.name;
    const parts = relPath.split("/");
    const folderName = parts.length > 1 ? parts[0] : "(selected files)";

    setFolderLabel(folderName);
    setMessage("");
  };

  const startFakeProgress = () => {
    setProgress(5);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    let current = 5;
    progressIntervalRef.current = setInterval(() => {
      current = Math.min(current + Math.random() * 10, 92); // smoothly approach 92%
      setProgress(Math.floor(current));
    }, 150);
  };

  const stopFakeProgress = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) {
      setMessage("Please choose a folder first.");
      return;
    }

    setStatus("uploading");
    setMessage("");
    setStatsSummary(null);
    hasScrolledToStats.current = false; // new run => allow scroll again
    startFakeProgress();

    try {
      const formData = new FormData();
      files.forEach((f) => {
        formData.append("files", f);
      });

      const response = await api.post(
        "/file-organizer/organize-folder",
        formData,
        {
          responseType: "blob", // we get the zip as binary
        }
      );

      stopFakeProgress();
      setProgress(100);

      // Read stats from header (if backend sent them)
      const headerStats = response.headers["x-file-stats"];
      if (headerStats) {
        try {
          const parsed = JSON.parse(headerStats);
          setStatsSummary(parsed);
        } catch (e) {
          console.warn("Could not parse X-File-Stats header:", e);
        }
      }

      // Trigger download of the returned zip
      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const baseFolder = folderLabel || "organized_folder";
      const downloadName = `organized_${baseFolder}.zip`;
      a.download = downloadName;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setStatus("done");
      setMessage(
        `✅ Done! Your organized folder zip (${downloadName}) has been downloaded. ` +
          `You can find it in your browser's download location (usually the "Downloads" folder).`
      );
    } catch (err) {
      console.error("File organize error:", err);
      stopFakeProgress();
      setStatus("error");

      const backendMsg =
        err?.response?.data?.detail ||
        "Something went wrong while organizing your folder. Please try again.";
      setMessage(backendMsg);
      setProgress(0);
    }
  };

  const categoriesCreated =
    statsSummary?.non_empty_groups ??
    (statsSummary?.groups ? Object.keys(statsSummary.groups).length : 0);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start pt-24 pb-24 px-6 text-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#020617] via-[#020617] to-black" />
      <motion.div
        className="absolute -inset-40 rounded-[40%] bg-gradient-to-tr from-emerald-400/20 via-cyan-400/15 to-indigo-500/20 blur-3xl -z-10"
        animate={{ rotate: [0, 18, -10, 0], scale: [1, 1.05, 0.98, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 text-emerald-300">
          Smart File Organizer
        </h1>
        <p className="text-sm md:text-base text-slate-200/80 max-w-2xl mx-auto">
          Select a messy folder and I&apos;ll send back a clean structure: files
          grouped into{" "}
          <span className="font-semibold">
            Images, Documents, Code, Archives, Audio, Video
          </span>{" "}
          (and more), then further organized by{" "}
          <span className="font-semibold">modification date</span>.
        </p>
      </motion.div>

      {/* Two-column layout: explanation + form */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: How it works */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="bg-white/5 border border-emerald-400/30 rounded-3xl p-6 md:p-7 backdrop-blur shadow-[0_0_26px_rgba(16,185,129,0.25)]"
        >
          <h2 className="text-xl md:text-2xl font-semibold mb-3 text-emerald-200">
            How the demo works
          </h2>
          <ol className="list-decimal ml-5 space-y-2 text-sm md:text-[15px] text-slate-100/90">
            <li>
              Use the picker on the right to select a{" "}
              <span className="font-semibold">folder</span> (e.g. your
              Downloads).
            </li>
            <li>
              The browser sends a temporary copy of all files in that folder to
              the backend.
            </li>
            <li>
              The backend runs the{" "}
              <span className="font-semibold">Python organizer (type + date)</span>,
              groups your files into categories and dates, and zips the result.
            </li>
            <li>
              You get an{" "}
              <span className="font-semibold">organized_*.zip</span> to download
              and inspect.
            </li>
          </ol>
          <div className="mt-4 text-xs md:text-[13px] text-slate-100/85">
            <p className="font-semibold mb-1 text-emerald-200">
              How files are grouped:
            </p>
            <ul className="list-disc ml-4 space-y-1">
              <li>
                <span className="font-semibold text-emerald-300">Images</span> – jpg,
                png, gif, webp, heic…
              </li>
              <li>
                <span className="font-semibold text-emerald-300">Documents</span> – pdf,
                docx, txt, xlsx, pptx…
              </li>
              <li>
                <span className="font-semibold text-emerald-300">Code</span> – py, js,
                ts, html, css, json…
              </li>
              <li>
                <span className="font-semibold text-emerald-300">Archives</span> – zip,
                rar, 7z, tar, gz…
              </li>
              <li>
                <span className="font-semibold text-emerald-300">
                  Audio / Video
                </span>{" "}
                – mp3, wav, mp4, mkv, etc.
              </li>
              <li>
                <span className="font-semibold text-emerald-300">Other</span> –
                anything that doesn&apos;t fit above.
              </li>
            </ul>
          </div>
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-300/40 text-xs md:text-[13px] text-emerald-50">
            <span className="font-semibold">Tech highlight:</span>{" "}
            Same core logic powers a desktop app built with{" "}
            <span className="font-semibold">Python + Tkinter</span>, and this
            web demo uses <span className="font-semibold">FastAPI</span> on the
            backend to organize a temporary copy of your folder.
          </div>
        </motion.div>

        {/* Right: Folder picker + upload card */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="bg-white/5 border border-cyan-400/30 rounded-3xl p-6 md:p-7 backdrop-blur shadow-[0_0_26px_rgba(34,211,238,0.25)] flex flex-col gap-4"
        >
          <h2 className="text-xl md:text-2xl font-semibold text-cyan-200 mb-1">
            Try it with your own folder
          </h2>
          <p className="text-xs md:text-sm text-slate-100/80 mb-2">
            Pick any folder (documents, downloads, photos…). The server will
            send back an organized copy as a zip.
          </p>

          {/* Folder input area */}
          <label className="mt-2 block border-2 border-dashed border-cyan-400/50 rounded-2xl px-4 py-6 text-center cursor-pointer bg-black/20 hover:bg-black/30 transition">
            <div className="text-3xl mb-2">📁</div>
            <div className="text-sm font-semibold text-cyan-100">
              {folderLabel
                ? `Folder selected: ${folderLabel}`
                : "Click to choose a folder"}
            </div>
            <div className="mt-1 text-[11px] text-cyan-200/70">
              A temporary copy of all files inside will be organized on the
              server.
            </div>
            <input
              type="file"
              webkitdirectory="true"
              directory="true"
              multiple
              className="hidden"
              onChange={handleFolderChange}
            />
          </label>

          {/* Selected file info */}
          {files.length > 0 && (
            <div className="mt-2 text-xs md:text-sm text-slate-100/90 flex items-center justify-between bg-black/30 rounded-xl px-3 py-2">
              <div className="truncate">
                <span className="font-semibold text-cyan-200">
                  Files selected:
                </span>{" "}
                <span>{files.length}</span>
              </div>
              <span className="ml-3 text-[11px] text-slate-300/80">
                (folder: {folderLabel || "n/a"})
              </span>
            </div>
          )}

          {/* Progress bar */}
          {status === "uploading" && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1 text-[11px] text-cyan-200/80">
                <span>Organizing your folder…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800/70 rounded-full overflow-hidden border border-cyan-300/40">
                <div
                  className="h-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-sky-400 rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Status / message */}
          {message && (
            <div
              className={`mt-3 text-xs md:text-[13px] rounded-xl px-3 py-2 ${
                status === "error"
                  ? "bg-red-500/15 border border-red-400/60 text-red-100"
                  : "bg-emerald-500/15 border border-emerald-400/60 text-emerald-50"
              }`}
            >
              {message}
            </div>
          )}

          {/* Stats summary */}
          {statsSummary && (
            <div
              ref={statsRef}
              className="mt-4 rounded-2xl bg-black/30 border border-cyan-300/40 p-4 text-[11px] md:text-xs"
            >
              <p className="font-semibold text-cyan-200 mb-2 uppercase tracking-[0.18em]">
                Scan Summary — Your Folder After Transformation
              </p>

              {/* Top summary row */}
              <div className="flex flex-wrap gap-6 mb-3">
                <div>
                  <div className="text-slate-300/80 text-[11px] uppercase tracking-[0.18em]">
                    Categories created
                  </div>
                  <div className="text-lg font-semibold text-cyan-200">
                    {categoriesCreated}
                  </div>
                </div>
                <div>
                  <div className="text-slate-300/80 text-[11px] uppercase tracking-[0.18em]">
                    Files scanned
                  </div>
                  <div className="text-lg font-semibold text-cyan-200">
                    {statsSummary.total_files}
                  </div>
                </div>
                <div>
                  <div className="text-slate-300/80 text-[11px] uppercase tracking-[0.18em]">
                    Total size
                  </div>
                  <div className="text-lg font-semibold text-cyan-200">
                    {formatBytes(statsSummary.total_bytes)}
                  </div>
                </div>
              </div>

              {/* Per-category cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {Object.entries(statsSummary.groups || {}).map(
                  ([groupName, data]) => (
                    <div
                      key={groupName}
                      className="rounded-xl bg-slate-900/60 border border-cyan-400/30 px-3 py-2 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/80">
                          {groupName}
                        </div>
                        <div className="text-xs text-slate-100/90">
                          {data.count} file
                          {data.count === 1 ? "" : "s"}
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-cyan-100">
                        {formatBytes(data.bytes)}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Submit button */}
          <motion.button
            type="submit"
            whileHover={{ scale: status === "uploading" ? 1 : 1.03 }}
            whileTap={{ scale: status === "uploading" ? 1 : 0.97 }}
            disabled={status === "uploading"}
            className={`mt-4 w-full rounded-full py-2.5 text-sm font-semibold tracking-wide 
              shadow-[0_0_18px_rgba(34,211,238,0.4)]
              transition
              ${
                status === "uploading"
                  ? "bg-slate-600/60 cursor-wait text-slate-200"
                  : "bg-gradient-to-r from-cyan-400 via-emerald-400 to-sky-400 text-slate-900 hover:brightness-110"
              }`}
          >
            {status === "uploading" ? "Working..." : "Upload & Organize"}
          </motion.button>

          <p className="mt-2 text-[11px] text-slate-300/70">
            The original folder on your computer is never touched — we only work
            on a temporary copy of its files and send you back the organized
            version as a zip.
          </p>
        </motion.form>
      </div>
    </div>
  );
}