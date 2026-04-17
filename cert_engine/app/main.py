from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import engine, Base
from app.models.schema import GenerationLog
from app.api.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Executes on application startup to ensure database tables exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield



app = FastAPI(
    title="Operational Framework: Document Engine",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router, prefix="/api/v1")
@app.get("/")
async def root():
    return {"message": "System Online. Navigate to /docs to execute endpoints."}