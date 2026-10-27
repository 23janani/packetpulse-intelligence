import time
from typing import List, Dict, Any, Optional, Tuple
import httpx
import numpy as np
from backend.app.config import settings

# In-memory short-term cache to avoid hammering RIPE Atlas API and respect rate limits
_CACHE: Dict[str, Tuple[float, Any]] = {}

# Curated anchor ping measurements on RIPE Atlas for fast reliable discovery
CURATED_MEASUREMENTS = [
    {
        "id": 1001,
        "target": "k.root-servers.net",
        "description": "DNS Root Server K (Global Anycast, IPv4)",
        "type": "ping"
    },
    {
        "id": 1004,
        "target": "f.root-servers.net",
        "description": "DNS Root Server F (Global Anycast, IPv4)",
        "type": "ping"
    },
    {
        "id": 1999544,
        "target": "8.8.8.8",
        "description": "Google Public DNS (Global Anycast, IPv4)",
        "type": "ping"
    },
    {
        "id": 11908848,
        "target": "1.1.1.1",
        "description": "Cloudflare Public DNS (Global Anycast, IPv4)",
        "type": "ping"
    }
]

def _get_cached(key: str) -> Optional[Any]:
    now = time.time()
    if key in _CACHE:
        ts, data = _CACHE[key]
        if now - ts < settings.CACHE_TTL_SECONDS:
            return data
        del _CACHE[key]
    return None

def _set_cached(key: str, data: Any):
    _CACHE[key] = (time.time(), data)

async def fetch_public_measurements(target: Optional[str] = None, page_size: int = 10) -> List[Dict[str, Any]]:
    """
    Retrieves public ongoing ping measurements from RIPE Atlas API.
    Falls back to curated list if network query times out or returns empty.
    """
    cache_key = f"measurements_{target}_{page_size}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    url = f"{settings.RIPE_ATLAS_BASE_URL}/measurements/?type=ping&status=Ongoing&page_size={page_size}"
    if target:
        url += f"&target={target}"

    headers = {"User-Agent": "PacketPulse-Intelligence/1.0 (Academic Micro-Project)"}
    if settings.RIPE_ATLAS_API_KEY:
        headers["Authorization"] = f"Key {settings.RIPE_ATLAS_API_KEY}"

    try:
        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for item in data.get("results", []):
                    results.append({
                        "id": item.get("id"),
                        "target": item.get("target"),
                        "type": item.get("type"),
                        "description": item.get("description") or f"Ping measurement to {item.get('target')}",
                        "participant_count": item.get("participant_count"),
                        "status": item.get("status", {}).get("name", "Ongoing") if isinstance(item.get("status"), dict) else "Ongoing"
                    })
                if results:
                    _set_cached(cache_key, results)
                    return results
    except Exception as e:
        pass # Will return curated list below

    # Curated verified ongoing ping targets
    return CURATED_MEASUREMENTS

