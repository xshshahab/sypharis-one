import os
from functools import lru_cache

from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()


@lru_cache(maxsize=1)
def get_groq_llm():
    """Returns the shared Groq chat model (created once, on first use)."""

    groq_api_key = os.getenv("GROQ_API_KEY")

    if not groq_api_key:
        raise ValueError(
            "GROQ_API_KEY is missing. Please add it to your .env file"
        )

    llm = ChatGroq(
        model="openai/gpt-oss-120b",
        api_key=groq_api_key,
        temperature=0
    )

    return llm