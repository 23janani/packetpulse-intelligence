import os
import sys
import platform
import time
from fastapi import APIRouter
from backend.app.config import settings

router = APIRouter(prefix="/provenance", tags=["Provenance"])

@router.get("", summary="Get data provenance, API schemas, and mathematical foundations")
def get_provenance_info():
    """
    Returns complete transparent provenance documentation:
    - External RIPE Atlas data source details
    - API endpoints & schema definitions
    - Local network diagnostic methodology
    - Mathematical formulation of Binomial modeling
    - Runtime environment information
    """
    return {
        "project": {
            "title": "PacketPulse Intelligence — Live Network Loss Estimation & Probabilistic Anomaly Detection",
            "academic_context": "Packet Loss Estimation in Data Networks Using Binomial Distribution",
            "discipline": "Probability and Statistics for Data Science and Cyber Security Engineers",
            "principle": "REAL DATA FIRST. Zero synthetic fabrication of live metrics."
        },
        "sources": [
            {
                "name": "RIPE Atlas (Primary)",
                "homepage": "https://atlas.ripe.net/",
                "api_docs": "https://atlas.ripe.net/docs/apis/rest-api-manual/",
                "api_reference": "https://atlas.readthedocs.io/",
                "endpoints_used": [
                    "GET /api/v2/measurements/?type=ping&status=Ongoing",
                    "GET /api/v2/measurements/{id}/latest/?format=json",
                    "GET /api/v2/measurements/{id}/results/?start={start}&stop={stop}&format=json"
                ],
                "retrieved_fields": [
                    "msm_id (Measurement ID)",
                    "prb_id (Probe ID)",
                    "dst_name / dst_addr (Target host/IP)",
                    "timestamp (Epoch measurement time)",
                    "sent (Total ICMP echo requests sent)",
                    "rcvd (Total ICMP echo replies received)",
                    "result (Array of probe response RTTs or error objects)",
                    "avg, min, max (Round-trip latency in ms)"
                ],
                "loss_calculation": "lost = sent - rcvd; observed_loss_pct = (lost / sent) * 100%",
                "rate_limits": "Respected via backend in-memory caching and bounded request timeouts.",
                "limitations": "ICMP probe packets may experience rate limiting or lower router queuing priority compared to TCP/UDP payload traffic."
            },
            {
                "name": "Local Network Diagnostics (Secondary)",
                "methodology": "Bounded ICMP echo probe on macOS with socket TCP connect latency fallback.",
                "security": "Target input sanitized with strict hostname/IP regex. Command execution bounded to 3-20 packets with strict timeout.",
                "attribution": "Explicitly labeled as LOCAL_DIAGNOSTIC; never mixed with RIPE Atlas data."
            },
            {
                "name": "Historical Persistence (SQLite)",
                "database_url": settings.DATABASE_URL,
                "schema": "network_measurements, loss_events, statistical_evaluations",
                "retention": "Preserves original epoch timestamps, probe IDs, and calculation metrics without fabrication."
            }
        ],
        "mathematical_foundation": {
            "model": "X ~ Binomial(n, p)",
            "pmf": "P(X = x) = C(n, x) * p^x * (1 - p)^(n - x)",
            "expected_value": "E[X] = n * p",
            "variance": "Var(X) = n * p * (1 - p)",
            "standard_deviation": "σ = sqrt(n * p * (1 - p))",
            "confidence_interval": "Wilson Score Interval for binomial proportion p",
            "independence_test": "Wald-Wolfowitz Runs Test for sequence of binary trials",
            "goodness_of_fit": "Chi-Square Goodness-of-Fit test across probe batches"
        },
        "system_status": {
            "python_version": sys.version.split()[0],
            "platform": platform.platform(),
            "uptime_seconds": round(time.time(), 0),
            "cache_ttl_seconds": settings.CACHE_TTL_SECONDS
        }
    }
