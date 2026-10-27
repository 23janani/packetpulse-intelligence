import math
from typing import List, Dict, Any, Optional
import numpy as np
from scipy.stats import norm, chi2, binom
from backend.app.schemas.schemas import RunsTestResult, ChiSquareGoFResult

def perform_runs_test(sequence: List[int]) -> RunsTestResult:
    """
    Wald-Wolfowitz Runs Test on a sequential binary sequence (0 = success/reply, 1 = drop/loss).
    Tests the null hypothesis H0: The sequential outcomes are independent Bernoulli trials.
    """
    total_n = len(sequence)
    n_loss = sum(1 for x in sequence if x == 1)
    n_success = total_n - n_loss

    null_hyp = "H0: Packet arrival and drop events are mutually independent (no serial dependence or clustering)."
    alt_hyp = "H1: Packet loss exhibits temporal dependence (clustering/burstiness or alternating structure)."
    limitations = (
        "The Wald-Wolfowitz test assumes sample size is sufficiently large (N0 >= 10, N1 >= 5 for normal approximation). "
        "Failing to reject H0 does NOT prove independence; it only indicates insufficient evidence against it at α=0.05. "
        "ICMP ping pacing can mask microscopic sub-millisecond queuing bursts."
    )

    if total_n < 10 or n_loss == 0 or n_success == 0:
        return RunsTestResult(
            total_n=total_n,
            n_success=n_success,
            n_loss=n_loss,
            observed_runs=1 if total_n > 0 else 0,
            expected_runs=1.0,
            runs_variance=0.0,
            z_statistic=0.0,
            p_value=1.0,
            null_hypothesis=null_hyp,
            alternative_hypothesis=alt_hyp,
            is_conclusive=False,
            verdict="Inconclusive: Sample size is too small or contains exclusively one outcome (0 losses or 100% loss). Cannot assess dependence.",
            limitations=limitations
        )

    # Count observed runs
    runs = 1
    for i in range(1, total_n):
        if sequence[i] != sequence[i - 1]:
            runs += 1

    # Theoretical mean and variance under H0
    n0 = float(n_success)
    n1 = float(n_loss)
    n = float(total_n)

    expected_runs = 1.0 + (2.0 * n0 * n1) / n
    numerator = 2.0 * n0 * n1 * (2.0 * n0 * n1 - n)
    denominator = (n ** 2) * (n - 1.0)
    variance_runs = numerator / denominator if denominator > 0 else 0.0

    if variance_runs <= 1e-9:
        return RunsTestResult(
            total_n=total_n,
            n_success=n_success,
            n_loss=n_loss,
            observed_runs=runs,
            expected_runs=round(expected_runs, 3),
            runs_variance=0.0,
            z_statistic=0.0,
            p_value=1.0,
            null_hypothesis=null_hyp,
            alternative_hypothesis=alt_hyp,
            is_conclusive=False,
            verdict="Inconclusive: Variance of runs under H0 is near zero.",
            limitations=limitations
        )

    std_dev_runs = math.sqrt(variance_runs)

    # Z-statistic with continuity correction
    diff = runs - expected_runs
    if diff > 0:
        z = (diff - 0.5) / std_dev_runs
    elif diff < 0:
        z = (diff + 0.5) / std_dev_runs
    else:
        z = 0.0

    # Two-tailed p-value
    p_val = float(2.0 * (1.0 - norm.cdf(abs(z))))

    # Verdict synthesis
    if n0 < 10 or n1 < 5:
        verdict = (
            f"Observed {runs} runs (Expected: {expected_runs:.2f}, Z = {z:.3f}, p = {p_val:.4f}). "
            "However, sample size is marginally small for normal approximation; interpret cautiously."
        )
        is_conclusive = False
    elif p_val < 0.05:
        if z < 0:
            verdict = (
                f"Statistically significant clustering detected (Z = {z:.3f}, p = {p_val:.4f} < 0.05). "
                f"Observed {runs} runs is fewer than expected {expected_runs:.2f}, indicating packet losses occur in bursts."
            )
        else:
            verdict = (
                f"Statistically significant alternating pattern detected (Z = {z:.3f}, p = {p_val:.4f} < 0.05). "
                f"Observed {runs} runs is greater than expected {expected_runs:.2f}."
            )
        is_conclusive = True
    else:
        verdict = (
            f"Consistent with independence (Z = {z:.3f}, p = {p_val:.4f} >= 0.05). "
            f"Observed {runs} runs is well within the expected random distribution under H0 ({expected_runs:.2f} ± {std_dev_runs:.2f})."
        )
        is_conclusive = True

    return RunsTestResult(
        total_n=total_n,
        n_success=n_success,
        n_loss=n_loss,
        observed_runs=runs,
        expected_runs=round(expected_runs, 3),
        runs_variance=round(variance_runs, 4),
        z_statistic=round(z, 4),
        p_value=round(p_val, 6),
        null_hypothesis=null_hyp,
        alternative_hypothesis=alt_hyp,
        is_conclusive=is_conclusive,
        verdict=verdict,
        limitations=limitations
    )

