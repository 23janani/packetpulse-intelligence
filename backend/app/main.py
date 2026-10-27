from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import engine, Base
import backend.app.models.db_models # register models
from backend.app.routers import pulse, probability, fingerprint, validation, measurements, provenance

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create SQLite database tables on startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Live Network Loss Estimation & Probabilistic Anomaly Detection using Binomial Distribution",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local Vite dev server and production frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers under /api/v1
app.include_router(pulse.router, prefix=settings.API_V1_STR)
app.include_router(probability.router, prefix=settings.API_V1_STR)
app.include_router(fingerprint.router, prefix=settings.API_V1_STR)
app.include_router(validation.router, prefix=settings.API_V1_STR)
app.include_router(measurements.router, prefix=settings.API_V1_STR)
app.include_router(provenance.router, prefix=settings.API_V1_STR)

@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "connected",
        "data_integrity": "REAL_DATA_FIRST"
    }

@app.get("/", tags=["Root"])
def root_info():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs",
        "health": "/api/v1/health",
        "pulse": "/api/v1/pulse",
        "provenance": "/api/v1/provenance"
    }
