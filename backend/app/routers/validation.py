from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException
from scipy.stats import binom
from backend.app.schemas.schemas import ModelValidationResponse
from backend.app.services.ripe_atlas import fetch_measurement_latest_results
from backend.app.services.local_network import run_local_ping_diagnostics
from backend.app.services.binomial_engine import calculate_wilson_score_interval
from backend.app.services.statistical_validation import perform_runs_test, perform_chi_square_gof

router = APIRouter(prefix="/validation", tags=["Model Validation"])

@router.get("", response_model=ModelValidationResponse, summary="Validate Binomial model assumptions against real observations")
async def get_model_validation(
    source: str = Query("RIPE_ATLAS", pattern="^(RIPE_ATLAS|LOCAL_DIAGNOSTIC)$"),
    msm_id: Optional[int] = Query(1001, description="RIPE Atlas Measurement ID"),
    target: Optional[str] = Query("1.1.1.1", description="Local ping target"),
    force_refresh: bool = Query(False, description="Bypass cache for live data")
):
    """
    Evaluates the statistical validity of the Binomial model against real observations:
    - Observed vs Model-Expected loss comparison
    - Upper tail probability P(X >= observed)
    - Wilson Score 95% Confidence Interval
    - Wald-Wolfowitz Runs Test for sequential independence
    - Chi-Square Goodness-of-Fit Test across batches (when data structure permits)
    - Explainable insights grounded in the calculations.
    """
    if source == "RIPE_ATLAS":
        data = await fetch_measurement_latest_results(msm_id=msm_id or 1001, force_refresh=force_refresh)
        if not data.get("success"):
            raise HTTPException(status_code=503, detail=data.get("error", "RIPE Atlas data unavailable."))
    else:
        data = run_local_ping_diagnostics(target=target or "1.1.1.1", count=15)
        if not data.get("success"):
            raise HTTPException(status_code=400, detail=data.get("error", "Local diagnostics failed."))

    batch_n = data["total_sent"]
    observed_losses = data["failed_losses"]
    estimated_p = data["estimated_p"]
    expected_losses = round(batch_n * estimated_p, 2)
    difference = round(observed_losses - expected_losses, 2)

    # Upper tail probability P(X >= observed_losses) under Binomial(batch_n, estimated_p)
    if batch_n > 0 and 0.0 < estimated_p < 1.0:
        tail_prob = float(binom.sf(max(0, observed_losses - 1), batch_n, estimated_p))
    elif observed_losses == 0:
        tail_prob = 1.0
    else:
        tail_prob = 0.0

    # Wilson Score Confidence Interval
    wilson_ci = calculate_wilson_score_interval(
        successes=observed_losses,
        total=batch_n,
        confidence=0.95
    )

    # Wald-Wolfowitz Runs Test on sequential attempts
    seq = data.get("sequential_attempts", [])
    runs_result = perform_runs_test(seq) if seq else None

    # Chi-Square Goodness-of-Fit test across probe batches
    probe_batch_loss_counts = data.get("probe_batch_loss_counts", [])
    probe_batch_size = data.get("probe_batch_size", 3)
    chi2_result = perform_chi_square_gof(
        batch_loss_counts=probe_batch_loss_counts,
        batch_size_n=probe_batch_size,
        estimated_p=estimated_p
    )

    # Binomial assumptions evaluation
    assumptions_check = [
        {
            "assumption": "Binary Outcomes (Success / Failure)",
            "status": "SATISFIED",
            "detail": "Every probe attempt strictly yields an echo reply with RTT (success = 0) or times out / is dropped (loss = 1)."
        },
        {
            "assumption": "Fixed Number of Trials (n)",
            "status": "SATISFIED",
            "detail": f"Observation window is bounded at exactly n = {batch_n} attempted probes."
        },
        {
            "assumption": "Constant Loss Probability (p)",
            "status": "PARTIALLY_VALID" if estimated_p > 0.05 else "REASONABLE",
            "detail": "Assumes stationary network conditions over the observation window. Route flapping or dynamic load balancing can alter p over time."
        },
        {
            "assumption": "Trial Independence (Bernoulli)",
            "status": "INCONCLUSIVE" if not runs_result or not runs_result.is_conclusive else ("SATISFIED" if runs_result.p_value >= 0.05 else "VIOLATED"),
            "detail": runs_result.verdict if runs_result else "Insufficient sequential resolution to evaluate trial independence."
        }
    ]

    # Explainable insights
    insights = []
    if observed_losses == 0:
        insights.append(f"Zero packet losses observed in {batch_n} trials; estimated loss probability p̂ = 0.00%.")
    else:
        insights.append(
            f"Observed {observed_losses} packet losses across {batch_n} attempts (p̂ = {estimated_p * 100:.2f}%). "
            f"Expected loss count under model is E[X] = {expected_losses:.2f}."
        )

    insights.append(
        f"Wilson 95% Confidence Interval for true packet loss rate is [{wilson_ci.ci_lower * 100:.2f}%, {wilson_ci.ci_upper * 100:.2f}%]."
    )

    if runs_result and runs_result.is_conclusive:
        if runs_result.p_value < 0.05 and runs_result.z_statistic < 0:
            insights.append("Runs test detects statistically significant packet clustering; independent Bernoulli assumption may underestimate burst duration.")
        else:
            insights.append("Runs test does not reject independence (p >= 0.05); binomial memoryless assumption remains viable.")
    else:
        insights.append("Sequential runs test is inconclusive due to limited loss events; further monitoring recommended.")

    if chi2_result.is_applicable:
        insights.append(f"Chi-square goodness-of-fit test across {len(probe_batch_loss_counts)} probe batches: {chi2_result.verdict}")

    return ModelValidationResponse(
        source=data["source"],
        measurement_id=str(data.get("measurement_id")),
        batch_n=batch_n,
        estimated_p=round(estimated_p, 6),
        observed_losses=observed_losses,
        expected_losses=expected_losses,
        difference=difference,
        tail_prob_of_observed_or_worse=round(tail_prob, 6),
        wilson_ci=wilson_ci,
        runs_test=runs_result,
        chi_square_gof=chi2_result,
        binomial_assumptions_check=assumptions_check,
        explainable_insights=insights
    )
