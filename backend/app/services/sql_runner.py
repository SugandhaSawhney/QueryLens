import re
import sqlite3
from typing import Any, Dict, List
from app.db.database import get_db_path

BLOCKED_KEYWORDS = [
    r"\bDROP\b",
    r"\bDELETE\b",
    r"\bUPDATE\b",
    r"\bINSERT\b",
    r"\bALTER\b",
    r"\bTRUNCATE\b",
    r"\bCREATE\b",
    r"\bGRANT\b",
    r"\bREVOKE\b",
    r"\bATTACH\b",
    r"\bDETACH\b",
    r"\bPRAGMA\b",
]

# SQLite internal tables that can leak schema/structure if queried
# directly (e.g. via UNION SELECT sql FROM sqlite_master)
BLOCKED_TABLES = [
    "sqlite_master",
    "sqlite_temp_master",
    "sqlite_schema",
]


def sanitize_sql(sql: str) -> None:
    """
    Validates that a query is a single, read-only SELECT statement
    with no access to SQLite's internal schema tables.

    This is still string-based validation (not a full SQL parser),
    so it should be treated as a defense-in-depth layer rather than
    a complete guarantee - the real safety boundary is that this API
    only ever talks to a disposable, per-session SQLite file with no
    sensitive data, not a production database.
    """
    stripped = sql.strip().rstrip(";")

    # Reject multiple statements stacked together, e.g.
    # "SELECT 1; DROP TABLE x" - a single trailing semicolon is fine,
    # but a semicolon followed by more content is not.
    if ";" in stripped:
        raise ValueError(
            "Multiple SQL statements are not allowed. "
            "Only a single SELECT statement is permitted."
        )

    upper = stripped.upper()

    if not upper.startswith("SELECT"):
        raise ValueError("Only SELECT queries are allowed.")

    for pattern in BLOCKED_KEYWORDS:
        if re.search(pattern, upper):
            keyword = pattern.replace(r"\b", "")
            raise ValueError(
                f"SQL contains forbidden keyword: {keyword}. "
                "Only read-only SELECT queries are allowed."
            )

    for table in BLOCKED_TABLES:
        if table.upper() in upper:
            raise ValueError(
                f"Access to internal schema table '{table}' is not "
                "allowed."
            )


def run_query(sql: str) -> Dict[str, Any]:
    sanitize_sql(sql)
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    try:
        cursor = conn.cursor()
        cursor.execute(sql)
        rows = cursor.fetchall()

        if not rows:
            return {"columns": [], "rows": [], "count": 0}

        columns = list(rows[0].keys())
        data: List[List[Any]] = [list(row) for row in rows]

        return {
            "columns": columns,
            "rows": data,
            "count": len(data),
        }
    except sqlite3.OperationalError as e:
        raise ValueError(f"SQL execution error: {str(e)}")
    finally:
        conn.close()
