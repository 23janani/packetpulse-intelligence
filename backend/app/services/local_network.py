import re
import time
import socket
import subprocess
from typing import List, Dict, Any, Optional
import numpy as np

# Strict regex to prevent command injection
HOSTNAME_REGEX = re.compile(r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3}$")

def validate_target(target: str) -> bool:
    target = target.strip()
    if target == "localhost" or target == "127.0.0.1":
        return True
    return bool(HOSTNAME_REGEX.match(target))

def run_local_ping_diagnostics(
    target: str = "1.1.1.1",
    count: int = 10
) -> Dict[str, Any]:
    """
    Executes a bounded, safe network measurement from the local machine.
    Uses native ICMP ping on macOS. If raw ICMP times out or is blocked by network policy,
    falls back to TCP socket latency probes on port 443/53.
    Returns individual sequential attempts (0 = reply, 1 = drop) and RTT values.
    """
    target = target.strip()
    if not validate_target(target):
        return {
            "success": False,
            "error": "Invalid hostname or IP address format. Special characters and commands are disallowed.",
            "status": "UNAVAILABLE"
        }

    count = max(3, min(20, int(count))) # bounded between 3 and 20 packets
    now_epoch = int(time.time())

    # Strategy 1: Attempt standard macOS ping (bounded with count)
    try:
        # ping -c {count} -W 1500 {target}
        cmd = ["ping", "-c", str(count), "-W", "1500", target]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=count * 2)

        if proc.returncode == 0 or proc.stdout:
            # Parse macOS ping output
            # Lines like: "64 bytes from 1.1.1.1: icmp_seq=0 ttl=64 time=14.234 ms"
            # Or "Request timeout for icmp_seq 0"
            lines = proc.stdout.splitlines()
            seq_results: List[int] = []
            rtts: List[float] = []

            for line in lines:
                if "icmp_seq=" in line:
                    if "time=" in line:
                        m = re.search(r"time=([0-9.]+)\s*ms", line)
                        if m:
                            rtts.append(float(m.group(1)))
                            seq_results.append(0) # reply
                    elif "Request timeout" in line:
                        seq_results.append(1) # drop

            # Also parse summary line: "10 packets transmitted, 9 packets received, 10.0% packet loss"
            summary_match = re.search(r"(\d+)\s+packets transmitted,\s+(\d+)\s+packets received", proc.stdout)
            if summary_match:
                transmitted = int(summary_match.group(1))
                received = int(summary_match.group(2))
                lost = max(0, transmitted - received)

                # Ensure seq_results aligns with transmitted
                while len(seq_results) < transmitted:
                    seq_results.append(1 if len(seq_results) >= received else 0)

                loss_pct = (lost / transmitted * 100.0) if transmitted > 0 else 0.0
                estimated_p = lost / transmitted if transmitted > 0 else 0.0

                avg_rtt = float(np.mean(rtts)) if rtts else None
                med_rtt = float(np.median(rtts)) if rtts else None
                p95_rtt = float(np.percentile(rtts, 95)) if len(rtts) >= 5 else None

                return {
                    "success": True,
                    "source": "LOCAL_DIAGNOSTIC",
                    "target": target,
                    "measurement_id": f"local_{now_epoch}",
                    "freshness_status": "LIVE",
                    "last_fetched_epoch": now_epoch,
                    "measurement_timestamp_epoch": now_epoch,
                    "age_seconds": 0,
                    "total_probes_or_attempts": 1,
                    "total_sent": transmitted,
                    "successful_replies": received,
                    "failed_losses": lost,
                    "observed_loss_percentage": round(loss_pct, 4),
                    "estimated_p": round(estimated_p, 6),
                    "avg_rtt_ms": round(avg_rtt, 2) if avg_rtt else None,
                    "median_rtt_ms": round(med_rtt, 2) if med_rtt else None,
                    "p95_rtt_ms": round(p95_rtt, 2) if p95_rtt else None,
                    "sample_window_description": f"Local ICMP diagnostic probe to {target} ({transmitted} attempts).",
                    "data_integrity": "VERIFIED_REAL_MEASUREMENT",
                    "sequential_attempts": seq_results,
                    "rtt_series": rtts,
                    "probe_batch_loss_counts": [lost],
                    "probe_batch_size": transmitted,
                    "probes": [{
                        "probe_id": "localhost",
                        "target": target,
                        "sent": transmitted,
                        "rcvd": received,
                        "lost": lost,
                        "loss_rate": round(estimated_p, 4),
                        "avg_rtt": round(avg_rtt, 2) if avg_rtt else None,
                        "min_rtt": round(min(rtts), 2) if rtts else None,
                        "max_rtt": round(max(rtts), 2) if rtts else None,
                        "timestamp_epoch": now_epoch,
                        "dst_addr": target
                    }]
                }
    except Exception:
        pass # Fallback to socket probe below

    # Strategy 2: Bounded TCP SYN/Connect latency probes (useful when ICMP is blocked by ISP/router)
    seq_results = []
    rtts = []
    ports = [443, 80, 53] # standard endpoints
    port = 443

    for seq in range(count):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1.5)
        t_start = time.perf_counter()
        try:
            s.connect((target, port))
            t_rtt = (time.perf_counter() - t_start) * 1000.0
            rtts.append(round(t_rtt, 2))
            seq_results.append(0)
            s.close()
        except socket.timeout:
            seq_results.append(1)
        except Exception:
            seq_results.append(1)
        time.sleep(0.05)

    transmitted = count
    received = sum(1 for x in seq_results if x == 0)
    lost = transmitted - received
    loss_pct = (lost / transmitted * 100.0) if transmitted > 0 else 0.0
    estimated_p = lost / transmitted if transmitted > 0 else 0.0

    avg_rtt = float(np.mean(rtts)) if rtts else None
    med_rtt = float(np.median(rtts)) if rtts else None
    p95_rtt = float(np.percentile(rtts, 95)) if len(rtts) >= 5 else None

    return {
        "success": True,
        "source": "LOCAL_DIAGNOSTIC",
        "target": target,
        "measurement_id": f"local_tcp_{now_epoch}",
        "freshness_status": "LIVE",
        "last_fetched_epoch": now_epoch,
        "measurement_timestamp_epoch": now_epoch,
        "age_seconds": 0,
        "total_probes_or_attempts": 1,
        "total_sent": transmitted,
        "successful_replies": received,
        "failed_losses": lost,
        "observed_loss_percentage": round(loss_pct, 4),
        "estimated_p": round(estimated_p, 6),
        "avg_rtt_ms": round(avg_rtt, 2) if avg_rtt else None,
        "median_rtt_ms": round(med_rtt, 2) if med_rtt else None,
        "p95_rtt_ms": round(p95_rtt, 2) if p95_rtt else None,
        "sample_window_description": f"Local TCP latency diagnostics to {target}:{port} ({transmitted} attempts).",
        "data_integrity": "VERIFIED_REAL_MEASUREMENT",
        "sequential_attempts": seq_results,
        "rtt_series": rtts,
        "probe_batch_loss_counts": [lost],
        "probe_batch_size": transmitted,
        "probes": [{
            "probe_id": "localhost_tcp",
            "target": target,
            "sent": transmitted,
            "rcvd": received,
            "lost": lost,
            "loss_rate": round(estimated_p, 4),
            "avg_rtt": round(avg_rtt, 2) if avg_rtt else None,
            "min_rtt": round(min(rtts), 2) if rtts else None,
            "max_rtt": round(max(rtts), 2) if rtts else None,
            "timestamp_epoch": now_epoch,
            "dst_addr": target
        }]
    }
