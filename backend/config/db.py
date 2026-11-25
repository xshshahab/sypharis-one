import os
from urllib.parse import urlparse

LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1", "postgres", "db"}


def get_database_url():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError(
            "DATABASE_URL is missing. Set it in .env (for example, your Docker or PostgreSQL connection URL)."
        )

    if "sslmode=" not in database_url:
        host = (urlparse(database_url).hostname or "").lower()
        mode = "disable" if host in LOCAL_HOSTS else "require"
        separator = "&" if "?" in database_url else "?"
        database_url = f"{database_url}{separator}sslmode={mode}"

    return database_url
