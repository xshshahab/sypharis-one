from langchain_core.messages import AIMessage

from tools.flight_tool import search_flights

from .state import TravelState


def flight_agent(state: TravelState) -> dict:
    """Fetches live flight data for the user's query (no LLM involved)."""

    flight_data = search_flights(state["user_query"])

    return {
        "flight_results": flight_data,
        "messages": [AIMessage(content="Flight results fetched.")],
        "llm_calls": state.get("llm_calls", 0) + 1,
    }
