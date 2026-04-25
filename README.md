# QueryLens

**Natural Language to SQL — Business Intelligence Tool**

QueryLens lets anyone query structured data using plain English. No SQL required. Upload a CSV, ask a question, get results as a table and chart in seconds.

[![Python](https://img.shields.io/badge/Python-3.10+-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## What it does

Most business data sits in spreadsheets that require SQL knowledge to query — creating a bottleneck where non-technical teams depend on engineers for basic data questions. QueryLens removes that dependency entirely.

```
Upload CSV  →  Ask a question in plain English  →  Get SQL + chart + table instantly
```

---

## Features

- **Natural Language → SQL** via LLM with schema-aware prompting
- **Auto chart selection** — bar, line, or pie picked based on result shape
- **Multi-table support** — upload multiple CSVs, query across them
- **SQL preview + edit** — see and modify generated SQL before running
- **Read-only enforcement** — blocks DROP, DELETE, UPDATE, INSERT at the sanitization layer
- **Query history** — last 10 queries saved locally, one-click re-run
- **CSV export** — download any result set instantly

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Recharts, Lucide |
| Backend | Python, FastAPI, SQLite, Pandas |
| AI / LLM | Groq API — LLaMA 3.1 8B (default) · Ollama · HuggingFace |
| Dev Tools | uvicorn, python-dotenv, SQLAlchemy |

---

## Project Structure

```
querylens/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app, CORS
│   │   ├── routes/
│   │   │   ├── upload.py           # CSV → SQLite ingestion
│   │   │   └── query.py            # NL → SQL → result
│   │   ├── services/
│   │   │   ├── schema_extractor.py # Schema + sample row extraction
│   │   │   ├── sql_generator.py    # LLM prompt + SQL cleanup
│   │   │   └── sql_runner.py       # Sanitization + execution
│   │   └── db/
│   │       └── database.py         # SQLite connection
│   ├── .env                        # API keys (never commit)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── Header.jsx
    │   │   ├── SchemaPanel.jsx     # Sidebar: upload + schema explorer
    │   │   ├── QueryBox.jsx        # NL input + suggestions + history
    │   │   ├── SQLPreview.jsx      # Generated SQL + syntax highlight
    │   │   ├── ResultTable.jsx     # Sortable table + CSV export
    │   │   └── ChartView.jsx       # Auto chart rendering
    │   └── hooks/
    │       └── useQuery.js         # API calls + state management
    └── package.json
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- Free [Groq API key](https://console.groq.com) — takes 2 minutes

---

## Setup

### 1. Get a Groq API key

Sign up at [console.groq.com](https://console.groq.com) → API Keys → Create API Key. Free, no credit card.

### 2. Configure environment

Create `backend/.env`:
```env
USE_OLLAMA=false
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxx
```

### 3. Install backend

Open a **Command Prompt** terminal in VS Code:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install pandas --only-binary=:all:
pip install fastapi==0.111.0 uvicorn[standard]==0.29.0 python-multipart==0.0.9 sqlalchemy==2.0.30 requests==2.31.0 python-dotenv==1.0.1 aiofiles==23.2.1
```

### 4. Install frontend

Open a second terminal:
```bash
cd frontend
npm install
```

---

## Running

Open two terminals and run one command in each:

```bash
# Terminal 1 — Backend
cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open **http://localhost:5173**

| Service | URL |
|---|---|
| App | http://localhost:5173 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## How to Use

1. **Upload a CSV** — drag and drop onto the left sidebar
2. **Check the schema** — expand the table to see columns and types
3. **Type your question** — e.g. *"Show total revenue by product for top 10"*
4. **Review the SQL** — edit it manually if needed, then re-run
5. **Switch views** — Table / Chart / Both tabs
6. **Export** — download results as CSV anytime

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload CSV file |
| `GET` | `/api/schema` | Get all table schemas |
| `POST` | `/api/query` | Natural language → SQL → result |
| `POST` | `/api/query/raw` | Execute raw SQL directly |
| `DELETE` | `/api/table/{name}` | Delete a table |
| `GET` | `/health` | Health check |

**Example:**
```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Show top 5 products by revenue"}'
```

```json
{
  "question": "Show top 5 products by revenue",
  "sql": "SELECT product, SUM(revenue) FROM sales GROUP BY product ORDER BY SUM(revenue) DESC LIMIT 5;",
  "result": {
    "columns": ["product", "SUM(revenue)"],
    "rows": [["Product A", 45000], ["Product B", 38000]],
    "count": 5
  }
}
```

---

## LLM Configuration

Three inference options — swap by editing `.env`:

| Provider | Speed | Cost | Privacy | Daily Limit |
|---|---|---|---|---|
| **Groq** (default) | ~1–2s | Free | Cloud | 14,400 requests |
| **Ollama** | ~3–8s | Free | 100% local | None |
| **HuggingFace** | ~20–30s | Free | Cloud | Limited |

**To use Ollama locally:**
```bash
# Install from ollama.com, then:
ollama pull sqlcoder
ollama serve
```
Update `.env`:
```env
USE_OLLAMA=true
```

---

## Security

All generated SQL passes through a sanitization layer before execution.

**Blocked:** `DROP` · `DELETE` · `UPDATE` · `INSERT` · `ALTER` · `TRUNCATE` · `CREATE` · `GRANT` · `REVOKE`

Any query containing these returns a `400` error — the database is never touched. Protects against prompt injection attacks where a crafted question attempts to modify or destroy data.

---

## Measuring Accuracy

QueryLens uses **execution accuracy** — whether the generated SQL runs and returns the correct result.

**How to test on your own dataset:**

Create a test file and manually verify results for 20 representative questions:

```json
[
  { "question": "Count total records",          "expected_rows": 1 },
  { "question": "Show top 10 rows",             "expected_rows": 10 },
  { "question": "Average salary by department", "expected_columns": ["department", "AVG(salary)"] }
]
```

```
Accuracy = Correct queries / Total test queries × 100
```

**Benchmark — LLaMA 3.1 8B on typical business CSVs:**

| Query Type | Accuracy |
|---|---|
| Simple SELECT + LIMIT | ~90–95% |
| Aggregations (COUNT, SUM, AVG) | ~80–87% |
| GROUP BY + ORDER BY | ~75–82% |
| Multi-table JOINs | ~60–70% |

**Tip:** Descriptive column names (`total_revenue` vs `col3`) are the single biggest factor in accuracy. Clear schema = better SQL.

---

## License

MIT — free to use, modify, and distribute.

---

*FastAPI · React · SQLite · Groq · LLaMA 3.1*
