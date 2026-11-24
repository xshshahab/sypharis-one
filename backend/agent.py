"""Builds the travel-planning LangGraph and exposes run_travel_agent().

CLI usage: python agent.py "Plan a 5 days Japan trip"
"""

import os
import sys
import uuid
from functools import lru_cache

import certifi
import psycopg
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.graph import END, START, StateGraph
from psycopg.rows import dict_row

from agents import (
    TravelState,
    final_agent,
    flight_agent,
    hotel_agent,
    itinerary_agent,
)
from config.db import get_database_url

load_dotenv()
os.environ["SSL_CERT_FILE"] = certifi.where()
os.environ["REQUESTS_CA_BUNDLE"] = certifi.where()


# Agents run in this order: flight -> hotel -> itinerary -> final
PIPELINE = [
    ("flight_agent", flight_agent),
    ("hotel_agent", hotel_agent),
    ("itinerary_agent", itinerary_agent),
    ("final_agent", final_agent),
]


def build_graph(checkpointer=None):
    """Wires the agents into a compiled graph. Pass a checkpointer to save state."""

    builder = StateGraph(TravelState)

    for name, node in PIPELINE:
        builder.add_node(name, node)

    names = [name for name, _ in PIPELINE]

    builder.add_edge(START, names[0])
    for current, following in zip(names, names[1:]):
        builder.add_edge(current, following)
    builder.add_edge(names[-1], END)

    return builder.compile(checkpointer=checkpointer)


@lru_cache(maxsize=1)
def get_travel_graph():
    """
    Returns the compiled graph backed by the Postgres checkpointer.

    Created on first use (not on import) so importing this module never
    needs the database; the result is cached for later calls.
    """

    connection = psycopg.connect(
        get_database_url(),
        autocommit=True,
        row_factory=dict_row,
    )

    checkpointer = PostgresSaver(connection)
    checkpointer.setup()

    return build_graph(checkpointer)


def run_travel_agent(user_input: str, thread_id: str | None = None) -> dict:
    """
    Runs the full travel pipeline for one user request.

    Args:
        user_input: The user's trip request.
        thread_id: Reuse an id to continue a saved conversation; a new one
            is generated when omitted.

    Returns:
        A dict with thread_id, answer, flight_results, hotel_results,
        itinerary and llm_calls.
    """

    thread_id = thread_id or f"user_{uuid.uuid4().hex}"

    result = get_travel_graph().invoke(
        {
            "messages": [HumanMessage(content=user_input)],
            "user_query": user_input,
            "flight_results": "",
            "hotel_results": "",
            "itinerary": "",
            "llm_calls": 0,
        },
        config={"configurable": {"thread_id": thread_id}},
    )

    return {
        "thread_id": thread_id,
        "answer": result["messages"][-1].content,
        "flight_results": result.get("flight_results", ""),
        "hotel_results": result.get("hotel_results", ""),
        "itinerary": result.get("itinerary", ""),
        "llm_calls": result.get("llm_calls", 0),
    }


DEFAULT_QUERY = "Plan a 5 days Japan trip including hotels"

if __name__ == "__main__":
    query = " ".join(sys.argv[1:]) or DEFAULT_QUERY
    print(run_travel_agent(query)["answer"])
