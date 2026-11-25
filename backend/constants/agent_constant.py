# Model used by every agent in the final version.
# openai/gpt-oss-120b is Groq's largest open model that this API key can use, and it is
# a production model. (llama-3.3-70b-versatile returns 404 "model_not_found" for this key.)
# List what your key can use:  curl https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY"
LLM_MODEL = "openai/gpt-oss-120b"

# 0 keeps the strict-JSON steps (guardrail, supervisor) as repeatable as possible
LLM_TEMPERATURE = 0

# gpt-oss is a reasoning model: its "thinking" tokens count toward Groq's token limit
# (8,000 tokens per minute on the free plan), so keep the effort low. "medium" / "high" think longer.
LLM_REASONING_EFFORT = "low"

# On a 429 (rate limit) the Groq client waits for the time Groq asks for, then retries.
# The default of 2 retries is too few to wait out a one-minute token window.
LLM_MAX_RETRIES = 6

# The specialist agents the supervisor can choose from, in the order they run.
# (itinerary_agent is last: it combines whatever the others produced.)
AGENT_ORDER = [
    "flight_agent",
    "hotel_agent",
    "weather_agent",
    "budget_agent",
    "itinerary_agent",
]

KNOWN_AGENTS = set(AGENT_ORDER)

# Groq's free plan allows 8,000 tokens per minute AND rejects any single request bigger than
# that (HTTP 413, which retrying cannot fix). Each result is trimmed to this many characters
# when it is put into a prompt, so even the biggest prompt (final_agent) stays well under the limit.
# The full, untrimmed results are still returned to the UI.
PROMPT_LIMITS = {
    "flights": 1500,
    "hotels": 2000,
    "weather": 1500,
    "budget": 3000,
    "itinerary": 5500,
}
