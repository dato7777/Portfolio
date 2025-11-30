import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../api/client";

export default function SmartFileOrganizer() {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState("idle"); // idle | uploading | done | error
    const [message, setMessage] = useState("");
    const [progress, setProgress] = useState(0);
    const progressIntervalRef = useRef(null);

    // Cleanup any interval when unmounting
    useEffect(() => {
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
        };
    }, []);

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        if (!selected.name.toLowerCase().endsWith(".zip")) {
            setMessage("Please upload a .zip file containing the folder you want to organize.");
            setFile(null);
            return;
        }

        setFile(selected);
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
        if (!file) {
            setMessage("Please choose a .zip file first.");
            return;
        }

        setStatus("uploading");
        setMessage("");
        startFakeProgress();

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await api.post("/file-organizer/organize-zip", formData, {
                responseType: "blob", // important so we get the zip as binary
            });

            // stop fake progress and fast-forward to 100
            stopFakeProgress();
            setProgress(100);

            // Trigger download of the returned zip
            const blob = new Blob([response.data], { type: "application/zip" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            const baseName = file.name.replace(/\.zip$/i, "");
            a.download = `organized_${baseName}.zip`;

            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            setStatus("done");
            setMessage("✅ Done! Your organized folder zip has been downloaded.");
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
                    Give me one messy folder (as a <span className="font-semibold">.zip</span>) and I&apos;ll send back
                    a clean structure: files grouped by{" "}
                    <span className="font-semibold">type</span> and{" "}
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
                            On your computer, compress a folder into a{" "}
                            <span className="font-semibold">.zip</span> (e.g. your Downloads).
                        </li>
                        <li>
                            Upload that <span className="font-semibold">.zip</span> using the form on the right.
                        </li>
                        <li>
                            The backend unpacks it, runs the{" "}
                            <span className="font-semibold">Python organizer (type + date)</span>,
                            and repacks everything into a new structure.
                        </li>
                        <li>
                            You get an <span className="font-semibold">organized_*.zip</span> to download and inspect.
                        </li>
                    </ol>

                    <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-300/40 text-xs md:text-[13px] text-emerald-50">
                        <span className="font-semibold">Tech highlight:</span>{" "}
                        Same core logic powers a desktop app built with{" "}
                        <span className="font-semibold">Python + Tkinter</span>, and this
                        web demo uses <span className="font-semibold">FastAPI</span> on the backend
                        to organize a temporary copy of your folder.
                    </div>
                </motion.div>

                {/* Right: Upload card */}
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
                        Upload a <span className="font-semibold">.zip</span> archive of any folder
                        (documents, downloads, photos…). The server will send back an organized copy.
                    </p>

                    {/* File input area */}
                    <label className="mt-2 block border-2 border-dashed border-cyan-400/50 rounded-2xl px-4 py-6 text-center cursor-pointer bg-black/20 hover:bg-black/30 transition">
                        <div className="text-3xl mb-2">📁</div>
                        <div className="text-sm font-semibold text-cyan-100">
                            {file ? "Change selected .zip" : "Click to choose a .zip file"}
                        </div>
                        <div className="mt-1 text-[11px] text-cyan-200/70">
                            Max size depends on your server config. For demo, use a small/medium folder.
                        </div>
                        <input
                            type="file"
                            accept=".zip"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>

                    {/* Selected file info */}
                    {file && (
                        <div className="mt-2 text-xs md:text-sm text-slate-100/90 flex items-center justify-between bg-black/30 rounded-xl px-3 py-2">
                            <div className="truncate">
                                <span className="font-semibold text-cyan-200">Selected:</span>{" "}
                                <span className="truncate">{file.name}</span>
                            </div>
                            <span className="ml-3 text-[11px] text-slate-300/80">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
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
                            className={`mt-3 text-xs md:text-[13px] rounded-xl px-3 py-2 ${status === "error"
                                    ? "bg-red-500/15 border border-red-400/60 text-red-100"
                                    : "bg-emerald-500/15 border border-emerald-400/60 text-emerald-50"
                                }`}
                        >
                            {message}
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
              ${status === "uploading"
                                ? "bg-slate-600/60 cursor-wait text-slate-200"
                                : "bg-gradient-to-r from-cyan-400 via-emerald-400 to-sky-400 text-slate-900 hover:brightness-110"
                            }`}
                    >
                        {status === "uploading" ? "Working..." : "Upload & Organize"}
                    </motion.button>

                    <p className="mt-2 text-[11px] text-slate-300/70">
                        The original folder on your computer is never touched — we only work
                        on a temporary copy of your uploaded zip and send you back the organized version.
                    </p>
                </motion.form>
            </div>
        </div>
    );
}