from langchain_core.messages import AIMessage

from tools.tavily_tool import tavily_search

from .state import TravelState


def hotel_agent(state: TravelState) -> dict:
    """Searches the web (Tavily) for hotel options matching the user's query."""

    hotel_results = tavily_search(f"Best hotels for {state['user_query']}")

    return {
        "hotel_results": hotel_results,
        "messages": [AIMessage(content="Hotel information fetched.")],
        "llm_calls": state.get("llm_calls", 0) + 1,
    }
