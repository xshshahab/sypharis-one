from constants.agent_constant import PROMPT_LIMITS

from .helpers import ask_llm, clip
from .state import TravelState

SYSTEM_PROMPT = "You are a professional AI travel booking assistant."

APPROVED_INSTRUCTION = (
    "The user approved the draft. Preserve its decisions while polishing it."
)

REVISION_INSTRUCTION = """
The user requested a revision. Apply this feedback carefully:
{feedback}
"""

DEFAULT_FEEDBACK = "Improve the draft before finalizing it."

PROMPT_TEMPLATE = """
Generate the final travel response for the user.

Human Review:
{review_instruction}

User Request:
{user_query}

Supervisor Constraints:
{trip_constraints}

Flights:
{flight_results}

Hotels:
{hotel_results}

Weather:
{weather_results}

Budget Analysis:
{budget_results}

Draft Itinerary:
{itinerary}

Format the final answer beautifully using these sections:
1. Trip Summary
2. Flight Information
3. Hotel Suggestions
4. Weather Information
5. Day-by-Day Itinerary
6. Estimated Budget
7. Final Recommendations

Important:
- Be clear and practical.
- Mention that live flight APIs may not provide ticket prices when pricing is unavailable.
- Include weather-based travel advice.
- Keep the response useful for real travel planning.
- Incorporate the human feedback when revision was requested.
"""


def final_agent(state: TravelState) -> dict:
    """Writes the final polished plan, applying the human's approval or revision feedback."""
    if state.get("approved", False):
        review_instruction = APPROVED_INSTRUCTION
    else:
        review_instruction = REVISION_INSTRUCTION.format(
            feedback=state.get("human_feedback", "") or DEFAULT_FEEDBACK
        )

    prompt = PROMPT_TEMPLATE.format(
        review_instruction=review_instruction,
        user_query=state["user_query"],
        trip_constraints=state.get("trip_constraints", {}),
        flight_results=clip(state.get("flight_results", ""), PROMPT_LIMITS["flights"]),
        hotel_results=clip(state.get("hotel_results", ""), PROMPT_LIMITS["hotels"]),
        weather_results=clip(state.get("weather_results", ""), PROMPT_LIMITS["weather"]),
        budget_results=clip(state.get("budget_results", ""), PROMPT_LIMITS["budget"]),
        itinerary=clip(state.get("itinerary", ""), PROMPT_LIMITS["itinerary"]),
    )

    response = ask_llm(SYSTEM_PROMPT, prompt)

    return {
        "final_response": response.content,
        "messages": [response],
        "llm_calls": state.get("llm_calls", 0) + 1,
    }
