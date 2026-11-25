import asyncio

from langchain_core.messages import AIMessage

from config import paths  # noqa: F401  (puts backend/mcp on the import path)
from mcp_client import (
    extract_destination,
    forecast_mcp_search,
    weather_mcp_search,
)

from .state import TravelState

WEATHER_TEMPLATE = """
Current Weather:
{weather}

Forecast:
{forecast}
"""

WEATHER_UNAVAILABLE = (
    "Live weather information for {city} "
    "is temporarily unavailable. Give general "
    "seasonal guidance and advise the traveler "
    "to verify the forecast before departure."
)


def weather_agent(state: TravelState) -> dict:
    """
    Gets current weather and a short forecast for the destination from the weather MCP server (no LLM).

    If no destination can be found, or the weather server fails, it leaves a note
    asking the later agents for general seasonal guidance instead.
    """
    city = extract_destination(state["user_query"])

    if not city:
        weather_results = WEATHER_UNAVAILABLE.format(city="the destination")
    else:
        try:
            weather_data = asyncio.run(weather_mcp_search(city))
            forecast_data = asyncio.run(forecast_mcp_search(city))
            weather_results = WEATHER_TEMPLATE.format(
                weather=weather_data,
                forecast=forecast_data,
            )
        except Exception as exc:
            print(
                f"WEATHER AGENT MCP ERROR: "
                f"{type(exc).__name__}: {exc}",
                flush=True,
            )
            weather_results = WEATHER_UNAVAILABLE.format(city=city)

    return {
        "weather_results": weather_results,
        "messages": [AIMessage(content="Weather information processed.")],
    }
