import os
import sys
import certifi
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

os.environ["SSL_CERT_FILE"] = certifi.where()
os.environ["REQUESTS_CA_BUNDLE"] = certifi.where()

# The MCP helper files live in backend/mcp/ and import each other by plain name
# (for example "from mcp_client import ..."), so that folder must be on the path.
# It is added at the END so it can never hide an installed package.
# IMPORTANT: never add an __init__.py to backend/mcp. A package called "mcp"
# would hide the real MCP library and break every MCP import.
sys.path.append(str(Path(__file__).resolve().parent / "mcp"))

from typing import TypedDict, Annotated
import operator
import uuid
import json
import asyncio
import psycopg
from psycopg.rows import dict_row

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_core.messages import (
    AnyMessage,
    HumanMessage,
    AIMessage,
    SystemMessage,
)
from langchain_groq import ChatGroq
# from tools.tavily_tool import tavily_search
# from tools.flight_tool import search_flights
from tools.flight_tool import parse_route, AIRPORTS
from mcp_client import tavily_mcp_search, aviation_mcp_call, extract_destination, forecast_mcp_search, weather_mcp_search


def get_database_url():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise ValueError(
            "DATABASE_URL is missing. Please add your Render PostgreSQL External Database URL to .env"
        )

    if "sslmode=" not in database_url:
        separator = "&" if "?" in database_url else "?"
        database_url = f"{database_url}{separator}sslmode=require"

    return database_url


GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is missing. Please add it to your .env file.")


# =========================
# LLM
# =========================

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=GROQ_API_KEY
)


# =========================
# State
# =========================

class TravelState(TypedDict):
    # add_messages appends new messages (operator.add is kept imported above)
    messages: Annotated[list[AnyMessage], add_messages]
    user_query: str
    flight_results: str
    hotel_results: str
    itinerary: str
    llm_calls: int
    weather_results: str


# =========================
# Flight Agent
# =========================

# def flight_agent(state: TravelState):
#     query = state["user_query"]
#     flight_data = search_flights(query)

#     return {
#         "flight_results": flight_data,
#         "messages": [
#             AIMessage(content="Flight results fetched.")
#         ],
#         "llm_calls": state.get("llm_calls", 0) + 1
#     }




# Flight Tool Router Prompt
FLIGHT_AGENT_PROMPT = """
You are a travel flight expert.

User Query:
{query}

Airport Information:
{airport_data}

Live Departure Board (airlines and flights from the AviationStack MCP server):
{airline_data}

Generate:

1. Likely departure airport
2. Likely arrival airport
3. Airlines serving this route
4. Typical flight duration
5. Estimated airfare range
6. Peak season pricing warning
7. Booking advice

Rules:
- Facts about airports, airlines and flights must come from the data above.
- Duration, airfare and season advice are not in the data: label them as rough estimates.
- If the data says it is unavailable, say so instead of inventing flights.

Return concise travel guidance.
"""


def describe_airports(*iata_codes):
    """Short airport details (name, city, country) from the local airport list."""
    lines = []

    for code in iata_codes:
        if not code:
            continue

        airport = AIRPORTS.get(code)
        if airport:
            lines.append(
                f"{code}: {airport.get('name')}, {airport.get('city')}, {airport.get('country')}"
            )
        else:
            lines.append(f"{code}: no details available")

    return "\n".join(lines) or "No airports could be identified from the request."


def format_departure_board(raw: str, arr_iata: str | None = None, limit: int = 10) -> str:
    """
    Turns the AviationStack MCP schedule (JSON text) into short readable lines.

    When an arrival airport is known, only flights to it are listed.
    Errors from the tool (for example a plan limit) are returned as plain text.
    """
    try:
        payload = json.loads(raw)
    except ValueError:
        return str(raw)[:500]

    if not payload.get("ok"):
        return f"Departure board unavailable: {payload.get('error', 'unknown error')}"

    flights = payload.get("data", [])
    note = ""

    if arr_iata:
        matching = [
            f for f in flights
            if str(f.get("arrival_airport_code") or "").upper() == arr_iata
        ]

        if matching:
            flights = matching
        else:
            note = f"No flights to {arr_iata} on today's departure board. Other departures today:\n"

    lines = []
    for f in flights[:limit]:
        departs = str(f.get("departure_scheduled_time") or "")[11:16] or "?"
        delay = f.get("departure_delay")
        lines.append(
            f"{f.get('flight_number') or '?'} | {f.get('airline') or 'Unknown airline'} | "
            f"departs {departs} | to {str(f.get('arrival_airport_code') or '?').upper()} | "
            f"terminal {f.get('departure_terminal') or 'N/A'} | "
            f"delay {delay if delay is not None else 'N/A'} min"
        )

    return (note + "\n".join(lines)) if lines else "No flights found on today's departure board."


# Flight Agent
def flight_agent(state: TravelState):
    print("\nINSIDE FLIGHT AGENT\n")

    query = state["user_query"]

    try:
        # Work out the airports (rule-based, see tools/flight_tool.py)
        dep_iata, arr_iata = parse_route(query)

        # Today's departures from the departure airport, via the AviationStack MCP server.
        # (list_airports / list_airlines are not used: they are not included in every plan.)
        if dep_iata:
            raw_board = asyncio.run(
                aviation_mcp_call(
                    "flight_arrival_departure_schedule",
                    {
                        "airport_iata_code": dep_iata,
                        "schedule_type": "departure",
                        "number_of_flights": 100
                    }
                )
            )
            board = format_departure_board(raw_board, arr_iata)
        else:
            board = "No departure airport could be identified from the request."

        print("\nROUTE:", dep_iata, "->", arr_iata)
        print("\nBOARD:", board[:500])

        prompt = FLIGHT_AGENT_PROMPT.format(
            query=query,
            airport_data=describe_airports(dep_iata, arr_iata),
            airline_data=board[:3000]
        )

        response = llm.invoke([
            SystemMessage(
                content="You are an expert travel flight planner."
            ),
            HumanMessage(content=prompt)
        ])

        flight_data = response.content

    except Exception as e:

        flight_data = f"Flight information unavailable: {str(e)}"

    return {
        "flight_results": flight_data,
        "messages": [
            AIMessage(
                content="Flight recommendations generated"
            )
        ],
        "llm_calls": state.get("llm_calls", 0) + 1
    }





