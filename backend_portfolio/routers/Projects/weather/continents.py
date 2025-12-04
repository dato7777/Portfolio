# continents.py
CONTINENT_REGIONS = {
    "Europe": {
        "North":  {"lat": [55, 71],  "lon": [-30, 50]},
        "South":  {"lat": [35, 55],  "lon": [-10, 40]},
        "East":   {"lat": [45, 70],  "lon": [40, 80]},
        "West":   {"lat": [45, 65],  "lon": [-30, 0]},
        "Central":{"lat": [45, 60],  "lon": [0, 30]},
    },
    "Asia": {
        "North":  {"lat": [50, 80],  "lon": [40, 180]},
        "South":  {"lat": [0, 30],   "lon": [60, 120]},
        "East":   {"lat": [20, 60],  "lon": [100, 150]},
        "West":   {"lat": [10, 55],  "lon": [40, 80]},
        "Central":{"lat": [25, 55],  "lon": [60, 100]},
    },
    "Africa": {
        "North":  {"lat": [10, 37],  "lon": [-20, 50]},
        "South":  {"lat": [-35, -10],"lon": [15, 45]},
        "East":   {"lat": [-10, 15], "lon": [25, 50]},
        "West":   {"lat": [-10, 20], "lon": [-20, 20]},
        "Central":{"lat": [-5, 10],  "lon": [15, 30]},
    },
    "North America": {
        "North":  {"lat": [50, 75],  "lon": [-170, -50]},
        "South":  {"lat": [15, 35],  "lon": [-120, -60]},
        "East":   {"lat": [30, 60],  "lon": [-90, -50]},
        "West":   {"lat": [25, 60],  "lon": [-170, -110]},
        "Central":{"lat": [35, 55],  "lon": [-110, -90]},
    },
    "South America": {
        "North":  {"lat": [0, 10],   "lon": [-80, -50]},
        "South":  {"lat": [-55, -20],"lon": [-75, -50]},
        "East":   {"lat": [-20, 10], "lon": [-55, -35]},
        "West":   {"lat": [-30, 10], "lon": [-80, -60]},
        "Central":{"lat": [-20, 0],  "lon": [-70, -50]},
    },
    "Oceania": {
        "North":  {"lat": [-5, 0],   "lon": [120, 160]},
        "South":  {"lat": [-50, -20],"lon": [110, 170]},
        "East":   {"lat": [-20, 0],  "lon": [150, 180]},
        "West":   {"lat": [-20, 0],  "lon": [110, 140]},
        "Central":{"lat": [-25, -10],"lon": [130, 160]},
    }
}
