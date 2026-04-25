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
]


def sanitize_sql(sql: str) -> None:
    upper = sql.upper()
    for pattern in BLOCKED_KEYWORDS:
        if re.search(pattern, upper):
            keyword = pattern.replace(r"\b", "")
            raise ValueError(
                f"SQL contains forbidden keyword: {keyword}. "
                "Only SELECT queries are allowed."
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
