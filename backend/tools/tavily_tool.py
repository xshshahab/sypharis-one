import os

from dotenv import load_dotenv
from tavily import TavilyClient

load_dotenv()

client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))


def tavily_search(query: str) -> str:
    """
    Search the web for travel information (destinations, visas, weather, etc.).

    Args:
        query: The search query.

    Returns:
        A numbered, formatted string of the top results (title, URL, snippet).
    """
    try:
        response = client.search(query=query, max_results=5)
    except Exception as e:
        return f"Search failed: {e}"

    items = response.get("results", [])
    if not items:
        return "No results found."

    results = []
    for i, r in enumerate(items, 1):
        title = r.get("title", "Unknown")
        url = r.get("url", "")
        snippet = r.get("content", "").strip()
        if len(snippet) > 300:
            snippet = snippet[:300].rsplit(" ", 1)[0] + "..."
        results.append(f"{i}. **{title}**\n   {url}\n   {snippet}")

    return "\n\n".join(results)