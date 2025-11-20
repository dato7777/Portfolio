import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import MiniGlobe from "../../components/miniGlobe";
// import SVG image files (not as React components)
import europe from "../../assets/continents/europe.svg";
import asia from "../../assets/continents/asia.svg";
import africa from "../../assets/continents/africa.svg";
import northAmerica from "../../assets/continents/north-america.svg";
import southAmerica from "../../assets/continents/south-america.svg";
import oceania from "../../assets/continents/oceania.svg";
import ErrorBoundary from "../../components/ErrorBoundary";
import PopulationCounter from "../../components/PopulationCounter";

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
function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!(window.WebGLRenderingContext && gl);
  } catch {
    return false;
  }
}

function useSmoothCounter(target, duration = 2000) {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);
  const animRef = useRef(null);
  const lastValueRef = useRef(0);

  useEffect(() => {
    if (target == null) return;

    cancelAnimationFrame(animRef.current);
    startRef.current = null;

    const animate = (time) => {
      if (!startRef.current) startRef.current = time;

      const elapsed = time - startRef.current;
      const progress = Math.min(elapsed / duration, 1);

      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      const current = Math.floor(eased * target);

      // Only update React state when the number visibly changes
      if (current !== lastValueRef.current) {
        lastValueRef.current = current;
        setValue(current);
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animRef.current);
  }, [target, duration]);

  return value.toLocaleString();
}


function windDirectionText(deg) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}
export default function Weather() {
  // mode: "choose" | "continent" | "city"
  const [mode, setMode] = useState("choose");
  const [mounted, setMounted] = useState(false);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalProgress, setHistoricalProgress] = useState(0);
  // continent flow
  const [continent, setContinent] = useState(null);
  const [region, setRegion] = useState(null);
  const [extremes, setExtremes] = useState(null);
  const [displayedTime, setDisplayedTime] = useState(null);
const [showPopulationDisclaimer, setShowPopulationDisclaimer] = useState(false);
  // city flow
  const [city, setCity] = useState("");
  const [cityData, setCityData] = useState(null);

  // shared
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState("Choose any option to start.");
  const resultsRef = useRef(null);
  // const animatedPopulation = useSmoothCounter(cityData?.city_population);
  // ======== Effects: hints =========
  useEffect(() => {
    if (!cityData?.timezone_id) return;

    const formatter = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: cityData.timezone_id,
    });

    const update = () => {
      setDisplayedTime(formatter.format(new Date()));
    };

    update(); // show instantly
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [cityData]);

  const population = cityData?.city_population;

