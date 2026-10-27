import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "PacketPulse Intelligence"
    API_V1_STR: str = "/api/v1"
    RIPE_ATLAS_BASE_URL: str = os.getenv("RIPE_ATLAS_BASE_URL", "https://atlas.ripe.net/api/v2")
    RIPE_ATLAS_API_KEY: str = os.getenv("RIPE_ATLAS_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./backend/data/packetpulse.db")
    DEFAULT_REFRESH_SECONDS: int = int(os.getenv("DEFAULT_REFRESH_SECONDS", "10"))
    REQUEST_TIMEOUT_SECONDS: float = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "12.0"))
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "10"))

settings = Settings()
