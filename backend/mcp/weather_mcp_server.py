import os
import requests
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

load_dotenv()

BASE_URL = "https://api.openweathermap.org/data/2.5"
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

# Seconds to wait for OpenWeather before giving up
REQUEST_TIMEOUT = 10

mcp = FastMCP("Weather MCP Server")


def fetch_weather_data(endpoint: str, city: str):
    """
    Calls an OpenWeather endpoint for a city.

    Returns (data, error). Exactly one of them is None, so the tools below
    can return a readable error instead of crashing.
    """
    if not OPENWEATHER_API_KEY:
        return None, {"error": "OPENWEATHER_API_KEY is missing. Add it to your .env file."}

    try:
        response = requests.get(
            f"{BASE_URL}/{endpoint}",
            params={
                "q": city,
                "appid": OPENWEATHER_API_KEY,
                "units": "metric"
            },
            timeout=REQUEST_TIMEOUT
        )
        data = response.json()
    except requests.exceptions.RequestException as e:
        return None, {"error": f"Weather request failed: {e}"}
    except ValueError:
        return None, {"error": "Weather API returned invalid JSON."}

    if response.status_code != 200:
        # e.g. {"cod": "404", "message": "city not found"}
        return None, {
            "error": data.get("message", "Weather API error"),
            "status_code": response.status_code
        }

    return data, None


@mcp.tool()
def get_current_weather(city: str):
    """Current weather (temperature, humidity, wind, condition) for a city."""

    data, error = fetch_weather_data("weather", city)

    if error:
        return error

    return {
        "city": data["name"],
        "temperature_c": data["main"]["temp"],
        "feels_like_c": data["main"]["feels_like"],
        "humidity": data["main"]["humidity"],
        "condition": data["weather"][0]["description"],
        "wind_speed": data["wind"]["speed"]
    }



@mcp.tool()
def get_forecast(city: str):
    """Short-term forecast (next 5 entries, 3 hours apart) for a city."""

    data, error = fetch_weather_data("forecast", city)

    if error:
        return error

    forecast = []

    # Return first 5 forecast entries
    for item in data["list"][:5]:

        forecast.append(
            {
                "datetime": item["dt_txt"],
                "temperature": item["main"]["temp"],
                "weather": item["weather"][0]["description"]
            }
        )

    return {
        "city": city,
        "forecast": forecast
    }



if __name__ == "__main__":
    mcp.run()
