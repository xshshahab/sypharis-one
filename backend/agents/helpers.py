"""Small helpers shared by the agents."""

import json
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from config.groq import get_groq_llm
from constants.agent_constant import (
    LLM_MAX_RETRIES,
    LLM_MODEL,
    LLM_REASONING_EFFORT,
    LLM_TEMPERATURE,
)


def get_llm():
    """The chat model every agent uses (created on first use, then reused)."""
    return get_groq_llm(
        model=LLM_MODEL,
        temperature=LLM_TEMPERATURE,
        reasoning_effort=LLM_REASONING_EFFORT,
        max_retries=LLM_MAX_RETRIES,
    )


def ask_llm(system_prompt: str, user_prompt: str):
    """Sends one system + one user message to the LLM and returns its reply message."""
    return get_llm().invoke(
        [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ]
    )


def llm_text(system_prompt: str, user_prompt: str) -> str:
    """Like ask_llm, but returns only the reply text."""
    return str(ask_llm(system_prompt, user_prompt).content)


def clip(text, limit: int) -> str:
    """
    Trims long text so a prompt stays under Groq's per-request token limit.
    Short text is returned unchanged.
    """
    text = str(text or "")

    if len(text) <= limit:
        return text

    return text[:limit].rstrip() + "\n[...trimmed to fit the model's token limit]"


def json_from_llm(text: str) -> dict[str, Any]:
    """Extract the first complete JSON object returned by the model."""
    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1 or end < start:
        raise ValueError("The model did not return a JSON object.")

    return json.loads(text[start : end + 1])


def empty_constraints() -> dict[str, Any]:
    """The trip constraints before the supervisor has filled anything in."""
    return {
        "destination": "",
        "origin": "",
        "duration": "",
        "budget": "",
        "travel_style": "",
        "special_preferences": [],
    }
