from langchain_core.messages import AIMessage

from constants.agent_constant import PROMPT_LIMITS

from .helpers import ask_llm, clip
from .state import TravelState

SYSTEM_PROMPT = "You are an expert travel planner."

PROMPT_TEMPLATE = """
Create a complete travel itinerary.

User Query:
{user_query}

Trip Constraints:
{trip_constraints}

Flight Results:
{flight_results}

Hotel Results:
{hotel_results}

Weather Results:
{weather_results}

Budget Results:
{budget_results}

Make the itinerary practical, budget-aware, and easy to follow.
Create a clear draft that is ready for human review.
"""

APPROVAL_REQUEST = (
    "Please review the generated draft itinerary. Approve it to create the "
    "final polished plan, or provide feedback for revision."
)


def itinerary_agent(state: TravelState) -> dict:
    """Builds the draft itinerary from every result gathered so far. The next step is human review."""
    prompt = PROMPT_TEMPLATE.format(
        user_query=state["user_query"],
        trip_constraints=state.get("trip_constraints", {}),
        flight_results=clip(state.get("flight_results", ""), PROMPT_LIMITS["flights"]),
        hotel_results=clip(state.get("hotel_results", ""), PROMPT_LIMITS["hotels"]),
        weather_results=clip(state.get("weather_results", ""), PROMPT_LIMITS["weather"]),
        budget_results=clip(state.get("budget_results", ""), PROMPT_LIMITS["budget"]),
    )

    response = ask_llm(SYSTEM_PROMPT, prompt)

    return {
        "itinerary": response.content,
        "approval_request": APPROVAL_REQUEST,
        "messages": [AIMessage(content="Draft itinerary created for human review.")],
        "llm_calls": state.get("llm_calls", 0) + 1,
    }
