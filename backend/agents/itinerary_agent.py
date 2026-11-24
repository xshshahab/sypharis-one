from langchain_core.messages import HumanMessage, SystemMessage

from config.groq import get_groq_llm

from .state import TravelState

SYSTEM_PROMPT = "You are an expert travel planner."

PROMPT_TEMPLATE = """
Create a complete travel itinerary.

User Query:
{user_query}

Flight Results:
{flight_results}

Hotel Results:
{hotel_results}

Make the itinerary practical, budget-aware, and easy to follow.
"""


def itinerary_agent(state: TravelState) -> dict:
    """Asks the LLM to build a travel itinerary from the flight and hotel results."""

    prompt = PROMPT_TEMPLATE.format(
        user_query=state["user_query"],
        flight_results=state["flight_results"],
        hotel_results=state["hotel_results"],
    )

    response = get_groq_llm().invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=prompt),
    ])

    return {
        "itinerary": response.content,
        "messages": [response],
        "llm_calls": state.get("llm_calls", 0) + 1,
    }
