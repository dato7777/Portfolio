# weather.py
from fastapi import APIRouter, HTTPException, Query
import requests, os, json, random, asyncio
from dotenv import load_dotenv
from .continents import CONTINENT_REGIONS
import pycountry


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