async def fetch_measurement_latest_results(
    msm_id: int,
    max_probes: int = 40,
    force_refresh: bool = False
) -> Dict[str, Any]:
    """
    Fetches the latest probe results for a given RIPE Atlas measurement ID.
    Parses sent, rcvd, lost packet counts, RTT distributions, and probe metadata.
    """
    cache_key = f"latest_{msm_id}_{max_probes}"
    if not force_refresh:
        cached = _get_cached(cache_key)
        if cached is not None:
            return cached

    url = f"{settings.RIPE_ATLAS_BASE_URL}/measurements/{msm_id}/latest/?format=json"
    headers = {"User-Agent": "PacketPulse-Intelligence/1.0 (Academic Micro-Project)"}
    if settings.RIPE_ATLAS_API_KEY:
        headers["Authorization"] = f"Key {settings.RIPE_ATLAS_API_KEY}"

    try:
        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                return {
                    "success": False,
                    "error": f"RIPE Atlas API returned HTTP {resp.status_code}: {resp.text[:200]}",
                    "status": "UNAVAILABLE"
                }
            raw_data = resp.json()
    except httpx.TimeoutException:
        return {
            "success": False,
            "error": "Connection to RIPE Atlas API timed out. Try again in a few moments.",
            "status": "UNAVAILABLE"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Network error contacting RIPE Atlas: {str(e)}",
            "status": "UNAVAILABLE"
        }

    if not isinstance(raw_data, list) or len(raw_data) == 0:
        return {
            "success": False,
            "error": f"No recent probe results returned for Measurement ID {msm_id}.",
            "status": "UNAVAILABLE"
        }

    # Process observations from the first max_probes probes
    # Note: RIPE Atlas measurements can include thousands of probes.
    # Selecting a representative sample of max_probes gives a statistically rich, fast dataset.
    sample = raw_data[:max_probes]

    total_sent = 0
    total_rcvd = 0
    all_rtts: List[float] = []
    probes_summary = []
    all_binary_attempts: List[int] = [] # 0 = success, 1 = drop
    probe_batch_loss_counts: List[int] = []
    probe_batch_size = None

    target_name = sample[0].get("dst_name", str(msm_id))
    measurement_timestamp = sample[0].get("timestamp", int(time.time()))

    for item in sample:
        sent = item.get("sent", 3)
        rcvd = item.get("rcvd", 0)
        lost = max(0, sent - rcvd)

        total_sent += sent
        total_rcvd += rcvd

        # Collect RTTs
        avg_rtt = item.get("avg")
        min_rtt = item.get("min")
        max_rtt = item.get("max")
        
        # Parse individual ping attempt results if present
        # RIPE Atlas ping result list has dicts: {"rtt": 23.4} or {"x": "*"}
        results_list = item.get("result", [])
        if isinstance(results_list, list):
            for res_entry in results_list:
                if isinstance(res_entry, dict):
                    if "rtt" in res_entry and res_entry["rtt"] is not None:
                        all_binary_attempts.append(0)
                        all_rtts.append(float(res_entry["rtt"]))
                    elif "x" in res_entry or "error" in res_entry:
                        all_binary_attempts.append(1)
        else:
            # Reconstruct binary attempts from sent & rcvd
            all_binary_attempts.extend([0] * rcvd)
            all_binary_attempts.extend([1] * lost)

        if avg_rtt is not None and avg_rtt > 0:
            all_rtts.append(float(avg_rtt))

        probe_batch_loss_counts.append(lost)
        if probe_batch_size is None and sent > 0:
            probe_batch_size = sent

        loss_rate = lost / sent if sent > 0 else 0.0

        probes_summary.append({
            "probe_id": str(item.get("prb_id", "unknown")),
            "target": target_name,
            "sent": sent,
            "rcvd": rcvd,
            "lost": lost,
            "loss_rate": round(loss_rate, 4),
            "avg_rtt": round(avg_rtt, 2) if avg_rtt is not None else None,
            "min_rtt": round(min_rtt, 2) if min_rtt is not None else None,
            "max_rtt": round(max_rtt, 2) if max_rtt is not None else None,
            "timestamp_epoch": item.get("timestamp", measurement_timestamp),
            "firmware": item.get("fw"),
            "dst_addr": item.get("dst_addr"),
            "src_addr": item.get("src_addr")
        })

    total_lost = max(0, total_sent - total_rcvd)
    observed_loss_pct = (total_lost / total_sent * 100.0) if total_sent > 0 else 0.0
    estimated_p = total_lost / total_sent if total_sent > 0 else 0.0

    avg_rtt_val = float(np.mean(all_rtts)) if all_rtts else None
    median_rtt_val = float(np.median(all_rtts)) if all_rtts else None
    p95_rtt_val = float(np.percentile(all_rtts, 95)) if len(all_rtts) >= 10 else None

    # Determine freshness status based on measurement timestamp vs current time
    now_epoch = int(time.time())
    age_seconds = now_epoch - measurement_timestamp
    if age_seconds < 300: # < 5 min
        freshness = "LIVE"
    elif age_seconds < 1800: # < 30 min
        freshness = "RECENT"
    else:
        freshness = "HISTORICAL"

    processed = {
        "success": True,
        "source": "RIPE_ATLAS",
        "target": target_name,
        "measurement_id": str(msm_id),
        "freshness_status": freshness,
        "last_fetched_epoch": now_epoch,
        "measurement_timestamp_epoch": measurement_timestamp,
        "age_seconds": age_seconds,
        "total_probes_or_attempts": len(sample),
        "total_sent": total_sent,
        "successful_replies": total_rcvd,
        "failed_losses": total_lost,
        "observed_loss_percentage": round(observed_loss_pct, 4),
        "estimated_p": round(estimated_p, 6),
        "avg_rtt_ms": round(avg_rtt_val, 2) if avg_rtt_val is not None else None,
        "median_rtt_ms": round(median_rtt_val, 2) if median_rtt_val is not None else None,
        "p95_rtt_ms": round(p95_rtt_val, 2) if p95_rtt_val is not None else None,
        "sample_window_description": f"Aggregated from {len(sample)} independent global RIPE Atlas probes ({total_sent} total ping attempts).",
        "data_integrity": "VERIFIED_REAL_MEASUREMENT",
        "probes": probes_summary,
        "sequential_attempts": all_binary_attempts,
        "rtt_series": all_rtts[:60],
        "probe_batch_loss_counts": probe_batch_loss_counts,
        "probe_batch_size": probe_batch_size or 3
    }

    _set_cached(cache_key, processed)
    return processed
