import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";

// import SVG image files (not as React components)
import europe from "../../assets/continents/europe.svg";
import asia from "../../assets/continents/asia.svg";
import africa from "../../assets/continents/africa.svg";
import northAmerica from "../../assets/continents/north-america.svg";
import southAmerica from "../../assets/continents/south-america.svg";
import oceania from "../../assets/continents/oceania.svg";

const API_URL = "http://127.0.0.1:8000/weather";

const CONTINENTS = [
  { name: "Europe", image: europe },
  { name: "Asia", image: asia },
  { name: "Africa", image: africa },
  { name: "North America", image: northAmerica },
  { name: "South America", image: southAmerica },
  { name: "Oceania", image: oceania },
];

const REGIONS = ["North", "South", "East", "West", "Central"];

export default function Weather() {
  const [continent, setContinent] = useState(null);
  const [region, setRegion] = useState(null);
  const [extremes, setExtremes] = useState(null);
  const [loading, setLoading] = useState(false);

  const resultsRef = useRef(null);

  useEffect(() => {
    if (!continent || !region) return;
    setLoading(true);
    setExtremes(null);
    axios
      .get(`${API_URL}/extremes/${continent}?region=${region}`)
      .then((res) => setExtremes(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [continent, region]);

  useEffect(() => {
    if (extremes && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [extremes]);

  return (
    <div className="relative min-h-screen text-white overflow-y-auto flex flex-col items-center justify-start pt-24 pb-32">
      {/* 🌌 Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#020617] via-[#040a20] to-black" />
      <motion.div
        className="absolute -top-32 -left-32 w-[160vw] h-[160vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(30,150,255,0.12)_0%,transparent_70%)] -z-10"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 240, repeat: Infinity, ease: "linear" }}
      />

      <motion.h1
        className="text-4xl md:text-6xl font-extrabold mb-12 text-center tracking-wide drop-shadow-[0_0_12px_rgba(0,200,255,0.4)]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        🌍 Global Temperature Extremes
      </motion.h1>

      {/* 🌍 Continents */}
      <div className="relative z-20 flex flex-wrap justify-center gap-6 mb-10 px-4">
        {CONTINENTS.map(({ name, image }) => (
          <motion.button
            key={name}
            onClick={() => {
              setContinent(name);
              setRegion(null);
              setExtremes(null);
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className={`relative w-44 h-28 md:w-52 md:h-32 rounded-xl overflow-hidden 
              border-2 transition-all duration-300 
              ${continent === name
                ? "border-cyan-400 bg-cyan-700/20 shadow-[0_0_25px_rgba(0,200,255,0.6)]"
                : "border-cyan-200/30 bg-cyan-900/10 hover:bg-cyan-800/20"
              }`}
          >
            {/* Real SVG background image */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: continent === name ? 0.9 : 0.6 }}
              transition={{ duration: 0.6 }}
            >
              <img
                src={image}
                alt={name}
                className="w-[85%] h-[85%] object-contain brightness-125 contrast-125 opacity-80"
                style={{
                  filter:
                    "drop-shadow(0 0 8px rgba(0,255,255,0.6)) saturate(1.2)",
                }}
              />
            </motion.div>

            {/* radar pulse */}
            <motion.div
              className="absolute inset-0 rounded-xl bg-cyan-400/10"
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            <span className="absolute inset-0 flex items-center justify-center font-semibold text-sm md:text-base tracking-wide z-10 drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]">
              {name}
            </span>
          </motion.button>
        ))}
      </div>

      {/* 🧭 Regions */}
      {continent && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap justify-center gap-4 md:gap-6 mb-12 z-20"
        >
          {REGIONS.map((r) => (
            <motion.button
              key={r}
              onClick={() => setRegion(r)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-2.5 rounded-full font-semibold border-2 transition-all
                ${region === r
                  ? "bg-yellow-400 text-black border-yellow-400 shadow-[0_0_20px_rgba(255,220,80,0.6)]"
                  : "border-cyan-300/50 text-cyan-100 hover:bg-cyan-700/30"
                }`}
            >
              {r}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* 🔄 Loading */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl mt-10 text-cyan-200"
        >
          Scanning {region} {continent} for temperature extremes...
        </motion.div>
      )}

      {/* ❄️🔥 Results */}
      {extremes && (
        <motion.div
          ref={resultsRef}
          className="flex flex-col md:flex-row items-center gap-12 z-10 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="backdrop-blur-lg bg-blue-900/70 rounded-3xl px-10 py-8 shadow-[0_0_25px_rgba(0,100,255,0.4)] text-center border border-blue-400/40"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold mb-3">❄️ Coldest Place</h2>
            <p className="text-2xl">
              {extremes.coldest.name}, {extremes.coldest.country}
            </p>
            <p className="text-4xl font-semibold mt-2 text-cyan-300">
              {extremes.coldest.temp}°C
            </p>
          </motion.div>

          <motion.div
            className="backdrop-blur-lg bg-red-900/70 rounded-3xl px-10 py-8 shadow-[0_0_25px_rgba(255,100,100,0.5)] text-center border border-red-400/40"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-3">🔥 Hottest Place</h2>
            <p className="text-2xl">
              {extremes.hottest.name}, {extremes.hottest.country}
            </p>
            <p className="text-4xl font-semibold mt-2 text-red-300">
              {extremes.hottest.temp}°C
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
