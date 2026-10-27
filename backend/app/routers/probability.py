from fastapi import APIRouter, Query, HTTPException
from backend.app.schemas.schemas import BinomialCalculationRequest, BinomialCalculationResponse
from backend.app.services.binomial_engine import calculate_binomial_metrics
from backend.app.services.ripe_atlas import fetch_measurement_latest_results

router = APIRouter(prefix="/probability", tags=["Probability Laboratory"])

@router.post("/calculate", response_model=BinomialCalculationResponse, summary="Calculate Binomial distribution metrics")
def calculate_binomial(payload: BinomialCalculationRequest):
    """
    Computes exact Binomial distribution statistics:
    - P(X = x)
    - P(X <= x)
    - P(X >= x)
    - E[X] = np
    - Var(X) = np(1-p)
    - Full PMF distribution, LaTeX formula, substituted numbers, plain-English interpretation.
    """
    return calculate_binomial_metrics(
        n=payload.n,
        p=payload.p,
        x=payload.x,
        threshold=payload.threshold,
        mode=payload.mode
    )

@router.get("/current", response_model=BinomialCalculationResponse, summary="Calculate Binomial metrics using current live measurement loss rate")
async def calculate_using_current_measurement(
    msm_id: int = Query(1001, description="RIPE Atlas Measurement ID"),
    n: int = Query(50, ge=1, le=1000, description="Future batch size to model"),
    x: int = Query(2, ge=0, description="Hypothetical loss count to test"),
    threshold: int = Query(5, ge=0, description="Loss threshold count")
):
    """
    Retrieves the actual live measurement loss rate p̂ and evaluates the Binomial model for batch size n.
    """
    data = await fetch_measurement_latest_results(msm_id=msm_id)
    if not data.get("success"):
        raise HTTPException(status_code=503, detail=data.get("error", "Failed to retrieve measurement."))

    estimated_p = data.get("estimated_p", 0.0)

    return calculate_binomial_metrics(
        n=n,
        p=estimated_p,
        x=x,
        threshold=threshold,
        mode="measured"
    )
