import json

from mcp_client import call_mcp_tool, get_server_tools

# This returns tavily_search tool object
tavily_search_tool = None


async def get_tavily_search_tool():
    global tavily_search_tool
    if tavily_search_tool is not None:
        return tavily_search_tool

    # Load only Tavily (the other servers are not started)
    tools = await get_server_tools("tavily")

    if "tavily_search" not in tools:
        available = ", ".join(sorted(tools)) or "none"
        raise RuntimeError(
            f"Tavily MCP has no 'tavily_search' tool. Available tools: {available}"
        )

    tavily_search_tool = tools["tavily_search"]
    return tavily_search_tool


def format_tavily_results(raw: str) -> str:
    """
    Turns the Tavily MCP JSON into the same short text the direct Tavily tool
    returns (numbered list: **title**, url, snippet). If the reply is not the
    expected JSON (for example an error message), it is returned unchanged.
    """
    try:
        items = json.loads(raw).get("results", [])
    except (ValueError, AttributeError):
        return raw

    if not items:
        return "No results found."

    results = []
    for i, item in enumerate(items, 1):
        title = item.get("title", "Unknown")
        url = item.get("url", "")
        snippet = (item.get("content") or "").strip().replace("\n", " ")
        if len(snippet) > 300:
            snippet = snippet[:300].rsplit(" ", 1)[0] + "..."
        results.append(f"{i}. **{title}**\n   {url}\n   {snippet}")

    return "\n\n".join(results)


# This function can be used to call the tavily_search tool with a query in agent_with_mcp.py
async def tavily_mcp_search(query: str, max_results: int = 5):
    await get_tavily_search_tool()

    raw = await call_mcp_tool(
        "tavily",
        "tavily_search",
        {
            "query": query,
            "max_results": max_results
        }
    )

    return format_tavily_results(raw)
