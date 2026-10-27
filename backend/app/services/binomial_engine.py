import math
from typing import List, Dict, Any, Tuple
import numpy as np
from scipy.stats import binom, norm
from backend.app.schemas.schemas import BinomialCalculationResponse, PMFPoint, ConfidenceIntervalInfo

def calculate_binomial_metrics(
    n: int,
    p: float,
    x: int,
    threshold: int = 5,
    mode: str = "measured"
) -> BinomialCalculationResponse:
    """
    Computes exact Binomial distribution statistics, PMF, CDF, upper tail,
    and returns formulas with substituted values and plain-English interpretations.
    Handles all boundary conditions: p=0, p=1, n=0, x > n.
    """
    # Guard against invalid inputs
    n = max(0, int(n))
    p = max(0.0, min(1.0, float(p)))
    x = max(0, int(x))
    threshold = max(0, int(threshold))

    if n == 0:
        return BinomialCalculationResponse(
            n=0, p=p, x=x, threshold=threshold, mode=mode,
            prob_exact_x=1.0 if x == 0 else 0.0,
            prob_at_most_x=1.0,
            prob_at_least_x=1.0 if x == 0 else 0.0,
            prob_zero_losses=1.0,
            prob_exceeding_threshold=0.0,
            expected_losses=0.0, variance=0.0, std_dev=0.0,
            formula_latex="P(X=x) = \\binom{n}{x} p^x (1-p)^{n-x}",
            substituted_formula="n=0 trials. Distribution is degenerate at 0.",
            plain_english_explanation="With 0 attempts, zero losses occur with certainty.",
            pmf_distribution=[PMFPoint(k=0, probability=1.0, cumulative_prob=1.0, upper_tail_prob=1.0)]
        )

    # Expected value, variance, standard deviation
    expected = float(n * p)
    variance = float(n * p * (1.0 - p))
    std_dev = float(math.sqrt(variance))

    # Boundary cases for p
    if p == 0.0:
        prob_exact_x = 1.0 if x == 0 else 0.0
        prob_at_most_x = 1.0
        prob_at_least_x = 1.0 if x == 0 else 0.0
        prob_zero_losses = 1.0
        prob_exceeding_threshold = 0.0
    elif p == 1.0:
        prob_exact_x = 1.0 if x == n else 0.0
        prob_at_most_x = 1.0 if x >= n else 0.0
        prob_at_least_x = 1.0
        prob_zero_losses = 0.0
        prob_exceeding_threshold = 1.0 if threshold < n else 0.0
    else:
        # Standard calculation via scipy.stats.binom
        if x > n:
            prob_exact_x = 0.0
            prob_at_most_x = 1.0
            prob_at_least_x = 0.0
        else:
            prob_exact_x = float(binom.pmf(x, n, p))
            prob_at_most_x = float(binom.cdf(x, n, p))
            prob_at_least_x = float(binom.sf(x - 1, n, p)) # Survival function: P(X >= x)

        prob_zero_losses = float(binom.pmf(0, n, p))
        prob_exceeding_threshold = float(binom.sf(threshold, n, p)) # P(X > threshold)

    # Generate PMF distribution curve
    # For large n, display an informative window around the mean or up to 60 points
    max_display_k = min(n, max(threshold + 5, int(math.ceil(expected + 4 * max(1.0, std_dev))), 20))
    pmf_points: List[PMFPoint] = []
    
    running_cdf = 0.0
    for k in range(max_display_k + 1):
        if p == 0.0:
            prob_k = 1.0 if k == 0 else 0.0
        elif p == 1.0:
            prob_k = 1.0 if k == n else 0.0
        else:
            prob_k = float(binom.pmf(k, n, p))
        
        running_cdf += prob_k
        tail_k = 1.0 - (running_cdf - prob_k)
        pmf_points.append(PMFPoint(
            k=k,
            probability=round(prob_k, 6),
            cumulative_prob=round(min(1.0, running_cdf), 6),
            upper_tail_prob=round(max(0.0, tail_k), 6)
        ))

    # Formula substitution text
    comb_str = f"C({n}, {x})"
    try:
        comb_val = math.comb(n, x) if 0 <= x <= n else 0
        comb_str = str(comb_val)
    except Exception:
        pass

    substituted_formula = (
        f"P(X = {x}) = {comb_str} × ({p:.4f})^{x} × (1 - {p:.4f})^{{{n - x}}} = {prob_exact_x:.6f}"
    )

    # Plain English explanation
    pct_loss = p * 100.0
    if prob_exact_x > 0.0001:
        prob_pct = prob_exact_x * 100.0
        prob_desc = f"has approximately a {prob_pct:.2f}% chance of occurring"
    else:
        prob_desc = "is extremely rare (< 0.01% chance)"

    if mode == "measured":
        prefix = f"Based on the observed network loss rate of {pct_loss:.2f}%"
    else:
        prefix = f"Under the educational hypothetical loss rate of {pct_loss:.2f}%"

    explanation = (
        f"{prefix}, in an upcoming transmission batch of n = {n} packets, "
        f"we expect on average E[X] = {expected:.2f} dropped packets (standard deviation σ = {std_dev:.2f}). "
        f"Observing exactly x = {x} dropped packets {prob_desc}. "
        f"The cumulative probability of experiencing at most {x} packet losses is {prob_at_most_x * 100.0:.2f}%, "
        f"and the risk of severe loss exceeding the threshold of {threshold} packets is {prob_exceeding_threshold * 100.0:.2f}%."
    )

    return BinomialCalculationResponse(
        n=n,
        p=round(p, 6),
        x=x,
        threshold=threshold,
        mode=mode,
        prob_exact_x=round(prob_exact_x, 6),
        prob_at_most_x=round(prob_at_most_x, 6),
        prob_at_least_x=round(prob_at_least_x, 6),
        prob_zero_losses=round(prob_zero_losses, 6),
        prob_exceeding_threshold=round(prob_exceeding_threshold, 6),
        expected_losses=round(expected, 4),
        variance=round(variance, 4),
        std_dev=round(std_dev, 4),
        formula_latex="P(X=x) = \\binom{n}{x} p^x (1-p)^{n-x}",
        substituted_formula=substituted_formula,
        plain_english_explanation=explanation,
        pmf_distribution=pmf_points
    )