# =========================
# Hotel Agent
# =========================

def hotel_agent(state: TravelState):
    query = f"Best hotels for {state['user_query']}"
    # hotel_results = tavily_search(query)

    try:
        hotel_results = asyncio.run(tavily_mcp_search(query))
        hotel_results = hotel_results[:6000]  # keep the next prompts a sensible size
    except Exception as e:
        hotel_results = f"Hotel information unavailable: {str(e)}"

    return {
        "hotel_results": hotel_results,
        "messages": [
            AIMessage(content="Hotel information fetched.")
        ],
        "llm_calls": state.get("llm_calls", 0) + 1
    }




# =========================
# Weather Agent
# =========================

async def fetch_weather(city: str):
    """Current weather and forecast, fetched together."""
    return await asyncio.gather(
        weather_mcp_search(city),
        forecast_mcp_search(city)
    )


def weather_agent(state: TravelState):

    city = extract_destination(state["user_query"])

    if not city:
        weather_text = "Weather unavailable: could not find a destination in the request."
    else:
        try:
            weather_data, forecast_data = asyncio.run(fetch_weather(city))

            weather_text = f"""
Current Weather ({city}):
{weather_data}

Forecast:
{forecast_data}
"""
        except Exception as e:
            weather_text = f"Weather unavailable for {city}: {str(e)}"

    return {
        "weather_results": weather_text,
        "messages": [
            AIMessage(
                content="Weather information fetched"
            )
        ],
        "llm_calls": state.get("llm_calls", 0) + 1
    }




# =========================
# Itinerary Agent
# =========================

def itinerary_agent(state: TravelState):
    prompt = f"""
Create a complete travel itinerary.

User Query:
{state['user_query']}

Flight Results:
{state['flight_results']}

Hotel Results:
{state['hotel_results']}

Weather Results:
{state['weather_results']}

Make the itinerary practical, budget-aware, and easy to follow.
"""

    response = llm.invoke([
        SystemMessage(content="You are an expert travel planner."),
        HumanMessage(content=prompt)
    ])

    return {
        "itinerary": response.content,
        "messages": [response],
        "llm_calls": state.get("llm_calls", 0) + 1
    }



# =========================
# Final Response Agent
# =========================

def final_agent(state: TravelState):
    final_prompt = f"""
Generate the final travel response for the user.

User Request:
{state['user_query']}

Flights:
{state['flight_results']}

Hotels:
{state['hotel_results']}

Weather:
{state['weather_results']}

Itinerary:
{state['itinerary']}

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
- Mention that live flight API may not provide ticket prices if pricing is unavailable.
- Include weather-based travel advice.
- Keep the response useful for real travel planning.
"""

    response = llm.invoke([
        SystemMessage(content="You are a professional AI travel booking assistant."),
        HumanMessage(content=final_prompt)
    ])

    return {
        "messages": [response],
        "llm_calls": state.get("llm_calls", 0) + 1
    }


# =========================
# Build Graph
# =========================

graph = StateGraph(TravelState)

graph.add_node("flight_agent", flight_agent)
graph.add_node("hotel_agent", hotel_agent)
graph.add_node("weather_agent", weather_agent)
graph.add_node("itinerary_agent", itinerary_agent)
graph.add_node("final_agent", final_agent)

graph.add_edge(START, "flight_agent")
graph.add_edge("flight_agent", "hotel_agent")
graph.add_edge("hotel_agent", "weather_agent")
graph.add_edge("weather_agent", "itinerary_agent")
graph.add_edge("itinerary_agent", "final_agent")
graph.add_edge("final_agent", END)


# =========================
# PostgreSQL Checkpointer
# =========================
DATABASE_URL = get_database_url()

_conn = psycopg.connect(
    DATABASE_URL,
    autocommit=True,
    row_factory=dict_row
)

checkpointer = PostgresSaver(_conn)
checkpointer.setup()

travel_graph = graph.compile(checkpointer=checkpointer)



# =========================
# Function for FastAPI
# =========================

def run_travel_agent(user_input: str, thread_id: str | None = None):
    if not thread_id:
        thread_id = f"user_{uuid.uuid4().hex}"

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    result = travel_graph.invoke(
        {
            "messages": [
                HumanMessage(content=user_input)
            ],
            "user_query": user_input,
            "flight_results": "",
            "hotel_results": "",
            "weather_results": "",
            "itinerary": "",
            "llm_calls": 0
        },
        config=config
    )

    final_answer = result["messages"][-1].content

    return {
        "thread_id": thread_id,
        "answer": final_answer,
        "flight_results": result.get("flight_results", ""),
        "hotel_results": result.get("hotel_results", ""),
        "weather_results": result.get("weather_results", ""),
        "itinerary": result.get("itinerary", ""),
        "llm_calls": result.get("llm_calls", 0),
    }