def perform_chi_square_gof(
    batch_loss_counts: List[int],
    batch_size_n: int,
    estimated_p: float
) -> ChiSquareGoFResult:
    """
    Performs a Chi-Square Goodness-of-Fit test comparing observed batch loss frequencies
    against theoretical Binomial(n, p) expected counts.
    Bins are collapsed when expected frequencies are < 5.
    """
    limitations = (
        "Chi-Square Goodness-of-Fit requires that all batches share identical trial size n, "
        "and that expected frequencies per bin are >= 5. When expected counts are small, "
        "tail categories are pooled together. Degrees of freedom are adjusted for estimated parameter p (df = k - 1 - 1)."
    )

    m_batches = len(batch_loss_counts)
    if m_batches < 15 or batch_size_n <= 0:
        return ChiSquareGoFResult(
            is_applicable=False,
            reason_if_not_applicable=f"Insufficient batch count (observed {m_batches} batches, minimum 15 required for valid Chi-Square test).",
            limitations=limitations
        )

    # Tally observed counts for each possible outcome k in [0, batch_size_n]
    obs_counts: Dict[int, int] = {}
    for c in batch_loss_counts:
        obs_counts[c] = obs_counts.get(c, 0) + 1

    # Theoretical binomial probabilities
    theor_probs = [float(binom.pmf(k, batch_size_n, estimated_p)) for k in range(batch_size_n + 1)]

    # Pool categories into bins such that expected frequency >= 5 where feasible
    bins = []
    current_obs = 0
    current_exp = 0.0
    current_label = []

    for k in range(batch_size_n + 1):
        pk = theor_probs[k]
        exp_k = m_batches * pk
        obs_k = obs_counts.get(k, 0)

        current_obs += obs_k
        current_exp += exp_k
        current_label.append(k)

        if current_exp >= 5.0 or k == batch_size_n:
            if len(current_label) == 1:
                label = f"k={current_label[0]}"
            else:
                label = f"k={current_label[0]}..{current_label[-1]}"
            bins.append({
                "label": label,
                "observed": current_obs,
                "expected": round(current_exp, 3)
            })
            current_obs = 0
            current_exp = 0.0
            current_label = []

    # If the last bin has expected count < 5, merge into previous bin if exists
    if len(bins) > 1 and bins[-1]["expected"] < 5.0:
        last = bins.pop()
        bins[-1]["label"] += f", {last['label']}"
        bins[-1]["observed"] += last["observed"]
        bins[-1]["expected"] = round(bins[-1]["expected"] + last["expected"], 3)

    num_bins = len(bins)
    df = num_bins - 1 - 1 # k bins minus 1 for sum constraint minus 1 for estimated p

    if df < 1 or num_bins < 2:
        return ChiSquareGoFResult(
            is_applicable=False,
            reason_if_not_applicable="Data variance is too concentrated to create >= 2 valid test categories with expected counts >= 5.",
            bins=bins,
            limitations=limitations
        )

    # Compute Chi-square statistic
    chi2_stat = 0.0
    for b in bins:
        obs = b["observed"]
        exp = b["expected"]
        if exp > 0:
            chi2_stat += ((obs - exp) ** 2) / exp

    p_val = float(1.0 - chi2.cdf(chi2_stat, df))

    if p_val < 0.05:
        verdict = (
            f"Reject H0 at α=0.05 (χ² = {chi2_stat:.3f}, df = {df}, p = {p_val:.4f}). "
            "Observed batch loss frequencies deviate significantly from the theoretical Binomial distribution."
        )
    else:
        verdict = (
            f"Fail to reject H0 (χ² = {chi2_stat:.3f}, df = {df}, p = {p_val:.4f} >= 0.05). "
            "Observed batch loss distribution is consistent with Binomial(n, p) assumptions."
        )

    return ChiSquareGoFResult(
        is_applicable=True,
        degrees_of_freedom=df,
        chi2_statistic=round(chi2_stat, 4),
        p_value=round(p_val, 6),
        bins=bins,
        verdict=verdict,
        limitations=limitations
    )

