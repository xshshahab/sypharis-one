"""
Two helpers removed from backend/mcp/mcp_client.py because nothing calls them.
Kept here as a backup. To use them again, paste them back into mcp_client.py.

(This file is an archive and is not imported by the app.)
"""

from mcp_client import client  # works when backend/mcp is on sys.path


def get_client():
    """Returns the shared MCP client."""
    return client


async def get_all_tools():
    """Prints the tools of every server (handy for debugging)."""
    tools = await client.get_tools()
    print("\nAvailable MCP Tools:\n")

    for tool in tools:
        print(tool.name)
