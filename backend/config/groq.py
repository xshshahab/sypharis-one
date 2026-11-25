import os
from functools import lru_cache

from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

DEFAULT_MODEL = "openai/gpt-oss-120b"


@lru_cache(maxsize=None)
def get_groq_llm(
    model: str = DEFAULT_MODEL,
    temperature: float | None = 0,
    reasoning_effort: str | None = None,
    max_retries: int | None = None,
):
    """
    Returns a Groq chat model, created once per combination of settings on first use.

    With no arguments you get the original shared model (gpt-oss-120b, temperature 0).
    Pass None for temperature, reasoning_effort or max_retries to leave that setting
    at the library default. reasoning_effort ("low", "medium", "high") only applies
    to reasoning models such as gpt-oss.
    """

    groq_api_key = os.getenv("GROQ_API_KEY")

    if not groq_api_key:
        raise ValueError(
            "GROQ_API_KEY is missing. Please add it to your .env file"
        )

    settings = {"model": model, "api_key": groq_api_key}

    if temperature is not None:
        settings["temperature"] = temperature

    if reasoning_effort is not None:
        settings["reasoning_effort"] = reasoning_effort

    if max_retries is not None:
        settings["max_retries"] = max_retries

    return ChatGroq(**settings)
