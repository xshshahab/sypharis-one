"""
The final travel planner: builds the LangGraph and exposes what the API calls.

    run_travel_agent(user_input, thread_id=None)    start a plan; pauses for human approval
    resume_travel_agent(thread_id, approved, ...)   continue after the human's decision

Flow: supervisor (input guardrail + routing) -> chosen specialists
(flight, hotel, weather, budget) -> itinerary draft -> human approval -> final answer.
The agents live in agents/; the original single-file version is in backup/backend_single_file.py.
"""

import os
import uuid
from functools import lru_cache
from typing import Any

import certifi
import psycopg
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command
from psycopg.rows import dict_row

load_dotenv()
os.environ["SSL_CERT_FILE"] = certifi.where()
os.environ["REQUESTS_CA_BUNDLE"] = certifi.where()

from agents import (  # noqa: E402
    ROUTE_MAP,
    TravelState,
    budget_agent,
    final_agent,
    flight_agent,
    guardrail_blocked_agent,
    hotel_agent,
    human_approval_agent,
    itinerary_agent,
    route_after_agent,
    route_from_supervisor,
    supervisor_agent,
    weather_agent,
)
from agents.helpers import empty_constraints  # noqa: E402
from config.db import get_database_url  # noqa: E402
from constants.agent_constant import AGENT_ORDER  # noqa: E402


# =========================
# Build Graph
# =========================
def build_graph(checkpointer=None):
    """Wires the agents into a compiled graph. Pass a checkpointer to save state between steps."""
    graph = StateGraph(TravelState)

    graph.add_node("supervisor", supervisor_agent)
    graph.add_node("guardrail_blocked", guardrail_blocked_agent)
    graph.add_node("flight_agent", flight_agent)
    graph.add_node("hotel_agent", hotel_agent)
    graph.add_node("weather_agent", weather_agent)
    graph.add_node("budget_agent", budget_agent)
    graph.add_node("itinerary_agent", itinerary_agent)
    graph.add_node("human_approval", human_approval_agent)
    graph.add_node("final_agent", final_agent)

    graph.add_edge(START, "supervisor")
    graph.add_conditional_edges("supervisor", route_from_supervisor, ROUTE_MAP)

    # After each specialist, go to the next one the supervisor chose (or the itinerary)
    for name in AGENT_ORDER:
        if name != "itinerary_agent":
            graph.add_conditional_edges(name, route_after_agent(name), ROUTE_MAP)

    graph.add_edge("itinerary_agent", "human_approval")
    graph.add_edge("human_approval", "final_agent")
    graph.add_edge("final_agent", END)
    graph.add_edge("guardrail_blocked", END)

    return graph.compile(checkpointer=checkpointer)


@lru_cache(maxsize=1)
def get_travel_graph():
    """
    Returns the compiled graph backed by the PostgreSQL checkpointer.

    Created on first use (not on import), so importing this module never needs
    the database. The result is cached for later calls.
    """
    connection = psycopg.connect(
        get_database_url(),
        autocommit=True,
        row_factory=dict_row,
    )

    checkpointer = PostgresSaver(connection)
    checkpointer.setup()

    return build_graph(checkpointer)


# =========================
# FastAPI-facing helpers
# =========================
def _interrupt_payload(result: dict[str, Any]) -> dict[str, Any] | None:
    """The data the graph paused with (the draft to review), or None if it did not pause."""
    interrupts = result.get("__interrupt__", [])
    if not interrupts:
        return None

    first_interrupt = interrupts[0]
    payload = getattr(first_interrupt, "value", first_interrupt)
    return payload if isinstance(payload, dict) else {"value": payload}


def _serialize_result(
    result: dict[str, Any],
    thread_id: str,
) -> dict[str, Any]:
    """Turns the graph's final state into the dict the API returns."""
    messages = result.get("messages", [])
    last_message = messages[-1].content if messages else ""
    answer = result.get("final_response") or last_message
    interrupt_payload = _interrupt_payload(result)

    if interrupt_payload:
        answer = interrupt_payload.get("draft_itinerary") or result.get(
            "itinerary", ""
        )

    return {
        "thread_id": thread_id,
        "answer": answer,
        "requires_approval": interrupt_payload is not None,
        "approval_request": (
            interrupt_payload.get("approval_request", "")
            if interrupt_payload
            else result.get("approval_request", "")
        ),
        "flight_results": result.get("flight_results", ""),
        "hotel_results": result.get("hotel_results", ""),
        "weather_results": result.get("weather_results", ""),
        "budget_results": result.get("budget_results", ""),
        "itinerary": (
            interrupt_payload.get("draft_itinerary", "")
            if interrupt_payload
            else result.get("itinerary", "")
        ),
        "selected_agents": result.get("selected_agents", []),
        "trip_constraints": result.get("trip_constraints", {}),
        "supervisor_reasoning": result.get("supervisor_reasoning", ""),
        "guardrail_allowed": result.get("guardrail_allowed", True),
        "guardrail_reason": result.get("guardrail_reason", ""),
        "approved": result.get("approved"),
        "human_feedback": result.get("human_feedback", ""),
        "llm_calls": result.get("llm_calls", 0),
    }


def run_travel_agent(user_input: str, thread_id: str | None = None):
    """Start a new travel-planning run and pause at human approval."""
    if not thread_id:
        thread_id = f"user_{uuid.uuid4().hex}"

    config = {"configurable": {"thread_id": thread_id}}

    result = get_travel_graph().invoke(
        {
            "messages": [HumanMessage(content=user_input)],
            "user_query": user_input,
            "guardrail_allowed": True,
            "guardrail_reason": "",
            "selected_agents": [],
            "trip_constraints": empty_constraints(),
            "supervisor_reasoning": "",
            "flight_results": "",
            "hotel_results": "",
            "weather_results": "",
            "budget_results": "",
            "itinerary": "",
            "approval_request": "",
            "approved": False,
            "human_feedback": "",
            "final_response": "",
            "llm_calls": 0,
        },
        config=config,
    )

    return _serialize_result(result, thread_id)


def resume_travel_agent(
    thread_id: str,
    approved: bool,
    feedback: str = "",
):
    """Resume the paused LangGraph thread after human review."""
    if not thread_id:
        raise ValueError("thread_id is required to resume a travel plan.")

    config = {"configurable": {"thread_id": thread_id}}
    graph = get_travel_graph()

    # Resuming a thread that was never started would fail with a confusing KeyError
    if not graph.get_state(config).values:
        raise ValueError(f"No saved travel plan found for thread_id '{thread_id}'.")

    result = graph.invoke(
        Command(
            resume={
                "approved": approved,
                "feedback": feedback.strip(),
            }
        ),
        config=config,
    )

    return _serialize_result(result, thread_id)
