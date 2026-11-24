"""
Client side of the weather MCP server (weather_mcp_server.py).

weather_mcp_search / forecast_mcp_search call the server's tools,
extract_destination finds the city to look up in the user's sentence.
"""

import re

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
    from tools.flight_tool import find_location_mentions

    from_match = re.search(rf"\bfrom\s+(.+?){_END}", q)
    origin = _clean_place(from_match.group(1)) if from_match else ""

    for mention in find_location_mentions(q):
        if mention != origin:
            return _to_city(mention)

    return None


async def weather_mcp_search(city: str):
    """Current weather for a city (text)."""
    return await call_mcp_tool("weather", "get_current_weather", {"city": city})


async def forecast_mcp_search(city: str):
    """Next forecast entries for a city (text)."""
    return await call_mcp_tool("weather", "get_forecast", {"city": city})
