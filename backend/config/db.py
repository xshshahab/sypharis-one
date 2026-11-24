import os

def get_database_url():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE URL is missing. Please add your render PostgreSQL External Database URL to .env file")

    if "sslmode=" not in database_url:
        seperator  ="&" if "?" in database_url else "?"
        database_url = f"{database_url}{seperator}sslmode=require"

    return database_url