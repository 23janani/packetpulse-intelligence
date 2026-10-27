from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.db_models import NetworkMeasurementRecord
from backend.app.schemas.schemas import PublicMeasurementItem, LocalPingRequest
from backend.app.services.ripe_atlas import fetch_public_measurements
from backend.app.services.local_network import run_local_ping_diagnostics

router = APIRouter(prefix="/measurements", tags=["Measurements"])

@router.get("/public", response_model=List[PublicMeasurementItem], summary="Discover public RIPE Atlas ping measurements")
async def list_public_measurements(
    target: Optional[str] = Query(None, description="Optional target IP or hostname filter"),
    page_size: int = Query(10, ge=1, le=50)
):
    """
    Queries official RIPE Atlas API for active public ping measurements.
    """
    return await fetch_public_measurements(target=target, page_size=page_size)

@router.get("/history", summary="List historical measurements from SQLite database")
def list_measurement_history(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Returns verified historical measurements stored in the local SQLite database.
    Retains original source timestamps, probe counts, and loss percentages.
    """
    records = db.query(NetworkMeasurementRecord).order_by(NetworkMeasurementRecord.id.desc()).limit(limit).all()
    results = []
    for r in records:
        results.append({
            "id": r.id,
            "source_type": r.source_type,
            "measurement_id": r.measurement_id,
            "target": r.target,
            "total_sent": r.total_sent,
            "successful_rcvd": r.successful_rcvd,
            "failed_lost": r.failed_lost,
            "loss_percentage": r.loss_percentage,
            "avg_rtt": r.avg_rtt,
            "median_rtt": r.median_rtt,
            "p95_rtt": r.p95_rtt,
            "timestamp_epoch": r.timestamp_epoch,
            "recorded_at": r.recorded_at.isoformat() if r.recorded_at else None,
            "status": r.status
        })
    return results

@router.post("/local", summary="Execute local network diagnostic probe")
def trigger_local_ping(payload: LocalPingRequest):
    """
    Runs a safe bounded local diagnostic ping against the specified target.
    """
    res = run_local_ping_diagnostics(target=payload.target, count=payload.count)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Local ping execution failed."))
    return res
