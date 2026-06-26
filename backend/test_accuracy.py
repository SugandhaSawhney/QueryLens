"""
QueryLens Accuracy Test Script
--------------------------------
Runs a fixed set of natural-language questions against the QueryLens
/api/query endpoint and checks whether the returned result matches the
ground-truth answer (computed directly from the CSV with pandas).

HOW TO RUN:
1. Make sure your backend is running (uvicorn app.main:app --reload)
2. Make sure student_score.csv has already been uploaded via /api/upload
   (or this script will upload it for you - see UPLOAD_CSV below)
3. pip install requests
4. python test_accuracy.py

OUTPUT:
Prints a pass/fail per question + final accuracy %, and saves a
detailed results.json you can screenshot/attach as proof.
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000/api"  # change port if different
CSV_PATH = "student_score.csv"  # put the CSV in this script's folder
UPLOAD_CSV = False  # set to False if you've already uploaded it

# Each test case: question, expected numeric/text answer, tolerance
# (for floats), and which key in the result to check (rows are
# inspected generically, no schema-specific parsing needed)
TEST_CASES = [
    {
        "id": 1,
        "question": "How many total students are there?",
        "expected": 15900,
        "type": "count",
    },
    {
        "id": 2,
        "question": "How many female students are there?",
        "expected": 7916,
        "type": "count",
    },
    {
        "id": 3,
        "question": "How many male students are there?",
        "expected": 7984,
        "type": "count",
    },
    {
        "id": 4,
        "question": "What is the average final test score?",
        "expected": 67.17,
        "type": "avg",
        "tolerance": 0.5,
    },
    {
        "id": 5,
        "question": "What is the maximum final test score?",
        "expected": 100.0,
        "type": "value",
    },
    {
        "id": 6,
        "question": "What is the minimum final test score?",
        "expected": 32.0,
        "type": "value",
    },
    {
        "id": 7,
        "question": "How many students got direct admission?",
        "expected": 4705,
        "type": "count",
    },
    {
        "id": 8,
        "question": "What is the average attendance rate?",
        "expected": 93.27,
        "type": "avg",
        "tolerance": 0.5,
    },
    {
        "id": 9,
        "question": "How many students walk to school?",
        "expected": 3206,
        "type": "count",
    },
    {
        "id": 10,
        "question": "How many students have a visual learning style?",
        "expected": 6768,
        "type": "count",
    },
    {
        "id": 11,
        "question": "How many students have an auditory learning style?",
        "expected": 9132,
        "type": "count",
    },
    {
        "id": 12,
        "question": "How many students are 16 years old?",
        "expected": 7723,
        "type": "count",
    },
    {
        "id": 13,
        "question": "What is the average hours per week spent studying?",
        "expected": 10.31,
        "type": "avg",
        "tolerance": 0.5,
    },
    {
        "id": 14,
        "question": "How many students scored above 90 in the final test?",
        "expected": 890,
        "type": "count",
    },
    {
        "id": 15,
        "question": "How many students scored below 50 in the final test?",
        "expected": 1858,
        "type": "count",
    },
    {
        "id": 16,
        "question": "How many students have a yellow bag color?",
        "expected": 2731,
        "type": "count",
    },
    {
        "id": 17,
        "question": "How many students have zero siblings?",
        "expected": 5492,
        "type": "count",
    },
    {
        "id": 18,
        "question": "What is the average final test for female students?",
        "expected": 67.0,
        "type": "avg",
        "tolerance": 0.5,
    },
    {
        "id": 19,
        "question": "What is the average final test score for male students?",
        "expected": 67.33,
        "type": "avg",
        "tolerance": 0.5,
    },
    {
        "id": 20,
        "question": "How many students use private transport?",
        "expected": 6323,
        "type": "count",
    },
    # --- Harder queries below: multi-condition, GROUP BY, ORDER BY ---
    {
        "id": 21,
        "question": "How many female students are 16 years old?",
        "expected": 3840,
        "type": "count",
    },
    {
        "id": 22,
        "question": (
            "How many male students got direct admission?"
        ),
        "expected": 2281,
        "type": "count",
    },
    {
        "id": 23,
        "question": (
            "How many students with visual learning style walk "
            "to school?"
        ),
        "expected": 1383,
        "type": "count",
    },
    {
        "id": 24,
        "question": (
            "How many female students scored above 80 in the "
            "final test?"
        ),
        "expected": 1433,
        "type": "count",
    },
    {
        "id": 25,
        "question": "How many students did not get direct admission?",
        "expected": 11195,
        "type": "count",
    },
    {
        "id": 26,
        "question": "How many distinct bag colors are there?",
        "expected": 6,
        "type": "value",
    },
    {
        "id": 27,
        "question": "What is the maximum hours per week spent studying?",
        "expected": 20.0,
        "type": "value",
    },
    {
        "id": 28,
        "question": "What is the minimum hours per week spent studying?",
        "expected": 0.0,
        "type": "value",
    },
    {
        "id": 29,
        "question": "What is the average final test score grouped by gender?",
        "expected": {"Female": 67.00, "Male": 67.33},
        "type": "group_avg",
        "tolerance": 0.5,
    },
    {
        "id": 30,
        "question": (
            "What is the count of students grouped by mode of "
            "transport?"
        ),
        "expected": {
            "public transport": 6371,
            "private transport": 6323,
            "walk": 3206,
        },
        "type": "group_count",
    },
    {
        "id": 31,
        "question": (
            "What is the average final test score grouped by "
            "learning style?"
        ),
        "expected": {"Auditory": 63.89, "Visual": 71.59},
        "type": "group_avg",
        "tolerance": 0.5,
    },
    {
        "id": 32,
        "question": "What are the top 5 highest final test scores?",
        "expected": [100.0, 100.0, 100.0, 100.0, 100.0],
        "type": "top_n",
    },
    {
        "id": 33,
        "question": (
            "What is the difference between average final test "
            "scores of male and female students?"
        ),
        "expected": 0.33,
        "type": "avg",
        "tolerance": 0.5,
    },
]


def upload_csv():
    print("Uploading CSV...")
    with open(CSV_PATH, "rb") as f:
        files = {"file": (CSV_PATH, f, "text/csv")}
        resp = requests.post(f"{BASE_URL}/upload", files=files, timeout=60)
    if resp.status_code != 200:
        print(f"  Upload FAILED: {resp.status_code} - {resp.text}")
        return False
    data = resp.json()
    print(
        f"  Uploaded as table '{data.get('table_name')}' "
        f"with {data.get('rows_imported')} rows"
    )
    return True


def extract_single_value(result):
    """
    Pull a single numeric/text value out of a QueryLens result dict.
    Used for simple count/avg/value questions that return 1 row.
    """
    rows = result.get("rows", [])
    if not rows:
        return None
    first_row = rows[0]
    if isinstance(first_row, list) and len(first_row) > 0:
        return first_row[0]
    return first_row


def check_group_result(result, expected_dict, tolerance=0.5):
    """
    Check a GROUP BY style result (multiple rows, each with a
    label column and a value column) against an expected
    {label: value} mapping. Order-independent.
    """
    rows = result.get("rows", [])
    if not rows:
        return False, {}

    actual_dict = {}
    for row in rows:
        if not isinstance(row, list) or len(row) < 2:
            continue
        label, value = row[0], row[1]
        try:
            actual_dict[str(label)] = float(value)
        except (ValueError, TypeError):
            actual_dict[str(label)] = value

    if set(actual_dict.keys()) != set(expected_dict.keys()):
        return False, actual_dict

    for label, expected_val in expected_dict.items():
        actual_val = actual_dict.get(label)
        if actual_val is None:
            return False, actual_dict
        try:
            if abs(float(actual_val) - float(expected_val)) > tolerance:
                return False, actual_dict
        except (ValueError, TypeError):
            return False, actual_dict

    return True, actual_dict


def check_top_n(result, expected_list):
    """
    Check a top-N / ORDER BY style result: compares the first
    column's values across the returned rows against an expected
    list (order-sensitive, since ORDER BY implies ranking).
    """
    rows = result.get("rows", [])
    if not rows:
        return False, []

    actual_values = []
    for row in rows:
        if isinstance(row, list) and len(row) > 0:
            try:
                actual_values.append(float(row[0]))
            except (ValueError, TypeError):
                actual_values.append(row[0])

    if len(actual_values) != len(expected_list):
        return False, actual_values

    for actual, expected in zip(actual_values, expected_list):
        try:
            if abs(float(actual) - float(expected)) > 0.01:
                return False, actual_values
        except (ValueError, TypeError):
            if actual != expected:
                return False, actual_values

    return True, actual_values


def check_answer(case, actual_value):
    if actual_value is None:
        return False
    try:
        actual_num = float(actual_value)
    except (ValueError, TypeError):
        actual_str = str(actual_value).strip().lower()
        expected_str = str(case["expected"]).strip().lower()
        return actual_str == expected_str

    expected = float(case["expected"])
    tolerance = case.get("tolerance", 0.01)
    if case["type"] in ("avg",):
        return abs(actual_num - expected) <= tolerance
    else:
        return actual_num == expected


def run_tests():
    results = []
    passed = 0

    for case in TEST_CASES:
        print(f"\n[{case['id']}] {case['question']}")
        try:
            resp = requests.post(
                f"{BASE_URL}/query",
                json={"question": case["question"]},
                timeout=30,
            )
        except requests.exceptions.RequestException as e:
            print(f"  REQUEST FAILED: {e}")
            results.append({
                **case,
                "actual": None,
                "sql": None,
                "passed": False,
                "error": str(e),
            })
            continue

        if resp.status_code != 200:
            print(f"  API ERROR {resp.status_code}: {resp.text[:200]}")
            results.append({
                **case,
                "actual": None,
                "sql": None,
                "passed": False,
                "error": resp.text[:200],
            })
            continue

        data = resp.json()
        sql = data.get("sql", "")
        result = data.get("result", {})
        qtype = case["type"]

        if qtype in ("group_avg", "group_count"):
            tol = case.get("tolerance", 0.01)
            ok, actual_value = check_group_result(
                result, case["expected"], tolerance=tol
            )
        elif qtype == "top_n":
            ok, actual_value = check_top_n(result, case["expected"])
        else:
            actual_value = extract_single_value(result)
            ok = check_answer(case, actual_value)

        passed += int(ok)

        status = "PASS" if ok else "FAIL"
        print(f"  SQL: {sql}")
        print(
            f"  Expected: {case['expected']}  |  "
            f"Got: {actual_value}  |  {status}"
        )

        results.append({
            **case,
            "sql": sql,
            "actual": actual_value,
            "passed": ok,
        })

        time.sleep(3)  # avoid Groq free-tier rate limit (429 errors)

    accuracy = (passed / len(TEST_CASES)) * 100
    print("\n" + "=" * 50)
    print(f"RESULT: {passed}/{len(TEST_CASES)} passed -> "
          f"{accuracy:.1f}% accuracy")
    print("=" * 50)

    with open("results.json", "w") as f:
        json.dump({
            "total": len(TEST_CASES),
            "passed": passed,
            "accuracy_percent": round(accuracy, 1),
            "details": results,
        }, f, indent=2)
    print("\nDetailed results saved to results.json")


if __name__ == "__main__":
    if UPLOAD_CSV:
        if not upload_csv():
            print("Stopping - fix upload first.")
            exit(1)
        time.sleep(1)

    run_tests()