def calculate_wilson_score_interval(
    successes: int,
    total: int,
    confidence: float = 0.95
) -> ConfidenceIntervalInfo:
    """
    Computes Wilson Score Interval for a binomial proportion.
    Superior to the normal approximation (Wald interval), especially near 0 or 1.
    """
    if total <= 0:
        return ConfidenceIntervalInfo(
            confidence_level=confidence,
            p_hat=0.0,
            ci_lower=0.0,
            ci_upper=0.0,
            sample_size=0,
            interpretation="Sample size is zero; cannot compute confidence interval."
        )

    p_hat = successes / total
    z = norm.ppf(1.0 - (1.0 - confidence) / 2.0)
    z2 = z ** 2

    denominator = 1.0 + z2 / total
    center = (p_hat + z2 / (2.0 * total)) / denominator
    spread = (z / denominator) * math.sqrt((p_hat * (1.0 - p_hat) / total) + (z2 / (4.0 * total ** 2)))

    ci_lower = max(0.0, center - spread)
    ci_upper = min(1.0, center + spread)

    interpretation = (
        f"With {confidence * 100:.0f}% confidence, the true network packet loss probability "
        f"lies between {ci_lower * 100:.3f}% and {ci_upper * 100:.3f}% "
        f"(point estimate p̂ = {p_hat * 100:.3f}% over N = {total} attempts)."
    )

    return ConfidenceIntervalInfo(
        confidence_level=confidence,
        p_hat=round(p_hat, 6),
        ci_lower=round(ci_lower, 6),
        ci_upper=round(ci_upper, 6),
        sample_size=total,
        interpretation=interpretation
    )