def analyze_loss_fingerprint(
    sequence: List[int],
    rtts: List[Optional[float]]
) -> Dict[str, Any]:
    """
    Computes temporal loss fingerprint:
    - Maximum consecutive loss run length
    - Run length frequency distribution
    - Index of Dispersion (Variance-to-Mean Ratio across temporal sub-windows)
    - Interpretable classification (Low loss, Uniform, Potentially clustered, Insufficient)
    """
    total = len(sequence)
    losses = sum(1 for x in sequence if x == 1)
    loss_rate = losses / total if total > 0 else 0.0

    if total < 10:
        return {
            "total_trials": total,
            "total_losses": losses,
            "loss_rate": round(loss_rate, 4),
            "max_consecutive_losses": 0,
            "consecutive_run_counts": {"1": 0, "2": 0, "3+": 0},
            "burstiness_dispersion_index": 1.0,
            "temporal_classification": "Insufficient evidence",
            "classification_reason": f"Only {total} observations collected; minimum 10 attempts needed for reliable pattern fingerprinting.",
            "data_sufficiency": False,
            "limitations": "Reliable sequential analysis requires sustained probe history."
        }

    # Consecutive loss runs
    max_consecutive = 0
    current_run = 0
    run_counts: Dict[str, int] = {"1": 0, "2": 0, "3+": 0}

    for x in sequence:
        if x == 1:
            current_run += 1
            if current_run > max_consecutive:
                max_consecutive = current_run
        else:
            if current_run > 0:
                if current_run == 1:
                    run_counts["1"] += 1
                elif current_run == 2:
                    run_counts["2"] += 1
                else:
                    run_counts["3+"] += 1
                current_run = 0

    if current_run > 0:
        if current_run == 1:
            run_counts["1"] += 1
        elif current_run == 2:
            run_counts["2"] += 1
        else:
            run_counts["3+"] += 1

    # Index of dispersion across sub-windows of size 5
    window_size = 5
    if total >= window_size * 2:
        sub_windows = [sum(sequence[i:i + window_size]) for i in range(0, total - window_size + 1, window_size)]
        mean_w = float(np.mean(sub_windows))
        var_w = float(np.var(sub_windows, ddof=1)) if len(sub_windows) > 1 else 0.0
        dispersion_index = var_w / mean_w if mean_w > 0.001 else 1.0
    else:
        dispersion_index = 1.0

    # Classification logic
    runs_res = perform_runs_test(sequence)

    if losses == 0 or loss_rate < 0.01:
        classification = "Low observed loss"
        reason = f"Measured loss rate is exceptionally low ({loss_rate * 100:.2f}%); transmission path is highly stable."
    elif max_consecutive >= 3 or (runs_res.is_conclusive and runs_res.z_statistic < -1.96) or dispersion_index > 1.6:
        classification = "Potentially clustered loss"
        reason = (
            f"Failures appear aggregated in time (max run = {max_consecutive} consecutive drops, "
            f"Dispersion Index = {dispersion_index:.2f}, Runs test Z = {runs_res.z_statistic:.2f}). "
            "May suggest network queue overflow, buffer exhaustion, or temporary link flapping."
        )
    elif max_consecutive <= 1 and loss_rate > 0:
        classification = "Uniform / Dispersed loss"
        reason = (
            f"Failures appear as isolated individual events (all failure runs have length 1, "
            f"Dispersion Index = {dispersion_index:.2f}). Consistent with random memoryless packet drop."
        )
    else:
        classification = "Elevated observed loss"
        reason = f"Loss rate is elevated ({loss_rate * 100:.2f}%) with moderate dispersion across attempts."

    return {
        "total_trials": total,
        "total_losses": losses,
        "loss_rate": round(loss_rate, 4),
        "max_consecutive_losses": max_consecutive,
        "consecutive_run_counts": run_counts,
        "burstiness_dispersion_index": round(dispersion_index, 3),
        "temporal_classification": classification,
        "classification_reason": reason,
        "data_sufficiency": True,
        "limitations": "Analysis is based on sequential ping probe samples. Transient sub-second microbursts between pings cannot be observed."
    }
