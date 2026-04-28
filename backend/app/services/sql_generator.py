import requests

from app.services.schema_extractor import (
    get_schema_string,
    get_all_schemas,
)
from app.db.database import get_db_path


import os
from dotenv import load_dotenv

load_dotenv()
GROQ_API_URL = os.getenv("GROQ_API_URL")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not set in .env file")


def build_prompt(question: str, schema: str) -> str:

    tables = get_all_schemas()
    samples = ""
    for table in tables:
        sample = get_sample_rows(table, 3)
        if sample:
            samples += f"\nSample rows from {table}:\n{sample}\n"

    return f"""You are a SQLite expert. Write a single SQLite SELECT query.

Rules:
- Return ONLY the SQL query, nothing else
- No markdown, no backticks, no explanation
- Must start with SELECT
- Use ONLY column names that exist in the schema below
- Do NOT invent column names
- If a column name is a reserved SQL keyword (like Group, Order, Select, etc.),
wrap it in double quotes like "Group"
- For questions about multiple tables use JOIN or subqueries
- Always specify table name before column name like table.column

Schema:
{schema}
{samples}
Question: {question}
"""


def generate_sql(question: str) -> str:
    schema = get_schema_string()
    prompt = build_prompt(question, schema)

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "temperature": 0,
        "max_tokens": 300,
    }

    try:
        resp = requests.post(
            GROQ_API_URL,
            headers=headers,
            json=payload,
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        raw = data["choices"][0]["message"]["content"].strip()
        print("RAW MODEL OUTPUT:", raw)
        print("CLEANED SQL:", clean_sql(raw))
        return clean_sql(raw)
    except Exception as e:
        raise RuntimeError(f"Groq error: {str(e)}")


def get_sample_rows(table: str, n: int = 3) -> str:
    db_path = get_db_path()
    import sqlite3
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT * FROM '{table}' LIMIT {n};")
        rows = cursor.fetchall()
        cols = [d[0] for d in cursor.description]
        lines = [", ".join(cols)]
        for row in rows:
            lines.append(", ".join(str(v) for v in row))
        return "\n".join(lines)
    except Exception:
        return ""
    finally:
        conn.close()


def clean_sql(raw: str) -> str:
    sql = raw.strip()

    if "```" in sql:
        parts = sql.split("```")
        for part in parts:
            stripped = part.strip()
            if stripped.lower().startswith("sql"):
                stripped = stripped[3:].strip()
            if stripped.upper().startswith("SELECT"):
                return stripped.rstrip(";") + ";"

    # Find SELECT and return from there
    upper = sql.upper()
    idx = upper.find("SELECT")
    if idx != -1:
        sql = sql[idx:]
        return sql.rstrip(";") + ";"

    return sql.rstrip(";") + ";"
