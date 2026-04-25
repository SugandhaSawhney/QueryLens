import sqlite3
from app.db.database import get_db_path


def get_all_schemas():
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
    )
    tables = [row[0] for row in cursor.fetchall()]

    schema = {}
    for table in tables:
        cursor.execute(f"PRAGMA table_info('{table}');")
        columns = cursor.fetchall()
        schema[table] = [
            {
                "name": col[1],
                "type": col[2],
                "nullable": not col[3],
                "pk": bool(col[5]),
            }
            for col in columns
        ]

    conn.close()
    return schema


def get_schema_string():
    schema = get_all_schemas()
    if not schema:
        return "No tables available."

    lines = []
    for table, columns in schema.items():
        col_defs = ", ".join(
            f"{c['name']} {c['type']}" for c in columns
        )
        lines.append(f"CREATE TABLE {table} ({col_defs});")

    return "\n".join(lines)
