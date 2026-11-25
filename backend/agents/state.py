import operator
from typing import Annotated, Any, TypedDict

from langchain_core.messages import AnyMessage


class TravelState(TypedDict, total=False):
    """Shared state passed between all agents in the travel graph."""

    messages: Annotated[list[AnyMessage], operator.add]
    user_query: str

    # Supervisor + guardrail state
    guardrail_allowed: bool
    guardrail_reason: str
    selected_agents: list[str]
    trip_constraints: dict[str, Any]
    supervisor_reasoning: str

    # Specialist results
    flight_results: str
    hotel_results: str
    weather_results: str
    itinerary: str

    # Budget + human-in-the-loop state
    budget_results: str
    approval_request: str
    approved: bool
    human_feedback: str
    final_response: str

    llm_calls: int
