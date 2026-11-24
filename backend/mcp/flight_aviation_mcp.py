from mcp_client import call_mcp_tool, get_server_tools

aviation_tools = {}


async def initialize_aviation_tools():
    global aviation_tools

    if aviation_tools:
        return

    # Load only AviationStack.
    # Tavily and Weather will not be initialized here.
    aviation_tools = await get_server_tools("aviationstack")


async def aviation_mcp_call(
    tool_name: str,
    tool_args: dict = None
):
    """
    Calls one AviationStack MCP tool and returns its result as text (JSON).

    Useful tools: list_airports, list_airlines, get_flight_status,
    flight_arrival_departure_schedule, list_routes.
    """
    await initialize_aviation_tools()

    return await call_mcp_tool(
        "aviationstack",
        tool_name,
        tool_args
    )
