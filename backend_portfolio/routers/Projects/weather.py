# weather.py
from fastapi import APIRouter, HTTPException, Query
import requests, os, json, random, asyncio
from dotenv import load_dotenv
from .continents import CONTINENT_REGIONS
import pycountry
from functools import lru_cache
from datetime import datetime, timedelta, timezone

load_dotenv()
API_KEY = os.getenv("OPENWEATHER_API_KEY")

router = APIRouter(prefix="/weather", tags=["Weather"])

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CITY_PATH = os.path.join(BASE_DIR, "data", "city.list.json")
with open(CITY_PATH, "r", encoding="utf-8") as f:
    ALL_CITIES = json.load(f)

def get_country_name(code):
    try:
        return pycountry.countries.get(alpha_2=code).name
    except:
        return code
    
def get_timezone_id(lat, lon):
    url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en"
    r = requests.get(url).json()
    if "timezone" in r and "id" in r["timezone"]:
        return r["timezone"]["id"]
    return None

def get_cities(continent: str, region: str | None = None, max_cities: int = 250):
    """Filter cities by continent + region (lat/lon bounding box)."""
    continent = continent.title()
    if continent not in CONTINENT_REGIONS:
        raise HTTPException(status_code=400, detail="Invalid continent")

    if region:
        region = region.title()
        if region not in CONTINENT_REGIONS[continent]:
            raise HTTPException(status_code=400, detail="Invalid region for that continent")
        bounds = CONTINENT_REGIONS[continent][region]
    else:
        # Merge all region bounds to full continent
        all_bounds = list(CONTINENT_REGIONS[continent].values())
        lat_min = min(b["lat"][0] for b in all_bounds)
        lat_max = max(b["lat"][1] for b in all_bounds)
        lon_min = min(b["lon"][0] for b in all_bounds)
        lon_max = max(b["lon"][1] for b in all_bounds)
        bounds = {"lat": [lat_min, lat_max], "lon": [lon_min, lon_max]}

    lat_min, lat_max = bounds["lat"]
    lon_min, lon_max = bounds["lon"]

    # Filter cities
    cities = [c for c in ALL_CITIES
              if lat_min <= c["coord"]["lat"] <= lat_max
              and lon_min <= c["coord"]["lon"] <= lon_max]

    if not cities:
        raise HTTPException(status_code=404, detail="No cities found for that region")

    if len(cities) > max_cities:
        random.seed(f"{continent}-{region or 'all'}")
        cities = random.sample(cities, max_cities)

    return cities


async def fetch_temp(city, session, semaphore):
    """Async helper to query OpenWeather quickly with rate limit protection."""
    async with semaphore:
        lat, lon = city["coord"]["lat"], city["coord"]["lon"]
        url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={API_KEY}"
        try:
            
            async with session.get(url, timeout=10) as res:
                data = await res.json()
                country_code = data["sys"]["country"]
                country_name = get_country_name(country_code) 
                return {"name": city["name"], "temp": data["main"]["temp"], "country": country_name}
        except Exception:
            return None


@router.get("/extremes/{continent}")
async def get_extremes(continent: str, region: str | None = Query(None)):
    """Return coldest & hottest city in chosen continent (or region)."""
    import aiohttp
    cities = get_cities(continent, region)

    coldest, hottest = None, None

    async with aiohttp.ClientSession() as session:
        sem = asyncio.Semaphore(5)  # 5 requests at a time (safe for free tier)
        tasks = [fetch_temp(c, session, sem) for c in cities]
        results = await asyncio.gather(*tasks)

    results = [r for r in results if r]
    for r in results:
        if not coldest or r["temp"] < coldest["temp"]:
            coldest = r
        if not hottest or r["temp"] > hottest["temp"]:
            hottest = r

    return {
        "continent": continent,
        "region": region or "All regions",
        "coldest": coldest,
        "hottest": hottest,
        "sampled_cities": len(results)
    }
@router.get("/city")
def get_city_weather(q: str = Query(..., min_length=1, description="City name, e.g., 'Paris' or 'Paris, FR'")):
    """
    Resolve a city name to coordinates via OpenWeather Geocoding API, then fetch current weather.
    Returns: { city, country, lat, lon, temp, humidity, wind, description, icon }
    """
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Server missing OPENWEATHER_API_KEY")

    # 1) Geocode
    try:
        geo = requests.get(
            "http://api.openweathermap.org/geo/1.0/direct",
            params={"q": q, "limit": 1, "appid": API_KEY},
            timeout=8,
        )
    except Exception:
        raise HTTPException(status_code=504, detail="Geocoding request timed out")
    if geo.status_code != 200:
        raise HTTPException(status_code=geo.status_code, detail="Geocoding failed")
    g = geo.json()
    if not g:
        raise HTTPException(status_code=404, detail="City not found")

    lat, lon = g[0]["lat"], g[0]["lon"]
    city_name = g[0].get("name") or q
    country_code = g[0].get("country")
    country = get_country_name(country_code) or country_code

    # 2) Weather
    try:
        w = requests.get(
            "http://api.openweathermap.org/data/2.5/weather",
            params={"lat": lat, "lon": lon, "units": "metric", "appid": API_KEY},
            timeout=8,
        )
    except Exception:
        raise HTTPException(status_code=504, detail="Weather request timed out")
    if w.status_code != 200:
        # pass OpenWeather errors cleanly, incl. 429 rate limit
        try:
            msg = w.json().get("message", "Weather fetch failed")
        except Exception:
            msg = "Weather fetch failed"
        raise HTTPException(status_code=w.status_code, detail=msg)

    data = w.json()
    main = data.get("main", {})
    wind = data.get("wind", {})
    wx = (data.get("weather") or [{}])[0]
    timezone_id = get_timezone_id(lat, lon)
        # Compute local time using timezone ID
    if timezone_id:
        import pytz
        tz = pytz.timezone(timezone_id)
        local_time = datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S")
    else:
        # fallback: offset only
        timezone_offset = data["timezone"]
        local_time = (datetime.utcnow() + timedelta(seconds=timezone_offset)).strftime("%Y-%m-%d %H:%M:%S")
    return {
        "city": city_name,
        "country": country,
        "lat": lat,
        "lon": lon,
        "temp": main.get("temp"),
        "humidity": main.get("humidity"),
        "wind": wind.get("speed"),
        "description": wx.get("description"),
        "icon": wx.get("icon"),  # e.g. "10d",
        "local_time": local_time,
        "timezone_id": timezone_id,
    }