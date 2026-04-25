import io
import sqlite3
import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile
from app.db.database import get_db_path
from app.services.schema_extractor import get_all_schemas

router = APIRouter()


def sanitize_table_name(name: str) -> str:
    import re
    name = re.sub(r"[^a-zA-Z0-9_]", "_", name)
    if name[0].isdigit():
        name = "t_" + name
    return name.lower()


@router.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported."
        )

    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse CSV: {str(e)}"
        )

    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="CSV file is empty."
        )

    raw_name = file.filename.replace(".csv", "")
    table_name = sanitize_table_name(raw_name)
    db_path = get_db_path()

    try:
        conn = sqlite3.connect(db_path)
        df.to_sql(
            table_name,
            conn,
            if_exists="replace",
            index=False
        )
        conn.close()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    schema = get_all_schemas()

    return {
        "success": True,
        "table_name": table_name,
        "rows_imported": len(df),
        "columns": list(df.columns),
        "schema": schema,
    }


@router.get("/schema")
async def get_schema():
    schema = get_all_schemas()
    return {"schema": schema}


@router.delete("/table/{table_name}")
async def delete_table(table_name: str):
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    try:
        conn.execute(f"DROP TABLE IF EXISTS '{table_name}';")
        conn.commit()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not delete table: {str(e)}"
        )
    finally:
        conn.close()
    return {"success": True, "deleted": table_name}
