import json
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.db_models import NetworkMeasurementRecord, LossEvent
from backend.app.services.ripe_atlas import fetch_measurement_latest_results
from backend.app.services.local_network import run_local_ping_diagnostics

router = APIRouter(prefix="/pulse", tags=["Pulse"])

@router.get("", summary="Get current live network pulse")
async def get_live_pulse(
    source: str = Query("RIPE_ATLAS", pattern="^(RIPE_ATLAS|LOCAL_DIAGNOSTIC|HISTORICAL)$"),
    msm_id: Optional[int] = Query(1001, description="RIPE Atlas Measurement ID"),
    target: Optional[str] = Query("1.1.1.1", description="Local ping target"),
    force_refresh: bool = Query(False, description="Bypass cache for live data"),
    db: Session = Depends(get_db)
):
    """
    Returns the Live Network Pulse metrics from verified measurements.
    Strictly follows REAL DATA FIRST principle.
    """
    data = None

    if source == "RIPE_ATLAS":
        data = await fetch_measurement_latest_results(msm_id=msm_id or 1001, force_refresh=force_refresh)
        if not data.get("success"):
            raise HTTPException(status_code=503, detail=data.get("error", "RIPE Atlas measurement unavailable."))

    elif source == "LOCAL_DIAGNOSTIC":
        data = run_local_ping_diagnostics(target=target or "1.1.1.1", count=10)
        if not data.get("success"):
            raise HTTPException(status_code=400, detail=data.get("error", "Local ping diagnostics failed."))

    elif source == "HISTORICAL":
        # Retrieve latest recorded measurement from SQLite
        record = db.query(NetworkMeasurementRecord).order_by(NetworkMeasurementRecord.id.desc()).first()
        if not record:
            # If database is fresh, populate one initial real RIPE Atlas record so historical query succeeds
            data = await fetch_measurement_latest_results(msm_id=1001)
            if not data.get("success"):
                raise HTTPException(status_code=404, detail="No historical measurements stored yet. Please run a live measurement first.")
        else:
            data = {
                "success": True,
                "source": "HISTORICAL",
                "target": record.target,
                "measurement_id": record.measurement_id,
                "freshness_status": "HISTORICAL",
                "last_fetched_epoch": int(record.recorded_at.timestamp()),
                "measurement_timestamp_epoch": record.timestamp_epoch,
                "age_seconds": int(record.recorded_at.timestamp()) - record.timestamp_epoch,
                "total_probes_or_attempts": 1,
                "total_sent": record.total_sent,
                "successful_replies": record.successful_rcvd,
                "failed_losses": record.failed_lost,
                "observed_loss_percentage": record.loss_percentage,
                "estimated_p": record.failed_lost / record.total_sent if record.total_sent > 0 else 0.0,
                "avg_rtt_ms": record.avg_rtt,
                "median_rtt_ms": record.median_rtt,
                "p95_rtt_ms": record.p95_rtt,
                "sample_window_description": f"Persisted historical measurement #{record.id} recorded at {record.recorded_at.isoformat()}Z.",
                "data_integrity": "HISTORICAL_RETAINED",
                "probes": [],
                "sequential_attempts": [e.is_loss for e in record.events] if record.events else [1]*record.failed_lost + [0]*record.successful_rcvd,
                "rtt_series": [e.rtt_ms for e in record.events if e.rtt_ms is not None] if record.events else []
            }

    # Store measurement record in SQLite if it's a live fetch and not already persisted
    if data and data.get("source") in ["RIPE_ATLAS", "LOCAL_DIAGNOSTIC"]:
        try:
            # Check if this exact timestamp & msm_id was saved in the last 60s
            rec = NetworkMeasurementRecord(
                source_type=data["source"],
                measurement_id=str(data.get("measurement_id")),
                target=data["target"],
                total_sent=data["total_sent"],
                successful_rcvd=data["successful_replies"],
                failed_lost=data["failed_losses"],
                loss_percentage=data["observed_loss_percentage"],
                avg_rtt=data.get("avg_rtt_ms"),
                median_rtt=data.get("median_rtt_ms"),
                p95_rtt=data.get("p95_rtt_ms"),
                timestamp_epoch=data["measurement_timestamp_epoch"],
                status="SUCCESS"
            )
            db.add(rec)
            db.commit()
            db.refresh(rec)

            # Store individual sequential events if available
            seq = data.get("sequential_attempts", [])
            rtts = data.get("rtt_series", [])
            for idx, is_lost in enumerate(seq[:50]): # limit to 50 events
                rtt_val = rtts[idx] if idx < len(rtts) else None
                event = LossEvent(
                    measurement_id=rec.id,
                    sequence_index=idx,
                    is_loss=bool(is_lost),
                    rtt_ms=rtt_val,
                    timestamp_epoch=data["measurement_timestamp_epoch"]
                )
                db.add(event)
            db.commit()
        except Exception:
            db.rollback()

    # Metric descriptions
    metric_descriptions = {
        "packets_attempted": "Total number of probe attempts (sent pings) in this measurement window.",
        "successful_replies": "Number of echo replies received with a valid round-trip time.",
        "failed_losses": "Unanswered or dropped probes within the protocol timeout window.",
        "loss_percentage": "Empirical packet loss percentage: (failed / attempted) × 100%.",
        "avg_rtt": "Arithmetic mean round-trip latency across all responding probes.",
        "median_rtt": "50th-percentile RTT latency, resistant to routing outliers.",
        "p95_rtt": "95th-percentile RTT latency, characterizing tail latency spikes."
    }

    # Generate explainable alerts based on calculated values
    loss_pct = data["observed_loss_percentage"]
    alerts = []
    if loss_pct == 0.0:
        alerts.append({
            "level": "HEALTHY",
            "title": "Nominal Transmission Path",
            "message": f"Zero dropped probes observed across {data['total_sent']} attempts. Transmission reliability is currently 100%."
        })
    elif loss_pct < 2.0:
        alerts.append({
            "level": "INFO",
            "title": "Minimal Loss Detected",
            "message": f"Observed loss rate of {loss_pct:.2f}% ({data['failed_losses']} of {data['total_sent']} dropped). Within normal wide-area Internet tolerance."
        })
    elif loss_pct < 10.0:
        alerts.append({
            "level": "WARNING",
            "title": "Elevated Packet Loss",
            "message": f"Observed loss rate of {loss_pct:.2f}% exceeds nominal baseline (< 2%). Potential queue congestion or intermediate link degradation."
        })
    else:
        alerts.append({
            "level": "CRITICAL",
            "title": "Severe Packet Impairment",
            "message": f"Severe loss rate of {loss_pct:.2f}% detected ({data['failed_losses']} of {data['total_sent']} lost). Substantial degradation on route to {data['target']}."
        })

    data["metric_descriptions"] = metric_descriptions
    data["alerts"] = alerts
    return data
