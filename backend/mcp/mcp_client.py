"""
Central MCP client: connection settings for every MCP server plus the helper
functions the agents call (tavily, aviationstack, weather).

NOTE: never add an __init__.py to this folder. A package named "mcp" would hide
the real `mcp` library (used by langchain-mcp-adapters) and break every import.
"""

import os
import sys
from pathlib import Path

import certifi
from dotenv import load_dotenv
from langchain_mcp_adapters.client import MultiServerMCPClient

os.environ["SSL_CERT_FILE"] = certifi.where()
os.environ["REQUESTS_CA_BUNDLE"] = certifi.where()

load_dotenv()

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
AVIATION_API_KEY = os.getenv("AVIATIONSTACK_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

# Our own weather MCP server (runs as a subprocess, talks over stdio)
WEATHER_SERVER_PATH = Path(__file__).resolve().parent / "weather_mcp_server.py"

# Only pass the subprocess what it needs (not every secret in the environment)
WEATHER_ENV = {
    "OPENWEATHER_API_KEY": OPENWEATHER_API_KEY or "",
    "SSL_CERT_FILE": certifi.where(),
    "REQUESTS_CA_BUNDLE": certifi.where(),
}

client = MultiServerMCPClient(
    {
        "tavily": {
            "transport": "streamable_http",
            "url": f"https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}"
        },
        "aviationstack": {
            "command": "uvx",
            "transport": "stdio",
            "args": [
                "aviationstack-mcp"
            ],
            "env": {
                "AVIATION_STACK_API_KEY": AVIATION_API_KEY or ""
            }
        },
        "weather": {
            "transport": "stdio",

            # Use the same Python environment that runs app.py.
            "command": sys.executable,

            # weather_mcp_server.py, next to this file
            "args": [
                str(WEATHER_SERVER_PATH)
            ],

            "env": WEATHER_ENV
        }
    }
)

# Which .env key each server needs (checked before connecting, for a clear error)
REQUIRED_KEYS = {
    "tavily": ("TAVILY_API_KEY", TAVILY_API_KEY),
    "aviationstack": ("AVIATIONSTACK_API_KEY", AVIATION_API_KEY),
    "weather": ("OPENWEATHER_API_KEY", OPENWEATHER_API_KEY),
}

# server name -> {tool name: tool}. Loaded once per server, then reused.
_tools_cache: dict[str, dict] = {}


async def get_server_tools(server_name: str) -> dict:
    """
    Returns {tool_name: tool} for ONE server (cached after the first call).

    Only that server is started, so a problem with another server
    (for example a missing key) does not affect it.
    """
    if server_name not in REQUIRED_KEYS:
        raise ValueError(f"Unknown MCP server '{server_name}'.")

    key_name, key_value = REQUIRED_KEYS[server_name]
    if not key_value:
        raise RuntimeError(f"{key_name} is missing. Please add it to your .env file.")

    if server_name not in _tools_cache:
        tools = await client.get_tools(server_name=server_name)

        if not tools:
            raise RuntimeError(f"MCP server '{server_name}' connected but returned no tools.")

        _tools_cache[server_name] = {tool.name: tool for tool in tools}

    return _tools_cache[server_name]


def result_to_text(result) -> str:
    """MCP tools return a string or a list of content blocks; always give back text."""
    if isinstance(result, str):
        return result

    if isinstance(result, list):
        parts = []
        for item in result:
            if isinstance(item, dict):
                parts.append(str(item.get("text", item)))
            else:
                parts.append(str(getattr(item, "text", item)))
        return "\n".join(parts)

    return str(result)


async def call_mcp_tool(server_name: str, tool_name: str, tool_args: dict | None = None) -> str:
    """Calls one tool on one MCP server and returns the result as text."""
    tools = await get_server_tools(server_name)
    tool = tools.get(tool_name)

    if tool is None:
        available = ", ".join(sorted(tools)) or "none"
        raise ValueError(
            f"{server_name} tool '{tool_name}' was not found. Available tools: {available}"
        )

    return result_to_text(await tool.ainvoke(tool_args or {}))


# ---------------------------------------------------------------------------
# Helpers used by the agents. They live in their own files (one per server)
# and are imported lazily here, which avoids circular imports.
# ---------------------------------------------------------------------------

async def tavily_mcp_search(query: str):
    from tavily_mcp import tavily_mcp_search as _search
    return await _search(query)


async def aviation_mcp_call(tool_name: str, tool_args: dict = None):
    from flight_aviation_mcp import aviation_mcp_call as _call
    return await _call(tool_name, tool_args)


async def weather_mcp_search(city: str):
    from weather_mcp import weather_mcp_search as _search
    return await _search(city)


async def forecast_mcp_search(city: str):
    from weather_mcp import forecast_mcp_search as _search
    return await _search(city)


def extract_destination(query: str):
    from weather_mcp import extract_destination as _extract
    return _extract(query)
