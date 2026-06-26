"""
QueryLens NL-to-SQL Accuracy Test Suite
-----------------------------------------
Pytest suite that validates the /api/query endpoint against a
ground-truth test set computed directly from student_score.csv
using pandas (see compute_ground_truth.py for how expected values
were derived).

SETUP:
1. Start the backend: uvicorn app.main:app --reload
2. Upload student_score.csv via /api/upload (or run with
   --upload flag - see conftest fixture below)
3. From the backend/ directory, run: pytest tests/ -v

This produces a per-question pass/fail report plus a summary
line with overall accuracy - run pytest tests/ -v --tb=short
for a clean view in CI or terminal.
"""

import time

import pytest
import requests

BASE_URL = "http://localhost:8000/api"

# Each entry: (id, question, expected_value, query_type, tolerance)
# query_type drives which assertion strategy is used:
#   "count" / "value" -> exact match
#   "avg"              -> match within tolerance
#   "group_avg"        -> dict of {label: avg}, order-independent
#   "group_count"      -> dict of {label: count}, order-independent
#   "top_n"            -> ordered list match
SIMPLE_CASES = [
    (1, "How many total students are there?", 15900, "count", 0),
    (2, "How many female students are there?", 7916, "count", 0),
    (3, "How many male students are there?", 7984, "count", 0),
    (4, "What is the average final test score?", 67.17, "avg", 0.5),
    (5, "What is the maximum final test score?", 100.0, "value", 0),
    (6, "What is the minimum final test score?", 32.0, "value", 0),
    (
        7,
        "How many students got direct admission?",
        4705,
        "count",
        0,
    ),
    (
        8,
        "What is the average attendance rate?",
        93.27,
        "avg",
        0.5,
    ),
    (9, "How many students walk to school?", 3206, "count", 0),
    (
        10,
        "How many students have a visual learning style?",
        6768,
        "count",
        0,
    ),
]

MULTI_CONDITION_CASES = [
    (
        21,
        "How many female students are 16 years old?",
        3840,
        "count",
        0,
    ),
    (
        22,
        "How many male students got direct admission?",
        2281,
        "count",
        0,
    ),
    (
        23,
        "How many students with visual learning style walk "
        "to school?",
        1383,
        "count",
        0,
    ),
    (
        25,
        "How many students did not get direct admission?",
        11195,
        "count",
        0,
    ),
]

GROUP_BY_CASES = [
    (
        29,
        "What is the average final test score grouped by gender?",
        {"Female": 67.0, "Male": 67.33},
        "group_avg",
        0.5,
    ),
    (
        31,
        "What is the average final test score grouped by "
        "learning style?",
        {"Auditory": 63.89, "Visual": 71.59},
        "group_avg",
        0.5,
    ),
]


@pytest.fixture(scope="session", autouse=True)
def ensure_backend_is_up():
    """Fail fast with a clear message if the backend isn't running,
    instead of letting every test time out individually."""
    try:
        resp = requests.get(
            f"{BASE_URL.replace('/api', '')}/health", timeout=5
        )
        assert resp.status_code == 200
    except requests.exceptions.RequestException:
        pytest.fail(
            "Backend not reachable at "
            f"{BASE_URL}. Start it with: "
            "uvicorn app.main:app --reload"
        )


def query(question: str):
    resp = requests.post(
        f"{BASE_URL}/query", json={"question": question}, timeout=30
    )
    time.sleep(1.5)  # avoid Groq free-tier rate limiting
    return resp


def extract_single_value(result):
    rows = result.get("rows", [])
    if not rows:
        return None
    first_row = rows[0]
    if isinstance(first_row, list) and len(first_row) > 0:
        return first_row[0]
    return first_row


def extract_group_dict(result):
    rows = result.get("rows", [])
    actual = {}
    for row in rows:
        if isinstance(row, list) and len(row) >= 2:
            label, value = row[0], row[1]
            try:
                actual[str(label)] = float(value)
            except (ValueError, TypeError):
                actual[str(label)] = value
    return actual


@pytest.mark.parametrize(
    "case_id,question,expected,qtype,tolerance", SIMPLE_CASES
)
def test_simple_queries(case_id, question, expected, qtype, tolerance):
    resp = query(question)
    assert resp.status_code == 200, (
        f"Q{case_id} API error: {resp.text[:200]}"
    )

    data = resp.json()
    actual = extract_single_value(data.get("result", {}))
    assert actual is not None, f"Q{case_id}: no result returned"

    if qtype == "avg":
        assert abs(float(actual) - expected) <= tolerance, (
            f"Q{case_id} ({question}): expected ~{expected}, "
            f"got {actual}"
        )
    else:
        assert float(actual) == float(expected), (
            f"Q{case_id} ({question}): expected {expected}, "
            f"got {actual}"
        )


@pytest.mark.parametrize(
    "case_id,question,expected,qtype,tolerance",
    MULTI_CONDITION_CASES,
)
def test_multi_condition_queries(
    case_id, question, expected, qtype, tolerance
):
    resp = query(question)
    assert resp.status_code == 200, (
        f"Q{case_id} API error: {resp.text[:200]}"
    )

    data = resp.json()
    actual = extract_single_value(data.get("result", {}))
    assert actual is not None, f"Q{case_id}: no result returned"
    assert float(actual) == float(expected), (
        f"Q{case_id} ({question}): expected {expected}, got {actual}"
    )


@pytest.mark.parametrize(
    "case_id,question,expected,qtype,tolerance", GROUP_BY_CASES
)
def test_group_by_queries(case_id, question, expected, qtype, tolerance):
    resp = query(question)
    assert resp.status_code == 200, (
        f"Q{case_id} API error: {resp.text[:200]}"
    )

    data = resp.json()
    actual = extract_group_dict(data.get("result", {}))

    assert set(actual.keys()) == set(expected.keys()), (
        f"Q{case_id} ({question}): expected groups "
        f"{list(expected.keys())}, got {list(actual.keys())}"
    )
    for label, expected_val in expected.items():
        assert abs(actual[label] - expected_val) <= tolerance, (
            f"Q{case_id} ({question}) group '{label}': "
            f"expected ~{expected_val}, got {actual[label]}"
        )


def test_sql_injection_blocked():
    """A stacked statement should be rejected outright."""
    resp = requests.post(
        f"{BASE_URL}/query/raw",
        json={"sql": "SELECT 1; DROP TABLE student_score;"},
        timeout=10,
    )
    assert resp.status_code == 400, (
        "Stacked SQL statements should be rejected with 400, "
        f"got {resp.status_code}"
    )


def test_schema_table_access_blocked():
    """Querying sqlite_master directly should be rejected."""
    resp = requests.post(
        f"{BASE_URL}/query/raw",
        json={"sql": "SELECT * FROM sqlite_master;"},
        timeout=10,
    )
    assert resp.status_code == 400, (
        "Access to sqlite_master should be blocked, "
        f"got {resp.status_code}"
    )
