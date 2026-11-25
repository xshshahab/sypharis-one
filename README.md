# Sypharis One

An AI travel planner built as a multi-agent system. You describe a trip in plain language, and a team of agents checks live flights, finds hotels, and writes a complete itinerary.

The project is being built in phases. Each phase upgrades the same application. Phases 1 and 2 are finished and archived in `backend/backup/`, and the final version is being written in `backend/backend.py`.

| Phase | What it covers | Status |
|-------|----------------|--------|
| **1** | Multi-agent travel planner with LangGraph, **without MCP** | Done, archived |
| **2** | Tools moved to **MCP** (Model Context Protocol), plus a weather agent | Done, archived |
| **3** | **Final version**: Supervisor, Guardrails and Human-in-the-Loop (HITL) | In progress (`backend/backend.py`) |

> Branches: Phase 1 is on `phase/withoutmcp` and Phase 2 on `phase/withmcp`.

> **Current state:** `app.py` imports `run_travel_agent` from `backend/backend.py`. That file is the start of the final version and does not define it yet, so the API will not start until it does. See [Final version](#phase-3-final-version-supervisor-guardrails-and-hitl-in-progress).

---

## Phase 1: Multi-agent travel planner (without MCP)

> Archived in `backend/backup/`: `agent_without_mcp.py` (the graph), `agents/` and `tools/`.

### What it does

Ask something like *"Plan a 5 day Japan trip from Delhi with hotels"* and the app returns:

- **Live flight data** for the route (airline, flight number, status, terminals, gates, delays)
- **Hotel suggestions** from a web search
- A **day-by-day itinerary** that is budget-aware
- A **final formatted plan** with trip summary, flights, hotels, itinerary, estimated budget and recommendations

Follow-up requests in the same conversation reuse the same `thread_id`, and conversation state is saved in PostgreSQL.

### How it works

Four agents run one after another in a LangGraph graph. They share a single state object.

```mermaid
flowchart LR
    U([User request]) --> F[flight_agent]
    F --> H[hotel_agent]
    H --> I[itinerary_agent]
    I --> R[final_agent]
    R --> A([Final answer])

    F -. AviationStack .-> API1[(Flight API)]
    H -. Tavily .-> API2[(Web search)]
    I -. Groq LLM .-> LLM1{{gpt-oss-120b}}
    R -. Groq LLM .-> LLM1
```

| Agent | Uses | Job |
|-------|------|-----|
| `flight_agent` | AviationStack (no LLM) | Works out departure and arrival airports from the text, fetches live flights |
| `hotel_agent` | Tavily search (no LLM) | Searches the web for hotels matching the request |
| `itinerary_agent` | Groq LLM | Builds an itinerary from the flight and hotel results |
| `final_agent` | Groq LLM | Writes the final, formatted answer |

**Shared state** (`TravelState`): `messages`, `user_query`, `flight_results`, `hotel_results`, `itinerary`, `llm_calls`.

**Persistence:** a LangGraph `PostgresSaver` checkpointer stores each conversation thread in a PostgreSQL database (Render).

**Flight route parsing:** the flight tool understands plain requests such as `DAC to NRT`, `flights from Dhaka to Tokyo`, `Japan trip from Bangladesh`, or just `Japan trip` (which uses your default origin, Delhi). It is rule-based, with city, country and airport lookups, and no LLM is involved in that step.

### Tech stack

| Layer | Technology |
|-------|-----------|
| Agents | LangGraph, LangChain |
| LLM | Groq, model `openai/gpt-oss-120b` |
| Tools | AviationStack (flights), Tavily (web search) |
| API | FastAPI, Uvicorn |
| Database | PostgreSQL (Render) via `psycopg` |
| Tracing | LangSmith (optional) |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui |
| Packaging | Docker, Docker Compose, nginx |

### Project structure

The current layout of the repository:

```
SypharisOne/
├── backend/
│   ├── app.py                FastAPI app, CORS, API routes. Imports run_travel_agent from backend.py
│   ├── backend.py            Final version of the agent (in progress)
│   ├── mcp/                  Phase 2 MCP client and servers
│   │   ├── mcp_client.py     Connects to the MCP servers, shared helpers
│   │   ├── flight_aviation_mcp.py
│   │   ├── tavily_mcp.py
│   │   ├── weather_mcp.py    Client side of the weather server + destination detection
│   │   └── weather_mcp_server.py   Our own MCP server (OpenWeather)
│   ├── config/
│   │   ├── db.py             Database URL handling
│   │   └── groq.py           Groq LLM setup
│   ├── constants/
│   │   └── app_constant.py   Version and route paths
│   ├── backup/               Archived Phase 1 and 2 code, not used by the app
│   │   ├── agent_without_mcp.py   Phase 1 graph and run_travel_agent()
│   │   ├── agent_with_mcp.py      Phase 2 graph and run_travel_agent()
│   │   ├── agents/                Phase 1: one file per agent + the shared state
│   │   └── tools/                 flight_tool.py (AviationStack + route parsing), tavily_tool.py
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx           Page layout and request flow
│   │   ├── components/       Trip form, result view, Weather/Flights/Hotels cards, loading steps, theme toggle
│   │   └── lib/              api.ts (backend client), trip.ts (form to request), parse.ts (text to cards)
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml        Runs frontend and backend together
├── .dockerignore
├── requirements.txt          Backend Python dependencies
├── .env.example              Template for your secrets
└── README.md
```

### API

Base URL: `http://localhost:8000`. Interactive docs are at `/docs`.

**`POST /api/v1/travel`** plans a trip.

Request:

```json
{
  "message": "Plan a 5 day Japan trip from Delhi with hotels",
  "thread_id": null
}
```

`thread_id` is optional. Send the one you got back to continue the same conversation.

Response:

```json
{
  "success": true,
  "thread_id": "user_3f2a...",
  "answer": "...final formatted plan (markdown)...",
  "flight_results": "...",
  "hotel_results": "...",
  "weather_results": "...",
  "itinerary": "...",
  "llm_calls": 4
}
```

`weather_results` is an empty string unless the agent in `backend.py` provides it. The Phase 2 agent did. The Phase 1 agent did not.

Errors return `{ "success": false, "error": "..." }` with status `400` (empty message) or `500`.

**`GET /api/v1/health`** returns `{"status": "ok", ...}`.

Example:

```bash
curl -X POST http://localhost:8000/api/v1/travel \
  -H "Content-Type: application/json" \
  -d '{"message": "Flights from Delhi to Dubai"}'
```

### Getting started

#### 1. Get your API keys

| Service | What for | Link |
|---------|----------|------|
| Groq | The LLM | https://console.groq.com |
| Tavily | Hotel / web search | https://tavily.com |
| AviationStack | Live flight data | https://aviationstack.com |
| OpenWeather | Weather (Phase 2 weather MCP server) | https://openweathermap.org/api |
| Render PostgreSQL | Conversation storage | https://render.com (use the **External** database URL) |
| LangSmith (optional) | Tracing | https://smith.langchain.com |

#### 2. Create your `.env`

```bash
cp .env.example .env
```

Then fill in your values. `.env` is ignored by git, so your keys are never committed.

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq API key |
| `TAVILY_API_KEY` | Tavily API key |
| `AVIATIONSTACK_API_KEY` | AviationStack API key |
| `AVIATIONSTACK_BASE_URL` | Flights endpoint. Free plan is HTTP only |
| `DEFAULT_ORIGIN_IATA` | Default departure airport, e.g. `DEL` |
| `OPENWEATHER_API_KEY` | OpenWeather API key (used by the weather MCP server) |
| `DATABASE_URL` | Render PostgreSQL external URL (`sslmode=require` is added if missing) |
| `LANGSMITH_*` | Optional tracing settings |
| `CORS_ORIGINS` | Optional. Frontend URLs allowed to call the API (comma-separated) |

#### 3a. Run with Docker (recommended)

This needs `backend/backend.py` to define `run_travel_agent` (see **Current state** above).

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

The `.env` file is passed to the backend at runtime and is never copied into an image.

To point the frontend at a different API address, rebuild it with that address:

```bash
VITE_API_URL=https://api.example.com docker compose build frontend
```

Also set `CORS_ORIGINS` in `.env` to your frontend's address.

#### 3b. Run locally for development

**Backend** (Python 3.12):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cd backend
python3 app.py            # http://127.0.0.1:8000, auto-reload
```

Run backend commands from inside `backend/`. Its imports (`from backend import ...`, `config`, `constants`) are relative to that folder.

**Frontend** (Node 20.19+ and pnpm):

```bash
cd frontend
pnpm install
pnpm dev                  # http://localhost:5173
```

The frontend calls `http://127.0.0.1:8000` by default. To change it, copy `frontend/.env.example` to `frontend/.env` and edit `VITE_API_URL`.

### Frontend

A single-page app with a plain trip form (From, To, Days and optional notes) and a few popular trips. The form builds the request sentence for the API, for example *"Plan a 5 day trip from Delhi to Tokyo with hotels"*.

The result shows the plan on the left, with **Full plan** and **Day by day** views plus Copy and Print. On the right are **Weather**, **Flights** and **Hotels** cards. The Weather card only appears when the agent returns weather. The page also has a progress card while the agents work, retry on errors, and light/dark mode. Colors are solid (no gradients) and headings use a serif font.

### Known limitations (Phase 1)

These are the gaps the next phases are meant to address.

- **No ticket prices.** AviationStack returns live flight status, not fares. A pricing API (for example Amadeus) would be needed for real prices.
- **Fixed pipeline.** The agents always run in the same order. Nothing decides which agent is needed for a given request.
- **Tools are called directly in code.** There is no standard tool protocol, so adding or swapping a tool means editing the agents.
- **No guardrails.** User input and model output are not checked for safety, scope or quality.
- **No human approval step.** The system never pauses for confirmation before acting.
- **`llm_calls` counts every agent**, including the two that do not call the LLM, so a full run reports 4 although only 2 are real LLM calls.
- **Rule-based flight parsing.** Unusual phrasings or places outside the built-in city and country lists may resolve to the wrong airport.
- **Single request, no streaming.** The API answers once the whole pipeline is done, so the progress steps in the UI are a timer, not live status.
- **No authentication or rate limiting** on the API.

---

## Phase 2: MCP version

> Archived in `backend/backup/agent_with_mcp.py`. The MCP client and servers it uses are still in `backend/mcp/`.

The tools now run behind MCP (Model Context Protocol) servers, and the agents call them through one client instead of calling Python functions directly. A weather agent was added, so the pipeline is: flight, hotel, weather, itinerary, final. The LLM in this version was Groq `llama-3.3-70b-versatile`.

| MCP server | How it runs | Used for |
|------------|-------------|----------|
| AviationStack (`aviationstack-mcp`) | Started with `uvx` over stdio | Live flight information |
| Tavily | Remote server over streamable HTTP | Hotel search |
| Weather (`weather_mcp_server.py`) | Our own server (FastMCP), started as a subprocess over stdio | Current weather and forecast from OpenWeather |

- `mcp/mcp_client.py` is the hub: one `MultiServerMCPClient`, a helper that loads the tools of **one** server at a time (so a problem with one server does not stop the others), and a `call_mcp_tool()` helper that always returns text.
- **Flight agent:** the AviationStack plan used here blocks `list_airports` and `list_airlines`, so the agent works out the airports from the sentence and reads today's live departure board through the MCP server instead. Fares and duration are labelled as estimates.
- **Weather agent:** finds the destination city in the request (a country such as Japan maps to its main city) and fetches current weather and a short forecast.
- **Needs:** `OPENWEATHER_API_KEY` in `.env`, and `uv` (listed in `requirements.txt`) for `uvx`.
- Never add an `__init__.py` to `backend/mcp/`. A package named `mcp` would hide the real `mcp` library and break every MCP import.

To run an archived agent again, move it (and `tools/` and `agents/`) back into `backend/`.

## Phase 3: Final version: Supervisor, Guardrails and HITL (in progress)

The final version is written in `backend/backend.py`. The plan is a supervisor agent that routes work to the right agents, guardrails that check inputs and outputs, and human-in-the-loop approval points.

`app.py` expects `backend.py` to define `run_travel_agent(user_input, thread_id=None)` returning a dict with `thread_id`, `answer`, `flight_results`, `hotel_results`, `itinerary` and `llm_calls` (and optionally `weather_results`).

*Details will be added as this phase is built.*

---

## Notes

- Never commit `.env`. Only `.env.example` (placeholders only) belongs in git.
- The backend image runs as a non-root user.
- `backend/backup/` is an archive of the earlier phases. The app does not import it and does not need it to run.
