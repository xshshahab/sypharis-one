"""
Puts backend/mcp on the import path.

The MCP helper files (mcp_client.py, tavily_mcp.py, ...) import each other by
plain name, for example `from mcp_client import ...`. Import this module before
importing anything from there:

    from config import paths  # noqa: F401

The folder is added at the END of sys.path, so it can never hide an installed
package. Never add an __init__.py to backend/mcp: a package called "mcp" would
hide the real MCP library and break every MCP import.
"""

import sys
from pathlib import Path

MCP_DIR = str(Path(__file__).resolve().parent.parent / "mcp")

if MCP_DIR not in sys.path:
    sys.path.append(MCP_DIR)
