"""
Client side of the weather MCP server (weather_mcp_server.py).

weather_mcp_search / forecast_mcp_search call the server's tools,
extract_destination finds the city to look up in the user's sentence.
"""

import re

import pycountry

from mcp_client import call_mcp_tool

# Countries are not cities, so use a representative city for the weather lookup
COUNTRY_TO_CITY = {
    "japan": "Tokyo", "india": "Delhi", "usa": "New York", "america": "New York",
    "united states": "New York", "uk": "London", "britain": "London", "england": "London",
    "uae": "Dubai", "france": "Paris", "germany": "Berlin", "italy": "Rome",
    "spain": "Madrid", "singapore": "Singapore", "thailand": "Bangkok",
    "malaysia": "Kuala Lumpur", "indonesia": "Jakarta", "china": "Beijing",
    "south korea": "Seoul", "korea": "Seoul", "australia": "Sydney", "canada": "Toronto",
    "turkey": "Istanbul", "qatar": "Doha", "saudi arabia": "Riyadh", "nepal": "Kathmandu",
    "bangladesh": "Dhaka", "vietnam": "Hanoi", "russia": "Moscow", "ukraine": "Kyiv",
    "pakistan": "Islamabad", "sri lanka": "Colombo", "maldives": "Male",
    "new zealand": "Auckland", "switzerland": "Zurich", "greece": "Athens",
    "portugal": "Lisbon", "netherlands": "Amsterdam", "ireland": "Dublin",
    "egypt": "Cairo", "south africa": "Johannesburg", "brazil": "Rio de Janeiro",
    "mexico": "Mexico City",
}

# Words that end a place name: "to Tokyo with hotels" -> "Tokyo"
_END = r"(?:\s+(?:from|for|with|under|on|at|by|via|next|this|tomorrow|today|and|within|including)\b|[.,!?]|$)"
_FILLER = {"a", "an", "the", "trip", "travel", "vacation", "holiday", "weekend", "budget", "hotels", "hotel"}


def _clean_place(text: str) -> str:
    """Drops filler and number words: 'a 5 days trip' -> ''."""
    words = [
        w for w in re.sub(r"[^a-z\s]", " ", text.lower()).split()
        if w not in _FILLER and w not in {"day", "days", "week", "weeks"}
    ]
    return " ".join(words).strip()


def _to_city(place: str) -> str:
    return COUNTRY_TO_CITY.get(place, place.title())


# Cities recognised when the sentence has no "to X" / "in X" / "visit X"
KNOWN_CITIES = (
    "dhaka", "delhi", "new delhi", "mumbai", "kolkata", "chennai", "bangalore", "bengaluru",
    "goa", "hyderabad", "pune", "ahmedabad", "jaipur", "kochi", "cochin", "lucknow",
    "chandigarh", "srinagar", "varanasi", "amritsar", "bhubaneswar", "patna", "guwahati",
    "thiruvananthapuram", "trivandrum", "indore", "nagpur", "udaipur", "tokyo", "osaka",
    "kyoto", "new york", "london", "dubai", "singapore", "kuala lumpur", "bangkok", "doha",
    "istanbul", "toronto", "sydney", "paris", "rome", "madrid", "frankfurt",
)


def _place_mentions(query: str) -> list[str]:
    """
    Known country and city names in the sentence, in the order they appear.
    A name inside a longer one is skipped ("korea" inside "south korea").
    """
    names = set(COUNTRY_TO_CITY) | set(KNOWN_CITIES)
    names |= {c.name.lower() for c in pycountry.countries if len(c.name) >= 4}

    spans = []
    for name in names:
        for match in re.finditer(rf"\b{re.escape(name)}\b", query):
            spans.append((match.start(), match.end(), name))

    # Longest first, then drop anything inside a span we already kept
    spans.sort(key=lambda span: (span[0] - span[1], span[0]))
    kept = []
    for start, end, name in spans:
        if not any(k_start <= start and end <= k_end for k_start, k_end, _ in kept):
            kept.append((start, end, name))

    return [name for _, _, name in sorted(kept)]


def extract_destination(query: str):
    """
    Finds the destination city in a trip request. Returns None if there isn't one.

    "Plan a 5 day trip from Delhi to Tokyo"  -> "Tokyo"
    "Weekend in Goa from Mumbai"             -> "Goa"
    "Japan trip from Bangladesh"             -> "Tokyo"  (country -> its main city)
    """
    q = query.lower()

    # "to X" / "in X" / "visit X"
    for pattern in (rf"\bto\s+(.+?){_END}", rf"\b(?:in|visit|visiting)\s+(.+?){_END}"):
        for match in re.finditer(pattern, q):
            place = _clean_place(match.group(1))
            if place:
                return _to_city(place)

    # No preposition: take a known country/city that is not the "from" place
    from_match = re.search(rf"\bfrom\s+(.+?){_END}", q)
    origin = _clean_place(from_match.group(1)) if from_match else ""

    for mention in _place_mentions(q):
        if mention != origin:
            return _to_city(mention)

    return None


async def weather_mcp_search(city: str):
    """Current weather for a city (text)."""
    return await call_mcp_tool("weather", "get_current_weather", {"city": city})


async def forecast_mcp_search(city: str):
    """Next forecast entries for a city (text)."""
    return await call_mcp_tool("weather", "get_forecast", {"city": city})
