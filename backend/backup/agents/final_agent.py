from langchain_core.messages import HumanMessage, SystemMessage

from config.groq import get_groq_llm

from .state import TravelState

SYSTEM_PROMPT = "You are a professional AI travel booking assistant."

PROMPT_TEMPLATE = """
Generate the final travel response for the user.

User Request:
{user_query}

Flights:
{flight_results}

Hotels:
{hotel_results}

Itinerary:
{itinerary}

Format the final answer beautifully using these sections:

1. Trip Summary
2. Flight Information
3. Hotel Suggestions
4. Day-by-Day Itinerary
5. Estimated Budget
6. Final Recommendations

Important:
- Be clear and practical.
- Mention that live flight API may not provide ticket prices if pricing is unavailable.
- Keep the response useful for real travel planning.
"""


def final_agent(state: TravelState) -> dict:
    """Writes the final formatted answer for the user (the last message in the state)."""

    prompt = PROMPT_TEMPLATE.format(
        user_query=state["user_query"],
        flight_results=state["flight_results"],
        hotel_results=state["hotel_results"],
        itinerary=state["itinerary"],
    )

    response = get_groq_llm().invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=prompt),
    ])

    return {
        "messages": [response],
        "llm_calls": state.get("llm_calls", 0) + 1,
    }
