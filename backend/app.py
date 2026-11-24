import os
import traceback
import uvicorn
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

import nest_asyncio
nest_asyncio.apply()

load_dotenv()

# =========================
# Which agent runs (set AGENT_MODE in .env)
# =========================
#   without_mcp (default): tools are called directly in Python (agent_without_mcp.py)
#   mcp                  : tools are called through MCP servers (agent_with_mcp.py)
# Plain module names (not "backend.agent...") because the app runs from inside backend/.
AGENT_MODE = os.getenv("AGENT_MODE", "without_mcp").strip().lower()

if AGENT_MODE == "mcp":
    from agent_with_mcp import run_travel_agent
else:
    from agent_without_mcp import run_travel_agent

print(f"Agent mode: {AGENT_MODE}")

from constants.app_constant import (
    PORT,
    VERSION,
    TRAVEL_ROUTE,
    HEALTH_ROUTE
)

app = FastAPI(
    title="Sypharis One",
    description="",
    version=VERSION
)

# =========================
# CORS (lets the React frontend call this API from the browser)
# =========================
# Origins are the frontend URLs allowed to call the API. The Vite dev server
# runs on port 5173. For production, set CORS_ORIGINS in .env to your real
# frontend URL(s), comma-separated.
load_dotenv()

DEFAULT_CORS_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


class TravelRequest(BaseModel):
    message: str
    thread_id: str | None = None

@app.post(TRAVEL_ROUTE)
def travel_planner(request_data: TravelRequest):
    # Plain `def` (not async): run_travel_agent blocks for a long time, so
    # FastAPI runs this in a worker thread and other requests (like the
    # health check) keep being served.
    try:
        user_message = request_data.message.strip()

        if not user_message:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "Message cannot be empty."
                }
            )

        result = run_travel_agent(
            user_input=user_message,
            thread_id=request_data.thread_id
        )

        return JSONResponse(
            content={
                "success": True,
                "thread_id": result["thread_id"],
                "answer": result["answer"],
                "flight_results": result["flight_results"],
                "hotel_results": result["hotel_results"],
                "weather_results": result.get("weather_results", ""),  # only the MCP agent fills this
                "itinerary": result["itinerary"],
                "llm_calls": result["llm_calls"],
            }
        )

    except Exception as e:
        print("ERROR:", e)
        traceback.print_exc()

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )



@app.get(HEALTH_ROUTE)
async def health_check():
    return {
        "status": "ok",
        "message": "AI Travel Planner API is running"
    }



if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=PORT,
        reload=True
    )