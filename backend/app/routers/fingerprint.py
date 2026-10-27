from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from backend.app.schemas.schemas import LossFingerprintResponse
from backend.app.services.ripe_atlas import fetch_measurement_latest_results
from backend.app.services.local_network import run_local_ping_diagnostics
from backend.app.services.statistical_validation import analyze_loss_fingerprint

router = APIRouter(prefix="/fingerprint", tags=["Loss Fingerprint"])

@router.get("", response_model=LossFingerprintResponse, summary="Analyze temporal loss pattern and clustering fingerprint")
async def get_loss_fingerprint(
    source: str = Query("RIPE_ATLAS", pattern="^(RIPE_ATLAS|LOCAL_DIAGNOSTIC)$"),
    msm_id: Optional[int] = Query(1001, description="RIPE Atlas Measurement ID"),
    target: Optional[str] = Query("1.1.1.1", description="Local ping target"),
    force_refresh: bool = Query(False, description="Bypass cache for live data")
):
    """
    Computes the Loss Fingerprint:
    - Analyzes sequential ping outcomes (replies vs drops)
    - Consecutive loss runs and duration
    - Burstiness Dispersion Index (Variance-to-Mean ratio across sub-windows)
    - Interpretable classification: Low loss, Uniform/Dispersed, Potentially clustered, Insufficient evidence.
    """
    if source == "RIPE_ATLAS":
        data = await fetch_measurement_latest_results(msm_id=msm_id or 1001, force_refresh=force_refresh)
        if not data.get("success"):
            raise HTTPException(status_code=503, detail=data.get("error", "RIPE Atlas data unavailable."))
    else:
        data = run_local_ping_diagnostics(target=target or "1.1.1.1", count=15)
        if not data.get("success"):
            raise HTTPException(status_code=400, detail=data.get("error", "Local diagnostics failed."))

    sequence = data.get("sequential_attempts", [])
    rtts = data.get("rtt_series", [])

    fp_analysis = analyze_loss_fingerprint(sequence=sequence, rtts=rtts)

    return LossFingerprintResponse(
        source=data["source"],
        measurement_id=str(data.get("measurement_id")),
        target=data["target"],
        total_trials=fp_analysis["total_trials"],
        total_losses=fp_analysis["total_losses"],
        loss_rate=fp_analysis["loss_rate"],
        sequential_attempts=sequence[:100],
        rtt_series=rtts[:100],
        max_consecutive_losses=fp_analysis["max_consecutive_losses"],
        consecutive_run_counts=fp_analysis["consecutive_run_counts"],
        burstiness_dispersion_index=fp_analysis["burstiness_dispersion_index"],
        temporal_classification=fp_analysis["temporal_classification"],
        classification_reason=fp_analysis["classification_reason"],
        data_sufficiency=fp_analysis["data_sufficiency"],
        limitations=fp_analysis["limitations"]
    )
