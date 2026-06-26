from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.upload import router as upload_router
from app.routes.query import router as query_router

app = FastAPI(
    title="QueryLens API",
    description="Natural Language to SQL — BI Tool",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        # Replace this with your actual Vercel URL after deploying,
        # e.g. "https://querylens.vercel.app"
        "https://YOUR-PROJECT-NAME.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api", tags=["Upload"])
app.include_router(query_router, prefix="/api", tags=["Query"])


@app.get("/")
async def root():
    return {
        "name": "QueryLens API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
