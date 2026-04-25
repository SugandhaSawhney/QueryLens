import os
import sqlite3
from pathlib import Path

DB_DIR = Path(__file__).parent.parent.parent / "data"
DB_DIR.mkdir(exist_ok=True)
DB_PATH = DB_DIR / "querylens.db"


def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def get_db_path():
    return str(DB_PATH)