useEffect(() => {
  // no population → hide disclaimer
  if (population == null) {
    setShowPopulationDisclaimer(false);
    return;
  }

  // new population → restart timer
  setShowPopulationDisclaimer(false);

  // match your counter duration (e.g. 2000ms)
  const id = setTimeout(() => {
    setShowPopulationDisclaimer(true);
  }, 5200);

  return () => clearTimeout(id);
}, [population]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mode === "choose") {
      setHint("Choose any option to start.");
      return;
    }
    if (mode === "continent") {
      if (!continent) setHint("Choose a continent.");
      else if (!region) setHint(`Continent: ${continent}. Now choose a region.`);
      else setHint(`Scanning ${region} ${continent} for extremes…`);
    }
    if (mode === "city") {
      if (!city) setHint("Type a city and press Check.");
      else if (loading) setHint(`Checking live weather for “${city}”…`);
      else setHint(`Ready to check “${city}”.`);
    }
  }, [mode, continent, region, city, loading]);

  // ======== Fetch extremes when both selected =========
  useEffect(() => {
    if (!continent || !region) return;
    setLoading(true);
    setExtremes(null);
    setCityData(null);
    axios
      .get(`${API_URL}/extremes/${continent}`, { params: { region } })
      .then((res) => setExtremes(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [continent, region]);

  // ======== Scroll to results when ready =========
  useEffect(() => {
    if ((extremes || cityData) && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [extremes, cityData]);

  // ======== City check =========
  const checkCity = async (forcedCity) => {
    const q = forcedCity ? forcedCity.trim() : city.trim();
    if (!q || loading) return;
    setLoading(true);
    setHistoricalLoading(true);
    setHistoricalProgress(0);
    setCityData(null);
    setExtremes(null);
    let p = 0;
    const interval = setInterval(() => {
      p = Math.min(p + Math.random() * 12, 98);
      setHistoricalProgress(Math.floor(p));
    }, 300);

    try {
      // IMPORTANT: Backend endpoint is /weather/city
      const res = await axios.get(`${API_URL}/city`, { params: { q }, timeout: 10000 });
      // res.data shape (from your backend):
      // { city, country, lat, lon, temp, humidity, wind, description, icon }
      setCityData(res.data);
      setHistoricalProgress(100);
      setTimeout(() => setHistoricalLoading(false), 500);
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Could not fetch city weather. Try another city.";
      alert(msg);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };


  // Enter key to submit city
  const onCityKeyDown = (e) => {
    if (e.key === "Enter") checkCity();
  };

  // ======== UI Helpers =========
  const OptionCard = ({ title, subtitle, onClick }) => (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="relative w-[260px] md:w-[320px] h-[160px] rounded-2xl overflow-hidden 
                 border-2 border-cyan-300/40 bg-white/5 backdrop-blur
                 shadow-[0_0_30px_rgba(0,255,255,0.08)] hover:shadow-[0_0_40px_rgba(0,255,255,0.22)]
                 transition"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,255,0.09),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,220,80,0.09),transparent_60%)]" />
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center px-5">
        <div className="text-2xl md:text-3xl font-extrabold tracking-wide">{title}</div>
        <div className="mt-2 text-sm md:text-base opacity-80">{subtitle}</div>
      </div>
    </motion.button>
  );

  const Instruction = ({ children }) => (
    <div className="mt-4 mb-8 px-4 py-2 rounded-full border border-cyan-400/30 bg-white/10 backdrop-blur text-cyan-100 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
      {children}
    </div>
  );

  // Build OpenWeather icon URL if provided
  const iconUrl = (icon) =>
    icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : null;

  return (
    <div id="page-scroll-root" className="relative min-h-screen text-white overflow-y-auto flex flex-col items-center justify-start pt-24 pb-32">
      {/* 🌌 Background */}

      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#020617] via-[#040a20] to-black" />
      <motion.div
        className="absolute -top-32 -left-32 w-[160vw] h-[160vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(30,150,255,0.12)_0%,transparent_70%)] -z-10"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 240, repeat: Infinity, ease: "linear" }}
      />

      {/* Title */}
      <motion.h1
        className="text-4xl md:text-6xl font-extrabold mb-6 text-center tracking-wide drop-shadow-[0_0_12px_rgba(0,200,255,0.4)]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        🌍 Weather Lab
      </motion.h1>

      {/* Dynamic hint */}
      <Instruction>{hint}</Instruction>

      {/* Step 1: Mode picker */}
      {mode === "choose" && (
        <div className="relative z-20 flex flex-wrap justify-center gap-6 mb-12 px-4">
          <OptionCard
            title="Extreme by Continent"
            subtitle="Find coldest & hottest spots"
            onClick={() => {
              setMode("continent");
              setContinent(null);
              setRegion(null);
              setExtremes(null);
              setCityData(null);
              setCity("");
            }}
          />
          <OptionCard
            title="Weather by City"
            subtitle="Get live weather for any city"
            onClick={() => {
              setMode("city");
              setContinent(null);
              setRegion(null);
              setExtremes(null);
              setCityData(null);
            }}
          />
        </div>
      )}

      {/* Mode: Extreme by Continent */}
      {mode === "continent" && (
        <>
          {/* Continents */}
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
                {/* SVG image */}
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
                    style={{ filter: "drop-shadow(0 0 8px rgba(0,255,255,0.6)) saturate(1.2)" }}
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

          {/* Regions */}
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

          {/* Loading */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl mt-10 text-cyan-200">
              Scanning {region} {continent} for temperature extremes...
            </motion.div>
          )}

          {/* Results */}
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
                <p className="text-2xl">{extremes.coldest.name}, {extremes.coldest.country}</p>
                <p className="text-4xl font-semibold mt-2 text-cyan-300">{extremes.coldest.temp}°C</p>
              </motion.div>

              <motion.div
                className="backdrop-blur-lg bg-red-900/70 rounded-3xl px-10 py-8 shadow-[0_0_25px_rgba(255,100,100,0.5)] text-center border border-red-400/40"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-3xl font-bold mb-3">🔥 Hottest Place</h2>
                <p className="text-2xl">{extremes.hottest.name}, {extremes.hottest.country}</p>
                <p className="text-4xl font-semibold mt-2 text-red-300">{extremes.hottest.temp}°C</p>
              </motion.div>
            </motion.div>
          )}
        </>
      )}

      {/* Mode: Weather by City */}
      {mode === "city" && (
        <>
          {/* City input row */}
          <motion.div
            className="z-20 w-full max-w-2xl mt-4 px-4"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={onCityKeyDown}
                placeholder="Type a city… e.g., Reykjavík"
                className="w-full text-lg md:text-xl text-center font-semibold text-indigo-100 placeholder-indigo-300 
                           bg-white/10 border-2 border-cyan-400/40 rounded-full px-6 py-3 
                           focus:outline-none focus:ring-4 focus:ring-yellow-300/40 
                           focus:border-yellow-300 shadow-md transition-all duration-300"
              />
              <motion.button
                onClick={() => checkCity()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="px-7 py-3 rounded-full font-bold text-black bg-yellow-300 hover:bg-yellow-400
                           shadow-[0_0_25px_rgba(255,255,0,0.35)] transition disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!city || loading}
              >
                {loading ? "Checking..." : "Check"}
              </motion.button>
            </div>
          </motion.div>

          {/* Loading */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl mt-8 text-cyan-200">
              Fetching live weather for “{city}”…
            </motion.div>
          )}

          {/* City result */}
          {cityData && (
            <motion.div
              ref={resultsRef}
              className="z-20 mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* Left: Summary card */}
              <div className="backdrop-blur-lg bg-white/10 border border-cyan-400/30 rounded-3xl p-8 shadow-[0_0_25px_rgba(0,255,255,0.18)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-extrabold tracking-wide mb-1">
                    {cityData.city}
                    {cityData.country ? `, ${cityData.country}` : ""}
                  </h3>
                  {iconUrl(cityData.icon) && (
                    <img
                      src={iconUrl(cityData.icon)}
                      alt="weather icon"
                      className="w-16 h-16 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                    />
                  )}
                </div>

                <p className="opacity-80 capitalize">{cityData.description || "—"}</p>

                <div className="mt-4 text-5xl font-bold text-cyan-200">
                  {cityData.temp != null ? Math.round(cityData.temp) : "—"}°C
                </div>
                {/* Historical loading */}
                <div
                  className="relative"
                  style={{ minHeight: "130px" }} // reserve final height!
                >
                  {historicalLoading && (
                    <div className="mt-6 w-full flex flex-col items-center">
                      <div className="text-sm text-cyan-200 mb-2">
                        Comparing to historical data…
                      </div>

                      <div className="w-40 h-3 bg-cyan-900/30 rounded-full overflow-hidden border border-cyan-400/40 shadow-inner">
                        <div
                          style={{ width: `${historicalProgress}%` }}
                          className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 transition-all duration-200"
                        />
                      </div>

                      <div className="text-xs mt-1 opacity-70">
                        {historicalProgress}%
                      </div>
                    </div>
                  )}

                  {/* Historical anomaly result */}
                  {!historicalLoading && cityData?.historical_avg_temp != null && (
                    <motion.div
                      className="mt-3 p-5 rounded-2xl backdrop-blur bg-black/30 border border-yellow-400/40 shadow-[0_0_15px_rgba(255,200,0,0.2)]"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="text-lg font-bold text-yellow-300 mb-1">
                        Historical Comparison
                      </div>

                      <div className="text-sm text-yellow-200 opacity-80">
                        Average for this date:{" "}
                        <span className="font-semibold text-yellow-300">
                          {cityData.historical_avg_temp?.toFixed(1)}°C
                        </span>
                      </div>

                      <div className="text-sm text-cyan-200 mt-1">
                        Today's temp:{" "}
                        <span className="font-semibold text-cyan-300">
                          {cityData.temp?.toFixed(1)}°C
                        </span>
                      </div>

                      {cityData.temp_anomaly != null && (
                        <div className="mt-3 text-base font-semibold text-white">
                          {cityData.anomaly_text}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
               {/* Animated Population Counter */}
{cityData.city_population != null && (
  <motion.div
    className="mt-4 px-4 py-3 rounded-2xl bg-black/30 border border-green-400/40 
           backdrop-blur shadow-[0_0_12px_rgba(0,255,100,0.3)]
           flex flex-col items-center"
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <div className="text-green-300 font-semibold text-xs tracking-widest uppercase mb-1">
      Population
    </div>

    <div className="text-3xl font-bold text-green-200 drop-shadow-[0_0_10px_rgba(0,255,150,0.5)] font-mono">
      <PopulationCounter target={cityData.city_population} />
    </div>

    {/* Disclaimer appears only after counter finishes */}
    {showPopulationDisclaimer && (
      <div className="mt-1 text-[11px] text-green-100/70 italic text-center">
        Population data is approximate and may be outdated.
      </div>
    )}
  </motion.div>
)}
                {/* ...HERE WE INPUT WHATS ON RIGHT SIDE ...*/}
                <div className="grid grid-cols-2 gap-4 text-sm mt-8">

                  {/* Feels Like */}
                  <motion.div
                    className="p-3 rounded-xl bg-white/10 border border-cyan-300/20 backdrop-blur 
               shadow-[0_0_15px_rgba(0,255,255,0.15)] flex flex-col"
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🔥</span>
                      <span className="font-semibold text-cyan-200">Feels Like</span>
                    </div>
                    <span className="text-xl font-bold">
                      {cityData.feels_like != null ? `${Math.round(cityData.feels_like)}°C` : "—"}
                    </span>
                  </motion.div>

                  {/* Rain Volume */}
                  {cityData.rain_1h != null && (
                    <motion.div
                      className="p-3 rounded-xl bg-blue-900/30 border border-blue-400/30 backdrop-blur 
                 shadow-[0_0_15px_rgba(0,150,255,0.3)] flex flex-col"
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">🌧️</span>
                        <span className="font-semibold text-blue-200">Rain (1h)</span>
                      </div>
                      <span className="text-xl font-bold text-blue-300">{cityData.rain_1h} mm</span>
                    </motion.div>
                  )}
                  <motion.div
                    className="p-3 rounded-xl bg-indigo-900/30 border border-indigo-400/30 backdrop-blur 
             shadow-[0_0_15px_rgba(120,150,255,0.3)] flex flex-col"
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">💨</span>
                      <span className="font-semibold text-indigo-200">Wind Speed</span>
                    </div>
                    <span className="text-xl font-bold text-indigo-300">
                      {cityData.wind != null ? `${cityData.wind} m/s` : "—"}
                    </span>
                  </motion.div>
                  {/* Snow Volume */}
                  {cityData.snow_1h != null && (
                    <motion.div
                      className="p-3 rounded-xl bg-cyan-900/30 border border-cyan-300/30 backdrop-blur 
                 shadow-[0_0_15px_rgba(0,255,255,0.3)] flex flex-col"
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">❄️</span>
                        <span className="font-semibold text-cyan-100">Snow (1h)</span>
                      </div>
                      <span className="text-xl font-bold text-cyan-200">{cityData.snow_1h} mm</span>
                    </motion.div>
                  )}

                  {/* Cloudiness */}
                  <motion.div
                    className="p-3 rounded-xl bg-white/10 border border-gray-300/20 backdrop-blur 
               shadow-[0_0_15px_rgba(200,200,200,0.15)] flex flex-col"
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">☁️</span>
                      <span className="font-semibold">Cloudiness</span>
                    </div>
                    <span className="text-xl font-bold">{cityData.cloudiness}%</span>
                  </motion.div>

                  {/* Pressure */}
                  <motion.div
                    className="p-3 rounded-xl bg-white/10 border border-yellow-300/30 backdrop-blur 
               shadow-[0_0_15px_rgba(255,255,0,0.15)] flex flex-col"
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🧭</span>
                      <span className="font-semibold text-yellow-200">Pressure</span>
                    </div>
                    <span className="text-xl font-bold">{cityData.pressure} hPa</span>
                  </motion.div>

                  {/* Visibility */}
                  <motion.div
                    className="p-3 rounded-xl bg-indigo-900/30 border border-indigo-400/30 backdrop-blur 
               shadow-[0_0_15px_rgba(120,90,255,0.3)] flex flex-col"
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">👁️</span>
                      <span className="font-semibold text-indigo-200">Visibility</span>
                    </div>
                    <span className="text-xl font-bold">
                      {cityData.visibility_km != null ? `${cityData.visibility_km} km` : "—"}
                    </span>
                  </motion.div>

                  {/* Wind Direction */}
                  {cityData.wind_deg != null && (
                    <motion.div
                      className="p-3 rounded-xl bg-purple-900/30 border border-purple-400/30 backdrop-blur 
               shadow-[0_0_15px_rgba(180,100,255,0.35)] flex flex-col items-start"
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">🧭</span>
                        <span className="font-semibold text-purple-200">Wind Direction</span>
                      </div>

                      {/* Arrow + Compass */}
                      <div className="flex items-center gap-2">
                        <span
                          className="text-2xl text-yellow-300 drop-shadow-[0_0_6px_rgba(255,255,0,0.6)]"
                          style={{
                            display: "inline-block",
                            transform: `rotate(${(cityData.wind_deg + 270) % 360}deg)`,
                            transition: "transform 0.5s ease-in-out",
                            fontFamily: "monospace",
                          }}
                        >
                          ➤
                        </span>

                        <span className="text-lg font-semibold text-purple-200">
                          {windDirectionText(cityData.wind_deg)}
                        </span>
                      </div>
                    </motion.div>
                  )}

                </div>
              </div>

              {/* Right: Details card */}
              <div
                className="backdrop-blur-lg bg-white/10 border border-cyan-400/30 rounded-3xl p-8 shadow-[0_0_25px_rgba(0,255,255,0.18)]"
                style={{ minHeight: "520px" }}  // 👈 KEY FIX
              >
                {/* HERE WE INPUT LOCAL TIME... */}
                {/* EPIC Local Time Block */}
                <div className="mt-2 mb-4 flex flex-col items-center">

                  {/* Black badge with red text */}
                  <div className="px-4 py-1 mb-2 bg-black/80 rounded-full border border-red-500 shadow-[0_0_8px_rgba(255,0,0,0.5)]">
                    <span className="text-red-400 font-semibold tracking-widest text-xs uppercase">
                      Live Local Time
                    </span>
                  </div>

                  {/* Time itself */}
                  <div className="flex items-end gap-1">

                    {/* Hours + Minutes (bright cyan / visible) */}
                    <span
                      className="text-5xl font-extrabold text-cyan-200 drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]"
                      style={{ fontFamily: "monospace" }}
                    >
                      {displayedTime?.split(":")[0] || "--"}:
                      {displayedTime?.split(":")[1] || "--"}
                    </span>

                    {/* Seconds (yellow, pulsating only) */}
                    <motion.span
                      key={displayedTime}
                      initial={{ opacity: 0.4, scale: 0.9 }}
                      animate={{
                        opacity: [0.4, 1, 0.4],
                        scale: [0.95, 1.15, 0.95],
                      }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      className="text-4xl font-extrabold text-yellow-300 drop-shadow-[0_0_12px_rgba(255,255,0,0.6)]"
                      style={{ fontFamily: "monospace", marginBottom: "4px" }}
                    >
                      {displayedTime?.split(":")[2] || "--"}
                    </motion.span>

                  </div>
                </div>
                {/* 3) MiniGlobe */}
                <div className="w-full flex items-center justify-center mt-2">
                  <ErrorBoundary>
                    {mounted && hasWebGL() ? (() => {
                      const lat = cityData?.lat != null ? parseFloat(cityData.lat) : undefined;
                      const lon = cityData?.lon != null ? parseFloat(cityData.lon) : undefined;
                      const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);
                      const label = `${cityData?.city ?? ""}${cityData?.country ? ", " + cityData.country : ""}`;

                      return hasCoords ? (
                        <div className="w-[300px] h-[300px] flex items-center justify-center">
                          <MiniGlobe
                            width={300}
                            key={`${lat},${lon}`}     // force remount on new city to reset camera/rotation
                            lat={lat}
                            lon={lon}
                            label={label}
                            height={300}
                          />
                        </div>
                      ) : (
                        <div className="relative rounded-2xl overflow-hidden border border-cyan-400/30 bg-white/5 backdrop-blur w-full p-4 text-sm opacity-80">
                          No coordinates for this city.
                        </div>
                      );
                    })() : (
                      <div className="relative rounded-2xl overflow-hidden border border-cyan-400/30 bg-white/5 backdrop-blur w-full p-4 text-sm opacity-80">
                        3D globe unavailable on this device/browser.
                      </div>
                    )}
                  </ErrorBoundary>

                </div>
                {/* Coordinates block — beautiful & styled */}
                {(cityData.lat != null || cityData.lon != null) && (
                  <div className="mt-4 px-4 py-2 rounded-xl bg-black/30 border border-cyan-400/30 shadow-[0_0_12px_rgba(0,255,255,0.25)] flex flex-col items-center gap-1">

                    <div className="text-cyan-300 font-semibold text-xs tracking-widest uppercase">
                      Coordinates
                    </div>

                    <div className="flex items-center gap-4 text-sm font-mono">

                      {/* Latitude */}
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-300 text-xs">LAT</span>
                        <span className="text-cyan-200 font-semibold">
                          {Math.abs(cityData.lat).toFixed(2)}
                        </span>
                        <span className="text-cyan-400 text-xs">
                          {cityData.lat >= 0 ? "N" : "S"}
                        </span>
                      </div>

                      {/* Divider */}
                      <span className="text-cyan-500/50">•</span>

                      {/* Longitude */}
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-300 text-xs">LON</span>
                        <span className="text-cyan-200 font-semibold">
                          {Math.abs(cityData.lon).toFixed(2)}
                        </span>
                        <span className="text-cyan-400 text-xs">
                          {cityData.lon >= 0 ? "E" : "W"}
                        </span>
                      </div>

                    </div>
                    {/* Major Cities in Same Country */}
                    {cityData.major_cities && cityData.major_cities.length > 0 && (
  <motion.div
    className="mt-5 w-full px-5 py-4 rounded-2xl bg-black/30 backdrop-blur 
               border border-cyan-400/30 shadow-[0_0_15px_rgba(0,255,255,0.2)]"
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >

    {/* Country badge */}
    <div className="flex justify-center mb-3">
      <div className="px-4 py-1 rounded-full 
                      bg-cyan-900/40 border border-cyan-300/40
                      shadow-[0_0_10px_rgba(0,255,255,0.25)]">
        <span className="text-xs font-semibold tracking-widest text-cyan-200 uppercase text-center block">
          Other Major Cities in {cityData.country}
        </span>
      </div>
    </div>

    {/* Buttons — compact, 2 rows */}
    <div className="flex flex-wrap justify-center gap-2">
      {cityData.major_cities.map((c, idx) => (
        <motion.button
          key={idx}
          whileHover={{
            scale: 1.08,
            boxShadow: "0 0 10px rgba(0,255,255,0.35)",
          }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setCity(c.name);
            checkCity(c.name);
            document.getElementById("page-scroll-root")?.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }}
          className="
            px-3 py-1.5 rounded-full
            bg-gray-900/40 border border-cyan-400/40
            text-cyan-200 text-xs font-semibold tracking-wide
            shadow-[0_0_8px_rgba(0,255,255,0.18)]
            hover:bg-cyan-800/30 hover:border-cyan-300/60
            transition-all
          "
        >
          {c.name}
        </motion.button>
      ))}
    </div>

  </motion.div>
)}
                  </div>
                )}
              </div>

            </motion.div>
          )}
        </>
      )}

      {/* Back / Switch mode controls */}
      {mode !== "choose" && (
        <div className="mt-12 flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setMode("choose");
              setContinent(null);
              setRegion(null);
              setExtremes(null);
              setCity("");
              setCityData(null);
              setLoading(false);

              // SCROLL TO TOP
              document.getElementById("page-scroll-root")?.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}

            className="px-6 py-2.5 rounded-full font-semibold border-2 border-cyan-400/40 bg-white/10
                       hover:bg-cyan-700/30 transition"
          >
            ← Back
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setMode(mode === "continent" ? "city" : "continent");
              setContinent(null);
              setRegion(null);
              setExtremes(null);
              setCity("");
              setCityData(null);

              // SCROLL TO TOP
              document.getElementById("page-scroll-root")?.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}

            className="px-6 py-2.5 rounded-full font-semibold bg-gradient-to-r from-cyan-500 to-yellow-300 text-black
                       shadow-[0_0_25px_rgba(0,255,255,0.35)] hover:brightness-110 transition"
          >
            {mode === "continent" ? "Switch to Weather by City" : "Switch to Extreme by Continent"}

          </motion.button>
        </div>
      )}
    </div>
  );
}
