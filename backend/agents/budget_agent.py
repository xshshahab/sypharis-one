from langchain_core.messages import AIMessage

from constants.agent_constant import PROMPT_LIMITS

from .helpers import ask_llm, clip
from .state import TravelState

SYSTEM_PROMPT = "You are a practical travel budget analyst."

PROMPT_TEMPLATE = """
Analyze whether this trip is realistic for the user's budget.

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

Return:
1. Estimated cost categories
2. Budget risk areas
3. Money-saving suggestions
4. Overall feasibility

If exact live prices are unavailable, clearly label estimates as approximate.
"""


def budget_agent(state: TravelState) -> dict:
    """Asks the LLM whether the trip fits the user's budget, using the results gathered so far."""
    prompt = PROMPT_TEMPLATE.format(
        user_query=state["user_query"],
        trip_constraints=state.get("trip_constraints", {}),
        flight_results=clip(state.get("flight_results", ""), PROMPT_LIMITS["flights"]),
        hotel_results=clip(state.get("hotel_results", ""), PROMPT_LIMITS["hotels"]),
        weather_results=clip(state.get("weather_results", ""), PROMPT_LIMITS["weather"]),
    )

    response = ask_llm(SYSTEM_PROMPT, prompt)

    return {
        "budget_results": response.content,
        "messages": [AIMessage(content="Budget assessment generated.")],
        "llm_calls": state.get("llm_calls", 0) + 1,
    }
