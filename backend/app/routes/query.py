from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.sql_generator import generate_sql
from app.services.sql_runner import run_query
from app.services.schema_extractor import get_all_schemas

router = APIRouter()


class QueryRequest(BaseModel):
    question: str


class SQLRequest(BaseModel):
    sql: str


@router.post("/query")
async def natural_language_query(body: QueryRequest):
    question = body.question.strip()
    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    schema = get_all_schemas()
    if not schema:
        raise HTTPException(
            status_code=400,
            detail="No tables found. Please upload a CSV first."
        )

    try:
        sql = generate_sql(question)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"SQL generation failed: {str(e)}"
        )

    try:
        result = run_query(sql)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Query execution failed: {str(e)}"
        )

    return {
        "question": question,
        "sql": sql,
        "result": result,
    }


@router.post("/query/raw")
async def raw_sql_query(body: SQLRequest):
    sql = body.sql.strip()
    if not sql:
        raise HTTPException(
            status_code=400,
            detail="SQL cannot be empty."
        )

    try:
        result = run_query(sql)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Query execution failed: {str(e)}"
        )

    return {"sql": sql, "result": result}
