import asyncio

from langchain_core.messages import AIMessage

from config import paths  # noqa: F401  (puts backend/mcp on the import path)
from mcp_client import tavily_mcp_search

from .state import TravelState

HOTELS_UNAVAILABLE = (
    "Live hotel search is temporarily unavailable. "
    "Provide general accommodation and neighborhood "
    "guidance based on the destination and clearly "
    "label it as non-live advice."
)


def hotel_agent(state: TravelState) -> dict:
    """Searches for hotels through the Tavily MCP server (no LLM). Falls back to a note if the search fails."""
    query = f"Best hotels for {state['user_query']}"

    try:
        hotel_results = asyncio.run(tavily_mcp_search(query))
    except Exception as exc:
        print(
            f"HOTEL AGENT MCP ERROR: "
            f"{type(exc).__name__}: {exc}",
            flush=True,
        )
        hotel_results = HOTELS_UNAVAILABLE

    return {
        "hotel_results": hotel_results,
        "messages": [AIMessage(content="Hotel information processed.")],
        "llm_calls": state.get("llm_calls", 0) + 1,
    }
