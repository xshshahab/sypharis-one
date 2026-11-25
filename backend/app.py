import os
import traceback
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

import nest_asyncio
nest_asyncio.apply()

load_dotenv()

# =========================
# The agent (final version)
# =========================
# backend.py builds the graph from the agents/ folder and provides:
#   run_travel_agent(user_input, thread_id=None)  -> starts a plan, pauses for human approval
#   resume_travel_agent(thread_id, approved, feedback)  -> continues after the human's decision
# The Phase 1 and Phase 2 agents are archived in backend/backup/.
# Plain module name (not "backend.backend") because the app runs from inside backend/.
from backend import resume_travel_agent, run_travel_agent

from constants.app_constant import (
    PORT,
    VERSION,
    TRAVEL_ROUTE,
    TRAVEL_APPROVE_ROUTE,
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
# runs on port 5173 and 5174. For production, set CORS_ORIGINS in .env to your real
# frontend URL(s), comma-separated.
load_dotenv()

DEFAULT_CORS_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"

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


class ApprovalRequest(BaseModel):
    thread_id: str = Field(min_length=1)
    approved: bool
    feedback: str = ""


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

        # Everything run_travel_agent returns, including requires_approval and
        # approval_request, so the client knows when the plan is waiting for a decision.
        return JSONResponse(
            content={
                "success": True,
                **result,
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



@app.post(TRAVEL_APPROVE_ROUTE)
def approve_travel_plan(request_data: ApprovalRequest):
    # Plain `def` (not async), like travel_planner: resuming runs the final LLM
    # step, which blocks, and a sync route runs in a worker thread.
    try:
        if not request_data.approved and not request_data.feedback.strip():
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "Please provide revision feedback when rejecting the draft.",
                },
            )

        result = resume_travel_agent(
            thread_id=request_data.thread_id,
            approved=request_data.approved,
            feedback=request_data.feedback,
        )

        return JSONResponse(
            content={
                "success": True,
                **result,
            }
        )

    except Exception as exc:
        print("APPROVAL ERROR:", exc)
        traceback.print_exc()

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(exc),
            },
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